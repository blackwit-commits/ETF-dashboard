export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 헤더 설정 (모든 곳에서 접속 허용)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 배치 시세 (/quotes?symbols=^GSPC,^IXIC,KRW=X) — 전광판/글로벌 지수·환율 모달용
    if (path === "/quotes") {
      const raw = (url.searchParams.get("symbols") || "").trim();
      const syms = raw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 30);
      if (!syms.length) return new Response("[]", { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const wantExt = url.searchParams.get("ext") === "1";   // 프리/애프터장가 병합(분봉 기반) — 관심목록용
      const results = await Promise.all(syms.map(async (s) => {
        const q = await fetchQuoteSimple(s);
        let st = q ? q.marketState : null, exP = q ? q.extPrice : null, exC = q ? q.extChg : null;
        if (wantExt) {   // 정규장 등락·거래량은 fetchQuoteSimple(정확), 프리/애프터가만 분봉에서
          const lq = await fetchLiveQuote(s);
          if (lq) { st = lq.marketState; exP = lq.extPrice; exC = lq.extChg; }
        }
        return { symbol: s, price: (q && q.price != null) ? q.price : null, chg: (q && q.chg != null) ? q.chg : null,
                 state: st, extPrice: exP, extChg: exC, volume: q && q.volume != null ? q.volume : null };
      }));
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" }
      });
    }

    // 섹터 로테이션 (/sectors?symbols=XLK,XLF,...) — 1일/1주/1개월 등락률
    if (path === "/sectors") {
      const raw = (url.searchParams.get("symbols") || "").trim();
      const syms = raw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 30);
      if (!syms.length) return new Response("[]", { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const results = await Promise.all(syms.map(async (s) => {
        const q = await fetchSectorChanges(s);
        return { symbol: s, price: q ? q.price : null, chg1d: q ? q.chg1d : null, chg1w: q ? q.chg1w : null, chg1m: q ? q.chg1m : null,
                 rsi: q ? q.rsi : null, ema8: q ? q.ema8 : null, ma50: q ? q.ma50 : null, volume: q ? q.volume : null };
      }));
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=120" }
      });
    }

    // 보유 목표가 저장 (/positions, POST) — 텔레그램 목표 도달 알림용
    if (path === "/positions") {
      if (request.method === "POST") {
        try {
          const body = await request.json();
          if (env.UMT_KV) await env.UMT_KV.put("positions", JSON.stringify(body || {}));
          return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
      const cur = env.UMT_KV ? await env.UMT_KV.get("positions", "json") : null;
      return new Response(JSON.stringify(cur || { positions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. 주가 데이터 요청 (/price?ticker=TQQQ)
    if (path === "/price") {
      const ticker = url.searchParams.get("ticker");
      if (!ticker) return new Response("Ticker required", { status: 400, headers: corsHeaders });

      try {
        // 야후 파이낸스 차트 API 호출 (300일치, 일봉)
        const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=300d&includePrePost=true`;
        const resp = await fetch(yahooUrl, {
            headers: { "User-Agent": "Mozilla/5.0" } // 차단 방지용 UA
        });
        const data = await resp.json();

        if (!data.chart || !data.chart.result) {
            throw new Error("No Data");
        }

        const quote = data.chart.result[0];
        const indicators = quote.indicators.quote[0];
        const closes = indicators.close; // 종가 배열
        const highs = indicators.high;   // 고가 배열 (ATR용 추가)
        const lows = indicators.low;     // 저가 배열 (ATR용 추가)
        const currentPrice = quote.meta.regularMarketPrice; // 현재가
        const prevClose = quote.meta.chartPreviousClose; // 전일 종가

        // 유효한 데이터만 필터링 (null 제거 및 ATR 계산을 위해 high, low, close 모두 있는 데이터셋 생성)
        const validData = [];
        for (let i = 0; i < closes.length; i++) {
            if (closes[i] !== null && highs[i] !== null && lows[i] !== null) {
                validData.push({
                    high: highs[i],
                    low: lows[i],
                    close: closes[i]
                });
            }
        }

        // 기존 지표 함수들을 위해 종가만 있는 배열 따로 분리
        const validCloses = validData.map(d => d.close);

        // --- 지표 계산 로직 (Quant Logic) ---

        // 1. 등락률 — 종가 배열 기반(선물 연속계약의 chartPreviousClose 오류 방지), 부족 시 meta 폴백
        let basePrevClose = prevClose;
        if (validCloses.length >= 2) {
            const lastClose = validCloses[validCloses.length - 1];
            const prevArr = validCloses[validCloses.length - 2];
            // 현재가가 마지막 일봉 종가와 거의 같으면(장 마감) 그 일봉이 '오늘' → 전일은 직전 종가
            // 다르면(장중) 마지막 일봉이 '전일 완성봉' → 그 값을 전일 종가로 사용
            basePrevClose = (Math.abs(currentPrice - lastClose) / lastClose < 0.002) ? prevArr : lastClose;
        }
        const change = (basePrevClose ? ((currentPrice - basePrevClose) / basePrevClose) * 100 : 0);

        // 2. MA 200 (단순이동평균)
        const ma200 = calculateSMA(validCloses, 200);

        // 3. EMA 8 (지수이동평균)
        const ema8 = calculateEMA(validCloses, 8);

        // 4. RSI 14 (상대강도지수)
        const rsi = calculateRSI(validCloses, 14);

        // 5. ATR 14 (Average True Range) - 새로 추가됨!
        const atr = calculateATR(validData, 14);

        // 프리/애프터장 실시간가 (분봉 기반) — 별도 호출
        const lq = await fetchLiveQuote(ticker);

        const result = {
          symbol: ticker,
          price: currentPrice,
          change: change,
          ma200: ma200 || currentPrice, // 데이터 부족시 현재가
          ema8: ema8 || currentPrice,
          rsi: rsi || 50,
          atr: atr, // 계산된 ATR 값 응답에 포함
          marketState: lq ? lq.marketState : "REGULAR",
          extPrice: lq ? lq.extPrice : null,
          extChg: lq ? lq.extChg : null
        };

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 1-1b. 배당일 (/dividends?symbols=TQQQ,SCHD) — 과거 배당 이벤트로 다음 배당락일 추정
    if (path === "/dividends") {
      const symsParam = (url.searchParams.get("symbols") || "").trim();
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=43200" };
      if (!symsParam) return new Response("[]", { headers: jsonHeaders });
      const syms = symsParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 30);
      const nowSec = Math.floor(Date.now() / 1000);
      const toISO = (sec) => new Date(sec * 1000).toISOString().slice(0, 10);
      try {
        const results = await Promise.all(syms.map(async (sym) => {
          const empty = { symbol: sym, last: null, next: null, cadenceDays: 0, ttm: 0, yieldPct: 0 };
          try {
            const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${sym}?range=2y&interval=1d&events=div`, { headers: { "User-Agent": "Mozilla/5.0" } });
            const j = await r.json();
            const res = j.chart && j.chart.result && j.chart.result[0];
            if (!res) return empty;
            const price = (res.meta && res.meta.regularMarketPrice) || 0;
            const divObj = (res.events && res.events.dividends) || {};
            const divs = Object.keys(divObj)
              .map(k => ({ date: divObj[k].date, amount: divObj[k].amount }))
              .filter(d => d.date && d.amount)
              .sort((a, b) => a.date - b.date);
            if (!divs.length) return empty;
            const last = divs[divs.length - 1];
            // 최근 간격들의 중앙값으로 배당 주기 추정 (월/분기/연)
            const gaps = [];
            for (let i = Math.max(1, divs.length - 4); i < divs.length; i++) gaps.push(divs[i].date - divs[i - 1].date);
            let cadenceSec = 0;
            if (gaps.length) { gaps.sort((a, b) => a - b); cadenceSec = gaps[Math.floor(gaps.length / 2)]; }
            // 다음 배당락일 = 마지막 배당일 + 주기 (미래가 될 때까지 누적)
            let nextSec = 0;
            if (cadenceSec) { nextSec = last.date; while (nextSec <= nowSec) nextSec += cadenceSec; }
            // 최근 12개월 배당 합계 → 배당수익률 추정
            const ttm = divs.filter(d => d.date >= nowSec - 365 * 86400).reduce((s, d) => s + d.amount, 0);
            return {
              symbol: sym,
              last: { date: toISO(last.date), amount: Math.round(last.amount * 10000) / 10000 },
              next: nextSec ? toISO(nextSec) : null,
              cadenceDays: cadenceSec ? Math.round(cadenceSec / 86400) : 0,
              ttm: Math.round(ttm * 10000) / 10000,
              yieldPct: price > 0 ? Math.round((ttm / price) * 10000) / 100 : 0
            };
          } catch (e) { return empty; }
        }));
        return new Response(JSON.stringify(results), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 1-2. 종목 자동완성 검색 (/search?q=apple) - 야후 파이낸스 검색 프록시
    if (path === "/search") {
      const q = (url.searchParams.get("q") || "").trim();
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      if (!q) return new Response("[]", { headers: jsonHeaders });

      try {
        const isHangul = /[가-힣]/.test(q);
        let list = [];

        // ① 한글이면 먼저 Daum으로 한국 종목명→KRX코드 검색 후 Yahoo로 .KS/.KQ 접미사 확정 (전 종목 커버)
        if (isHangul) {
          try { list = await koreanStockSearch(q); } catch (e) { list = []; }
        }

        // ② 영문/심볼 또는 한글 결과 없음 → Yahoo 검색 (퍼지 ON + 결과수↑로 신규상장·오타 대응)
        if (!list.length) {
          let term = q;
          if (isHangul) { try { term = await koreanToSearchTerm(q); } catch (e) { /* 변환 실패는 원문 사용 */ } }
          const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=15&newsCount=0&listsCount=0&enableFuzzyQuery=true`;
          const resp = await fetch(yahooUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
          const data = await resp.json();
          list = (data.quotes || [])
            .filter(x => x.symbol && (x.quoteType === "EQUITY" || x.quoteType === "ETF"))
            .map(x => ({
              symbol: x.symbol,
              name: x.shortname || x.longname || "",
              type: x.quoteType,
              exchange: x.exchDisp || x.exchange || ""
            }));
        }

        return new Response(JSON.stringify(list), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: jsonHeaders });
      }
    }

    // 2. 뉴스 데이터 요청 (/news) - 구글 뉴스 RSS 파싱
    if (path === "/news") {
        try {
            // Bing News RSS — 시장 속보 중심 (매일 갱신되는 증시/지수/연준 뉴스)
            const rssUrl = "https://www.bing.com/news/search?q=stock+market+today+stocks+dow+nasdaq+fed&format=rss";
            const resp = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (!resp.ok) {
                return new Response(JSON.stringify({error: "RSS fetch failed: " + resp.status}), { headers: {...corsHeaders, "Content-Type": "application/json"} });
            }
            const text = await resp.text();

            // XML 파싱: <item> 블록을 분리한 뒤 개별 필드 추출 (Bing은 '관련도순'이라 전부 모아 최신순 재정렬)
            const parsed = [];
            const itemBlocks = text.split('<item>').slice(1);
            for (let block of itemBlocks) {
                const endIdx = block.indexOf('</item>');
                if (endIdx > 0) block = block.substring(0, endIdx);
                const titleMatch = block.match(/<title>(.*?)<\/title>/);
                const linkMatch = block.match(/<link>(.*?)<\/link>/);
                const dateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);
                if (titleMatch && linkMatch) {
                    const ts = dateMatch ? Date.parse(dateMatch[1]) : 0;
                    parsed.push({
                        title: titleMatch[1].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
                        url: linkMatch[1],
                        ts: isNaN(ts) ? 0 : ts
                    });
                }
            }
            // 최신순 정렬 후 상위 10개
            parsed.sort((a, b) => b.ts - a.ts);
            const items = parsed.slice(0, 10).map(x => ({
                title: x.title,
                url: x.url,
                date: x.ts ? new Date(x.ts).toLocaleDateString("en-US") : "",
                ts: x.ts
            }));

            return new Response(JSON.stringify(items), {
                 headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" }
            });
        } catch(e) {
            return new Response(JSON.stringify({error: e.message, items: []}), { headers: {...corsHeaders, "Content-Type": "application/json"} });
        }
    }

    // 3. 구글 시트 프록시 (/sync) - POST 302 리다이렉트 body 유실 문제 해결
    if (path === "/sync") {
      const sheetUrl = url.searchParams.get("url");
      if (!sheetUrl) return new Response(JSON.stringify({error:"url parameter required"}), { status:400, headers:{...corsHeaders,"Content-Type":"application/json"} });

      try {
        if (request.method === "POST") {
          // POST: 클라이언트 → Worker → Google Apps Script (Worker는 302를 자동 추적)
          const body = await request.text();
          const fullUrl = sheetUrl + (sheetUrl.indexOf('?') >= 0 ? '&' : '?') + 'full=1';
          const res = await fetch(fullUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
            redirect: "follow",
          });
          const text = await res.text();
          return new Response(text, { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } else {
          // GET: 불러오기
          const fullUrl = sheetUrl + (sheetUrl.indexOf('?') >= 0 ? '&' : '?') + 'full=1';
          const res = await fetch(fullUrl, { redirect: "follow" });
          const text = await res.text();
          return new Response(text, { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch(e) {
        return new Response(JSON.stringify({error: e.message}), { status:500, headers:{...corsHeaders,"Content-Type":"application/json"} });
      }
    }

    // 4. 매크로 분석 요청 (/macro) - Gemini Flash 2.5 + Google Search Grounding
    if (path === "/macro") {
      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const force = url.searchParams.get("force") === "1";
      try {
        // KV 캐시 우선 (크론이 평일 1회 미리 계산해 저장 → 즉시 응답, Gemini 호출 없음)
        if (!force && env.UMT_KV) {
          const cached = await env.UMT_KV.get(MACRO_KV_KEY, "json");
          if (cached && cached._cachedAt && (Date.now() - cached._cachedAt) < MACRO_KV_TTL_MS) {
            return new Response(JSON.stringify(cached), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        // 캐시 없음/만료/강제새로고침 → 새로 분석하고 KV 저장
        const macroResult = await refreshMacroToKV(env, force ? "force" : "ondemand");
        return new Response(JSON.stringify(macroResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
        // 분석 실패 시 만료된 KV라도 폴백 반환
        if (env.UMT_KV) {
          try {
            const stale = await env.UMT_KV.get(MACRO_KV_KEY, "json");
            if (stale && stale.quad) {
              return new Response(JSON.stringify(stale), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
            }
          } catch (_) { /* 무시 */ }
        }
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 5. 주간 리포트 (/weekly) - Gemini Flash 2.5
    if (path === "/weekly") {
      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      try {
        const weeklyResult = await callGeminiWeeklyReport(env.GEMINI_API_KEY);
        return new Response(JSON.stringify(weeklyResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 6. 실시간 핫이슈 브리핑 (/hot) - Gemini Flash 2.5 + Google Search Grounding
    if (path === "/hot") {
      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const hotForce = url.searchParams.get("force") === "1";
      try {
        // KV 캐시 우선 — 있으면 즉시 반환, 만료됐으면 백그라운드 갱신(stale-while-revalidate)
        if (!hotForce && env.UMT_KV) {
          const cached = await env.UMT_KV.get(HOT_KV_KEY, "json");
          if (cached && cached._cachedAt) {
            if (Date.now() - cached._cachedAt > HOT_KV_TTL_MS) {
              ctx.waitUntil(refreshHotToKV(env, "swr").catch(() => {}));
            }
            return new Response(JSON.stringify(cached), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        // 캐시 없음(콜드스타트) → 동기 생성 1회 후 KV 저장
        const hotResult = await refreshHotToKV(env, "ondemand");
        return new Response(JSON.stringify(hotResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
        // 실패 시 만료된 KV라도 폴백 반환
        if (env.UMT_KV) {
          try {
            const stale = await env.UMT_KV.get(HOT_KV_KEY, "json");
            if (stale) return new Response(JSON.stringify(stale), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          } catch (_) { /* 무시 */ }
        }
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 7. 종목·시장 뉴스 (/stocknews?symbols=AAPL,NVDA) - Finnhub
    if (path === "/stocknews") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      if (!env.FINNHUB_API_KEY) {
        return new Response(JSON.stringify({ error: "FINNHUB_API_KEY not configured" }), { status: 500, headers: jsonHeaders });
      }
      try {
        const key = env.FINNHUB_API_KEY.trim();
        const symbolsParam = (url.searchParams.get("symbols") || "").trim();
        // 미국 일반 종목/ETF 심볼만 (해외 거래소 .KS 등, ^VIX 지수 제외)
        const symbols = symbolsParam ? symbolsParam.split(",")
          .map(s => s.trim().toUpperCase())
          .filter(s => s && /^[A-Z][A-Z0-9.\-]{0,9}$/.test(s) && !s.includes("^"))
          .slice(0, 10) : [];

        // 최신순 정렬 후 N개 (datetime 내림차순)
        const sortTrim = (arr, n) => (Array.isArray(arr) ? arr.slice().sort((a, b) => (b.datetime || 0) - (a.datetime || 0)).slice(0, n) : []);
        const mapNews = x => ({
          headline: x.headline || "",
          source: x.source || "",
          url: x.url || "",
          datetime: x.datetime || 0,
          summary: (x.summary || "").substring(0, 200)
        });

        // 시장 일반 뉴스 — 매크로/시장 이동 키워드로 중요도 필터 (관련 없는 잡뉴스 제외)
        const marketResp = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
        const marketText = await marketResp.text();
        let marketRaw = [];
        try { marketRaw = JSON.parse(marketText); } catch (e) {}
        const marketArr = Array.isArray(marketRaw) ? marketRaw : [];
        // 시장 관련성 있고(키워드 1개+) 광고성·시리즈물 아닌 것만 → 최신순 정렬 (키워드는 모듈 공용 MACRO_KW/AD_KW/MOVER_KW)
        const marketFiltered = marketArr
          .filter((x) => macroNewsScore(x) > 0 && !AD_KW.test((x.headline || "") + " " + (x.summary || "")) && !MOVER_KW.test(x.headline || ""))
          .sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        let market = marketFiltered.slice(0, 8).map(mapNews);
        if (market.length < 4) market = sortTrim(marketArr, 8).map(mapNews);   // 걸러진 게 너무 적으면 최신순 폴백

        // ETF는 종목 뉴스가 거의 없음 → 대표 기초종목(뉴스 활발한 리더)로 매핑해 신선한 뉴스 제공
        const ETF_NEWS_PROXY = {
          TQQQ: { label: "나스닥100/기술", tickers: ["NVDA", "AAPL", "MSFT"] },
          SQQQ: { label: "나스닥100/기술", tickers: ["NVDA", "AAPL", "MSFT"] },
          SPXL: { label: "S&P500 대형주", tickers: ["NVDA", "AAPL", "MSFT"] },
          UDOW: { label: "다우", tickers: ["MSFT", "JPM", "CAT"] },
          SOXL: { label: "반도체", tickers: ["NVDA", "AMD", "TSM"] },
          FAS:  { label: "금융", tickers: ["JPM", "BAC", "GS"] },
          NRGU: { label: "에너지", tickers: ["XOM", "CVX", "COP"] },
          GUSH: { label: "오일·가스", tickers: ["XOM", "CVX", "COP"] },
          NUGT: { label: "금광", tickers: ["NEM", "GOLD", "AEM"] },
          GDXU: { label: "금광", tickers: ["NEM", "GOLD", "AEM"] },
          GLD:  { label: "금", tickers: ["NEM", "GOLD"] },
          UGL:  { label: "금", tickers: ["NEM", "GOLD"] },
          DRN:  { label: "부동산(리츠)", tickers: ["PLD", "AMT", "EQIX"] },
          CURE: { label: "헬스케어", tickers: ["LLY", "UNH", "JNJ"] },
          LABU: { label: "바이오", tickers: ["VRTX", "REGN", "AMGN"] },
          BITX: { label: "비트코인", tickers: ["COIN", "MSTR"] },
          TNA:  { label: "미 소형주(러셀2000)", tickers: [] },
          TMF:  { label: "미 장기국채/금리", tickers: [] },
          UUP:  { label: "미 달러(DXY)", tickers: [] },
          UVXY: { label: "변동성(VIX)", tickers: [] }
        };

        // 보유 종목별 뉴스 (최근 7일) — ETF면 대표 종목 뉴스 병합
        const now = new Date();
        const to = now.toISOString().slice(0, 10);
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const byTicker = {};
        const proxyLabel = {};
        const fetchCompanyNews = async (fs) => {
          try { const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(fs)}&from=${from}&to=${to}&token=${key}`); return r.ok ? await r.json() : []; }
          catch (e) { return []; }
        };
        await Promise.all(symbols.map(async (sym) => {
          const proxy = ETF_NEWS_PROXY[sym];
          const fetchSyms = (proxy && proxy.tickers.length) ? proxy.tickers : (proxy ? [] : [sym]);
          if (proxy && proxy.tickers.length) proxyLabel[sym] = proxy.label + " · " + proxy.tickers.join("·");
          else if (proxy) proxyLabel[sym] = proxy.label;
          if (!fetchSyms.length) return;   // 대응 종목 없는 ETF(달러/국채/VIX 등)는 시장뉴스로 대체
          try {
            const results = await Promise.all(fetchSyms.map(fetchCompanyNews));
            const merged = [], seen = {};
            results.forEach((arr) => (Array.isArray(arr) ? arr : []).forEach((x) => { const u = x.url || x.headline; if (u && !seen[u]) { seen[u] = 1; merged.push(x); } }));
            const news = sortTrim(merged, proxy ? 5 : 4).map(mapNews);
            if (news.length) byTicker[sym] = news;
          } catch (e) { /* 개별 실패 무시 */ }
        }));

        // 보유 종목 감성 점수 (Alpha Vantage NEWS_SENTIMENT — 한 번 호출로 전 종목 커버, 무료 25회/일 절약)
        let sentiment = {};
        if (env.ALPHAVANTAGE_API_KEY && symbols.length) {
          try {
            const avKey = env.ALPHAVANTAGE_API_KEY.trim();
            const avUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbols.join(","))}&apikey=${avKey}&limit=50&sort=LATEST`;
            const avResp = await fetch(avUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
            const avData = await avResp.json();
            const feed = Array.isArray(avData.feed) ? avData.feed : []; // 한도 초과 시 {Note:...} → feed 없음 → 감성 생략
            const agg = {}; // ticker -> { wsum, wrel, count }
            for (const article of feed) {
              const tsArr = Array.isArray(article.ticker_sentiment) ? article.ticker_sentiment : [];
              for (const ts of tsArr) {
                const t = ts.ticker;
                if (!symbols.includes(t)) continue;
                const rel = parseFloat(ts.relevance_score) || 0;
                const sc = parseFloat(ts.ticker_sentiment_score) || 0;
                if (!agg[t]) agg[t] = { wsum: 0, wrel: 0, count: 0 };
                agg[t].wsum += sc * rel; agg[t].wrel += rel; agg[t].count += 1;
              }
            }
            const labelOf = (s) => s <= -0.35 ? "Bearish" : (s < -0.15 ? "Somewhat-Bearish" : (s < 0.15 ? "Neutral" : (s < 0.35 ? "Somewhat-Bullish" : "Bullish")));
            for (const t of Object.keys(agg)) {
              if (agg[t].wrel > 0) {
                const score = agg[t].wsum / agg[t].wrel;
                sentiment[t] = { score: Math.round(score * 1000) / 1000, label: labelOf(score), count: agg[t].count };
              }
            }
          } catch (e) { /* 감성 실패는 무시 — 뉴스만 반환 */ }
        }

        return new Response(JSON.stringify({ market, byTicker, sentiment, proxyLabel, timestamp: new Date().toISOString() }), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
      }
    }

    // 8. 텔레그램 푸시 테스트 (/notify-test) - 봇 설정 확인용 수동 트리거
    if (path === "/notify-test") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured" }), { status: 500, headers: jsonHeaders });
      }
      try {
        // 가벼운 알림 형식 테스트 (?type=alert) — Gemini 호출 없이 즉시 발송
        if (url.searchParams.get("type") === "alert") {
          const tg = await sendTelegram(env, "📢 <b>매매 알림 테스트</b>\n\n🔵 <b>TQQQ</b> 2차 매수가 도달! (예시)\n계획가 $78.40 · 현재 $78.10\n→ 2차 분할매수 검토\n\n🎯 <b>SOXL</b> 1차 목표가 도달! (예시)\n목표 $242.50 (순익 +6.2%) · 현재 $243.10\n→ 매도 비중 50% 검토\n\n⚠️ <b>UGL</b> MA200 이탈! (예시)\n→ 부분 매도 검토\n\n<i>알림 연결 테스트입니다. 실제 도달 시 이렇게 전송됩니다.</i>");
          return new Response(JSON.stringify({ ok: tg.ok, desc: tg.description || "" }), { headers: jsonHeaders });
        }
        const symbols = parseBriefSymbols(url.searchParams.get("symbols") || env.WATCH_TICKERS);
        const tg = await pushBriefing(env, symbols);
        return new Response(JSON.stringify({ ok: tg.ok, desc: tg.description || "" }), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
      }
    }

    // 11. 일봉 시계열 (/ohlc?ticker=AAPL&range=1y) - 차트용 종가 배열
    if (path === "/ohlc") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      const ticker = url.searchParams.get("ticker");
      const range = url.searchParams.get("range") || "1y";
      const ivReq = (url.searchParams.get("interval") || "1d").toLowerCase();
      const IV_OK = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "1wk", "1mo"];
      const interval = IV_OK.indexOf(ivReq) >= 0 ? ivReq : "1d";   // 분봉(일중)~월봉 허용
      if (!ticker) return new Response(JSON.stringify({ error: "ticker required" }), { status: 400, headers: jsonHeaders });
      try {
        const yurl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${encodeURIComponent(range)}`;
        const resp = await fetch(yurl, { headers: { "User-Agent": "Mozilla/5.0" } });
        const data = await resp.json();
        const r = data.chart && data.chart.result && data.chart.result[0];
        if (!r) throw new Error("No data");
        const ts = r.timestamp || [];
        const q0 = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
        const cl = q0.close || [], op = q0.open || [], hi = q0.high || [], lo = q0.low || [], vol = q0.volume || [];
        const out = [];
        for (let i = 0; i < ts.length; i++) {
          if (cl[i] == null) continue;
          const d = new Date(ts[i] * 1000);
          const time = d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
          // ts(유닉스초): 분봉/시간봉 차트용(같은 날 여러 봉 구분). time(날짜문자열): 일/주/월봉·스파크라인 호환
          out.push({ time, ts: ts[i], open: (op[i] != null ? op[i] : cl[i]), high: (hi[i] != null ? hi[i] : cl[i]), low: (lo[i] != null ? lo[i] : cl[i]), close: cl[i], volume: (vol[i] != null ? vol[i] : 0) });
        }
        return new Response(JSON.stringify({ ticker, interval, series: out }), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
      }
    }

    // 10. 경제 일정 (/calendar) - Gemini 그라운딩 + KV 12시간 캐시 (미국+한국 지표)
    if (path === "/calendar") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      try {
        // KV 캐시 우선 — 있으면 즉시 반환, 12h 초과 시 백그라운드 갱신(SWR)
        if (env.UMT_KV) {
          const cached = await env.UMT_KV.get("econ_calendar", "json");
          if (cached && cached.ts) {
            if (Date.now() - cached.ts > 12 * 3600 * 1000) {
              ctx.waitUntil(refreshCalendarToKV(env, "swr").catch(() => {}));
            }
            return new Response(JSON.stringify(cached), { headers: jsonHeaders });
          }
        }
        if (!env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500, headers: jsonHeaders });
        const result = await refreshCalendarToKV(env, "ondemand");
        return new Response(JSON.stringify(result), { headers: jsonHeaders });
      } catch (e) {
        // 실패 시 만료된 KV라도 폴백 반환
        if (env.UMT_KV) {
          try {
            const stale = await env.UMT_KV.get("econ_calendar", "json");
            if (stale) return new Response(JSON.stringify(stale), { headers: jsonHeaders });
          } catch (_) { /* 무시 */ }
        }
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
      }
    }

    // 10-b. 경제지표 발표 결과 (/results) - 발표된 실제치 (KV 읽기만, Gemini 호출 없음 → 빠름)
    if (path === "/results") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      let out = { results: [], ts: 0 };
      if (env.UMT_KV) {
        try { const r = await env.UMT_KV.get("econ_results", "json"); if (r) out = r; } catch (e) { /* 무시 */ }
      }
      return new Response(JSON.stringify(out), { headers: jsonHeaders });
    }

    // 13. 번역 프록시 (/translate?q=...&pair=en|ko) - mymemory + 이메일(한도상향)을 서버측에서 처리(이메일 비노출)
    if (path === "/translate") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      const q = url.searchParams.get("q") || "";
      const pair = url.searchParams.get("pair") || "en|ko";
      if (!q.trim()) return new Response(JSON.stringify({ responseStatus: 400 }), { headers: jsonHeaders });
      const parts = pair.split("|");
      const sl = (parts[0] || "en").toUpperCase();
      const tl = (parts[1] || "ko").toUpperCase();
      // 1순위: DeepL (키 있으면) — IP 제한 없음, 키는 secret으로 비노출
      if (env.DEEPL_API_KEY) {
        try {
          const dr = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: { "Authorization": "DeepL-Auth-Key " + env.DEEPL_API_KEY.trim(), "Content-Type": "application/x-www-form-urlencoded" },
            body: "text=" + encodeURIComponent(q) + "&source_lang=" + sl + "&target_lang=" + tl
          });
          if (dr.ok) {
            const dj = await dr.json();
            const t = dj.translations && dj.translations[0] && dj.translations[0].text;
            if (t) return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: t } }), { headers: jsonHeaders });
          }
        } catch (e) { /* DeepL 실패 시 mymemory 폴백 */ }
      }
      // 2순위: mymemory (이메일 한도상향)
      try {
        const email = (env.MYMEMORY_EMAIL || "").trim();
        const murl = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) + "&langpair=" + encodeURIComponent(pair) + (email ? "&de=" + encodeURIComponent(email) : "");
        const r = await fetch(murl, { headers: { "User-Agent": "Mozilla/5.0" } });
        const j = await r.json();
        return new Response(JSON.stringify(j), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ responseStatus: 500, error: e.message }), { headers: jsonHeaders });
      }
    }

    // 12. 글로벌 뉴스 (/usnews?cat=markets) - 다중 소스 병합 (CNBC 단독은 '가장 큰 움직임' 시리즈 편중)
    if (path === "/usnews") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      const catMap = { economy: "20910258", markets: "20409666", technology: "19854910", finance: "10000664", politics: "10000113", investing: "15839069" };
      const catKey = (url.searchParams.get("cat") || "markets");
      const id = catMap[catKey] || catMap.markets;
      try {
        // markets(기본 탭)는 CNBC Top News + MarketWatch + Investing.com 병합, 나머지 카테고리는 CNBC 해당 피드
        const feeds = catKey === "markets" ? [
          [CNBC_RSS("100003114"), "CNBC"],                                            // Top News (편집 큐레이션)
          [CNBC_RSS(id), "CNBC"],                                                     // Markets
          ["https://feeds.content.dowjones.io/public/rss/mw_topstories", "MarketWatch"],
          ["https://www.investing.com/rss/news_14.rss", "Investing.com"],             // 경제
          ["https://www.investing.com/rss/news_25.rss", "Investing.com"],             // 증시
        ] : [[CNBC_RSS(id), "CNBC"]];
        let items = await fetchMergedFeeds(feeds, 40);
        if (!items.length) return new Response(JSON.stringify({ error: "RSS fetch failed" }), { headers: jsonHeaders });
        // 병합 탭은 매크로 관련성 필터 — 개별 종목 잡뉴스 제거 (걸러진 게 너무 적으면 최신순 폴백)
        if (catKey === "markets") {
          const scored = items.filter((x) => macroNewsScore(x) > 0);
          if (scored.length >= 8) items = scored;
        }
        items = items.slice(0, 20);
        return new Response(JSON.stringify({ items, cat: catKey, timestamp: new Date().toISOString() }), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: jsonHeaders });
      }
    }

    // 9. 한국 뉴스 (/krnews?cat=economy) - 한국경제 RSS (economy는 연합뉴스 경제 병합)
    if (path === "/krnews") {
      const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
      const catMap = { economy: "economy", politics: "politics", society: "society", international: "international", finance: "finance", it: "it" };
      const cat = catMap[(url.searchParams.get("cat") || "economy")] || "economy";
      try {
        const feeds = [[`https://www.hankyung.com/feed/${cat}`, "한국경제"]];
        if (cat === "economy") feeds.push(["https://www.yna.co.kr/rss/economy.xml", "연합뉴스"]);
        const items = await fetchMergedFeeds(feeds, 20);
        if (!items.length) return new Response(JSON.stringify({ error: "RSS fetch failed" }), { headers: jsonHeaders });
        return new Response(JSON.stringify({ items, cat, timestamp: new Date().toISOString() }), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: jsonHeaders });
      }
    }

    return new Response("UMT API Worker is Running", { headers: corsHeaders });
  },

  // Cron 트리거: 마켓 브리핑을 텔레그램으로 푸시 (wrangler.toml [triggers] crons)
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    // Quad 판정 3층 케이던스 (미장 마감 후 21:30 UTC = 06:30 KST):
    //  · 월요일 → 풀 Gemini 판정 + 히스테리시스 (주 1회 공식 판정)
    //  · 그 외 평일 → 나우캐스트만 갱신 (Gemini 미호출, 무료 시장 프록시 조기신호)
    if (cron === "30 21 * * 1-5") {
      const utcDay = new Date().getUTCDay(); // 0=일 … 1=월
      if (utcDay === 1 && env.GEMINI_API_KEY) {
        ctx.waitUntil((async () => {
          try { await refreshMacroToKV(env, "scheduled-weekly"); } catch (e) { /* 다음 트리거에 재시도 */ }
        })());
      } else {
        ctx.waitUntil((async () => {
          try { await refreshMacroNowcastOnly(env); } catch (e) { /* 무시 */ }
        })());
      }
    }
    // 실시간 핫이슈 + 경제 일정: 개장 전(13:00) / 마감 후(21:00) 미리 계산해 KV에 저장 → 즉시 응답
    if ((cron === "30 6 * * 1-5" || cron === "30 21 * * 1-5") && env.GEMINI_API_KEY) {
      ctx.waitUntil((async () => {
        try { await refreshHotToKV(env, "scheduled"); } catch (e) { /* 다음 트리거에 재시도 */ }
      })());
      ctx.waitUntil((async () => {
        try { await refreshCalendarToKV(env, "scheduled"); } catch (e) { /* 다음 트리거에 재시도 */ }
      })());
    }
    // 텔레그램 정기 브리핑 (개장 전 13:00 / 마감 후 21:00 UTC 에만)
    if ((cron === "30 6 * * 1-5" || cron === "30 21 * * 1-5") && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      ctx.waitUntil((async () => {
        try {
          const symbols = parseBriefSymbols(env.WATCH_TICKERS);
          await pushBriefing(env, symbols);
        } catch (e) { /* 실패는 조용히 무시 — 다음 트리거에 재시도 */ }
      })());
    }
    // 목표가/매수가 도달 / MA200 이탈 체크 (20분마다, 프리장~애프터장 포함 08~23 UTC)
    if (cron === "*/20 8-23 * * 1-5") {
      ctx.waitUntil((async () => {
        try { await checkTargetsAndAlert(env); } catch (e) { /* 무시 */ }
      })());
      // 경제지표 발표 결과 감지 + 알림 (발표 후보 있을 때만 Gemini 호출)
      ctx.waitUntil((async () => {
        try { await checkEconResultsAndAlert(env); } catch (e) { /* 무시 */ }
      })());
    }
  },
};

// --- 뉴스 소스 공통 (다중 RSS 병합·중요도 필터) ---

// 시장 영향 키워드 — 매크로 중요도 스코어 (/stocknews, /usnews 공용)
const MACRO_KW = [/\bfed\b|fomc|powell|federal reserve/i, /\brate|interest rate|rate cut|rate hike/i, /inflation|cpi|\bpce\b|ppi/i, /jobs?|payroll|unemployment|labor market/i, /tariff|trade war|trump|white house/i, /\bwar\b|conflict|missile|attack|sanction|geopolit/i, /oil|crude|opec|energy price/i, /\bgdp\b|recession|economy|economic/i, /treasury|yield|bond market|10-year/i, /dollar|forex|currency/i, /china|beijing|xi jinping/i, /nvidia|apple|microsoft|amazon|tesla|\bmeta\b|alphabet|google|broadcom/i, /earnings|guidance|forecast/i, /nasdaq|s&p 500|s&p500|dow jones|wall street|stocks?|market/i, /rally|sell-?off|plunge|surge|slump|tumble|soar|rout/i, /gold|silver|commodit/i, /semiconductor|\bchip|ai\b|artificial intelligence/i, /bitcoin|crypto|ethereum/i];
// 광고·홍보·리스티클성 기사 제외
const AD_KW = /motley fool|should you buy|reasons? to buy|worth buying|passive income|millionaire|retire|best stocks?|stocks? to buy|dividend stock|prediction|here'?s why|could make you|smart money|zacks|top \d+|\d+ (stocks?|reasons?|things|ways)|jim cramer|cramer'?s|buy the dip|is it too late/i;
// '가장 큰 움직임' 류 반복 시리즈물 제외 (CNBC markets 피드의 절반가량 차지)
const MOVER_KW = /biggest moves|market movers|movers?:|premarket movers|midday movers|after-?hours movers|stocks making|what to watch|before the bell|opening bell|closing bell|hot stocks/i;
// 매크로 키워드 매칭 개수 (0이면 시장 무관 잡뉴스)
function macroNewsScore(x) { const t = ((x.headline || "") + " " + (x.summary || "")); let s = 0; for (const re of MACRO_KW) { if (re.test(t)) s++; } return s; }

// 범용 RSS 파서 — {headline, url, summary, datetime(초), source} 배열 반환 (실패 시 빈 배열)
async function fetchRssFeed(feedUrl, source, max = 20) {
  try {
    const resp = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return [];
    const text = await resp.text();
    const strip = (s) => (s || "").replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#0?34;/g, '"').replace(/&nbsp;/g, " ").trim();
    const items = [];
    const blocks = text.split("<item>").slice(1);
    for (let block of blocks) {
      if (items.length >= max) break;
      const end = block.indexOf("</item>");
      if (end > 0) block = block.substring(0, end);
      const tm = block.match(/<title>([\s\S]*?)<\/title>/);
      const lm = block.match(/<link>([\s\S]*?)<\/link>/);
      const dm = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sm = block.match(/<description>([\s\S]*?)<\/description>/);
      if (tm && lm) {
        let dt = 0;
        if (dm) { const p = Date.parse(strip(dm[1])); if (!isNaN(p)) dt = Math.floor(p / 1000); }
        items.push({ headline: strip(tm[1]), url: strip(lm[1]), summary: sm ? strip(sm[1]).substring(0, 200) : "", datetime: dt, source });
      }
    }
    return items;
  } catch (e) { return []; }
}

// 여러 피드 병합: 제목 중복 제거 + 시리즈물/광고 제외 + 최신순
async function fetchMergedFeeds(feeds, max = 20) {
  const results = await Promise.all(feeds.map(([u, s]) => fetchRssFeed(u, s, 15)));
  const seen = new Set(); const merged = [];
  for (const arr of results) {
    for (const x of arr) {
      if (!x.headline) continue;
      if (MOVER_KW.test(x.headline) || AD_KW.test(x.headline + " " + (x.summary || ""))) continue;
      const k = x.headline.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim().substring(0, 60);
      if (!k || seen.has(k)) continue;
      seen.add(k); merged.push(x);
    }
  }
  merged.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
  return merged.slice(0, max);
}

// 브리핑 세션별 헤드라인 소스 (KR=한국 마감 15:30 / US=미국 마감 06:30)
const CNBC_RSS = (id) => `https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=${id}`;
const BRIEF_FEEDS = {
  US: [
    [CNBC_RSS("100003114"), "CNBC"],                                            // Top News (편집 큐레이션)
    [CNBC_RSS("20409666"), "CNBC"],                                             // Markets
    ["https://feeds.content.dowjones.io/public/rss/mw_topstories", "MarketWatch"],
    ["https://www.investing.com/rss/news_14.rss", "Investing.com"],             // 경제
  ],
  KR: [
    ["https://www.yna.co.kr/rss/economy.xml", "연합뉴스"],
    ["https://www.hankyung.com/feed/economy", "한국경제"],
    ["https://www.hankyung.com/feed/finance", "한국경제"],
  ],
};

// --- 텔레그램 푸시 ---

// 브리핑용 심볼 파싱 (미국 종목/ETF, 지수 제외, 최대 10개)
function parseBriefSymbols(raw) {
  return (raw || "").split(",").map(s => s.trim().toUpperCase())
    .filter(s => s && /^[A-Z][A-Z0-9.\-]{0,9}$/.test(s) && !s.includes("^")).slice(0, 10);
}

// 현재 시각을 KST 문자열로 (Workers는 UTC 기준)
function kstStamp() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${days[d.getUTCDay()]}) ${hh}:${mm} KST`;
}
function unixToKstDate(sec) {
  if (!sec) return "";
  const d = new Date(sec * 1000 + 9 * 3600 * 1000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
function fmtChg(c) {
  if (c == null) return "";
  return (c >= 0 ? "+" : "") + c.toFixed(2) + "%";
}

// 한국 종목 한글명 검색 — Daum(한글명→KRX코드) + Yahoo(코드→.KS/.KQ) 조합
async function koreanStockSearch(q) {
  const r = await fetch(`https://finance.daum.net/api/search/quotes?q=${encodeURIComponent(q)}&limit=10`, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://finance.daum.net/", "Accept": "application/json" }
  });
  if (!r.ok) return [];
  const d = await r.json();
  const stocks = (d.quotes || []).filter(x => x && x.isStock && !x.isDelisted && x.symbolCode).slice(0, 8);
  if (!stocks.length) return [];
  const out = await Promise.all(stocks.map(async (s) => {
    const code = String(s.symbolCode).replace(/^A/, "");
    const sym = await yahooResolveKr(code);
    if (!sym) return null;
    return { symbol: sym, name: s.name || code, type: "EQUITY", exchange: sym.endsWith(".KS") ? "KOSPI" : "KOSDAQ" };
  }));
  return out.filter(Boolean);
}
// KRX 6자리 코드 → Yahoo 심볼(.KS/.KQ) 확정
async function yahooResolveKr(code) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${code}&quotesCount=6&newsCount=0`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const hit = (d.quotes || []).find(x => x.symbol && (x.symbol === code + ".KS" || x.symbol === code + ".KQ"));
    return hit ? hit.symbol : null;
  } catch (e) { return null; }
}

// 직전 종가 선택 — 지수(^KS11 등) 일봉 배열이 하루 지연될 때 대응
// regularMarketPrice(최신)가 배열 마지막 종가와 유의미하게 다르면 = 최신 봉이 배열에 아직 없음 → 직전=배열 마지막
function _pickPrevClose(closes, price) {
  const lastArr = closes.length ? closes[closes.length - 1] : null;
  if (lastArr != null && price != null && Math.abs(price - lastArr) > lastArr * 0.0005) return lastArr;
  return closes.length >= 2 ? closes[closes.length - 2] : null;
}

async function fetchQuoteBrief(symbol) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=7d`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const res = d.chart.result[0];
    const meta = res.meta;
    // chartPreviousClose가 엉터리 값일 때가 있어 종가 배열 기준으로 등락 계산 (전광판과 동일 방식)
    const closes = ((res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close) || []).filter(v => v != null);
    const price = meta.regularMarketPrice != null ? meta.regularMarketPrice : (closes.length ? closes[closes.length - 1] : null);
    let prev = _pickPrevClose(closes, price);
    if (prev == null) prev = meta.previousClose != null ? meta.previousClose : meta.chartPreviousClose;
    const chg = (prev && price) ? ((price - prev) / prev) * 100 : 0;
    return { price, chg };
  } catch (e) { return null; }
}

// 전광판/지수 모달용 시세 — 종가 배열 기반 등락률(선물 연속계약 chartPreviousClose 오류 방지)
async function fetchQuoteSimple(symbol) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=7d&includePrePost=true`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const res = d.chart.result[0];
    const meta = res.meta;
    const closes = ((res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close) || []).filter(v => v != null);
    const price = meta.regularMarketPrice != null ? meta.regularMarketPrice : (closes.length ? closes[closes.length - 1] : null);
    let prev = _pickPrevClose(closes, price);
    if (prev == null) prev = meta.previousClose != null ? meta.previousClose : meta.chartPreviousClose;
    const chg = (prev && price) ? ((price - prev) / prev) * 100 : 0;
    // 프리/애프터장 (정규장 종가 대비 등락)
    const state = meta.marketState || "REGULAR";
    let extPrice = null;
    if (state === "PRE" && meta.preMarketPrice != null) extPrice = meta.preMarketPrice;
    else if ((state === "POST" || state === "POSTPOST") && meta.postMarketPrice != null) extPrice = meta.postMarketPrice;
    const extChg = (extPrice != null && price) ? ((extPrice - price) / price) * 100 : null;
    const live = extPrice != null ? extPrice : price;   // 알림용 실시간가(프리/애프터 우선)
    const volume = meta.regularMarketVolume != null ? meta.regularMarketVolume : null;
    return { price, chg, marketState: state, extPrice, extChg, live, volume };
  } catch (e) { return null; }
}

// 프리/애프터장 실시간가 — 분봉(includePrePost) 마지막 캔들 + currentTradingPeriod로 세션 판정
async function fetchLiveQuote(symbol) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=true`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const res = d.chart.result[0];
    const meta = res.meta;
    const ts = res.timestamp || [];
    const cl = ((res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close) || []);
    let live = null, lastTs = null;
    for (let i = cl.length - 1; i >= 0; i--) { if (cl[i] != null) { live = cl[i]; lastTs = ts[i]; break; } }
    const reg = meta.regularMarketPrice != null ? meta.regularMarketPrice : live;          // 직전 정규장가
    const prevClose = meta.chartPreviousClose != null ? meta.chartPreviousClose : meta.previousClose;
    const ctp = meta.currentTradingPeriod || {};
    let state = "REGULAR";
    if (lastTs != null && ctp.regular) {
      if (lastTs < ctp.regular.start) state = "PRE";
      else if (lastTs >= ctp.regular.end) state = "POST";
    }
    const extPrice = (state === "PRE" || state === "POST") ? live : null;                  // 연장거래가
    const extChg = (extPrice != null && reg) ? ((extPrice - reg) / reg) * 100 : null;
    const chg = (prevClose && reg) ? ((reg - prevClose) / prevClose) * 100 : 0;
    return { price: reg, chg, marketState: state, extPrice, extChg, live: (live != null ? live : reg) };
  } catch (e) { return null; }
}

// 섹터 로테이션용 — 1일/1주(5거래일)/1개월(21거래일) 등락률 (종가배열 기반)
// 기술지표 헬퍼 (종가 배열 기반)
function _sma(cl, p) { if (cl.length < p) return null; let s = 0; for (let i = cl.length - p; i < cl.length; i++) s += cl[i]; return s / p; }
function _ema(cl, p) { if (cl.length < p) return null; const k = 2 / (p + 1); let e = cl[cl.length - p]; for (let i = cl.length - p + 1; i < cl.length; i++) e = cl[i] * k + e * (1 - k); return e; }
function _rsi(cl, p = 14) { if (cl.length < p + 1) return null; let g = 0, l = 0; for (let i = cl.length - p; i < cl.length; i++) { const df = cl[i] - cl[i - 1]; if (df >= 0) g += df; else l -= df; } const ag = g / p, al = l / p; if (al === 0) return 100; return 100 - 100 / (1 + ag / al); }

async function fetchSectorChanges(symbol) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const res = d.chart.result[0];
    const meta = res.meta;
    const q0 = (res.indicators && res.indicators.quote && res.indicators.quote[0]) || {};
    const closes = (q0.close || []).filter(v => v != null);
    const price = meta.regularMarketPrice != null ? meta.regularMarketPrice : (closes.length ? closes[closes.length - 1] : null);
    const pct = (nBack) => {
      const idx = closes.length - 1 - nBack;
      if (idx < 0 || price == null) return null;
      const base = closes[idx];
      return base ? ((price - base) / base) * 100 : null;
    };
    // 눌림목 스크린용 지표 (같은 3개월 데이터에서 계산)
    return {
      price, chg1d: pct(1), chg1w: pct(5), chg1m: pct(21),
      rsi: _rsi(closes, 14), ema8: _ema(closes, 8), ma50: _sma(closes, 50),
      volume: meta.regularMarketVolume != null ? meta.regularMarketVolume : null
    };
  } catch (e) { return null; }
}
async function fetchMarketSnapshot() {
  const [sp, ndx, dow, vix] = await Promise.all([fetchQuoteBrief("^GSPC"), fetchQuoteBrief("^IXIC"), fetchQuoteBrief("^DJI"), fetchQuoteBrief("^VIX")]);
  return { sp, ndx, dow, vix };
}

// ─────────────────────────────────────────────────────────────
// Quad 시장 나우캐스트 — Yahoo 라이브 프록시로 성장/인플레 2축을 실측 판정
// (Gemini 단일 판단을 교차검증 + 판정 근거 데이터 제공)
// ─────────────────────────────────────────────────────────────

// 3개월 일봉 종가 시리즈 (나우캐스트 20일 변화율 계산용)
async function fetchCloseSeries(symbol) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const res = d.chart.result[0];
    const meta = res.meta;
    const closes = ((res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close) || []).filter(v => v != null);
    const last = meta.regularMarketPrice != null ? meta.regularMarketPrice : (closes.length ? closes[closes.length - 1] : null);
    return { last, closes };
  } catch (e) { return null; }
}
// n거래일 전 대비 % 변화
function _pctBack(closes, nBack) {
  if (!closes || closes.length <= nBack) return null;
  const a = closes[closes.length - 1], b = closes[closes.length - 1 - nBack];
  return b ? ((a - b) / b) * 100 : null;
}

// 2축 프록시 정의 — 각 신호는 20일 변화율의 부호로 가속/감속 투표
const QUAD_NOWCAST_DEFS = {
  inflation: [
    { key: "wti", name: "유가(WTI)", sym: "CL=F", invert: false, fmt: "n", why: "원유는 운송·제조 원가에 직접 반영 — 유가↑는 헤드라인 인플레의 1차 동력." },
    { key: "copgold", name: "구리/금 비율", a: "HG=F", b: "GC=F", invert: false, fmt: "r", why: "구리=실물수요(인플레), 금=공포. 비율↑ = 실물 인플레 압력이 안전선호를 이김." },
    { key: "dxy", name: "달러(DXY)", sym: "DX-Y.NYB", invert: true, fmt: "n", why: "강달러는 수입물가를 눌러 인플레를 식힘 — 달러는 인플레에 역방향으로 작동." },
    { key: "breakeven", name: "기대인플레(TIP/IEF)", a: "TIP", b: "IEF", invert: false, fmt: "r", why: "물가연동채(TIP)가 명목채(IEF)보다 세면 시장이 미래 인플레를 크게 반영 중." },
  ],
  growth: [
    { key: "cycdef", name: "경기민감/방어(XLY/XLP)", a: "XLY", b: "XLP", invert: false, fmt: "r", why: "임의소비(XLY)가 필수소비(XLP)를 이기면 소비·경기 자신감↑." },
    { key: "credit", name: "신용스프레드(HYG/TLT)", a: "HYG", b: "TLT", invert: false, fmt: "r", why: "하이일드(HYG)가 국채(TLT)보다 세면 신용위험 감내↑ = 경기 낙관." },
    { key: "smallcap", name: "소형주(IWM/SPY)", a: "IWM", b: "SPY", invert: false, fmt: "r", why: "소형주는 내수·경기에 민감 — 대형주 대비 강세면 성장 기대↑." },
    { key: "us10y", name: "10년물 금리", sym: "^TNX", invert: false, fmt: "y", why: "장기금리는 성장·물가 기대를 반영 — 완만한 상승은 성장 가속 신호." },
  ],
};

function _fmtNowVal(v, fmt) {
  if (v == null) return "—";
  if (fmt === "y") return v.toFixed(2) + "%";               // ^TNX는 이미 %단위 (4.48)
  if (fmt === "r") { const dec = v < 0.01 ? 4 : (v < 1 ? 3 : 2); return v.toFixed(dec); }
  return v.toFixed(2);
}

async function computeQuadNowcast() {
  const defs = QUAD_NOWCAST_DEFS;
  const syms = new Set();
  for (const ax of ["growth", "inflation"]) for (const s of defs[ax]) { if (s.sym) syms.add(s.sym); if (s.a) syms.add(s.a); if (s.b) syms.add(s.b); }
  const series = {};
  await Promise.all([...syms].map(async (sym) => { series[sym] = await fetchCloseSeries(sym); }));
  const N = 20;
  const SPARK_N = 44;   // 미니 추이용 ~2개월 시리즈
  const _sparkRound = (v) => (v == null ? null : Number(v.toPrecision(5)));
  const buildSig = (s) => {
    let chg20 = null, value = null, spark = null;
    if (s.sym) {
      const ser = series[s.sym];
      if (ser) {
        chg20 = _pctBack(ser.closes, N); value = ser.last;
        if (ser.closes) spark = ser.closes.slice(-SPARK_N).map(_sparkRound);
      }
    } else {
      const A = series[s.a], B = series[s.b];
      if (A && B) {
        const pA = _pctBack(A.closes, N), pB = _pctBack(B.closes, N);
        chg20 = (pA != null && pB != null) ? (pA - pB) : null;
        value = (A.last && B.last) ? A.last / B.last : null;
        const a = A.closes || [], b = B.closes || [], n = Math.min(a.length, b.length, SPARK_N);
        if (n >= 2) { spark = []; for (let i = 0; i < n; i++) { const bv = b[b.length - n + i]; spark.push(bv ? _sparkRound(a[a.length - n + i] / bv) : null); } }
      }
    }
    const ok = chg20 != null;
    const accel = ok ? (s.invert ? chg20 < 0 : chg20 > 0) : null;
    return {
      key: s.key, name: s.name, why: s.why, invert: !!s.invert,
      value, valueStr: _fmtNowVal(value, s.fmt), chg20d: chg20 != null ? +chg20.toFixed(1) : null,
      dir: ok ? (chg20 > 0 ? "up" : "down") : null,
      vote: ok ? (accel ? "accel" : "decel") : null,
      spark,
    };
  };
  const axisVerdict = (sigs) => {
    const valid = sigs.filter(x => x.vote);
    let accel = 0, decel = 0, net = 0;
    for (const x of valid) { if (x.vote === "accel") accel++; else decel++; net += (x.invert ? -x.chg20d : x.chg20d); }
    const isAccel = accel !== decel ? accel > decel : net > 0;   // 동수면 순변화량으로 결정
    return { verdict: valid.length ? (isAccel ? "accelerating" : "decelerating") : null, accel, decel, net: +net.toFixed(1) };
  };
  const gSigs = defs.growth.map(buildSig), iSigs = defs.inflation.map(buildSig);
  const g = axisVerdict(gSigs), i = axisVerdict(iSigs);
  const quadMap = { "acc|dec": 1, "acc|acc": 2, "dec|acc": 3, "dec|dec": 4 };
  const gk = g.verdict === "accelerating" ? "acc" : "dec", ik = i.verdict === "accelerating" ? "acc" : "dec";
  const quad = (g.verdict && i.verdict) ? quadMap[gk + "|" + ik] : null;
  const quadNames = { 1: "골디락스", 2: "과열", 3: "스태그플레이션", 4: "침체" };
  // 내부 신뢰도: 두 축 투표가 얼마나 일방적인지 (4:0 → 높음, 2:2 → 낮음)
  const axisConf = (v) => { const t = v.accel + v.decel; return t ? Math.abs(v.accel - v.decel) / t : 0; };
  const confidence = Math.round(50 + 45 * ((axisConf(g) + axisConf(i)) / 2));
  // 전환 임박: 순변화량 절대값이 작은 축이 뒤집힐 확률↑
  const swing = Math.abs(g.net) <= Math.abs(i.net)
    ? { axis: "growth", net: g.net }
    : { axis: "inflation", net: i.net };
  return {
    quad, name: quad ? quadNames[quad] : null,
    growth: g.verdict, inflation: i.verdict,
    votes: { growth: { accel: g.accel, decel: g.decel }, inflation: { accel: i.accel, decel: i.decel } },
    scores: { growth: g.net, inflation: i.net },
    signals: { growth: gSigs, inflation: iSigs },
    swing, confidence, asOf: Date.now(),
  };
}

function sentLabel(s) {
  if (s == null) return "";
  if (s <= -0.35) return "🔵 약세";
  if (s < -0.15) return "🔵 약(弱)약세";
  if (s < 0.15) return "⚪ 중립";
  if (s < 0.35) return "🔴 약(弱)강세";
  return "🔴 강세";
}

// 보유 종목별 감성(AV 1회) + 최신 뉴스(Finnhub)
async function getHoldingsBrief(env, symbols) {
  if (!symbols.length) return [];
  let sentiment = {};
  if (env.ALPHAVANTAGE_API_KEY) {
    try {
      const avKey = env.ALPHAVANTAGE_API_KEY.trim();
      const r = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbols.join(","))}&apikey=${avKey}&limit=50&sort=LATEST`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const d = await r.json();
      const feed = Array.isArray(d.feed) ? d.feed : [];
      const agg = {};
      for (const a of feed) for (const ts of (a.ticker_sentiment || [])) {
        const t = ts.ticker; if (!symbols.includes(t)) continue;
        const rel = parseFloat(ts.relevance_score) || 0, sc = parseFloat(ts.ticker_sentiment_score) || 0;
        if (!agg[t]) agg[t] = { w: 0, r: 0 }; agg[t].w += sc * rel; agg[t].r += rel;
      }
      for (const t of Object.keys(agg)) if (agg[t].r > 0) sentiment[t] = agg[t].w / agg[t].r;
    } catch (e) { /* 감성 실패 무시 */ }
  }
  const out = [];
  const key = env.FINNHUB_API_KEY ? env.FINNHUB_API_KEY.trim() : "";
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);
  await Promise.all(symbols.map(async (sym) => {
    // 가격·등락률(Yahoo) + 최신 뉴스(Finnhub) 병렬
    const [quote, news] = await Promise.all([
      fetchQuoteBrief(sym),
      (async () => {
        if (!key) return null;
        try {
          const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(sym)}&from=${from}&to=${to}&token=${key}`);
          const raw = r.ok ? await r.json() : [];
          if (Array.isArray(raw) && raw.length) return { headline: raw[0].headline || "", source: raw[0].source || "", datetime: raw[0].datetime || 0 };
        } catch (e) { /* 무시 */ }
        return null;
      })()
    ]);
    out.push({ ticker: sym, score: sentiment[sym], quote, news });
  }));
  out.sort((a, b) => symbols.indexOf(a.ticker) - symbols.indexOf(b.ticker));
  return out;
}

// 텔레그램 마켓 브리핑 본문 생성 → { text, chartUrl, sectorChartUrl }
async function buildMarketBriefing(env, symbols) {
  const [snap, sectors, hot] = await Promise.all([
    fetchMarketSnapshot(),
    fetchSectorBreadth().catch(() => []),
    env.GEMINI_API_KEY ? callGeminiHotIssues(env.GEMINI_API_KEY, symbols).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })
  ]);
  const holdings = await getHoldingsBrief(env, symbols).catch(() => []);
  const analysis = (hot && hot.holdings_analysis && typeof hot.holdings_analysis === "object") ? hot.holdings_analysis : {};

  let t = `🔥 <b>UMT 마켓 브리핑</b>\n📅 ${tgEscape(kstStamp())}\n\n`;

  // Quad 전환 감지 (KV에 직전 국면 저장) — 변경 시 경고 배너
  const quadNames = { 1: "골디락스", 2: "과열", 3: "스태그플레이션", 4: "침체" };
  const q = hot.quad;
  if (q && q.current) {
    let transitionLine = "";
    if (env.UMT_KV) {
      try {
        const prev = await env.UMT_KV.get("last_quad");
        if (prev && String(prev) !== String(q.current)) {
          transitionLine = `⚠️ <b>Quad 전환: Q${prev}(${quadNames[prev] || ""}) → Q${q.current}(${quadNames[q.current] || ""})</b>\n`;
        }
        await env.UMT_KV.put("last_quad", String(q.current));
      } catch (e) { /* KV 실패 무시 */ }
    }
    if (transitionLine) t += transitionLine + "\n";
    t += `🧭 <b>현재 국면: Q${q.current} ${tgEscape(q.name || quadNames[q.current] || "")}</b>\n`;
    if (q.summary) t += `${tgEscape(q.summary)}\n`;
    t += "\n";
  }

  // 시장 스냅샷
  t += "📊 <b>시장 스냅샷</b>\n";
  const ln = (label, qd) => qd ? `${label} ${qd.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${fmtChg(qd.chg)})\n` : "";
  t += ln("S&amp;P500", snap.sp);
  t += ln("나스닥", snap.ndx);
  t += ln("다우", snap.dow);
  t += ln("VIX", snap.vix);
  t += "\n";

  // 섹터 등락 (전체 시장 폭 — 강세/약세 섹터)
  if (sectors.length) {
    const top = sectors.slice(0, 3).map(s => `${s.label} ${fmtChg(s.chg)}`).join(", ");
    const bot = sectors.slice(-3).reverse().map(s => `${s.label} ${fmtChg(s.chg)}`).join(", ");
    t += "🗺️ <b>섹터 등락</b>\n";
    t += `🔴 강세: ${tgEscape(top)}\n`;
    t += `🔵 약세: ${tgEscape(bot)}\n\n`;
  }

  // 시장 흐름 (오늘 전반의 내러티브)
  if (hot.overview) {
    t += "🌐 <b>시장 흐름</b>\n";
    t += `${tgEscape(hot.overview)}\n\n`;
  }

  // 핵심 일정 (향후 catalyst)
  const upcoming = Array.isArray(hot.upcoming) ? hot.upcoming.slice(0, 5) : [];
  if (upcoming.length) {
    t += "📅 <b>핵심 일정</b>\n";
    const impIcon = { high: "🔴", medium: "🟡", low: "⚪" };
    upcoming.forEach(ev => {
      t += `${impIcon[ev.importance] || "⚪"} ${tgEscape(ev.date || "")} ${tgEscape(ev.name || "")}\n`;
    });
    t += "\n";
  }

  // 보유 종목 (가격·등락률 + 감성 + 한국어 등락 이유)
  if (holdings.length) {
    t += "📌 <b>보유 종목</b>\n\n";
    holdings.forEach(h => {
      const chg = h.quote ? h.quote.chg : null;
      const dir = chg == null ? "▪️" : (chg >= 0 ? "🔴" : "🔵");
      const arrow = chg == null ? "" : (chg >= 0 ? " ▲" : " ▼");
      const px = h.quote ? `${arrow} ${fmtChg(chg)}  ·  $${h.quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "";
      t += `${dir} <b>${tgEscape(h.ticker)}</b>  ${tgEscape(px)}\n`;
      const lab = sentLabel(h.score);
      if (lab) t += `   뉴스 감성: ${lab}\n`;
      const reason = analysis[h.ticker];
      if (reason) {
        t += `   ↳ ${tgEscape(String(reason))}\n`;
      } else if (h.news && h.news.headline) {
        const dt = unixToKstDate(h.news.datetime);
        t += `   ↳ ${tgEscape(h.news.headline.substring(0, 90))} <i>(${tgEscape(h.news.source)}${dt ? ", " + dt : ""})</i>\n`;
      }
      t += "\n";
    });
  }

  // 핫이슈 (상세 요약 포함 — 흐름 파악용)
  const items = (hot.items || []).slice(0, 6);
  if (items.length) {
    t += "🔥 <b>핫이슈 (24h)</b>\n\n";
    const sev = { high: "🔴", medium: "🟡", low: "⚪" };
    items.forEach(it => {
      const tk = Array.isArray(it.tickers) && it.tickers.length ? " (" + it.tickers.join(", ") + ")" : "";
      const tm = it.time ? " · " + tgEscape(it.time) : "";
      t += `${sev[it.severity] || "⚪"} <b>${tgEscape((it.title || "") + tk)}</b><i>${tm}</i>\n`;
      if (it.summary) t += `${tgEscape(it.summary)}\n`;
      if (it.quote) t += `💬 <i>${tgEscape(it.quote)}</i>\n`;
      if (it.url) t += `<a href="${tgEscape(it.url)}">출처</a>\n`;
      t += "\n";
    });
  }

  const chartUrl = buildSnapshotChartUrl(snap, holdings);
  const sectorChartUrl = buildSectorChartUrl(sectors);
  return { text: t.trim(), chartUrl, sectorChartUrl };
}

// 11개 SPDR 섹터 + 반도체(SMH) 당일 등락률 (전체 시장 폭)
const SECTOR_ETFS = [
  ["XLK", "기술"], ["SMH", "반도체"], ["XLC", "커뮤니케이션"], ["XLY", "임의소비"],
  ["XLF", "금융"], ["XLI", "산업재"], ["XLB", "소재"], ["XLE", "에너지"],
  ["XLP", "필수소비"], ["XLV", "헬스케어"], ["XLU", "유틸리티"], ["XLRE", "부동산"]
];
async function fetchSectorBreadth() {
  const res = await Promise.all(SECTOR_ETFS.map(async ([sym, label]) => {
    const q = await fetchQuoteBrief(sym);
    return q ? { label, chg: q.chg } : null;
  }));
  return res.filter(Boolean).sort((a, b) => b.chg - a.chg);
}
function buildSectorChartUrl(sectors) {
  if (!sectors || !sectors.length) return null;
  const labels = sectors.map(s => s.label);
  const data = sectors.map(s => Math.round(s.chg * 100) / 100);
  const colors = data.map(v => v >= 0 ? "#ef4444" : "#3b82f6");
  const config = {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: "섹터 당일 등락률 (%)", color: "#e2e8f0", font: { size: 16 } },
        datalabels: { anchor: "end", align: "top", color: "#e2e8f0", font: { size: 11 }, formatter: (v) => (v >= 0 ? "+" : "") + v + "%" }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { size: 12 }, maxRotation: 60, minRotation: 45 } },
        y: { grid: { color: "#334155" }, ticks: { color: "#94a3b8" } }
      }
    }
  };
  return `https://quickchart.io/chart?bkg=%230f172a&w=720&h=380&v=4&c=${encodeURIComponent(JSON.stringify(config))}`;
}

// 시장 스냅샷 + 보유종목 당일 등락률 막대 차트 (QuickChart, 무료). 한국식: 상승=빨강, 하락=파랑
function buildSnapshotChartUrl(snap, holdings) {
  const rows = [];
  if (snap.sp) rows.push(["S&P500", snap.sp.chg]);
  if (snap.ndx) rows.push(["NASDAQ", snap.ndx.chg]);
  if (snap.vix) rows.push(["VIX", snap.vix.chg]);
  (holdings || []).forEach(h => { if (h.quote) rows.push([h.ticker, h.quote.chg]); });
  if (!rows.length) return null;
  const labels = rows.map(r => r[0]);
  const data = rows.map(r => Math.round(r[1] * 100) / 100);
  const colors = data.map(v => v >= 0 ? "#ef4444" : "#3b82f6");
  const config = {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: "당일 등락률 (%)", color: "#e2e8f0", font: { size: 16 } },
        datalabels: { anchor: "end", align: "top", color: "#e2e8f0", font: { size: 11 }, formatter: (v) => (v >= 0 ? "+" : "") + v + "%" }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { size: 12 }, maxRotation: 60, minRotation: 45 } },
        y: { grid: { color: "#334155" }, ticks: { color: "#94a3b8" } }
      }
    }
  };
  const c = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?bkg=%230f172a&w=${Math.max(420, 90 * rows.length)}&h=340&v=4&c=${c}`;
}

// 텔레그램 HTML 모드 이스케이프 (& < > 만)
function tgEscape(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 보유 종목 목표가 도달 / MA200 이탈 체크 후 텔레그램 푸시 (장중 크론)
async function checkTargetsAndAlert(env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID || !env.UMT_KV) return;
  const stored = await env.UMT_KV.get("positions", "json");
  const positions = (stored && Array.isArray(stored.positions)) ? stored.positions : [];
  if (!positions.length) return;
  const alerted = (await env.UMT_KV.get("target_alerts", "json")) || {};
  const next = { ...alerted };
  const msgs = [];
  for (const pos of positions) {
    if (!pos || !pos.sym) continue;
    const q = (await fetchLiveQuote(pos.sym)) || (await fetchQuoteSimple(pos.sym));
    if (!q || (q.live == null && q.price == null)) continue;
    const cur = (q.live != null ? q.live : q.price);   // 프리/애프터장 우선
    const sess = q.marketState === "PRE" ? " (프리장)" : (q.marketState === "POST" ? " (애프터장)" : "");
    // 익절 목표 도달
    (pos.targets || []).forEach((t) => {
      if (t && t.price > 0 && cur >= t.price) {
        const key = pos.sym + ":T" + t.n + ":" + Number(t.price).toFixed(2);
        if (!alerted[key]) {
          msgs.push(`🎯 <b>${pos.sym}</b> ${t.n}차 목표가 도달!${sess}\n목표 $${Number(t.price).toFixed(2)} (순익 +${t.pct}%) · 현재 $${cur.toFixed(2)}\n→ 매도 비중 ${t.ratio}% 검토`);
          next[key] = Date.now();
        }
      }
    });
    // 매수 단계 도달 (가격 하락 → 계획 매수가 이하)
    (pos.buyStages || []).forEach((b) => {
      if (b && b.price > 0 && cur <= b.price) {
        const key = pos.sym + ":B" + b.n + ":" + Number(b.price).toFixed(2);
        if (!alerted[key]) {
          msgs.push(`🔵 <b>${pos.sym}</b> ${b.n}차 매수가 도달!${sess}\n계획가 $${Number(b.price).toFixed(2)} · 현재 $${cur.toFixed(2)}\n→ ${b.n}차 분할매수 검토`);
          next[key] = Date.now();
        }
      }
    });
    // MA200 이탈 (회복 시 리셋)
    if (pos.ma200 > 0) {
      const tKey = pos.sym + ":TREND";
      if (cur < pos.ma200) {
        if (!alerted[tKey]) {
          msgs.push(`⚠️ <b>${pos.sym}</b> MA200 이탈!${sess}\nMA200 $${Number(pos.ma200).toFixed(2)} · 현재 $${cur.toFixed(2)}\n→ 부분 매도(추세 이탈) 검토`);
          next[tKey] = Date.now();
        }
      } else {
        delete next[tKey];
      }
    }
  }
  await env.UMT_KV.put("target_alerts", JSON.stringify(next));
  if (msgs.length) await sendTelegram(env, "📢 <b>매매 알림</b>\n\n" + msgs.join("\n\n"));
}

async function sendTelegram(env, text) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN.trim()}/sendMessage`;
  // 텔레그램 단일 메시지 한도 4096자 — 초과 시 마지막 줄바꿈 기준으로 안전하게 자름 (태그 중간 절단 방지)
  if (text.length > 4000) {
    const cut = text.substring(0, 3990);
    const nl = cut.lastIndexOf("\n");
    text = (nl > 1000 ? cut.substring(0, nl) : cut) + "\n…";
  }
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID.trim(),
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });
  return await resp.json();
}

// 긴 본문을 4096자 한도에 맞춰 여러 메시지로 분할 전송 (문단 경계 기준)
async function sendTelegramChunks(env, text) {
  const LIMIT = 3800;
  const paras = text.split("\n\n");
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > LIMIT && buf) { chunks.push(buf); buf = p; }
    else { buf = buf ? buf + "\n\n" + p : p; }
  }
  if (buf) chunks.push(buf);
  let last = { ok: true };
  for (const c of chunks) { last = await sendTelegram(env, c); }
  return last;
}

// 차트 이미지 전송 (QuickChart URL). 실패해도 흐름 유지
async function sendTelegramPhoto(env, photoUrl, caption) {
  try {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN.trim()}/sendPhoto`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID.trim(), photo: photoUrl, caption: caption || "", parse_mode: "HTML" })
    });
    return await resp.json();
  } catch (e) { return { ok: false }; }
}

// 브리핑 빌드 + 전송 (차트 이미지 먼저, 본문은 분할 전송)
async function pushBriefing(env, symbols) {
  const { text, chartUrl, sectorChartUrl } = await buildMarketBriefing(env, symbols);
  if (chartUrl) await sendTelegramPhoto(env, chartUrl, "📊 <b>시장 스냅샷</b> · 직전 거래일 마감 기준");
  if (sectorChartUrl) await sendTelegramPhoto(env, sectorChartUrl, "🗺️ <b>섹터 히트맵</b> · 직전 거래일 마감 기준");
  let fullText = text;
  try { const ev = await buildTodayEventsSection(env); if (ev) fullText += "\n\n" + ev; } catch (e) { /* 일정 섹션 실패는 무시 */ }
  return await sendTelegramChunks(env, fullText);
}

// 오늘(KST) 발표 예정 주요 경제지표 — 브리핑에 첨부 (econ_calendar KV 재사용)
function _sameMonthDay(a, md) {
  const pa = String(a || "").split("/"), pb = md.split("/");
  return pa.length === 2 && pb.length === 2 && parseInt(pa[0], 10) === parseInt(pb[0], 10) && parseInt(pa[1], 10) === parseInt(pb[1], 10);
}
async function buildTodayEventsSection(env) {
  if (!env.UMT_KV) return "";
  const cal = await env.UMT_KV.get("econ_calendar", "json");
  const events = (cal && Array.isArray(cal.events)) ? cal.events : [];
  if (!events.length) return "";
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000); // UTC→KST
  const md = (nowKst.getUTCMonth() + 1) + "/" + nowKst.getUTCDate();
  const today = events.filter((e) => e && _sameMonthDay(e.date, md) && (e.importance === "high" || e.importance === "medium"));
  if (!today.length) return "";
  const impIcon = { high: "🔴", medium: "🟠", low: "⚪" };
  let t = "📅 <b>오늘 주요 경제지표</b>\n\n";
  today.slice(0, 8).forEach((e) => {
    const parts = [impIcon[e.importance] || "⚪", tgEscape(e.time || ""), tgEscape(e.country || ""), tgEscape(e.name || "")].filter(Boolean);
    t += parts.join(" ").replace(/\s+/g, " ").trim();
    if (e.forecast) t += ` (예상 ${tgEscape(e.forecast)})`;
    t += "\n";
  });
  return t.trim();
}

// ===== 경제지표 발표 "결과" 감지 + 알림 (장중 크론) =====
// 캘린더의 高/中 중요도 지표 중 발표 시각이 지난 것을 Gemini 그라운딩으로 실제치 확인 →
// econ_results KV 저장(앱 표시용) + 텔레그램 푸시. 중복 방지: econ_alerted(date|name) 키.
const ECON_RESULTS_KEY = "econ_results";
const ECON_ALERTED_KEY = "econ_alerted";

function _kstMd(offsetDays) {
  const k = new Date(Date.now() + 9 * 3600 * 1000 + (offsetDays || 0) * 86400000);
  return (k.getUTCMonth() + 1) + "/" + k.getUTCDate();
}
// 발표 시각(KST) 파싱 → 분 단위. 못 읽으면 null
function _parseKstMinutes(timeStr) {
  const s = String(timeStr || "");
  let m = s.match(/(\d{1,2})\s*[:시]\s*(\d{1,2})?/);
  if (!m) return null;
  let h = parseInt(m[1], 10), min = parseInt(m[2] || "0", 10);
  if (/오후|pm|PM/.test(s) && h < 12) h += 12;
  if (/오전|am|AM/.test(s) && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

async function checkEconResultsAndAlert(env) {
  if (!env.GEMINI_API_KEY || !env.UMT_KV) return;
  const cal = await env.UMT_KV.get("econ_calendar", "json");
  const events = (cal && Array.isArray(cal.events)) ? cal.events : [];
  if (!events.length) return;

  const todayMd = _kstMd(0), yestMd = _kstMd(-1);
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
  const nowMin = nowKst.getUTCHours() * 60 + nowKst.getUTCMinutes();

  const alerted = (await env.UMT_KV.get(ECON_ALERTED_KEY, "json")) || {};
  // 오래된 기록 정리(5일 경과)
  for (const k in alerted) { if (alerted[k] && alerted[k].ts && Date.now() - alerted[k].ts > 5 * 86400000) delete alerted[k]; }

  // 후보: 高/中 중요도 + 오늘(시각 지남)/어제 + 미완료(attempts<9)
  const cands = events.filter((e) => {
    if (!e || !e.name || (e.importance !== "high" && e.importance !== "medium")) return false;
    const isToday = _sameMonthDay(e.date, todayMd), isYest = _sameMonthDay(e.date, yestMd);
    if (!isToday && !isYest) return false;
    if (isToday) { const tm = _parseKstMinutes(e.time); if (tm != null && nowMin < tm) return false; } // 아직 발표 전
    const key = e.date + "|" + e.name;
    const a = alerted[key];
    if (a && (a.done || (a.attempts || 0) >= 9)) return false;
    return true;
  }).slice(0, 6);
  if (!cands.length) return;

  let fetched = [];
  try { fetched = await callGeminiEconResults(env.GEMINI_API_KEY, cands); } catch (e) { fetched = []; }
  // Gemini가 name에 '(KR, 7/1)' 접미사를 붙이기도 해서 정규화 포함방식으로 매칭
  const _nrm = (s) => String(s || "").replace(/\s+/g, "").replace(/[()]/g, "").toLowerCase();
  const findFetched = (name) => {
    const n = _nrm(name);
    for (const r of fetched) { if (!r || !r.name) continue; const rn = _nrm(r.name); if (rn === n || rn.includes(n) || n.includes(rn)) return r; }
    return null;
  };

  const store = (await env.UMT_KV.get(ECON_RESULTS_KEY, "json")) || { results: [], ts: 0 };
  if (!Array.isArray(store.results)) store.results = [];
  const msgs = [];
  let highResult = false; // 高중요도 지표 신규 확정 → 이벤트 트리거 Quad 재판정
  const impIcon = { high: "🔴", medium: "🟠", low: "⚪" };
  const flag = { US: "🇺🇸", KR: "🇰🇷" };
  const surpArrow = { above: "🔺상회", below: "🔻하회", inline: "▪️부합" };

  cands.forEach((e) => {
    const key = e.date + "|" + e.name;
    const r = findFetched(e.name);
    const actual = r && r.actual ? String(r.actual).trim() : "";
    if (!actual) { // 아직 미발표/미확인 → 재시도 카운트
      alerted[key] = { ts: Date.now(), attempts: ((alerted[key] && alerted[key].attempts) || 0) + 1, done: false };
      return;
    }
    const gf = (r.forecast != null && String(r.forecast).trim()) ? String(r.forecast).trim() : "";
    const gp = (r.previous != null && String(r.previous).trim()) ? String(r.previous).trim() : "";
    const rec = {
      date: e.date, country: e.country || "", name: e.name, importance: e.importance,
      actual: actual, forecast: gf || e.forecast || "", previous: gp || e.previous || "",  // Gemini 예상치 우선, 없으면 캘린더값
      surprise: (r.surprise || "").trim(), comment: (r.comment || "").trim(), quad: (r.quad || "").trim(),
      ts: Date.now()
    };
    // 저장(같은 date|name 갱신)
    store.results = store.results.filter((x) => !(x.date === rec.date && x.name === rec.name));
    store.results.push(rec);
    alerted[key] = { ts: Date.now(), attempts: ((alerted[key] && alerted[key].attempts) || 0) + 1, done: true };
    if (e.importance === "high") highResult = true;

    // 텔레그램 본문
    let body = `${impIcon[e.importance] || "⚪"} ${flag[e.country] || ""} <b>${tgEscape(e.name)}</b>\n실제 <b>${tgEscape(actual)}</b>`;
    const sub = [];
    if (rec.forecast) sub.push("예상 " + tgEscape(rec.forecast));
    if (rec.previous) sub.push("이전 " + tgEscape(rec.previous));
    if (sub.length) body += ` (${sub.join(" · ")})`;
    const tail = [surpArrow[rec.surprise] || "", rec.quad ? "Quad " + tgEscape(rec.quad) : ""].filter(Boolean);
    if (tail.length) body += `\n→ ${tail.join(" · ")}`;
    if (rec.comment) body += `\n${tgEscape(rec.comment)}`;
    msgs.push(body);
  });

  // 최근 30개만 유지(최신순)
  store.results.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  store.results = store.results.slice(0, 30);
  store.ts = Date.now();
  await env.UMT_KV.put(ECON_RESULTS_KEY, JSON.stringify(store));
  await env.UMT_KV.put(ECON_ALERTED_KEY, JSON.stringify(alerted));
  if (msgs.length) await sendTelegram(env, "📊 <b>경제지표 발표</b>\n\n" + msgs.join("\n\n"));
  // 이벤트 트리거: 高중요도 지표(CPI·NFP·FOMC 등)가 새로 확정되면 Quad를 즉시 재판정
  if (highResult && env.GEMINI_API_KEY) {
    try { await refreshMacroToKV(env, "econ-trigger"); } catch (e) { /* 실패는 다음 주간 판정에서 반영 */ }
  }
}

const ECON_RESULT_PROMPT_HEAD = `당신은 경제지표 발표 결과 확인 전문가입니다. Google 검색으로 아래 지표들의 "실제 발표치(actual)"를 확인하세요.
아직 발표되지 않았거나 확실하지 않으면 actual을 빈 문자열("")로 두세요(추측 금지).
각 항목에 대해: 실제치(actual), 시장 예상치/컨센서스(forecast, Google 검색으로 확인, 모르면 빈문자열), 이전치(previous, 직전 발표값), 예상 대비(surprise: above=예상상회 / below=예상하회 / inline=부합 / 빈문자열=모름), 한 줄 시장 해석(comment, 한국어 40자 이내), Quad 영향(quad, 예: '인플레↑' '성장↓' '중립').
surprise는 반드시 actual과 forecast를 비교해 판정하세요(actual>forecast면 지표 성격에 따라 above 등).
CRITICAL: 오직 유효한 JSON만. 마크다운/설명 없이 { 로 시작해 } 로 끝. 문자열 안에서 큰따옴표 금지.
JSON: {"results":[{"name":"<입력 이름 그대로>","actual":"<실제치 또는 빈문자열>","forecast":"<시장 예상치/컨센서스, 없으면 빈문자열>","previous":"<이전치, 없으면 빈문자열>","surprise":"above|below|inline|","comment":"<한국어 해석>","quad":"<Quad 영향>"}]}

확인할 지표(이름은 그대로 사용):`;

async function callGeminiEconResults(apiKey, events) {
  const list = events.map((e) => `- ${e.name} (${e.country || ""}, ${e.date}${e.forecast ? ", 예상 " + e.forecast : ""}${e.previous ? ", 이전 " + e.previous : ""})`).join("\n");
  const prompt = ECON_RESULT_PROMPT_HEAD + "\n" + list;
  const data = await callGeminiWithFallback(apiKey, {
    system_instruction: { parts: [{ text: "You are a JSON API. Output ONLY valid JSON. Never use double quotes inside string values." }] },
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 3000 },
  });
  let textContent = "";
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  if (parts) { for (const part of parts) { if (part.text) textContent += part.text; } }
  if (!textContent) return [];
  try {
    const res = parseGeminiJson(textContent);
    if (Array.isArray(res.results)) return res.results;
  } catch (e) {
    try { return salvageObjects(textContent, (o) => o && o.name); } catch (_) { /* 무시 */ }
  }
  return [];
}

// --- Gemini Flash 2.5 매크로 분석 ---

const MACRO_PROMPT = `당신은 Hedgeye 스타일의 매크로 경제 분석 전문가입니다.
경제를 성장(Growth)과 인플레이션(Inflation) 두 축의 방향(가속/감속)으로 4국면(Quad)을 판정합니다.

Quad 정의:
- Quad 1 (골디락스): 성장 가속 + 인플레 감속
- Quad 2 (과열): 성장 가속 + 인플레 가속
- Quad 3 (스태그플레이션): 성장 감속 + 인플레 가속
- Quad 4 (침체/디플레): 성장 감속 + 인플레 감속

ETF 유니버스: TQQQ,SOXL,TNA,SPXL,NRGU,GUSH,NUGT,DRN,GLD,UGL,GDXU,SQQQ,TMF,CURE,UUP,UVXY,BITX,UDOW,FAS,LABU

오늘 날짜 기준으로 Google 검색을 통해 최신 경제 데이터를 수집하고 Quad 판정을 수행하세요.

수집할 데이터:
1. 성장 지표: GDP, ISM PMI, NFP, 실업수당, 소매판매
2. 인플레 지표: CPI/Core CPI, PCE/Core PCE, PPI, 평균시급, 유가
3. 정책: 기준금리, FedWatch 금리인하 확률, Fed 톤
4. 시장: WTI, 금, DXY, 10년물 금리, VIX
5. 이벤트 + 향후 2주 경제지표 일정
6. 주요 뉴스 3개 (심층분석 포함)

반드시 아래 JSON 구조로만 응답하세요. JSON 외의 텍스트 없이:
{"quad":{"current":<1-4>,"name":"<골디락스|과열|스태그플레이션|침체>","growth":"<accelerating|decelerating>","inflation":"<accelerating|decelerating>","confidence":<50-100>,"transition_risk":{"to_quad1":<0-100>,"to_quad2":<0-100>,"to_quad3":<0-100>,"to_quad4":<0-100>}},"indicators":{"growth":[{"name":"<지표명>","value":"<수치>","direction":"<up|down|flat>","impact":"<해석>"}],"inflation":[{"name":"<지표명>","value":"<수치>","direction":"<up|down|flat>","impact":"<해석>"}],"policy":{"current_rate":"<금리>","next_cut_prob":<0-100>,"fed_tone":"<hawkish|dovish_leaning|neutral|dovish|hawkish_leaning>"}},"market_data":{"wti":{"value":<n>,"change":<n>},"gold":{"value":<n>,"change":<n>},"dxy":{"value":<n>,"change":<n>},"us10y":{"value":<n>,"change":<n>},"vix":{"value":<n>,"change":<n>}},"events":{"overlay":[{"type":"<geopolitical|tariff|banking|tech|policy>","severity":"<high|medium|low>","title":"<제목>","impact":"<영향>"}],"upcoming":[{"date":"<M/D>","name":"<이벤트>","importance":"<high|medium|low>"}]},"news":[{"level":"<red|yellow|green>","title":"<제목>","summary":"<요약>","etf_impact":{"bullish":["<티커>"],"bearish":["<티커>"],"hedge":["<티커>"]},"deep_analysis":{"situation":"<상세>","historical_cases":[{"event":"<사례>","market_move":"<반응>","duration":"<기간>","market_impact":"<영향>"}],"scenarios":[{"name":"<시나리오>","probability":<0-100>,"action":"<조치>"}],"monitor_points":["<포인트>"]}}],"recommendations":{"buy":[{"ticker":"<ETF>","mode":"<aggressive|balanced|defensive>","reason":"<이유>"}],"hold":[{"ticker":"<ETF>","status":"hold","reason":"<이유>"}],"exit":[]},"timestamp":"<ISO8601>"}

규칙: 현재 Quad의 transition_risk=0, news 정확히 3개, ETF는 유니버스에서만, red=긴급/yellow=주의/green=참고`;

async function callGeminiWithFallback(apiKey, body) {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError;
  for (const model of models) {
    const delays = [2000, 4000, 8000];
    for (let attempt = 0; attempt < 3; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) return await response.json();
      const errorBody = await response.text();
      lastError = `Gemini API error ${response.status} (${model}): ${errorBody}`;
      if (response.status !== 503 && response.status !== 429) throw new Error(lastError);
      if (attempt < 2) await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
  throw new Error(lastError);
}

// 웹 Quad 대시보드용 매크로 분석: KV 캐시 유효시간 (크론이 평일 1회 미리 계산)
const MACRO_KV_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const MACRO_KV_KEY = "macro_latest";

// Quad 매크로 분석을 실행해 KV에 저장하고 결과 반환 (크론/온디맨드 공용)
// 시장 나우캐스트로 Gemini Quad 판정 교차검증 (성장/인플레 축별 일치도 → 신뢰도 재산출)
function applyNowcastCrosscheck(result, nc) {
  result.nowcast = nc;
  if (!result.quad || !nc) return;
  const agG = result.quad.growth === nc.growth;
  const agI = result.quad.inflation === nc.inflation;
  const agreeAxes = (agG ? 1 : 0) + (agI ? 1 : 0);
  result.quad.marketQuad = nc.quad;
  result.quad.agreement = agreeAxes === 2 ? "full" : (agreeAxes === 1 ? "partial" : "conflict");
  result.quad.agreeGrowth = agG;
  result.quad.agreeInflation = agI;
  // Gemini가 지어낸 confidence 대신, 나우캐스트 신뢰도 × 판정 일치도로 재산출
  const factor = agreeAxes === 2 ? 1.0 : (agreeAxes === 1 ? 0.82 : 0.62);
  result.quad.confidence = Math.max(40, Math.min(95, Math.round((nc.confidence || 60) * factor)));
}

async function refreshMacroToKV(env, source) {
  const result = await callGeminiMacroAnalysis(env.GEMINI_API_KEY);
  try {
    const nc = await computeQuadNowcast();
    applyNowcastCrosscheck(result, nc);
    // 히스테리시스: 직전 공식 Quad와 다르면, 시장 나우캐스트가 새 국면을 확인해줄 때만 '확정'
    if (result.quad && env.UMT_KV) {
      const prevOfficial = await env.UMT_KV.get("official_quad");
      const nowQ = result.quad.current;
      if (prevOfficial && String(nowQ) !== prevOfficial) {
        // 전환 발생 — 시장이 새 국면(또는 그 방향)에 동의하면 확정, 아니면 '전환 검토중'
        result.quad.transitioned = true;
        result.quad.prevQuad = Number(prevOfficial);
        result.quad.confirmed = (nc && nc.quad === nowQ) || result.quad.agreement === "full";
      } else {
        result.quad.confirmed = true;
      }
      await env.UMT_KV.put("official_quad", String(nowQ));
    }
  } catch (e) { /* 나우캐스트 실패는 무시 (Gemini 판정 그대로 사용) */ }
  result._cachedAt = Date.now();
  result._source = source || "ondemand";
  if (env.UMT_KV) {
    try { await env.UMT_KV.put(MACRO_KV_KEY, JSON.stringify(result)); } catch (e) { /* KV 실패 무시 */ }
  }
  return result;
}

// 나우캐스트만 갱신 (Gemini 미호출) — 매일 크론으로 캐시된 Quad에 최신 시장 프록시 반영
async function refreshMacroNowcastOnly(env) {
  if (!env.UMT_KV) return null;
  let result = null;
  try { const raw = await env.UMT_KV.get(MACRO_KV_KEY); if (raw) result = JSON.parse(raw); } catch (e) { /* 무시 */ }
  if (!result || !result.quad) {
    // 캐시된 Quad가 없으면 풀 판정으로 폴백 (초기 1회)
    if (env.GEMINI_API_KEY) return await refreshMacroToKV(env, "nowcast-fallback");
    return null;
  }
  const nc = await computeQuadNowcast();
  applyNowcastCrosscheck(result, nc);
  result._nowcastAt = Date.now();
  try { await env.UMT_KV.put(MACRO_KV_KEY, JSON.stringify(result)); } catch (e) { /* 무시 */ }
  return result;
}

// 실시간 핫이슈: KV 캐시 (크론이 미리 계산 → 즉시 응답, Gemini 31초 호출 회피)
const HOT_KV_KEY = "hot_latest";
const HOT_KV_TTL_MS = 3 * 60 * 60 * 1000; // 3시간 신선도 (초과 시 stale 반환 + 백그라운드 갱신)

// 브리핑용 실측 미국 섹터 등락 (6:30 기준) — 서사 방향 오류 방지
const HOT_SECTORS = [["SMH", "반도체"], ["XLK", "기술"], ["XLC", "커뮤니케이션"], ["XLY", "임의소비"], ["XLF", "금융"], ["XLE", "에너지"], ["XLV", "헬스케어"], ["XLI", "산업재"], ["XLB", "소재"], ["XLP", "필수소비"], ["XLU", "유틸리티"], ["XLRE", "부동산"]];
// 섹터명 키워드 → 대표 심볼 (Gemini 섹터명 매칭용)
const HOT_SECTOR_KW = { "반도체": ["SMH", "XLK"], "기술": ["XLK"], "IT": ["XLK"], "소프트": ["XLK"], "커뮤니": ["XLC"], "미디어": ["XLC"], "인터넷": ["XLC"], "임의소비": ["XLY"], "소비": ["XLY"], "금융": ["XLF"], "은행": ["XLF"], "에너지": ["XLE"], "석유": ["XLE"], "정유": ["XLE"], "헬스": ["XLV"], "바이오": ["XLV"], "제약": ["XLV"], "산업": ["XLI"], "방산": ["XLI"], "항공": ["XLI"], "소재": ["XLB"], "화학": ["XLB"], "필수": ["XLP"], "유틸": ["XLU"], "부동산": ["XLRE"], "리츠": ["XLRE"] };

async function refreshHotToKV(env, source) {
  // 실측 섹터 등락 + 세션 판정 (KST 06:30~15:30 = 미국 마감 브리핑)
  let realCtx = "", secBySym = {};
  const nowMs = Date.now();
  const kstMin = Math.floor(((nowMs / 60000) + 9 * 60) % 1440);
  const session = (kstMin >= 6 * 60 + 30 && kstMin < 15 * 60 + 30) ? "US" : "KR";

  // 세션 시간창: 직전 브리핑 경계(06:30/15:30) 이후 발생한 뉴스만 — 브리핑 간 중복 원천 차단
  //  · US 세션 → 전일 15:30 KST 이후 / · KR 세션 → 당일(또는 자정 전이면 전일) 06:30 KST 이후
  const minsSince = session === "US" ? kstMin + 510 : (kstMin >= 930 ? kstMin - 390 : kstMin + 1050);
  const windowStartMs = nowMs - minsSince * 60000;
  const windowHours = Math.max(1, Math.round(minsSince / 60));

  // 실제 최신 헤드라인 수집 (세션별 소스) — Gemini는 검색이 아니라 이 목록에서 선별
  let headlineCtx = "";
  try {
    const rows = (await Promise.all(BRIEF_FEEDS[session].map(([u, s]) => fetchRssFeed(u, s, 15)))).flat();
    rows.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
    const seen = new Set(); const picked = [];
    for (const x of rows) {
      if (!x.headline) continue;
      if (x.datetime && x.datetime * 1000 < windowStartMs) continue;   // 시간창 밖 제외
      if (MOVER_KW.test(x.headline) || AD_KW.test(x.headline)) continue;
      const k = x.headline.replace(/\s+/g, " ").substring(0, 50);
      if (seen.has(k)) continue;
      seen.add(k); picked.push(x);
      if (picked.length >= 25) break;
    }
    if (picked.length >= 5) {
      const ago = (dt) => { const m = Math.max(0, Math.round((nowMs - dt * 1000) / 60000)); return m < 60 ? m + "분 전" : Math.round(m / 60) + "시간 전"; };
      headlineCtx = picked.map((x) => `- [${x.source}${x.datetime ? ", " + ago(x.datetime) : ""}] ${x.headline}`).join("\n");
    }
  } catch (e) { /* 헤드라인 수집 실패 시 기존 검색 방식으로 동작 */ }

  // 직전 브리핑에서 다룬 제목 — 같은 내용 반복 금지용
  let prevTitles = [];
  try {
    if (env.UMT_KV) {
      const prev = await env.UMT_KV.get(HOT_KV_KEY, "json");
      if (prev && Array.isArray(prev.items)) prevTitles = prev.items.map((i) => i && i.title).filter(Boolean).slice(0, 10);
    }
  } catch (e) { /* 무시 */ }
  // 미국 섹터 실측은 US 세션에만 주입 — KR 세션 sectors는 한국 업종이라 미국 ETF 등락으로 보정하면 오염됨
  try {
    if (session !== "US") throw new Error("skip");
    const rows = await Promise.all(HOT_SECTORS.map(([s, ko]) =>
      fetchSectorChanges(s).then(q => ({ s, ko, chg: (q && q.chg1d != null) ? q.chg1d : null })).catch(() => ({ s, ko, chg: null }))));
    rows.forEach(r => { if (r.chg != null) secBySym[r.s] = r.chg; });
    const valid = rows.filter(r => r.chg != null);
    const up = valid.filter(r => r.chg > 0.2).sort((a, b) => b.chg - a.chg);
    const dn = valid.filter(r => r.chg < -0.2).sort((a, b) => a.chg - b.chg);
    const fmt = (r) => r.ko + "(" + (r.chg > 0 ? "+" : "") + r.chg.toFixed(1) + "%)";
    if (valid.length) realCtx = "실제 최근 미국장 섹터 등락(6:30 KST 기준): "
      + (up.length ? "강세 " + up.map(fmt).join(", ") : "뚜렷한 강세 없음")
      + " / " + (dn.length ? "약세 " + dn.map(fmt).join(", ") : "뚜렷한 약세 없음");
  } catch (e) { /* 실측 실패는 무시 */ }

  const result = await callGeminiHotIssues(env.GEMINI_API_KEY, [], realCtx, session, { headlineCtx, prevTitles, windowHours });

  // 실제 지수 등락으로 시장 방향(dir) 보정 — Gemini가 상승/하락을 틀리게 판정하는 문제 방지
  try {
    if (result && result.markets) {
      const [us, kr] = await Promise.all([fetchQuoteBrief("^IXIC"), fetchQuoteBrief("^KS11")]);
      const dirOf = (q) => (q && q.chg != null) ? (q.chg > 0.05 ? "up" : (q.chg < -0.05 ? "down" : "mixed")) : null;
      const du = dirOf(us), dk = dirOf(kr);
      if (result.markets.us && du) result.markets.us.dir = du;
      if (result.markets.kr && dk) result.markets.kr.dir = dk;
    }
  } catch (e) { /* 보정 실패는 무시 */ }

  // 섹터 방향 실측 보정 — Gemini sectors[].dir을 실제 등락 방향에 강제 일치 (반도체 상승인데 하락 표기 방지)
  try {
    if (result && Array.isArray(result.sectors) && Object.keys(secBySym).length) {
      result.sectors.forEach(sec => {
        if (!sec || !sec.name) return;
        for (const k in HOT_SECTOR_KW) {
          if (sec.name.indexOf(k) >= 0) {
            for (const sym of HOT_SECTOR_KW[k]) {
              if (secBySym[sym] != null) {
                const realDir = secBySym[sym] > 0 ? "up" : "down";
                if (sec.dir !== realDir) { sec.dir = realDir; sec.reason = ""; }  // 방향 뒤집힘 → 모순되는 이유 제거
                return;
              }
            }
          }
        }
      });
    }
  } catch (e) { /* 무시 */ }
  result._session = session;
  result._cachedAt = Date.now();
  result._source = source || "ondemand";
  if (env.UMT_KV) {
    try { await env.UMT_KV.put(HOT_KV_KEY, JSON.stringify(result)); } catch (e) { /* KV 실패 무시 */ }
  }
  return result;
}

// 경제 일정: KV 캐시 (크론 예열 + SWR)
async function refreshCalendarToKV(env, source) {
  const result = await callGeminiCalendar(env.GEMINI_API_KEY);
  result.ts = Date.now();
  result._source = source || "ondemand";
  if (env.UMT_KV) {
    try { await env.UMT_KV.put("econ_calendar", JSON.stringify(result)); } catch (e) { /* KV 실패 무시 */ }
  }
  return result;
}

async function callGeminiMacroAnalysis(apiKey) {
  const data = await callGeminiWithFallback(apiKey, {
    contents: [{ parts: [{ text: MACRO_PROMPT }] }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 10000,
    },
  });

  // Gemini 응답에서 텍스트 추출
  let textContent = "";
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  if (parts) {
    for (const part of parts) {
      if (part.text) textContent += part.text;
    }
  }

  if (!textContent) {
    throw new Error("No text content in Gemini macro response: " + JSON.stringify(data).substring(0, 300));
  }

  // JSON 파싱 (코드블록 래핑 제거 + 불완전 JSON 복구)
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (parseErr) {
    // 불완전 JSON 복구: 잘린 끝부분에 괄호 닫기 시도
    let fixed = jsonStr;
    // 끝에 잘린 문자열 값 닫기
    const lastQuote = fixed.lastIndexOf('"');
    const afterLast = fixed.substring(lastQuote + 1).trim();
    if (afterLast === '' || afterLast.match(/^[^"\]}]*$/)) {
      fixed = fixed.substring(0, lastQuote + 1);
    }
    // 열린 괄호 수만큼 닫기
    const opens = (fixed.match(/[\[{]/g) || []).length;
    const closes = (fixed.match(/[\]}]/g) || []).length;
    for (let i = 0; i < opens - closes; i++) {
      const lastOpen = Math.max(fixed.lastIndexOf('['), fixed.lastIndexOf('{'));
      fixed += fixed[lastOpen] === '[' ? ']' : '}';
    }
    try {
      result = JSON.parse(fixed);
    } catch {
      throw new Error(parseErr.message + " | Raw (first 500): " + jsonStr.substring(0, 500));
    }
  }

  if (!result.timestamp) {
    result.timestamp = new Date().toISOString();
  }

  return result;
}

// --- 주간 리포트 ---

const WEEKLY_PROMPT = `You are a Hedgeye-style macro analyst. Use Google Search to collect this week's economic data, market events, and key news. Respond in Korean for text values.

CRITICAL: Output ONLY valid JSON. No markdown, no explanation, no apology. Start with { and end with }.

ETF universe: TQQQ,SOXL,TNA,SPXL,NRGU,GUSH,NUGT,DRN,GLD,UGL,GDXU,SQQQ,TMF,CURE,UUP,UVXY,BITX,UDOW,FAS,LABU

Quad: 1=골디락스(Growth↑Inflation↓), 2=과열(Growth↑Inflation↑), 3=스태그플레이션(Growth↓Inflation↑), 4=침체(Growth↓Inflation↓)

JSON schema:
{"week_summary":"<한줄 요약>","quad_status":{"current":1,"name":"골디락스","maintained":true,"change_from":null,"confidence":75},"transition_checklist":[{"item":"<항목>","checked":true,"detail":"<설명>"}],"transition_probability":{"to_quad1":0,"to_quad2":20,"to_quad3":10,"to_quad4":5},"week_highlights":[{"date":"4/1","event":"<이벤트>","impact":"<영향>","quad_effect":"<Quad 영향>"}],"next_week":{"key_events":[{"date":"4/7","name":"<이벤트>","importance":"high","expected_impact":"<예상>"}],"scenarios":[{"name":"<시나리오>","probability":50,"strategy":"<전략>","etf_action":[{"ticker":"TQQQ","action":"buy","reason":"<이유>"}]}],"risk_factors":["<리스크>"]},"market_week_review":{"sp500":{"close":5200,"weekly_change":"+1.2%"},"nasdaq":{"close":16300,"weekly_change":"+1.5%"},"vix":{"close":18,"weekly_change":"-5%"},"us10y":{"close":4.2,"weekly_change":"+3bp"},"wti":{"close":78,"weekly_change":"+2%"},"gold":{"close":3300,"weekly_change":"+0.5%"},"dxy":{"close":103,"weekly_change":"-0.3%"}},"timestamp":"2026-04-05T00:00:00Z"}`;

const CALENDAR_PROMPT = `당신은 경제지표 일정 큐레이터입니다. Google 검색으로 "오늘부터 향후 14일" 미국과 한국의 주요 경제지표·이벤트 발표 일정을 수집하세요. 모든 텍스트는 한국어.

포함 대상: 미국(CPI, PCE, NFP/고용, FOMC/금리결정, GDP, 소매판매, ISM, 미시간소비심리 등), 한국(소비자물가 CPI, 금통위 기준금리, 수출입, GDP, 고용 등), 주요 빅테크 실적 발표일.

CRITICAL: 오직 유효한 JSON만. 마크다운/설명 없이 { 로 시작해 } 로 끝.
문자열 값 안에서 큰따옴표(") 금지(작은따옴표 사용), 줄바꿈 금지.

JSON 스키마:
{"events":[{"date":"<M/D>","weekday":"<월|화|수|목|금|토|일>","country":"<US|KR>","name":"<지표/이벤트명 한국어>","importance":"<high|medium|low>","time":"<한국시간 발표시각, 모르면 빈 문자열>","forecast":"<예상치, 없으면 빈 문자열>","previous":"<이전치, 없으면 빈 문자열>"}],"timestamp":"<ISO8601>"}

규칙: 날짜 오름차순 정렬, 최대 20개, 확실한 일정만(추측 금지), importance는 시장 영향도 기준.`;

async function callGeminiCalendar(apiKey) {
  let lastErr = "unknown", lastText = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await callGeminiWithFallback(apiKey, {
      system_instruction: { parts: [{ text: "You are a JSON API. Output ONLY valid JSON. Never output text, markdown, or explanations. Inside string values, never use double quotes." }] },
      contents: [{ parts: [{ text: CALENDAR_PROMPT }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 6000 },
    });
    let textContent = "";
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    if (parts) { for (const part of parts) { if (part.text) textContent += part.text; } }
    if (!textContent) { lastErr = "No text content"; continue; }
    lastText = textContent;
    try {
      const result = parseGeminiJson(textContent);
      if (!Array.isArray(result.events)) result.events = [];
      if (!result.timestamp) result.timestamp = new Date().toISOString();
      return result;
    } catch (e) { lastErr = e.message; }
  }
  // 폴백: 깨진 텍스트에서 이벤트 객체(date+name)만 개별 추출
  try {
    const evs = salvageObjects(lastText, o => o && o.date && o.name);
    if (evs.length) return { events: evs.slice(0, 20), timestamp: new Date().toISOString() };
  } catch (e) { /* 무시 */ }
  throw new Error("Calendar JSON parse failed: " + lastErr);
}

async function callGeminiWeeklyReport(apiKey) {
  const data = await callGeminiWithFallback(apiKey, {
    system_instruction: { parts: [{ text: "You are a JSON API. Output ONLY valid JSON. Never output text, markdown, or explanations." }] },
    contents: [{ parts: [{ text: WEEKLY_PROMPT }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8000 },
  });
  let textContent = "";
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  if (parts) {
    for (const part of parts) {
      if (part.text) textContent += part.text;
    }
  }
  if (!textContent) throw new Error("No text content in Gemini weekly response: " + JSON.stringify(data).substring(0, 300));
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (parseErr) {
    let fixed = jsonStr;
    const lastQuote = fixed.lastIndexOf('"');
    const afterLast = fixed.substring(lastQuote + 1).trim();
    if (afterLast === '' || afterLast.match(/^[^"\]}]*$/)) {
      fixed = fixed.substring(0, lastQuote + 1);
    }
    const opens = (fixed.match(/[\[{]/g) || []).length;
    const closes = (fixed.match(/[\]}]/g) || []).length;
    for (let i = 0; i < opens - closes; i++) {
      const lastOpen = Math.max(fixed.lastIndexOf('['), fixed.lastIndexOf('{'));
      fixed += fixed[lastOpen] === '[' ? ']' : '}';
    }
    try { result = JSON.parse(fixed); } catch { throw new Error(parseErr.message); }
  }
  if (!result.timestamp) result.timestamp = new Date().toISOString();
  return result;
}

// --- 실시간 핫이슈 브리핑 ---

const HOT_PROMPT = `당신은 글로벌 매크로/시장 속보 큐레이터입니다. Google 검색으로 "최근 24시간 이내" 시장을 움직인 발언·뉴스·이벤트를 수집하세요. 모든 텍스트 값은 한국어로 작성합니다.

수집 우선순위 (아래에 [세션] 지시가 있으면 그 지시의 시장·시간창이 우선):
1. 트럼프 대통령의 발언/포스팅 (관세, 연준, 무역, 지정학 등 시장 영향)
2. 연준(Fed) 인사 발언, FOMC, 금리 관련 코멘트
3. 지정학 이벤트 (전쟁, 분쟁, 제재, 선거)
4. 블룸버그/로이터/CNBC 등 주요 매체의 시장 영향 헤드라인
5. 주요 빅테크/대형주 실적·뉴스

CRITICAL: 오직 유효한 JSON만 출력하세요. 마크다운/설명/사과 없이 { 로 시작해 } 로 끝나야 합니다.

JSON 스키마:
{"quad":{"current":<1-4>,"name":"<골디락스|과열|스태그플레이션|침체>","summary":"<현재 성장·인플레 국면을 1문장으로>"},"overview":"<오늘 시장 전반의 흐름을 꿰는 3~4문장 내러티브. 개별 뉴스 나열이 아니라 '무엇이 시장을 주도하고 있고(주도 테마), 위험 요인은 무엇이며, 투자자 분위기(위험선호/회피)는 어떤지'를 이야기하듯 연결해서 서술. 지수 방향과 금리·유가·달러 등 매크로 맥락 포함>","markets":{"us":{"dir":"<up|down|mixed>","reason":"<미국 증시(S&P500/나스닥/다우) 최근 거래일 등락의 핵심 이유를 1문장 한국어로>"},"kr":{"dir":"<up|down|mixed>","reason":"<한국 증시(코스피/코스닥) 최근 거래일 등락의 핵심 이유를 1문장 한국어로>"}},"sectors":[{"name":"<섹터명 한국어, 예: 반도체/에너지/금융/방산/헬스케어/기술/바이오>","dir":"<up|down>","reason":"<해당 섹터 강세 또는 약세의 핵심 이유 1문장>"}],"upcoming":[{"date":"<M/D>","name":"<이벤트명, 예: 미 CPI 발표 / FOMC / 엔비디아 실적>","importance":"<high|medium|low>"}],"items":[{"category":"<trump|fed|geopolitics|market|earnings|policy>","source":"<출처 매체/인물>","time":"<상대 시간, 예: 2시간 전 / 오늘 오전>","hours_ago":<정수: 뉴스 발생 후 지금까지 경과한 시간(시간 단위). 반드시 0~24 사이>,"severity":"<high|medium|low>","title":"<한글 제목>","summary":"<한글 2~3문장 상세 요약, 배경과 영향까지>","quote":"<핵심 원문 발언 한 줄, 없으면 빈 문자열>","tickers":["<영향 받는 미국 티커>"],"direction":"<bullish|bearish|neutral>","url":"<실제 출처 URL>"}],"timestamp":"<ISO8601>"}

규칙: quad는 Hedgeye식 4국면 판정(1=골디락스 성장↑인플레↓, 2=과열 성장↑인플레↑, 3=스태그 성장↓인플레↑, 4=침체 성장↓인플레↓). overview는 반드시 채울 것(전체를 꿰는 내러티브). markets.us/kr는 각 시장의 최근 등락 핵심 이유를 1문장으로(dir=방향), 둘 다 반드시 채울 것. sectors는 최근 거래일 강세·약세가 뚜렷한 섹터 3~5개(강세 up·약세 down 섞어서, 이유 포함). upcoming은 향후 7일 내 핵심 경제지표·실적·정책 일정 3~5개(없으면 빈 배열). items는 반드시 '최근 24시간 이내'에 발생한 뉴스만 6~8개(hours_ago 24 초과 항목은 절대 포함 금지, 며칠 전 뉴스 금지). hours_ago 오름차순(가장 최신이 위) 정렬, url은 검색으로 찾은 실제 링크만(추측 금지), tickers는 관련 종목 없으면 빈 배열, 발언/인용이 핵심인 항목은 quote 채우기.

수치 정확성: overview와 markets.us/kr.reason 등 모든 서술 텍스트에는 구체적인 지수 수치(예: 나스닥 26,000)나 정확한 등락률 %를 절대 쓰지 마세요. 방향(상승/하락/혼조)과 원인만 서술하세요. 정확한 지수 수치는 앱이 별도로 실시간 표시하므로, 텍스트에 숫자를 넣으면 실제와 어긋나 혼선을 줍니다.

매우 중요(JSON 안정성): 문자열 값 안에서는 절대 큰따옴표(")를 쓰지 마세요. 인용·강조가 필요하면 작은따옴표(') 또는 「」 를 사용하세요. 줄바꿈/탭 없이 한 줄 문자열로 작성하세요.`;

// Gemini 텍스트 응답에서 JSON 추출 + 불완전 JSON 복구 (공유 헬퍼)
function parseGeminiJson(textContent) {
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  // grounding이 JSON 앞뒤에 붙이는 prose/인용 제거: 첫 { 또는 [ 부터 마지막 } 또는 ] 까지 슬라이스
  { const fb = jsonStr.indexOf("{"), fbk = jsonStr.indexOf("[");
    let st = (fb >= 0 && fbk >= 0) ? Math.min(fb, fbk) : Math.max(fb, fbk);
    if (st > 0) jsonStr = jsonStr.substring(st);
    const lb = jsonStr.lastIndexOf("}"), lbk = jsonStr.lastIndexOf("]");
    const en = Math.max(lb, lbk);
    if (en >= 0 && en < jsonStr.length - 1) jsonStr = jsonStr.substring(0, en + 1); }
  // 문자열 값 안의 raw 제어문자(줄바꿈/탭 등)로 인한 파싱 실패 방지 — JSON 구조 공백은 무해
  jsonStr = jsonStr.replace(/[\u0000-\u001F]/g, " ");
  try {
    return JSON.parse(jsonStr);
  } catch (parseErr) {
    let fixed = jsonStr;
    const lastQuote = fixed.lastIndexOf('"');
    const afterLast = fixed.substring(lastQuote + 1).trim();
    if (afterLast === '' || afterLast.match(/^[^"\]}]*$/)) fixed = fixed.substring(0, lastQuote + 1);
    const opens = (fixed.match(/[\[{]/g) || []).length;
    const closes = (fixed.match(/[\]}]/g) || []).length;
    for (let i = 0; i < opens - closes; i++) {
      const lastOpen = Math.max(fixed.lastIndexOf('['), fixed.lastIndexOf('{'));
      fixed += fixed[lastOpen] === '[' ? ']' : '}';
    }
    return JSON.parse(fixed); // 실패 시 호출부에서 처리
  }
}

// 깨진 JSON에서 item 객체들만 개별 추출 (escape 안 된 따옴표 등으로 전체 파싱 실패 시 폴백)
function salvageItems(text) {
  const found = [];
  const stack = [];
  let inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") stack.push(i);
    else if (c === "}") {
      const s = stack.pop();
      if (s != null) {
        const chunk = text.substring(s, i + 1).replace(/[-]/g, " ");
        try {
          const o = JSON.parse(chunk);
          if (o && typeof o === "object" && o.title && o.category) found.push(o);
        } catch (e) { /* 개별 항목 실패는 무시 */ }
      }
    }
  }
  // 제목 기준 중복 제거
  const seen = new Set(); const out = [];
  for (const it of found) { const k = it.title; if (!seen.has(k)) { seen.add(k); out.push(it); } }
  return out;
}

// 깨진 JSON에서 조건(pred)을 만족하는 객체만 개별 추출 (범용)
function salvageObjects(text, pred) {
  const found = []; const stack = []; let inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") stack.push(i);
    else if (c === "}") {
      const s = stack.pop();
      if (s != null) {
        const chunk = text.substring(s, i + 1).replace(/[ -]/g, " ");
        try { const o = JSON.parse(chunk); if (pred(o)) found.push(o); } catch (e) { /* 무시 */ }
      }
    }
  }
  return found;
}

async function callGeminiHotIssues(apiKey, symbols = [], realCtx = "", session = "", brief = {}) {
  let prompt = HOT_PROMPT;
  const windowHours = brief.windowHours || 24;
  // 세션: 오전 6:30 = 미국 마감 브리핑(미국 중심) / 오후 3:30 = 한국 마감 브리핑(한국 중심)
  if (session === "US") {
    prompt += `\n\n[세션] 지금은 오전 6시반 '미국 마감 브리핑'입니다. 전일 오후 3시 30분(약 ${windowHours}시간 전) 이후 발생한 뉴스만 다루세요 — 그 이전 뉴스는 직전 브리핑에서 이미 다뤘습니다(items의 hours_ago가 ${windowHours}을 넘으면 안 됩니다). 방금 마감한 미국 정규장에서 시장을 움직인 핵심 뉴스·실적·발언을 우선하세요. overview·markets·sectors·items를 모두 미국 시장 중심으로 작성하세요. markets.kr은 dir을 'mixed', reason을 빈 문자열("")로 두어 한국 시장 서술은 생략합니다. 단, 시장에 영향을 준 중요한 해외/글로벌 이슈(지정학·무역·타 지역 급변 등)가 있으면 items에 반드시 포함하세요. overview의 마지막 문장은 간밤 미국장 결과를 바탕으로 '오늘 한국장 관전 포인트'로 마무리하세요.`;
  } else if (session === "KR") {
    prompt += `\n\n[세션] 지금은 오후 3시 30분 '한국 마감 브리핑'입니다. 오늘 오전 6시 30분(약 ${windowHours}시간 전) 이후 발생한 뉴스만 다루세요 — 간밤 미국장 뉴스는 오전 브리핑에서 이미 다뤘으므로 반복 금지입니다(items의 hours_ago가 ${windowHours}을 넘으면 안 됩니다). overview·markets·sectors·items를 한국 시장 중심으로 작성하세요: 방금 마감한 코스피/코스닥 시황과 주도 업종·수급(외국인/기관), 국내 정책·주요 기업 이슈, 원/달러 환율, 아시아 증시(닛케이/항셍) 흐름. items는 한국·아시아 이슈를 우선하되 오늘 장중 새로 발생한 글로벌 속보(지정학·미 선물 급변 등)도 포함하세요. sectors는 한국 시장 업종 기준으로 작성하세요. markets.us는 미국 선물/프리마켓 특이사항이 있으면 그것을 쓰고, 없으면 dir을 'mixed', reason을 빈 문자열("")로 두세요. overview의 마지막 문장은 '오늘 밤 미국장 관전 포인트'로 마무리하세요.`;
  }
  // 실제 수집한 최신 헤드라인 주입 — 검색 grounding의 '옛날 기사' 문제 차단, 1차 소스로 사용
  if (brief.headlineCtx) {
    prompt += `\n\n[실제 최신 헤드라인 — 1차 소스] 아래는 신뢰할 수 있는 매체에서 방금 수집한 실제 최신 헤드라인 목록입니다. items는 이 목록에서 시장 영향이 큰 뉴스를 우선 선별해 구성하고, Google 검색은 선별한 뉴스의 배경·상세·인용 보강용으로만 사용하세요. 목록에 없는 뉴스를 검색으로 추가하려면 발생 시각이 위 세션 시간창 이내인 중대 속보일 때만 허용됩니다.\n${brief.headlineCtx}`;
  }
  // 직전 브리핑과의 중복 금지
  if (brief.prevTitles && brief.prevTitles.length) {
    prompt += `\n\n[직전 브리핑에서 이미 다룬 항목 — 반복 금지] 아래와 같은 내용의 뉴스는 items에 다시 넣지 마세요. 단, 새로운 전개(후속 결과·공식 발표·시장 반응 반전)가 있으면 무엇이 '새 소식'인지 title/summary에 명시하고 포함할 수 있습니다.\n${brief.prevTitles.map((t) => "- " + t).join("\n")}`;
  }
  // 실측 섹터 등락 주입 — 서사 방향을 실제와 일치시킴
  if (realCtx) {
    prompt += `\n\n[실측 데이터 — 반드시 준수] ${realCtx}\nsectors[]의 dir(방향)과 reason은 위 실제 등락과 반드시 일치해야 합니다. 실제로 오른 섹터를 내렸다고 쓰지 마세요. 각 섹터가 왜 그 방향으로 움직였는지(간밤 미국장 실적·뉴스·금리·유가 등)를 이유로 설명하세요.`;
  }
  // 보유 종목이 주어지면 종목별 '오늘 등락 이유'를 한국어로 분석하도록 프롬프트에 주입
  if (symbols && symbols.length) {
    prompt += `\n\n추가 작업: 다음 보유 종목 각각에 대해 '오늘(또는 최근 거래일) 주가가 오른/내린 이유'를 한국어 1~2문장으로 명확히 분석해, 최상위 "holdings_analysis" 객체에 {"<티커>":"<상승 또는 하락 + 핵심 원인>"} 형태로 포함하세요. 방향(상승/하락)을 반드시 밝히고 구체적 원인을 쓰세요. 대상 종목: ${symbols.join(", ")}`;
  }
  let lastErr = "unknown";
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await callGeminiWithFallback(apiKey, {
      system_instruction: { parts: [{ text: "You are a JSON API. Output ONLY valid JSON. Never output text, markdown, or explanations. Inside string values, never use double quotes." }] },
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 10000 },
    });
    let textContent = "";
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    if (parts) { for (const part of parts) { if (part.text) textContent += part.text; } }
    if (!textContent) { lastErr = "No text content"; continue; }

    let result = null;
    try { result = parseGeminiJson(textContent); }
    catch (e) {
      // 1차 시도 파싱 실패 → 전체 재시도 (부분 복구는 overview·markets·sectors를 잃음)
      if (attempt === 0) { lastErr = e.message + " | Raw: " + textContent.substring(0, 300); continue; }
      // 최종 시도도 실패 → 항목 단위 살리기 + 상단 필드 최대 복구
      const items = salvageItems(textContent);
      if (items.length) {
        result = { items: items };
        const om = textContent.match(/"overview"\s*:\s*"([^"]{20,})"/);
        if (om) result.overview = om[1];
        const secs = salvageObjects(textContent, (o) => o && o.name && (o.dir === "up" || o.dir === "down") && o.reason !== undefined && !o.title);
        if (secs.length) result.sectors = secs.slice(0, 5);
        const quads = salvageObjects(textContent, (o) => o && o.current >= 1 && o.current <= 4 && o.summary);
        if (quads.length) result.quad = quads[0];
      }
      else { lastErr = e.message + " | Raw: " + textContent.substring(0, 300); continue; }
    }

    if (!Array.isArray(result.items)) result.items = [];
    if (result.items.length) {
      if (!result.timestamp) result.timestamp = new Date().toISOString();
      return result;
    }
    lastErr = "empty items";
  }
  throw new Error("Hot JSON parse failed: " + lastErr);
}

// --- 한글 종목 검색 변환 (별칭 사전 + 번역 폴백) ---

// 자주 쓰는 종목의 한글명 → 영문 검색어 (번역이 틀리기 쉬운 것 위주로 보정)
const KO_TICKER_ALIAS = {
  "애플": "Apple", "테슬라": "Tesla", "엔비디아": "NVIDIA", "마이크로소프트": "Microsoft",
  "마소": "Microsoft", "구글": "Alphabet", "알파벳": "Alphabet", "아마존": "Amazon",
  "메타": "Meta Platforms", "페이스북": "Meta Platforms", "넷플릭스": "Netflix",
  "팔란티어": "Palantir", "브로드컴": "Broadcom", "마이크론": "Micron", "인텔": "Intel",
  "퀄컴": "Qualcomm", "코인베이스": "Coinbase", "아이온큐": "IonQ", "리게티": "Rigetti",
  "슈퍼마이크로": "Super Micro Computer", "셀레스티카": "Celestica", "디즈니": "Disney",
  "스타벅스": "Starbucks", "나이키": "Nike", "보잉": "Boeing", "버크셔": "Berkshire Hathaway",
  "비자": "Visa", "마스터카드": "Mastercard", "제이피모건": "JPMorgan", "제이피모간": "JPMorgan",
  "뱅크오브아메리카": "Bank of America", "코스트코": "Costco", "월마트": "Walmart",
  "맥도날드": "McDonald's", "코카콜라": "Coca-Cola", "펩시": "PepsiCo", "화이자": "Pfizer",
  "일라이릴리": "Eli Lilly", "유나이티드헬스": "UnitedHealth", "엑슨모빌": "Exxon Mobil",
  "셰브론": "Chevron", "오라클": "Oracle", "세일즈포스": "Salesforce", "어도비": "Adobe",
  "AMD": "AMD", "에이엠디": "AMD", "우버": "Uber", "에어비앤비": "Airbnb", "스포티파이": "Spotify",
  "로블록스": "Roblox", "쇼피파이": "Shopify", "스노우플레이크": "Snowflake",
  "삼성전자": "Samsung Electronics", "현대차": "Hyundai Motor", "기아": "Kia",
  "네이버": "Naver", "카카오": "Kakao", "에스케이하이닉스": "SK hynix", "하이닉스": "SK hynix",
  "엘지에너지솔루션": "LG Energy Solution", "포스코": "POSCO",
  "비트코인": "Bitcoin", "이더리움": "Ethereum"
};

async function koreanToSearchTerm(q) {
  const key = q.trim();
  if (KO_TICKER_ALIAS[key]) return KO_TICKER_ALIAS[key];
  // 별칭에 없으면 번역 API로 폴백
  try {
    const res = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(key) + "&langpair=ko|en");
    const json = await res.json();
    const t = json && json.responseData && json.responseData.translatedText ? json.responseData.translatedText.trim() : "";
    // 번역 실패/무의미 응답이면 원문 유지
    if (t && !/REQUEST NOT VALID/i.test(t)) return t.replace(/\s*Inc\.?$|\s*Corp\.?$/i, "").trim() || key;
  } catch (e) {}
  return key;
}

// --- Helper Functions (수학 계산) ---

function calculateSMA(data, period) {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

function calculateEMA(data, period) {
    if (data.length < period) return null;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = (data[i] * k) + (ema * (1 - k));
    }
    return ema; // 전체 데이터를 돌며 계산해야 정확함
}

function calculateRSI(data, period) {
    if (data.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // 첫 RSI 계산
    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // 이후 데이터로 RSI 스무딩
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        const currentGain = diff > 0 ? diff : 0;
        const currentLoss = diff < 0 ? Math.abs(diff) : 0;

        avgGain = ((avgGain * (period - 1)) + currentGain) / period;
        avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// --- ATR (Average True Range) 계산 함수 새로 추가 ---
function calculateATR(data, period) {
    if (data.length < period + 1) return null;

    let trArray = [];

    // 1. 매일의 True Range(TR) 계산
    // TR = Max(고가-저가, |고가-전일종가|, |저가-전일종가|)
    for (let i = 1; i < data.length; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = data[i - 1].close;

        const tr1 = high - low;
        const tr2 = Math.abs(high - prevClose);
        const tr3 = Math.abs(low - prevClose);

        const tr = Math.max(tr1, tr2, tr3);
        trArray.push(tr);
    }

    // 2. 첫 번째 ATR은 단순히 첫 period 동안의 TR 평균
    let sumTR = 0;
    for (let i = 0; i < period; i++) {
        sumTR += trArray[i];
    }
    let atr = sumTR / period;

    // 3. 웰스 와일더(Welles Wilder)의 스무딩 방식을 사용한 나머지 기간 ATR 계산
    for (let i = period; i < trArray.length; i++) {
        atr = ((atr * (period - 1)) + trArray[i]) / period;
    }

    return atr;
}
