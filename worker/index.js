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

    return new Response("UMT API Worker is Running", { headers: corsHeaders });
  },
};

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
