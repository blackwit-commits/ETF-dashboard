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

    // 1. 주가 데이터 요청 (/price?ticker=TQQQ)
    if (path === "/price") {
      const ticker = url.searchParams.get("ticker");
      if (!ticker) return new Response("Ticker required", { status: 400, headers: corsHeaders });

      try {
        // 야후 파이낸스 차트 API 호출 (300일치, 일봉)
        const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=300d`;
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

        // 1. 등락률
        const change = ((currentPrice - prevClose) / prevClose) * 100;

        // 2. MA 200 (단순이동평균)
        const ma200 = calculateSMA(validCloses, 200);

        // 3. EMA 8 (지수이동평균)
        const ema8 = calculateEMA(validCloses, 8);

        // 4. RSI 14 (상대강도지수)
        const rsi = calculateRSI(validCloses, 14);

        // 5. ATR 14 (Average True Range) - 새로 추가됨!
        const atr = calculateATR(validData, 14);

        const result = {
          symbol: ticker,
          price: currentPrice,
          change: change,
          ma200: ma200 || currentPrice, // 데이터 부족시 현재가
          ema8: ema8 || currentPrice,
          rsi: rsi || 50,
          atr: atr // 계산된 ATR 값 응답에 포함
        };

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

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
        // 한글 쿼리는 야후가 지원하지 않으므로 영문으로 변환 (별칭 사전 → 번역 폴백)
        let term = q;
        if (/[가-힣]/.test(q)) {
          term = await koreanToSearchTerm(q);
        }

        const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false`;
        const resp = await fetch(yahooUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        const data = await resp.json();

        const list = (data.quotes || [])
          .filter(x => x.symbol && (x.quoteType === "EQUITY" || x.quoteType === "ETF"))
          .map(x => ({
            symbol: x.symbol,
            name: x.shortname || x.longname || "",
            type: x.quoteType,
            exchange: x.exchDisp || x.exchange || ""
          }));

        return new Response(JSON.stringify(list), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: jsonHeaders });
      }
    }

    // 2. 뉴스 데이터 요청 (/news) - 구글 뉴스 RSS 파싱
    if (path === "/news") {
        try {
            // Bing News RSS — 글로벌 주요 뉴스 (경제, 정치, 세계)
            const rssUrl = "https://www.bing.com/news/search?q=world+economy+geopolitics+trade+war+oil+inflation&format=rss";
            const resp = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (!resp.ok) {
                return new Response(JSON.stringify({error: "RSS fetch failed: " + resp.status}), { headers: {...corsHeaders, "Content-Type": "application/json"} });
            }
            const text = await resp.text();

            // XML 파싱: <item> 블록을 분리한 뒤 개별 필드 추출
            const items = [];
            const itemBlocks = text.split('<item>').slice(1);
            for (let block of itemBlocks) {
                if (items.length >= 10) break;
                const endIdx = block.indexOf('</item>');
                if (endIdx > 0) block = block.substring(0, endIdx);
                const titleMatch = block.match(/<title>(.*?)<\/title>/);
                const linkMatch = block.match(/<link>(.*?)<\/link>/);
                const dateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);
                if (titleMatch && linkMatch) {
                    items.push({
                        title: titleMatch[1].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
                        url: linkMatch[1],
                        date: dateMatch ? new Date(dateMatch[1]).toLocaleDateString() : ""
                    });
                }
            }

            return new Response(JSON.stringify(items), {
                 headers: { ...corsHeaders, "Content-Type": "application/json" }
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

      try {
        const macroResult = await callGeminiMacroAnalysis(env.GEMINI_API_KEY);
        return new Response(JSON.stringify(macroResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
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
      try {
        const hotResult = await callGeminiHotIssues(env.GEMINI_API_KEY);
        return new Response(JSON.stringify(hotResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
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

        const trim = (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []);
        const mapNews = x => ({
          headline: x.headline || "",
          source: x.source || "",
          url: x.url || "",
          datetime: x.datetime || 0,
          summary: (x.summary || "").substring(0, 200)
        });

        // 시장 일반 뉴스
        const marketResp = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
        const marketText = await marketResp.text();
        let marketRaw = [];
        try { marketRaw = JSON.parse(marketText); } catch (e) {}
        const market = trim(Array.isArray(marketRaw) ? marketRaw : [], 8).map(mapNews);

        // 보유 종목별 뉴스 (최근 7일)
        const now = new Date();
        const to = now.toISOString().slice(0, 10);
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const byTicker = {};
        await Promise.all(symbols.map(async (sym) => {
          try {
            const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(sym)}&from=${from}&to=${to}&token=${key}`);
            const raw = r.ok ? await r.json() : [];
            const news = trim(Array.isArray(raw) ? raw : [], 4).map(mapNews);
            if (news.length) byTicker[sym] = news;
          } catch (e) { /* 개별 종목 실패는 무시 */ }
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

        return new Response(JSON.stringify({ market, byTicker, sentiment, timestamp: new Date().toISOString() }), { headers: jsonHeaders });
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
        const symbols = parseBriefSymbols(url.searchParams.get("symbols") || env.WATCH_TICKERS);
        const tg = await pushBriefing(env, symbols);
        return new Response(JSON.stringify({ ok: tg.ok, desc: tg.description || "" }), { headers: jsonHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
      }
    }

    return new Response("UMT API Worker is Running", { headers: corsHeaders });
  },

  // Cron 트리거: 마켓 브리핑을 텔레그램으로 푸시 (wrangler.toml [triggers] crons)
  async scheduled(event, env, ctx) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
    ctx.waitUntil((async () => {
      try {
        const symbols = parseBriefSymbols(env.WATCH_TICKERS);
        await pushBriefing(env, symbols);
      } catch (e) { /* 실패는 조용히 무시 — 다음 트리거에 재시도 */ }
    })());
  },
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

async function fetchQuoteBrief(symbol) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const d = await r.json();
    const meta = d.chart.result[0].meta;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose != null ? meta.chartPreviousClose : meta.previousClose;
    const chg = (prev && price) ? ((price - prev) / prev) * 100 : 0;
    return { price, chg };
  } catch (e) { return null; }
}
async function fetchMarketSnapshot() {
  const [sp, ndx, vix] = await Promise.all([fetchQuoteBrief("^GSPC"), fetchQuoteBrief("^IXIC"), fetchQuoteBrief("^VIX")]);
  return { sp, ndx, vix };
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
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        title: { display: true, text: "섹터 당일 등락률 (%)", color: "#e2e8f0", font: { size: 16 } },
        datalabels: { anchor: "end", align: "end", color: "#e2e8f0", formatter: (v) => (v >= 0 ? "+" : "") + v + "%" }
      },
      scales: {
        x: { grid: { color: "#334155" }, ticks: { color: "#94a3b8" } },
        y: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { size: 13 } } }
      }
    }
  };
  return `https://quickchart.io/chart?bkg=%230f172a&w=540&h=${120 + sectors.length * 38}&v=4&c=${encodeURIComponent(JSON.stringify(config))}`;
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
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        title: { display: true, text: "당일 등락률 (%)", color: "#e2e8f0", font: { size: 16 } },
        datalabels: { anchor: "end", align: "end", color: "#e2e8f0", formatter: (v) => (v >= 0 ? "+" : "") + v + "%" }
      },
      scales: {
        x: { grid: { color: "#334155" }, ticks: { color: "#94a3b8" } },
        y: { grid: { display: false }, ticks: { color: "#e2e8f0", font: { size: 13 } } }
      }
    }
  };
  const c = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?bkg=%230f172a&w=520&h=${120 + rows.length * 42}&v=4&c=${c}`;
}

// 텔레그램 HTML 모드 이스케이프 (& < > 만)
function tgEscape(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  if (chartUrl) await sendTelegramPhoto(env, chartUrl, "📊 <b>시장 스냅샷</b> · 당일 등락률");
  if (sectorChartUrl) await sendTelegramPhoto(env, sectorChartUrl, "🗺️ <b>섹터 히트맵</b> · 전체 시장 폭");
  return await sendTelegramChunks(env, text);
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

수집 우선순위:
1. 트럼프 대통령의 발언/포스팅 (관세, 연준, 무역, 지정학 등 시장 영향)
2. 연준(Fed) 인사 발언, FOMC, 금리 관련 코멘트
3. 지정학 이벤트 (전쟁, 분쟁, 제재, 선거)
4. 블룸버그/로이터/CNBC 등 주요 매체의 시장 영향 헤드라인
5. 주요 빅테크/대형주 실적·뉴스

CRITICAL: 오직 유효한 JSON만 출력하세요. 마크다운/설명/사과 없이 { 로 시작해 } 로 끝나야 합니다.

JSON 스키마:
{"quad":{"current":<1-4>,"name":"<골디락스|과열|스태그플레이션|침체>","summary":"<현재 성장·인플레 국면을 1문장으로>"},"overview":"<오늘 시장 전반의 흐름을 꿰는 3~4문장 내러티브. 개별 뉴스 나열이 아니라 '무엇이 시장을 주도하고 있고(주도 테마), 위험 요인은 무엇이며, 투자자 분위기(위험선호/회피)는 어떤지'를 이야기하듯 연결해서 서술. 지수 방향과 금리·유가·달러 등 매크로 맥락 포함>","upcoming":[{"date":"<M/D>","name":"<이벤트명, 예: 미 CPI 발표 / FOMC / 엔비디아 실적>","importance":"<high|medium|low>"}],"items":[{"category":"<trump|fed|geopolitics|market|earnings|policy>","source":"<출처 매체/인물>","time":"<상대 시간, 예: 2시간 전 / 오늘 오전>","severity":"<high|medium|low>","title":"<한글 제목>","summary":"<한글 2~3문장 상세 요약, 배경과 영향까지>","quote":"<핵심 원문 발언 한 줄, 없으면 빈 문자열>","tickers":["<영향 받는 미국 티커>"],"direction":"<bullish|bearish|neutral>","url":"<실제 출처 URL>"}],"timestamp":"<ISO8601>"}

규칙: quad는 Hedgeye식 4국면 판정(1=골디락스 성장↑인플레↓, 2=과열 성장↑인플레↑, 3=스태그 성장↓인플레↑, 4=침체 성장↓인플레↓). overview는 반드시 채울 것(전체를 꿰는 내러티브). upcoming은 향후 7일 내 핵심 경제지표·실적·정책 일정 3~5개(없으면 빈 배열). items 6~8개, 최근 24시간 우선, severity 높은 순+최신 순 정렬, url은 검색으로 찾은 실제 링크만(추측 금지), tickers는 관련 종목 없으면 빈 배열, 발언/인용이 핵심인 항목은 quote 채우기.

매우 중요(JSON 안정성): 문자열 값 안에서는 절대 큰따옴표(")를 쓰지 마세요. 인용·강조가 필요하면 작은따옴표(') 또는 「」 를 사용하세요. 줄바꿈/탭 없이 한 줄 문자열로 작성하세요.`;

// Gemini 텍스트 응답에서 JSON 추출 + 불완전 JSON 복구 (공유 헬퍼)
function parseGeminiJson(textContent) {
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
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

async function callGeminiHotIssues(apiKey, symbols = []) {
  // 보유 종목이 주어지면 종목별 '오늘 등락 이유'를 한국어로 분석하도록 프롬프트에 주입
  const prompt = HOT_PROMPT + (symbols && symbols.length
    ? `\n\n추가 작업: 다음 보유 종목 각각에 대해 '오늘(또는 최근 거래일) 주가가 오른/내린 이유'를 한국어 1~2문장으로 명확히 분석해, 최상위 "holdings_analysis" 객체에 {"<티커>":"<상승 또는 하락 + 핵심 원인>"} 형태로 포함하세요. 방향(상승/하락)을 반드시 밝히고 구체적 원인을 쓰세요. 대상 종목: ${symbols.join(", ")}`
    : "");
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
      // 전체 파싱 실패 → 항목 단위 살리기
      const items = salvageItems(textContent);
      if (items.length) result = { items: items };
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
