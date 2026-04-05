const API_BASE_URL = "https://fragrant-sunset-6230.hansung-aee.workers.dev";

const ETF_DB = [
    // ── Quad 1 수혜 (성장↑ 인플레↓) ──
    {sym:'TQQQ', lev:'3x', tier:2, quad:[1],     name:'UltraPro QQQ',  desc:'나스닥 100',    holdings:'AAPL • MSFT • NVDA'},
    {sym:'SOXL', lev:'3x', tier:1, quad:[1],     name:'Semi Bull',     desc:'반도체 지수',   holdings:'NVDA • AVGO • AMD'},
    {sym:'TNA',  lev:'3x', tier:1, quad:[1],     name:'Small Cap',     desc:'러셀 2000',    holdings:'IWM Index Swap'},
    {sym:'SPXL', lev:'3x', tier:2, quad:[1],     name:'S&P500 Bull',   desc:'S&P 500',     holdings:'SPY Index Swap'},
    // ── Quad 2 수혜 (성장↑ 인플레↑) ──
    {sym:'NRGU', lev:'3x', tier:2, quad:[2],     name:'Big Oil',       desc:'대형 에너지',   holdings:'XOM • CVX • COP'},
    {sym:'GUSH', lev:'2x', tier:1, quad:[2],     name:'Oil Explore',   desc:'시추/탐사',    holdings:'Exploration & Prod'},
    {sym:'NUGT', lev:'2x', tier:1, quad:[2],     name:'Gold Miners',   desc:'금광업체',     holdings:'Newmont • Barrick'},
    {sym:'DRN',  lev:'3x', tier:2, quad:[2],     name:'Real Estate',   desc:'리츠(부동산)', holdings:'PLD • AMT • EQIX'},
    // ── Quad 3 수혜 (성장↓ 인플레↑) ──
    {sym:'GLD',  lev:'1x', tier:4, quad:[3],     name:'SPDR Gold',     desc:'금 현물',      holdings:'Gold Bullion'},
    {sym:'UGL',  lev:'2x', tier:3, quad:[3],     name:'Gold 2x',       desc:'금 2배',       holdings:'Gold Futures'},
    {sym:'GDXU', lev:'3x', tier:1, quad:[3],     name:'Gold Miners 3x',desc:'금광주 3배',   holdings:'GDX Index Swap'},
    {sym:'SQQQ', lev:'-3x',tier:1, quad:[3],     name:'Short QQQ',     desc:'나스닥 인버스', holdings:'QQQ Short'},
    // ── Quad 4 수혜 (성장↓ 인플레↓) ──
    {sym:'TMF',  lev:'3x', tier:2, quad:[4],     name:'Treasury 3x',   desc:'장기국채 3배',  holdings:'20+ Year Treasury'},
    {sym:'CURE', lev:'3x', tier:2, quad:[4],     name:'Healthcare',    desc:'헬스케어',     holdings:'UNH • JNJ • LLY'},
    {sym:'UUP',  lev:'1x', tier:4, quad:[4],     name:'Dollar Index',  desc:'달러 인덱스',   holdings:'DX Futures'},
    // ── 특수 목적 ──
    {sym:'UVXY', lev:'1.5x',tier:1, quad:[],     name:'VIX Short-Term',desc:'VIX 헤지',    holdings:'VIX Futures'},
    {sym:'BITX', lev:'2x', tier:1, quad:[],      name:'Bitcoin 2x',    desc:'비트코인',     holdings:'BTC Futures'},
    // ── 전 Quad 공용 ──
    {sym:'UDOW', lev:'3x', tier:3, quad:[1,2,3,4],name:'UltraPro Dow', desc:'다우존스',     holdings:'UNH • GS • MSFT'},
    {sym:'FAS',  lev:'3x', tier:2, quad:[1,2,3,4],name:'Financial',    desc:'금융 섹터',    holdings:'BRK.B • JPM • V'},
    {sym:'LABU', lev:'3x', tier:1, quad:[1,2,3,4],name:'Biotech',      desc:'바이오테크',   holdings:'XBI Index Swap'},
];

// Quad별 평균 조정폭 프리셋 (Phase 2에서 MDD 간격 차등에 사용)
const QUAD_PULLBACK = {
    TQQQ: {1:-8,  2:-15, 3:-30, 4:-22},
    SOXL: {1:-12, 2:-18, 3:-35, 4:-28},
    TNA:  {1:-10, 2:-16, 3:-32, 4:-25},
    SPXL: {1:-7,  2:-12, 3:-25, 4:-18},
    NRGU: {1:-14, 2:-10, 3:-20, 4:-25},
    GUSH: {1:-18, 2:-12, 3:-25, 4:-30},
    NUGT: {1:-15, 2:-12, 3:-18, 4:-20},
    DRN:  {1:-8,  2:-10, 3:-20, 4:-15},
    GLD:  {1:-4,  2:-5,  3:-6,  4:-8},
    UGL:  {1:-8,  2:-10, 3:-12, 4:-16},
    GDXU: {1:-18, 2:-15, 3:-20, 4:-25},
    SQQQ: {1:-25, 2:-18, 3:-10, 4:-15},
    TMF:  {1:-15, 2:-20, 3:-18, 4:-10},
    CURE: {1:-8,  2:-12, 3:-18, 4:-10},
    UUP:  {1:-3,  2:-4,  3:-5,  4:-3},
    UVXY: {1:-20, 2:-15, 3:-12, 4:-18},
    BITX: {1:-18, 2:-20, 3:-30, 4:-25},
    UDOW: {1:-5,  2:-8,  3:-18, 4:-12},
    FAS:  {1:-10, 2:-14, 3:-25, 4:-18},
    LABU: {1:-15, 2:-18, 3:-30, 4:-22},
};

// ETF 상세 정보 (바텀시트용)
const ETF_DETAIL = {
    TQQQ: {summary:'나스닥100 3배 레버리지. 테크 대장, 유동성 최고.', expense:'0.86%', bestQuad:[1], cautionQuad:[3,4], tip:'Quad1에서 RSI 40 이하 눌림목이 최적 진입점. 장기보유 시 변동성 손실(decay) 주의.'},
    SOXL: {summary:'반도체 지수 3배. AI/반도체 사이클 폭발력 최강.', expense:'0.76%', bestQuad:[1], cautionQuad:[3,4], tip:'반도체 실적 시즌에 강세. TQQQ와 상관관계 높아 동시 보유 주의.'},
    TNA:  {summary:'러셀2000 소형주 3배. 금리 인하 시 소형주 랠리.', expense:'0.95%', bestQuad:[1], cautionQuad:[3], tip:'금리 인하 기대감이 핵심 촉매. 소형주 특성상 변동성 극심.'},
    SPXL: {summary:'S&P500 3배. 시장 전체 베팅, 섹터 고민 없이.', expense:'0.90%', bestQuad:[1], cautionQuad:[3], tip:'가장 분산된 레버리지 ETF. 방향 확신은 있지만 섹터 모를 때 적합.'},
    NRGU: {summary:'대형 에너지 3배. 엑손/셰브론 중심 유가 추종.', expense:'0.95%', bestQuad:[2], cautionQuad:[4], tip:'유가 상승기에 안정적 수익. 지정학 이벤트 시 급등 가능.'},
    GUSH: {summary:'시추/탐사 2배. 유가 급등 시 폭발력 극대화.', expense:'1.01%', bestQuad:[2], cautionQuad:[4], tip:'중소형 시추업체 중심. 유가 $80+ 구간에서 강세.'},
    NUGT: {summary:'금광업체 2배. 금 오를 때 금광주는 더 오름.', expense:'1.05%', bestQuad:[2,3], cautionQuad:[1], tip:'금 가격 + 채굴 비용 마진이 핵심. 금 $2000+ 에서 수혜.'},
    DRN:  {summary:'리츠(부동산) 3배. 성장기 임대수익 강세.', expense:'0.95%', bestQuad:[2], cautionQuad:[4], tip:'금리 하락기에 유리. 상업용 부동산 경기에 민감.'},
    GLD:  {summary:'금 현물 ETF. 안전자산 1순위, 변동성 낮음.', expense:'0.40%', bestQuad:[3], cautionQuad:[1], tip:'포트폴리오 헤지용. 위기 시 무조건 편입. 장기보유 적합.'},
    UGL:  {summary:'금 2배 레버리지. 금 확신 시 2배 베팅.', expense:'0.95%', bestQuad:[3], cautionQuad:[1], tip:'GLD 대비 2배 수익/손실. 중기 금 상승 확신 시 사용.'},
    GDXU: {summary:'금광주 3배. 금 급등 시 최대 수익, 변동성 극심.', expense:'1.05%', bestQuad:[3], cautionQuad:[1], tip:'금 가격 레버리지 + 기업 레버리지 이중 효과. 단기 트레이딩 전용.'},
    SQQQ: {summary:'나스닥 인버스 3배. 시장 하락에 직접 수익.', expense:'0.95%', bestQuad:[3], cautionQuad:[1,2], tip:'하락장 단기 헤지 전용. 장기보유 금지 (일일 리밸런싱 손실).'},
    TMF:  {summary:'장기국채 20년+ 3배. 금리 인하 사이클 최대 수혜.', expense:'1.04%', bestQuad:[4], cautionQuad:[2,3], tip:'금리 인하 확정 시 폭발적 수익. 금리 인상기엔 손실 극심.'},
    CURE: {summary:'헬스케어 3배. 경기방어주, 침체에도 실적 유지.', expense:'0.95%', bestQuad:[4], cautionQuad:[], tip:'경기 둔화기 방어 자산. FDA 승인/규제 이벤트에 영향.'},
    UUP:  {summary:'달러 인덱스 ETF. 위기 시 달러 강세, 저변동성.', expense:'0.78%', bestQuad:[4], cautionQuad:[1], tip:'현금 대안. 포트폴리오 변동성 낮출 때 편입.'},
    UVXY: {summary:'VIX 1.5배. 급락 헤지 전용, 장기보유 금지.', expense:'0.74%', bestQuad:[], cautionQuad:[], tip:'시장 급락 시 급등. 보험 성격으로 소량만. 매일 가치 하락(decay).'},
    BITX: {summary:'비트코인 2배 레버리지. 크립토 사이클 추종.', expense:'1.85%', bestQuad:[], cautionQuad:[], tip:'유동성 장세에서 강세. 규제/해킹 리스크 상존. 높은 운용보수 주의.'},
    UDOW: {summary:'다우존스 3배. 가치주 중심, 안정적 레버리지.', expense:'0.95%', bestQuad:[1,2,3,4], cautionQuad:[], tip:'섹터 분산 양호. 어떤 Quad에서도 중립적 선택.'},
    FAS:  {summary:'금융 3배. 은행/보험, 금리 환경에 민감.', expense:'0.95%', bestQuad:[1,2,3,4], cautionQuad:[], tip:'금리 상승기에 은행 마진 개선. 은행 위기 시 급락 주의.'},
    LABU: {summary:'바이오 3배. FDA 승인 등 이벤트 드리븐.', expense:'1.09%', bestQuad:[1,2,3,4], cautionQuad:[], tip:'개별 종목 이벤트에 좌우됨. Quad보다 FDA 일정이 더 중요.'},
};

// 상관관계 매트릭스 (높은 상관관계 쌍만 정의, 0.7 이상)
const CORRELATION_MAP = {
    TQQQ: {SOXL:0.85, SPXL:0.92, TNA:0.75},
    SOXL: {TQQQ:0.85, SPXL:0.78},
    SPXL: {TQQQ:0.92, SOXL:0.78, UDOW:0.88, TNA:0.82},
    TNA:  {TQQQ:0.75, SPXL:0.82},
    NRGU: {GUSH:0.90},
    GUSH: {NRGU:0.90},
    NUGT: {GLD:0.72, UGL:0.75, GDXU:0.88},
    GLD:  {UGL:0.98, NUGT:0.72, GDXU:0.70},
    UGL:  {GLD:0.98, NUGT:0.75, GDXU:0.72},
    GDXU: {NUGT:0.88, GLD:0.70, UGL:0.72},
    UDOW: {SPXL:0.88, FAS:0.72},
    FAS:  {UDOW:0.72},
};

let NEWS_FEED = [];
let globalData = null;
let portfolios = null;
let MARKET_SNAPSHOT = {};
let MACRO_DATA = null; // /macro 응답 캐싱
let tvWidget = null;
let activeTicker = null;
let selectedScanTicker = null;
let tempTickerToAdd = null;
let modalWidget = null;
let currentChartSym = null;
let SYNC_URL = "";
let _translateCache = {};

// ==========================================
// Macro API 호출 + localStorage 캐싱 (하루 1~2회)
// ==========================================
const MACRO_CACHE_KEY = 'umt_macro_cache';
const MACRO_CACHE_TTL = 12 * 60 * 60 * 1000; // 12시간

function getMacroCacheAge() {
    const raw = localStorage.getItem(MACRO_CACHE_KEY);
    if (!raw) return Infinity;
    try {
        const cached = JSON.parse(raw);
        if (!cached || !cached._cachedAt) return Infinity;
        return Date.now() - cached._cachedAt;
    } catch { return Infinity; }
}

function loadMacroFromCache() {
    const raw = localStorage.getItem(MACRO_CACHE_KEY);
    if (!raw) return null;
    try {
        const cached = JSON.parse(raw);
        if (!cached || !cached._cachedAt) return null;
        const age = Date.now() - cached._cachedAt;
        if (age > MACRO_CACHE_TTL) return null; // 만료
        return cached;
    } catch { return null; }
}

function saveMacroToCache(data) {
    data._cachedAt = Date.now();
    localStorage.setItem(MACRO_CACHE_KEY, JSON.stringify(data));
}

async function fetchMacroData(forceRefresh) {
    // 캐시 확인
    if (!forceRefresh) {
        const cached = loadMacroFromCache();
        if (cached) {
            MACRO_DATA = cached;
            console.log('[Macro] 캐시 사용 (나이: ' + Math.round(getMacroCacheAge() / 60000) + '분)');
            return cached;
        }
    }

    console.log('[Macro] API 호출 시작...');
    // 로딩 상태 표시
    var briefList = document.getElementById('newsBriefingList');
    if (briefList) briefList.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Gemini AI가 매크로 데이터를 분석 중입니다... (최대 60초)</div>';
    try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 120000);
        const resp = await fetch(API_BASE_URL + '/macro', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error('HTTP ' + resp.status + ': ' + errBody);
        }
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        MACRO_DATA = data;
        saveMacroToCache(data);
        console.log('[Macro] 데이터 수신 완료 — Quad ' + (data.quad && data.quad.current));
        return data;
    } catch (e) {
        console.error('[Macro] API 호출 실패:', e.message);
        var bl = document.getElementById('newsBriefingList');
        if (bl) bl.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs"><i class="fa-solid fa-triangle-exclamation mr-1"></i>매크로 분석 실패: ' + escapeHtml(e.message).substring(0,80) + '<br><button onclick="fetchMacroData(true).then(d=>{if(d)updateMacroDashboard()})" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>';
        // 만료된 캐시라도 폴백으로 사용
        const raw = localStorage.getItem(MACRO_CACHE_KEY);
        if (raw) {
            try {
                const stale = JSON.parse(raw);
                if (stale && stale.quad) {
                    MACRO_DATA = stale;
                    console.log('[Macro] 만료 캐시 폴백 사용');
                    return stale;
                }
            } catch {}
        }
        return null;
    }
}

function renderMacroStartButton() {
    var briefList = document.getElementById('newsBriefingList');
    if (briefList) {
        briefList.innerHTML = '<div class="glass-panel p-5 text-center">'
            + '<div class="text-slate-400 text-xs mb-3">매크로 데이터가 없습니다</div>'
            + '<button onclick="startMacroAnalysis()" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/30 transition transform active:scale-95">'
            + '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i>매크로 분석 시작</button>'
            + '<div class="text-slate-500 text-[10px] mt-2">Gemini AI가 실시간 경제 데이터를 분석합니다 (약 60초)</div>'
            + '</div>';
    }
    // Quad 대시보드에도 안내
    var lbl = document.getElementById('fgLabel');
    if (lbl) lbl.innerText = 'Quad 판정 대기';
    var dEl = document.getElementById('fgDesc');
    if (dEl) dEl.innerText = '아래 "매크로 분석 시작" 버튼을 눌러주세요';
}

function startMacroAnalysis() {
    fetchMacroData(true).then(function(data) {
        if (data) updateMacroDashboard();
        else renderMacroStartButton();
    });
}

function getCurrentQuad() {
    if (MACRO_DATA && MACRO_DATA.quad) return MACRO_DATA.quad.current;
    return null;
}

function getQuadName(q) {
    const names = { 1: '골디락스', 2: '과열', 3: '스태그플레이션', 4: '침체' };
    return names[q] || '판정 대기';
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function translateText(enText) {
    if (!enText || typeof enText !== 'string') return null;
    const key = enText.trim();
    if (!key) return null;
    if (_translateCache[key] !== undefined) return _translateCache[key];
    try {
        const res = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(key) + '&langpair=en|ko');
        const json = await res.json();
        const translated = json.responseData && json.responseData.translatedText ? json.responseData.translatedText.trim() : null;
        _translateCache[key] = translated || null;
        return _translateCache[key];
    } catch (e) {
        _translateCache[key] = null;
        return null;
    }
}

async function translateNewsTitles() {
    if (!Array.isArray(NEWS_FEED)) return;
    for (let i = 0; i < NEWS_FEED.length; i++) {
        const n = NEWS_FEED[i];
        if (n.title && !n.titleKo) {
            n.titleKo = await translateText(n.title) || undefined;
        }
    }
}

function refreshNewsTickerUI() {
    if (NEWS_FEED.length === 0) return;
    const display = document.getElementById('newsDisplay');
    const listEl = document.getElementById('fullNewsList');
    const currentIndex = (typeof window.newsTickerIndex === 'number') ? window.newsTickerIndex % NEWS_FEED.length : 0;
    function tickerHtml(item) {
        const ko = item.titleKo ? "<br><span class=\"text-[10px] text-slate-500\">" + escapeHtml(item.titleKo) + "</span>" : "";
        return "● " + escapeHtml(item.title) + ko;
    }
    if (listEl) {
        listEl.innerHTML = NEWS_FEED.map(n => {
            const koLine = n.titleKo ? '<div class="text-[10px] text-slate-500 mt-0.5">' + escapeHtml(n.titleKo) + '</div>' : '';
            var safeUrl = (n.url || '').replace(/'/g, '&#39;');
            return '<div class="p-3 bg-slate-800 rounded-xl border border-slate-700 mb-2 cursor-pointer hover:bg-slate-700 transition" onclick="window.open(\'' + safeUrl + '\', \'_blank\')"><div class="text-sm text-slate-200 font-bold leading-snug">' + escapeHtml(n.title) + ' <i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1 text-slate-500"></i></div>' + koLine + '</div>';
        }).join('');
    }
    if (display) {
        display.innerHTML = tickerHtml(NEWS_FEED[currentIndex]);
        display.onclick = () => window.open(NEWS_FEED[currentIndex].url, '_blank');
    }
}

function getUsdToKrwRate() { return (globalData && globalData.rate) ? globalData.rate : 1300; }
function formatKrw(usd) { if (usd == null || isNaN(usd)) return '\u20A90'; return '\u20A9' + Math.round(usd * getUsdToKrwRate()).toLocaleString(); }

function getPortfolioSummary() {
    const totalEquityBase = getTotalEquityUSD();
    let totalInvested = 0, totalMarketVal = 0, totalAllocated = 0;
    const byTicker = [];
    Object.keys(portfolios || {}).forEach(sym => {
        const p = portfolios[sym];
        const allocPct = p.config && (p.config.alloc != null) ? p.config.alloc : 0;
        const allocUsd = totalEquityBase * (allocPct / 100);
        const investedUsd = (p.qty || 0) * (p.avgPrice || 0);
        const currPrice = (p.marketData && p.marketData.price > 0) ? p.marketData.price : (p.avgPrice || 0);
        const marketVal = (p.qty || 0) * currPrice;
        totalInvested += investedUsd;
        totalMarketVal += marketVal;
        totalAllocated += allocUsd;
        const execRate = allocUsd > 0 ? Math.min(100, (investedUsd / allocUsd) * 100) : 0;
        byTicker.push({ sym, allocPct, allocUsd, investedUsd, execRate, qty: p.qty || 0, avgPrice: p.avgPrice || 0 });
    });
    let totalRealized = 0, totalUnrealized = 0;
    Object.values(portfolios || {}).forEach(p => {
        if (p.realizedPnL) totalRealized += p.realizedPnL;
        if (p.totalDiv) totalRealized += p.totalDiv;
        if (p.qty > 0) {
            const curr = (p.marketData && p.marketData.price > 0) ? p.marketData.price : p.avgPrice;
            totalUnrealized += (p.qty * curr) - (p.qty * p.avgPrice);
        }
    });
    const totalAssets = totalEquityBase + totalUnrealized;
    const totalCash = totalAssets - totalMarketVal;
    const overallExecRate = totalAssets > 0 ? Math.min(100, (totalInvested / totalAssets) * 100) : 0;
    return { totalAssets, totalInvested, totalCash, totalAllocated, overallExecRate, byTicker };
}

// ==========================================
// 🛡️ V25.1 핵심: 데이터 자동 청소기 (Sanitizer)
// 과거 찌꺼기 데이터로 인한 먹통(Freeze) 현상을 100% 차단합니다.
// ==========================================
function sanitizeData() {
    if (!globalData || typeof globalData !== 'object') {
        globalData = { seedKRW: 0, rate: 1300, sipKRW: 0, deposits: [], feeRate: 0.07, useSec: true, mddLimit: 25 };
    }
    if (!Array.isArray(globalData.deposits)) globalData.deposits = [];

    if (!portfolios || typeof portfolios !== 'object') portfolios = {};

    Object.keys(portfolios).forEach(sym => {
        let p = portfolios[sym];
        if (typeof p !== 'object') p = {};
        
        p.qty = p.qty || 0;
        p.avgPrice = p.avgPrice || 0;
        if (!Array.isArray(p.history)) p.history = [];
        
        if (!p.config || typeof p.config !== 'object') p.config = {};
        p.config.mode = p.config.mode || 'GRID';
        
        // 기존에 문자로 저장된 숫자들이 있다면 강제 변환
        p.config.stages = parseInt(p.config.stages) || 4;
        p.config.mdd = parseFloat(p.config.mdd) || 20;
        p.config.alloc = parseFloat(p.config.alloc) || 30;
        p.config.basePrice = parseFloat(p.config.basePrice) || 0;

        // 배열 구조가 깨졌거나, 단계 수와 배열 길이가 다르면 강제 초기화
        if (!Array.isArray(p.config.drops) || p.config.drops.length !== p.config.stages) {
            const gap = p.config.stages > 1 ? p.config.mdd / (p.config.stages - 1) : 0;
            p.config.drops = [];
            for (let i = 0; i < p.config.stages; i++) p.config.drops.push(parseFloat(-(gap * i).toFixed(2)));
        }

        if (!Array.isArray(p.config.weights) || p.config.weights.length !== p.config.stages) {
            p.config.weights = Array(p.config.stages).fill(Math.floor(100 / p.config.stages));
            for (let i = 0; i < (100 % p.config.stages); i++) p.config.weights[i]++;
        }

        // 3단계 매도 전략: sellPlans [ { targetPct, sellRatio }, ... ]
        const defaultSellPlans = [
            { targetPct: 10, sellRatio: 50 },
            { targetPct: 15, sellRatio: 50 },
            { targetPct: 20, sellRatio: 100 }
        ];
        if (!Array.isArray(p.config.sellPlans) || p.config.sellPlans.length !== 3) {
            const legacyPct = parseFloat(p.config.targetPct) || 10;
            const legacyRatio = parseFloat(p.config.targetSellRatio) || 50;
            p.config.sellPlans = [
                { targetPct: legacyPct, sellRatio: legacyRatio },
                { targetPct: defaultSellPlans[1].targetPct, sellRatio: defaultSellPlans[1].sellRatio },
                { targetPct: defaultSellPlans[2].targetPct, sellRatio: defaultSellPlans[2].sellRatio }
            ];
        }
        p.config.boosterOn = p.config.boosterOn === true;
        p.config.boosterAllocPct = parseFloat(p.config.boosterAllocPct) || 0;
        p.config.boosterStages = parseInt(p.config.boosterStages) || 2;
        p.config.boosterMdd = parseFloat(p.config.boosterMdd) || 10;

        for (let i = 0; i < 3; i++) {
            p.config.sellPlans[i] = {
                targetPct: parseFloat(p.config.sellPlans[i].targetPct) || defaultSellPlans[i].targetPct,
                sellRatio: parseFloat(p.config.sellPlans[i].sellRatio) || defaultSellPlans[i].sellRatio
            };
        }
        
        portfolios[sym] = p; 
    });
}

// ==========================================
// 🚀 앱 초기화
// ==========================================
function initApp() {
    try {
        // 1. 로컬 데이터 불러오기
        const savedG = localStorage.getItem('umt_v172_global');
        if(savedG) globalData = JSON.parse(savedG);
        const savedP = localStorage.getItem('umt_v172_ports');
        if(savedP) portfolios = JSON.parse(savedP);
        SYNC_URL = localStorage.getItem('umt_sync_url') || "";
        
        // 2. 과거 데이터 꼬임 방지 (백신 가동)
        sanitizeData();
        console.log('[DEBUG loadFromCloud] restored globalData', globalData);
        console.log('[DEBUG loadFromCloud] restored portfolios keys', Object.keys(portfolios || {}));
        Object.keys(portfolios || {}).forEach(sym => {
            const p = portfolios[sym];
            console.log('[DEBUG loadFromCloud] portfolio after restore', {
                sym,
                qty: p.qty,
                avgPrice: p.avgPrice,
                historyLength: Array.isArray(p.history) ? p.history.length : 0
            });
        });
        
        initInputs(); 
        updateGlobalCalc();
        renderInitialMarketList();
        
        // 3. 탭 복구
        const lastTab = localStorage.getItem('umt_last_tab') || 'home';
        const lastTicker = localStorage.getItem('umt_last_ticker');
        
        if (Object.keys(portfolios).length > 0) renderTickerBar();

        if (lastTab === 'strategy' && lastTicker && portfolios[lastTicker]) {
            activeTicker = lastTicker; 
            switchTab('strategy'); 
            loadTickerData(lastTicker);
        } else if (lastTab === 'settings') {
            switchTab('settings');
        } else {
            switchTab('home');
        }

        // 4. 비동기 작업 시작
        if(SYNC_URL) {
            loadFromCloud(false).catch(e => console.log("Silent cloud fail"));
        }

        fetchNews();
        fetchMarketDataInBackground();

        // 5. 매크로 데이터: 유효한 캐시 있으면 즉시 표시, 없으면 버튼 대기
        var cachedMacro = loadMacroFromCache();
        if (cachedMacro && cachedMacro.quad && cachedMacro.news && cachedMacro.market_data) {
            MACRO_DATA = cachedMacro;
            console.log('[Macro] 캐시 로드 성공 — Quad', cachedMacro.quad.current, '뉴스', cachedMacro.news.length, '개');
            updateMacroDashboard();
        } else {
            if (cachedMacro) console.log('[Macro] 캐시 데이터 불완전 — 무시', Object.keys(cachedMacro||{}));
            renderMacroStartButton();
        }

    } catch(err) {
        console.error("Init Error:", err);
        alert("시스템 초기화 중 오류가 발생했습니다. 브라우저 캐시를 지우면 해결됩니다.\n에러내용: " + err.message);
    }
}

document.addEventListener('DOMContentLoaded', initApp);

// ==========================================
// 🌐 데이터 통신 엔진
// ==========================================
function updateStatus(isOnline) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if(!dot || !text) return;

    if(isOnline) {
        dot.className = 'status-dot status-live'; text.innerText = 'ONLINE'; 
        text.className = 'text-[9px] font-black text-emerald-400 uppercase tracking-widest';
    } else {
        dot.className = 'status-dot status-error'; text.innerText = 'OFFLINE'; 
        text.className = 'text-[9px] font-black text-red-400 uppercase tracking-widest';
    }
}

async function fetchMarketData(sym) {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000); 
        const res = await fetch(`${API_BASE_URL}/price?ticker=${sym}&t=${Date.now()}`, { signal: controller.signal });
        clearTimeout(id);
        
        if (!res.ok) throw new Error("API 실패");
        const data = await res.json();
        
        if(typeof data.price !== 'number') throw new Error("포맷 오류");
        if(Math.abs(data.change) > 30) data.change = 0; 
        
        return data;
    } catch (e) {
        return { price: 0, change: 0, rsi: 0, ma200: 0, ema8: 0, error: true };
    }
}

async function fetchNews() {
    try {
        const res = await fetch(`${API_BASE_URL}/news`);
        const data = await res.json();
        if(Array.isArray(data) && data.length > 0) { 
            NEWS_FEED = data; 
            startNewsTicker();
            translateNewsTitles().then(refreshNewsTickerUI).catch(function() { refreshNewsTickerUI(); });
        }
    } catch(e) { 
        const el = document.getElementById('newsDisplay');
        if(el) el.innerText = "뉴스 서버 접속 실패";
    }
}

function fetchMarketDataInBackground() {
    fetchMarketData('^VIX').then(data => {
        MARKET_SNAPSHOT['^VIX'] = data;
        updateFearGreed();
    });

    let successCount = 0;
    ETF_DB.forEach(e => {
        fetchMarketData(e.sym).then(data => {
            MARKET_SNAPSHOT[e.sym] = data;
            if (!data.error && data.price > 0) successCount++;
            
            updateStatus(successCount > 0);
            updateSingleCard(e.sym, data);
            updateRecommendationsUI(); 
            
            if (activeTicker === e.sym) {
                updateStrategyDataUI(e.sym);
            }
        });
    });
}

// ==========================================
// ☁️ 구글 클라우드 동기화
// ==========================================
function saveSyncUrl() {
    const url = document.getElementById('globalSyncUrl').value.trim();
    localStorage.setItem('umt_sync_url', url);
    SYNC_URL = url;
    if(url) {
        alert("구글 시트 URL이 저장되었습니다. 데이터를 클라우드로 백업합니다.");
        syncToCloud();
    }
}

async function syncToCloud() {
    if(!SYNC_URL) return;

    const syncBadge = document.getElementById('syncBadge');
    const syncIcon = document.getElementById('syncIcon');
    if(syncBadge) syncBadge.classList.add('status-sync');
    if(syncIcon) syncIcon.classList.replace('text-slate-500', 'text-white');

    const dataStr = JSON.stringify({ global: globalData, ports: portfolios });
    try {
        var proxyUrl = API_BASE_URL + '/sync?url=' + encodeURIComponent(SYNC_URL);
        await fetch(proxyUrl, {
            method: 'POST',
            body: dataStr,
            headers: { 'Content-Type': 'application/json' }
        });
        const sText = document.getElementById('syncStatusText');
        if(sText) sText.innerText = "최근 동기화: " + new Date().toLocaleTimeString();
    } catch(e) {
        console.error('[Sync] 동기화 실패:', e);
        const sText = document.getElementById('syncStatusText');
        if(sText) sText.innerText = "동기화 실패";
    } finally {
        setTimeout(() => {
            if(syncBadge) syncBadge.classList.remove('status-sync');
            if(syncIcon) syncIcon.classList.replace('text-white', 'text-slate-500');
        }, 1000);
    }
}

function showToast(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('opacity-0');
    el.classList.add('opacity-100');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function() {
        el.classList.add('opacity-0');
        el.classList.remove('opacity-100');
    }, 2500);
}

async function saveFullToCloud() {
    if (!SYNC_URL) {
        alert('설정 탭에서 구글 시트 URL을 먼저 입력해주세요.');
        return;
    }
    var syncBadge = document.getElementById('syncBadge');
    var syncIcon = document.getElementById('syncIcon');
    if (syncBadge) syncBadge.classList.add('status-sync');
    if (syncIcon) syncIcon.classList.replace('text-slate-500', 'text-white');
    var proxyUrl = API_BASE_URL + '/sync?url=' + encodeURIComponent(SYNC_URL);

    const aggregatedTrades = getAggregatedTrades();
    var payload = {
        settings: globalData,
        portfolio: portfolios,
        trades: aggregatedTrades,
        deposits: (globalData && globalData.deposits) ? globalData.deposits : []
    };
    try {
        var res = await fetch(proxyUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            showToast('전체 데이터가 저장되었습니다.');
            alert('전체 저장 요청 완료\ntrades: ' + aggregatedTrades.length + '\n종목 수: ' + Object.keys(portfolios || {}).length);
            var sText = document.getElementById('syncStatusText');
            if (sText) sText.innerText = '저장 완료 ' + new Date().toLocaleTimeString();
        } else {
            showToast('저장 실패');
        }
    } catch (e) {
        showToast('저장 실패');
    } finally {
        setTimeout(function() {
            if (syncBadge) syncBadge.classList.remove('status-sync');
            if (syncIcon) syncIcon.classList.replace('text-white', 'text-slate-500');
        }, 1000);
    }
}

async function loadFromCloud(isManual = false) {
    if(!SYNC_URL) {
        if(isManual) alert("설정 탭에서 구글 시트 URL을 먼저 입력해주세요.");
        return false;
    }
    
    if(isManual) {
        var sText = document.getElementById('syncStatusText');
        if(sText) sText.innerText = "불러오는 중...";
    }

    var proxyUrl = API_BASE_URL + '/sync?url=' + encodeURIComponent(SYNC_URL);
    try {
        var res = await fetch(proxyUrl);
        var raw = await res.json();
        console.log('[DEBUG loadFromCloud] raw response', raw);

        // { ok: true, data: { ... } } 형태 대응
        var data = raw;
        if (data && data.data && !data.settings && !data.portfolio && !data.global && !data.ports) {
            data = data.data;
            console.log('[DEBUG loadFromCloud] normalized from data.data', data);
        } else if (data && (data.settings || data.portfolio || data.global || data.ports)) {
            console.log('[DEBUG loadFromCloud] normalized as direct payload', data);
        } else {
            console.log('[DEBUG loadFromCloud] unknown payload shape', data);
        }
        
        if (data && data.settings != null && data.portfolio != null) {
            console.log('[DEBUG loadFromCloud] using settings/portfolio shape', {
                hasSettings: !!data.settings,
                portfolioKeys: Object.keys(data.portfolio || {})
            });
            globalData = data.settings;
            if (Array.isArray(data.deposits)) globalData.deposits = data.deposits;
            portfolios = data.portfolio;
            if (Array.isArray(data.trades) && data.trades.length > 0) {
                console.log('[DEBUG loadFromCloud] trades length', data.trades.length);
                Object.keys(portfolios).forEach(function(sym) { portfolios[sym].history = []; });
                data.trades.forEach(function(t) {
                    var sym = t.sym;
                    if (!portfolios[sym]) portfolios[sym] = { qty: 0, avgPrice: 0, history: [], config: {} };
                    if (!Array.isArray(portfolios[sym].history)) portfolios[sym].history = [];
                    var h = {
                        id: t.id,
                        date: t.date,
                        type: t.type,
                        price: t.price,
                        qty: t.qty,
                        fee: t.fee,
                        total: t.total,
                        memo: t.memo,
                        tag: t.tag,
                        stage: t.stage,
                        cycleId: t.cycleId != null ? t.cycleId : null,
                        plannedPrice: t.plannedPrice != null ? t.plannedPrice : null,
                        plannedQty: t.plannedQty != null ? t.plannedQty : null,
                        plannedStage: t.plannedStage != null ? t.plannedStage : null
                    };
                    portfolios[sym].history.push(h);
                });
                Object.keys(portfolios).forEach(function(sym) { recalcPortfolio(portfolios[sym]); });
            }
        } else if (data && data.global && data.ports) {
            console.log('[DEBUG loadFromCloud] using global/ports shape', {
                hasGlobal: !!data.global,
                portKeys: Object.keys(data.ports || {})
            });
            globalData = data.global;
            portfolios = data.ports;
        } else {
            if(isManual) {
                showToast('불러오기 실패');
                alert("클라우드에 저장된 데이터가 없습니다. (비어있음)");
            }
            return false;
        }
        
        sanitizeData();
        // cycleId 호환: 보유중인데 currentCycleId가 없으면 history에서 최대 cycleId로 보정
        Object.keys(portfolios || {}).forEach(function(sym) {
            const p = portfolios[sym];
            if (!p) return;
            if (typeof p.cycleSeq !== 'number') p.cycleSeq = 0;
            if (p.qty > 0 && p.currentCycleId == null && Array.isArray(p.history)) {
                const maxCycle = p.history.reduce((m, h) => (h && h.cycleId != null && h.cycleId > m ? h.cycleId : m), 0);
                if (maxCycle > 0) p.currentCycleId = maxCycle;
            }
            if (Array.isArray(p.history)) {
                const maxCycle2 = p.history.reduce((m, h) => (h && h.cycleId != null && h.cycleId > m ? h.cycleId : m), 0);
                if (maxCycle2 > 0) p.cycleSeq = Math.max(p.cycleSeq || 0, maxCycle2);
            }
        });
        localStorage.setItem('umt_v172_global', JSON.stringify(globalData));
        localStorage.setItem('umt_v172_ports', JSON.stringify(portfolios));
        
        initInputs();
        updateGlobalCalc();
        renderTickerBar();
        if(activeTicker && portfolios[activeTicker]) loadTickerData(activeTicker);
        
        if(isManual) {
            showToast('전체 데이터를 불러왔습니다.');
            sText = document.getElementById('syncStatusText');
            if(sText) sText.innerText = "전체 불러오기 완료";
            if (typeof renderTradeLog === 'function') renderTradeLog();
            if (activeTicker && portfolios[activeTicker] && typeof renderStrategyProgressCard === 'function') renderStrategyProgressCard(activeTicker);
        }
        return true;
    } catch(e) {
        if(isManual) {
            showToast('불러오기 실패');
            alert("클라우드 접속 실패. URL이 정확한지 확인해주세요.");
        }
        return false;
    }
}
    
function manualLoadFromCloud() {
    if(confirm("구글 시트의 전체 데이터(초기 시드·포트폴리오·전략·매매일지·입출금)로 복원합니다.\n현재 화면의 저장되지 않은 데이터는 사라집니다. 계속하시겠습니까?")) {
        loadFromCloud(true).then(ok => {
            if (ok) {
                const allTrades = getAggregatedTrades();
                const portCount = Object.keys(portfolios || {}).length;
                alert('전체 불러오기 완료\n종목 수: ' + portCount + '\ntrades: ' + allTrades.length);
            }
        });
    }
}

// ==========================================
// 💡 UI 렌더링
// ==========================================
function renderInitialMarketList() { 
    const list = document.getElementById('marketList'); 
    if(!list) return;
    function getSector(e) {
        const map = {
            'Quad 1 — 성장주': ['TQQQ','SOXL','TNA','SPXL'],
            'Quad 2 — 인플레 수혜': ['NRGU','GUSH','NUGT','DRN'],
            'Quad 3 — 방어/인버스': ['GLD','UGL','GDXU','SQQQ'],
            'Quad 4 — 채권/방어주': ['TMF','CURE','UUP'],
            '특수 목적': ['UVXY','BITX'],
            '전 Quad 공용': ['UDOW','FAS','LABU'],
        };
        for (const k in map) { if (map[k].includes(e.sym)) return k; }
        return '기타';
    }

    const groups = {};
    ETF_DB.forEach(e => {
        const sector = getSector(e);
        if (!groups[sector]) groups[sector] = [];
        groups[sector].push(e);
    });
    const order = ['Quad 1 — 성장주','Quad 2 — 인플레 수혜','Quad 3 — 방어/인버스','Quad 4 — 채권/방어주','특수 목적','전 Quad 공용','기타'];

    var quadNow = getCurrentQuad();
    var quadSectorMap = {1:'Quad 1 — 성장주', 2:'Quad 2 — 인플레 수혜', 3:'Quad 3 — 방어/인버스', 4:'Quad 4 — 채권/방어주'};
    var currentQuadSector = quadSectorMap[quadNow] || '';

    list.innerHTML = order.filter(k => groups[k] && groups[k].length).map((sector, idx) => {
        const cards = groups[sector].map(e => {
            let badge = e.lev==='3x'?'badge-3x':(e.lev==='2x'?'badge-2x':'badge-inv');
            return `
            <div id="card-${e.sym}" class="glass-panel p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-800 transition" onclick="openAnalysisModal('${e.sym}')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center font-black text-white text-xs shadow-inner">${e.sym}</div>
                    <div>
                        <div class="flex items-center gap-2"><span class="font-bold text-white text-sm">${e.name}</span><span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${badge}">${e.lev}</span></div>
                        <div id="desc-${e.sym}" class="text-[10px] text-slate-500 mt-0.5">데이터 수신 중...</div>
                    </div>
                </div>
                <div class="text-right">
                    <div id="price-${e.sym}" class="text-sm font-bold text-slate-500">로딩중</div>
                    <div class="text-[10px] text-slate-400 font-medium tracking-tight mt-1">${e.holdings}</div>
                </div>
            </div>`;
        }).join('');
        // 현재 Quad 수혜 섹터 + 전Quad공용은 펼침, 나머지 접기
        var isOpen = (sector === currentQuadSector) || (sector === '전 Quad 공용');
        var sectorId = 'etfSector' + idx;
        var sectorStyles = {
            'Quad 1 — 성장주':     {icon:'fa-sun',        color:'text-green-400', bg:'bg-green-900/15 border-green-800/40'},
            'Quad 2 — 인플레 수혜': {icon:'fa-fire',       color:'text-yellow-400',bg:'bg-yellow-900/15 border-yellow-800/40'},
            'Quad 3 — 방어/인버스': {icon:'fa-cloud-bolt', color:'text-red-400',   bg:'bg-red-900/15 border-red-800/40'},
            'Quad 4 — 채권/방어주': {icon:'fa-snowflake',  color:'text-blue-400',  bg:'bg-blue-900/15 border-blue-800/40'},
            '특수 목적':           {icon:'fa-shield-halved',color:'text-purple-400',bg:'bg-purple-900/15 border-purple-800/40'},
            '전 Quad 공용':        {icon:'fa-arrows-rotate',color:'text-slate-300', bg:'bg-slate-800/40 border-slate-700'},
        };
        var st = sectorStyles[sector] || {icon:'fa-circle', color:'text-slate-400', bg:'bg-slate-800/40 border-slate-700'};
        var isCurrent = (sector === currentQuadSector);
        var quadBadge = isCurrent ? '<span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold ml-2 animate-pulse">현재 Quad</span>' : '';
        var tickerPreview = groups[sector].map(function(e){return e.sym;}).join(' · ');
        return `<div class="mt-2 first:mt-0">
            <button type="button" onclick="toggleEtfSector('${sectorId}')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border ${st.bg} hover:brightness-110 transition ${isCurrent?'ring-1 ring-blue-500/50':''}">
                <div class="flex items-center gap-2.5">
                    <i class="fa-solid ${st.icon} ${st.color} text-sm w-5 text-center"></i>
                    <div class="text-left">
                        <div class="text-xs font-black text-white">${sector}${quadBadge}</div>
                        <div class="text-[9px] text-slate-500 mt-0.5">${tickerPreview}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] ${st.color} font-bold">${groups[sector].length}</span>
                    <i class="fa-solid fa-chevron-down text-[10px] text-slate-500 transition-transform" id="${sectorId}Chev" style="${isOpen?'':'transform:rotate(-90deg)'}"></i>
                </div>
            </button>
            <div class="grid gap-2 mt-2 ${isOpen?'':'hidden'}" id="${sectorId}">${cards}</div>
        </div>`;
    }).join('');
}

function updateSingleCard(sym, md) {
    const pEl = document.getElementById(`price-${sym}`);
    const dEl = document.getElementById(`desc-${sym}`);
    if(!pEl || !dEl) return;

    if (md.error || md.price === 0) {
        pEl.innerText = "수신 실패";
        pEl.className = "text-sm font-bold text-red-500";
        return;
    }

    let stColor = md.price < md.ma200 ? 'text-red-400' : (md.rsi < 60 ? 'text-green-400' : 'text-blue-400'); 
    let stText = md.price < md.ma200 ? '하락추세' : (md.rsi < 60 ? '매수적기' : '상승추세'); 

    pEl.innerText = '$' + md.price.toFixed(2);
    pEl.className = "text-sm font-bold text-white";
    
    const e = ETF_DB.find(x => x.sym === sym);
    if(e) {
        let maText = '';
        if (md.ma200 && md.ma200 > 0) {
            if (md.price >= md.ma200) {
                const dist = ((md.price - md.ma200) / md.ma200) * 100;
                maText = `<span class="ml-1 text-[10px] text-slate-400 font-bold">MA200 +${dist.toFixed(1)}%</span>`;
            } else {
                maText = `<span class="ml-1 text-[10px] text-slate-500 font-bold">MA200 아래</span>`;
            }
        }
        dEl.innerHTML = `${e.desc} <span class="ml-1 font-bold ${stColor}">● ${stText}</span>${maText}`;
    }
    const homeTab = document.getElementById('tab-home');
    if (homeTab && !homeTab.classList.contains('hidden')) renderMarketHeatmap();
}

function updateRecommendationsUI() {
    var list = document.getElementById('recommendationList');
    if (!list) return;

    var quadNow = getCurrentQuad();

    // 매크로 추천이 있으면 우선 사용
    if (MACRO_DATA && MACRO_DATA.recommendations && MACRO_DATA.recommendations.buy && MACRO_DATA.recommendations.buy.length > 0) {
        var recs = MACRO_DATA.recommendations.buy;
        list.innerHTML = recs.map(function(rec) {
            var meta = ETF_DB.find(function(e){return e.sym===rec.ticker;}) || {};
            var md = MARKET_SNAPSHOT[rec.ticker] || {};
            var badge = meta.lev==='3x'?'badge-3x':(meta.lev==='2x'?'badge-2x':'badge-inv');
            var sig = getTechnicalSignal(rec.ticker, md);
            var modeLabels = {aggressive:'공격형', balanced:'균등형', defensive:'방어형'};
            var modeColors = {aggressive:'text-red-400', balanced:'text-yellow-400', defensive:'text-blue-400'};
            var price = md.price ? '$'+md.price.toFixed(2) : '--';

            return '<div class="glass-panel p-3 rounded-xl border-l-4 border-purple-500 cursor-pointer mb-2 active:bg-slate-800 transition" onclick="openAnalysisModal(\''+rec.ticker+'\')">'
                + '<div class="flex justify-between items-start">'
                + '<div>'
                + '<div class="flex items-center gap-2"><span class="font-black text-white">'+rec.ticker+'</span><span class="text-[10px] px-1.5 py-0.5 rounded font-bold '+badge+'">'+(meta.lev||'')+'</span>'
                + '<span class="text-[9px] font-bold '+(modeColors[rec.mode]||'text-slate-400')+'">'+(modeLabels[rec.mode]||rec.mode)+'</span></div>'
                + '<div class="text-[10px] text-slate-400 mt-0.5">'+escapeHtml(rec.reason)+'</div>'
                + renderSignalDots(sig)
                + '</div>'
                + '<div class="text-right shrink-0"><div class="text-sm font-bold text-white">'+price+'</div>'
                + '<div class="text-[9px] text-purple-400 font-bold">Quad '+quadNow+' 수혜</div></div>'
                + '</div></div>';
        }).join('');
        return;
    }

    // 폴백: 시장 데이터 기반 Quad 필터링 + 기술적 시그널
    var validData = ETF_DB.filter(function(e) {
        var md = MARKET_SNAPSHOT[e.sym];
        return md && !md.error && md.price > 0 && md.ma200 > 0;
    });
    if (validData.length === 0) return;

    // 1단계: Quad 수혜 필터 (현재 Quad에 매핑된 ETF 우선)
    var quadFiltered = validData;
    if (quadNow) {
        var favored = validData.filter(function(e) { return e.quad && (e.quad.indexOf(quadNow) !== -1); });
        if (favored.length > 0) quadFiltered = favored;
    }

    // 2단계: 기술적 시그널 스코어링
    var scored = quadFiltered.map(function(e) {
        var md = MARKET_SNAPSHOT[e.sym];
        var sig = getTechnicalSignal(e.sym, md);
        var score = 0;

        // TREND: MA200 위 = +40
        if (sig.trend === 'up') score += 40;
        // TRADE: RSI < 50 + EMA8 위 = 최대 +35
        if (sig.trade === 'buy') score += 35;
        else if (sig.trade === 'wait') score += 15;
        // 가격 위치: RSI 낮을수록 가산 (과매도 눌림목)
        if (md.rsi < 50) score += (50 - md.rsi);
        // Quad 정확 매칭 보너스 (전Quad 공용보다 전용 우선)
        if (e.quad && e.quad.length > 0 && e.quad.length < 4 && quadNow && e.quad.indexOf(quadNow) !== -1) score += 10;
        // 이미 보유 중이면 제외
        if (portfolios && portfolios[e.sym] && portfolios[e.sym].qty > 0) score -= 100;

        return Object.assign({}, e, md, { score: score, signal: sig });
    }).filter(function(d) { return d.score > 0; })
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, 3);

    if (scored.length === 0) {
        list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">현재 Quad' + (quadNow ? ' '+quadNow : '') + ' 조건에 맞는 매수 기회가 없습니다.</div>';
        return;
    }

    list.innerHTML = scored.map(function(d) {
        var badge = d.lev==='3x'?'badge-3x':(d.lev==='2x'?'badge-2x':'badge-inv');
        var sig = d.signal;
        var sigLabel = sig.overall === 'go' ? '지금 진입' : (sig.overall === 'wait' ? '눌림목 대기' : '관망');
        var sigColor = sig.overall === 'go' ? 'bg-green-900/50 text-green-300' : (sig.overall === 'wait' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-slate-700 text-slate-300');
        var rsiText = d.rsi != null ? 'RSI ' + d.rsi.toFixed(0) : '';

        return '<div class="glass-panel p-3 rounded-xl border-l-4 ' + (sig.overall==='go'?'border-green-500':'border-slate-500') + ' cursor-pointer mb-2 active:bg-slate-800 transition" onclick="openAnalysisModal(\''+d.sym+'\')">'
            + '<div class="flex justify-between items-start">'
            + '<div>'
            + '<div class="flex items-center gap-2"><span class="font-black text-white">'+d.sym+'</span><span class="text-[10px] px-1.5 py-0.5 rounded font-bold '+badge+'">'+d.lev+'</span></div>'
            + '<div class="text-[10px] text-slate-500">' + escapeHtml(d.desc||'') + '</div>'
            + renderSignalDots(sig)
            + '<div class="text-[10px] text-slate-400 mt-0.5">' + rsiText + '</div>'
            + '</div>'
            + '<div class="text-right shrink-0"><div class="text-sm font-bold text-white">$'+d.price.toFixed(2)+'</div>'
            + '<span class="text-[10px] px-2 py-0.5 rounded font-bold '+sigColor+'">'+sigLabel+'</span></div>'
            + '</div></div>';
    }).join('');
}

// PRD 3가지 기술적 체크: TREND(MA200) + TRADE(RSI+EMA8) + 가격위치
function getTechnicalSignal(sym, md) {
    if (!md || !md.price) return { trend:'unknown', trade:'unknown', position:'unknown', overall:'hold' };

    // TREND: 가격 > MA200
    var trend = (md.ma200 > 0 && md.price > md.ma200) ? 'up' : 'down';

    // TRADE: RSI < 50 (과매도 진입) + 가격 > EMA8 (단기 반등)
    var trade = 'hold';
    if (md.rsi < 50 && md.ema8 > 0 && md.price > md.ema8) trade = 'buy';
    else if (md.rsi < 50) trade = 'wait'; // RSI 낮지만 EMA8 아래 = 대기

    // 가격 위치: 레인지 하단이면 유리
    var position = 'mid';
    if (md.rsi <= 30) position = 'low';
    else if (md.rsi >= 70) position = 'high';

    // 종합 판정
    var overall = 'hold';
    if (trend === 'up' && trade === 'buy') overall = 'go';       // 3개 모두 초록 → 지금 진입
    else if (trend === 'up' && trade !== 'buy') overall = 'wait'; // TREND만 초록 → 눌림목 대기
    // TREND 빨강 → 관망

    return { trend: trend, trade: trade, position: position, overall: overall };
}

function renderSignalDots(sig) {
    var dots = [
        { label:'TREND', val:sig.trend,  on:sig.trend==='up' },
        { label:'TRADE', val:sig.trade,  on:sig.trade==='buy' },
        { label:'위치',  val:sig.position, on:sig.position==='low' }
    ];
    return '<div class="flex gap-2 mt-1">' + dots.map(function(d) {
        var color = d.on ? 'bg-green-500' : (d.val==='unknown'?'bg-slate-600':'bg-red-500/70');
        return '<div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full '+color+'"></span><span class="text-[9px] text-slate-500">'+d.label+'</span></div>';
    }).join('') + '</div>';
}

function updateFearGreed() {
    // 실시간 VIX는 항상 업데이트 (매크로 데이터 유무와 관계없이)
    var vixData = MARKET_SNAPSHOT['^VIX'];
    if (vixData && !vixData.error && vixData.price > 0) {
        var vixEl = document.getElementById('vixValue');
        if (vixEl) vixEl.innerText = vixData.price.toFixed(1);
        // 시장 지표 VIX 칸도 업데이트
        var mkVixEl = document.getElementById('mkVix');
        if (mkVixEl && mkVixEl.innerText === '--') mkVixEl.innerText = vixData.price.toFixed(1);
    }

    // 매크로 데이터가 있으면 Quad 대시보드 우선
    if (MACRO_DATA && MACRO_DATA.quad) {
        updateMacroDashboard();
        return;
    }

    // 폴백: 기존 VIX 기반 공포/탐욕
    if(!vixData || vixData.error || vixData.price === 0) {
        const el = document.getElementById('vixValue');
        const lbl = document.getElementById('fgLabel');
        if(el) el.innerText = "오류";
        if(lbl) lbl.innerText = "연결안됨";
        return;
    }

    let vixPrice = vixData.price;
    const el = document.getElementById('vixValue');
    if(el) el.innerText = vixPrice.toFixed(2);

    let label="중립", desc="방향성 탐색", color="text-slate-200", score=50;
    if(vixPrice>28){ label="극도공포"; desc="과매도 구간"; score=20; color="text-red-500"; }
    else if(vixPrice>20){ label="공포"; desc="변동성 주의"; score=40; color="text-orange-500"; }
    else if(vixPrice<15){ label="탐욕"; desc="매수세 강세"; score=80; color="text-green-500"; }

    const needle = document.getElementById('fgNeedle');
    if(needle) needle.style.transform = `rotate(${(score/100)*180-90}deg)`;
    const lbl = document.getElementById('fgLabel');
    if(lbl) { lbl.innerText=label; lbl.className=`text-lg font-black ${color}`; }
    const dEl = document.getElementById('fgDesc');
    if(dEl) dEl.innerText=desc;
}

// ==========================================
// Macro Dashboard — 전체 업데이트
// ==========================================
const QUAD_COLORS = { 1:'text-green-400', 2:'text-yellow-400', 3:'text-red-400', 4:'text-blue-400' };
const QUAD_BG     = { 1:'border-green-500/30', 2:'border-yellow-500/30', 3:'border-red-500/30', 4:'border-blue-500/30' };
const QUAD_SCORES = { 1:80, 2:60, 3:20, 4:40 };
const QUAD_ICONS  = { 1:'fa-sun', 2:'fa-fire', 3:'fa-cloud-bolt', 4:'fa-snowflake' };

function updateMacroDashboard() {
    if (!MACRO_DATA) return;
    try { renderQuadHeader(); } catch(e) { console.error('[Macro] renderQuadHeader:', e); }
    try { renderMarketIndicators(); } catch(e) { console.error('[Macro] renderMarketIndicators:', e); }
    try { renderUpcomingEvents(); } catch(e) { console.error('[Macro] renderUpcomingEvents:', e); }
    try { renderNewsBriefing(); } catch(e) { console.error('[Macro] renderNewsBriefing:', e); }
    try { renderHoldingStatus(); } catch(e) { console.error('[Macro] renderHoldingStatus:', e); }
    // 상단 전광판은 Google News RSS를 유지 (renderNewsTickerLevel1 제거)
}

// ── 1. Quad 헤더 ──
function renderQuadHeader() {
    const q = MACRO_DATA.quad;
    if (!q) return;

    const lbl = document.getElementById('fgLabel');
    if (lbl) {
        lbl.innerHTML = '<i class="fa-solid ' + (QUAD_ICONS[q.current]||'fa-circle-question') + ' mr-2"></i>Quad ' + q.current + ' — ' + (q.name||'');
        lbl.className = 'text-2xl font-black leading-none ' + (QUAD_COLORS[q.current] || 'text-slate-200');
    }

    const dEl = document.getElementById('fgDesc');
    if (dEl) {
        var g = q.growth === 'accelerating' ? '성장↑' : '성장↓';
        var i = q.inflation === 'accelerating' ? '인플레↑' : '인플레↓';
        var conf = q.confidence ? (' · 확신도 ' + q.confidence + '%') : '';
        dEl.innerText = g + ' · ' + i + conf;
    }

    var needle = document.getElementById('fgNeedle');
    if (needle) needle.style.transform = 'rotate(' + ((QUAD_SCORES[q.current]||50)/100*180-90) + 'deg)';

    // VIX
    if (MACRO_DATA.market_data && MACRO_DATA.market_data.vix) {
        var vEl = document.getElementById('vixValue');
        if (vEl) vEl.innerText = MACRO_DATA.market_data.vix.value.toFixed(1);
    }

    // 갱신 시간
    var tEl = document.getElementById('quadUpdateTime');
    if (tEl && MACRO_DATA._cachedAt) {
        var mins = Math.round((Date.now()-MACRO_DATA._cachedAt)/60000);
        tEl.innerText = mins < 60 ? (mins+'분 전 갱신') : (Math.round(mins/60)+'시간 전 갱신');
    }

    // 카드 테두리 색상
    var card = document.getElementById('quadDashboardCard');
    if (card) { card.className = card.className.replace(/border-\w+-\d+\/\d+/g,''); card.classList.add(QUAD_BG[q.current]||''); card.style.borderTop = '2px solid'; }

    // 전환 리스크 바
    var trBar = document.getElementById('quadTransitionBar');
    var trGrid = document.getElementById('quadTransitionGrid');
    if (trBar && trGrid && q.transition_risk) {
        trBar.classList.remove('hidden');
        var tr = q.transition_risk;
        var quadNames = {1:'Q1 골디락스',2:'Q2 과열',3:'Q3 스태그',4:'Q4 침체'};
        var barColors = {1:'bg-green-500',2:'bg-yellow-500',3:'bg-red-500',4:'bg-blue-500'};
        trGrid.innerHTML = [1,2,3,4].map(function(n) {
            var key = 'to_quad'+n;
            var pct = tr[key] != null ? tr[key] : 0;
            if (n === q.current) pct = 0;
            var isCurrent = n === q.current;
            return '<div class="text-center' + (isCurrent ? ' opacity-40' : '') + '">'
                + '<div class="text-[8px] text-slate-500 mb-0.5">' + quadNames[n] + '</div>'
                + '<div class="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full ' + barColors[n] + ' transition-all" style="width:'+pct+'%"></div></div>'
                + '<div class="text-[9px] font-bold mt-0.5 ' + (pct>25?QUAD_COLORS[n]:'text-slate-600') + '">' + (isCurrent?'현재':pct+'%') + '</div>'
                + '</div>';
        }).join('');
    }

    // 이벤트 오버레이
    var evArea = document.getElementById('eventOverlayArea');
    var evBadges = document.getElementById('eventOverlayBadges');
    if (evArea && evBadges && MACRO_DATA.events && MACRO_DATA.events.overlay && MACRO_DATA.events.overlay.length > 0) {
        evArea.classList.remove('hidden');
        var sevColors = {high:'bg-red-900/60 border-red-700 text-red-300', medium:'bg-yellow-900/40 border-yellow-700 text-yellow-300', low:'bg-slate-800 border-slate-600 text-slate-300'};
        evBadges.innerHTML = MACRO_DATA.events.overlay.map(function(ev) {
            var c = sevColors[ev.severity] || sevColors.low;
            return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ' + c + '"><i class="fa-solid fa-triangle-exclamation text-[8px]"></i>' + escapeHtml(ev.title) + '</span>';
        }).join('');
    }
}

// ── 2. 핵심 시장 지표 5개 ──
function renderMarketIndicators() {
    var md = MACRO_DATA.market_data;
    if (!md) return;

    var items = [
        {id:'Wti', data:md.wti, fmt:1},
        {id:'Gold', data:md.gold, fmt:0},
        {id:'Dxy', data:md.dxy, fmt:1},
        {id:'Us10y', data:md.us10y, fmt:2},
        {id:'Vix', data:md.vix, fmt:1}
    ];

    items.forEach(function(item) {
        if (!item.data) return;
        var valEl = document.getElementById('mk'+item.id);
        var chgEl = document.getElementById('mk'+item.id+'Chg');
        if (valEl) valEl.innerText = item.data.value.toFixed(item.fmt);
        if (chgEl) {
            var chg = item.data.change;
            var sign = chg > 0 ? '+' : '';
            chgEl.innerText = sign + chg.toFixed(item.id==='Us10y'?0:1) + (item.id==='Us10y'?'bp':'%');
            chgEl.className = 'text-[9px] font-bold ' + (chg>0?'text-green-400':(chg<0?'text-red-400':'text-slate-500'));
        }
    });
}

// ── 3. 다음 주요 이벤트 ──
function renderUpcomingEvents() {
    var ev = MACRO_DATA.events;
    if (!ev || !ev.upcoming || ev.upcoming.length === 0) return;

    var card = document.getElementById('upcomingEventsCard');
    var list = document.getElementById('upcomingEventsList');
    if (!card || !list) return;
    card.classList.remove('hidden');

    var impColors = {high:'bg-red-900/50 border-red-800 text-red-200', medium:'bg-yellow-900/40 border-yellow-800 text-yellow-200', low:'bg-slate-800 border-slate-700 text-slate-300'};
    list.innerHTML = ev.upcoming.map(function(e) {
        var c = impColors[e.importance] || impColors.low;
        return '<div class="shrink-0 px-3 py-2 rounded-lg border text-[10px] font-bold ' + c + '"><div class="text-[8px] opacity-60 mb-0.5">' + escapeHtml(e.date) + '</div>' + escapeHtml(e.name) + '</div>';
    }).join('');
}

// ── 4. 뉴스 Level 1 (상단 티커) ──
function renderNewsTickerLevel1() {
    var news = MACRO_DATA.news;
    if (!news || news.length === 0) return;

    var display = document.getElementById('newsDisplay');
    if (!display) return;

    var levelIcons = {red:'🔴', yellow:'🟡', green:'🟢'};
    var tickerItems = news.map(function(n) {
        var txt = (levelIcons[n.level]||'●') + ' ' + n.title;
        if (n.etf_impact && n.etf_impact.bullish && n.etf_impact.bullish.length > 0) {
            txt += ' → ' + n.etf_impact.bullish.join(',') + ' 수혜';
        }
        return txt;
    });

    var idx = 0;
    display.innerHTML = tickerItems[0];
    display.onclick = function() { openNewsModal(); };

    if (window._macroTickerTimer) clearInterval(window._macroTickerTimer);
    window._macroTickerTimer = setInterval(function() {
        idx = (idx + 1) % tickerItems.length;
        display.innerHTML = tickerItems[idx];
    }, 5000);
}

// ── 5. 뉴스 Level 2 카드 + Level 3 심층분석 ──
function renderNewsBriefing() {
    var news = MACRO_DATA.news;
    var list = document.getElementById('newsBriefingList');
    var countEl = document.getElementById('newsBriefingCount');
    if (!list) return;

    if (!news || news.length === 0) {
        list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">뉴스 데이터 없음</div>';
        return;
    }
    if (countEl) countEl.innerText = news.length + '건';

    var levelStyles = {
        red:   {border:'border-l-red-500',    bg:'bg-red-900/10',    badge:'bg-red-900/60 text-red-300',    icon:'긴급'},
        yellow:{border:'border-l-yellow-500',  bg:'bg-yellow-900/10', badge:'bg-yellow-900/50 text-yellow-300',icon:'주의'},
        green: {border:'border-l-green-500',   bg:'bg-green-900/10',  badge:'bg-green-900/50 text-green-300',icon:'참고'}
    };

    list.innerHTML = news.map(function(n, i) {
        var s = levelStyles[n.level] || levelStyles.green;
        var etfTags = '';
        if (n.etf_impact) {
            var tags = [];
            if (n.etf_impact.bullish) n.etf_impact.bullish.forEach(function(t){ tags.push('<span class="text-green-400">▲'+t+'</span>'); });
            if (n.etf_impact.bearish) n.etf_impact.bearish.forEach(function(t){ tags.push('<span class="text-red-400">▼'+t+'</span>'); });
            if (n.etf_impact.hedge) n.etf_impact.hedge.forEach(function(t){ tags.push('<span class="text-yellow-400">◆'+t+'</span>'); });
            etfTags = '<div class="flex flex-wrap gap-1.5 mt-2 text-[10px] font-bold">' + tags.join('') + '</div>';
        }

        var deepHtml = '';
        if (n.deep_analysis) {
            var da = n.deep_analysis;
            var scenHtml = '';
            if (da.scenarios) {
                scenHtml = '<div class="mt-2"><div class="text-[10px] font-bold text-slate-400 mb-1">시나리오 분석</div>' +
                    da.scenarios.map(function(sc) {
                        var probColor = sc.probability >= 40 ? 'text-white' : 'text-slate-400';
                        return '<div class="flex items-start gap-2 mb-1.5 text-[11px]">'
                            + '<span class="shrink-0 font-black ' + probColor + ' w-8 text-right">' + sc.probability + '%</span>'
                            + '<div><span class="font-bold text-slate-200">' + escapeHtml(sc.name) + '</span>'
                            + '<div class="text-slate-400">' + escapeHtml(sc.action) + '</div></div></div>';
                    }).join('') + '</div>';
            }

            var histHtml = '';
            if (da.historical_cases && da.historical_cases.length > 0) {
                histHtml = '<div class="mt-2"><div class="text-[10px] font-bold text-slate-400 mb-1">과거 유사 사례</div>' +
                    da.historical_cases.map(function(hc) {
                        return '<div class="text-[11px] text-slate-300 bg-slate-800/60 rounded px-2 py-1.5 mb-1">'
                            + '<span class="font-bold">' + escapeHtml(hc.event) + '</span>'
                            + ' — <span class="text-yellow-400">' + escapeHtml(hc.market_move||hc.oil_move||'') + '</span>'
                            + (hc.duration ? ' (' + hc.duration + ')' : '')
                            + (hc.market_impact ? ' <span class="text-slate-400">' + escapeHtml(hc.market_impact) + '</span>' : '')
                            + '</div>';
                    }).join('') + '</div>';
            }

            var monitorHtml = '';
            if (da.monitor_points && da.monitor_points.length > 0) {
                monitorHtml = '<div class="mt-2"><div class="text-[10px] font-bold text-slate-400 mb-1">모니터링 포인트</div>'
                    + '<div class="text-[11px] text-slate-300">' + da.monitor_points.map(function(p){return '• ' + escapeHtml(p);}).join('<br>') + '</div></div>';
            }

            deepHtml = '<div id="newsDeep'+i+'" class="hidden mt-3 pt-3 border-t border-slate-700/50 space-y-1">'
                + (da.situation ? '<div class="text-[11px] text-slate-300 leading-relaxed">' + escapeHtml(da.situation) + '</div>' : '')
                + histHtml + scenHtml + monitorHtml
                + '</div>';
        }

        return '<div class="glass-panel rounded-xl p-3 border-l-4 ' + s.border + ' ' + s.bg + '">'
            + '<div class="flex items-start justify-between gap-2 cursor-pointer" onclick="toggleNewsDeep('+i+')">'
            + '<div class="flex-1">'
            + '<div class="flex items-center gap-2 mb-1"><span class="text-[9px] font-bold px-1.5 py-0.5 rounded ' + s.badge + '">' + s.icon + '</span><span class="text-xs font-bold text-white">' + escapeHtml(n.title) + '</span></div>'
            + '<div class="text-[11px] text-slate-400 leading-snug">' + escapeHtml(n.summary) + '</div>'
            + etfTags
            + '</div>'
            + (n.deep_analysis ? '<i class="fa-solid fa-chevron-down text-[10px] text-slate-600 mt-1 shrink-0 transition-transform" id="newsChev'+i+'"></i>' : '')
            + '</div>'
            + deepHtml
            + '</div>';
    }).join('');
}

function toggleNewsDeep(idx) {
    var el = document.getElementById('newsDeep'+idx);
    var chev = document.getElementById('newsChev'+idx);
    if (!el) return;
    var isHidden = el.classList.contains('hidden');
    el.classList.toggle('hidden');
    if (chev) chev.style.transform = isHidden ? 'rotate(180deg)' : '';
}

// ── 상관관계 경고 ──
function renderCorrelationWarnings(sym) {
    var corrMap = CORRELATION_MAP[sym];
    if (!corrMap) return '';

    var holdings = Object.keys(portfolios || {}).filter(function(s) {
        return s !== sym && portfolios[s].qty > 0;
    });
    if (holdings.length === 0) return '';

    var warnings = [];
    holdings.forEach(function(held) {
        var corr = corrMap[held];
        if (corr && corr >= 0.7) {
            var level = corr >= 0.85 ? 'text-red-400' : 'text-yellow-400';
            var label = corr >= 0.85 ? '매우 높음' : '높음';
            warnings.push('<div class="flex justify-between items-center">'
                + '<span class="text-slate-300">' + sym + ' ↔ ' + held + '</span>'
                + '<span class="font-bold ' + level + '">' + corr.toFixed(2) + ' (' + label + ')</span>'
                + '</div>');
        }
    });

    if (warnings.length === 0) return '';
    return '<div class="pt-1.5 border-t border-slate-700">'
        + '<div class="text-red-400 font-bold text-[10px] mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>상관관계 경고 — 분산 효과 낮음</div>'
        + warnings.join('')
        + '<div class="text-[10px] text-slate-500 mt-1">상관관계 0.7+ 종목은 비중 15% 이내 권장</div>'
        + '</div>';
}

function checkCorrelationOnAdd(sym) {
    var corrMap = CORRELATION_MAP[sym];
    if (!corrMap) return true;

    var holdings = Object.keys(portfolios || {}).filter(function(s) {
        return s !== sym && portfolios[s].qty > 0;
    });

    var highCorr = [];
    holdings.forEach(function(held) {
        var corr = corrMap[held];
        if (corr && corr >= 0.7) {
            highCorr.push(held + ' (상관관계 ' + corr.toFixed(2) + ')');
        }
    });

    if (highCorr.length > 0) {
        return confirm('⚠️ 상관관계 경고\n\n' + sym + '은(는) 보유 중인 다음 종목과 상관관계가 높습니다:\n'
            + highCorr.join('\n') + '\n\n분산 효과가 낮아 비중 15% 이내를 권장합니다.\n그래도 추가하시겠습니까?');
    }
    return true;
}

function toggleEtfSector(id) {
    var el = document.getElementById(id);
    var chev = document.getElementById(id + 'Chev');
    if (!el) return;
    var isHidden = el.classList.contains('hidden');
    el.classList.toggle('hidden');
    if (chev) chev.style.transform = isHidden ? '' : 'rotate(-90deg)';
}

function toggleGuide(id) {
    var el = document.getElementById(id);
    var chev = document.getElementById(id + 'Chev');
    if (!el) return;
    var isHidden = el.classList.contains('hidden');
    el.classList.toggle('hidden');
    if (chev) chev.style.transform = isHidden ? 'rotate(180deg)' : '';
}

// ── 6. 보유 종목 상태 카드 ──
function renderHoldingStatus() {
    var section = document.getElementById('holdingStatusSection');
    var list = document.getElementById('holdingStatusList');
    if (!section || !list) return;

    var syms = Object.keys(portfolios || {}).filter(function(s) { return portfolios[s].qty > 0; });
    if (syms.length === 0) { section.classList.add('hidden'); return; }

    section.classList.remove('hidden');
    var quadNow = getCurrentQuad();

    list.innerHTML = syms.map(function(sym) {
        var p = portfolios[sym];
        var md = MARKET_SNAPSHOT[sym] || {};
        var meta = ETF_DB.find(function(e){return e.sym===sym;}) || {};
        var currPrice = md.price || p.avgPrice || 0;
        var pnlPct = p.avgPrice > 0 ? ((currPrice - p.avgPrice) / p.avgPrice * 100) : 0;
        var pnlColor = pnlPct >= 0 ? 'text-green-400' : 'text-red-400';

        // 상태 판정
        var status = getHoldingStatus(sym, meta, md, quadNow);

        var statusStyles = {
            HOLD:  {icon:'🟢', color:'text-green-400', bg:'border-green-500/30', label:'HOLD'},
            WATCH: {icon:'🟡', color:'text-yellow-400', bg:'border-yellow-500/30', label:'WATCH'},
            EXIT:  {icon:'🔴', color:'text-red-400', bg:'border-red-500/30', label:'EXIT'}
        };
        var st = statusStyles[status.status] || statusStyles.HOLD;

        return '<div class="glass-panel rounded-xl p-3 border-l-4 ' + st.bg + ' flex items-center justify-between cursor-pointer" onclick="switchTab(\'strategy\');selectTicker(\''+sym+'\')">'
            + '<div class="flex items-center gap-3">'
            + '<div class="text-center w-10"><div class="text-lg leading-none">' + st.icon + '</div><div class="text-[8px] font-black ' + st.color + '">' + st.label + '</div></div>'
            + '<div>'
            + '<div class="flex items-center gap-1.5"><span class="font-black text-white text-sm">' + sym + '</span><span class="text-[9px] text-slate-500">' + escapeHtml(meta.desc||'') + '</span></div>'
            + '<div class="text-[10px] text-slate-400">' + escapeHtml(status.reason) + '</div>'
            + '</div>'
            + '</div>'
            + '<div class="text-right">'
            + '<div class="text-sm font-bold text-white">$' + currPrice.toFixed(2) + '</div>'
            + '<div class="text-xs font-bold ' + pnlColor + '">' + (pnlPct>=0?'+':'') + pnlPct.toFixed(1) + '%</div>'
            + '</div></div>';
    }).join('');
}

function getHoldingStatus(sym, meta, md, quadNow) {
    // Quad 기반 순풍/역풍 판정
    var isQuadFavorable = meta.quad && meta.quad.length > 0 && meta.quad.indexOf(quadNow) !== -1;
    var isAllQuad = meta.quad && meta.quad.length === 4;

    // TREND: 가격 > MA200
    var trendUp = md.price > 0 && md.ma200 > 0 && md.price > md.ma200;

    // 매크로 추천에서 exit 확인
    var exitRec = false;
    if (MACRO_DATA && MACRO_DATA.recommendations && MACRO_DATA.recommendations.exit) {
        exitRec = MACRO_DATA.recommendations.exit.some(function(r){return r.ticker===sym;});
    }

    if (exitRec) return {status:'EXIT', reason:'매크로 분석 매도 시그널'};
    if (!isQuadFavorable && !isAllQuad && quadNow) return {status:'EXIT', reason:'Quad '+quadNow+' 역풍 — 수혜 Quad: '+(meta.quad||[]).join(',')};
    if (!trendUp && md.ma200 > 0) return {status:'WATCH', reason:'MA200 하향 — 추가매수 중단 권장'};

    // 전환 리스크 체크
    if (MACRO_DATA && MACRO_DATA.quad && MACRO_DATA.quad.transition_risk) {
        var tr = MACRO_DATA.quad.transition_risk;
        var maxRisk = 0;
        [1,2,3,4].forEach(function(n) {
            if (n !== quadNow) {
                var r = tr['to_quad'+n] || 0;
                if (r > maxRisk) maxRisk = r;
            }
        });
        if (maxRisk >= 30) return {status:'WATCH', reason:'Quad 전환 리스크 ' + maxRisk + '% — 다음 지표 대기'};
    }

    return {status:'HOLD', reason: isAllQuad ? '전 Quad 공용 — 추세 유지' : 'Quad '+quadNow+' 순풍 — 추세 유지'};
}

function startNewsTicker() {
    const display = document.getElementById('newsDisplay');
    if(!display) return;
    if(NEWS_FEED.length === 0) {
        display.innerText = "뉴스 데이터 없음";
        return;
    }
    
    function tickerHtml(item) {
        const ko = item.titleKo ? "<br><span class=\"text-[10px] text-slate-500\">" + escapeHtml(item.titleKo) + "</span>" : "";
        return "● " + escapeHtml(item.title) + ko;
    }
    
    let index = 0;
    window.newsTickerIndex = 0;
    const listEl = document.getElementById('fullNewsList');
    if(listEl) {
        listEl.innerHTML = NEWS_FEED.map(n => {
            const koLine = n.titleKo ? '<div class="text-[10px] text-slate-500 mt-0.5">' + escapeHtml(n.titleKo) + '</div>' : '';
            var safeUrl = (n.url || '').replace(/'/g, '&#39;');
            return '<div class="p-3 bg-slate-800 rounded-xl border border-slate-700 mb-2 cursor-pointer hover:bg-slate-700 transition" onclick="window.open(\'' + safeUrl + '\', \'_blank\')"><div class="text-sm text-slate-200 font-bold leading-snug">' + escapeHtml(n.title) + ' <i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1 text-slate-500"></i></div>' + koLine + '</div>';
        }).join('');
    }
    
    if(window.newsTimer) clearInterval(window.newsTimer);
    window.newsTimer = setInterval(() => {
        if(document.hidden) return;
        const item = NEWS_FEED[index];
        display.classList.remove('news-slide-up'); void display.offsetWidth;
        display.innerHTML = tickerHtml(item);
        display.onclick = () => window.open(item.url, '_blank');
        display.classList.add('news-slide-up');
        index = (index + 1) % NEWS_FEED.length;
        window.newsTickerIndex = index;
    }, 3500); 
    
    display.innerHTML = tickerHtml(NEWS_FEED[0]);
    display.onclick = () => window.open(NEWS_FEED[0].url, '_blank');
}

// ==========================================
// 전략 탭 기능
// ==========================================
function selectTicker(sym) { 
    activeTicker = sym; 
    localStorage.setItem('umt_last_ticker', sym); 
    
    if(!portfolios[sym]) {
        portfolios[sym] = { qty: 0, avgPrice: 0, history: [], config: { mode: 'GRID', stages: 4, mdd: 20, alloc: 30, drops: [0,-6.67,-13.33,-20], weights: [25,25,25,25], basePrice: 0, boosterOn: false, boosterAllocPct: 0, boosterStages: 2, boosterMdd: 10 } }; 
        sanitizeData(); // 새로 생성된 객체도 소독
    }

    renderTickerBar(); 
    loadTickerData(sym);
}

function switchTab(id) {
    ['home','strategy','tradelog','settings'].forEach(t => {
        const tabEl = document.getElementById('tab-'+t);
        if(tabEl) tabEl.classList.add('hidden');
        const btn = document.getElementById('nav-'+t);
        if(btn) btn.classList.remove('active');
    });

    const aTab = document.getElementById('tab-'+id);
    if(aTab) aTab.classList.remove('hidden');

    const aBtn = document.getElementById('nav-'+id);
    if(aBtn) aBtn.classList.add('active');

    localStorage.setItem('umt_last_tab', id);
    if(id==='strategy' && activeTicker) setTimeout(() => loadTickerData(activeTicker), 10);
    if(id==='tradelog') setTimeout(() => renderTradeLog(), 10);
    if(id==='settings') initInputs();
    if(id==='home') { updateGlobalCalc(); const h = document.getElementById('heatmapContent'); if (h && !h.classList.contains('hidden')) renderMarketHeatmap(); }
}

function loadTradingViewChart(sym) {
    if (currentChartSym === sym) return; 
    currentChartSym = sym;
    
    const container = document.getElementById('tv_chart_container'); 
    if(!container) return;
    container.innerHTML = ''; 
    
    if(tvWidget) tvWidget = null; 
    if (typeof TradingView !== 'undefined') {
        try { 
            tvWidget = new TradingView.widget({ 
                "autosize": true, "symbol": sym, "interval": "D", "timezone": "Etc/UTC", "theme": "dark", 
                "style": "1", "locale": "kr", "toolbar_bg": "#1e293b", "enable_publishing": false, 
                "hide_top_toolbar": true, "container_id": "tv_chart_container", 
                "studies": ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"] 
            }); 
        } catch(e){ console.error("TV Error:", e); } 
    }
}

function updateStrategyDataUI(sym) {
    if (!portfolios[sym]) return; 
    const d = portfolios[sym]; 
    const md = MARKET_SNAPSHOT[sym] || {price:0, error:true}; 
    
    const pEl = document.getElementById('dispPrice');
    const cEl = document.getElementById('dispChange');
    
    if (md.error || md.price === 0) {
        if(pEl) pEl.innerText = "데이터 대기...";
        if(cEl) cEl.innerText = "-";
        document.getElementById('dispRSI').innerText = "-";
        document.getElementById('dispTrend').innerText = "-";
        document.getElementById('dispEMA').innerText = "-";
        document.getElementById('dispSMA').innerText = "-";
    } else {
        if(pEl) pEl.innerText = '$' + md.price.toFixed(2); 
        if(cEl) {
            cEl.innerText = `${md.change>=0?'+':''}${md.change.toFixed(2)}%`; 
            cEl.className = `text-xs font-bold ${md.change>=0?'text-red-400':'text-blue-400'}`;
        }

        document.getElementById('dispRSI').innerText = md.rsi.toFixed(1); 
        const tEl = document.getElementById('dispTrend');
        if(tEl) {
            tEl.innerText = md.price > md.ma200 ? 'Bull' : 'Bear'; 
            tEl.className = `text-xs font-bold ${md.price > md.ma200 ? 'text-red-400' : 'text-blue-400'}`;
        }
        document.getElementById('dispEMA').innerText = '$' + md.ema8.toFixed(2); 
        document.getElementById('dispSMA').innerText = '$' + md.ma200.toFixed(2); 
        
        if(!d.config.basePrice || d.config.basePrice === 0) {
            document.getElementById('planBasePrice').value = md.price.toFixed(2);
        }
    }
    
    document.getElementById('myQty').innerText = d.qty || 0; 
    document.getElementById('myAvg').innerText = '$'+(d.avgPrice || 0).toFixed(2); 
    
    const myPnlEl = document.getElementById('myPnL');
    if(d.qty>0 && md.price > 0){ 
        const pnl = (md.price - d.avgPrice) * d.qty; 
        const pct = (pnl / (d.avgPrice * d.qty)) * 100; 
        if(myPnlEl) {
            myPnlEl.innerText = (pnl>=0?'+':'') + '$' + pnl.toFixed(2) + ` (${pct.toFixed(1)}%)`; 
            myPnlEl.className = `text-lg font-black ${pnl>=0?'text-red-400':'text-blue-400'}`; 
        }
    } else { 
        if(myPnlEl) {
            myPnlEl.innerText = '$0.00'; 
            myPnlEl.className = 'text-lg font-black text-slate-500';
        }
    } 

    const allocPct = d.config.alloc || 30;
    const totalEquity = getTotalEquityUSD();
    const allocUsd = totalEquity * (allocPct/100);
    document.getElementById('infoAllocPct').innerText = allocPct + '%';
    document.getElementById('infoAllocUsd').innerText = '$' + Math.round(allocUsd).toLocaleString();
    const infoKrw = document.getElementById('infoAllocUsdKrw'); if (infoKrw) infoKrw.innerText = formatKrw(allocUsd);
    
    renderStrategyProgressCard(sym);
    calculatePlan();
    renderRescuePlan();
}

function getCurrentStage(sym) {
    const d = portfolios[sym]; if (!d || !d.config) return { current: 1, total: 4 };
    const stages = parseInt(document.getElementById('configStages').value) || (d.config.stages || 4);
    const boosterOn = d.config.boosterOn === true;
    const boosterStages = Math.max(0, parseInt(d.config.boosterStages) || 0);
    const totalStages = stages + (boosterOn ? boosterStages : 0);
    if ((d.qty || 0) <= 0) return { current: 1, total: totalStages, baseCurrent: 1, baseTotal: stages, boosterCurrent: 0, boosterTotal: boosterOn ? boosterStages : 0 };
    const drops = d.config.drops || [];
    const weights = d.config.weights || [];
    const basePrice = parseFloat(document.getElementById('planBasePrice').value) || d.config.basePrice || 0;
    if (basePrice === 0 || drops.length === 0) return { current: 1, total: totalStages, baseCurrent: 1, baseTotal: stages, boosterCurrent: 0, boosterTotal: boosterOn ? boosterStages : 0 };
    // calculatePlan()과 동일한 activeCycleId 추출
    const activeCycleId = (function() {
        if (!d) return null;
        if (d.currentCycleId != null) return d.currentCycleId;
        if ((d.qty || 0) > 0 && Array.isArray(d.history)) {
            const maxCycle = d.history.reduce((m, h) => (h && h.cycleId != null && h.cycleId > m ? h.cycleId : m), 0);
            return maxCycle > 0 ? maxCycle : null;
        }
        return null;
    })();
    const allocPct = d.config.alloc || 30;
    const investMoney = getTotalEquityUSD() * (allocPct / 100);

    // 실제 체결된 단계(현재 사이클 기준) 추적
    let baseLastBought = 0;
    let boosterLastBought = 0;
    (d.history || []).forEach(function(h) {
        if (!h || h.type !== 'BUY') return;
        const s = parseInt(h.stage, 10);
        if (isNaN(s) || s <= 0) return;
        if (activeCycleId != null && h.cycleId !== activeCycleId) return;
        if (s <= stages) baseLastBought = Math.max(baseLastBought, s);
        else if (boosterOn && s <= (stages + boosterStages)) boosterLastBought = Math.max(boosterLastBought, s - stages);
    });

    let completed = 0;
    let inProgressStage = 0;
    for (let i = 0; i < stages && i < drops.length; i++) {
        const drop = drops[i];
        const weight = (weights[i] != null) ? weights[i] : (100 / stages);
        const targetPrice = basePrice * (1 + drop / 100);
        const amount = investMoney * (weight / 100);
        const targetQty = targetPrice > 0 ? Math.floor(amount / targetPrice) : 0;
        const boughtQty = (d.history || []).filter(h => {
            if (!h || h.type !== 'BUY') return false;
            if (parseInt(h.stage) !== (i + 1)) return false;
            if (activeCycleId != null) return h.cycleId === activeCycleId;
            return true;
        }).reduce((sum, h) => sum + h.qty, 0);
        if (targetQty > 0 && boughtQty >= targetQty) {
            completed++;
        } else {
            if (boughtQty > 0) inProgressStage = i + 1;
            break;
        }
    }
    let boosterInProgressStage = 0;
    if (boosterOn && boosterStages > 0 && completed >= stages) {
        const lastDrop = drops[stages - 1];
        const baseMdd = parseFloat(d.config.mdd) || 20;
        const boosterExtra = parseFloat(d.config.boosterMdd) || 10;
        const finalEndDrop = -(baseMdd + boosterExtra);
        const boosterInvest = getTotalEquityUSD() * ((parseFloat(d.config.boosterAllocPct) || 0) / 100);
        for (let i = 0; i < boosterStages; i++) {
            const step = (finalEndDrop - lastDrop) / boosterStages;
            const bDrop = lastDrop + (i + 1) * step;
            const targetPrice = basePrice * (1 + bDrop / 100);
            const amount = boosterInvest / boosterStages;
            const targetQty = targetPrice > 0 ? Math.floor(amount / targetPrice) : 0;
            const stageNum = stages + i + 1;
            const boughtQty = (d.history || []).filter(h => {
                if (!h || h.type !== 'BUY') return false;
                if (parseInt(h.stage) !== stageNum) return false;
                if (activeCycleId != null) return h.cycleId === activeCycleId;
                return true;
            }).reduce((sum, h) => sum + h.qty, 0);
            if (targetQty > 0 && boughtQty >= targetQty) {
                completed++;
            } else {
                if (boughtQty > 0) boosterInProgressStage = stageNum;
                break;
            }
        }
    }
    // 계획수량 기준 계산이 실제 체결 단계를 과소평가하지 않도록 보정
    if (baseLastBought > 0 && baseLastBought > completed) {
        inProgressStage = Math.max(inProgressStage, baseLastBought);
    }
    if (boosterLastBought > 0) {
        boosterInProgressStage = Math.max(boosterInProgressStage, boosterLastBought + stages);
    }
    const current = Math.min(completed + 1, totalStages);
    const baseCurrent = completed < stages ? (completed + 1) : stages;
    const baseTotal = stages;
    const boosterTotal = boosterOn ? boosterStages : 0;
    const boosterCurrent = completed >= stages ? Math.min(completed - stages + 1, boosterStages) : 0;
    return {
        current,
        total: totalStages,
        baseCurrent,
        baseTotal,
        boosterCurrent,
        boosterTotal,
        baseCompleted: Math.min(completed, stages),
        baseInProgress: inProgressStage,
        boosterCompleted: completed > stages ? (completed - stages) : 0,
        boosterInProgress: boosterInProgressStage
    };
}

function renderStrategyProgressCard(sym) {
    const card = document.getElementById('strategyProgressCard');
    if (!card || !sym || !portfolios[sym]) { if (card) card.classList.add('hidden'); return; }
    const d = portfolios[sym];
    const totalEquity = getTotalEquityUSD();
    const allocPct = d.config && (d.config.alloc != null) ? d.config.alloc : 0;
    const allocUsd = totalEquity * (allocPct / 100);
    const investedUsd = (d.qty || 0) * (d.avgPrice || 0);
    const execRate = allocUsd > 0 ? Math.min(100, (investedUsd / allocUsd) * 100) : 0;
    const remainUsd = Math.max(0, allocUsd - investedUsd);
    const stage = getCurrentStage(sym);
    card.classList.remove('hidden');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    set('progressAllocPct', allocPct + '%');
    set('progressAllocUsd', '$' + Math.round(allocUsd).toLocaleString());
    set('progressAllocKrw', formatKrw(allocUsd));
    set('progressInvestedUsd', '$' + Math.round(investedUsd).toLocaleString());
    set('progressInvestedKrw', formatKrw(investedUsd));
    set('progressQtyAvg', (d.qty || 0) + ' / $' + (d.avgPrice || 0).toFixed(2));
    const makeStageText = function(label, completed, inProgress, total) {
        if ((d.qty || 0) <= 0) return '미보유 (대기)';
        if (inProgress && inProgress > 0) return inProgress + '단계 진입 (진행중)';
        if (completed && completed > 0) {
            const cap = (total && total > 0) ? Math.min(completed, total) : completed;
            return cap + '단계까지 완료';
        }
        return '1단계 대기';
    };
    const baseText = makeStageText('그리드', stage.baseCompleted, stage.baseInProgress, stage.baseTotal);
    const boosterText = (stage.boosterTotal > 0)
        ? makeStageText('부스터', stage.boosterCompleted, stage.boosterInProgress ? (stage.boosterInProgress - (stage.baseTotal || 0)) : 0, stage.boosterTotal)
        : '';
    const stageLine = boosterText ? ('그리드: ' + baseText + ' · 부스터: ' + boosterText) : ('그리드: ' + baseText);
    set('progressStage', stageLine);
    set('progressExecRate', execRate.toFixed(1) + '%');
    const execBar = document.getElementById('progressExecBar');
    if (execBar) execBar.style.width = Math.min(100, Math.max(0, execRate)) + '%';
    set('progressRemainUsd', '$' + Math.round(remainUsd).toLocaleString());
    set('progressRemainKrw', formatKrw(remainUsd));

    var currentPrice = (MARKET_SNAPSHOT[sym] && MARKET_SNAPSHOT[sym].price > 0) ? MARKET_SNAPSHOT[sym].price : ((d.marketData && d.marketData.price > 0) ? d.marketData.price : (d.avgPrice || 0));

    // 매도 진행 표시 (현재 사이클 기준)
    const sellStageEl = document.getElementById('progressSellStage');
    if (sellStageEl) {
        const activeCycleId = (d.currentCycleId != null)
            ? d.currentCycleId
            : ((d.qty || 0) > 0 && Array.isArray(d.history))
                ? d.history.reduce((m, h) => (h && h.cycleId != null && h.cycleId > m ? h.cycleId : m), 0)
                : 0;

        const sells = (d.history || []).filter(h => {
            if (!h || h.type !== 'SELL') return false;
            if (activeCycleId > 0) return h.cycleId === activeCycleId;
            return true; // 과거 데이터 호환
        });
        const soldQty = sells.reduce((sum, h) => sum + (h.qty || 0), 0);
        const stageSet = {};
        sells.forEach(h => {
            const s = parseInt(h.stage, 10);
            if (!isNaN(s) && s > 0) stageSet[s] = true;
        });
        const doneStages = Object.keys(stageSet).map(n => parseInt(n, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
        const maxStage = doneStages.length ? doneStages[doneStages.length - 1] : 0;

        const remainQty = (d.qty || 0);
        const remainVal = (currentPrice > 0) ? (remainQty * currentPrice) : 0;

        if (remainQty <= 0) {
            sellStageEl.innerText = '매도: 전량 매도 완료';
        } else if (maxStage > 0) {
            sellStageEl.innerText = `매도: ${maxStage}단계 매도 완료 · 잔여 ${remainQty}주 / $${Math.round(remainVal).toLocaleString()}`;
        } else if (soldQty > 0) {
            sellStageEl.innerText = `매도: 진행중 · 잔여 ${remainQty}주 / $${Math.round(remainVal).toLocaleString()}`;
        } else {
            sellStageEl.innerText = `매도: 대기 · 잔여 ${remainQty}주 / $${Math.round(remainVal).toLocaleString()}`;
        }
    }

    const pnlWrap = document.getElementById('progressPnlWrap');
    const pnlEl = document.getElementById('progressPnlPct');
    const avg = d.avgPrice || 0;
    if (pnlWrap && pnlEl && currentPrice > 0 && avg > 0) {
        const pct = ((currentPrice - avg) / avg) * 100;
        pnlWrap.classList.remove('hidden');
        pnlEl.innerText = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
        pnlEl.className = 'font-black text-sm leading-tight ' + (pct >= 0 ? 'text-red-400' : 'text-blue-400');
    } else if (pnlWrap) {
        pnlWrap.classList.add('hidden');
    }
}

function loadTickerData(sym) { 
    if (!portfolios[sym]) return; 
    const d = portfolios[sym]; 
    const meta = ETF_DB.find(e => e.sym === sym) || {name:sym, desc:'Custom', lev:'?'}; 
    
    document.getElementById('activeTickerIcon').innerText = sym; 
    document.getElementById('activeTickerSym').innerText = sym;
    document.getElementById('activeTickerDesc').innerText = meta.name; 
    
    document.getElementById('configMode').value = d.config.mode || 'GRID';
    document.getElementById('configMdd').value = d.config.mdd || 20; 
    document.getElementById('configStages').value = d.config.stages || 4; 
    document.getElementById('planBasePrice').value = d.config.basePrice || 0;
    const sec = document.getElementById('boosterConfigSection');
    if (sec) {
        if ((d.config.mode || '') === 'BOOSTER') {
            sec.classList.remove('hidden');
            const onEl = document.getElementById('boosterOn'); if (onEl) onEl.checked = d.config.boosterOn === true;
            const ap = document.getElementById('boosterAllocPct'); if (ap) ap.value = d.config.boosterAllocPct != null ? d.config.boosterAllocPct : 0;
            const st = document.getElementById('boosterStages'); if (st) st.value = d.config.boosterStages != null ? d.config.boosterStages : 2;
            const md = document.getElementById('boosterMdd'); if (md) md.value = d.config.boosterMdd != null ? d.config.boosterMdd : 10;
        } else {
            sec.classList.add('hidden');
        }
    }
    const plans = d.config.sellPlans || [];
    for (let i = 1; i <= 3; i++) {
        const p = plans[i - 1] || {};
        const pe = document.getElementById('sellTargetPct' + i);
        const re = document.getElementById('sellTargetRatio' + i);
        if (pe) pe.value = p.targetPct != null ? p.targetPct : (i === 1 ? 10 : (i === 2 ? 15 : 20));
        if (re) re.value = p.sellRatio != null ? p.sellRatio : (i === 3 ? 100 : 50);
    }
    
    updateStrategyDataUI(sym);
    loadTradingViewChart(sym);
    
    renderStageInputs(); 
    renderSellPlan(); 
    renderJournal();
}

function openAnalysisModal(sym) { 
    const md = MARKET_SNAPSHOT[sym] || {price:0, error:true}; 
    const meta = ETF_DB.find(e => e.sym === sym) || {name:sym, desc:'Custom ETF'}; 
    selectedScanTicker = sym; 
    
    document.getElementById('modalTicker').innerText = sym; 
    document.getElementById('modalName').innerText = meta.name; 
    
    if (md.error || md.price === 0) {
        document.getElementById('modalPrice').innerText = "데이터 없음";
        document.getElementById('modalChange').innerText = "-";
        document.getElementById('modalSignal').innerText = "서버 연결 확인 필요";
    } else {
        document.getElementById('modalPrice').innerText = '$' + md.price.toFixed(2); 
        document.getElementById('modalChange').innerText = `${md.change>=0?'+':''}${md.change.toFixed(2)}%`; 
        document.getElementById('modalRSI').innerText = md.rsi.toFixed(1); 
        document.getElementById('modalTrend').innerText = md.price > md.ma200 ? 'Bull' : 'Bear'; 
        document.getElementById('modalSTrend').innerText = md.price > md.ema8 ? 'Hold' : 'Exit'; 
        let msg = "관망"; 
        if (md.price > md.ma200) { 
            if (md.rsi < 40) msg = "🟢 강력 매수 (과매도)"; else if (md.rsi < 60) msg = "🟢 분할 매수 진입"; else if (md.price > md.ema8) msg = "🔵 보유 홀딩"; else msg = "🟠 단기 이탈"; 
        } else msg = "🔴 하락 추세 (위험)"; 
        document.getElementById('modalSignal').innerText = msg; 
    }

    const container = document.getElementById('modalChartContainer'); 
    if(container) container.innerHTML = ''; 
    if(modalWidget) modalWidget = null; 
    if (typeof TradingView !== 'undefined') {
        try { 
            modalWidget = new TradingView.widget({ "autosize": true, "symbol": sym, "interval": "D", "timezone": "Etc/UTC", "theme": "dark", "style": "1", "locale": "kr", "toolbar_bg": "#1e293b", "enable_publishing": false, "hide_top_toolbar": true, "container_id": "modalChartContainer", "studies": ["MASimple@tv-basicstudies"] }); 
        } catch(e){} 
    }
    // ETF 상세 정보 렌더링
    renderEtfDetailSection(sym, meta, md);

    document.getElementById('analysisModal').classList.remove('hidden');
    document.getElementById('analysisModal').classList.add('flex');
}

function renderEtfDetailSection(sym, meta, md) {
    var sec = document.getElementById('etfDetailSection');
    if (!sec) return;

    var detail = ETF_DETAIL[sym];
    if (!detail) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');

    var quadNow = getCurrentQuad();
    var tierLabels = {1:'Tier 1 (초고변동)', 2:'Tier 2 (고변동)', 3:'Tier 3 (중변동)', 4:'Tier 4 (저변동)'};
    var quadNames = {1:'Q1 골디락스', 2:'Q2 과열', 3:'Q3 스태그', 4:'Q4 침체'};

    // 최적/주의 Quad
    var bestQ = (detail.bestQuad||[]).map(function(q){return '<span class="text-green-400">'+quadNames[q]+'</span>';}).join(', ') || '전 Quad';
    var cautionQ = (detail.cautionQuad||[]).map(function(q){return '<span class="text-red-400">'+quadNames[q]+'</span>';}).join(', ') || '없음';

    // 현재 Quad와의 관계
    var quadStatus = '';
    if (quadNow) {
        if (detail.bestQuad.indexOf(quadNow) !== -1) quadStatus = '<span class="text-green-400 font-bold">현재 Quad '+quadNow+' 순풍</span>';
        else if (detail.cautionQuad.indexOf(quadNow) !== -1) quadStatus = '<span class="text-red-400 font-bold">현재 Quad '+quadNow+' 역풍 주의</span>';
        else quadStatus = '<span class="text-slate-400">현재 Quad '+quadNow+' 중립</span>';
    }

    // Quad별 평균 조정폭
    var pullback = QUAD_PULLBACK[sym];
    var pullbackHtml = '';
    if (pullback) {
        pullbackHtml = '<div class="grid grid-cols-4 gap-1 mt-1">' + [1,2,3,4].map(function(q) {
            var pct = pullback[q];
            var isCurrent = q === quadNow;
            return '<div class="text-center text-[10px] p-1 rounded ' + (isCurrent?'bg-slate-700 ring-1 ring-blue-500':'bg-slate-800/50') + '">'
                + '<div class="text-slate-500">' + quadNames[q].split(' ')[0] + '</div>'
                + '<div class="font-bold ' + (isCurrent?'text-white':'text-slate-400') + '">' + pct + '%</div></div>';
        }).join('') + '</div>';
    }

    // 상관관계 경고 (보유 종목과)
    var corrHtml = renderCorrelationWarnings(sym);

    sec.innerHTML = '<div class="bg-slate-800/60 rounded-xl p-3 border border-slate-700 space-y-2 text-[11px]">'
        + '<div class="text-slate-300">' + escapeHtml(detail.summary) + '</div>'
        + '<div class="grid grid-cols-2 gap-2">'
        + '<div><span class="text-slate-500">레버리지:</span> <span class="text-white font-bold">' + (meta.lev||'') + '</span></div>'
        + '<div><span class="text-slate-500">변동성:</span> <span class="text-white font-bold">' + (tierLabels[meta.tier]||'') + '</span></div>'
        + '<div><span class="text-slate-500">운용보수:</span> <span class="text-white">' + (detail.expense||'-') + '</span></div>'
        + '<div><span class="text-slate-500">보유종목:</span> <span class="text-white">' + escapeHtml(meta.holdings||'') + '</span></div>'
        + '</div>'
        + '<div><span class="text-slate-500">최적 Quad:</span> ' + bestQ + '</div>'
        + '<div><span class="text-slate-500">주의 Quad:</span> ' + cautionQ + '</div>'
        + (quadStatus ? '<div>' + quadStatus + '</div>' : '')
        + (pullbackHtml ? '<div><span class="text-slate-500">Quad별 평균 조정폭:</span>' + pullbackHtml + '</div>' : '')
        + '<div class="pt-1.5 border-t border-slate-700"><span class="text-amber-400 font-bold">TIP:</span> <span class="text-slate-300">' + escapeHtml(detail.tip||'') + '</span></div>'
        + corrHtml
        + '</div>';
}
    
function closeAnalysisModal() { 
    document.getElementById('analysisModal').classList.add('hidden'); 
    document.getElementById('analysisModal').classList.remove('flex'); 
    const c = document.getElementById('modalChartContainer');
    if(c) c.innerHTML = ''; 
}

// 🔥 AI 스마트 최적화 (로직 보존)
function runAiResultLogic() {
    const ticker = activeTicker;
    const md = MARKET_SNAPSHOT[ticker] || {price:0};
    const vixData = MARKET_SNAPSHOT['^VIX'] || {price:20};
    const meta = ETF_DB.find(e => e.sym === ticker) || {tier:2};

    let currentPrice = md.price > 0 ? md.price : (portfolios[ticker].config.basePrice || 100);
    const vix = (vixData && vixData.price != null) ? vixData.price : 20;

    // 1) 변동성(ATR) 계산: md.atr 우선, 없으면 폴백(현재가 * 2.5% * 레버리지배수)
    const levStr = (meta && meta.lev) ? String(meta.lev) : '1x';
    const levMatch = levStr.match(/(\d+)/);
    const levMult = levMatch ? Math.max(1, parseInt(levMatch[1], 10)) : 1;
    // 종목별 진폭 보정(ETF_DB.tier): Tier1(초고) / Tier2(고) / Tier3(중) / Tier4(저)
    const volTier = (meta && meta.tier) ? meta.tier : 2;
    const volAtrAdj = volTier === 1 ? 1.15 : (volTier === 3 ? 0.9 : (volTier === 4 ? 0.75 : 1.0));
    const atr = (md && md.atr != null && !isNaN(md.atr) && Number(md.atr) > 0)
        ? Number(md.atr)
        : (currentPrice * 0.025 * levMult * volAtrAdj);

    // 2) Quad + 기술적 시그널 기반 비중 모드 판정
    let reasons = [];
    let mode = "GRID";
    let stages = 4;
    let weights = [25, 25, 25, 25];
    let atrMultipliers = [0, 1.5, 3.5, 6.0];
    let boosterOn = false;
    let boosterStages = 2;
    let boosterAllocPct = 10;
    let boosterMdd = 10;

    // Quad 순풍/역풍 판정
    const quadNow = getCurrentQuad();
    const isQuadFavorable = meta.quad && meta.quad.length > 0 && meta.quad.indexOf(quadNow) !== -1;
    const isAllQuad = meta.quad && meta.quad.length === 4;
    const isQuadTailwind = isQuadFavorable || isAllQuad;

    // 기술적 시그널
    const trendUp = (currentPrice > md.ma200) && md.ma200 > 0;
    const rsi = (md.rsi != null && !isNaN(md.rsi)) ? md.rsi : 50;

    // PRD 비중 모드 자동 판정:
    // Quad 순풍 + TREND 강세 + RSI < 50  → 공격형
    // Quad 순풍 + TREND 강세 + RSI > 50  → 균등형
    // Quad 역풍 or VIX > 28 or TREND 약세 → 방어형
    let weightMode = 'balanced'; // 공격=aggressive, 균등=balanced, 방어=defensive

    if (isQuadTailwind && trendUp && rsi < 50) {
        weightMode = 'aggressive';
    } else if (isQuadTailwind && trendUp && rsi >= 50) {
        weightMode = 'balanced';
    } else if (!isQuadTailwind || vix > 28 || !trendUp) {
        weightMode = 'defensive';
    }

    // 비중 모드별 단계 수 + 가중치 설정 (PRD STEP 4)
    if (weightMode === 'aggressive') {
        // Quad 순풍: 3~4단계, 좁은 간격
        stages = 4;
        weights = [40, 30, 20, 10];
        atrMultipliers = [0, 1.0, 3.0, 6.0];
        const quadLabel = quadNow ? 'Quad '+quadNow+' 순풍' : '순풍';
        reasons.push('🔥 공격형 — ' + quadLabel + ' + TREND 강세 + RSI ' + rsi.toFixed(0) + ' (과매도 진입)');
        reasons.push('- 초반 40% 투입. 얕은 조정에서 핵심 물량 확보.');
    } else if (weightMode === 'balanced') {
        stages = 4;
        weights = [25, 25, 25, 25];
        atrMultipliers = [0, 1.2, 3.0, 5.5];
        const quadLabel = quadNow ? 'Quad '+quadNow+' 순풍' : '순풍';
        reasons.push('⚖️ 균등형 — ' + quadLabel + ' + TREND 강세, RSI ' + rsi.toFixed(0) + ' (타이밍 불확실)');
        reasons.push('- 방향은 맞지만 타이밍 확신 없어 균등 배분.');
    } else {
        // 방어형: 7~8단계, 넓은 간격
        stages = vix >= 30 ? 8 : 7;
        if (stages === 8) {
            weights = [5, 7, 10, 12, 15, 17, 17, 17];
            atrMultipliers = [0, 1.0, 2.5, 4.5, 7.0, 9.5, 12.0, 14.5];
        } else {
            weights = [10, 10, 12, 15, 17, 18, 18];
            atrMultipliers = [0, 1.2, 3.0, 5.5, 8.0, 11.0, 14.0];
        }
        boosterOn = true;
        boosterStages = 2;
        boosterAllocPct = 10;
        boosterMdd = 10;
        var defReason = [];
        if (!isQuadTailwind && quadNow) defReason.push('Quad '+quadNow+' 역풍');
        if (vix > 28) defReason.push('VIX '+vix.toFixed(1));
        if (!trendUp) defReason.push('MA200 하향');
        reasons.push('🛡️ 방어형 — ' + defReason.join(' + '));
        reasons.push('- 초반 가볍게, 하단에서 무겁게. 깊은 조정에 대비합니다.');
    }

    // MDD 캡핑 — Quad별 평균 조정폭 프리셋 우선, 없으면 기본값
    const atrPct = currentPrice > 0 ? (atr / currentPrice) * 100 : 0;
    let maxMddCap;
    var pullbackData = QUAD_PULLBACK[ticker];
    if (pullbackData && quadNow && pullbackData[quadNow] != null) {
        maxMddCap = Math.abs(pullbackData[quadNow]);
        reasons.push('📊 Quad ' + quadNow + ' 평균 조정폭 적용: -' + maxMddCap + '% (' + ticker + ')');
    } else {
        maxMddCap = weightMode === 'aggressive' ? 18 : (weightMode === 'balanced' ? 25 : (vix >= 30 ? 40 : 35));
    }
    const volCapAdj = volTier === 4 ? 0.75 : (volTier === 3 ? 0.9 : 1.0);
    maxMddCap = maxMddCap * volCapAdj;
    if (globalData && globalData.mddLimit != null && !isNaN(globalData.mddLimit)) {
        maxMddCap = Math.min(maxMddCap, Math.max(10, Number(globalData.mddLimit)));
    }
    const lastMult = (atrMultipliers[stages - 1] != null) ? Number(atrMultipliers[stages - 1]) : 0;
    const projectedLastDrop = atrPct * lastMult;
    if (projectedLastDrop > maxMddCap && projectedLastDrop > 0) {
        const scale = maxMddCap / projectedLastDrop;
        atrMultipliers = atrMultipliers.map(function(m) { return parseFloat((Number(m) * scale).toFixed(4)); });
        reasons.push('🛡️ MDD 캡핑: -' + maxMddCap.toFixed(0) + '% 이내로 제한');
    }

    // 3) Drop% 변환
    const drops = [];
    for (let i = 0; i < stages; i++) {
        const mult = (atrMultipliers[i] != null) ? Number(atrMultipliers[i]) : 0;
        const dropPct = currentPrice > 0 ? -((atr * mult) / currentPrice * 100) : 0;
        drops.push(parseFloat(dropPct.toFixed(2)));
    }

    const mddRecommend = Math.min(80, Math.max(10, Math.abs(drops[drops.length - 1] || 0)));
    const gapApprox = stages > 1 ? (mddRecommend / (stages - 1)) : 0;

    const modeLabels = {aggressive:'공격형', balanced:'균등형', defensive:'방어형'};
    const tierLabel = 'Tier ' + volTier;
    reasons.push('📏 ATR 기반 간격: $' + atr.toFixed(2) + ' (' + levStr + ' · ' + tierLabel + ')');
    reasons.push('💡 비중 모드: ' + modeLabels[weightMode] + ' — 수동 변경 시 경고가 표시됩니다.');

    // 바로 적용 (confirm 없이)
    const d = portfolios[activeTicker];
    d.config.mode = mode; d.config.stages = stages; d.config.mdd = mddRecommend;
    d.config.drops = drops;
    d.config.weights = weights;
    d.config.weightMode = weightMode;
    d.config.boosterOn = boosterOn === true;
    d.config.boosterStages = boosterStages;
    d.config.boosterAllocPct = boosterAllocPct;
    d.config.boosterMdd = boosterMdd;

    document.getElementById('configMode').value = mode;
    document.getElementById('configStages').value = stages;
    document.getElementById('configMdd').value = mddRecommend;
    const onEl = document.getElementById('boosterOn'); if (onEl) onEl.checked = d.config.boosterOn === true;
    const stEl = document.getElementById('boosterStages'); if (stEl) stEl.value = d.config.boosterStages != null ? d.config.boosterStages : 2;
    const apEl = document.getElementById('boosterAllocPct'); if (apEl) apEl.value = d.config.boosterAllocPct != null ? d.config.boosterAllocPct : 0;
    const mdEl = document.getElementById('boosterMdd'); if (mdEl) mdEl.value = d.config.boosterMdd != null ? d.config.boosterMdd : 10;
    if(d.config.basePrice === 0) d.config.basePrice = currentPrice;

    saveAll(); renderStageInputs(); renderSellPlan();
    showToast(modeLabels[weightMode] + ' · MDD -' + mddRecommend.toFixed(0) + '% · ' + stages + '단계 적용');
}

function startAiSimulation() {
    if(!activeTicker) return;
    document.getElementById('aiSimModal').classList.remove('hidden'); document.getElementById('aiSimModal').classList.add('flex');
    const steps = ["Quad 국면 + 기술적 시그널 분석 중...", "변동성 Tier + ATR 기반 간격 산출 중...", "비중 모드 판정 + 최적 매수 타점 도출 중..."];
    let step = 0;
    const interval = setInterval(() => {
        if(step < steps.length) { document.getElementById('simStatusText').innerText = steps[step]; step++; } 
        else { clearInterval(interval); setTimeout(() => { document.getElementById('aiSimModal').classList.add('hidden'); document.getElementById('aiSimModal').classList.remove('flex'); runAiResultLogic(); }, 500); }
    }, 600); 
}

function applyManualConfig() {
    const mode = document.getElementById('configMode').value;
    const mdd = parseFloat(document.getElementById('configMdd').value) || 20;
    const stages = parseInt(document.getElementById('configStages').value) || 4;
    const d = portfolios[activeTicker];
    
    d.config.mode = mode;
    d.config.stages = stages;
    d.config.mdd = mdd;
    
    const gap = stages > 1 ? mdd / (stages - 1) : 0; 
    d.config.drops = [];
    for(let i=0; i<stages; i++) { d.config.drops.push(parseFloat(-(gap * i).toFixed(2))); }
    
    const weights = Array(stages).fill(Math.floor(100/stages));
    const rem = 100 % stages;
    for(let i=0; i<rem; i++) weights[i]++;
    d.config.weights = weights;
    
    d.config.basePrice = parseFloat(document.getElementById('planBasePrice').value) || 0;
    if (mode === 'BOOSTER') {
        const sec = document.getElementById('boosterConfigSection');
        if (sec) { sec.classList.remove('hidden'); }
        if (document.getElementById('boosterOn')) document.getElementById('boosterOn').checked = d.config.boosterOn === true;
        if (document.getElementById('boosterAllocPct')) document.getElementById('boosterAllocPct').value = d.config.boosterAllocPct != null ? d.config.boosterAllocPct : 0;
        if (document.getElementById('boosterStages')) document.getElementById('boosterStages').value = d.config.boosterStages != null ? d.config.boosterStages : 2;
        if (document.getElementById('boosterMdd')) document.getElementById('boosterMdd').value = d.config.boosterMdd != null ? d.config.boosterMdd : 10;
    } else {
        const sec = document.getElementById('boosterConfigSection');
        if (sec) sec.classList.add('hidden');
    }
    saveAll();
    renderStageInputs();
    showStrategyMessage('manualConfigSaveMessage', '저장 완료');
}

function renderStageInputs() {
    const stages = parseInt(document.getElementById('configStages').value) || 4;
    const c = document.getElementById('stageConfigContainer');
    c.innerHTML = '';
    const d = portfolios[activeTicker];
    
    if (!d.config.drops || d.config.drops.length !== stages) {
        const gap = stages > 1 ? (d.config.mdd || 20) / (stages - 1) : 0;
        d.config.drops = [];
        for(let i=0; i<stages; i++) d.config.drops.push(parseFloat(-(gap * i).toFixed(2)));
        d.config.weights = Array(stages).fill(Math.floor(100 / stages));
        for(let i=0; i<(100 % stages); i++) d.config.weights[i]++;
    }
    
    for(let i=0; i<stages; i++) {
        c.innerHTML += `
        <div class="grid grid-cols-12 gap-1.5 items-center mb-1">
            <div class="col-span-2 text-center text-xs text-slate-500 font-bold">${i+1}차</div>
            <div class="col-span-5">
                <div class="relative">
                    <input type="number" class="matrix-input text-red-400 bg-slate-900 border-slate-700 font-black pl-2" value="${d.config.drops[i].toFixed(2)}" id="drop_${i}" oninput="updateWeightSumDisplay()">
                    <span class="absolute right-2 top-1.5 text-xs text-slate-600">%</span>
                </div>
            </div>
            <div class="col-span-5">
                <div class="relative">
                    <input type="number" class="matrix-input text-blue-400 bg-slate-900 border-slate-700 font-black pl-2" value="${d.config.weights[i]}" id="wgt_${i}" oninput="updateWeightSumDisplay()">
                    <span class="absolute right-2 top-1.5 text-xs text-slate-600">%</span>
                </div>
            </div>
        </div>`;
    }
    c.innerHTML += `
        <div class="mt-2 pt-2 border-t border-slate-700">
            <div class="text-xs text-slate-400 mb-1">현재 합계: <span id="weightSumText" class="font-bold text-white">0</span>%</div>
            <div id="weightSumWarning" class="hidden text-xs text-red-400 mb-2"></div>
            <div class="flex items-center gap-2">
                <button type="button" onclick="applyBuyStrategyUpdate()" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs">매수 전략 업데이트</button>
                <span id="buyStrategySaveMessage" class="text-emerald-400 text-xs font-bold"></span>
            </div>
        </div>`;
    updateWeightSumDisplay();
    calculatePlan();
}

function updateWeightSumDisplay() {
    const stages = parseInt(document.getElementById('configStages').value) || 4;
    let sum = 0;
    for (let i = 0; i < stages; i++) {
        const el = document.getElementById('wgt_' + i);
        if (el) sum += parseFloat(el.value) || 0;
    }
    const sumEl = document.getElementById('weightSumText');
    const warnEl = document.getElementById('weightSumWarning');
    if (sumEl) sumEl.textContent = sum.toFixed(1);
    if (warnEl) {
        if (sum > 100) {
            warnEl.classList.remove('hidden');
            warnEl.textContent = '매수 비중 합계가 100%를 초과했습니다. 다른 단계 비중을 조정하세요.';
        } else {
            warnEl.classList.add('hidden');
            warnEl.textContent = '';
        }
    }
}

function applyBuyStrategyUpdate() {
    updateWeightSumDisplay();
    const stages = parseInt(document.getElementById('configStages').value) || 4;
    let sum = 0;
    for (let i = 0; i < stages; i++) {
        const el = document.getElementById('wgt_' + i);
        if (el) sum += parseFloat(el.value) || 0;
    }
    if (sum > 100) {
        alert('매수 비중 합계가 100%를 초과했습니다. 다른 단계 비중을 조정하세요.');
        return;
    }
    updateConfig();
    renderStageInputs();
    showStrategyMessage('buyStrategySaveMessage', '저장 완료');
}

function showStrategyMessage(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = text; setTimeout(function() { el.textContent = ''; }, 2000); }
}

function updateBasePriceAndSave() {
    if (!activeTicker || !portfolios[activeTicker]) return;
    portfolios[activeTicker].config.basePrice = parseFloat(document.getElementById('planBasePrice').value) || 0;
    saveAll();
    calculatePlan();
    renderStrategyProgressCard(activeTicker);
}
    
function calculatePlan() {
    const d = portfolios[activeTicker];
    const activeCycleId = (function() {
        if (!d) return null;
        if (d.currentCycleId != null) return d.currentCycleId;
        if ((d.qty || 0) > 0 && Array.isArray(d.history)) {
            const maxCycle = d.history.reduce((m, h) => (h && h.cycleId != null && h.cycleId > m ? h.cycleId : m), 0);
            return maxCycle > 0 ? maxCycle : null;
        }
        return null;
    })();
    const stages = parseInt(document.getElementById('configStages').value) || 4;
    const drops = d.config.drops || [];
    const weights = d.config.weights || [];
    const allocPct = d.config.alloc || 30; 
    const basePrice = parseFloat(document.getElementById('planBasePrice').value) || 0;
    const totalEquityUSD = getTotalEquityUSD();
    const investMoney = totalEquityUSD * (allocPct/100);
    const boosterOn = d.config.boosterOn === true;
    const boosterStages = Math.max(0, parseInt(d.config.boosterStages) || 0);
    const boosterAllocPct = parseFloat(d.config.boosterAllocPct) || 0;
    const baseMdd = parseFloat(d.config.mdd) || 20;
    const boosterExtra = parseFloat(d.config.boosterMdd) || 10;
    const finalEndDrop = -(baseMdd + boosterExtra);
    
    const tbody = document.getElementById('planTableBody');
    tbody.innerHTML = '';
    
    if (basePrice === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-xs text-slate-500">1차 기준가를 입력하세요.</td></tr>';
        return;
    }

    for(let i=0; i<stages; i++) {
        if(i >= drops.length) break;
        const drop = drops[i];
        const weight = (weights[i] != null) ? weights[i] : (100/stages);
        const targetPrice = basePrice * (1 + drop/100);
        const amount = investMoney * (weight/100);
        const qty = targetPrice > 0 ? Math.floor(amount / targetPrice) : 0;

        const buys = (d.history || []).filter(h => {
            if (!h || h.type !== 'BUY') return false;
            if (parseInt(h.stage) !== (i + 1)) return false;
            if (activeCycleId != null) return h.cycleId === activeCycleId;
            return true; // 과거 데이터 호환(사이클 없음)
        });
        const boughtQty = buys.reduce((sum, h) => sum + (h.qty || 0), 0);
        // "실제 매수가"는 해당 단계에서의 마지막 체결가(최근 BUY의 price)로 표시
        const lastBuy = buys.reduce((acc, h) => {
            if (!h) return acc;
            if (!acc) return h;
            return new Date(h.date) > new Date(acc.date) ? h : acc;
        }, null);
        const actualBuyPrice = (lastBuy && lastBuy.price != null) ? Number(lastBuy.price) : null;
        let statusBadge = '<span class="text-slate-500 font-bold text-[10px]">대기</span>';
        if ((d.qty || 0) <= 0) {
            statusBadge = '<span class="text-slate-500 font-bold text-[10px]">대기</span>';
        } else if (boughtQty >= qty && qty > 0) statusBadge = '<span class="text-emerald-500 font-bold text-[10px]">완료</span>';
        else if(boughtQty > 0) statusBadge = '<span class="text-yellow-500 font-bold text-[10px]">진행</span>';
        
        tbody.innerHTML += `
        <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
            <td class="p-2 text-center text-slate-400 font-medium">${i+1}차 <span class="text-[9px] text-slate-600 block">(${drop.toFixed(2)}%)</span></td>
            <td class="p-2 align-middle">
                <div class="plan-actual-cell">
                    <div class="plan-actual-wrap">
                        <span class="plan-price">$${targetPrice.toFixed(2)}</span>
                        <span class="plan-slash">/</span>
                        <span class="actual-price${actualBuyPrice != null ? '' : ' empty'}">
                            ${actualBuyPrice != null ? ('$' + actualBuyPrice.toFixed(2)) : '—'}
                        </span>
                    </div>
                </div>
            </td>
            <td class="p-2 align-middle text-center text-white font-bold">${qty}주</td>
            <td class="p-2 text-center">${statusBadge}</td>
        </tr>`;
    }
    if (boosterOn && boosterStages > 0 && drops.length > 0) {
        const lastBaseDrop = drops[stages - 1];
        const boosterInvest = totalEquityUSD * (boosterAllocPct / 100);
        for (let i = 0; i < boosterStages; i++) {
            const step = (finalEndDrop - lastBaseDrop) / boosterStages;
            const bDrop = lastBaseDrop + (i + 1) * step;
            const targetPrice = basePrice * (1 + bDrop / 100);
            const amount = boosterInvest / boosterStages;
            const qty = targetPrice > 0 ? Math.floor(amount / targetPrice) : 0;
            const stageNum = stages + i + 1;
            const buys = (d.history || []).filter(h => {
                if (!h || h.type !== 'BUY') return false;
                if (parseInt(h.stage) !== stageNum) return false;
                if (activeCycleId != null) return h.cycleId === activeCycleId;
                return true; // 과거 데이터 호환(사이클 없음)
            });
            const boughtQty = buys.reduce((sum, h) => sum + (h.qty || 0), 0);
            // "실제 매수가"는 해당 부스터 단계에서의 마지막 체결가로 표시
            const lastBuy = buys.reduce((acc, h) => {
                if (!h) return acc;
                if (!acc) return h;
                return new Date(h.date) > new Date(acc.date) ? h : acc;
            }, null);
            const actualBuyPrice = (lastBuy && lastBuy.price != null) ? Number(lastBuy.price) : null;
            let statusBadge = '<span class="text-slate-500 font-bold text-[10px]">대기</span>';
            if ((d.qty || 0) <= 0) {
                statusBadge = '<span class="text-slate-500 font-bold text-[10px]">대기</span>';
            } else if (qty > 0 && boughtQty >= qty) statusBadge = '<span class="text-emerald-500 font-bold text-[10px]">완료</span>';
            else if (boughtQty > 0) statusBadge = '<span class="text-yellow-500 font-bold text-[10px]">진행</span>';
            tbody.innerHTML += `
        <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition bg-slate-800/20">
            <td class="p-2 text-center text-slate-500 font-medium">${stageNum}차 <span class="text-[9px] text-red-400/80 block">부스터 (${bDrop.toFixed(2)}%)</span></td>
            <td class="p-2 align-middle">
                <div class="plan-actual-cell">
                    <div class="plan-actual-wrap">
                        <span class="plan-price">$${targetPrice.toFixed(2)}</span>
                        <span class="plan-slash">/</span>
                        <span class="actual-price${actualBuyPrice != null ? '' : ' empty'}">
                            ${actualBuyPrice != null ? ('$' + actualBuyPrice.toFixed(2)) : '—'}
                        </span>
                    </div>
                </div>
            </td>
            <td class="p-2 align-middle text-center text-white font-bold">${qty}주</td>
            <td class="p-2 text-center">${statusBadge}</td>
        </tr>`;
        }
    }
}
    
function updateConfig() {
    const stages = parseInt(document.getElementById('configStages').value) || 4;
    const d = portfolios[activeTicker];
    d.config.mode = document.getElementById('configMode').value;
    d.config.stages = stages;
    d.config.drops = [];
    d.config.weights = [];
    for(let i=0; i<stages; i++) {
        d.config.drops.push(parseFloat(document.getElementById(`drop_${i}`).value)||0);
        d.config.weights.push(parseFloat(document.getElementById(`wgt_${i}`).value)||0);
    }
    d.config.basePrice = parseFloat(document.getElementById('planBasePrice').value) || 0;
    if ((d.config.mode || '') === 'BOOSTER') {
        const sec = document.getElementById('boosterConfigSection');
        if (sec) sec.classList.remove('hidden');
        d.config.boosterOn = document.getElementById('boosterOn').checked === true;
        d.config.boosterAllocPct = parseFloat(document.getElementById('boosterAllocPct').value) || 0;
        d.config.boosterStages = parseInt(document.getElementById('boosterStages').value) || 2;
        d.config.boosterMdd = parseFloat(document.getElementById('boosterMdd').value) || 10;
    } else {
        const sec = document.getElementById('boosterConfigSection');
        if (sec) sec.classList.add('hidden');
    }
    saveAll();
    calculatePlan();
}

// --- UI/UX & Data ---
function addToStrategy() { closeAnalysisModal(); tempTickerToAdd = selectedScanTicker; openAllocationModal(selectedScanTicker); }
function openAllocationModal(sym) { const total = getTotalEquityUSD(); if(total <= 0) { alert("설정 탭에서 초기 시드머니를 먼저 입력해주세요."); return; } document.getElementById('allocationModal').classList.remove('hidden'); document.getElementById('allocationModal').classList.add('flex'); document.getElementById('allocTotalAsset').innerText = '$' + total.toLocaleString(undefined,{maximumFractionDigits:2}); const allocKrwEl = document.getElementById('allocTotalAssetKrw'); if (allocKrwEl) allocKrwEl.innerText = formatKrw(total); const pct = (sym && portfolios[sym] && portfolios[sym].config && (portfolios[sym].config.alloc != null)) ? portfolios[sym].config.alloc : 10; document.getElementById('allocPercent').value = pct; calcAllocFromPct(); }
function calcAllocFromPct() { const pct = parseFloat(document.getElementById('allocPercent').value)||0; const total = getTotalEquityUSD(); const amt = total * (pct/100); document.getElementById('allocAmount').value = amt.toFixed(2); updateKrwHint(amt); }
function calcAllocFromAmt() { const amt = parseFloat(document.getElementById('allocAmount').value)||0; const total = getTotalEquityUSD(); const pct = (amt / total) * 100; document.getElementById('allocPercent').value = pct.toFixed(1); updateKrwHint(amt); }
function updateKrwHint(usdAmount) { const krwStr = formatKrw(usdAmount); document.getElementById('allocKRWHint').innerText = '≈ ' + krwStr.replace(/\u20A9/,'') + ' 원'; }
function confirmAllocation() { const pct = parseFloat(document.getElementById('allocPercent').value)||0; if(pct <= 0) return alert("비중을 입력해주세요."); const sym = tempTickerToAdd || activeTicker; if(sym) { if (!portfolios[sym] && !checkCorrelationOnAdd(sym)) return; if (!portfolios[sym]) { portfolios[sym] = { qty: 0, avgPrice: 0, history: [], config: { mode: 'GRID', stages: 4, mdd: 20, alloc: pct, drops: [0,-6.67,-13.33,-20], weights: [25,25,25,25], basePrice: 0, boosterOn: false, boosterAllocPct: 0, boosterStages: 2, boosterMdd: 10 } }; } else { portfolios[sym].config.alloc = pct; } saveAll(); if(activeTicker===sym) loadTickerData(sym); } document.getElementById('allocationModal').classList.add('hidden'); document.getElementById('allocationModal').classList.remove('flex'); renderTickerBar(); switchTab('strategy'); selectTicker(sym); }
function openEtfSearchModal() { document.getElementById('etfSearchModal').classList.remove('hidden'); document.getElementById('etfSearchModal').classList.add('flex'); renderEtfSearchList(ETF_DB); }
function closeEtfSearchModal() { document.getElementById('etfSearchModal').classList.add('hidden'); document.getElementById('etfSearchModal').classList.remove('flex'); }
function renderEtfSearchList(l) { const g=document.getElementById('etfSearchGrid'); g.innerHTML=''; l.forEach(e=>{ let b=e.lev==='3x'?'badge-3x':(e.lev==='2x'?'badge-2x':'badge-inv'); g.innerHTML+=`<div class="bg-slate-800 p-3 rounded-xl flex justify-between items-center active:bg-slate-700 transition"><div><span class="font-bold text-white">${e.sym}</span> <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${b}">${e.lev}</span><div class="text-xs text-slate-400">${e.desc}</div></div><button onclick="processAddTicker('${e.sym}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow transition">추가</button></div>`; }); }
function processAddTicker(sym) { tempTickerToAdd = sym; closeEtfSearchModal(); openAllocationModal(sym); }
function filterEtfSearch() { const q=document.getElementById('etfSearchInput').value.toUpperCase(); renderEtfSearchList(ETF_DB.filter(e=>e.sym.includes(q)||e.desc.includes(q))); }
function renderTickerBar() { const bar = document.getElementById('tickerBar'); bar.innerHTML = ''; Object.keys(portfolios).forEach(t => { const btn = document.createElement('button'); const active = t === activeTicker; btn.className = `ticker-tab px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${active?'active':''}`; btn.innerText = t; btn.onclick = () => selectTicker(t); bar.appendChild(btn); }); const addBtn = document.createElement('button'); addBtn.className = "px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 text-xs font-bold border border-slate-700 whitespace-nowrap"; addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>'; addBtn.onclick = openEtfSearchModal; bar.appendChild(addBtn); }
function deleteActiveTicker() { if(!activeTicker) return; if(confirm(`'${activeTicker}' 종목을 삭제하시겠습니까?\n모든 매매 기록이 삭제됩니다.`)) { delete portfolios[activeTicker]; saveAll(); activeTicker = null; localStorage.removeItem('umt_last_ticker'); const keys = Object.keys(portfolios); if (keys.length > 0) { selectTicker(keys[0]); } else { switchTab('home'); renderTickerBar(); } } }
function exportData(){ const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({global:globalData, ports:portfolios})); const node = document.createElement('a'); node.setAttribute("href", dataStr); node.setAttribute("download", "UMT_Backup.json"); document.body.appendChild(node); node.click(); node.remove(); }
function importData(input){ const file = input.files[0]; if(!file)return; const reader = new FileReader(); reader.onload = function(e){ try { const json = JSON.parse(e.target.result); if(json.global && json.ports) { localStorage.setItem('umt_v172_global', JSON.stringify(json.global)); localStorage.setItem('umt_v172_ports', JSON.stringify(json.ports)); alert("복구 완료!"); location.reload(); } } catch(err) { alert("파일 오류"); } }; reader.readAsText(file); }
function applyFeePreset(){ const v=document.getElementById('feePreset').value; if(v!=='custom') document.getElementById('globalFeeRate').value=v; }
    
function renderRescuePlan() { const d = portfolios[activeTicker]; const panel = document.getElementById('rescuePlanPanel'); const tbody = document.getElementById('rescueTableBody'); const badge = document.getElementById('rescueBadge'); const lastDropIdx = d.config.drops.length - 1; const basePrice = parseFloat(document.getElementById('planBasePrice').value) || d.config.basePrice; const lastPlanPrice = basePrice * (1 + d.config.drops[lastDropIdx]/100); const currentPrice = d.marketData && d.marketData.price > 0 ? d.marketData.price : 0; if (d.qty > 0 && currentPrice < lastPlanPrice && currentPrice > 0) { panel.classList.remove('hidden'); tbody.innerHTML = ''; const rescueScenario = [5, 10, 15]; rescueScenario.forEach(pct => { const rescuePrice = currentPrice * (1 - pct/100); const rescueQty = Math.floor(d.qty * 0.5); const cost = rescueQty * rescuePrice; tbody.innerHTML += `<tr class="border-b border-red-800/30"><td class="py-2 font-bold text-red-300">현가 -${pct}%</td><td class="py-2 text-right">$${rescuePrice.toFixed(2)}</td><td class="py-2 text-right text-white">${rescueQty}주</td><td class="py-2 text-right text-yellow-400">$${Math.round(cost).toLocaleString()}</td></tr>`; }); const mddBreach = ((currentPrice - lastPlanPrice) / lastPlanPrice) * 100; badge.innerText = `계획이탈 ${mddBreach.toFixed(1)}%`; } else { panel.classList.add('hidden'); } }
    
// --- Trading Modals ---
function openTradeModal(type) {
    if (!activeTicker || !portfolios[activeTicker]) { return alert("먼저 종목을 선택해주세요."); }
    document.getElementById('tradeModal').classList.remove('hidden');
    document.getElementById('tradeModal').classList.add('flex');
    document.getElementById('tradeType').value = type;
    document.getElementById('tradeDate').valueAsDate = new Date();
    const title = document.getElementById('tradeModalTitle');
    title.innerText = type === 'BUY' ? '매수 기록' : (type === 'SELL' ? '매도 기록' : '배당금 기록');
    const s = document.getElementById('tradeStageSelect');
    s.innerHTML = '<option value="">직접 입력</option>';
    if (type === 'BUY') {
        const d = portfolios[activeTicker];
        const stages = parseInt(d.config.stages) || 4;
        if (d.config.drops) { d.config.drops.forEach((drop, idx) => { s.innerHTML += `<option value="${idx+1}">${idx+1}차 (${drop}%)</option>`; }); }
        if (d.config.boosterOn === true && d.config.boosterStages > 0) {
            const lastDrop = (d.config.drops && d.config.drops[stages-1] != null) ? d.config.drops[stages-1] : -20;
            const baseMdd = parseFloat(d.config.mdd) || 20;
            const boosterExtra = parseFloat(d.config.boosterMdd) || 10;
            const finalEndDrop = -(baseMdd + boosterExtra);
            const boosterStages = parseInt(d.config.boosterStages) || 2;
            for (let i = 0; i < boosterStages; i++) {
                const step = (finalEndDrop - lastDrop) / boosterStages;
                const bDrop = lastDrop + (i + 1) * step;
                s.innerHTML += `<option value="${stages + i + 1}">${stages + i + 1}차 부스터 (${bDrop.toFixed(2)}%)</option>`;
            }
        }
    } else if (type === 'SELL') {
        s.innerHTML += '<option value="1">1차 매도 실행</option><option value="2">2차 매도 실행</option><option value="3">3차 매도 실행</option><option value="ALL">전량 매도 실행 (청산)</option>';
    }
    document.getElementById('tradePrice').value = '';
    document.getElementById('tradeQty').value = '';
    var plannedPriceEl = document.getElementById('tradePlannedPrice');
    var plannedQtyEl = document.getElementById('tradePlannedQty');
    if (plannedPriceEl) plannedPriceEl.value = '';
    if (plannedQtyEl) plannedQtyEl.value = '';
    document.getElementById('tradeFeeDisplay').innerText = '$0.00';
    document.getElementById('tradeTotal').innerText = '$0.00';
    calcTradeTotal();
}
function closeTradeModal() { document.getElementById('tradeModal').classList.add('hidden'); document.getElementById('tradeModal').classList.remove('flex'); }
function autoFillTrade() {
    const stageStr = document.getElementById('tradeStageSelect').value;
    var pp = document.getElementById('tradePlannedPrice');
    var pq = document.getElementById('tradePlannedQty');
    if (stageStr === "") {
        if (pp) pp.value = '';
        if (pq) pq.value = '';
        return;
    }
    const type = document.getElementById('tradeType').value;
    const d = portfolios[activeTicker];
    if (type === 'SELL') {
        if (stageStr === 'ALL') {
            const qty = d.qty || 0;
            const snap = MARKET_SNAPSHOT[activeTicker];
            const price = parseFloat((snap && snap.price) ? snap.price : (d.avgPrice || 0)) || 0;
            document.getElementById('tradePrice').value = price.toFixed(2);
            document.getElementById('tradeQty').value = qty;
            if (pp) pp.value = price.toFixed(2);
            if (pq) pq.value = qty;
            calcTradeTotal();
            return;
        }
        const idx = parseInt(stageStr, 10) - 1;
        if (idx < 0 || idx > 2) return;
        const plans = d.config.sellPlans || [];
        const p = plans[idx] || { targetPct: 10, sellRatio: 50 };
        const targetPct = parseFloat(p.targetPct) || 10;
        const sellRatio = parseFloat(p.sellRatio) || 50;
        const avg = d.avgPrice || 0;
        const holding = d.qty || 0;
        const price = avg * (1 + targetPct / 100);
        const qty = Math.floor(holding * sellRatio / 100);
        document.getElementById('tradePrice').value = price.toFixed(2);
        document.getElementById('tradeQty').value = qty;
        if (pp) pp.value = price.toFixed(2);
        if (pq) pq.value = qty;
        calcTradeTotal();
        return;
    }
    if (type === 'BUY') {
        const stageNum = parseInt(stageStr, 10);
        const stages = parseInt(d.config.stages) || 4;
        const base = parseFloat(document.getElementById('planBasePrice').value) || d.config.basePrice || 0;
        if (!base || !d.config.drops) return;
        let price = 0, qty = 0;
        if (stageNum <= stages && stageNum >= 1) {
            const idx = stageNum - 1;
            if (idx >= d.config.drops.length || !d.config.weights) return;
            const totalUSD = getTotalEquityUSD();
            const investable = totalUSD * ((d.config.alloc || 30) / 100);
            const drop = d.config.drops[idx];
            const weight = (d.config.weights[idx] != null) ? d.config.weights[idx] : (100 / stages);
            price = base * (1 + drop / 100);
            qty = (price > 0) ? Math.floor((investable * weight / 100) / price) : 0;
        } else if (d.config.boosterOn === true && stageNum > stages) {
            const boosterStages = parseInt(d.config.boosterStages) || 2;
            if (stageNum > stages + boosterStages) return;
            const lastDrop = d.config.drops[stages - 1];
            const baseMdd = parseFloat(d.config.mdd) || 20;
            const boosterExtra = parseFloat(d.config.boosterMdd) || 10;
            const finalEndDrop = -(baseMdd + boosterExtra);
            const step = (finalEndDrop - lastDrop) / boosterStages;
            const i = stageNum - stages - 1;
            const bDrop = lastDrop + (i + 1) * step;
            const totalUSD = getTotalEquityUSD();
            const boosterInvest = totalUSD * ((parseFloat(d.config.boosterAllocPct) || 0) / 100);
            price = base * (1 + bDrop / 100);
            const amount = boosterInvest / boosterStages;
            qty = (price > 0) ? Math.floor(amount / price) : 0;
        } else return;
        document.getElementById('tradePrice').value = price.toFixed(2);
        document.getElementById('tradeQty').value = qty;
        if (pp) pp.value = price.toFixed(2);
        if (pq) pq.value = qty;
        calcTradeTotal();
    }
}
function calcTradeTotal() { const p = parseFloat(document.getElementById('tradePrice').value)||0; const q = parseFloat(document.getElementById('tradeQty').value)||0; const type = document.getElementById('tradeType').value; let feeRate = (globalData && globalData.feeRate) ? globalData.feeRate : 0.07; let useSec = (globalData && globalData.useSec !== undefined) ? globalData.useSec : true; let rate = feeRate/100; if (type === 'SELL' && useSec) rate += 0.0000229; const fee = p*q*rate; const feeDisplay = document.getElementById('tradeFeeDisplay'); if(feeDisplay) feeDisplay.innerText = '$'+fee.toFixed(2); const total = type==='BUY' ? (p*q)+fee : (type==='DIV' ? (p*q) : (p*q)-fee); const totalDisplay = document.getElementById('tradeTotal'); if(totalDisplay) { if(type==='DIV') totalDisplay.innerText = '$'+(p*q).toFixed(2); else totalDisplay.innerText = '$'+total.toLocaleString(undefined,{maximumFractionDigits:2}); } const feeKrw = document.getElementById('tradeFeeKrw'); if(feeKrw) feeKrw.innerText = formatKrw(fee); const totalKrw = document.getElementById('tradeTotalKrw'); if(totalKrw) totalKrw.innerText = formatKrw(type==='DIV' ? (p*q) : total); }
    
function submitTrade() {
    const d = portfolios[activeTicker];
    const type = document.getElementById('tradeType').value;
    const price = parseFloat(document.getElementById('tradePrice').value);
    const qty = parseFloat(document.getElementById('tradeQty').value);
    const date = document.getElementById('tradeDate').value;
    const memo = document.getElementById('tradeMemo').value;
    const tag = document.getElementById('tradeTag').value;
    const stageVal = document.getElementById('tradeStageSelect').value;
    const stage = stageVal ? parseInt(stageVal, 10) : 0;
    if (!price || !qty) return;

    const plannedPrice = parseFloat(document.getElementById('tradePlannedPrice').value) || null;
    const plannedQty = parseFloat(document.getElementById('tradePlannedQty').value) || null;
    const plannedStage = stage || null;
    let autoAdjustedFromStage = null;
    let autoAdjustedCount = 0;

    // 단계 매수를 실제 더 낮은 가격에 체결했다면,
    // 이미 지난 단계는 유지하고 "다음 단계들"만 실제 체결가 기준으로 하향 보정
    if (type === 'BUY' && stage > 0 && d && d.config && Array.isArray(d.config.drops)) {
        const stages = parseInt(d.config.stages) || 4;
        const idx = stage - 1;
        if (idx >= 0 && idx < stages && idx < d.config.drops.length) {
            const drop = parseFloat(d.config.drops[idx]) || 0;
            const denom = 1 + (drop / 100);
            if (denom > 0) {
                const currentBase = parseFloat(d.config.basePrice) || 0;
                const expectedPrice = currentBase > 0 ? (currentBase * denom) : 0;
                if (expectedPrice > 0 && price < expectedPrice) {
                    // 기존 단계 간 상대 간격(drop 차이)을 유지한 채,
                    // idx 이후 단계만 실제 체결가를 anchor로 다시 계산한다.
                    for (let j = idx + 1; j < d.config.drops.length; j++) {
                        const oldDropJ = parseFloat(d.config.drops[j]) || 0;
                        const relFromAnchorPct = oldDropJ - drop; // anchor 단계 대비 추가 하락폭(%)
                        const newTargetPrice = price * (1 + relFromAnchorPct / 100);
                        if (currentBase > 0 && newTargetPrice > 0) {
                            const newDropJ = ((newTargetPrice / currentBase) - 1) * 100;
                            d.config.drops[j] = parseFloat(newDropJ.toFixed(2));
                            autoAdjustedCount++;
                        }
                    }
                    if (autoAdjustedCount > 0) autoAdjustedFromStage = stage;
                }
            }
        }
    }

    // cycleId: 보유수량 0인 상태에서 BUY가 들어오면 새 사이클 시작
    if (d && typeof d.cycleSeq !== 'number') d.cycleSeq = 0;
    if (type === 'BUY' && (d.qty || 0) <= 0) {
        d.cycleSeq = (d.cycleSeq || 0) + 1;
        d.currentCycleId = d.cycleSeq;
    } else if (d.currentCycleId == null && (d.qty || 0) > 0) {
        // 과거 데이터/복원 데이터 호환: 보유중인데 currentCycleId가 없으면 history에서 추정
        const maxCycle = Array.isArray(d.history) ? d.history.reduce((m, h) => (h && h.cycleId != null && h.cycleId > m ? h.cycleId : m), 0) : 0;
        if (maxCycle > 0) d.currentCycleId = maxCycle;
    }

    let rate = globalData.feeRate / 100;
    if (type === 'SELL' && globalData.useSec) rate += 0.0000229;
    const fee = price * qty * rate;
    const total = type === 'BUY' ? (price * qty) + fee : (price * qty) - fee;

    const saved = {
        id: Date.now().toString(),
        date,
        type,
        price,
        qty,
        fee,
        total,
        memo,
        tag,
        stage,
        plannedPrice,
        plannedQty,
        plannedStage,
        cycleId: d.currentCycleId != null ? d.currentCycleId : null
    };
    d.history.push(saved);

    // [DEBUG submitTrade] 저장 결과 로그
    console.log('[DEBUG submitTrade] saved trade', saved);
    console.log('[DEBUG submitTrade] history length', activeTicker, d.history.length);
    console.log('[DEBUG submitTrade] last history item', activeTicker, d.history[d.history.length - 1]);
    console.log('[DEBUG submitTrade] portfolio after save', activeTicker, d);
    recalcPortfolio(d);
    // 전량 매도 등으로 보유수량 0이 되면 사이클 종료 처리
    if ((d.qty || 0) <= 0) {
        d.currentCycleId = null;
    }
    saveAll();
    loadTickerData(activeTicker);
    // 계획가보다 싸게 체결한 경우: 단계 계획가 자동 조정 토스트 표시
    if (autoAdjustedFromStage != null && autoAdjustedCount > 0) {
        showToast(autoAdjustedFromStage + '차 실체결가 반영: 이후 ' + autoAdjustedCount + '개 단계 계획가 자동 조정');
    }
    closeTradeModal();
}
    
function recalcPortfolio(d) { const sorted = [...d.history].sort((a,b)=>new Date(a.date)-new Date(b.date)); let q = 0; let totalCost = 0; let realizedPnL = 0; let totalDiv = 0; sorted.forEach(h => { if(h.type === 'BUY') { totalCost += h.total; q += h.qty; } else if(h.type === 'SELL') { if(q > 0) { let avgPrice = totalCost / q; let costOfSold = avgPrice * h.qty; totalCost -= costOfSold; let profit = h.total - costOfSold; realizedPnL += profit; q -= h.qty; } } else if(h.type === 'DIV') { totalDiv += h.total; } }); if(q <= 0) { q = 0; totalCost = 0; } d.qty = q; d.avgPrice = q > 0 ? totalCost / q : 0; d.realizedPnL = realizedPnL; d.totalDiv = totalDiv; }
    
// 🔥 [핵심 패치] 휴지통 삭제 완벽 처리
function renderJournal() { 
    const d = portfolios[activeTicker]; const list = document.getElementById('journalList'); if(!list) return; list.innerHTML = ''; if(!d || !d.history) return;
    [...d.history].sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(h => { 
        const isBuy = h.type === 'BUY'; const color = isBuy ? 'border-red-500/50' : (h.type==='DIV'?'border-yellow-500/50':'border-blue-500/50'); const badge = isBuy ? 'bg-red-900 text-red-300' : (h.type==='DIV'?'bg-yellow-900 text-yellow-300':'bg-blue-900 text-blue-300'); const stageTxt = h.stage ? `(${h.stage}차)` : ''; 
        list.innerHTML += `<div class="bg-slate-800/80 p-3 rounded-xl border ${color} mb-2 relative shadow-sm"><div class="flex justify-between items-start mb-1"><div><span class="text-[10px] text-slate-400 block">${h.date}</span><span class="text-[10px] ${badge} px-2 py-0.5 rounded font-bold inline-block mt-1">${h.type} ${stageTxt}</span></div><button type="button" onclick="deleteTrade('${h.id}')" class="text-slate-500 hover:text-red-400 p-2 cursor-pointer relative z-20"><i class="fa-solid fa-trash-can fa-lg"></i></button></div><div class="flex justify-between items-end mt-2"><div class="text-sm font-bold text-white">$${h.price.toFixed(2)} x ${h.qty}</div><div class="text-xs text-slate-400">합계: $${h.total.toFixed(2)}</div></div><div class="mt-2 text-xs text-slate-500 bg-slate-900/50 p-2 rounded">${h.memo || '메모 없음'}</div></div>`; 
    }); 
}

function deleteTrade(id) {
    if(confirm("이 매매 기록을 삭제하시겠습니까?")) {
        const d = portfolios[activeTicker];
        d.history = d.history.filter(h => String(h.id) !== String(id));
        recalcPortfolio(d); saveAll(); loadTickerData(activeTicker);
    }
}

// ----- 매매일지 (Trade Log) 탭 -----
let _tradeLogRows = [];

function calculatePlanVsResult(trade) {
    var plannedPrice = Number(trade.plannedPrice != null && trade.plannedPrice !== '' ? trade.plannedPrice : 0);
    var plannedQty = Number(trade.plannedQty != null && trade.plannedQty !== '' ? trade.plannedQty : 0);
    var actualPrice = Number(trade.price != null ? trade.price : 0);
    var actualQty = Number(trade.qty != null ? trade.qty : 0);
    if (!plannedPrice) return null;
    var priceDiffPercent = ((actualPrice - plannedPrice) / plannedPrice) * 100;
    var qtyDiff = actualQty - plannedQty;
    return { priceDiffPercent: priceDiffPercent, qtyDiff: qtyDiff };
}

function enrichTradesWithReturn(trades) {
    if (!trades || !portfolios) return trades;
    var bySym = {};
    trades.forEach(function(t) { if (!bySym[t.sym]) bySym[t.sym] = []; bySym[t.sym].push(t); });
    Object.keys(bySym).forEach(function(sym) {
        var list = bySym[sym].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
        var q = 0, totalCost = 0;
        list.forEach(function(h) {
            if (h.type === 'BUY') {
                totalCost += (h.total != null ? h.total : h.price * h.qty);
                q += (h.qty || 0);
            } else if (h.type === 'SELL' && q > 0) {
                var avgPrice = totalCost / q;
                var costOfSold = avgPrice * (h.qty || 0);
                var profit = (h.total != null ? h.total : (h.price * h.qty)) - costOfSold;
                var returnPct = costOfSold ? (profit / costOfSold) * 100 : 0;
                h.returnPct = returnPct;
                totalCost -= costOfSold;
                q -= (h.qty || 0);
            }
        });
    });
    return trades;
}

function calculateTradeStats(trades) {
    var sellList = (trades || []).filter(function(t) { return t.type === 'SELL'; });
    var withReturn = sellList.filter(function(t) { return t.returnPct != null && !isNaN(t.returnPct); });
    var totalTrades = withReturn.length;
    var winCount = withReturn.filter(function(t) { return t.returnPct > 0; }).length;
    var loseCount = withReturn.filter(function(t) { return t.returnPct < 0; }).length;
    var winRate = totalTrades ? (winCount / totalTrades) * 100 : 0;
    var sum = withReturn.reduce(function(acc, t) { return acc + t.returnPct; }, 0);
    var avgReturn = totalTrades ? sum / totalTrades : 0;
    var maxReturn = withReturn.length ? Math.max.apply(null, withReturn.map(function(t) { return t.returnPct; })) : 0;
    var minReturn = withReturn.length ? Math.min.apply(null, withReturn.map(function(t) { return t.returnPct; })) : 0;
    var tagStats = {};
    (trades || []).forEach(function(t) {
        if (t.type !== 'SELL' || (t.returnPct == null || isNaN(t.returnPct))) return;
        var tag = t.tag || '—';
        if (!tagStats[tag]) tagStats[tag] = { count: 0, wins: 0, sum: 0 };
        tagStats[tag].count++;
        if (t.returnPct > 0) tagStats[tag].wins++;
        tagStats[tag].sum += t.returnPct;
    });
    Object.keys(tagStats).forEach(function(tag) {
        var s = tagStats[tag];
        s.winRate = s.count ? (s.wins / s.count) * 100 : 0;
        s.avgReturn = s.count ? s.sum / s.count : 0;
    });
    return { totalTrades: totalTrades, winCount: winCount, loseCount: loseCount, winRate: winRate, avgReturn: avgReturn, maxReturn: maxReturn, minReturn: minReturn, tagStats: tagStats };
}

function getAggregatedTrades() {
    const list = [];
    if (!portfolios) {
        console.log('[DEBUG getAggregatedTrades] portfolios is null/undefined');
        return list;
    }
    Object.keys(portfolios).forEach(sym => {
        const p = portfolios[sym];
        if (!Array.isArray(p.history)) {
            console.log('[DEBUG getAggregatedTrades] no history array for', sym, p);
            return;
        }
        p.history.forEach(h => {
            list.push({ ...h, sym });
        });
    });
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log('[DEBUG getAggregatedTrades] total', list.length);
    const byTicker = {};
    list.forEach(t => {
        byTicker[t.sym] = (byTicker[t.sym] || 0) + 1;
    });
    console.log('[DEBUG getAggregatedTrades] by ticker', byTicker);
    console.log('[DEBUG getAggregatedTrades] sample(3)', list.slice(0, 3));
    return list;
}

function getTagLabel(tag) {
    const map = { QUANT: '퀀트/계획 매매', FOMO: '뇌동/추격 매매', RESCUE: '구조대/물타기', DIV: '배당금 수령' };
    return (tag && map[tag]) ? map[tag] : (tag || '—');
}

function truncateStr(s, len) {
    if (!s) return '—';
    const t = String(s).trim();
    return t.length <= len ? t : t.slice(0, len) + '…';
}

function renderTradeLog() {
    var tickerSelect = document.getElementById('tradelogTicker');
    var tbody = document.getElementById('tradelogTableBody');
    var countEl = document.getElementById('tradelogCount');
    if (!tickerSelect || !tbody) return;

    var all = getAggregatedTrades();
    all = enrichTradesWithReturn(all);
    var stats = calculateTradeStats(all);

    var statsBody = document.getElementById('tradelogReviewStatsBody');
    if (statsBody) {
        statsBody.innerHTML =
            '<div class="bg-slate-800/50 rounded-lg px-2 py-2"><div class="text-slate-500 text-[10px]">총 매매(SELL)</div><div class="font-bold text-white">' + stats.totalTrades + '회</div></div>' +
            '<div class="bg-slate-800/50 rounded-lg px-2 py-2"><div class="text-slate-500 text-[10px]">승률</div><div class="font-bold text-white">' + stats.winRate.toFixed(1) + '%</div></div>' +
            '<div class="bg-slate-800/50 rounded-lg px-2 py-2"><div class="text-slate-500 text-[10px]">평균 수익률</div><div class="font-bold ' + (stats.avgReturn >= 0 ? 'text-red-400' : 'text-blue-400') + '">' + (stats.totalTrades ? stats.avgReturn.toFixed(2) + '%' : '—') + '</div></div>' +
            '<div class="bg-slate-800/50 rounded-lg px-2 py-2"><div class="text-slate-500 text-[10px]">최대 수익률</div><div class="font-bold text-red-400">' + (stats.totalTrades ? stats.maxReturn.toFixed(2) + '%' : '—') + '</div></div>' +
            '<div class="bg-slate-800/50 rounded-lg px-2 py-2"><div class="text-slate-500 text-[10px]">최대 손실률</div><div class="font-bold text-blue-400">' + (stats.totalTrades ? stats.minReturn.toFixed(2) + '%' : '—') + '</div></div>';
    }
    var tagStatsBody = document.getElementById('tradelogTagStatsBody');
    var tagStatsPanel = document.getElementById('tradelogTagStats');
    if (tagStatsBody && tagStatsPanel) {
        var tagKeys = Object.keys(stats.tagStats || {});
        if (tagKeys.length > 0) {
            tagStatsPanel.classList.remove('hidden');
            var tagLabels = { QUANT: '퀀트/계획 매매', FOMO: '뇌동/추격 매매', RESCUE: '구조대/물타기', DIV: '배당금 수령' };
            tagStatsBody.innerHTML = tagKeys.map(function(tag) {
                var s = stats.tagStats[tag];
                var label = tagLabels[tag] || tag;
                return '<div class="flex flex-wrap items-center justify-between gap-2 bg-slate-800/50 rounded-lg px-3 py-2"><span class="text-slate-300 font-bold">' + label + '</span><span class="text-slate-400">' + s.count + '회 / 승률 ' + s.winRate.toFixed(1) + '% / 평균 ' + (s.avgReturn >= 0 ? '' : '') + s.avgReturn.toFixed(2) + '%</span></div>';
            }).join('');
        } else {
            tagStatsPanel.classList.add('hidden');
        }
    }

    var tickers = all.map(function(h) { return h.sym; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).sort();
    tickerSelect.innerHTML = '<option value="">전체 종목</option>';
    tickers.forEach(function(sym) { tickerSelect.innerHTML += '<option value="' + sym + '">' + sym + '</option>'; });

    var filterTicker = (tickerSelect.value || '').trim();
    var filterType = (document.getElementById('tradelogType') && document.getElementById('tradelogType').value) || '';
    var dateFrom = document.getElementById('tradelogDateFrom') && document.getElementById('tradelogDateFrom').value;
    var dateTo = document.getElementById('tradelogDateTo') && document.getElementById('tradelogDateTo').value;

    var filtered = all;
    if (filterTicker) filtered = filtered.filter(function(h) { return h.sym === filterTicker; });
    if (filterType) filtered = filtered.filter(function(h) { return h.type === filterType; });
    if (dateFrom) filtered = filtered.filter(function(h) { return h.date >= dateFrom; });
    if (dateTo) filtered = filtered.filter(function(h) { return h.date <= dateTo; });

    // 사이클 그룹(종목+cycleId)별 날짜 범위 계산
    var groupMeta = {};
    filtered.forEach(function(h) {
        var sym = h.sym;
        var cid = (h.cycleId != null && h.cycleId !== '') ? String(h.cycleId) : '';
        var key = sym + '|' + cid;
        if (!groupMeta[key]) groupMeta[key] = { sym: sym, cycleId: cid, minDate: h.date, maxDate: h.date, count: 0 };
        groupMeta[key].count++;
        if (h.date < groupMeta[key].minDate) groupMeta[key].minDate = h.date;
        if (h.date > groupMeta[key].maxDate) groupMeta[key].maxDate = h.date;
    });

    _tradeLogRows = filtered.map(function(h) {
        var planVs = calculatePlanVsResult(h);
        return Object.assign({}, h, { tagLabel: getTagLabel(h.tag), memoText: h.memo || '', planVsResult: planVs });
    });

    tbody.innerHTML = '';
    var lastGroupKey = null;
    _tradeLogRows.forEach(function(row, idx) {
        // 그룹 헤더(종목 + cycleId) 추가
        var cidKey = (row.cycleId != null && row.cycleId !== '') ? String(row.cycleId) : '';
        var groupKey = row.sym + '|' + cidKey;
        if (groupKey !== lastGroupKey) {
            lastGroupKey = groupKey;
            var meta = groupMeta[groupKey] || { sym: row.sym, cycleId: cidKey, minDate: row.date, maxDate: row.date, count: 0 };
            var cycleLabel = meta.cycleId ? ('사이클 #' + meta.cycleId) : '사이클 —';
            var rangeLabel = (meta.minDate === meta.maxDate) ? meta.maxDate : (meta.minDate + ' ~ ' + meta.maxDate);
            var headerTr = document.createElement('tr');
            headerTr.className = 'bg-slate-800/60';
            headerTr.innerHTML =
                '<td class="p-2 text-left text-slate-300 font-bold" colspan="14">' +
                '<span class="text-white">' + meta.sym + '</span>' +
                '<span class="text-slate-500 mx-2">|</span>' +
                '<span class="text-emerald-400 font-bold">' + cycleLabel + '</span>' +
                '<span class="text-slate-500 mx-2">|</span>' +
                '<span class="text-slate-400">' + rangeLabel + '</span>' +
                (meta.count ? ('<span class="text-slate-500 ml-2">(' + meta.count + '건)</span>') : '') +
                '</td>';
            tbody.appendChild(headerTr);
        }

        var isSell = row.type === 'SELL';
        var returnPct = row.returnPct != null ? row.returnPct : row.profitPct;
        var profitPctStr = (returnPct != null && !isNaN(returnPct)) ? (returnPct.toFixed(2) + '%') : '—';
        var plannedPriceStr = (row.plannedPrice != null && row.plannedPrice !== '') ? ('$' + Number(row.plannedPrice).toFixed(2)) : '—';
        var priceStr = (row.price != null) ? ('$' + row.price.toFixed(2)) : '—';
        var diffStr = '—';
        var diffClass = 'text-slate-500';
        if (row.planVsResult && row.planVsResult.priceDiffPercent != null) {
            diffStr = (row.planVsResult.priceDiffPercent >= 0 ? '+' : '') + row.planVsResult.priceDiffPercent.toFixed(2) + '%';
            diffClass = row.planVsResult.priceDiffPercent >= 0 ? 'text-red-400' : 'text-blue-400';
        }
        var plannedQtyStr = (row.plannedQty != null && row.plannedQty !== '') ? String(Math.round(row.plannedQty)) : '—';
        var qtyStr = (row.qty != null) ? String(row.qty) : '—';
        var plannedStageStr = (row.plannedStage != null && row.plannedStage !== '') ? (row.plannedStage + '차') : '—';
        var cycleStr = (row.cycleId != null && row.cycleId !== '') ? ('#' + row.cycleId) : '—';
        var reasonShort = truncateStr(row.tagLabel, 8);
        var memoShort = truncateStr(row.memoText, 10);
        var reasonClass = reasonShort.length > 7 ? 'cursor-pointer text-blue-300 hover:underline' : '';
        var memoClass = memoShort.length > 9 ? 'cursor-pointer text-blue-300 hover:underline' : '';
        var tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/50';
        tr.id = 'tradeLogRow_' + idx;
        tr.innerHTML =
            '<td class="p-2 text-center text-slate-300">' + row.date + '</td>' +
            '<td class="p-2 text-center font-bold text-white">' + row.sym + '</td>' +
            '<td class="p-2 text-center"><span class="' + (row.type === 'BUY' ? 'text-red-400' : (row.type === 'DIV' ? 'text-yellow-400' : 'text-blue-400')) + ' font-bold">' + row.type + '</span></td>' +
            '<td class="p-2 text-right text-slate-400">' + plannedPriceStr + '</td>' +
            '<td class="p-2 text-right text-white">' + priceStr + '</td>' +
            '<td class="p-2 text-right ' + diffClass + '">' + diffStr + '</td>' +
            '<td class="p-2 text-right text-slate-400">' + plannedQtyStr + '</td>' +
            '<td class="p-2 text-right text-slate-300">' + qtyStr + '</td>' +
            '<td class="p-2 text-center text-slate-400">' + plannedStageStr + '</td>' +
            '<td class="p-2 text-center text-slate-400">' + cycleStr + '</td>' +
            '<td class="p-2 text-right text-slate-300">$' + (row.total != null ? row.total.toFixed(2) : '—') + '</td>' +
            '<td class="p-2 text-right ' + (isSell && returnPct != null && !isNaN(returnPct) ? (returnPct >= 0 ? 'text-red-400' : 'text-blue-400') : 'text-slate-500') + '">' + profitPctStr + '</td>' +
            '<td class="p-2 text-left max-w-[80px] truncate ' + reasonClass + '" data-detail-type="reason" data-row-idx="' + idx + '" title="' + (row.tagLabel || '').replace(/"/g, '&quot;') + '">' + reasonShort + '</td>' +
            '<td class="p-2 text-left max-w-[100px] truncate ' + memoClass + '" data-detail-type="memo" data-row-idx="' + idx + '" title="' + (row.memoText || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '">' + memoShort + '</td>';
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-detail-type]').forEach(function(cell) {
        cell.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-row-idx'), 10);
            var type = this.getAttribute('data-detail-type');
            if (isNaN(idx) || !_tradeLogRows[idx]) return;
            var row = _tradeLogRows[idx];
            var title = type === 'reason' ? '매매 이유' : '심리 메모';
            var content = type === 'reason' ? row.tagLabel : row.memoText;
            openTradeLogDetailModal(title, content || '—');
        });
    });

    if (countEl) countEl.textContent = filtered.length + '건';
}

function openTradeLogDetailModal(title, content) {
    const modal = document.getElementById('tradelogDetailModal');
    const titleEl = document.getElementById('tradelogDetailTitle');
    const contentEl = document.getElementById('tradelogDetailContent');
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.textContent = content || '—';
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function closeTradeLogDetailModal() {
    const modal = document.getElementById('tradelogDetailModal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

function updateGlobalCalc() { 
    try { 
        globalData.seedKRW = parseFloat(document.getElementById('globalSeedKRW').value)||0; globalData.rate = parseFloat(document.getElementById('globalRate').value)||1300; var _sipEl = document.getElementById('globalSipKRW'); if(_sipEl) globalData.sipKRW = parseFloat(_sipEl.value)||0; 
        let netDepositKRW = 0; let totalInjectedUSD = globalData.seedKRW / globalData.rate; 
        globalData.deposits.forEach(d => { netDepositKRW += d.amount; totalInjectedUSD += (d.amount / d.rate); }); 
        const totalPrincipalKRW = globalData.seedKRW + netDepositKRW; 
        const tpEl = document.getElementById('totalPrincipalDisplay'); if(tpEl) tpEl.innerText = totalPrincipalKRW.toLocaleString() + ' 원'; 
        const sum = getPortfolioSummary(); 
        const aEl = document.getElementById('dashTotalAssets'); if(aEl) aEl.innerText = '$' + sum.totalAssets.toLocaleString(undefined,{maximumFractionDigits:0}); 
        const aKrw = document.getElementById('dashTotalAssetsKrw'); if(aKrw) aKrw.innerText = formatKrw(sum.totalAssets); 
        const iEl = document.getElementById('dashTotalInvested'); if(iEl) iEl.innerText = '$' + sum.totalInvested.toLocaleString(undefined,{maximumFractionDigits:0}); 
        const iKrw = document.getElementById('dashTotalInvestedKrw'); if(iKrw) iKrw.innerText = formatKrw(sum.totalInvested); 
        const cEl = document.getElementById('dashTotalCash'); if(cEl) cEl.innerText = '$' + sum.totalCash.toLocaleString(undefined,{maximumFractionDigits:0}); 
        const cKrw = document.getElementById('dashTotalCashKrw'); if(cKrw) cKrw.innerText = formatKrw(sum.totalCash); 
        const eEl = document.getElementById('dashExecutionRate'); if(eEl) eEl.innerText = sum.overallExecRate.toFixed(1) + '%'; 
        const listEl = document.getElementById('dashTickerAllocList'); if(listEl) listEl.innerHTML = sum.byTicker.length ? sum.byTicker.map(t => `<div class="flex justify-between items-center bg-slate-800/50 px-2.5 py-1.5 rounded text-xs"><span class="font-bold text-white">${t.sym}</span><span class="text-slate-400">$${Math.round(t.allocUsd)} / $${Math.round(t.investedUsd)}</span><span class="text-yellow-400 font-bold">${t.execRate.toFixed(0)}%</span></div>`).join('') : '<div class="text-slate-500 py-1 text-xs">종목 없음</div>'; 
        let totalCurrentVal = 0; let totalRealizedPnL = 0; 
        Object.values(portfolios).forEach(p => { if(p.qty > 0) { const currPrice = p.marketData && p.marketData.price > 0 ? p.marketData.price : p.avgPrice; totalCurrentVal += (p.qty * currPrice); } if(p.realizedPnL) totalRealizedPnL += p.realizedPnL; if(p.totalDiv) totalRealizedPnL += p.totalDiv; }); 
        let totalUnrealizedPnL = 0; 
        Object.values(portfolios).forEach(p => { if(p.qty > 0) { const currPrice = p.marketData && p.marketData.price > 0 ? p.marketData.price : p.avgPrice; totalUnrealizedPnL += (p.qty * currPrice) - (p.qty * p.avgPrice); } }); 
        const totalPnL = totalRealizedPnL + totalUnrealizedPnL; const pnlEl = document.getElementById('totalProfitDisplay'); if(pnlEl) { pnlEl.innerText = (totalPnL>=0?'+':'') + '$' + totalPnL.toLocaleString(undefined,{maximumFractionDigits:0}); pnlEl.className = `text-lg font-black ${totalPnL>=0?'text-red-400':'text-blue-400'}`; }
        let invested = 0; const labels = [], data = [], colors = [];
        Object.keys(portfolios).forEach(s => { const p = portfolios[s]; const price = p.marketData && p.marketData.price > 0 ? p.marketData.price : p.avgPrice; const val = p.qty * price; if(val > 0) { invested += val; labels.push(s); data.push(val); colors.push(s==='GLD'?'#facc15':'#3b82f6'); } }); 
        const totalEquity = totalInjectedUSD + totalPnL; const cashProxy = totalEquity - invested;
        if(cashProxy > 0) { labels.push('현금(Est)'); data.push(cashProxy); colors.push('#1e293b'); }
        if (portfolioChart && typeof portfolioChart.destroy === "function") {
            console.log("chart destroy safe", portfolioChart);
            portfolioChart.destroy();
        }
        const cCanvas = document.getElementById('portfolioChart');
        if(cCanvas && typeof Chart !== 'undefined') {
            const ctx = cCanvas.getContext('2d'); 
            portfolioChart = new Chart(ctx, { type: 'doughnut', data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth:0 }] }, options: { responsive:true, cutout:'70%', plugins:{legend:{display:false}} } }); 
            const plEl = document.getElementById('portfolioLegend'); if(plEl) plEl.innerHTML = labels.map((l,i)=>`<div class="flex justify-between items-start"><span style="color:${colors[i]}">● ${l}</span><span class="text-right">$${Math.round(data[i]).toLocaleString()}<div class="text-slate-500 text-[9px]">${formatKrw(data[i])}</div></span></div>`).join(''); 
        }
    } catch (e) { console.error("Calc Error", e); } 
}
    
function getTotalEquityUSD() {
    const defaultRate = globalData.rate || 1300;
    let equity = (globalData.seedKRW || 0) / defaultRate;
    (globalData.deposits || []).forEach(d => { equity += (d.amount || 0) / (d.rate || defaultRate); });
    Object.values(portfolios || {}).forEach(p => { if(p.realizedPnL) equity += p.realizedPnL; if(p.totalDiv) equity += p.totalDiv; });
    return equity;
}

var _heatmapWidgetInjected = false;
var _heatmapErrorTimer = null;

function toggleHeatmap() {
    const content = document.getElementById('heatmapContent');
    const icon = document.getElementById('heatmapToggleIcon');
    if (!content || !icon) return;
    content.classList.toggle('hidden');
    icon.innerHTML = content.classList.contains('hidden') ? '<i class="fa-solid fa-chevron-down"></i>' : '<i class="fa-solid fa-chevron-up"></i>';
    if (!content.classList.contains('hidden')) injectHeatmapWidget();
}

function injectHeatmapWidget() {
    const container = document.getElementById('heatmapWidgetContainer');
    const errEl = document.getElementById('heatmapLoadError');
    if (!container) return;
    if (errEl) errEl.classList.add('hidden');
    if (_heatmapErrorTimer) { clearTimeout(_heatmapErrorTimer); _heatmapErrorTimer = null; }
    if (_heatmapWidgetInjected && container.querySelector('iframe')) return;
    if (!_heatmapWidgetInjected) {
        _heatmapWidgetInjected = true;
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        s.textContent = JSON.stringify({
            dataSource: 'SPX500',
            blockColor: 'change',
            blockSize: 'market_cap_basic',
            grouping: 'sector',
            colorTheme: 'dark',
            locale: 'kr',
            width: '100%',
            height: '100%',
            hasSymbolTooltip: true,
            isZoomEnabled: true
        });
        container.appendChild(s);
    }
    _heatmapErrorTimer = setTimeout(function() {
        _heatmapErrorTimer = null;
        if (!container.querySelector('iframe') && errEl) errEl.classList.remove('hidden');
    }, 12000);
}

function renderMarketHeatmap() {
    var content = document.getElementById('heatmapContent');
    if (content && !content.classList.contains('hidden')) injectHeatmapWidget();
}
function openNewsModal() {
    document.getElementById('newsModal').classList.remove('hidden');
    document.getElementById('newsModal').classList.add('flex');
    // 매크로 뉴스가 있으면 모달에도 표시
    if (MACRO_DATA && MACRO_DATA.news && MACRO_DATA.news.length > 0) {
        var listEl = document.getElementById('fullNewsList');
        if (listEl) {
            var levelStyles = {red:'bg-red-900/30 border-red-800', yellow:'bg-yellow-900/20 border-yellow-800', green:'bg-slate-800 border-slate-700'};
            var levelLabels = {red:'🔴 긴급', yellow:'🟡 주의', green:'🟢 참고'};
            listEl.innerHTML = MACRO_DATA.news.map(function(n) {
                var st = levelStyles[n.level] || levelStyles.green;
                var lb = levelLabels[n.level] || '● 뉴스';
                return '<div class="p-3 rounded-xl border mb-2 ' + st + '">'
                    + '<div class="text-[10px] font-bold mb-1 opacity-70">' + lb + '</div>'
                    + '<div class="text-sm text-white font-bold leading-snug">' + escapeHtml(n.title) + '</div>'
                    + '<div class="text-xs text-slate-400 mt-1">' + escapeHtml(n.summary) + '</div>'
                    + '</div>';
            }).join('');
        }
    }
}
function closeNewsModal() { document.getElementById('newsModal').classList.add('hidden'); document.getElementById('newsModal').classList.remove('flex'); }
function renderSellPlan() {
    const d = portfolios[activeTicker];
    const panel = document.getElementById('sellPlanPanel');
    if (!panel) return;
    if (d.qty > 0) {
        panel.classList.remove('hidden');
        const plans = d.config.sellPlans || [];
        for (let i = 1; i <= 3; i++) {
            const p = plans[i - 1] || {};
            const targetPct = parseFloat(p.targetPct) || (i === 1 ? 10 : (i === 2 ? 15 : 20));
            const targetPrice = d.avgPrice * (1 + targetPct / 100);
            const el = document.getElementById('sellTargetPrice' + i);
            if (el) el.innerText = '$' + targetPrice.toFixed(2);
        }
        const md = MARKET_SNAPSHOT[activeTicker] || { ema8: 0 };
        const trailEl = document.getElementById('sellTrailPrice');
        if (trailEl) trailEl.innerText = '$' + (md.ema8 || 0).toFixed(2);
        const advice = document.getElementById('sellAdviceText');
        if (advice) {
            if (md.rsi > 70) { advice.innerText = "단기 과열 (분할 매도 고려)"; advice.className = "text-red-400 font-bold"; }
            else { advice.innerText = "RSI 70 도달 시 부분 익절 권장"; advice.className = "text-slate-300"; }
        }
    } else {
        panel.classList.add('hidden');
    }
}
function updateSellPlan() {
    const d = portfolios[activeTicker];
    if (!d || !d.config) return;
    if (!Array.isArray(d.config.sellPlans)) d.config.sellPlans = [];
    for (let i = 1; i <= 3; i++) {
        const pe = document.getElementById('sellTargetPct' + i);
        const re = document.getElementById('sellTargetRatio' + i);
        const targetPct = pe ? parseFloat(pe.value) : (i === 1 ? 10 : (i === 2 ? 15 : 20));
        const sellRatio = re ? parseFloat(re.value) : (i === 3 ? 100 : 50);
        d.config.sellPlans[i - 1] = { targetPct, sellRatio };
    }
    saveAll();
    renderSellPlan();
}

function applySellPlanUpdate() {
    updateSellPlan();
    showStrategyMessage('sellStrategySaveMessage', '저장 완료');
}
function toggleCalendar() { const el = document.getElementById('calendarView'); el.classList.toggle('hidden'); if(!el.classList.contains('hidden')) renderCalendar(); }
function renderCalendar() { const grid = document.getElementById('calendarGrid'); grid.innerHTML = ''; const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate(); for(let i=1; i<=daysInMonth; i++) { grid.innerHTML += `<div class="bg-slate-800 h-6 rounded flex items-center justify-center">${i}</div>`; } }
    
function openCashFlowModal() { document.getElementById('cashFlowModal').classList.remove('hidden'); document.getElementById('cashFlowModal').classList.add('flex'); resetCfModal(); renderCfList(); }
function closeCashFlowModal() { document.getElementById('cashFlowModal').classList.add('hidden'); document.getElementById('cashFlowModal').classList.remove('flex'); }
function resetCfModal() { document.getElementById('cfId').value=''; document.getElementById('cfAmount').value=''; document.getElementById('btnCfDel').classList.add('hidden'); document.getElementById('cfDate').valueAsDate=new Date(); document.getElementById('cfRate').value=document.getElementById('globalRate').value; calcCfUSD(); }
function toggleCfType(el) { const labels = document.querySelectorAll('input[name="cfType"]'); labels.forEach(r => { r.parentElement.classList.remove('bg-blue-600','text-white'); r.parentElement.classList.add('text-slate-400'); }); el.parentElement.classList.remove('text-slate-400'); el.parentElement.classList.add('bg-blue-600','text-white'); }
function calcCfUSD() { const r = parseFloat(document.getElementById('cfRate').value)||1; const k = parseFloat(document.getElementById('cfAmount').value)||0; document.getElementById('cfCalcUSD').innerText = '$'+(k/r).toLocaleString(undefined,{maximumFractionDigits:2}); }
function saveCashFlow() { const id=document.getElementById('cfId').value; const type=document.querySelector('input[name="cfType"]:checked').value; const rawK=parseFloat(document.getElementById('cfAmount').value); const r=parseFloat(document.getElementById('cfRate').value); const d=document.getElementById('cfDate').value; if(!rawK) return; const finalK = (type==='OUT') ? -Math.abs(rawK) : Math.abs(rawK); if(id){ const idx=globalData.deposits.findIndex(x=>String(x.id)===String(id)); if(idx!==-1) globalData.deposits[idx]={id:parseInt(id), date:d, rate:r, amount:finalK, type:type}; } else { globalData.deposits.push({id:Date.now(), date:d, rate:r, amount:finalK, type:type}); } saveAll(); updateGlobalCalc(); closeCashFlowModal(); }
    
// 🔥 [핵심 패치] 입출금 삭제 오류 완벽 해결
function editCashFlow(id){ 
    const d = globalData.deposits.find(x => String(x.id) === String(id)); 
    if(d){ 
        document.getElementById('cfId').value=d.id; document.getElementById('cfDate').value=d.date; document.getElementById('cfRate').value=d.rate; document.getElementById('cfAmount').value=Math.abs(d.amount); 
        const type = d.amount < 0 ? 'OUT' : 'IN'; document.querySelector(`input[name="cfType"][value="${type}"]`).checked = true; 
        const labels = document.querySelectorAll('input[name="cfType"]'); labels.forEach(r => { r.parentElement.classList.remove('bg-blue-600','text-white'); r.parentElement.classList.add('text-slate-400'); }); 
        document.querySelector(`input[name="cfType"][value="${type}"]`).parentElement.classList.remove('text-slate-400'); document.querySelector(`input[name="cfType"][value="${type}"]`).parentElement.classList.add('bg-blue-600','text-white'); 
        document.getElementById('btnCfDel').classList.remove('hidden'); calcCfUSD(); 
    } 
}
    
function deleteCashFlow(){ const id=document.getElementById('cfId').value; if(id && confirm('삭제하시겠습니까?')){ globalData.deposits=globalData.deposits.filter(x=>String(x.id)!==String(id)); saveAll(); updateGlobalCalc(); closeCashFlowModal(); } }
    
function renderCfList(){ 
    const l=document.getElementById('cfHistoryList'); l.innerHTML=''; 
    globalData.deposits.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(d=>{ 
        const usd = Math.abs(d.amount)/d.rate; const color = d.amount >= 0 ? 'cf-in' : 'cf-out'; const label = d.amount >= 0 ? '입금' : '출금'; 
        l.innerHTML+=`<div class="flex justify-between p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-900 transition" onclick="editCashFlow('${d.id}')"><div><div class="text-xs text-white font-bold">${d.date} <span class="ml-1 text-[10px] text-slate-500">${label}</span></div><div class="text-[10px] text-slate-500">@${d.rate}</div></div><div class="text-right"><div class="text-xs font-bold ${color}">$${usd.toLocaleString(undefined,{maximumFractionDigits:2})}</div><div class="text-[10px] text-slate-500">${d.amount.toLocaleString()}원</div></div></div>`; 
    }); 
}
    
function initInputs() { 
    if (!globalData) return;
    if(document.getElementById('globalSeedKRW')) document.getElementById('globalSeedKRW').value = globalData.seedKRW != null ? globalData.seedKRW : ''; 
    if(document.getElementById('globalRate')) document.getElementById('globalRate').value = globalData.rate != null ? globalData.rate : 1300; 
    if(document.getElementById('globalFeeRate')) document.getElementById('globalFeeRate').value = globalData.feeRate != null ? globalData.feeRate : 0.07; 
    if(document.getElementById('globalSipKRW')) document.getElementById('globalSipKRW').value = globalData.sipKRW != null ? globalData.sipKRW : ''; 
    if(document.getElementById('useSecFee')) document.getElementById('useSecFee').checked = globalData.useSec !== false; 
    if(document.getElementById('globalMDD')) document.getElementById('globalMDD').value = globalData.mddLimit != null ? globalData.mddLimit : 25; 
    if(document.getElementById('globalSyncUrl')) document.getElementById('globalSyncUrl').value = SYNC_URL || '';
}

function saveSettings() {
    if (!globalData) return;
    globalData.seedKRW = parseFloat(document.getElementById('globalSeedKRW').value) || 0;
    globalData.rate = parseFloat(document.getElementById('globalRate').value) || 1300;
    var _sip = document.getElementById('globalSipKRW'); if (_sip) globalData.sipKRW = parseFloat(_sip.value) || 0;
    globalData.feeRate = parseFloat(document.getElementById('globalFeeRate').value) || 0.07;
    globalData.useSec = document.getElementById('useSecFee').checked;
    globalData.mddLimit = parseFloat(document.getElementById('globalMDD').value) || 25;
    var url = document.getElementById('globalSyncUrl').value;
    if (url != null) { SYNC_URL = url.trim(); localStorage.setItem('umt_sync_url', SYNC_URL); }
    localStorage.setItem('umt_v172_global', JSON.stringify(globalData));
    updateGlobalCalc();
    if (activeTicker && portfolios[activeTicker]) { renderStrategyProgressCard(activeTicker); }
    alert('설정이 저장되었습니다.');
}
    
function saveAll() { 
    globalData.seedKRW = parseFloat(document.getElementById('globalSeedKRW').value)||0; 
    globalData.rate = parseFloat(document.getElementById('globalRate').value)||1300; 
    globalData.feeRate = parseFloat(document.getElementById('globalFeeRate').value)||0; 
    var _sipEl2 = document.getElementById('globalSipKRW'); if (_sipEl2) globalData.sipKRW = parseFloat(_sipEl2.value)||0; 
    globalData.useSec = document.getElementById('useSecFee').checked; 
    globalData.mddLimit = parseFloat(document.getElementById('globalMDD').value)||25; 
    
    localStorage.setItem('umt_v172_global', JSON.stringify(globalData)); 
    localStorage.setItem('umt_v172_ports', JSON.stringify(portfolios)); 
    
    syncToCloud(); 
}

