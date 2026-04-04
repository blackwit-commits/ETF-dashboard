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
            const rssUrl = "https://news.google.com/rss/search?q=stock+market+finance&hl=en-US&gl=US&ceid=US:en";
            const resp = await fetch(rssUrl);
            const text = await resp.text();

            // 간단한 Regex로 XML -> JSON 변환 (라이브러리 없이)
            const items = [];
            const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                items.push({
                    title: match[1].replace("<![CDATA[", "").replace("]]>", ""),
                    url: match[2],
                    date: new Date(match[3]).toLocaleDateString()
                });
                if(items.length >= 10) break; // 10개만
            }

            return new Response(JSON.stringify(items), {
                 headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch(e) {
            return new Response(JSON.stringify([]), { headers: corsHeaders });
        }
    }

    // 3. 매크로 분석 요청 (/macro) - Claude API 웹서치로 Quad 판정 + 뉴스 브리핑
    if (path === "/macro") {
      if (!env.CLAUDE_API_KEY) {
        return new Response(JSON.stringify({ error: "CLAUDE_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        const macroResult = await callClaudeMacroAnalysis(env.CLAUDE_API_KEY);
        return new Response(JSON.stringify(macroResult), {
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

// --- Claude API 매크로 분석 ---

const MACRO_SYSTEM_PROMPT = `당신은 Hedgeye 스타일의 매크로 경제 분석 전문가입니다.
경제를 성장(Growth)과 인플레이션(Inflation) 두 축의 방향(가속/감속)으로 4국면(Quad)을 판정합니다.

Quad 정의:
- Quad 1 (골디락스): 성장 가속 + 인플레 감속. 성장주/테크 강세, 금리 인하 기대.
- Quad 2 (과열): 성장 가속 + 인플레 가속. 원자재/에너지/금 강세, 인플레 우려.
- Quad 3 (스태그플레이션): 성장 감속 + 인플레 가속. 금/인버스만 버팀, Fed 딜레마.
- Quad 4 (침체/디플레): 성장 감속 + 인플레 감속. 채권/달러 강세, 금리 인하 사이클.

ETF 유니버스 (20개):
- Quad 1 수혜: TQQQ(나스닥3x), SOXL(반도체3x), TNA(소형주3x), SPXL(S&P500 3x)
- Quad 2 수혜: NRGU(에너지3x), GUSH(시추2x), NUGT(금광2x), DRN(리츠3x)
- Quad 3 수혜: GLD(금1x), UGL(금2x), GDXU(금광3x), SQQQ(나스닥인버스-3x)
- Quad 4 수혜: TMF(장기국채3x), CURE(헬스케어3x), UUP(달러1x)
- 특수: UVXY(VIX헤지), BITX(비트코인2x)
- 전Quad공용: UDOW(다우3x), FAS(금융3x), LABU(바이오3x)

웹 검색을 활용하여 최신 데이터를 수집하고, 반드시 아래 JSON 구조로만 응답하세요. JSON 외의 텍스트는 포함하지 마세요.`;

const MACRO_USER_PROMPT = `오늘 날짜 기준으로 최신 경제 데이터를 웹 검색하여 Quad 판정을 수행하세요.

수집할 데이터:
1. 성장 지표: GDP 성장률, ISM 제조업/서비스업 PMI, 비농업고용(NFP), 실업수당청구, 소매판매
2. 인플레 지표: CPI/Core CPI, PCE/Core PCE, PPI, 평균시급, 유가/원자재
3. 정책: 현재 기준금리, CME FedWatch 금리인하 확률, Fed 발언 톤
4. 시장 데이터: WTI 유가, 금 가격, DXY(달러인덱스), 미국 10년물 금리, VIX
5. 이벤트: 지정학 리스크, 관세/무역, 주요 이슈, 향후 1~2주 경제지표 발표 일정
6. 시장에 영향을 주는 주요 뉴스 3~5개 (각각 심층분석 포함)

다음 JSON 구조로 정확히 응답하세요:
{
  "quad": {
    "current": <1|2|3|4>,
    "name": "<골디락스|과열|스태그플레이션|침체>",
    "growth": "<accelerating|decelerating>",
    "inflation": "<accelerating|decelerating>",
    "confidence": <50~100 정수>,
    "transition_risk": {
      "to_quad1": <0~100>,
      "to_quad2": <0~100>,
      "to_quad3": <0~100>,
      "to_quad4": <0~100>
    }
  },
  "indicators": {
    "growth": [
      {"name": "<지표명>", "value": "<수치>", "direction": "<up|down|flat>", "impact": "<한줄 해석>"}
    ],
    "inflation": [
      {"name": "<지표명>", "value": "<수치>", "direction": "<up|down|flat>", "impact": "<한줄 해석>"}
    ],
    "policy": {
      "current_rate": "<현재 기준금리>",
      "next_cut_prob": <0~100>,
      "fed_tone": "<hawkish|dovish_leaning|neutral|dovish|hawkish_leaning>"
    }
  },
  "market_data": {
    "wti": {"value": <숫자>, "change": <등락%>},
    "gold": {"value": <숫자>, "change": <등락%>},
    "dxy": {"value": <숫자>, "change": <등락%>},
    "us10y": {"value": <숫자>, "change": <등락bp>},
    "vix": {"value": <숫자>, "change": <등락>}
  },
  "events": {
    "overlay": [
      {"type": "<geopolitical|tariff|banking|tech|policy>", "severity": "<high|medium|low>", "title": "<제목>", "impact": "<영향>"}
    ],
    "upcoming": [
      {"date": "<M/D>", "name": "<이벤트명>", "importance": "<high|medium|low>"}
    ]
  },
  "news": [
    {
      "level": "<red|yellow|green>",
      "title": "<뉴스 제목>",
      "summary": "<3줄 요약>",
      "etf_impact": {
        "bullish": ["<수혜 ETF 티커>"],
        "bearish": ["<리스크 ETF 티커>"],
        "hedge": ["<헤지 ETF 티커>"]
      },
      "deep_analysis": {
        "situation": "<상황 상세 설명>",
        "historical_cases": [
          {"event": "<과거 유사 사례>", "market_move": "<시장 반응>", "duration": "<기간>", "market_impact": "<영향>"}
        ],
        "scenarios": [
          {"name": "<시나리오명>", "probability": <0~100>, "action": "<ETF 대응 조치>"}
        ],
        "monitor_points": ["<모니터링 포인트>"]
      }
    }
  ],
  "recommendations": {
    "buy": [{"ticker": "<ETF>", "mode": "<aggressive|balanced|defensive>", "reason": "<이유>"}],
    "hold": [{"ticker": "<ETF>", "status": "hold", "reason": "<이유>"}],
    "exit": [{"ticker": "<ETF>", "status": "exit", "reason": "<이유>"}]
  },
  "timestamp": "<ISO 8601>"
}

중요:
- 현재 Quad 번호에 해당하는 transition_risk는 0으로 설정
- news 배열은 3~5개, 각각 반드시 deep_analysis 포함
- 모든 ETF 티커는 우리 유니버스(TQQQ,SOXL,TNA,SPXL,NRGU,GUSH,NUGT,DRN,GLD,UGL,GDXU,SQQQ,TMF,CURE,UUP,UVXY,BITX,UDOW,FAS,LABU)에서만 사용
- 뉴스 level: red=보유종목 직접 영향/긴급, yellow=Quad 전환 가능성, green=참고/배경정보
- JSON만 출력, 다른 텍스트 없이`;

async function callClaudeMacroAnalysis(apiKey) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2025-01-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: MACRO_SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 10,
        }
      ],
      messages: [
        { role: "user", content: MACRO_USER_PROMPT }
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  // Claude 응답에서 text 블록 추출
  let textContent = "";
  if (data.content && Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }
  }

  if (!textContent) {
    throw new Error("No text content in Claude response");
  }

  // JSON 파싱 (코드블록 래핑 제거)
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const result = JSON.parse(jsonStr);

  // timestamp 보정
  if (!result.timestamp) {
    result.timestamp = new Date().toISOString();
  }

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
