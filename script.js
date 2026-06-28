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
// mymemory 번역 무료 한도 상향용 이메일 (클라이언트 직접 호출이라 요청 URL에 노출됨)
const MYMEMORY_EMAIL = 'hansung@hansungtools.co.kr';

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
    // 서버(KV)가 보낸 분석 시각(_cachedAt)이 있으면 보존 — "X시간 전 갱신"이 실제 분석 시점을 가리키도록
    if (!data._cachedAt) data._cachedAt = Date.now();
    localStorage.setItem(MACRO_CACHE_KEY, JSON.stringify(data));
}

// 만료 무시하고 마지막 저장본 그대로 반환 (즉시 렌더 → 백그라운드 동기화용)
function loadMacroRaw() {
    try {
        var c = JSON.parse(localStorage.getItem(MACRO_CACHE_KEY));
        return (c && c.quad && c.market_data) ? c : null;
    } catch (e) { return null; }
}

// 백그라운드에서 서버(KV) 최신 Quad 분석을 조용히 동기화 (Gemini 호출 없이 KV 즉답)
async function syncMacroFromServer() {
    try {
        var resp = await fetch(API_BASE_URL + '/macro');
        if (!resp.ok) return;
        var data = await resp.json();
        if (!data || data.error || !data.quad) return;
        var localAt  = (MACRO_DATA && MACRO_DATA._cachedAt) || 0;
        var serverAt = data._cachedAt || Date.now();
        // 서버가 같거나 더 최신일 때만 교체
        if (!MACRO_DATA || serverAt >= localAt) {
            MACRO_DATA = data;
            saveMacroToCache(data);
            updateMacroDashboard();
        }
    } catch (e) { /* 네트워크 실패는 조용히 무시 */ }
}

async function fetchMacroData(forceRefresh) {
    // 캐시 확인
    if (!forceRefresh) {
        const cached = loadMacroFromCache();
        if (cached) {
            MACRO_DATA = cached;
            return cached;
        }
    }

    // 로딩 상태 표시
    var briefList = document.getElementById('newsBriefingList');
    if (briefList) briefList.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Gemini AI가 매크로 데이터를 분석 중입니다... (최대 60초)</div>';
    try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 120000);
        const resp = await fetch(API_BASE_URL + '/macro' + (forceRefresh ? '?force=1' : ''), { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error('HTTP ' + resp.status + ': ' + errBody);
        }
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        MACRO_DATA = data;
        saveMacroToCache(data);
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
            + '<div class="flex gap-2 justify-center">'
            + '<button onclick="startMacroAnalysis()" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/30 transition transform active:scale-95">'
            + '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i>매크로 분석</button>'
            + '<button onclick="startWeeklyReport()" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-purple-500/30 transition transform active:scale-95">'
            + '<i class="fa-solid fa-calendar-week mr-2"></i>주간 리포트</button>'
            + '</div>'
            + '<div class="text-slate-500 text-[10px] mt-2">Gemini AI가 실시간 경제 데이터를 분석합니다 (약 60초)</div>'
            + '</div>';
    }
    // Quad 매트릭스 대기 상태 표시
    renderQuadMatrix(null);
}

function startMacroAnalysis() {
    // 접혀있으면 펼치기
    var list = document.getElementById('newsBriefingList');
    if (list && list.classList.contains('hidden')) toggleMacroBriefing();
    fetchMacroData(true).then(function(data) {
        if (data) updateMacroDashboard();
        else renderMacroStartButton();
    });
}

function toggleMacroBriefing() {
    var list = document.getElementById('newsBriefingList');
    var btn = document.getElementById('macroBriefingToggleBtn');
    if (!list) return;
    var isHidden = list.classList.toggle('hidden');
    if (btn) { btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="macroBriefingChev"></i>'; }
}

function toggleWeeklyReport() {
    var content = document.getElementById('weeklyReportContent');
    var btn = document.getElementById('weeklyToggleBtn');
    if (!content) return;
    var isHidden = content.classList.toggle('hidden');
    if (btn) { btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="weeklyChev"></i>'; }
}

// ==========================================
// 주간 리포트
// ==========================================
var WEEKLY_CACHE_KEY = 'umt_weekly_cache';
var WEEKLY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

function loadWeeklyFromCache() {
    var raw = localStorage.getItem(WEEKLY_CACHE_KEY);
    if (!raw) return null;
    try {
        var cached = JSON.parse(raw);
        if (!cached || !cached._cachedAt) return null;
        if (Date.now() - cached._cachedAt > WEEKLY_CACHE_TTL) return null;
        return cached;
    } catch(e) { return null; }
}

function startWeeklyReport() {
    var content = document.getElementById('weeklyReportContent');
    var section = document.getElementById('weeklyReportSection');
    if (section) section.classList.remove('hidden');
    if (content) content.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>주간 리포트 생성 중... (약 60초)</div>';

    fetch(API_BASE_URL + '/weekly', { signal: AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        data._cachedAt = Date.now();
        localStorage.setItem(WEEKLY_CACHE_KEY, JSON.stringify(data));
        renderWeeklyReport(data);
    })
    .catch(function(e) {
        if (content) content.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs"><i class="fa-solid fa-triangle-exclamation mr-1"></i>주간 리포트 생성 실패: ' + escapeHtml(e.message).substring(0, 80) + '<br><button onclick="startWeeklyReport()" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>';
    });
}

function renderWeeklyReport(data) {
    var section = document.getElementById('weeklyReportSection');
    var content = document.getElementById('weeklyReportContent');
    if (!section || !content) return;
    section.classList.remove('hidden');

    var html = '';

    // 주간 요약 + Quad 상태
    var qs = data.quad_status || {};
    var quadColors = {1:'text-green-400',2:'text-yellow-400',3:'text-red-400',4:'text-blue-400'};
    html += '<div class="glass-panel rounded-xl p-3 border-l-4 ' + (quadColors[qs.current]?'border-l-green-500':'border-l-slate-500') + '">'
        + '<div class="text-xs font-bold ' + (quadColors[qs.current]||'text-white') + ' mb-1">Quad ' + (qs.current||'?') + ' — ' + (qs.name||'') + (qs.maintained ? ' (유지)' : ' (전환!)') + '</div>'
        + '<div class="text-[11px] text-slate-300">' + escapeHtml(data.week_summary || '') + '</div>'
        + '</div>';

    // 시장 주간 성과
    var mr = data.market_week_review;
    if (mr) {
        html += '<div class="glass-panel rounded-xl p-3"><div class="text-[10px] font-bold text-slate-400 mb-2">주간 시장 성과</div>'
            + '<div class="grid grid-cols-4 gap-1.5 text-center text-[10px]">';
        var mkItems = [
            {label:'S&P500', d:mr.sp500}, {label:'NASDAQ', d:mr.nasdaq},
            {label:'VIX', d:mr.vix}, {label:'US10Y', d:mr.us10y},
            {label:'WTI', d:mr.wti}, {label:'GOLD', d:mr.gold}, {label:'DXY', d:mr.dxy}
        ];
        mkItems.forEach(function(m) {
            if (!m.d) return;
            var chg = m.d.weekly_change || '';
            var isUp = chg.indexOf('+') === 0;
            var isDown = chg.indexOf('-') === 0;
            html += '<div class="bg-slate-800/50 rounded p-1.5"><div class="text-slate-500">' + m.label + '</div><div class="font-bold text-white">' + (m.d.close||'') + '</div><div class="font-bold ' + (isUp?'text-green-400':(isDown?'text-red-400':'text-slate-400')) + '">' + chg + '</div></div>';
        });
        html += '</div></div>';
    }

    // Quad 전환 체크리스트
    if (data.transition_checklist && data.transition_checklist.length > 0) {
        html += '<div class="glass-panel rounded-xl p-3"><div class="text-[10px] font-bold text-slate-400 mb-2">Quad 전환 체크리스트</div><div class="space-y-1">';
        data.transition_checklist.forEach(function(item) {
            html += '<div class="flex items-start gap-2 text-[11px]">'
                + '<span class="shrink-0 mt-0.5">' + (item.checked ? '☑' : '☐') + '</span>'
                + '<div><span class="' + (item.checked?'text-white':'text-slate-400') + ' font-bold">' + escapeHtml(item.item) + '</span>'
                + '<div class="text-slate-500">' + escapeHtml(item.detail || '') + '</div></div></div>';
        });
        html += '</div></div>';
    }

    // 전환 확률
    var tp = data.transition_probability;
    if (tp) {
        var quadNames = {1:'Q1',2:'Q2',3:'Q3',4:'Q4'};
        var barColors = {1:'bg-green-500',2:'bg-yellow-500',3:'bg-red-500',4:'bg-blue-500'};
        html += '<div class="glass-panel rounded-xl p-3"><div class="text-[10px] font-bold text-slate-400 mb-2">Quad 전환 확률</div><div class="grid grid-cols-4 gap-2">';
        [1,2,3,4].forEach(function(n) {
            var pct = tp['to_quad'+n] || 0;
            var isCurrent = n === qs.current;
            html += '<div class="text-center' + (isCurrent?' opacity-40':'') + '"><div class="text-[9px] text-slate-500">' + quadNames[n] + '</div><div class="h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1"><div class="h-full ' + barColors[n] + '" style="width:'+pct+'%"></div></div><div class="text-[10px] font-bold mt-0.5 ' + (pct>25?quadColors[n]:'text-slate-600') + '">' + (isCurrent?'현재':pct+'%') + '</div></div>';
        });
        html += '</div></div>';
    }

    // 다음 주 시나리오
    if (data.next_week && data.next_week.scenarios) {
        html += '<div class="glass-panel rounded-xl p-3"><div class="text-[10px] font-bold text-slate-400 mb-2">다음 주 시나리오</div><div class="space-y-2">';
        data.next_week.scenarios.forEach(function(sc) {
            html += '<div class="bg-slate-800/50 rounded-lg p-2.5"><div class="flex justify-between text-[11px] mb-1"><span class="text-white font-bold">' + escapeHtml(sc.name) + '</span><span class="text-slate-400 font-bold">' + sc.probability + '%</span></div>'
                + '<div class="text-[10px] text-slate-400">' + escapeHtml(sc.strategy) + '</div>';
            if (sc.etf_action && sc.etf_action.length > 0) {
                html += '<div class="flex flex-wrap gap-1 mt-1">';
                sc.etf_action.forEach(function(ea) {
                    var ac = {buy:'text-red-400',sell:'text-blue-400',hold:'text-slate-300',watch:'text-yellow-400'};
                    html += '<span class="text-[9px] ' + (ac[ea.action]||'text-slate-400') + ' font-bold">' + ea.action.toUpperCase() + ' ' + ea.ticker + '</span>';
                });
                html += '</div>';
            }
            html += '</div>';
        });
        html += '</div></div>';
    }

    // 다음 주 주요 이벤트
    if (data.next_week && data.next_week.key_events) {
        html += '<div class="glass-panel rounded-xl p-3"><div class="text-[10px] font-bold text-slate-400 mb-2">다음 주 주요 일정</div><div class="space-y-1">';
        data.next_week.key_events.forEach(function(ev) {
            var impColor = {high:'text-red-400',medium:'text-yellow-400',low:'text-slate-400'};
            html += '<div class="flex items-center justify-between text-[11px]"><div class="flex items-center gap-2"><span class="text-slate-500 w-8">' + escapeHtml(ev.date) + '</span><span class="text-white">' + escapeHtml(ev.name) + '</span></div><span class="' + (impColor[ev.importance]||'text-slate-400') + ' text-[9px] font-bold">' + (ev.importance||'').toUpperCase() + '</span></div>';
        });
        html += '</div></div>';
    }

    // 캐시 시간
    if (data._cachedAt) {
        var mins = Math.round((Date.now() - data._cachedAt) / 60000);
        var timeStr = mins < 60 ? (mins + '분 전') : (Math.round(mins / 60) + '시간 전');
        html += '<div class="text-[9px] text-slate-600 text-right">' + timeStr + ' 생성</div>';
    }

    content.innerHTML = html;
}

// ==========================================
// 🔥 실시간 핫이슈 (Gemini 그라운딩)
// ==========================================
var HOT_CACHE_KEY = 'umt_hot_cache';
var HOT_CACHE_TTL = 30 * 60 * 1000; // 30분

function loadHotFromCache() {
    var raw = localStorage.getItem(HOT_CACHE_KEY);
    if (!raw) return null;
    try {
        var cached = JSON.parse(raw);
        if (!cached || !cached._cachedAt) return null;
        if (Date.now() - cached._cachedAt > HOT_CACHE_TTL) return null;
        return cached;
    } catch(e) { return null; }
}

function startHotIssues() {
    var list = document.getElementById('hotIssuesList');
    if (list) list.classList.remove('hidden');
    if (list) list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>최신 핫이슈 수집 중... (약 30초)</div>';
    var btn = document.getElementById('hotToggleBtn'); if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-up text-xs" id="hotChev"></i>';

    fetch(API_BASE_URL + '/hot', { signal: AbortSignal.timeout ? AbortSignal.timeout(90000) : undefined })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        data._cachedAt = Date.now();
        localStorage.setItem(HOT_CACHE_KEY, JSON.stringify(data));
        renderHotIssues(data);
        renderMarketFlow();
    })
    .catch(function(e) {
        if (list) list.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs"><i class="fa-solid fa-triangle-exclamation mr-1"></i>핫이슈 수집 실패: ' + escapeHtml(e.message).substring(0, 80) + '<br><button onclick="startHotIssues()" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>';
    });
}

function renderHotIssues(data) {
    var list = document.getElementById('hotIssuesList');
    if (!list) return;
    var items = (data && Array.isArray(data.items)) ? data.items : [];
    if (!items.length) {
        list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">표시할 핫이슈가 없습니다</div>';
        return;
    }

    var catMeta = {
        trump:      {label:'트럼프',   icon:'fa-comment-dots', color:'text-orange-400'},
        fed:        {label:'연준',     icon:'fa-building-columns', color:'text-emerald-400'},
        geopolitics:{label:'지정학',   icon:'fa-earth-americas', color:'text-rose-400'},
        market:     {label:'시장',     icon:'fa-chart-line', color:'text-blue-400'},
        earnings:   {label:'실적',     icon:'fa-sack-dollar', color:'text-yellow-400'},
        policy:     {label:'정책',     icon:'fa-landmark', color:'text-purple-400'}
    };
    var sevBorder = {high:'border-l-red-500', medium:'border-l-yellow-500', low:'border-l-slate-600'};
    var dirMeta = {bullish:{t:'▲ 호재',c:'text-red-400'}, bearish:{t:'▼ 악재',c:'text-blue-400'}, neutral:{t:'중립',c:'text-slate-400'}};

    var html = '';
    items.forEach(function(it) {
        var cm = catMeta[it.category] || {label:'뉴스', icon:'fa-newspaper', color:'text-slate-400'};
        var dm = dirMeta[it.direction] || dirMeta.neutral;
        var tickers = Array.isArray(it.tickers) ? it.tickers.filter(Boolean) : [];
        html += '<div class="glass-panel rounded-xl p-3 border-l-4 ' + (sevBorder[it.severity] || 'border-l-slate-600') + '">'
            + '<div class="flex items-center justify-between mb-1">'
            +   '<div class="flex items-center gap-1.5 text-[10px] font-bold ' + cm.color + '"><i class="fa-solid ' + cm.icon + '"></i>' + cm.label
            +     '<span class="text-slate-600 font-normal">· ' + escapeHtml(it.source || '') + '</span></div>'
            +   '<span class="text-[9px] text-slate-500">' + escapeHtml(it.time || '') + '</span>'
            + '</div>'
            + '<div class="text-[12px] font-bold text-white leading-snug mb-1">' + escapeHtml(it.title || '') + '</div>';
        if (it.quote) {
            html += '<div class="text-[11px] text-slate-300 italic border-l-2 border-slate-600 pl-2 my-1.5">“' + escapeHtml(it.quote) + '”</div>';
        }
        html += '<div class="text-[11px] text-slate-400 leading-relaxed">' + escapeHtml(it.summary || '') + '</div>'
            + '<div class="flex items-center justify-between mt-2 flex-wrap gap-1">'
            +   '<div class="flex items-center gap-1.5 flex-wrap">'
            +     '<span class="text-[9px] font-bold ' + dm.c + '">' + dm.t + '</span>';
        tickers.forEach(function(t) {
            html += '<span class="text-[9px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">' + escapeHtml(t) + '</span>';
        });
        html += '</div>';
        if (it.url) {
            html += '<a href="' + encodeURI(it.url) + '" target="_blank" rel="noopener" class="text-[9px] text-blue-400 hover:text-blue-300 font-bold"><i class="fa-solid fa-arrow-up-right-from-square mr-0.5"></i>출처</a>';
        }
        html += '</div></div>';
    });

    // 생성 시간
    if (data._cachedAt) {
        var mins = Math.round((Date.now() - data._cachedAt) / 60000);
        var timeStr = mins < 1 ? '방금' : (mins < 60 ? (mins + '분 전') : (Math.round(mins / 60) + '시간 전'));
        var te = document.getElementById('hotIssuesTime');
        if (te) te.innerText = timeStr + ' 업데이트';
    }

    list.innerHTML = html;
}

function sendTelegramBriefing() {
    var syms = getHeldSymbolsForNews();
    var qs = syms.length ? ('?symbols=' + encodeURIComponent(syms.join(','))) : '';
    showToast('📲 텔레그램 브리핑 생성 중... (약 30초)');
    fetch(API_BASE_URL + '/notify-test' + qs, { signal: AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined })
    .then(function(r){ return r.json(); })
    .then(function(d){ showToast(d.ok ? '✅ 텔레그램으로 브리핑을 보냈습니다' : ('전송 실패: ' + ((d.error||'알 수 없음').substring(0,60)))); })
    .catch(function(e){ showToast('전송 실패: ' + e.message); });
}

function toggleHotIssues() {
    var list = document.getElementById('hotIssuesList');
    var btn = document.getElementById('hotToggleBtn');
    if (!list) return;
    var isHidden = list.classList.toggle('hidden');
    if (btn) { btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="hotChev"></i>'; }
}

// ==========================================
// 📰 종목·시장 뉴스 (Finnhub)
// ==========================================
var STOCKNEWS_CACHE_KEY = 'umt_stocknews_cache';
var STOCKNEWS_CACHE_TTL = 60 * 60 * 1000; // 1시간
var STOCKNEWS_SEEN_KEY = 'umt_stocknews_seen'; // NEW 배지 기준(마지막으로 본 최신 뉴스 시각)
var STOCKNEWS_VIEW_KEY = 'umt_stocknews_view'; // 'grouped' | 'timeline'
var _stockNewsData = null;          // 현재 표시 중 데이터 (뷰 토글/더보기 재렌더용)
var _stockNewsExpanded = {};        // 섹션별 더보기 상태
var _newsAutoTimer = null;          // 뉴스탭 자동 갱신 타이머

function loadStockNewsFromCache() {
    var raw = localStorage.getItem(STOCKNEWS_CACHE_KEY);
    if (!raw) return null;
    try {
        var cached = JSON.parse(raw);
        if (!cached || !cached._cachedAt) return null;
        if (Date.now() - cached._cachedAt > STOCKNEWS_CACHE_TTL) return null;
        return cached;
    } catch(e) { return null; }
}

function getHeldSymbolsForNews() {
    // 보유/등록 종목 중 미국 심볼만 (^VIX 등 지수 제외)
    return Object.keys(portfolios || {})
        .filter(function(s) { return s && s.indexOf('^') === -1 && /^[A-Za-z][A-Za-z0-9.\-]{0,9}$/.test(s); })
        .slice(0, 10);
}

// 뉴스 탭 진입 시 자동 로딩: 신선한 캐시(15분 이내)면 표시, 아니면 새로 불러옴 (Finnhub는 빠름)
function ensureStockNewsLoaded() {
    var raw = localStorage.getItem(STOCKNEWS_CACHE_KEY);
    if (raw) {
        try {
            var c = JSON.parse(raw);
            if (c && c._cachedAt && (Date.now() - c._cachedAt) < 15 * 60 * 1000) { renderStockNews(c); return; }
        } catch (e) {}
    }
    startStockNews();
}

function startStockNews(silent) {
    var list = document.getElementById('stockNewsList');
    if (!silent) {
        if (list) { list.classList.remove('hidden'); list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>뉴스 불러오는 중...</div>'; }
        var btn = document.getElementById('stockNewsToggleBtn'); if (btn) btn.innerHTML = '<i class="fa-solid fa-chevron-up text-xs" id="stockNewsChev"></i>';
    }
    var syms = getHeldSymbolsForNews();
    var qs = syms.length ? ('?symbols=' + encodeURIComponent(syms.join(','))) : '';
    fetch(API_BASE_URL + '/stocknews' + qs, { signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        data._cachedAt = Date.now();
        localStorage.setItem(STOCKNEWS_CACHE_KEY, JSON.stringify(data));
        renderStockNews(data, true);
    })
    .catch(function(e) {
        if (!silent && list) list.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs"><i class="fa-solid fa-triangle-exclamation mr-1"></i>뉴스 수집 실패: ' + escapeHtml(e.message).substring(0, 80) + '<br><button onclick="startStockNews()" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>';
    });
}

// 뉴스탭 자동 갱신 (보는 동안 5분마다 조용히 새로고침)
function startNewsAutoRefresh() {
    stopNewsAutoRefresh();
    _newsAutoTimer = setInterval(function() { startStockNews(true); startKrNews(true); startUsNews(true); }, 5 * 60 * 1000);
}
function stopNewsAutoRefresh() {
    if (_newsAutoTimer) { clearInterval(_newsAutoTimer); _newsAutoTimer = null; }
}

function newsRelativeTime(unixSec) {
    if (!unixSec) return '';
    var diffMin = Math.round((Date.now() - unixSec * 1000) / 60000);
    if (diffMin < 1) return '방금';
    if (diffMin < 60) return diffMin + '분 전';
    var h = Math.round(diffMin / 60);
    if (h < 24) return h + '시간 전';
    return Math.round(h / 24) + '일 전';
}
// 절대 날짜/시각 (예: 6/25 14:30) — 직관적 표시용
function newsAbsStamp(unixSec) {
    if (!unixSec) return '';
    var d = new Date(unixSec * 1000);
    var p = function(n) { return ('0' + n).slice(-2); };
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function newsItemHtml(x, opts) {
    opts = opts || {};
    var time = newsRelativeTime(x.datetime);
    var abs = newsAbsStamp(x.datetime);
    var src = escapeHtml(x.source || '');
    var head = escapeHtml(x.headline || '');
    var link = x.url ? encodeURI(x.url) : '';
    var timeStr = time ? (time + (abs ? ' · ' + abs : '')) : abs;
    var newBadge = opts.isNew ? '<span class="text-[8px] font-black bg-red-500 text-white px-1 py-0.5 rounded mr-1 align-middle">NEW</span>' : '';
    var tickerChip = opts.ticker ? '<span class="text-[9px] font-bold text-sky-300 bg-sky-900/40 px-1.5 py-0.5 rounded mr-1 align-middle">' + escapeHtml(opts.ticker) + '</span>' : '';
    var border = opts.isNew ? 'border-red-500/40' : 'border-slate-700/50';
    // 본문 요약 (헤드라인과 다를 때만, 번역 대상)
    var summ = String(x.summary || '').trim();
    var summaryHtml = '';
    if (summ && summ.length > 30 && summ.toLowerCase().indexOf((x.headline || '').toLowerCase().substring(0, 30)) === -1) {
        var summEsc = escapeHtml(summ.substring(0, 180));
        summaryHtml = '<div class="news-ko text-[11px] text-slate-400 leading-snug mt-1.5 pt-1.5 border-t border-slate-700/40" data-en="' + summEsc + '">' + summEsc + '</div>';
    }
    var inner = '<div class="text-[13px] text-white font-bold leading-snug">' + newBadge + tickerChip + head + '</div>'
        + '<div class="news-ko text-[11.5px] text-sky-200/75 leading-snug mt-1" data-en="' + head + '"></div>'
        + summaryHtml
        + '<div class="flex items-center gap-2 mt-2 text-[10px]">'
        +   '<span class="font-bold text-slate-300">' + src + '</span>'
        +   (timeStr ? '<span class="text-slate-500">· ' + timeStr + '</span>' : '')
        +   (link ? '<span class="ml-auto text-blue-400 font-bold">원문 <i class="fa-solid fa-arrow-up-right-from-square"></i></span>' : '')
        + '</div>';
    if (link) {
        return '<a href="' + link + '" target="_blank" rel="noopener" class="block bg-slate-800/60 hover:bg-slate-700/70 rounded-lg p-3 transition border ' + border + '">' + inner + '</a>';
    }
    return '<div class="bg-slate-800/60 rounded-lg p-3 border ' + border + '">' + inner + '</div>';
}

// 영문 헤드라인 → 한글 번역 (mymemory, 캐시 내장). 순차 처리로 레이트리밋 회피
async function translateNewsHeadlines(rootId) {
    var els = Array.prototype.slice.call(document.querySelectorAll('#' + rootId + ' .news-ko'));
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.getAttribute('data-done')) continue;
        el.setAttribute('data-done', '1');
        var en = el.getAttribute('data-en') || '';
        if (!en.trim()) continue;
        try {
            var ko = await translateText(en);
            if (ko && ko.trim() && ko.trim().toLowerCase() !== en.trim().toLowerCase()) {
                el.textContent = ko;
            }
        } catch (e) { /* 번역 실패는 무시 */ }
    }
}
function translateStockNewsHeadlines() { return translateNewsHeadlines('stockNewsList'); }

// 감성 점수(-0.35~0.35) → 한글 배지 (강세=빨강, 약세=파랑)
function sentimentBadgeHtml(s) {
    if (!s || typeof s.score !== 'number') return '';
    var meta;
    if (s.score <= -0.35) meta = {t:'약세', c:'bg-blue-600/30 text-blue-300', i:'fa-arrow-trend-down'};
    else if (s.score < -0.15) meta = {t:'약(弱)약세', c:'bg-blue-600/20 text-blue-300/90', i:'fa-arrow-trend-down'};
    else if (s.score < 0.15) meta = {t:'중립', c:'bg-slate-600/40 text-slate-300', i:'fa-minus'};
    else if (s.score < 0.35) meta = {t:'약(弱)강세', c:'bg-red-600/20 text-red-300/90', i:'fa-arrow-trend-up'};
    else meta = {t:'강세', c:'bg-red-600/30 text-red-300', i:'fa-arrow-trend-up'};
    return '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded ' + meta.c + '" title="뉴스 감성 점수 ' + s.score.toFixed(2) + ' (기사 ' + (s.count||0) + '개)"><i class="fa-solid ' + meta.i + ' mr-0.5"></i>' + meta.t + ' ' + s.score.toFixed(2) + '</span>';
}

function _stockNewsAllItems(data) {
    var arr = [];
    var bt = (data && data.byTicker) ? data.byTicker : {};
    Object.keys(bt).forEach(function(tk) { (bt[tk] || []).forEach(function(x) { arr.push(Object.assign({ _ticker: tk }, x)); }); });
    ((data && data.market) || []).forEach(function(x) { arr.push(Object.assign({ _ticker: null }, x)); });
    return arr;
}

function renderStockNews(data, isFresh) {
    var list = document.getElementById('stockNewsList');
    if (!list) return;
    _stockNewsData = data;
    var market = (data && Array.isArray(data.market)) ? data.market : [];
    var byTicker = (data && data.byTicker) ? data.byTicker : {};
    var sentiment = (data && data.sentiment) ? data.sentiment : {};
    var tickers = Object.keys(byTicker);

    if (!market.length && !tickers.length) {
        list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">표시할 뉴스가 없습니다</div>';
        return;
    }

    // NEW 배지 기준선: 데이터 객체당 1회만 설정 (뷰 토글/더보기 재렌더 시 유지)
    if (data._newBaseline === undefined) {
        var seen = parseFloat(localStorage.getItem(STOCKNEWS_SEEN_KEY) || '0');
        data._newBaseline = seen;
        var curMax = 0;
        _stockNewsAllItems(data).forEach(function(x) { if ((x.datetime || 0) > curMax) curMax = x.datetime; });
        if (curMax > 0) localStorage.setItem(STOCKNEWS_SEEN_KEY, String(curMax));
    }
    var baseline = data._newBaseline || 0;
    var isNew = function(x) { return baseline > 0 && (x.datetime || 0) > baseline; };

    var view = localStorage.getItem(STOCKNEWS_VIEW_KEY) || 'grouped';
    var html = '';

    // 뷰 토글 바
    html += '<div class="flex items-center gap-1 mb-1 text-[10px]">'
        + '<button onclick="setStockNewsView(\'grouped\')" class="px-2 py-1 rounded-lg font-bold ' + (view === 'grouped' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400') + '"><i class="fa-solid fa-layer-group mr-1"></i>분류별</button>'
        + '<button onclick="setStockNewsView(\'timeline\')" class="px-2 py-1 rounded-lg font-bold ' + (view === 'timeline' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400') + '"><i class="fa-regular fa-clock mr-1"></i>시간순</button>'
        + '</div>';

    if (view === 'timeline') {
        // 통합 타임라인 (시장+보유종목 시간순)
        var all = _stockNewsAllItems(data).sort(function(a, b) { return (b.datetime || 0) - (a.datetime || 0); });
        var limit = _stockNewsExpanded.timeline ? all.length : 10;
        html += '<div class="glass-panel rounded-xl p-3.5"><div class="space-y-2">';
        all.slice(0, limit).forEach(function(x) { html += newsItemHtml(x, { isNew: isNew(x), ticker: x._ticker || '시장' }); });
        html += '</div>';
        if (all.length > limit) html += '<button onclick="expandStockNews(\'timeline\')" class="w-full mt-2 py-2 text-[11px] text-sky-300 bg-slate-800/60 rounded-lg font-bold">더보기 (' + (all.length - limit) + '개)</button>';
        html += '</div>';
    } else {
        // 분류별: 보유 종목 → 시장
        tickers.forEach(function(tk) {
            var items = byTicker[tk] || [];
            if (!items.length) return;
            html += '<div class="glass-panel rounded-xl p-3.5">'
                + '<div class="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-700/60">'
                +   '<div class="text-[13px] font-black text-sky-300 flex items-center gap-2"><i class="fa-solid fa-tag"></i>' + escapeHtml(tk) + '</div>'
                +   sentimentBadgeHtml(sentiment[tk])
                + '</div><div class="space-y-2">';
            items.forEach(function(x) { html += newsItemHtml(x, { isNew: isNew(x) }); });
            html += '</div></div>';
        });
        if (market.length) {
            var mLimit = _stockNewsExpanded.market ? market.length : 5;
            html += '<div class="glass-panel rounded-xl p-3.5">'
                + '<div class="text-[13px] font-black text-slate-200 mb-2.5 pb-2 border-b border-slate-700/60 flex items-center gap-2"><i class="fa-solid fa-globe text-slate-400"></i>시장 전체 뉴스</div>'
                + '<div class="space-y-2">';
            market.slice(0, mLimit).forEach(function(x) { html += newsItemHtml(x, { isNew: isNew(x) }); });
            html += '</div>';
            if (market.length > mLimit) html += '<button onclick="expandStockNews(\'market\')" class="w-full mt-2 py-2 text-[11px] text-sky-300 bg-slate-800/60 rounded-lg font-bold">더보기 (' + (market.length - mLimit) + '개)</button>';
            html += '</div>';
        }
    }

    // 생성 시간 (상대 + 절대)
    if (data._cachedAt) {
        var mins = Math.round((Date.now() - data._cachedAt) / 60000);
        var rel = mins < 1 ? '방금' : (mins < 60 ? (mins + '분 전') : (Math.round(mins / 60) + '시간 전'));
        var abs = newsAbsStamp(Math.round(data._cachedAt / 1000));
        var te = document.getElementById('stockNewsTime');
        if (te) te.innerText = abs + ' 업데이트 (' + rel + ')';
    }

    list.innerHTML = html;
    translateStockNewsHeadlines();
}

function setStockNewsView(v) {
    localStorage.setItem(STOCKNEWS_VIEW_KEY, v);
    _stockNewsExpanded = {};
    if (_stockNewsData) renderStockNews(_stockNewsData);
}
function expandStockNews(which) {
    _stockNewsExpanded[which] = true;
    if (_stockNewsData) renderStockNews(_stockNewsData);
}

function toggleStockNews() {
    var list = document.getElementById('stockNewsList');
    var btn = document.getElementById('stockNewsToggleBtn');
    if (!list) return;
    var isHidden = list.classList.toggle('hidden');
    if (btn) { btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="stockNewsChev"></i>'; }
}

// ==========================================
// 🇰🇷 한국 뉴스 (한국경제 RSS, 카테고리)
// ==========================================
var KRNEWS_CATS = [['economy','경제'],['finance','증권'],['politics','정치'],['society','사회'],['international','국제'],['it','IT']];
var KRNEWS_CAT_KEY = 'umt_krnews_cat';
var KRNEWS_CACHE_KEY = 'umt_krnews_cache';   // {cat: {items, _cachedAt}}
var _krNewsExpanded = false;

function _krCat() { return localStorage.getItem(KRNEWS_CAT_KEY) || 'economy'; }
function _krCache() { try { return JSON.parse(localStorage.getItem(KRNEWS_CACHE_KEY) || '{}'); } catch (e) { return {}; } }

function renderKrNewsTabs() {
    var el = document.getElementById('krNewsTabs');
    if (!el) return;
    var cur = _krCat();
    el.innerHTML = KRNEWS_CATS.map(function(c) {
        var active = c[0] === cur;
        return '<button onclick="setKrNewsCat(\'' + c[0] + '\')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ' + (active ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400') + '">' + c[1] + '</button>';
    }).join('');
}

function setKrNewsCat(cat) {
    localStorage.setItem(KRNEWS_CAT_KEY, cat);
    _krNewsExpanded = false;
    renderKrNewsTabs();
    var cache = _krCache();
    if (cache[cat] && cache[cat]._cachedAt && (Date.now() - cache[cat]._cachedAt) < 15 * 60 * 1000) renderKrNews(cache[cat]);
    else startKrNews();
}

function ensureKrNewsLoaded() {
    renderKrNewsTabs();
    var cat = _krCat();
    var cache = _krCache();
    if (cache[cat] && cache[cat]._cachedAt && (Date.now() - cache[cat]._cachedAt) < 15 * 60 * 1000) renderKrNews(cache[cat]);
    else startKrNews();
}

function startKrNews(silent) {
    var list = document.getElementById('krNewsList');
    var cat = _krCat();
    if (!silent && list) list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>한국 뉴스 불러오는 중...</div>';
    fetch(API_BASE_URL + '/krnews?cat=' + encodeURIComponent(cat), { signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        data._cachedAt = Date.now();
        var cache = _krCache(); cache[cat] = data; localStorage.setItem(KRNEWS_CACHE_KEY, JSON.stringify(cache));
        renderKrNews(data);
    })
    .catch(function(e) {
        if (!silent && list) list.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs">한국 뉴스 실패: ' + escapeHtml(e.message).substring(0, 60) + '<br><button onclick="startKrNews()" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>';
    });
}

function renderKrNews(data) {
    var list = document.getElementById('krNewsList');
    if (!list) return;
    var items = (data && Array.isArray(data.items)) ? data.items : [];
    if (!items.length) { list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">표시할 뉴스가 없습니다</div>'; return; }
    var seen = parseFloat(localStorage.getItem('umt_krnews_seen') || '0');
    var curMax = 0; items.forEach(function(x) { if ((x.datetime || 0) > curMax) curMax = x.datetime; });
    if (curMax > 0) localStorage.setItem('umt_krnews_seen', String(curMax));
    var limit = _krNewsExpanded ? items.length : 7;
    var html = '<div class="glass-panel rounded-xl p-3.5"><div class="space-y-2">';
    items.slice(0, limit).forEach(function(x) {
        var isNew = seen > 0 && (x.datetime || 0) > seen;
        var t = newsRelativeTime(x.datetime);
        var abs = newsAbsStamp(x.datetime);
        var timeStr = t ? (t + (abs ? ' · ' + abs : '')) : abs;
        var nb = isNew ? '<span class="text-[8px] font-black bg-red-500 text-white px-1 py-0.5 rounded mr-1 align-middle">NEW</span>' : '';
        var link = x.url ? encodeURI(x.url) : '';
        var inner = '<div class="text-[13px] text-white font-bold leading-snug">' + nb + escapeHtml(x.headline || '') + '</div>'
            + '<div class="flex items-center gap-2 mt-1.5 text-[10px]"><span class="font-bold text-slate-300">' + escapeHtml(x.source || '한국경제') + '</span>'
            + (timeStr ? '<span class="text-slate-500">· ' + timeStr + '</span>' : '')
            + (link ? '<span class="ml-auto text-rose-400 font-bold">원문 <i class="fa-solid fa-arrow-up-right-from-square"></i></span>' : '') + '</div>';
        html += link ? ('<a href="' + link + '" target="_blank" rel="noopener" class="block bg-slate-800/60 hover:bg-slate-700/70 rounded-lg p-3 transition border ' + (isNew ? 'border-red-500/40' : 'border-slate-700/50') + '">' + inner + '</a>')
            : ('<div class="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">' + inner + '</div>');
    });
    html += '</div>';
    if (items.length > limit) html += '<button onclick="expandKrNews()" class="w-full mt-2 py-2 text-[11px] text-rose-300 bg-slate-800/60 rounded-lg font-bold">더보기 (' + (items.length - limit) + '개)</button>';
    html += '</div>';
    list.innerHTML = html;
    if (data._cachedAt) {
        var mins = Math.round((Date.now() - data._cachedAt) / 60000);
        var rel = mins < 1 ? '방금' : (mins < 60 ? (mins + '분 전') : (Math.round(mins / 60) + '시간 전'));
        var te = document.getElementById('krNewsTime'); if (te) te.innerText = rel + ' 업데이트';
    }
}

function expandKrNews() { _krNewsExpanded = true; var c = _krCache()[_krCat()]; if (c) renderKrNews(c); }

// ==========================================
// 🌎 글로벌 뉴스 (CNBC RSS, 카테고리)
// ==========================================
var USNEWS_CATS = [['markets', '시장'], ['economy', '경제'], ['technology', '기술'], ['finance', '금융'], ['politics', '정치'], ['investing', '투자']];
var USNEWS_CAT_KEY = 'umt_usnews_cat';
var USNEWS_CACHE_KEY = 'umt_usnews_cache';
var _usNewsExpanded = false;
function _usCat() { return localStorage.getItem(USNEWS_CAT_KEY) || 'markets'; }
function _usCache() { try { return JSON.parse(localStorage.getItem(USNEWS_CACHE_KEY) || '{}'); } catch (e) { return {}; } }
function renderUsNewsTabs() {
    var el = document.getElementById('usNewsTabs'); if (!el) return;
    var cur = _usCat();
    el.innerHTML = USNEWS_CATS.map(function(c) {
        var active = c[0] === cur;
        return '<button onclick="setUsNewsCat(\'' + c[0] + '\')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ' + (active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400') + '">' + c[1] + '</button>';
    }).join('');
}
function setUsNewsCat(cat) {
    localStorage.setItem(USNEWS_CAT_KEY, cat); _usNewsExpanded = false; renderUsNewsTabs();
    var cache = _usCache();
    if (cache[cat] && cache[cat]._cachedAt && (Date.now() - cache[cat]._cachedAt) < 15 * 60 * 1000) renderUsNews(cache[cat]); else startUsNews();
}
function ensureUsNewsLoaded() {
    renderUsNewsTabs();
    var cat = _usCat(); var cache = _usCache();
    if (cache[cat] && cache[cat]._cachedAt && (Date.now() - cache[cat]._cachedAt) < 15 * 60 * 1000) renderUsNews(cache[cat]); else startUsNews();
}
function startUsNews(silent) {
    var list = document.getElementById('usNewsList'); var cat = _usCat();
    if (!silent && list) list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>글로벌 뉴스 불러오는 중...</div>';
    fetch(API_BASE_URL + '/usnews?cat=' + encodeURIComponent(cat), { signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        data._cachedAt = Date.now();
        var cache = _usCache(); cache[cat] = data; localStorage.setItem(USNEWS_CACHE_KEY, JSON.stringify(cache));
        renderUsNews(data);
    })
    .catch(function(e) { if (!silent && list) list.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs">글로벌 뉴스 실패: ' + escapeHtml(e.message).substring(0, 60) + '<br><button onclick="startUsNews()" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>'; });
}
function renderUsNews(data) {
    var list = document.getElementById('usNewsList'); if (!list) return;
    var items = (data && Array.isArray(data.items)) ? data.items : [];
    if (!items.length) { list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">표시할 뉴스가 없습니다</div>'; return; }
    var seen = parseFloat(localStorage.getItem('umt_usnews_seen') || '0');
    var curMax = 0; items.forEach(function(x) { if ((x.datetime || 0) > curMax) curMax = x.datetime; });
    if (curMax > 0) localStorage.setItem('umt_usnews_seen', String(curMax));
    var limit = _usNewsExpanded ? items.length : 7;
    var html = '<div class="glass-panel rounded-xl p-3.5"><div class="space-y-2">';
    items.slice(0, limit).forEach(function(x) { html += newsItemHtml(x, { isNew: seen > 0 && (x.datetime || 0) > seen }); });
    html += '</div>';
    if (items.length > limit) html += '<button onclick="expandUsNews()" class="w-full mt-2 py-2 text-[11px] text-indigo-300 bg-slate-800/60 rounded-lg font-bold">더보기 (' + (items.length - limit) + '개)</button>';
    html += '</div>';
    list.innerHTML = html;
    translateNewsHeadlines('usNewsList');
    if (data._cachedAt) { var mins = Math.round((Date.now() - data._cachedAt) / 60000); var te = document.getElementById('usNewsTime'); if (te) te.innerText = (mins < 60 ? mins + '분 전' : Math.round(mins / 60) + '시간 전') + ' 업데이트'; }
}
function expandUsNews() { _usNewsExpanded = true; var c = _usCache()[_usCat()]; if (c) renderUsNews(c); }
function toggleUsNews() {
    var list = document.getElementById('usNewsList'); var tabs = document.getElementById('usNewsTabs'); var btn = document.getElementById('usNewsToggleBtn');
    if (!list) return;
    var isHidden = list.classList.toggle('hidden');
    if (tabs) tabs.classList.toggle('hidden', isHidden);
    if (btn) btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="usNewsChev"></i>';
}

// 뉴스탭 섹션 바로가기 (scroll-margin-top으로 헤더 가림 방지)
function scrollToNewsSection(id) {
    var el = document.getElementById(id);
    if (!el || el.classList.contains('hidden')) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (e) { el.scrollIntoView(); }
}

// 🌐 시장 흐름 (핫이슈 Gemini overview 재활용)
function renderMarketFlow() {
    var sec = document.getElementById('marketFlowSection'); var body = document.getElementById('marketFlowBody');
    if (!sec || !body) return;
    var hot = null; try { hot = JSON.parse(localStorage.getItem(HOT_CACHE_KEY) || 'null'); } catch (e) {}
    if (!hot || !hot.overview) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    var quadNames = { 1: '골디락스', 2: '과열', 3: '스태그플레이션', 4: '침체' };
    var q = hot.quad, quadHtml = '';
    if (q && q.current) quadHtml = '<div class="text-[11px] font-bold text-cyan-300 mb-1.5">🧭 현재 국면: Q' + q.current + ' ' + escapeHtml(q.name || quadNames[q.current] || '') + '</div>';
    body.innerHTML = quadHtml + '<div class="text-[12px] text-slate-300 leading-relaxed">' + escapeHtml(hot.overview) + '</div>';
    var te = document.getElementById('marketFlowTime');
    if (te && hot._cachedAt) { var mins = Math.round((Date.now() - hot._cachedAt) / 60000); te.innerText = (mins < 60 ? mins + '분 전' : Math.round(mins / 60) + '시간 전') + ' 기준'; }
}

// ==========================================
// 📅 경제 일정 (Gemini + 12h 캐시)
// ==========================================
var CALENDAR_CACHE_KEY = 'umt_calendar_cache';
var CALENDAR_TTL = 12 * 60 * 60 * 1000;

function ensureCalendarLoaded() {
    try {
        var c = JSON.parse(localStorage.getItem(CALENDAR_CACHE_KEY) || 'null');
        if (c && c._cachedAt && (Date.now() - c._cachedAt) < CALENDAR_TTL) { renderEconCalendar(c); return; }
    } catch (e) {}
    startCalendar();
}

function startCalendar() {
    var list = document.getElementById('econCalendarList');
    if (list) list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>경제 일정 불러오는 중...</div>';
    fetch(API_BASE_URL + '/calendar', { signal: AbortSignal.timeout ? AbortSignal.timeout(90000) : undefined })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        data._cachedAt = Date.now();
        localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(data));
        renderEconCalendar(data);
    })
    .catch(function(e) {
        if (list) list.innerHTML = '<div class="glass-panel p-4 text-center text-red-400 text-xs">경제 일정 실패: ' + escapeHtml(e.message).substring(0, 60) + '<br><button onclick="startCalendar()" class="mt-2 px-3 py-1 bg-slate-700 rounded text-slate-300 text-[10px]">다시 시도</button></div>';
    });
}

function renderEconCalendar(data) {
    var list = document.getElementById('econCalendarList');
    if (!list) return;
    var events = (data && Array.isArray(data.events)) ? data.events : [];
    if (!events.length) { list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">예정된 일정이 없습니다</div>'; return; }

    // 날짜별 그룹
    var groups = {}, order = [];
    events.forEach(function(e) {
        var k = (e.date || '') + (e.weekday ? '(' + e.weekday + ')' : '');
        if (!groups[k]) { groups[k] = []; order.push(k); }
        groups[k].push(e);
    });
    var impDot = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-slate-500' };
    var flag = { US: '🇺🇸', KR: '🇰🇷' };
    var html = '<div class="glass-panel rounded-xl p-3.5 space-y-3">';
    order.forEach(function(k) {
        html += '<div><div class="text-[11px] font-black text-emerald-300 mb-1.5 pb-1 border-b border-slate-700/60">' + escapeHtml(k) + '</div><div class="space-y-1.5">';
        groups[k].forEach(function(e) {
            var meta = [];
            if (e.time) meta.push(escapeHtml(e.time));
            if (e.forecast) meta.push('예상 ' + escapeHtml(e.forecast));
            if (e.previous) meta.push('이전 ' + escapeHtml(e.previous));
            html += '<div class="flex items-start gap-2">'
                + '<span class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ' + (impDot[e.importance] || 'bg-slate-500') + '"></span>'
                + '<div class="flex-1 min-w-0">'
                + '<div class="text-[12px] text-white font-bold leading-snug">' + (flag[e.country] || '') + ' ' + escapeHtml(e.name || '') + '</div>'
                + (meta.length ? '<div class="text-[10px] text-slate-500">' + meta.join(' · ') + '</div>' : '')
                + '</div></div>';
        });
        html += '</div></div>';
    });
    html += '</div>';
    list.innerHTML = html;

    if (data._cachedAt) {
        var mins = Math.round((Date.now() - data._cachedAt) / 60000);
        var rel = mins < 60 ? (mins + '분 전') : (Math.round(mins / 60) + '시간 전');
        var te = document.getElementById('econCalendarTime'); if (te) te.innerText = rel + ' 업데이트';
    }
}

function toggleEconCalendar() {
    var list = document.getElementById('econCalendarList');
    var btn = document.getElementById('econCalendarToggleBtn');
    if (!list) return;
    var isHidden = list.classList.toggle('hidden');
    if (btn) { btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="econCalendarChev"></i>'; }
}

function toggleKrNews() {
    var list = document.getElementById('krNewsList');
    var tabs = document.getElementById('krNewsTabs');
    var btn = document.getElementById('krNewsToggleBtn');
    if (!list) return;
    var isHidden = list.classList.toggle('hidden');
    if (tabs) tabs.classList.toggle('hidden', isHidden);
    if (btn) { btn.innerHTML = '<i class="fa-solid ' + (isHidden ? 'fa-chevron-down' : 'fa-chevron-up') + ' text-xs" id="krNewsChev"></i>'; }
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
        // 클라이언트 직접 호출 (각자 IP 기준이라 mymemory 한도 안정적) + de(email)로 한도 상향
        const res = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(key) + '&langpair=en|ko&de=' + encodeURIComponent(MYMEMORY_EMAIL));
        const json = await res.json();
        const status = json && json.responseStatus;
        let translated = (json && json.responseData && json.responseData.translatedText) ? json.responseData.translatedText.trim() : '';
        // 한도 초과/경고/오류 응답은 번역 실패로 처리(원문 유지, 캐시 안 함 → 나중에 재시도)
        if (!translated || (status && Number(status) !== 200) || json.quotaFinished ||
            /MYMEMORY WARNING|YOU USED ALL|QUOTA|INVALID|NOT VALID|PLEASE (TRY|SELECT)|限/i.test(translated)) {
            return null;
        }
        _translateCache[key] = translated;
        return translated;
    } catch (e) {
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
        return '<span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 align-middle animate-pulse"></span>' + escapeHtml(item.title) + ko;
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
        display.onclick = goToNewsTab;
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
        // 사이클별 가용자금(USD 절대값) — 사이클 리셋 시 설정됨. null이면 기존 allocPct 비례 로직 사용
        if (p.config.cycleAvailableUSD !== null && p.config.cycleAvailableUSD !== undefined) {
            p.config.cycleAvailableUSD = parseFloat(p.config.cycleAvailableUSD) || null;
        } else {
            p.config.cycleAvailableUSD = null;
        }

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

        // 3단계 매도 전략: sellPlans [ { targetPct, sellRatio }, ... ] — targetPct는 수수료 차감 후 순수익률
        const defaultSellPlans = [
            { targetPct: 5, sellRatio: 50 },
            { targetPct: 10, sellRatio: 50 },
            { targetPct: 15, sellRatio: 100 }
        ];
        if (!Array.isArray(p.config.sellPlans) || p.config.sellPlans.length !== 3) {
            const legacyPct = parseFloat(p.config.targetPct) || 5;
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
        startPriceTicker();
        startSectorRotation();
        fetchMarketDataInBackground();
        fetchMacroIndicatorsLive();
        fetchLiveFxRate();

        // 5. 매크로 데이터: 마지막 캐시를 즉시 렌더 → 백그라운드에서 서버(KV) 최신본 동기화
        //    (서버 크론이 매일 미장 마감 후 자동 분석해 KV에 저장하므로, 앱을 열면 항상 최신이 채워짐)
        var cachedMacro = loadMacroRaw();
        if (cachedMacro) {
            MACRO_DATA = cachedMacro;
            updateMacroDashboard();
        } else {
            renderMacroStartButton();
        }
        syncMacroFromServer();

        // 6. 주간 리포트 캐시 로드
        var cachedWeekly = loadWeeklyFromCache();
        if (cachedWeekly) renderWeeklyReport(cachedWeekly);

        // 7. 핫이슈 캐시 로드 (30분 TTL, 없으면 버튼 대기)
        var cachedHot = loadHotFromCache();
        if (cachedHot) renderHotIssues(cachedHot);

        // 8. 종목·시장 뉴스 캐시 로드 (1시간 TTL, 없으면 버튼 대기)
        var cachedStockNews = loadStockNewsFromCache();
        if (cachedStockNews) renderStockNews(cachedStockNews);

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

// 실시간 USD/KRW 환율 (환차손익 계산용)
var _liveUsdKrw = 0;
function fetchLiveFxRate() {
    fetchMarketData('KRW=X').then(function(d) {
        if (d && !d.error && d.price > 0) {
            _liveUsdKrw = d.price;
            MARKET_SNAPSHOT['KRW=X'] = d;
            try { updateGlobalCalc(); } catch (e) {}
        }
    });
}

// 홈 매크로 지표(WTI/GOLD/DXY/US10Y/VIX)를 야후에서 실시간으로 채움 (/macro 분석과 무관하게 항상 표시)
function fetchMacroIndicatorsLive() {
    var map = [
        { id: 'Wti', ticker: 'CL=F', fmt: 1 },
        { id: 'Gold', ticker: 'GC=F', fmt: 0 },
        { id: 'Dxy', ticker: 'DX-Y.NYB', fmt: 1 },
        { id: 'Us10y', ticker: '^TNX', fmt: 2 },
        { id: 'Vix', ticker: '^VIX', fmt: 1 }
    ];
    map.forEach(function(m) {
        fetchMarketData(m.ticker).then(function(d) {
            if (!d || d.error || !(d.price > 0)) return;
            MARKET_SNAPSHOT[m.ticker] = d;
            var valEl = document.getElementById('mk' + m.id);
            var chgEl = document.getElementById('mk' + m.id + 'Chg');
            if (valEl) valEl.innerText = Number(d.price).toFixed(m.fmt);
            if (chgEl && d.change != null && !isNaN(d.change)) {
                var chg = d.change;
                chgEl.innerText = (chg > 0 ? '+' : '') + chg.toFixed(1) + '%';
                chgEl.className = 'text-[9px] font-bold ' + (chg > 0 ? 'text-red-400' : (chg < 0 ? 'text-blue-400' : 'text-slate-500'));
            }
        });
    });
}

// 매크로 지표 클릭 → TradingView 차트 모달 (임베드 가능한 실거래소 피드 심볼 사용)
var MACRO_CHART_MAP = {
    wti:   { tv: 'TVC:USOIL',      mkId: 'Wti',   name: 'WTI 원유', unit: '$',
             desc: '서부텍사스산 원유 선물 가격. 인플레이션·경기·지정학(특히 중동) 흐름을 반영하는 대표 원자재.',
             up: '물가 상승 압력↑, 에너지주(XLE·NRGU) 수혜, 항공·운송엔 부담',
             down: '인플레 둔화 기대↑, 소비·운송주 수혜, 에너지주 부담',
             quad: 'Quad2(과열) 국면에서 강세 경향' },
    gold:  { tv: 'TVC:GOLD',       mkId: 'Gold',  name: '금 (Gold)', unit: '$',
             desc: '대표 안전자산. 실질금리·달러와 역의 관계, 위험회피·인플레 헤지 수단.',
             up: '실질금리↓ / 달러약세 / 위험회피 심리. 금광주(NUGT·GDXU) 수혜',
             down: '실질금리↑ / 달러강세 / 위험선호 회복',
             quad: 'Quad3(스태그플레이션)·위기 국면에서 강세' },
    dxy:   { tv: 'CAPITALCOM:DXY', mkId: 'Dxy',   name: '달러 인덱스 (DXY)', unit: '',
             desc: '주요 6개 통화 대비 미 달러의 상대 가치. 글로벌 자금 흐름의 바로미터.',
             up: '달러강세 → 신흥국·원자재·수출주·금에 부담, 환차손 주의',
             down: '달러약세 → 원자재·신흥국·금 우호적',
             quad: '안전자산 선호(Quad4)·긴축기에 강세' },
    us10y: { tv: 'FRED:DGS10',     mkId: 'Us10y', name: '미 10년물 국채금리', unit: '%',
             desc: '글로벌 금리의 기준점(벤치마크). 성장·인플레·통화정책 기대를 종합 반영.',
             up: '긴축/성장기대 → 성장주·기술주(TQQQ)·채권(TMF)에 부담',
             down: '완화기대/경기둔화 → 성장주·장기채 우호적',
             quad: '상승=Quad2, 하락=Quad4 신호로 자주 작용' },
    vix:   { tv: 'CAPITALCOM:VIX',  mkId: 'Vix',   name: 'VIX 변동성지수', unit: '',
             desc: 'S&P500 향후 30일 변동성 기대치 = 시장의 공포지수.',
             up: '불안·공포 확대 → 위험회피, 레버리지 비중 축소 신호',
             down: '안정·위험선호 → 추세 추종 우호적',
             quad: '<20 안정 / 20~30 경계 / 30↑ 공포' }
};
var _macroChartWidget = null;
function openMacroChart(key) {
    var m = MACRO_CHART_MAP[key];
    if (!m) return;
    var modal = document.getElementById('macroChartModal');
    var titleEl = document.getElementById('macroChartTitle');
    var detailEl = document.getElementById('macroChartDetail');
    var cont = document.getElementById('macroChartContainer');

    // 현재 값/변동률 (실시간 스냅샷에서)
    var snapTicker = { wti: 'CL=F', gold: 'GC=F', dxy: 'DX-Y.NYB', us10y: '^TNX', vix: '^VIX' }[key];
    var md = MARKET_SNAPSHOT[snapTicker];
    var valLine = '';
    if (md && md.price > 0) {
        var chg = md.change != null ? md.change : 0;
        var col = chg >= 0 ? 'text-red-400' : 'text-blue-400';
        valLine = '<div class="flex items-baseline gap-2 mb-2"><span class="text-xl font-black text-white">' + (m.unit === '$' ? '$' : '') + Number(md.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) + (m.unit === '%' ? '%' : '') + '</span>'
            + '<span class="text-sm font-bold ' + col + '">' + (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%</span></div>';
    }

    if (titleEl) titleEl.innerText = m.name;
    if (cont) cont.innerHTML = '';
    if (detailEl) {
        detailEl.innerHTML = valLine
            + '<div class="text-[12px] text-slate-300 leading-relaxed">' + escapeHtml(m.desc) + '</div>'
            + '<div class="grid grid-cols-1 gap-1.5 mt-1">'
            + '<div class="bg-slate-800/50 rounded-lg p-2 text-[11px]"><span class="text-red-400 font-bold">▲ 상승 시</span> <span class="text-slate-300">' + escapeHtml(m.up) + '</span></div>'
            + '<div class="bg-slate-800/50 rounded-lg p-2 text-[11px]"><span class="text-blue-400 font-bold">▼ 하락 시</span> <span class="text-slate-300">' + escapeHtml(m.down) + '</span></div>'
            + '<div class="bg-slate-800/50 rounded-lg p-2 text-[11px]"><span class="text-purple-300 font-bold"><i class="fa-solid fa-compass mr-1"></i>전략</span> <span class="text-slate-300">' + escapeHtml(m.quad) + '</span></div>'
            + '</div>';
    }
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    if (typeof TradingView !== 'undefined') {
        try {
            _macroChartWidget = new TradingView.widget({
                "autosize": true, "symbol": m.tv, "interval": "D", "timezone": "Etc/UTC", "theme": "dark",
                "style": "1", "locale": "kr", "toolbar_bg": "#1e293b", "enable_publishing": false,
                "hide_top_toolbar": false, "hide_side_toolbar": true, "allow_symbol_change": false,
                "container_id": "macroChartContainer", "studies": ["MASimple@tv-basicstudies"]
            });
        } catch (e) {
            if (cont) cont.innerHTML = '<div class="p-6 text-center text-slate-500 text-xs">차트를 불러올 수 없습니다.</div>';
        }
    }
}
function closeMacroChart() {
    var modal = document.getElementById('macroChartModal');
    var cont = document.getElementById('macroChartContainer');
    if (cont) cont.innerHTML = '';
    _macroChartWidget = null;
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

function fetchMarketDataInBackground() {
    fetchMarketData('^VIX').then(data => {
        MARKET_SNAPSHOT['^VIX'] = data;
        updateFearGreed();
    });

    let successCount = 0;
    // 등록 ETF + 사용자가 추가한 일반 종목(미등록) 모두 갱신
    const etfSyms = ETF_DB.map(e => e.sym);
    const customSyms = Object.keys(portfolios).filter(s => !etfSyms.includes(s));
    etfSyms.concat(customSyms).forEach(sym => {
        fetchMarketData(sym).then(data => {
            MARKET_SNAPSHOT[sym] = data;
            if (!data.error && data.price > 0) successCount++;

            updateStatus(successCount > 0);
            updateSingleCard(sym, data);
            updateRecommendationsUI();
            try { renderPositionOverview(); } catch(e) {}

            if (activeTicker === sym) {
                updateStrategyDataUI(sym);
                renderSellPlan();
                if (typeof renderStrategyProgressCard === 'function') renderStrategyProgressCard(sym);
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

        // { ok: true, data: { ... } } 형태 대응
        var data = raw;
        if (data && data.data && !data.settings && !data.portfolio && !data.global && !data.ports) {
            data = data.data;
        } else if (data && (data.settings || data.portfolio || data.global || data.ports)) {
        } else {
        }
        
        if (data && data.settings != null && data.portfolio != null) {
            globalData = data.settings;
            if (Array.isArray(data.deposits)) globalData.deposits = data.deposits;
            portfolios = data.portfolio;
            if (Array.isArray(data.trades) && data.trades.length > 0) {
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
var _etfListQuad = undefined; // ETF 리스트가 마지막으로 렌더된 시점의 Quad
// 모든 ETF 카드 가격/등락을 현재 스냅샷으로 다시 채움 (재렌더 직후 호출)
function refreshAllEtfCards() {
    ETF_DB.forEach(function (e) {
        var md = MARKET_SNAPSHOT[e.sym];
        if (md && !md.error && md.price > 0) updateSingleCard(e.sym, md);
    });
}
// Quad가 바뀌었을 때만 ETF 리스트를 다시 그림 (현재 국면 그룹을 맨 위로/강조)
function maybeRerenderEtfList() {
    if (getCurrentQuad() !== _etfListQuad) {
        renderInitialMarketList();
        refreshAllEtfCards();
    }
}

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
    let order = ['Quad 1 — 성장주','Quad 2 — 인플레 수혜','Quad 3 — 방어/인버스','Quad 4 — 채권/방어주','특수 목적','전 Quad 공용','기타'];

    var quadNow = getCurrentQuad();
    var quadSectorMap = {1:'Quad 1 — 성장주', 2:'Quad 2 — 인플레 수혜', 3:'Quad 3 — 방어/인버스', 4:'Quad 4 — 채권/방어주'};
    var currentQuadSector = quadSectorMap[quadNow] || '';
    // 현재 국면 수혜 섹터를 맨 위로 끌어올림 (상단 Quad 대시보드와 직접 연결)
    if (currentQuadSector && order.indexOf(currentQuadSector) > -1) {
        order = [currentQuadSector].concat(order.filter(function(k){ return k !== currentQuadSector; }));
    }
    _etfListQuad = quadNow;

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
        // 현재 Quad 수혜 섹터만 펼침, 나머지 접기
        var isOpen = (sector === currentQuadSector);
        var sectorId = 'etfSector' + idx;
        var sectorStyles = {
            'Quad 1 — 성장주':     {icon:'fa-sun',        color:'text-green-400', bg:'bg-green-900/15 border-green-800/40'},
            'Quad 2 — 인플레 수혜': {icon:'fa-fire',       color:'text-yellow-400',bg:'bg-yellow-900/15 border-yellow-800/40'},
            'Quad 3 — 방어/인버스': {icon:'fa-cloud-bolt', color:'text-red-400',   bg:'bg-red-900/15 border-red-800/40'},
            'Quad 4 — 채권/방어주': {icon:'fa-snowflake',  color:'text-blue-400',  bg:'bg-blue-900/15 border-blue-800/40'},
            '특수 목적':           {icon:'fa-shield-halved',color:'text-purple-400',bg:'bg-purple-900/15 border-purple-800/40'},
            '전 Quad 공용':        {icon:'fa-arrows-rotate',color:'text-slate-300', bg:'bg-slate-800/40 border-slate-700'},
        };
        var st = sectorStyles[sector] || {icon:'fa-circle', color:'text-slate-400', bg:'bg-slate-800/40 border-slate-700', bar:'bg-slate-500'};
        // 좌측 컬러 바용 색상
        var barColors = {
            'Quad 1 — 성장주':'bg-green-400','Quad 2 — 인플레 수혜':'bg-yellow-400',
            'Quad 3 — 방어/인버스':'bg-red-400','Quad 4 — 채권/방어주':'bg-blue-400',
            '특수 목적':'bg-purple-400','전 Quad 공용':'bg-slate-400'
        };
        var barColor = barColors[sector] || 'bg-slate-500';
        var isCurrent = (sector === currentQuadSector);
        var quadBadge = isCurrent ? '<span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold ml-2 animate-pulse">현재 Quad</span>' : '';
        var tickerPreview = groups[sector].map(function(e){return e.sym;}).join(' · ');
        return `<div class="mt-3 first:mt-0">
            <button type="button" onclick="toggleEtfSector('${sectorId}')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border ${st.bg} hover:brightness-110 transition ${isCurrent?'ring-1 ring-blue-500/50':''} relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${barColor}"></div>
                <div class="flex items-center gap-2.5 pl-1.5">
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
            <div class="grid gap-2 mt-2 ml-3 ${isOpen?'':'hidden'}" id="${sectorId}">${cards}</div>
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

    var _chg = (md.change != null && !isNaN(md.change)) ? md.change : null;
    var _chgHtml = _chg != null ? ' <span class="text-[10px] font-bold ' + chgClass(_chg) + '">' + (_chg > 0 ? '+' : '') + _chg.toFixed(1) + '%</span>' : '';
    pEl.innerHTML = '$' + md.price.toFixed(2) + _chgHtml;
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
        // 이벤트 오버레이 보정
        var overlayAdj = getEventOverlayAdjustments();
        if (overlayAdj.boost[e.sym]) score += overlayAdj.boost[e.sym] * 10;
        if (overlayAdj.dampen[e.sym]) score -= overlayAdj.dampen[e.sym] * 15;
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

    // 폴백: 매크로(AI Quad) 데이터 없음 → 빈 매트릭스 + 판정 대기 표시
    renderQuadMatrix(null);
}

// ==========================================
// Macro Dashboard — 전체 업데이트
// ==========================================
const QUAD_COLORS = { 1:'text-green-400', 2:'text-yellow-400', 3:'text-red-400', 4:'text-blue-400' };
const QUAD_BG     = { 1:'border-green-500/30', 2:'border-yellow-500/30', 3:'border-red-500/30', 4:'border-blue-500/30' };
const QUAD_SCORES = { 1:80, 2:60, 3:20, 4:40 };
const QUAD_ICONS  = { 1:'fa-sun', 2:'fa-fire', 3:'fa-cloud-bolt', 4:'fa-snowflake' };

// 2×2 매트릭스 메타 (성장 가로축 · 물가 세로축)
const QUAD_META = {
    1: { name:'골디락스',       icon:'fa-sun',        play:'위험자산 선호',   txt:'text-green-300',  bdr:'border-green-400',  bg:'bg-green-500/20',  glow:'rgba(34,197,94,.45)',  dot:'bg-green-400' },
    2: { name:'과열',           icon:'fa-fire',       play:'에너지·원자재',   txt:'text-yellow-300', bdr:'border-yellow-400', bg:'bg-yellow-500/20', glow:'rgba(234,179,8,.45)',  dot:'bg-yellow-400' },
    3: { name:'스태그플레이션', icon:'fa-cloud-bolt', play:'방어·인플레헤지', txt:'text-red-300',    bdr:'border-red-400',    bg:'bg-red-500/20',    glow:'rgba(239,68,68,.45)',  dot:'bg-red-400' },
    4: { name:'침체',           icon:'fa-snowflake',  play:'현금·안전자산',   txt:'text-blue-300',   bdr:'border-blue-400',   bg:'bg-blue-500/20',   glow:'rgba(59,130,246,.45)', dot:'bg-blue-400' }
};
// 화면 배치 순서: 좌상(성장↓물가↑)=Q3, 우상(성장↑물가↑)=Q2, 좌하(성장↓물가↓)=Q4, 우하(성장↑물가↓)=Q1
const QUAD_GRID_ORDER = [3, 2, 4, 1];

function renderQuadMatrix(quad) {
    var box = document.getElementById('quadList');
    if (!box) return;

    // 대기 상태
    if (!quad) {
        box.innerHTML = '<div class="flex items-center gap-2 text-slate-500 text-[12px] py-3">'
            + '<i class="fa-solid fa-spinner fa-spin text-[11px]"></i>AI 판정 대기 중…</div>';
        return;
    }

    var cur = quad.current;
    var mc = QUAD_META[cur] || {};
    var g = quad.growth === 'accelerating' ? '성장 가속↑' : '성장 둔화↓';
    var i = quad.inflation === 'accelerating' ? '인플레 가속↑' : '인플레 둔화↓';
    var conf = quad.confidence || 0;

    // 1) 현재 국면 강조 블록
    var html = '<div class="rounded-xl bg-slate-800/50 border border-slate-700/60 p-3">'
        + '<div class="flex items-center justify-between gap-2">'
        +   '<div class="flex items-center gap-2 text-[15px] font-black leading-none">'
        +     '<i class="fa-solid ' + (mc.icon||'') + ' ' + (mc.txt||'') + '"></i>'
        +     '<span class="' + (mc.txt||'text-white') + '">Q' + cur + '</span>'
        +     '<span class="text-white">' + (quad.name||mc.name||'') + '</span>'
        +   '</div>'
        +   '<span class="flex items-center gap-1 text-[10px] font-black ' + (mc.txt||'text-white') + ' shrink-0"><span class="w-1.5 h-1.5 rounded-full ' + (mc.dot||'bg-white') + ' animate-pulse"></span>현재</span>'
        + '</div>'
        + '<div class="text-[11px] text-slate-300 font-bold mt-1.5">' + g + ' · ' + i + '</div>'
        + '<div class="flex items-center gap-2 mt-2">'
        +   '<span class="text-[9px] text-slate-500 shrink-0">확신도</span>'
        +   '<div class="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full bg-blue-400 transition-all" style="width:' + conf + '%"></div></div>'
        +   '<span class="text-[11px] font-black text-blue-300 shrink-0">' + conf + '%</span>'
        + '</div>'
        + '</div>';

    // 2) 나머지 국면 목록 (번호순, 차분하게)
    var others = [1,2,3,4].filter(function(n){ return n !== cur; });
    html += '<div class="mt-1.5">';
    others.forEach(function(n) {
        var m = QUAD_META[n];
        html += '<div class="flex items-center gap-2 px-1 py-1.5">'
            + '<i class="fa-solid ' + m.icon + ' ' + m.txt + ' text-[11px] w-4 text-center shrink-0"></i>'
            + '<span class="text-[12px] font-bold text-slate-300">Q' + n + ' ' + m.name + '</span>'
            + '<span class="text-[10px] text-slate-500 ml-auto">' + m.play + '</span>'
            + '</div>';
    });
    html += '</div>';

    box.innerHTML = html;
}

function updateMacroDashboard() {
    if (!MACRO_DATA) return;
    try { renderQuadHeader(); } catch(e) { console.error('[Macro] renderQuadHeader:', e); }
    try { renderMarketIndicators(); } catch(e) { console.error('[Macro] renderMarketIndicators:', e); }
    try { renderUpcomingEvents(); } catch(e) { console.error('[Macro] renderUpcomingEvents:', e); }
    try { renderNewsBriefing(); } catch(e) { console.error('[Macro] renderNewsBriefing:', e); }
    try { renderHoldingStatus(); } catch(e) { console.error('[Macro] renderHoldingStatus:', e); }
    try { maybeRerenderEtfList(); } catch(e) { console.error('[Macro] maybeRerenderEtfList:', e); }
    // 상단 전광판은 Google News RSS (startNewsTicker)가 담당
}

// ── 1. Quad 헤더 ──
function renderQuadHeader() {
    const q = MACRO_DATA.quad;
    if (!q) return;

    // 2×2 매트릭스 + 요약/확신도
    renderQuadMatrix(q);

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
        var barColors = {1:'bg-green-400',2:'bg-yellow-400',3:'bg-red-400',4:'bg-blue-400'};
        // 현재 국면 제외 + 위험도 내림차순 정렬
        var rows = [1,2,3,4].filter(function(n){ return n !== q.current; })
            .map(function(n){ return { n:n, pct: (tr['to_quad'+n] != null ? tr['to_quad'+n] : 0) }; })
            .sort(function(a,b){ return b.pct - a.pct; });
        trGrid.innerHTML = rows.map(function(r, idx) {
            var top = (idx === 0 && r.pct >= 30); // 가장 높고 유의미하면 강조
            var lblColor = top ? QUAD_COLORS[r.n] : 'text-slate-300';
            var pctColor = top ? QUAD_COLORS[r.n] : 'text-slate-200';
            return '<div class="flex items-center gap-2">'
                + '<span class="text-[10px] font-bold w-[70px] shrink-0 ' + lblColor + '">' + quadNames[r.n] + '</span>'
                + '<div class="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full ' + barColors[r.n] + ' transition-all" style="width:'+r.pct+'%"></div></div>'
                + '<span class="text-[11px] font-black w-9 text-right ' + pctColor + '">' + r.pct + '%</span>'
                + '</div>';
        }).join('');
    }

    // 이벤트 오버레이
    var evArea = document.getElementById('eventOverlayArea');
    var evBadges = document.getElementById('eventOverlayBadges');
    if (evArea && evBadges && MACRO_DATA.events && MACRO_DATA.events.overlay && MACRO_DATA.events.overlay.length > 0) {
        evArea.classList.remove('hidden');
        var sevIcon = {high:'text-red-400', medium:'text-yellow-400', low:'text-slate-400'};
        evBadges.innerHTML = MACRO_DATA.events.overlay.map(function(ev) {
            var ic = sevIcon[ev.severity] || sevIcon.low;
            return '<div class="flex items-start gap-2 text-[11px]">'
                + '<i class="fa-solid fa-triangle-exclamation ' + ic + ' mt-[3px] text-[9px] shrink-0"></i>'
                + '<span class="text-slate-200 font-medium leading-snug">' + escapeHtml(ev.title) + '</span>'
                + '</div>';
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

    var impDot = {high:'bg-red-500', medium:'bg-yellow-500', low:'bg-slate-500'};
    var impLabel = {high:'중요', medium:'보통', low:'참고'};

    // 날짜별 그룹핑
    var dateGroups = {};
    var dateOrder = [];
    ev.upcoming.forEach(function(e) {
        var d = e.date || '?';
        if (!dateGroups[d]) { dateGroups[d] = []; dateOrder.push(d); }
        dateGroups[d].push(e);
    });

    list.innerHTML = dateOrder.map(function(date) {
        var items = dateGroups[date];
        return '<div class="flex gap-3 py-1.5">'
            + '<div class="w-10 shrink-0 text-right"><span class="text-xs font-black text-white">' + escapeHtml(date) + '</span></div>'
            + '<div class="w-px bg-slate-700 shrink-0 relative"><div class="absolute top-1 -left-[3px] w-[7px] h-[7px] rounded-full bg-slate-600 border border-slate-500"></div></div>'
            + '<div class="flex-1 space-y-1">' + items.map(function(e) {
                var dot = impDot[e.importance] || impDot.low;
                return '<div class="flex items-center gap-2 text-[11px]">'
                    + '<span class="w-1.5 h-1.5 rounded-full shrink-0 ' + dot + '"></span>'
                    + '<span class="text-white">' + escapeHtml(e.name) + '</span>'
                    + '<span class="text-[9px] text-slate-500 ml-auto shrink-0">' + (impLabel[e.importance]||'') + '</span>'
                    + '</div>';
            }).join('') + '</div></div>';
    }).join('');
}

// ── 4. 뉴스 Level 1 (상단 티커) ──
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
// ── 이벤트 오버레이 보정 ──
const EVENT_OVERLAY_BOOST = {
    geopolitical: { boost: ['NRGU','GUSH','GLD','UGL','GDXU','UVXY'], dampen: ['TQQQ','SOXL','SPXL'] },
    tariff:       { boost: ['SQQQ','GLD','UUP','UVXY'],              dampen: ['TQQQ','SOXL','TNA','SPXL'] },
    banking:      { boost: ['GLD','UGL','TMF','SQQQ'],               dampen: ['FAS','SPXL'] },
    tech:         { boost: ['TQQQ','SOXL','SPXL'],                    dampen: [] },
    policy:       { boost: ['TMF','UUP'],                              dampen: [] },
};

function getEventOverlayAdjustments() {
    if (!MACRO_DATA || !MACRO_DATA.events || !MACRO_DATA.events.overlay) return { boost: {}, dampen: {} };
    var boost = {}, dampen = {};
    MACRO_DATA.events.overlay.forEach(function(ev) {
        var map = EVENT_OVERLAY_BOOST[ev.type];
        if (!map) return;
        var weight = ev.severity === 'high' ? 2 : (ev.severity === 'medium' ? 1 : 0.5);
        (map.boost || []).forEach(function(t) { boost[t] = (boost[t] || 0) + weight; });
        (map.dampen || []).forEach(function(t) { dampen[t] = (dampen[t] || 0) + weight; });
    });
    return { boost: boost, dampen: dampen };
}

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
        return '<span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 align-middle animate-pulse"></span>' + escapeHtml(item.title) + ko;
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
        display.onclick = goToNewsTab;
        display.classList.add('news-slide-up');
        index = (index + 1) % NEWS_FEED.length;
        window.newsTickerIndex = index;
    }, 3500); 
    
    display.innerHTML = tickerHtml(NEWS_FEED[0]);
    display.onclick = goToNewsTab;
}

// 헤더 뉴스/목록 → 뉴스 탭으로 이동 (A안: 헤더는 흐르는 속보, 전체는 뉴스 탭)
function goToNewsTab() {
    switchTab('news');
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
}

// ==========================================
// 가격 전광판 (커스텀 마퀴) + 글로벌 지수·환율 모달
// 국내 표기: 상승=빨강, 하락=파랑
// ==========================================
function chgClass(chg) {
    if (chg == null || isNaN(chg)) return 'text-slate-400';
    return chg > 0 ? 'text-red-400' : (chg < 0 ? 'text-blue-400' : 'text-slate-400');
}
function fmtNum(v, dec) {
    if (v == null || isNaN(v)) return '--';
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtChgPct(chg) {
    if (chg == null || isNaN(chg)) return '';
    return (chg > 0 ? '▲' : (chg < 0 ? '▼' : '')) + (chg > 0 ? '+' : '') + chg.toFixed(2) + '%';
}

// 전광판 심볼 (간결하게)
var TICKER_SYMBOLS = [
    { sym: '^IXIC', label: '나스닥',  dec: 0 },
    { sym: '^GSPC', label: 'S&P500', dec: 0 },
    { sym: '^DJI',  label: '다우',    dec: 0 },
    { sym: '^KS11', label: '코스피',  dec: 2 },
    { sym: 'KRW=X', label: '원/달러', dec: 2 },
    { sym: 'JPY=X', label: '엔/달러', dec: 2 },
    { sym: '^VIX',  label: 'VIX',     dec: 2 }
];
var _tickerTimer = null;

function tickerItemHtml(label, price, chg, dec) {
    return '<span class="inline-flex items-baseline gap-1.5 px-4">'
        + '<span class="text-[11px] font-bold text-slate-300">' + label + '</span>'
        + '<span class="text-[11px] font-black text-white">' + fmtNum(price, dec) + '</span>'
        + '<span class="text-[10px] font-bold ' + chgClass(chg) + '">' + fmtChgPct(chg) + '</span>'
        + '</span>';
}

function startPriceTicker() {
    refreshPriceTicker();
    if (_tickerTimer) clearInterval(_tickerTimer);
    _tickerTimer = setInterval(function () { if (!document.hidden) refreshPriceTicker(); }, 60000);
}

async function refreshPriceTicker() {
    var track = document.getElementById('tickerTrack');
    if (!track) return;
    try {
        var syms = TICKER_SYMBOLS.map(function (t) { return t.sym; }).join(',');
        var res = await fetch(API_BASE_URL + '/quotes?symbols=' + encodeURIComponent(syms));
        var data = await res.json();
        var map = {};
        (data || []).forEach(function (q) { map[q.symbol] = q; });
        var sep = '<span class="text-slate-700 px-1">·</span>';
        var half = TICKER_SYMBOLS.map(function (t) {
            var q = map[t.sym] || {};
            return tickerItemHtml(t.label, q.price, q.chg, t.dec);
        }).join(sep) + sep;
        // 끊김 없는 무한 스크롤: 동일 세트 2벌(translateX -50%가 정확히 한 세트)
        track.innerHTML = half + half;
    } catch (e) {
        track.innerHTML = '<span class="text-[11px] text-slate-500 px-4">시세를 불러오지 못했습니다</span>';
    }
}

// 글로벌 지수·환율 모달
var GLOBAL_MARKETS = [
    { group: '🇺🇸 미국', items: [
        { sym: '^GSPC', name: 'S&P 500', dec: 0 },
        { sym: '^IXIC', name: '나스닥 종합', dec: 0 },
        { sym: '^DJI',  name: '다우존스', dec: 0 },
        { sym: '^VIX',  name: 'VIX 변동성', dec: 2 }
    ]},
    { group: '🇨🇳 중국·홍콩', items: [
        { sym: '000001.SS', name: '상하이 종합', dec: 2 },
        { sym: '^HSI', name: '홍콩 항셍', dec: 0 }
    ]},
    { group: '🇯🇵 일본', items: [
        { sym: '^N225', name: '닛케이 225', dec: 0 }
    ]},
    { group: '🇪🇺 유럽', items: [
        { sym: '^GDAXI', name: '독일 DAX', dec: 0 },
        { sym: '^STOXX50E', name: '유로스톡스 50', dec: 0 },
        { sym: '^FTSE', name: '영국 FTSE 100', dec: 0 }
    ]},
    { group: '🇰🇷 한국', items: [
        { sym: '^KS11', name: '코스피', dec: 2 },
        { sym: '^KQ11', name: '코스닥', dec: 2 }
    ]},
    { group: '💱 환율', items: [
        { sym: 'KRW=X', name: '원/달러', dec: 2 },
        { sym: 'JPY=X', name: '엔/달러', dec: 2 },
        { sym: 'CNY=X', name: '위안/달러', dec: 3 },
        { sym: 'EURUSD=X', name: '유로/달러', dec: 4 },
        { sym: 'DX-Y.NYB', name: '달러 인덱스', dec: 2 }
    ]},
    { group: '🛢️ 원자재', items: [
        { sym: 'CL=F', name: 'WTI 원유', dec: 2 },
        { sym: 'GC=F', name: '금', dec: 1 }
    ]}
];
var _globalMarketsCache = null;

function openGlobalMarketsModal(force) {
    var modal = document.getElementById('globalMarketsModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    var body = document.getElementById('globalMarketsBody');
    if (_globalMarketsCache && force !== true) {
        renderGlobalMarkets(_globalMarketsCache);
    } else if (body) {
        body.innerHTML = '<div class="flex items-center justify-center gap-2 text-slate-500 text-sm py-10"><i class="fa-solid fa-spinner fa-spin"></i> 불러오는 중…</div>';
    }
    loadGlobalMarkets();
}
function closeGlobalMarketsModal() {
    var modal = document.getElementById('globalMarketsModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
async function loadGlobalMarkets() {
    var allSyms = [];
    GLOBAL_MARKETS.forEach(function (g) { g.items.forEach(function (it) { allSyms.push(it.sym); }); });
    try {
        var res = await fetch(API_BASE_URL + '/quotes?symbols=' + encodeURIComponent(allSyms.join(',')));
        var data = await res.json();
        var map = {};
        (data || []).forEach(function (q) { map[q.symbol] = q; });
        _globalMarketsCache = map;
        renderGlobalMarkets(map);
    } catch (e) {
        var body = document.getElementById('globalMarketsBody');
        if (body && !_globalMarketsCache) body.innerHTML = '<div class="text-center text-red-400 text-sm py-10">시세를 불러오지 못했습니다</div>';
    }
}
function renderGlobalMarkets(map) {
    var body = document.getElementById('globalMarketsBody');
    if (!body) return;
    body.innerHTML = GLOBAL_MARKETS.map(function (g) {
        var rows = g.items.map(function (it) {
            var q = map[it.sym] || {};
            var chg = q.chg;
            return '<div class="flex items-center justify-between py-2 border-b border-slate-800/70 last:border-0">'
                + '<span class="text-[12px] text-slate-200 font-medium">' + it.name + '</span>'
                + '<span class="flex items-baseline gap-2">'
                +   '<span class="text-[13px] font-black text-white">' + fmtNum(q.price, it.dec) + '</span>'
                +   '<span class="text-[11px] font-bold w-[68px] text-right ' + chgClass(chg) + '">' + (chg == null ? '--' : fmtChgPct(chg)) + '</span>'
                + '</span>'
                + '</div>';
        }).join('');
        return '<div>'
            + '<div class="text-[11px] font-black text-slate-400 mb-1">' + g.group + '</div>'
            + '<div class="bg-slate-800/40 rounded-xl px-3">' + rows + '</div>'
            + '</div>';
    }).join('');
    var te = document.getElementById('globalMarketsTime');
    if (te) { var d = new Date(); te.innerText = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ' 기준'; }
}

// ==========================================
// 섹터 로테이션 (SPDR 11개 섹터 · 1일/1주/1개월 · 강세순)
// ==========================================
var SECTOR_LIST = [
    { sym: 'XLK',  name: '기술',        icon: 'fa-microchip',       color: 'text-blue-400' },
    { sym: 'XLF',  name: '금융',        icon: 'fa-building-columns', color: 'text-emerald-400' },
    { sym: 'XLE',  name: '에너지',      icon: 'fa-oil-well',        color: 'text-amber-400' },
    { sym: 'XLV',  name: '헬스케어',    icon: 'fa-heart-pulse',     color: 'text-rose-400' },
    { sym: 'XLY',  name: '임의소비',    icon: 'fa-cart-shopping',   color: 'text-orange-400' },
    { sym: 'XLP',  name: '필수소비',    icon: 'fa-basket-shopping', color: 'text-lime-400' },
    { sym: 'XLI',  name: '산업재',      icon: 'fa-industry',        color: 'text-slate-300' },
    { sym: 'XLB',  name: '소재',        icon: 'fa-cubes',           color: 'text-yellow-500' },
    { sym: 'XLU',  name: '유틸리티',    icon: 'fa-bolt',            color: 'text-teal-400' },
    { sym: 'XLRE', name: '부동산',      icon: 'fa-building',        color: 'text-indigo-400' },
    { sym: 'XLC',  name: '커뮤니케이션', icon: 'fa-tower-cell',      color: 'text-fuchsia-400' }
];
var _sectorData = null;       // {sym: {price, chg1d, chg1w, chg1m}}
var _sectorPeriod = 'chg1d';

function startSectorRotation() {
    loadSectorRotation();
    if (window._sectorTimer) clearInterval(window._sectorTimer);
    window._sectorTimer = setInterval(function () { if (!document.hidden) loadSectorRotation(); }, 5 * 60 * 1000);
}
async function loadSectorRotation() {
    var box = document.getElementById('sectorRotationList');
    if (!box) return;
    if (!_sectorData) box.innerHTML = '<div class="text-slate-500 text-xs py-3 text-center"><i class="fa-solid fa-spinner fa-spin mr-1"></i>섹터 데이터 불러오는 중…</div>';
    try {
        var syms = SECTOR_LIST.map(function (s) { return s.sym; }).join(',');
        var res = await fetch(API_BASE_URL + '/sectors?symbols=' + encodeURIComponent(syms));
        var data = await res.json();
        var map = {};
        (data || []).forEach(function (q) { map[q.symbol] = q; });
        _sectorData = map;
        renderSectors();
    } catch (e) {
        if (!_sectorData && box) box.innerHTML = '<div class="text-center text-slate-500 text-xs py-3">섹터 데이터를 불러오지 못했습니다</div>';
    }
}
function setSectorPeriod(p) {
    _sectorPeriod = p;
    [['1d', 'chg1d'], ['1w', 'chg1w'], ['1m', 'chg1m']].forEach(function (pair) {
        var btn = document.getElementById('secP_' + pair[0]);
        if (btn) btn.className = 'px-2 py-0.5 rounded-md text-[10px] font-bold ' + (pair[1] === p ? 'bg-cyan-600 text-white' : 'text-slate-400');
    });
    renderSectors();
}
function renderSectors() {
    var box = document.getElementById('sectorRotationList');
    if (!box || !_sectorData) return;
    var key = _sectorPeriod;
    var rows = SECTOR_LIST.map(function (s) {
        var q = _sectorData[s.sym] || {};
        return { s: s, val: (q[key] != null ? q[key] : null) };
    });
    rows.sort(function (a, b) {
        if (a.val == null) return 1;
        if (b.val == null) return -1;
        return b.val - a.val;
    });
    var maxAbs = Math.max.apply(null, rows.map(function (r) { return r.val != null ? Math.abs(r.val) : 0; }).concat([1]));
    box.innerHTML = rows.map(function (r) {
        var v = r.val;
        var w = v != null ? Math.max(4, Math.abs(v) / maxAbs * 100) : 0;
        var barColor = v == null ? 'bg-slate-700' : (v > 0 ? 'bg-red-400' : (v < 0 ? 'bg-blue-400' : 'bg-slate-500'));
        var valTxt = v == null ? '--' : ((v > 0 ? '+' : '') + v.toFixed(2) + '%');
        return '<button type="button" onclick="openSectorChart(\'' + r.s.sym + '\',\'' + r.s.name + '\')" class="w-full flex items-center gap-2 py-1 active:opacity-70 transition">'
            + '<span class="text-[11px] font-bold text-slate-200 w-[72px] text-left shrink-0 truncate" title="' + r.s.name + ' (' + r.s.sym + ')"><i class="fa-solid ' + r.s.icon + ' ' + r.s.color + ' mr-1 text-[10px]"></i>' + r.s.name + '</span>'
            + '<div class="flex-1 h-3 rounded-full bg-slate-800/70 overflow-hidden"><div class="h-full rounded-full ' + barColor + ' transition-all" style="width:' + w + '%"></div></div>'
            + '<span class="text-[11px] font-black w-[54px] text-right shrink-0 ' + chgClass(v) + '">' + valTxt + '</span>'
            + '</button>';
    }).join('');
}
// 섹터 ETF 차트 (기존 매크로 차트 모달 재사용)
function openSectorChart(sym, name) {
    var modal = document.getElementById('macroChartModal');
    var titleEl = document.getElementById('macroChartTitle');
    var cont = document.getElementById('macroChartContainer');
    var detail = document.getElementById('macroChartDetail');
    if (!modal || !cont) return;
    if (titleEl) titleEl.innerText = name + ' 섹터 (' + sym + ')';
    if (detail) detail.innerHTML = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    cont.innerHTML = '';
    setTimeout(function () {
        try {
            _macroChartWidget = new TradingView.widget({
                "autosize": true, "symbol": "AMEX:" + sym, "interval": "D", "timezone": "Etc/UTC", "theme": "dark",
                "style": "1", "locale": "kr", "toolbar_bg": "#1e293b", "enable_publishing": false,
                "hide_top_toolbar": false, "hide_side_toolbar": true, "allow_symbol_change": false,
                "container_id": "macroChartContainer", "studies": ["MASimple@tv-basicstudies"]
            });
        } catch (e) {
            if (cont) cont.innerHTML = '<div class="p-6 text-center text-slate-500 text-xs">차트를 불러올 수 없습니다.</div>';
        }
    }, 50);
}

// ==========================================
// 전략 탭 기능
// ==========================================
function selectTicker(sym) { 
    activeTicker = sym; 
    localStorage.setItem('umt_last_ticker', sym); 
    
    if(!portfolios[sym]) {
        let restoredHistory = [];
        try { const archived = JSON.parse(localStorage.getItem('umt_archived_history') || '{}'); if (Array.isArray(archived[sym])) { restoredHistory = archived[sym]; delete archived[sym]; localStorage.setItem('umt_archived_history', JSON.stringify(archived)); } } catch(e) {}
        portfolios[sym] = { qty: 0, avgPrice: 0, history: restoredHistory, config: { mode: 'GRID', stages: 4, mdd: 20, alloc: 30, drops: [0,-6.67,-13.33,-20], weights: [25,25,25,25], basePrice: 0, boosterOn: false, boosterAllocPct: 0, boosterStages: 2, boosterMdd: 10 } };
        if (restoredHistory.length > 0) recalcPortfolio(portfolios[sym]);
        sanitizeData(); // 새로 생성된 객체도 소독
    }

    renderTickerBar(); 
    loadTickerData(sym);
}

function switchTab(id) {
    ['home','news','strategy','tradelog','settings'].forEach(t => {
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
    // 전략 탭 체결 스티키 바는 전략 탭에서만
    var _sab = document.getElementById('strategyActionBar');
    if (_sab) _sab.classList.toggle('hidden', id !== 'strategy');
    if(id==='strategy') {
        if (!activeTicker) {
            const lastTicker = localStorage.getItem('umt_last_ticker');
            if (lastTicker && portfolios[lastTicker]) activeTicker = lastTicker;
            else { const keys = Object.keys(portfolios); if (keys.length > 0) activeTicker = keys[0]; }
        }
        try { renderPositionOverview(); } catch(e) {}
        try { switchStratView(_stratView || 'status'); } catch(e) {}
        if (activeTicker) setTimeout(() => loadTickerData(activeTicker), 10);
    }
    stopNewsAutoRefresh();
    if(id==='news') { setTimeout(() => { renderMarketFlow(); ensureStockNewsLoaded(); ensureUsNewsLoaded(); ensureKrNewsLoaded(); ensureCalendarLoaded(); }, 10); startNewsAutoRefresh(); }
    if(id==='tradelog') setTimeout(() => renderTradeLog(), 10);
    if(id==='settings') { initInputs(); fetchLiveFxRate(); }
    if(id==='home') { updateGlobalCalc(); fetchMacroIndicatorsLive(); const h = document.getElementById('heatmapContent'); if (h && !h.classList.contains('hidden')) renderMarketHeatmap(); }
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

var _stratExecChart = null;
// 투자진행요약 집행 도넛 (투자완료 vs 남은 할당, 중앙=집행률)
function renderExecChart(invested, remain, execRate, alloc) {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.innerText = v; };
    set('stratExecCenterPct', Math.round(execRate || 0) + '%');
    set('stratExecInvested', '$' + Math.round(invested || 0).toLocaleString());
    set('stratExecRemain', '$' + Math.round(remain || 0).toLocaleString());
    set('stratExecAlloc', '$' + Math.round(alloc || 0).toLocaleString());
    var canvas = document.getElementById('stratExecChart');
    if (!canvas || typeof Chart === 'undefined') return;
    var inv = Math.max(0, invested || 0), rem = Math.max(0, remain || 0);
    if (inv + rem <= 0) { inv = 0; rem = 1; }
    try {
        if (_stratExecChart && typeof _stratExecChart.destroy === 'function') _stratExecChart.destroy();
        _stratExecChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['투자완료', '남은할당'], datasets: [{ data: [inv, rem], backgroundColor: ['#3b82f6', '#1e293b'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
    } catch (e) {}
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
        const t = (total && total > 0) ? total : '?';
        if (inProgress && inProgress > 0) return '총 ' + t + '단계 중 ' + inProgress + '단계 진입 (진행중)';
        if (completed && completed > 0) {
            const cap = (total && total > 0) ? Math.min(completed, total) : completed;
            return '총 ' + t + '단계 중 ' + cap + '단계 완료';
        }
        return '총 ' + t + '단계 중 1단계 대기';
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
    renderExecChart(investedUsd, remainUsd, execRate, allocUsd);

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

    // 부스터 권장 알림: 모든 기본 단계 완료 + 현재가가 마지막 단계 아래
    var boosterHint = document.getElementById('boosterHintBanner');
    if (!boosterHint) {
        boosterHint = document.createElement('div');
        boosterHint.id = 'boosterHintBanner';
        boosterHint.className = 'hidden mt-2 p-2.5 rounded-lg bg-amber-900/30 border border-amber-700/50 text-[11px] text-amber-300';
        card.appendChild(boosterHint);
    }
    var baseTotal = stage.baseTotal || 0;
    var baseCompleted = stage.baseCompleted || 0;
    var lastDrop = (d.config && d.config.drops && d.config.drops.length > 0) ? d.config.drops[d.config.drops.length - 1] : 0;
    var lastStagePrice = (d.config && d.config.basePrice > 0) ? d.config.basePrice * (1 + lastDrop / 100) : 0;
    var allBasesDone = baseTotal > 0 && baseCompleted >= baseTotal && (d.qty || 0) > 0;
    var priceBelowLast = currentPrice > 0 && lastStagePrice > 0 && currentPrice < lastStagePrice;

    if (allBasesDone && priceBelowLast && !(d.config && d.config.boosterOn)) {
        boosterHint.classList.remove('hidden');
        boosterHint.innerHTML = '<i class="fa-solid fa-rocket mr-1"></i><strong>부스터 활성화 권장</strong> — 모든 ' + baseTotal + '단계 매수 완료, 현재가($' + currentPrice.toFixed(2) + ')가 마지막 계획가($' + lastStagePrice.toFixed(2) + ') 아래입니다. 추가 투입이 필요하면 아래 부스터 설정을 활성화하세요.';
    } else {
        boosterHint.classList.add('hidden');
    }
}

function loadTickerData(sym) { 
    if (!portfolios[sym]) return; 
    const d = portfolios[sym];
    const meta = ETF_DB.find(e => e.sym === sym) || {name:sym, desc:'일반 종목', lev:'?'};
    // 시세 스냅샷이 아직 없으면 즉시 받아온다 (주로 추가 직후의 일반 종목)
    if (!MARKET_SNAPSHOT[sym]) {
        fetchMarketData(sym).then(data => { MARKET_SNAPSHOT[sym] = data; if (activeTicker === sym) { updateStrategyDataUI(sym); renderSellPlan(); if (typeof renderStrategyProgressCard === 'function') renderStrategyProgressCard(sym); } });
    }

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
        if (pe) pe.value = p.targetPct != null ? p.targetPct : (i === 1 ? 5 : (i === 2 ? 10 : 15));
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
        // 부스터는 자동 활성화하지 않음 (모든 단계 소진 후 수동 판단)
        boosterOn = false;
        var defReason = [];
        if (!isQuadTailwind && quadNow) defReason.push('Quad '+quadNow+' 역풍');
        if (vix > 28) defReason.push('VIX '+vix.toFixed(1));
        if (!trendUp) defReason.push('MA200 하향');
        reasons.push('🛡️ 방어형 — ' + defReason.join(' + '));
        reasons.push('- 초반 가볍게, 하단에서 무겁게. 깊은 조정에 대비합니다.');
        reasons.push('💡 부스터는 모든 단계 매수 후 추가 하락 시 수동으로 활성화하세요.');
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

    const msg = `[🤖 Quad 기반 스마트 최적화]\n\n${reasons.join('\n')}\n\n👉 비중 모드: ${modeLabels[weightMode]}\n👉 추천 목표 MDD: -${mddRecommend.toFixed(0)}%\n👉 분할 단계: ${stages}단계 (비중: ${weights.join('-')})\n👉 매수 간격(참고): 약 -${gapApprox.toFixed(1)}%\n\n이 전략으로 적용하시겠습니까?`;

    if (!confirm(msg)) return;

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

// ===== 사이클 리셋 (추가매수): 보유분 유지 + 새 basePrice로 단계 재배치 =====
function openCycleResetModal() {
    if (!activeTicker || !portfolios[activeTicker]) return;
    const d = portfolios[activeTicker];
    if ((d.qty || 0) <= 0) {
        showToast('보유 수량이 없습니다 — 일반 매수로 시작하세요');
        return;
    }
    document.getElementById('crmTicker').innerText = activeTicker;
    document.getElementById('crmHoldQty').innerText = d.qty + '주';
    document.getElementById('crmHoldAvg').innerText = '$' + (d.avgPrice || 0).toFixed(2);

    const md = MARKET_SNAPSHOT[activeTicker] || {};
    const defaultBase = md.price > 0 ? md.price : (d.avgPrice || 0);
    document.getElementById('crmBasePrice').value = defaultBase.toFixed(2);
    document.getElementById('crmStages').value = String(d.config.stages || 4);
    document.getElementById('crmMdd').value = String(d.config.mdd || 20);

    updateCycleResetPreview();

    const modal = document.getElementById('cycleResetModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCycleResetModal() {
    const modal = document.getElementById('cycleResetModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function updateCycleResetPreview() {
    if (!activeTicker || !portfolios[activeTicker]) return;
    const d = portfolios[activeTicker];
    const totalUSD = getTotalEquityUSD();
    const allocPct = d.config.alloc || 30;
    const allocTotal = totalUSD * (allocPct / 100);
    const holdValue = (d.qty || 0) * (d.avgPrice || 0);
    const available = Math.max(0, allocTotal - holdValue);

    document.getElementById('crmHoldValue').innerText = '$' + holdValue.toFixed(2);
    document.getElementById('crmAllocTotal').innerText = '$' + allocTotal.toFixed(2);
    document.getElementById('crmAvailable').innerText = '$' + available.toFixed(2);

    const basePrice = parseFloat(document.getElementById('crmBasePrice').value) || 0;
    const stages = parseInt(document.getElementById('crmStages').value) || 4;
    const mdd = parseFloat(document.getElementById('crmMdd').value) || 20;
    const gap = stages > 1 ? mdd / (stages - 1) : 0;
    const drops = [];
    for (let i = 0; i < stages; i++) drops.push(parseFloat(-(gap * i).toFixed(2)));
    const perStage = available / stages; // 균등 가중

    const preview = document.getElementById('crmPreview');
    if (basePrice <= 0 || available <= 0) {
        preview.innerHTML = '<div class="p-3 text-center text-slate-500">' + (basePrice <= 0 ? '새 basePrice를 입력하세요' : '가용자금이 0입니다 (보유분이 할당금 이상)') + '</div>';
        return;
    }
    let html = '';
    for (let i = 0; i < stages; i++) {
        const drop = drops[i];
        const price = basePrice * (1 + drop / 100);
        const qty = price > 0 ? Math.floor(perStage / price) : 0;
        const amt = price * qty;
        const tag = i === 0 ? ' <span class="text-purple-400 text-[9px]">← 매수 시 보유분과 평단 합산</span>' : '';
        html += '<div class="flex justify-between items-center px-3 py-1.5">'
            + '<span class="text-slate-400 font-bold">' + (i+1) + '차 <span class="text-slate-600">(' + drop.toFixed(2) + '%)</span></span>'
            + '<span class="text-white">$' + price.toFixed(2) + ' × ' + qty + '주 <span class="text-slate-500">= $' + amt.toFixed(0) + '</span>' + tag + '</span>'
            + '</div>';
    }
    preview.innerHTML = html;
}

function applyCycleReset() {
    if (!activeTicker || !portfolios[activeTicker]) return;
    const d = portfolios[activeTicker];
    if ((d.qty || 0) <= 0) { showToast('보유 수량이 없습니다'); return; }

    const basePrice = parseFloat(document.getElementById('crmBasePrice').value) || 0;
    const stages = parseInt(document.getElementById('crmStages').value) || 4;
    const mdd = parseFloat(document.getElementById('crmMdd').value) || 20;
    if (basePrice <= 0) { showToast('새 basePrice를 입력하세요'); return; }

    const totalUSD = getTotalEquityUSD();
    const allocPct = d.config.alloc || 30;
    const allocTotal = totalUSD * (allocPct / 100);
    const holdValue = (d.qty || 0) * (d.avgPrice || 0);
    const available = Math.max(0, allocTotal - holdValue);

    const gap = stages > 1 ? mdd / (stages - 1) : 0;
    const drops = [];
    for (let i = 0; i < stages; i++) drops.push(parseFloat(-(gap * i).toFixed(2)));
    const weights = Array(stages).fill(Math.floor(100 / stages));
    for (let i = 0; i < (100 % stages); i++) weights[i]++;

    d.config.basePrice = basePrice;
    d.config.stages = stages;
    d.config.mdd = mdd;
    d.config.drops = drops;
    d.config.weights = weights;
    d.config.cycleAvailableUSD = available;

    if (typeof d.cycleSeq !== 'number') d.cycleSeq = 0;
    d.cycleSeq = (d.cycleSeq || 0) + 1;
    d.currentCycleId = d.cycleSeq;

    saveAll();
    closeCycleResetModal();
    loadTickerData(activeTicker);
    showToast('사이클 리셋 완료 — 가용자금 $' + available.toFixed(2));
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
    // 사이클 리셋 후에는 cycleAvailableUSD 사용 (보유분 제외한 가용자금)
    const investMoney = (d.config.cycleAvailableUSD != null && d.config.cycleAvailableUSD > 0)
        ? d.config.cycleAvailableUSD
        : totalEquityUSD * (allocPct/100);
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
            if ((d.qty || 0) <= 0) return false; // 전량매도 완료 시 이전 사이클 표시 안 함
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
                if ((d.qty || 0) <= 0) return false; // 전량매도 완료 시 이전 사이클 표시 안 함
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
function confirmAllocation() { const pct = parseFloat(document.getElementById('allocPercent').value)||0; if(pct <= 0) return alert("비중을 입력해주세요."); const sym = tempTickerToAdd || activeTicker; if(sym) { if (!portfolios[sym] && !checkCorrelationOnAdd(sym)) return; if (!portfolios[sym]) { let restoredHistory = []; try { const archived = JSON.parse(localStorage.getItem('umt_archived_history') || '{}'); if (Array.isArray(archived[sym])) { restoredHistory = archived[sym]; delete archived[sym]; localStorage.setItem('umt_archived_history', JSON.stringify(archived)); } } catch(e) {} portfolios[sym] = { qty: 0, avgPrice: 0, history: restoredHistory, config: { mode: 'GRID', stages: 4, mdd: 20, alloc: pct, drops: [0,-6.67,-13.33,-20], weights: [25,25,25,25], basePrice: 0, boosterOn: false, boosterAllocPct: 0, boosterStages: 2, boosterMdd: 10 } }; if (restoredHistory.length > 0) recalcPortfolio(portfolios[sym]); } else { portfolios[sym].config.alloc = pct; } saveAll(); if(activeTicker===sym) loadTickerData(sym); } document.getElementById('allocationModal').classList.add('hidden'); document.getElementById('allocationModal').classList.remove('flex'); renderTickerBar(); switchTab('strategy'); selectTicker(sym); }
function openEtfSearchModal() { document.getElementById('etfSearchModal').classList.remove('hidden'); document.getElementById('etfSearchModal').classList.add('flex'); const inp=document.getElementById('etfSearchInput'); if(inp) inp.value=''; etfSearchSeq++; const old=document.getElementById('remoteSearchSection'); if(old) old.remove(); renderEtfSearchList(ETF_DB); }
function closeEtfSearchModal() { document.getElementById('etfSearchModal').classList.add('hidden'); document.getElementById('etfSearchModal').classList.remove('flex'); }
// 일반 종목/미등록 ETF 심볼 허용 형식 (예: AAPL, NVDA, BRK-B, BRK.B)
function isValidTickerSymbol(sym) { return /^[A-Z0-9][A-Z0-9.\-^]{0,9}$/.test(sym); }
function renderEtfSearchList(l) { const g=document.getElementById('etfSearchGrid'); g.innerHTML=''; l.forEach(e=>{ let b=e.lev==='3x'?'badge-3x':(e.lev==='2x'?'badge-2x':'badge-inv'); g.innerHTML+=`<div class="bg-slate-800 p-3 rounded-xl flex justify-between items-center active:bg-slate-700 transition"><div><span class="font-bold text-white">${e.sym}</span> <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${b}">${e.lev}</span><div class="text-xs text-slate-400">${e.desc}</div></div><button onclick="processAddTicker('${e.sym}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow transition">추가</button></div>`; }); }
function processAddTicker(sym) { tempTickerToAdd = sym; closeEtfSearchModal(); openAllocationModal(sym); }
function processAddCustomTicker(sym) { sym=(sym||'').trim().toUpperCase(); if(!isValidTickerSymbol(sym)) { alert('올바른 심볼을 입력해주세요. (예: AAPL, NVDA)'); return; } if(portfolios[sym]) { alert('이미 추가된 종목입니다.'); return; } tempTickerToAdd = sym; closeEtfSearchModal();
    // 일반 종목은 시세 스냅샷이 없으므로 즉시 받아온다
    fetchMarketData(sym).then(data => { MARKET_SNAPSHOT[sym] = data; if (data.error || data.price === 0) { showToast('⚠️ ' + sym + ' 시세를 불러오지 못했습니다. 심볼을 확인해주세요.'); } if (activeTicker === sym) updateStrategyDataUI(sym); });
    openAllocationModal(sym); }

// --- 종목 검색(자동완성) ---
let etfSearchSeq = 0;       // 원격 검색 응답 경쟁상태 방지용 시퀀스
let etfSearchTimer = null;  // 디바운스 타이머
function filterEtfSearch() {
    const raw = document.getElementById('etfSearchInput').value;
    const q = raw.toUpperCase();
    // 1) 등록 ETF 부분 검색 (즉시)
    renderEtfSearchList(ETF_DB.filter(e=>e.sym.includes(q)||e.desc.includes(q)||(e.name||'').toUpperCase().includes(q)));
    // 2) 일반 종목 자동완성 (야후 검색, 디바운스 250ms)
    clearTimeout(etfSearchTimer);
    const term = raw.trim();
    if (term.length < 1) { etfSearchSeq++; return; } // 입력 비면 진행 중 응답 무효화
    etfSearchTimer = setTimeout(() => fetchTickerSuggestions(term), 250);
}
async function fetchTickerSuggestions(term) {
    const seq = ++etfSearchSeq;
    let list = [];
    try { const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(term)}`); if (res.ok) { const d = await res.json(); if (Array.isArray(d)) list = d; } } catch(e) {}
    if (seq !== etfSearchSeq) return; // 더 최신 입력이 들어왔으면 폐기
    renderTickerSuggestions(list, term.toUpperCase());
}
function renderTickerSuggestions(list, q) {
    const g = document.getElementById('etfSearchGrid'); if (!g) return;
    const old = document.getElementById('remoteSearchSection'); if (old) old.remove();
    // 등록 ETF/이미 추가된 종목은 제외 (중복 방지)
    const filtered = (list||[]).filter(x => x.symbol && !ETF_DB.some(e=>e.sym===x.symbol) && !portfolios[x.symbol]).slice(0, 10);
    const wrap = document.createElement('div');
    wrap.id = 'remoteSearchSection';
    wrap.className = 'space-y-2';
    if (filtered.length) {
        wrap.innerHTML = '<div class="text-[10px] text-slate-500 font-bold px-1 pt-1">🔎 일반 종목 검색 결과</div>' + filtered.map(x => {
            const t = x.type==='ETF' ? 'ETF' : '주식';
            const info = [(x.name||'').slice(0,32), x.exchange].filter(Boolean).join(' · ');
            return `<div class="bg-slate-800 p-3 rounded-xl flex justify-between items-center active:bg-slate-700 transition"><div class="min-w-0 pr-2"><span class="font-bold text-white">${x.symbol}</span> <span class="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-600 text-slate-200">${t}</span><div class="text-xs text-slate-400 truncate">${info}</div></div><button onclick="processAddCustomTicker('${x.symbol}')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow transition shrink-0">추가</button></div>`;
        }).join('');
    } else if (q && isValidTickerSymbol(q) && !ETF_DB.some(e=>e.sym===q) && !portfolios[q]) {
        // 검색 결과가 없지만 유효한 심볼이면 직접 추가 폴백 제공
        wrap.innerHTML = `<div class="bg-slate-800 p-3 rounded-xl flex justify-between items-center border border-purple-500/40 active:bg-slate-700 transition"><div><span class="font-bold text-white">${q}</span> <span class="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-600 text-white">직접</span><div class="text-xs text-slate-400">검색 결과 없음 — 심볼로 직접 추가</div></div><button onclick="processAddCustomTicker('${q}')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow transition">추가</button></div>`;
    } else { return; }
    g.appendChild(wrap);
}
function renderTickerBar() { const bar = document.getElementById('tickerBar'); bar.innerHTML = ''; Object.keys(portfolios).forEach(t => { const btn = document.createElement('button'); const active = t === activeTicker; btn.className = `ticker-tab px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${active?'active':''}`; btn.innerText = t; btn.onclick = () => selectTicker(t); bar.appendChild(btn); }); const addBtn = document.createElement('button'); addBtn.className = "px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 text-xs font-bold border border-slate-700 whitespace-nowrap"; addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>'; addBtn.onclick = openEtfSearchModal; bar.appendChild(addBtn); try{renderPositionOverview();}catch(e){} }

// 매수 단계 진행 (DOM 비의존 — 저장된 config/history 기반, 모든 종목 정확)
function buyStageProgress(p) {
    var total = (p && p.config && p.config.stages) ? parseInt(p.config.stages, 10) : 0;
    if (!total) return { done: 0, total: 0 };
    if ((p.qty || 0) <= 0) return { done: 0, total: total }; // 미보유 = 0단계 (과거 매도완료 사이클 제외)
    var cycleId = (p.currentCycleId != null) ? p.currentCycleId : 0;
    var seen = {};
    (p.history || []).forEach(function (h) {
        if (!h || h.type !== 'BUY') return;
        if (cycleId > 0 && h.cycleId != null && h.cycleId !== cycleId) return;
        var s = parseInt(h.stage, 10);
        if (!isNaN(s) && s > 0 && s <= total) seen[s] = true;
    });
    var done = Object.keys(seen).length;
    if (done === 0 && (p.qty || 0) > 0) done = 1; // 단계 미기록이나 보유 중이면 최소 1
    return { done: Math.min(done, total), total: total };
}

// ── 포지션 개요 (마스터 리스트) ──
function renderPositionOverview() {
    var box = document.getElementById('positionOverview');
    if (!box) return;
    var syms = Object.keys(portfolios || {});
    if (!syms.length) {
        box.innerHTML = '<div class="glass-panel rounded-xl p-4 text-center text-slate-500 text-xs">종목을 추가해 전략을 시작하세요. <button type="button" onclick="openEtfSearchModal()" class="ml-1 text-blue-400 underline">종목 추가</button></div>';
        return;
    }
    var quadNow = getCurrentQuad();
    box.innerHTML = syms.map(function (sym) {
        var p = portfolios[sym];
        var md = MARKET_SNAPSHOT[sym] || {};
        var meta = ETF_DB.find(function (e) { return e.sym === sym; }) || {};
        var price = md.price || p.avgPrice || 0;
        var chg = (md.change != null && !isNaN(md.change)) ? md.change : null;
        var hasQty = (p.qty || 0) > 0;
        var pnlPct = (hasQty && p.avgPrice > 0) ? ((price - p.avgPrice) / p.avgPrice * 100) : null;
        var prog = buyStageProgress(p);
        var stTotal = prog.total;
        var stDone = prog.done;
        var status = hasQty ? getHoldingStatus(sym, meta, md, quadNow) : { status: '', reason: '' };
        var dotMap = { HOLD: 'bg-green-400', WATCH: 'bg-yellow-400', EXIT: 'bg-red-400' };
        var dot = dotMap[status.status] || '';
        var active = (sym === activeTicker);
        var chgTxt = chg != null ? ((chg > 0 ? '+' : '') + chg.toFixed(1) + '%') : '';
        var pnlTxt = pnlPct != null ? ((pnlPct > 0 ? '+' : '') + pnlPct.toFixed(1) + '%') : '미보유';
        var stageMini = '';
        if (stTotal > 0) {
            var pctFill = Math.round((stDone / stTotal) * 100);
            stageMini = '<div class="flex items-center gap-1.5">'
                + '<span class="text-[10px] text-slate-400 font-bold whitespace-nowrap">진행단계 ' + stDone + '/' + stTotal + '</span>'
                + '<div class="w-10 h-1.5 rounded-full bg-slate-700 overflow-hidden"><div class="h-full rounded-full bg-emerald-400" style="width:' + pctFill + '%"></div></div>'
                + '</div>';
        }
        var pnlPill = (pnlPct == null)
            ? '<span class="text-[10px] text-slate-500 font-bold">미보유</span>'
            : '<span class="text-sm font-black ' + chgClass(pnlPct) + '">' + (pnlPct > 0 ? '+' : '') + pnlPct.toFixed(1) + '%</span>';
        return '<div class="glass-panel rounded-xl border ' + (active ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700/60') + ' transition flex items-stretch overflow-hidden">'
            + '<button type="button" onclick="selectPosition(\'' + sym + '\')" class="flex-1 min-w-0 text-left p-3 active:opacity-80">'
            +   '<div class="flex items-center justify-between gap-2">'
            +     '<div class="flex items-center gap-1.5 min-w-0">'
            +       (dot ? '<span class="w-2 h-2 rounded-full ' + dot + ' shrink-0"></span>' : '')
            +       '<span class="font-black text-white text-base">' + sym + '</span>'
            +       (active ? '<span class="text-[8px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-bold shrink-0">선택</span>' : '')
            +     '</div>'
            +     '<div class="text-sm font-black text-white shrink-0 whitespace-nowrap">' + (price > 0 ? ('$' + price.toFixed(2)) : '--') + ' <span class="text-[11px] font-bold ' + chgClass(chg) + '">' + chgTxt + '</span></div>'
            +   '</div>'
            +   '<div class="flex items-center justify-between gap-2 mt-2">'
            +     '<span class="text-[10px] text-slate-500 truncate">' + escapeHtml(meta.name || meta.desc || '') + '</span>'
            +     '<div class="flex items-center gap-3 shrink-0">' + stageMini + pnlPill + '</div>'
            +   '</div>'
            + '</button>'
            + '<button type="button" onclick="deletePosition(\'' + sym + '\', event)" class="shrink-0 w-10 flex items-center justify-center text-slate-600 hover:text-red-400 active:text-red-400 border-l border-slate-700/40" title="' + sym + ' 삭제"><i class="fa-solid fa-trash-can text-xs"></i></button>'
            + '</div>';
    }).join('')
    + '<button type="button" onclick="openEtfSearchModal()" class="w-full rounded-xl p-3 border border-dashed border-slate-600 text-slate-400 text-xs font-bold hover:bg-slate-800/50 active:opacity-80 transition"><i class="fa-solid fa-plus mr-1.5"></i>종목 추가</button>';
}

// 포지션 카드에서 직접 삭제 (특정 종목)
function deletePosition(sym, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (!portfolios[sym]) return;
    if (!confirm("'" + sym + "' 종목을 삭제하시겠습니까?\n전략 설정은 삭제되지만 매매 기록은 보존됩니다.")) return;
    var d = portfolios[sym];
    if (d && Array.isArray(d.history) && d.history.length > 0) {
        try {
            var arch = JSON.parse(localStorage.getItem('umt_archived_history') || '{}');
            arch[sym] = (arch[sym] || []).concat(d.history);
            localStorage.setItem('umt_archived_history', JSON.stringify(arch));
        } catch (e) { console.error('History archive failed:', e); }
    }
    delete portfolios[sym];
    saveAll();
    if (activeTicker === sym) {
        activeTicker = null;
        localStorage.removeItem('umt_last_ticker');
        var keys = Object.keys(portfolios);
        if (keys.length > 0) { selectTicker(keys[0]); }
        else { renderTickerBar(); renderPositionOverview(); }
    } else {
        renderTickerBar();
        renderPositionOverview();
    }
}

function selectPosition(sym) {
    selectTicker(sym);
    switchStratView('status');
    var anchor = document.getElementById('stratSubTabsWrap');
    try { if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

// ── 전략 상세 서브탭 (현황/전략설정/일지) ──
var _stratView = 'status';
function switchStratView(view) {
    _stratView = view;
    ['status', 'config', 'journal'].forEach(function (v) {
        var el = document.getElementById('stratView-' + v);
        if (el) el.classList.toggle('hidden', v !== view);
        var btn = document.getElementById('stView_' + v);
        if (btn) btn.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition ' + (v === view ? 'bg-slate-700 text-white' : 'text-slate-400');
    });
    // 현황으로 올 때 도넛/차트가 보이는 상태에서 재계산되도록 갱신
    if (view === 'status' && activeTicker) {
        try { renderStrategyProgressCard(activeTicker); } catch (e) {}
    }
}
function deleteActiveTicker() { if(!activeTicker) return; if(confirm(`'${activeTicker}' 종목을 삭제하시겠습니까?\n전략 설정은 삭제되지만 매매 기록은 보존됩니다.`)) { const d = portfolios[activeTicker]; if (d && Array.isArray(d.history) && d.history.length > 0) { try { const archived = JSON.parse(localStorage.getItem('umt_archived_history') || '{}'); archived[activeTicker] = (archived[activeTicker] || []).concat(d.history); localStorage.setItem('umt_archived_history', JSON.stringify(archived)); } catch(e) { console.error('History archive failed:', e); } } delete portfolios[activeTicker]; saveAll(); activeTicker = null; localStorage.removeItem('umt_last_ticker'); const keys = Object.keys(portfolios); if (keys.length > 0) { selectTicker(keys[0]); } else { switchTab('home'); renderTickerBar(); } } }
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
    // 메모, 태그 초기화
    var memoEl = document.getElementById('tradeMemo');
    if (memoEl) memoEl.value = '';
    var tagEl = document.getElementById('tradeTag');
    if (tagEl) tagEl.value = 'QUANT';
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
        const p = plans[idx] || { targetPct: 5, sellRatio: 50 };
        const targetPct = parseFloat(p.targetPct) || 5;
        const sellRatio = parseFloat(p.sellRatio) || 50;
        const avg = d.avgPrice || 0;
        const holding = d.qty || 0;
        const price = calcSellTargetPrice(avg, targetPct);
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
            const investable = (d.config.cycleAvailableUSD != null && d.config.cycleAvailableUSD > 0)
                ? d.config.cycleAvailableUSD
                : totalUSD * ((d.config.alloc || 30) / 100);
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

    recalcPortfolio(d);
    // 전량 매도 등으로 보유수량 0이 되면 사이클 종료 처리
    if ((d.qty || 0) <= 0) {
        d.currentCycleId = null;
        d.config.cycleAvailableUSD = null;
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
        return list;
    }
    Object.keys(portfolios).forEach(sym => {
        const p = portfolios[sym];
        if (!Array.isArray(p.history)) {
            return;
        }
        p.history.forEach(h => {
            list.push({ ...h, sym });
        });
    });
    // 삭제된 종목의 보관된 매매 기록도 포함
    try {
        const archived = JSON.parse(localStorage.getItem('umt_archived_history') || '{}');
        Object.keys(archived).forEach(sym => {
            if (!portfolios[sym] && Array.isArray(archived[sym])) {
                archived[sym].forEach(h => { list.push({ ...h, sym }); });
            }
        });
    } catch(e) {}
    // 날짜 내림차순, 같은 날짜는 실행(기록) 시각(id) 내림차순 → 가장 최근 실행이 최상단
    list.sort((a, b) => {
        var dd = new Date(b.date) - new Date(a.date);
        if (dd !== 0) return dd;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
    const byTicker = {};
    list.forEach(t => {
        byTicker[t.sym] = (byTicker[t.sym] || 0) + 1;
    });
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
    var countEl = document.getElementById('tradelogCount');
    if (!tickerSelect) return;

    var all = getAggregatedTrades();
    all = enrichTradesWithReturn(all);
    var stats = calculateTradeStats(all);

    var statsBody = document.getElementById('tradelogReviewStatsBody');
    if (statsBody) {
        statsBody.className = 'space-y-3';
        if (!stats.totalTrades) {
            statsBody.innerHTML = '<div class="text-center text-slate-500 text-xs py-3">매도 기록이 쌓이면 통계가 표시됩니다.</div>';
        } else {
            var retCol = function(v) { return v >= 0 ? 'text-red-400' : 'text-blue-400'; };
            var sbox = function(label, val, cls) { return '<div class="bg-slate-800/50 rounded-lg px-2.5 py-1.5"><div class="text-slate-500 text-[9px]">' + label + '</div><div class="font-bold text-sm ' + (cls || 'text-white') + '">' + val + '</div></div>'; };
            var wr = stats.winRate;
            // 승률 도넛 (한국식: 빨강=승)
            var donut = '<div class="shrink-0 w-[78px] h-[78px] rounded-full flex items-center justify-center" style="background:conic-gradient(#ef4444 0% ' + wr + '%, #1e293b ' + wr + '% 100%)">'
                + '<div class="w-[58px] h-[58px] rounded-full bg-slate-900 flex flex-col items-center justify-center">'
                + '<div class="text-base font-black text-white leading-none">' + wr.toFixed(0) + '%</div>'
                + '<div class="text-[8px] text-slate-500 mt-0.5">승률</div></div></div>';
            var miniStats = '<div class="flex-1 grid grid-cols-2 gap-2">'
                + sbox('총 매매', stats.totalTrades + '회')
                + sbox('승 / 패', '<span class="text-red-400">' + stats.winCount + '</span> / <span class="text-blue-400">' + stats.loseCount + '</span>')
                + sbox('평균 수익률', (stats.avgReturn >= 0 ? '+' : '') + stats.avgReturn.toFixed(2) + '%', retCol(stats.avgReturn))
                + sbox('최대 / 최소', '<span class="text-red-400">' + stats.maxReturn.toFixed(1) + '%</span> / <span class="text-blue-400">' + stats.minReturn.toFixed(1) + '%</span>', '')
                + '</div>';
            // 수익률 범위 바 (최소 ~ 최대, 평균 위치 표시)
            var lo = Math.min(0, stats.minReturn), hi = Math.max(0, stats.maxReturn), span = (hi - lo) || 1;
            var posPct = function(v) { return Math.max(0, Math.min(100, ((v - lo) / span) * 100)); };
            var rangeBar = '<div><div class="flex justify-between text-[9px] text-slate-500 mb-1"><span>최소 ' + stats.minReturn.toFixed(1) + '%</span><span>평균 ' + (stats.avgReturn >= 0 ? '+' : '') + stats.avgReturn.toFixed(2) + '%</span><span>최대 ' + stats.maxReturn.toFixed(1) + '%</span></div>'
                + '<div class="relative h-2.5 rounded-full" style="background:linear-gradient(to right,#1d4ed866,#47556966,#dc262666)">'
                + '<div class="absolute top-0 w-px h-2.5 bg-slate-400/70" style="left:' + posPct(0) + '%"></div>'
                + '<div class="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-900" style="left:calc(' + posPct(stats.avgReturn) + '% - 5px)"></div>'
                + '</div></div>';
            // 최근 매매 수익률 추이 (SVG 막대)
            var sells = (all || []).filter(function(t) { return t.type === 'SELL' && t.returnPct != null && !isNaN(t.returnPct); })
                .slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
            var data = sells.map(function(t) { return t.returnPct; }).slice(-24);
            var spark = '';
            if (data.length) {
                var W = 320, H = 56, mid = H / 2, n = data.length, bw = W / n;
                var maxAbs = Math.max.apply(null, data.map(function(v) { return Math.abs(v); })); if (!maxAbs || maxAbs < 0.01) maxAbs = 1;
                var bars = data.map(function(v, i) {
                    var bh = (Math.abs(v) / maxAbs) * (mid - 2);
                    var x = i * bw + 0.75;
                    var y = v >= 0 ? mid - bh : mid;
                    return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 1.5).toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + (v >= 0 ? '#ef4444' : '#3b82f6') + '" rx="1"/>';
                }).join('');
                spark = '<div><div class="text-[10px] text-slate-500 mb-1">최근 매매 수익률 추이 (최근 ' + data.length + '건)</div>'
                    + '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" preserveAspectRatio="none"><line x1="0" y1="' + mid + '" x2="' + W + '" y2="' + mid + '" stroke="#475569" stroke-width="0.5"/>' + bars + '</svg></div>';
            }
            statsBody.innerHTML = '<div class="flex items-center gap-3">' + donut + miniStats + '</div>' + rangeBar + spark;
        }
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
                var avgCol = s.avgReturn >= 0 ? 'text-red-400' : 'text-blue-400';
                var wrt = Math.max(0, Math.min(100, s.winRate));
                return '<div class="bg-slate-800/50 rounded-lg px-3 py-2">'
                    + '<div class="flex items-center justify-between mb-1.5"><span class="text-slate-200 font-bold">' + label + '</span>'
                    + '<span class="text-[10px] text-slate-400">' + s.count + '회 · 평균 <span class="' + avgCol + ' font-bold">' + (s.avgReturn >= 0 ? '+' : '') + s.avgReturn.toFixed(2) + '%</span></span></div>'
                    + '<div class="flex items-center gap-2"><div class="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden"><div class="h-full bg-emerald-500" style="width:' + wrt + '%"></div></div>'
                    + '<span class="text-[10px] text-slate-300 font-bold w-14 text-right">승률 ' + s.winRate.toFixed(0) + '%</span></div>'
                    + '</div>';
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

    // 사이클(매수→매도) 요약 렌더
    renderCycleSummary(filtered);

    var cardList = document.getElementById('tradelogCardList');
    if (!cardList) return;
    cardList.innerHTML = '';

    // 월별 그룹핑
    var monthGroups = {};
    var monthOrder = [];
    _tradeLogRows.forEach(function(row, idx) {
        var monthKey = row.date ? row.date.substring(0, 7) : 'unknown'; // YYYY-MM
        if (!monthGroups[monthKey]) {
            monthGroups[monthKey] = [];
            monthOrder.push(monthKey);
        }
        monthGroups[monthKey].push({ row: row, idx: idx });
    });

    // 현재 월 판별
    var now = new Date();
    var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    monthOrder.forEach(function(monthKey, mi) {
        var items = monthGroups[monthKey];
        var isCurrentMonth = (monthKey === currentMonth);
        var isOpen = (mi === 0); // 가장 최근 월만 펼침
        var parts = monthKey.split('-');
        var monthLabel = parts[0] + '년 ' + parseInt(parts[1]) + '월';

        // 월별 매수/매도 요약 + 그 달 승률·평균수익률
        var buyCount = 0, sellCount = 0, totalAmount = 0;
        var mWins = 0, mSells = 0, mSum = 0;
        items.forEach(function(item) {
            var r = item.row;
            if (r.type === 'BUY') buyCount++;
            else if (r.type === 'SELL') {
                sellCount++;
                if (r.returnPct != null && !isNaN(r.returnPct)) { mSells++; mSum += r.returnPct; if (r.returnPct > 0) mWins++; }
            }
            if (r.total) totalAmount += Math.abs(r.total);
        });
        var summary = [];
        if (buyCount) summary.push('매수 ' + buyCount);
        if (sellCount) summary.push('매도 ' + sellCount);
        summary.push('$' + Math.round(totalAmount).toLocaleString());
        var monthReviewHtml = '';
        if (mSells > 0) {
            var mWinRate = (mWins / mSells) * 100;
            var mAvg = mSum / mSells;
            var avgCol = mAvg >= 0 ? 'text-red-400' : 'text-blue-400';
            monthReviewHtml = '<div class="text-[10px] text-slate-500 px-1 mt-1">📊 이 달 승률 <span class="text-slate-300 font-bold">' + mWinRate.toFixed(0) + '%</span> · 평균 <span class="' + avgCol + ' font-bold">' + (mAvg >= 0 ? '+' : '') + mAvg.toFixed(2) + '%</span> (매도 ' + mSells + '건)</div>';
        }

        var monthId = 'tradeMonth' + mi;

        cardList.innerHTML += '<div class="mt-2 first:mt-0">'
            + '<button type="button" onclick="toggleEtfSector(\'' + monthId + '\')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border ' + (isCurrentMonth ? 'bg-blue-900/20 border-blue-800/40' : 'bg-slate-800/40 border-slate-700') + ' hover:brightness-110 transition">'
            + '<div class="flex items-center gap-2">'
            + '<i class="fa-regular fa-calendar text-sm ' + (isCurrentMonth ? 'text-blue-400' : 'text-slate-500') + '"></i>'
            + '<span class="text-xs font-bold text-white">' + monthLabel + '</span>'
            + (isCurrentMonth ? '<span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">이번 달</span>' : '')
            + '</div>'
            + '<div class="flex items-center gap-2">'
            + '<span class="text-[10px] text-slate-400">' + summary.join(' · ') + '</span>'
            + '<span class="text-[10px] text-slate-500 font-bold">' + items.length + '건</span>'
            + '<i class="fa-solid fa-chevron-down text-[10px] text-slate-500 transition-transform" id="' + monthId + 'Chev" style="' + (isOpen ? '' : 'transform:rotate(-90deg)') + '"></i>'
            + '</div></button>'
            + monthReviewHtml
            + '<div class="space-y-2 mt-2 ' + (isOpen ? '' : 'hidden') + '" id="' + monthId + '">';

        items.forEach(function(item) {
            var row = item.row;
            var idx = item.idx;
            var isSell = row.type === 'SELL';
            var isDIV = row.type === 'DIV';
            var returnPct = row.returnPct != null ? row.returnPct : row.profitPct;
            var typeColor = isSell ? 'bg-blue-900/40 text-blue-300 border-blue-800' : (isDIV ? 'bg-yellow-900/40 text-yellow-300 border-yellow-800' : 'bg-red-900/40 text-red-300 border-red-800');
            var borderColor = isSell ? 'border-l-blue-500' : (isDIV ? 'border-l-yellow-500' : 'border-l-red-500');
            var priceStr = row.price != null ? '$' + row.price.toFixed(2) : '—';
            var totalStr = row.total != null ? '$' + row.total.toFixed(2) : '—';
            var qtyStr = row.qty != null ? row.qty + '주' : '—';
            var stageStr = (row.plannedStage != null && row.plannedStage !== '') ? row.plannedStage + '차' : '';

            var diffHtml = '';
            if (row.planVsResult && row.planVsResult.priceDiffPercent != null) {
                var dp = row.planVsResult.priceDiffPercent;
                diffHtml = '<span class="' + (dp >= 0 ? 'text-red-400' : 'text-blue-400') + ' text-[10px]">(' + (dp >= 0 ? '+' : '') + dp.toFixed(1) + '%)</span>';
            }

            var pnlHtml = '';
            if (isSell && returnPct != null && !isNaN(returnPct)) {
                pnlHtml = '<span class="font-bold ' + (returnPct >= 0 ? 'text-red-400' : 'text-blue-400') + '">' + (returnPct >= 0 ? '+' : '') + returnPct.toFixed(2) + '%</span>';
            }

            var memoHtml = row.memoText ? '<div class="text-[10px] text-slate-500 mt-1 truncate"><i class="fa-solid fa-pen-nib mr-1 text-slate-600"></i>' + escapeHtml(row.memoText) + '</div>' : '';

            cardList.innerHTML += '<div class="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 border-l-4 ' + borderColor + ' cursor-pointer hover:bg-slate-800/60 transition" onclick="showTradeDetail(' + idx + ')">'
                + '<div class="flex items-center justify-between mb-1">'
                + '<div class="flex items-center gap-2">'
                + '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded border ' + typeColor + '">' + row.type + '</span>'
                + '<span class="font-bold text-white text-xs">' + row.sym + '</span>'
                + (stageStr ? '<span class="text-[10px] text-slate-400 font-bold">' + stageStr + '</span>' : '')
                + '<span class="text-[10px] text-slate-500">' + row.date + '</span>'
                + '</div>'
                + pnlHtml
                + '</div>'
                + '<div class="flex items-baseline justify-between">'
                + '<div class="flex items-baseline gap-1.5">'
                + '<span class="font-bold text-white text-sm">' + priceStr + '</span>'
                + diffHtml
                + '<span class="text-slate-400 text-xs">' + qtyStr + '</span>'
                + '</div>'
                + '<span class="text-slate-300 text-xs font-bold">' + totalStr + '</span>'
                + '</div>'
                + '<div class="flex items-center gap-2 mt-1">'
                + '<span class="text-[9px] text-slate-500">' + escapeHtml(row.tagLabel || '') + '</span>'
                + '</div>'
                + memoHtml
                + '</div>';
        });

        cardList.innerHTML += '</div></div>';
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

// 사이클(매수→매도) 요약 — 종목+사이클별 평균 진입/청산·보유기간·실현손익
var _cycleExpanded = false;
var _lastCycleTrades = null;
function renderCycleSummary(trades) {
    var panel = document.getElementById('tradelogCycleSummary');
    var body = document.getElementById('cycleSummaryBody');
    if (!panel || !body) return;
    _lastCycleTrades = trades;

    var groups = {};
    (trades || []).forEach(function(t) {
        if (t.type !== 'BUY' && t.type !== 'SELL') return; // 배당 제외
        var cid = (t.cycleId != null && t.cycleId !== '') ? String(t.cycleId) : '0';
        var key = t.sym + '|' + cid;
        if (!groups[key]) groups[key] = { sym: t.sym, cycleId: cid, buys: [], sells: [], dates: [] };
        if (t.type === 'BUY') groups[key].buys.push(t); else groups[key].sells.push(t);
        if (t.date) groups[key].dates.push(t.date);
    });
    var keys = Object.keys(groups);
    if (!keys.length) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');

    // 종목별 최신 사이클 id (실제 보유 수량과 대조해 '보유중' 판정)
    var latestCidBySym = {};
    keys.forEach(function(k) { var g = groups[k]; var n = Number(g.cycleId) || 0; if (latestCidBySym[g.sym] == null || n > latestCidBySym[g.sym]) latestCidBySym[g.sym] = n; });

    var sumQC = function(arr) {
        var q = 0, c = 0;
        arr.forEach(function(t) { var qty = Number(t.qty) || 0; var tot = (t.total != null && !isNaN(t.total)) ? Math.abs(Number(t.total)) : (Number(t.price) || 0) * qty; q += qty; c += tot; });
        return { qty: q, cost: c };
    };
    var todayStr = new Date().toISOString().slice(0, 10);

    var cards = keys.map(function(key) {
        var g = groups[key];
        var b = sumQC(g.buys), s = sumQC(g.sells);
        var avgBuy = b.qty ? b.cost / b.qty : 0;
        var avgSell = s.qty ? s.cost / s.qty : 0;
        // '보유중' = 해당 종목의 최신 사이클이고 실제 포트폴리오에 보유수량이 있을 때 (실제 보유와 대조)
        var realHeld = (portfolios[g.sym] && portfolios[g.sym].qty) || 0;
        var isLatest = (Number(g.cycleId) || 0) === latestCidBySym[g.sym];
        var isOpen = isLatest && realHeld > 0.0001;
        var openQty = isOpen ? realHeld : 0;
        var closed = !isOpen;
        var dates = g.dates.slice().sort();
        var firstDate = dates[0] || '';
        var lastDate = dates[dates.length - 1] || '';
        var realized = (s.qty && avgBuy) ? (s.cost - avgBuy * s.qty) : null;
        var realizedPct = (avgBuy && s.qty) ? ((avgSell - avgBuy) / avgBuy) * 100 : null;
        var endDate = closed ? lastDate : todayStr;
        var days = '';
        if (firstDate) { var dd = Math.round((new Date(endDate) - new Date(firstDate)) / 86400000); if (!isNaN(dd) && dd >= 0) days = dd + '일'; }
        return { g: g, b: b, s: s, avgBuy: avgBuy, avgSell: avgSell, openQty: openQty, closed: closed, firstDate: firstDate, lastDate: lastDate, realized: realized, realizedPct: realizedPct, days: days };
    });
    cards.sort(function(a, b) {
        if (a.closed !== b.closed) return a.closed ? 1 : -1; // 보유중 먼저
        return (b.lastDate || '').localeCompare(a.lastDate || '');
    });

    var shown = _cycleExpanded ? cards : cards.slice(0, 3);
    var html = shown.map(function(c) {
        var statusBadge = c.closed
            ? '<span class="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">종료</span>'
            : '<span class="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold">보유중</span>';
        var cidLabel = c.g.cycleId === '0' ? '' : '<span class="text-[10px] text-purple-300 font-bold">#' + escapeHtml(c.g.cycleId) + '</span>';
        var pnlHtml;
        if (c.realizedPct != null && c.s.qty) {
            var col = c.realizedPct >= 0 ? 'text-red-400' : 'text-blue-400';
            var amt = c.realized != null ? ((c.realized >= 0 ? '+$' : '-$') + Math.abs(Math.round(c.realized)).toLocaleString()) : '';
            pnlHtml = '<div class="text-right"><div class="font-black ' + col + '">' + (c.realizedPct >= 0 ? '+' : '') + c.realizedPct.toFixed(2) + '%</div><div class="text-[10px] ' + col + '">' + amt + (c.openQty > 0.0001 ? ' (일부)' : '') + '</div></div>';
        } else {
            pnlHtml = '<div class="text-right text-[10px] text-slate-500">미실현</div>';
        }
        var line2 = '매수 ' + Math.round(c.b.qty) + '주 @ $' + c.avgBuy.toFixed(2)
            + (c.s.qty ? '  →  매도 ' + Math.round(c.s.qty) + '주 @ $' + c.avgSell.toFixed(2) : '')
            + (c.openQty > 0.0001 ? '  · 잔여 ' + Math.round(c.openQty) + '주' : '');
        var period = c.firstDate + (c.lastDate && c.lastDate !== c.firstDate ? ' ~ ' + c.lastDate : '');
        // 단계 진행 (실행 매수 횟수 / 총 단계)
        var sd = c.g.buys ? c.g.buys.length : 0;
        var cfg = portfolios[c.g.sym] && portfolios[c.g.sym].config;
        var st = (cfg && cfg.stages) ? cfg.stages : sd;
        if (cfg && cfg.boosterOn && cfg.boosterStages) st += cfg.boosterStages;
        var stagePct = st ? Math.min(100, sd / st * 100) : 0;
        var stageHtml = st ? ('<div class="flex items-center gap-2 mt-1.5"><span class="text-[10px] text-slate-400 shrink-0 font-bold">단계 ' + sd + '/' + st + '</span><div class="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden"><div class="h-full bg-purple-500" style="width:' + stagePct + '%"></div></div></div>') : '';
        return '<div class="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">'
            + '<div class="flex items-center justify-between mb-1">'
            + '<div class="flex items-center gap-2"><span class="font-black text-white">' + escapeHtml(c.g.sym) + '</span>' + cidLabel + statusBadge + '</div>'
            + pnlHtml + '</div>'
            + '<div class="text-[11px] text-slate-300">' + line2 + '</div>'
            + stageHtml
            + '<div class="text-[10px] text-slate-500 mt-0.5"><i class="fa-regular fa-clock mr-1"></i>' + period + (c.days ? ' (' + c.days + ')' : '') + '</div>'
            + '</div>';
    }).join('');
    if (!_cycleExpanded && cards.length > 3) {
        html += '<button onclick="expandCycleSummary()" class="w-full mt-1 py-2 text-[11px] text-purple-300 bg-slate-800/60 rounded-lg font-bold">더보기 (' + (cards.length - 3) + '개)</button>';
    }
    body.innerHTML = html;
}
function expandCycleSummary() { _cycleExpanded = true; if (_lastCycleTrades) renderCycleSummary(_lastCycleTrades); }

// 매매일지 상세 — 포맷팅된 거래 카드 (체결/계획대비/분류/메모)
function showTradeDetail(idx) {
    var r = _tradeLogRows[idx];
    if (!r) return;
    var typeMap = {
        BUY:  { label: '매수', cls: 'bg-red-900/40 text-red-300 border-red-800' },
        SELL: { label: '매도', cls: 'bg-blue-900/40 text-blue-300 border-blue-800' },
        DIV:  { label: '배당', cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' }
    };
    var tm = typeMap[r.type] || { label: r.type || '거래', cls: 'bg-slate-700 text-slate-300 border-slate-600' };
    var isSell = r.type === 'SELL';
    var num = function(v, d) { return (v != null && v !== '' && !isNaN(v)) ? Number(v).toFixed(d) : null; };
    var row = function(label, val, cls) {
        return '<div class="flex justify-between gap-3 py-1.5 border-b border-slate-700/40 last:border-0">'
            + '<span class="text-slate-400 shrink-0">' + label + '</span>'
            + '<span class="font-bold text-right ' + (cls || 'text-white') + '">' + val + '</span></div>';
    };
    var sectionHead = function(t) { return '<div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-3">' + t + '</div>'; };

    var stageStr = (r.plannedStage != null && r.plannedStage !== '') ? ' · ' + r.plannedStage + '차'
        : ((r.stage != null && r.stage !== '') ? ' · ' + r.stage + '차' : '');

    var h = '';
    // 헤더
    h += '<div class="flex items-center gap-2 mb-1">'
        + '<span class="text-[11px] font-bold px-2 py-0.5 rounded border ' + tm.cls + '">' + tm.label + '</span>'
        + '<span class="text-lg font-black text-white">' + escapeHtml(r.sym || '') + '</span>'
        + '<span class="text-xs text-slate-400">' + escapeHtml(r.date || '') + stageStr + '</span>'
        + '</div>';

    // 차트 (해당 종목 단독, 매수/매도 지점 표시) + 당일 시장 상황(수치)
    h += '<div class="mt-1 mb-2">'
        + '<div class="flex items-center gap-3 text-[9px] mb-1 px-0.5">'
        + '<span class="text-white font-bold">━ ' + escapeHtml(r.sym || '종목') + '</span>'
        + '<span class="text-amber-400">┈ 평단</span>'
        + '<span class="ml-auto text-slate-500">🔵 매수  🔴 매도</span></div>'
        + '<div id="tradeChartContainer" style="width:100%;height:200px;" class="rounded-lg overflow-hidden bg-slate-900/50"></div>'
        + '<div id="tradeChartPeriodRet" class="text-[10px] text-slate-400 mt-1.5 px-0.5"></div>'
        + '</div>';

    // 체결 내역
    h += sectionHead('체결 내역');
    h += '<div class="bg-slate-900/50 rounded-lg px-3 py-1 text-xs">';
    h += row('체결가', num(r.price, 2) ? '$' + num(r.price, 2) : '—');
    h += row('수량', (r.qty != null ? r.qty + '주' : '—'));
    if (num(r.fee, 2)) h += row('수수료', '$' + num(r.fee, 2));
    h += row(isSell ? '정산 금액' : '매수 금액', num(r.total, 2) ? '$' + Number(r.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
    if (isSell && r.returnPct != null && !isNaN(r.returnPct)) {
        h += row('실현 수익률', (r.returnPct >= 0 ? '+' : '') + r.returnPct.toFixed(2) + '%', r.returnPct >= 0 ? 'text-red-400' : 'text-blue-400');
    }
    h += '</div>';

    // 계획 대비 (계획가가 있을 때만)
    if (num(r.plannedPrice, 2) && Number(r.plannedPrice) > 0) {
        h += sectionHead('계획 대비');
        h += '<div class="bg-slate-900/50 rounded-lg px-3 py-1 text-xs">';
        var dp = (r.planVsResult && r.planVsResult.priceDiffPercent != null) ? r.planVsResult.priceDiffPercent : null;
        var dpStr = dp != null ? ' <span class="' + (dp >= 0 ? 'text-red-400' : 'text-blue-400') + '">(' + (dp >= 0 ? '+' : '') + dp.toFixed(1) + '%)</span>' : '';
        h += row('계획가 → 실제', '$' + num(r.plannedPrice, 2) + ' → $' + (num(r.price, 2) || '—') + dpStr);
        if (r.plannedQty != null && r.plannedQty !== '') h += row('계획수량 → 실제', r.plannedQty + ' → ' + (r.qty != null ? r.qty : '—') + '주');
        h += '</div>';
    }

    // 분류 & 메모
    h += sectionHead('분류 & 메모');
    h += '<div class="bg-slate-900/50 rounded-lg px-3 py-1 text-xs">';
    h += row('매매 유형', escapeHtml(r.tagLabel || getTagLabel(r.tag)));
    if (r.cycleId != null && r.cycleId !== '') h += row('사이클', '#' + r.cycleId);
    h += '</div>';

    var memo = String(r.memo || r.memoText || '').trim();
    h += '<div class="mt-2 bg-slate-900/50 rounded-lg p-3">'
        + '<div class="text-[10px] font-bold text-slate-500 mb-1.5"><i class="fa-solid fa-pen-nib mr-1"></i>' + (isSell ? '매도 이유 / 메모' : '매수 이유 / 메모') + '</div>'
        + '<div class="text-xs whitespace-pre-wrap break-words ' + (memo ? 'text-slate-200' : 'text-slate-600') + '">'
        + (memo ? escapeHtml(memo) : '기록된 메모가 없습니다. 매수·매도 시 이유(근거·시그널·심리)를 적어두면 복기에 큰 도움이 됩니다.')
        + '</div></div>';

    var titleEl = document.getElementById('tradelogDetailTitle');
    var contentEl = document.getElementById('tradelogDetailContent');
    if (titleEl) titleEl.textContent = tm.label + ' 상세 · ' + (r.sym || '');
    if (contentEl) contentEl.innerHTML = h;
    var modal = document.getElementById('tradelogDetailModal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    // 차트 렌더 (종목 vs 지수 + 매수/매도 마커)
    setTimeout(function() { renderTradeJournalChart(r.sym, r.cycleId, r.date); }, 30);
}

// 매매일지 상세 차트: 종목·나스닥·다우를 % 리베이스 라인 + 매수/매도 마커
var _tradeChartObj = null;
function _fetchOhlc(ticker) {
    return fetch(API_BASE_URL + '/ohlc?ticker=' + encodeURIComponent(ticker) + '&range=1y', { signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined })
        .then(function(r) { return r.json(); })
        .then(function(d) { return (d && Array.isArray(d.series)) ? d.series : []; })
        .catch(function() { return []; });
}
function renderTradeJournalChart(sym, cycleId, focusDate) {
    var cont = document.getElementById('tradeChartContainer');
    if (!cont) return;
    if (typeof LightweightCharts === 'undefined') { cont.parentElement.style.display = 'none'; return; }

    // 해당 사이클 매수/매도 거래 (전체 이력에서)
    var cycleTrades = getAggregatedTrades().filter(function(t) {
        return t.sym === sym && String(t.cycleId) === String(cycleId) && (t.type === 'BUY' || t.type === 'SELL');
    });
    var tdates = cycleTrades.map(function(t) { return t.date; }).filter(Boolean).sort();
    var startD = tdates[0] || focusDate, endD = tdates[tdates.length - 1] || focusDate;
    // 윈도우: 시작 -21일 ~ 종료 +21일 (오늘 한도)
    var pad = function(ds, days) { var d = new Date(ds); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
    var todayS = new Date().toISOString().slice(0, 10);
    var winStart = pad(startD, -21), winEnd = pad(endD, 21); if (winEnd > todayS) winEnd = todayS;

    Promise.all([_fetchOhlc(sym), _fetchOhlc('^IXIC'), _fetchOhlc('^DJI'), _fetchOhlc('^GSPC')]).then(function(res) {
        var inWin = function(arr) { return (arr || []).filter(function(p) { return p.time >= winStart && p.time <= winEnd; }); };
        // 종목은 실제 가격으로 표시 (매수/매도가와 일치)
        var stockData = inWin(res[0]).map(function(p) { return { time: p.time, value: Math.round(p.close * 100) / 100 }; });
        if (!stockData.length) { cont.parentElement.style.display = 'none'; return; }

        try { if (_tradeChartObj) { _tradeChartObj.remove(); _tradeChartObj = null; } } catch (e) {}
        cont.innerHTML = '';
        var chart = LightweightCharts.createChart(cont, {
            width: cont.clientWidth, height: 200,
            layout: { background: { color: 'transparent' }, textColor: '#94a3b8', fontSize: 9 },
            grid: { vertLines: { color: 'rgba(51,65,85,0.3)' }, horzLines: { color: 'rgba(51,65,85,0.3)' } },
            rightPriceScale: { borderColor: '#334155' }, timeScale: { borderColor: '#334155' },
            crosshair: { mode: 0 }, handleScroll: false, handleScale: false
        });
        _tradeChartObj = chart;
        var stock = chart.addAreaSeries({ lineColor: '#38bdf8', topColor: 'rgba(56,189,248,0.25)', bottomColor: 'rgba(56,189,248,0.02)', lineWidth: 2, priceLineVisible: false });
        stock.setData(stockData);

        // 매수/매도 마커
        var markers = cycleTrades.map(function(t) {
            var buy = t.type === 'BUY';
            return { time: t.date, position: buy ? 'belowBar' : 'aboveBar', color: buy ? '#3b82f6' : '#f43f5e', shape: buy ? 'arrowUp' : 'arrowDown', text: (buy ? '매수' : '매도') + (t.price ? ' $' + Number(t.price).toFixed(2) : '') };
        }).sort(function(a, b) { return a.time < b.time ? -1 : 1; });
        try { stock.setMarkers(markers); } catch (e) {}

        // 평단가 선 (해당 사이클 매수 평균 체결가)
        var bq = 0, bc = 0;
        cycleTrades.forEach(function(t) { if (t.type === 'BUY') { var q = Number(t.qty) || 0; bq += q; bc += (Number(t.price) || 0) * q; } });
        if (bq > 0) {
            var avgBuy = bc / bq;
            try {
                stock.createPriceLine({ price: Math.round(avgBuy * 100) / 100, color: '#fbbf24', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '평단 $' + avgBuy.toFixed(2) });
            } catch (e) {}
        }
        chart.timeScale().fitContent();

        // 당일 시장 상황 (거래일 기준 지수 레벨 + 등락률)
        var dayMetric = function(series, dateStr) {
            series = series || []; var idx = -1;
            for (var i = 0; i < series.length; i++) { if (series[i].time <= dateStr) idx = i; else break; }
            if (idx < 1) return null;
            var cur = series[idx].close, prev = series[idx - 1].close;
            return { level: cur, chg: prev ? (cur / prev - 1) * 100 : 0 };
        };
        var fmtIdx = function(m, label) {
            if (!m) return '';
            var col = m.chg >= 0 ? 'text-red-400' : 'text-blue-400';
            return '<span class="text-slate-400">' + label + ' <span class="text-slate-200 font-bold">' + Math.round(m.level).toLocaleString() + '</span> <span class="' + col + '">' + (m.chg >= 0 ? '+' : '') + m.chg.toFixed(2) + '%</span></span>';
        };
        var d = focusDate || (stockData[stockData.length - 1] && stockData[stockData.length - 1].time);
        var parts = [fmtIdx(dayMetric(res[1], d), '나스닥'), fmtIdx(dayMetric(res[3], d), 'S&P500'), fmtIdx(dayMetric(res[2], d), '다우')].filter(Boolean);
        var pe = document.getElementById('tradeChartPeriodRet');
        if (pe) pe.innerHTML = parts.length ? ('<span class="text-slate-500">📅 ' + escapeHtml(d) + ' 시장</span><br>' + parts.join('  ·  ')) : '';
    });
}

function closeTradeLogDetailModal() {
    const modal = document.getElementById('tradelogDetailModal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    try { if (_tradeChartObj) { _tradeChartObj.remove(); _tradeChartObj = null; } } catch (e) {}
}

function updateGlobalCalc() { 
    try { 
        globalData.seedKRW = parseFloat(document.getElementById('globalSeedKRW').value)||0; globalData.rate = parseFloat(document.getElementById('globalRate').value)||1300; var _sipEl = document.getElementById('globalSipKRW'); if(_sipEl) globalData.sipKRW = parseFloat(_sipEl.value)||0; 
        let netDepositKRW = 0; let totalInjectedUSD = globalData.seedKRW / globalData.rate; 
        globalData.deposits.forEach(d => { netDepositKRW += d.amount; totalInjectedUSD += (d.amount / d.rate); }); 
        const totalPrincipalKRW = globalData.seedKRW + netDepositKRW;
        const tpEl = document.getElementById('totalPrincipalDisplay'); if(tpEl) tpEl.innerText = totalPrincipalKRW.toLocaleString() + ' 원';
        // 누적 평균 환율 계산
        var totalKrwForAvg = globalData.seedKRW;
        var totalUsdForAvg = globalData.seedKRW / globalData.rate;
        var depositCount = 0;
        (globalData.deposits || []).forEach(function(d) {
            if (d.type !== 'OUT' && d.amount > 0) {
                totalKrwForAvg += d.amount;
                totalUsdForAvg += d.amount / (d.rate || globalData.rate);
                depositCount++;
            }
        });
        var avgRate = totalUsdForAvg > 0 ? Math.round(totalKrwForAvg / totalUsdForAvg) : globalData.rate;
        var avgRateEl = document.getElementById('avgExchangeRate');
        if (avgRateEl) {
            var currentRate = globalData.rate;
            var diffPct = currentRate > 0 ? ((currentRate - avgRate) / avgRate * 100) : 0;
            var diffColor = diffPct > 0 ? 'text-red-400' : (diffPct < 0 ? 'text-blue-400' : 'text-slate-400');
            avgRateEl.innerHTML = avgRate.toLocaleString() + '원 <span class="text-[9px] ' + diffColor + '">(' + (diffPct >= 0 ? '+' : '') + diffPct.toFixed(1) + '%)</span>';
        }
        var dcEl = document.getElementById('totalDepositCount');
        if (dcEl) dcEl.innerText = (depositCount + 1) + '회'; // +1 for 초기 시드
        var tcEl = document.getElementById('totalConvertedUsd');
        if (tcEl) tcEl.innerText = '$' + Math.round(totalUsdForAvg).toLocaleString(); 
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
        // 손익 분석(원화) — 주식손익 vs 환차손익 분리 + 환율 게이지 + 입출금 요약 (현재환율=실시간 우선)
        renderCapitalAnalysis(totalPrincipalKRW, totalInjectedUSD, avgRate, (_liveUsdKrw || globalData.rate), totalPnL);
        let invested = 0; const labels = [], data = [], colors = [];
        Object.keys(portfolios).forEach(s => { const p = portfolios[s]; const price = p.marketData && p.marketData.price > 0 ? p.marketData.price : p.avgPrice; const val = p.qty * price; if(val > 0) { invested += val; labels.push(s); data.push(val); colors.push(s==='GLD'?'#facc15':'#3b82f6'); } }); 
        const totalEquity = totalInjectedUSD + totalPnL; const cashProxy = totalEquity - invested;
        if(cashProxy > 0) { labels.push('현금(Est)'); data.push(cashProxy); colors.push('#1e293b'); }
        if (portfolioChart && typeof portfolioChart.destroy === "function") {
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
    
// 손익 분석(원화): 주식손익 vs 환차손익 분리 + 자본구성 막대 + 환율 게이지 + 입출금 요약
function renderCapitalAnalysis(principalKRW, injectedUSD, avgRate, curRate, pnlUSD) {
    var krw = function(n) { return Math.round(n).toLocaleString() + '원'; };
    var skrw = function(n) { return (n >= 0 ? '+' : '') + Math.round(n).toLocaleString() + '원'; };
    var col = function(n) { return n >= 0 ? 'text-red-400' : 'text-blue-400'; };

    // 분해 (원화)
    var stockPnlKrw = pnlUSD * curRate;                        // 주식 손익(달러손익×현재환율)
    var fxPnlKrw = injectedUSD * (curRate - avgRate);          // 환차 손익(투입달러×환율차)
    var totalPnlKrw = stockPnlKrw + fxPnlKrw;
    var currentValKrw = principalKRW + totalPnlKrw;
    var retPct = principalKRW > 0 ? (totalPnlKrw / principalKRW * 100) : 0;

    var totEl = document.getElementById('capTotalPnlKrw');
    if (totEl) { totEl.innerHTML = skrw(totalPnlKrw) + ' <span class="text-xs">(' + (retPct >= 0 ? '+' : '') + retPct.toFixed(1) + '%)</span>'; totEl.className = 'text-base font-black ' + col(totalPnlKrw); }

    // 자본 구성 막대: 원금 / 주식손익(+) / 환차손익(+) 비율 (음수는 막대에서 제외하고 아래 행에 표시)
    var bar = document.getElementById('capStackBar');
    if (bar) {
        var segs = [{ v: principalKRW, c: '#475569', t: '원금' }];
        if (stockPnlKrw > 0) segs.push({ v: stockPnlKrw, c: '#ef4444', t: '주식' });
        if (fxPnlKrw > 0) segs.push({ v: fxPnlKrw, c: '#f59e0b', t: '환차' });
        var tot = segs.reduce(function(a, s) { return a + s.v; }, 0) || 1;
        bar.innerHTML = segs.map(function(s) {
            var w = (s.v / tot * 100);
            return '<div style="width:' + w.toFixed(1) + '%;background:' + s.c + '" class="flex items-center justify-center text-white overflow-hidden whitespace-nowrap">' + (w > 12 ? s.t : '') + '</div>';
        }).join('');
    }

    // 분해 행
    var bd = document.getElementById('capBreakdown');
    if (bd) {
        bd.innerHTML =
            '<div class="flex justify-between text-xs"><span class="text-slate-400"><span class="inline-block w-2 h-2 rounded-sm align-middle mr-1.5" style="background:#475569"></span>원금</span><span class="text-slate-200 font-bold">' + krw(principalKRW) + '</span></div>'
            + '<div class="flex justify-between text-xs"><span class="text-slate-400"><span class="inline-block w-2 h-2 rounded-sm align-middle mr-1.5" style="background:#ef4444"></span>주식 손익</span><span class="font-bold ' + col(stockPnlKrw) + '">' + skrw(stockPnlKrw) + '</span></div>'
            + '<div class="flex justify-between text-xs"><span class="text-slate-400"><span class="inline-block w-2 h-2 rounded-sm align-middle mr-1.5" style="background:#f59e0b"></span>환차 손익</span><span class="font-bold ' + col(fxPnlKrw) + '">' + skrw(fxPnlKrw) + '</span></div>'
            + '<div class="flex justify-between text-xs pt-1.5 mt-1 border-t border-slate-700"><span class="text-white font-bold">현재 평가액</span><span class="text-white font-black">' + krw(currentValKrw) + '</span></div>';
    }

    // 환율 게이지 (평균 대비 현재 위치)
    var ar = document.getElementById('capAvgRate'); if (ar) ar.innerText = Math.round(avgRate).toLocaleString();
    var cr = document.getElementById('capCurRate'); if (cr) cr.innerHTML = Math.round(curRate).toLocaleString() + (_liveUsdKrw ? ' <span class="text-[8px] text-emerald-400 font-bold">LIVE</span>' : '');
    var marker = document.getElementById('capRateMarker');
    if (marker) {
        // ±5% 범위를 0~100%로 매핑 (평균=중앙 50%)
        var diff = avgRate > 0 ? (curRate - avgRate) / avgRate : 0;
        var pos = Math.max(0, Math.min(100, 50 + (diff / 0.05) * 50));
        marker.style.left = 'calc(' + pos.toFixed(0) + '% - 6px)';
    }
    var fxr = document.getElementById('capFxResult');
    if (fxr) {
        var diffPct = avgRate > 0 ? ((curRate - avgRate) / avgRate * 100) : 0;
        if (Math.abs(diffPct) < 0.05) { fxr.innerHTML = '<span class="text-slate-400">현재 환율이 평균 매입가와 비슷합니다</span>'; }
        else if (diffPct > 0) { fxr.innerHTML = '<span class="text-red-400 font-bold">환율 ▲ ' + diffPct.toFixed(1) + '% → 환차익 ' + skrw(fxPnlKrw) + '</span>'; }
        else { fxr.innerHTML = '<span class="text-blue-400 font-bold">환율 ▼ ' + diffPct.toFixed(1) + '% → 환차손 ' + skrw(fxPnlKrw) + '</span>'; }
    }

    // 입출금 요약 (최근 내역)
    var cfs = document.getElementById('cashFlowSummary');
    if (cfs) {
        var deps = (globalData.deposits || []).slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        if (!deps.length) { cfs.innerHTML = '<div class="text-[10px] text-slate-600 text-center py-1">입출금 내역 없음</div>'; }
        else {
            cfs.innerHTML = deps.slice(0, 3).map(function(d) {
                var isOut = (d.amount < 0) || d.type === 'OUT';
                return '<div class="flex justify-between items-center bg-slate-800/50 rounded-lg px-3 py-1.5 text-[11px]">'
                    + '<span class="text-slate-400">' + escapeHtml(d.date || '') + ' <span class="' + (isOut ? 'text-red-400' : 'text-emerald-400') + ' font-bold ml-1">' + (isOut ? '출금' : '입금') + '</span></span>'
                    + '<span class="text-slate-200 font-bold">' + Math.abs(Math.round(d.amount || 0)).toLocaleString() + '원 <span class="text-[9px] text-slate-500">@' + Math.round(d.rate || 0).toLocaleString() + '</span></span></div>';
            }).join('') + (deps.length > 3 ? '<div class="text-[9px] text-slate-600 text-center pt-0.5">외 ' + (deps.length - 3) + '건 · 위 버튼에서 전체 관리</div>' : '');
        }
    }
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
// 매도 목표가: 순수익률 기준 → 수수료(매수+매도, useSec 옵션 시 SEC 수수료 추가) 보정한 실제 매도 호가
function calcSellTargetPrice(avgPrice, targetNetPct) {
    const baseRate = (globalData && globalData.feeRate ? globalData.feeRate : 0) / 100;
    const useSec = !!(globalData && globalData.useSec);
    const buyFee = baseRate;
    const sellFee = baseRate + (useSec ? 0.0000229 : 0);
    const denom = 1 - sellFee;
    if (denom <= 0) return avgPrice * (1 + (targetNetPct || 0) / 100);
    return avgPrice * (1 + (targetNetPct || 0) / 100) * (1 + buyFee) / denom;
}

function renderSellPlan() {
    const d = portfolios[activeTicker];
    const panel = document.getElementById('sellPlanPanel');
    if (!panel) return;
    if (d.qty > 0) {
        panel.classList.remove('hidden');
        const plans = d.config.sellPlans || [];
        for (let i = 1; i <= 3; i++) {
            const p = plans[i - 1] || {};
            const targetPct = parseFloat(p.targetPct) || (i === 1 ? 5 : (i === 2 ? 10 : 15));
            const targetPrice = calcSellTargetPrice(d.avgPrice, targetPct);
            const el = document.getElementById('sellTargetPrice' + i);
            if (el) el.innerText = '$' + targetPrice.toFixed(2);
            const lbl = document.getElementById('sellTargetLabel' + i);
            if (lbl) lbl.innerText = i + '차 목표가 (순익 +' + targetPct + '%)';
        }

        // MA200 TREND 이탈가 (MARKET_SNAPSHOT 우선, portfolios.marketData 폴백)
        var md = MARKET_SNAPSHOT[activeTicker] || {};
        if ((!md.ma200 || md.ma200 <= 0) && d.marketData) md = Object.assign({}, d.marketData, md);
        const trendEl = document.getElementById('sellTrendExitPrice');
        if (trendEl) trendEl.innerText = md.ma200 > 0 ? ('$' + md.ma200.toFixed(2)) : '수신 대기';

        // 3가지 매도 시그널 알림
        const alertsEl = document.getElementById('sellSignalAlerts');
        if (alertsEl) {
            var alerts = [];
            var meta = ETF_DB.find(function(e){return e.sym===activeTicker;}) || {};
            var quadNow = getCurrentQuad();
            var isQuadFavorable = meta.quad && meta.quad.length > 0 && (meta.quad.indexOf(quadNow) !== -1 || meta.quad.length === 4);

            // 1. Quad 전환 시그널
            if (quadNow && !isQuadFavorable) {
                alerts.push({level:'red', icon:'fa-arrows-rotate', text:'Quad ' + quadNow + ' 역풍 — 전량 매도 검토', desc:'수혜 Quad: ' + (meta.quad||[]).join(',')});
            } else if (MACRO_DATA && MACRO_DATA.quad && MACRO_DATA.quad.transition_risk) {
                var maxRisk = 0; var maxQ = 0;
                [1,2,3,4].forEach(function(n) { var r = MACRO_DATA.quad.transition_risk['to_quad'+n]||0; if(n!==quadNow && r>maxRisk){maxRisk=r;maxQ=n;} });
                if (maxRisk >= 30) alerts.push({level:'yellow', icon:'fa-triangle-exclamation', text:'Quad 전환 리스크 ' + maxRisk + '% (→Q'+maxQ+')', desc:'다음 지표 발표 후 재평가'});
            }

            // 2. TREND 이탈 시그널
            if (md.price > 0 && md.ma200 > 0) {
                if (md.price < md.ma200) {
                    alerts.push({level:'red', icon:'fa-arrow-trend-down', text:'MA200 하향 돌파 — 부분 매도 (50%) 검토', desc:'현재 $' + md.price.toFixed(2) + ' < MA200 $' + md.ma200.toFixed(2)});
                } else {
                    var distPct = ((md.price - md.ma200) / md.ma200 * 100);
                    if (distPct < 3) alerts.push({level:'yellow', icon:'fa-arrow-trend-down', text:'MA200 근접 (' + distPct.toFixed(1) + '%) — 이탈 주의', desc:'MA200: $' + md.ma200.toFixed(2)});
                }
            }

            // 3. 목표 수익률 도달 (순익 기준 — 수수료 보정된 실제 매도가와 현재가 비교)
            if (d.avgPrice > 0 && md.price > 0) {
                var currentPnl = (md.price - d.avgPrice) / d.avgPrice * 100;
                (plans || []).forEach(function(p, i) {
                    var tgt = parseFloat(p.targetPct) || 0;
                    if (tgt > 0) {
                        var tgtPrice = calcSellTargetPrice(d.avgPrice, tgt);
                        if (md.price >= tgtPrice) {
                            alerts.push({level:'green', icon:'fa-bullseye', text:(i+1) + '차 익절 목표 도달! (순익 +' + tgt + '%)', desc:'현재가 $' + md.price.toFixed(2) + ' ≥ 목표가 $' + tgtPrice.toFixed(2) + ' / 매도 비중: ' + (p.sellRatio||50) + '%'});
                        }
                    }
                });
                if (md.rsi > 70) alerts.push({level:'yellow', icon:'fa-chart-line', text:'RSI ' + md.rsi.toFixed(0) + ' 과매수 — 부분 익절 고려', desc:''});
            }

            if (alerts.length === 0) {
                alertsEl.innerHTML = '<div class="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg text-[11px] text-slate-500"><i class="fa-solid fa-check-circle text-green-500"></i>활성 매도 시그널 없음 — 홀딩 유지</div>';
            } else {
                var levelStyles = {red:'bg-red-900/30 border-red-700 text-red-300', yellow:'bg-yellow-900/20 border-yellow-700 text-yellow-300', green:'bg-green-900/20 border-green-700 text-green-300'};
                alertsEl.innerHTML = alerts.map(function(a) {
                    var s = levelStyles[a.level] || levelStyles.yellow;
                    return '<div class="p-2 rounded-lg border text-[11px] ' + s + '"><div class="flex items-center gap-2 font-bold"><i class="fa-solid ' + a.icon + ' text-[10px]"></i>' + escapeHtml(a.text) + '</div>'
                        + (a.desc ? '<div class="text-[10px] opacity-70 mt-0.5 ml-5">' + escapeHtml(a.desc) + '</div>' : '')
                        + '</div>';
                }).join('');
            }
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
        const targetPct = pe ? parseFloat(pe.value) : (i === 1 ? 5 : (i === 2 ? 10 : 15));
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

