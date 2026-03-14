const API_BASE_URL = "https://fragrant-sunset-6230.hansung-aee.workers.dev";

const ETF_DB = [
    {sym:'TQQQ',lev:'3x',group:'B',name:'UltraPro QQQ',desc:'나스닥 100',holdings:'AAPL • MSFT • NVDA'},
    {sym:'SOXL',lev:'3x',group:'A',name:'Semi Bull',desc:'반도체 지수',holdings:'NVDA • AVGO • AMD'},
    {sym:'FNGU',lev:'3x',group:'A',name:'FANG+ Index',desc:'빅테크 10개',holdings:'META • TSLA • GOOGL'},
    {sym:'NVDL',lev:'2x',group:'A',name:'Long NVDA',desc:'엔비디아',holdings:'NVDA (Single)'},
    {sym:'TECL',lev:'3x',group:'B',name:'Tech Bull',desc:'기술 섹터',holdings:'MSFT • AAPL • NVDA'},
    {sym:'LABU',lev:'3x',group:'A',name:'Biotech',desc:'바이오테크',holdings:'XBI Index Swap'},
    {sym:'NRGU',lev:'3x',group:'A',name:'Big Oil',desc:'대형 정유사',holdings:'XOM • CVX • COP'},
    {sym:'ERX',lev:'2x',group:'C',name:'Energy Bull',desc:'에너지 섹터',holdings:'XOM • CVX • EOG'},
    {sym:'CURE',lev:'3x',group:'B',name:'Healthcare',desc:'헬스케어',holdings:'UNH • JNJ • LLY'},
    {sym:'TNA',lev:'3x',group:'A',name:'Small Cap',desc:'러셀 2000',holdings:'IWM Index Swap'},
    {sym:'YINN',lev:'3x',group:'A',name:'China Bull',desc:'중국 대형주',holdings:'Tencent • Alibaba'},
    {sym:'FAS',lev:'3x',group:'B',name:'Financial',desc:'금융 섹터',holdings:'BRK.B • JPM • V'},
    {sym:'DPST',lev:'3x',group:'A',name:'Regional Bank',desc:'지역 은행',holdings:'KRE Index Swap'},
    {sym:'NAIL',lev:'3x',group:'A',name:'Homebuilders',desc:'주택 건설',holdings:'D.R. Horton • Lennar'},
    {sym:'UBOT',lev:'2x',group:'C',name:'Robotics',desc:'로봇/AI',holdings:'NVDA • ISRG • VMW'},
    {sym:'DUSL',lev:'2x',group:'C',name:'Indus Bull',desc:'산업재',holdings:'CAT • UNP • GE'},
    {sym:'BNKU',lev:'3x',group:'B',name:'Big Banks',desc:'대형 은행',holdings:'JPM • BAC • WFC'},
    {sym:'UDOW',lev:'3x',group:'B',name:'UltraPro Dow',desc:'다우존스',holdings:'UNH • GS • MS'},
    {sym:'BULZ',lev:'3x',group:'A',name:'Tech Innovation',desc:'혁신 기술주',holdings:'AAPL • TSLA • NVDA'},
    {sym:'SQQQ',lev:'-3x',group:'A',name:'Short QQQ',desc:'나스닥 인버스',holdings:'QQQ Short'},
    {sym:'SOXS',lev:'-3x',group:'A',name:'Semi Bear',desc:'반도체 인버스',holdings:'SOXX Short'},
    {sym:'GLD',lev:'1x',group:'C',name:'SPDR Gold',desc:'금',holdings:'Gold Bullion'}
];

let NEWS_FEED = [];
let globalData = null;
let portfolios = null;
let MARKET_SNAPSHOT = {};
let tvWidget = null;
let activeTicker = null;
let selectedScanTicker = null;
let tempTickerToAdd = null;
let modalWidget = null;
let currentChartSym = null; 
let SYNC_URL = "";
let _translateCache = {};

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
    const overallExecRate = totalAllocated > 0 ? Math.min(100, (totalInvested / totalAllocated) * 100) : 0;
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
        await fetch(SYNC_URL, { 
            method: 'POST', 
            body: dataStr,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const sText = document.getElementById('syncStatusText');
        if(sText) sText.innerText = "최근 동기화: " + new Date().toLocaleTimeString();
    } catch(e) { 
        const sText = document.getElementById('syncStatusText');
        if(sText) sText.innerText = "동기화 실패";
    } finally {
        setTimeout(() => {
            if(syncBadge) syncBadge.classList.remove('status-sync');
            if(syncIcon) syncIcon.classList.replace('text-white', 'text-slate-500');
        }, 1000);
    }
}

async function loadFromCloud(isManual = false) {
    if(!SYNC_URL) {
        if(isManual) alert("설정 탭에서 구글 시트 URL을 먼저 입력해주세요.");
        return false;
    }
    
    if(isManual) {
        const sText = document.getElementById('syncStatusText');
        if(sText) sText.innerText = "불러오는 중...";
    }

    try {
        const res = await fetch(SYNC_URL);
        const data = await res.json();
        
        if(data && data.global && data.ports) {
            globalData = data.global;
            portfolios = data.ports;
            
            sanitizeData(); // 클라우드에서 받은 데이터도 소독
            
            localStorage.setItem('umt_v172_global', JSON.stringify(globalData));
            localStorage.setItem('umt_v172_ports', JSON.stringify(portfolios));
            
            initInputs();
            updateGlobalCalc();
            renderTickerBar();
            if(activeTicker && portfolios[activeTicker]) loadTickerData(activeTicker);
            
            if(isManual) {
                alert("클라우드 데이터를 성공적으로 불러왔습니다.");
                const sText = document.getElementById('syncStatusText');
                if(sText) sText.innerText = "불러오기 완료";
            }
            return true;
        } else {
            if(isManual) alert("클라우드에 저장된 데이터가 없습니다. (비어있음)");
            return false;
        }
    } catch(e) {
        if(isManual) alert("클라우드 접속 실패. URL이 정확한지 확인해주세요.");
        return false;
    }
}
    
function manualLoadFromCloud() {
    if(confirm("클라우드에 저장된 데이터로 덮어쓰시겠습니까?\n현재 저장되지 않은 로컬 데이터는 사라집니다.")) {
        loadFromCloud(true);
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
            '반도체': ['SOXL','SOXS'],
            '빅테크': ['TQQQ','FNGU','TECL','BULZ'],
            '에너지': ['NRGU','ERX'],
            '금융': ['FAS','BNKU','DPST'],
            '헬스케어': ['LABU','CURE'],
            '금': ['GLD'],
            '기타': []
        };
        for (const k in map) { if (map[k].includes(e.sym)) return k; }
        // fallback: desc 기반
        if ((e.desc || '').includes('반도체')) return '반도체';
        if ((e.desc || '').includes('금융') || (e.desc || '').includes('은행')) return '금융';
        if ((e.desc || '').includes('에너지') || (e.desc || '').includes('정유')) return '에너지';
        if ((e.desc || '').includes('헬스') || (e.desc || '').includes('바이오')) return '헬스케어';
        if ((e.desc || '').includes('나스닥') || (e.desc || '').includes('Tech') || (e.desc || '').includes('FANG')) return '빅테크';
        if ((e.desc || '').includes('금')) return '금';
        return '기타';
    }

    const groups = {};
    ETF_DB.forEach(e => {
        const sector = getSector(e);
        if (!groups[sector]) groups[sector] = [];
        groups[sector].push(e);
    });
    const order = ['반도체','빅테크','에너지','금융','헬스케어','금','기타'];

    list.innerHTML = order.filter(k => groups[k] && groups[k].length).map(sector => {
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
        return `<div class="mt-3 first:mt-0">
            <div class="flex items-center justify-between px-1 mb-2">
                <h4 class="text-xs font-black text-slate-200 tracking-tight">${sector}</h4>
                <span class="text-[10px] text-slate-500">${groups[sector].length}종목</span>
            </div>
            <div class="grid gap-2">${cards}</div>
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
    const list = document.getElementById('recommendationList'); 
    if(!list) return;
    const validData = ETF_DB.filter(e => {
        const md = MARKET_SNAPSHOT[e.sym];
        return md && !md.error && md.price > 0 && md.ma200 > 0 && md.ema8 > 0;
    });
    if(validData.length === 0) return; 

    var candidates = validData.filter(function(e) {
        var md = MARKET_SNAPSHOT[e.sym];
        return md.price > md.ma200 && md.rsi < 55;
    }).map(function(e) {
        var md = MARKET_SNAPSHOT[e.sym];
        var score = 0;
        if (md.price > md.ma200) score += 40;
        if (md.rsi < 55) score += (55 - md.rsi);
        return Object.assign({}, e, md, { score: score });
    }).sort(function(a, b) { return b.score - a.score; }).slice(0, 3); 
    
    if (candidates.length === 0) {
        list.innerHTML = '<div class="glass-panel p-4 text-center text-slate-500 text-xs">조건에 맞는 관심 종목이 없습니다.<br>(MA200 위 · RSI 55 미만)</div>';
        return;
    }

    function labelAndReason(d) {
        var rsi = (d.rsi != null) ? d.rsi.toFixed(0) : '-';
        var reason = 'RSI ' + rsi + ' / MA200 위';
        return { label: '추세 유지 + 눌림 구간', reason: reason };
    }
    function etfShortDesc(d) {
        var desc = (d.desc || '').trim();
        var lev = d.lev;
        var levStr = lev === '3x' ? '3배' : lev === '2x' ? '2배' : (lev === '-3x' || lev === '3x 인버스') ? '인버스 3배' : lev === '1x' ? '1배' : (lev || '');
        return (desc ? desc + ' ' : '') + (levStr ? levStr + ' ETF' : 'ETF');
    }
    
    list.innerHTML = candidates.map(function(d) { 
        var lr = labelAndReason(d);
        var badge = d.lev==='3x'?'badge-3x':(d.lev==='2x'?'badge-2x':'badge-inv'); 
        var shortDesc = etfShortDesc(d);
        return '<div class="glass-panel p-3 rounded-xl flex justify-between items-center border-l-4 border-slate-500 cursor-pointer mb-2 active:bg-slate-800 transition" onclick="openAnalysisModal(\'' + d.sym + '\')"><div><div class="flex items-center gap-2"><span class="font-black text-white">' + d.sym + '</span><span class="text-[10px] px-1.5 py-0.5 rounded font-bold ' + badge + '">' + d.lev + '</span></div><div class="text-[10px] text-slate-500">' + shortDesc + '</div><div class="text-[10px] text-slate-400">' + lr.reason + '</div></div><div class="text-right"><div class="text-sm font-bold text-white">$' + d.price.toFixed(2) + '</div><span class="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">' + lr.label + '</span></div></div>'; 
    }).join('');
}

function updateFearGreed() {
    let vixData = MARKET_SNAPSHOT['^VIX'];
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
    const drops = d.config.drops || [];
    const weights = d.config.weights || [];
    const basePrice = parseFloat(document.getElementById('planBasePrice').value) || d.config.basePrice || 0;
    if (basePrice === 0 || drops.length === 0) return { current: 1, total: totalStages, baseCurrent: 1, baseTotal: stages, boosterCurrent: 0, boosterTotal: boosterOn ? boosterStages : 0 };
    const allocPct = d.config.alloc || 30;
    const investMoney = getTotalEquityUSD() * (allocPct / 100);
    let completed = 0;
    for (let i = 0; i < stages && i < drops.length; i++) {
        const drop = drops[i];
        const weight = (weights[i] != null) ? weights[i] : (100 / stages);
        const targetPrice = basePrice * (1 + drop / 100);
        const amount = investMoney * (weight / 100);
        const targetQty = targetPrice > 0 ? Math.floor(amount / targetPrice) : 0;
        const boughtQty = (d.history || []).filter(h => h.type === 'BUY' && parseInt(h.stage) === (i + 1)).reduce((sum, h) => sum + h.qty, 0);
        if (targetQty > 0 && boughtQty >= targetQty) completed++; else break;
    }
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
            const boughtQty = (d.history || []).filter(h => h.type === 'BUY' && parseInt(h.stage) === stageNum).reduce((sum, h) => sum + h.qty, 0);
            if (targetQty > 0 && boughtQty >= targetQty) completed++; else break;
        }
    }
    const current = Math.min(completed + 1, totalStages);
    const baseCurrent = completed < stages ? (completed + 1) : stages;
    const baseTotal = stages;
    const boosterTotal = boosterOn ? boosterStages : 0;
    const boosterCurrent = completed >= stages ? Math.min(completed - stages + 1, boosterStages) : 0;
    return { current, total: totalStages, baseCurrent, baseTotal, boosterCurrent, boosterTotal };
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
    const stageGrid = '그리드: ' + (stage.baseCurrent || 1) + ' / ' + (stage.baseTotal || 4);
    const stageBooster = (stage.boosterTotal > 0) ? ('부스터: ' + (stage.boosterCurrent || 0) + ' / ' + stage.boosterTotal) : '';
    set('progressStage', stageBooster ? (stageGrid + ' · ' + stageBooster) : stageGrid);
    set('progressExecRate', execRate.toFixed(1) + '%');
    const execBar = document.getElementById('progressExecBar');
    if (execBar) execBar.style.width = Math.min(100, Math.max(0, execRate)) + '%';
    set('progressRemainUsd', '$' + Math.round(remainUsd).toLocaleString());
    set('progressRemainKrw', formatKrw(remainUsd));

    var currentPrice = (MARKET_SNAPSHOT[sym] && MARKET_SNAPSHOT[sym].price > 0) ? MARKET_SNAPSHOT[sym].price : ((d.marketData && d.marketData.price > 0) ? d.marketData.price : (d.avgPrice || 0));
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
    document.getElementById('analysisModal').classList.remove('hidden'); 
    document.getElementById('analysisModal').classList.add('flex'); 
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
    const meta = ETF_DB.find(e => e.sym === ticker) || {group:'B'};

    let currentPrice = md.price > 0 ? md.price : (portfolios[ticker].config.basePrice || 100);
    let baseMdd = 20.0; let stages = 5; let reasons = []; let mode = "GRID";

    if (meta.group === 'A') { baseMdd = 30.0; } 
    else if (meta.group === 'B') { baseMdd = 20.0; } 
    else { baseMdd = 15.0; } 

    let mddRecommend = baseMdd;

    if (currentPrice > md.ma200) { 
        mddRecommend = baseMdd * 0.6; stages = 4; mode = "GRID"; 
        reasons.push("📈 강세장 (200일선 위): 얕은 눌림목 적극 공략 (4단계)"); 
    } else { 
        mddRecommend = baseMdd * 1.5; stages = 6; mode = "BOOSTER"; 
        reasons.push("📉 하락장 (200일선 아래): 지하실 대비 방어전 (6단계)"); 
    }

    const vix = vixData.price;
    if (vix > 35) { mddRecommend += 15.0; stages += 1; reasons.push(`😱 극도공포 (VIX ${vix.toFixed(1)}): 패닉셀 대비 하락폭 확대`); } 
    else if (vix > 25) { mddRecommend += 5.0; reasons.push(`⚠️ 변동성 확대 (VIX ${vix.toFixed(1)}): 간격 소폭 확대`); }

    mddRecommend = Math.min(80, Math.max(10, mddRecommend)); 
    stages = Math.min(10, Math.max(3, stages));
    
    const gap = stages > 1 ? mddRecommend / (stages - 1) : 0; 

    const msg = `[🤖 퀀트 AI 스마트 최적화]\n\n${reasons.join('\n')}\n\n👉 추천 목표 MDD: -${mddRecommend.toFixed(0)}%\n👉 추천 분할 단계: 1차 ~ ${stages}차 (총 ${stages}회 매수)\n👉 1회당 매수 간격: 약 -${gap.toFixed(1)}%\n\n이 전략으로 즉시 적용하시겠습니까?`;
    
    if(confirm(msg)) {
        const d = portfolios[activeTicker];
        d.config.mode = mode; d.config.stages = stages; d.config.mdd = mddRecommend; 
        d.config.drops = [];
        for(let i=0; i<stages; i++) d.config.drops.push(parseFloat(-(gap * i).toFixed(2)));
        
        const weights = Array(stages).fill(Math.floor(100/stages));
        const rem = 100 % stages;
        for(let i=0; i<rem; i++) weights[i]++;
        d.config.weights = weights;

        document.getElementById('configMode').value = mode;
        document.getElementById('configStages').value = stages; 
        document.getElementById('configMdd').value = mddRecommend;
        if(d.config.basePrice === 0) d.config.basePrice = currentPrice;
        
        saveAll(); renderStageInputs(); renderSellPlan();
    }
}

function startAiSimulation() {
    if(!activeTicker) return;
    document.getElementById('aiSimModal').classList.remove('hidden'); document.getElementById('aiSimModal').classList.add('flex');
    const steps = ["시장 추세(MA200) 및 변동성(VIX) 판별 중...", "종목별 성향(Beta) 계수 대조 중...", "MDD 방어선 및 최적 매수 타점 도출 중..."];
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
    
function calculatePlan() {
    const d = portfolios[activeTicker];
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
        
        const boughtQty = (d.history || []).filter(h => h.type === 'BUY' && parseInt(h.stage) === (i+1)).reduce((sum, h) => sum + h.qty, 0);
        let statusBadge = '<span class="text-slate-500 font-bold text-[10px]">대기</span>';
        if(boughtQty >= qty && qty > 0) statusBadge = '<span class="text-emerald-500 font-bold text-[10px]">완료</span>';
        else if(boughtQty > 0) statusBadge = '<span class="text-yellow-500 font-bold text-[10px]">진행</span>';
        
        tbody.innerHTML += `
        <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
            <td class="p-2 text-center text-slate-400 font-medium">${i+1}차 <span class="text-[9px] text-slate-600 block">(${drop.toFixed(2)}%)</span></td>
            <td class="p-2 text-right text-blue-300 font-bold tracking-tight">$${targetPrice.toFixed(2)}</td>
            <td class="p-2 text-right text-white font-bold">${qty}주</td>
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
            const boughtQty = (d.history || []).filter(h => h.type === 'BUY' && parseInt(h.stage) === stageNum).reduce((sum, h) => sum + h.qty, 0);
            let statusBadge = '<span class="text-slate-500 font-bold text-[10px]">대기</span>';
            if (qty > 0 && boughtQty >= qty) statusBadge = '<span class="text-emerald-500 font-bold text-[10px]">완료</span>';
            else if (boughtQty > 0) statusBadge = '<span class="text-yellow-500 font-bold text-[10px]">진행</span>';
            tbody.innerHTML += `
        <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition bg-slate-800/20">
            <td class="p-2 text-center text-slate-500 font-medium">${stageNum}차 <span class="text-[9px] text-red-400/80 block">부스터 (${bDrop.toFixed(2)}%)</span></td>
            <td class="p-2 text-right text-blue-300 font-bold tracking-tight">$${targetPrice.toFixed(2)}</td>
            <td class="p-2 text-right text-white font-bold">${qty}주</td>
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
function confirmAllocation() { const pct = parseFloat(document.getElementById('allocPercent').value)||0; if(pct <= 0) return alert("비중을 입력해주세요."); const sym = tempTickerToAdd || activeTicker; if(sym) { if (!portfolios[sym]) { portfolios[sym] = { qty: 0, avgPrice: 0, history: [], config: { mode: 'GRID', stages: 4, mdd: 20, alloc: pct, drops: [0,-6.67,-13.33,-20], weights: [25,25,25,25], basePrice: 0, boosterOn: false, boosterAllocPct: 0, boosterStages: 2, boosterMdd: 10 } }; } else { portfolios[sym].config.alloc = pct; } saveAll(); if(activeTicker===sym) loadTickerData(sym); } document.getElementById('allocationModal').classList.add('hidden'); document.getElementById('allocationModal').classList.remove('flex'); renderTickerBar(); switchTab('strategy'); selectTicker(sym); }
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
        s.innerHTML += '<option value="1">1차 매도 실행</option><option value="2">2차 매도 실행</option><option value="3">3차 매도 실행</option>';
    }
    document.getElementById('tradePrice').value = '';
    document.getElementById('tradeQty').value = '';
    document.getElementById('tradeFeeDisplay').innerText = '$0.00';
    document.getElementById('tradeTotal').innerText = '$0.00';
    calcTradeTotal();
}
function closeTradeModal() { document.getElementById('tradeModal').classList.add('hidden'); document.getElementById('tradeModal').classList.remove('flex'); }
function autoFillTrade() {
    const stageStr = document.getElementById('tradeStageSelect').value;
    if (stageStr === "") return;
    const type = document.getElementById('tradeType').value;
    const d = portfolios[activeTicker];
    if (type === 'SELL') {
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
        calcTradeTotal();
    }
}
function calcTradeTotal() { const p = parseFloat(document.getElementById('tradePrice').value)||0; const q = parseFloat(document.getElementById('tradeQty').value)||0; const type = document.getElementById('tradeType').value; let feeRate = (globalData && globalData.feeRate) ? globalData.feeRate : 0.07; let useSec = (globalData && globalData.useSec !== undefined) ? globalData.useSec : true; let rate = feeRate/100; if (type === 'SELL' && useSec) rate += 0.0000229; const fee = p*q*rate; const feeDisplay = document.getElementById('tradeFeeDisplay'); if(feeDisplay) feeDisplay.innerText = '$'+fee.toFixed(2); const total = type==='BUY' ? (p*q)+fee : (type==='DIV' ? (p*q) : (p*q)-fee); const totalDisplay = document.getElementById('tradeTotal'); if(totalDisplay) { if(type==='DIV') totalDisplay.innerText = '$'+(p*q).toFixed(2); else totalDisplay.innerText = '$'+total.toLocaleString(undefined,{maximumFractionDigits:2}); } const feeKrw = document.getElementById('tradeFeeKrw'); if(feeKrw) feeKrw.innerText = formatKrw(fee); const totalKrw = document.getElementById('tradeTotalKrw'); if(totalKrw) totalKrw.innerText = formatKrw(type==='DIV' ? (p*q) : total); }
    
function submitTrade() { 
    const d = portfolios[activeTicker]; const type = document.getElementById('tradeType').value; const price = parseFloat(document.getElementById('tradePrice').value); const qty = parseFloat(document.getElementById('tradeQty').value); const date = document.getElementById('tradeDate').value; const memo = document.getElementById('tradeMemo').value; const tag = document.getElementById('tradeTag').value; let stageVal = document.getElementById('tradeStageSelect').value; const stage = stageVal ? parseInt(stageVal) : 0; 
    if(!price || !qty) return; 
    let rate = globalData.feeRate/100; if (type === 'SELL' && globalData.useSec) rate += 0.0000229; const fee = price*qty*rate; const total = type==='BUY' ? (price*qty)+fee : (price*qty)-fee; 
    d.history.push({ id: Date.now().toString(), date, type, price, qty, fee, total, memo, tag, stage }); 
    recalcPortfolio(d); saveAll(); loadTickerData(activeTicker); closeTradeModal(); 
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

function getAggregatedTrades() {
    const list = [];
    if (!portfolios) return list;
    Object.keys(portfolios).forEach(sym => {
        const p = portfolios[sym];
        if (!Array.isArray(p.history)) return;
        p.history.forEach(h => {
            list.push({ ...h, sym });
        });
    });
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
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
    const tickerSelect = document.getElementById('tradelogTicker');
    const tbody = document.getElementById('tradelogTableBody');
    const countEl = document.getElementById('tradelogCount');
    if (!tickerSelect || !tbody) return;

    const all = getAggregatedTrades();
    const tickers = [...new Set(all.map(h => h.sym))].sort();
    tickerSelect.innerHTML = '<option value="">전체 종목</option>';
    tickers.forEach(sym => { tickerSelect.innerHTML += `<option value="${sym}">${sym}</option>`; });

    const filterTicker = (tickerSelect.value || '').trim();
    const filterType = (document.getElementById('tradelogType') && document.getElementById('tradelogType').value) || '';
    const dateFrom = document.getElementById('tradelogDateFrom') && document.getElementById('tradelogDateFrom').value;
    const dateTo = document.getElementById('tradelogDateTo') && document.getElementById('tradelogDateTo').value;

    let filtered = all;
    if (filterTicker) filtered = filtered.filter(h => h.sym === filterTicker);
    if (filterType) filtered = filtered.filter(h => h.type === filterType);
    if (dateFrom) filtered = filtered.filter(h => h.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(h => h.date <= dateTo);

    _tradeLogRows = filtered.map(h => ({
        ...h,
        tagLabel: getTagLabel(h.tag),
        memoText: h.memo || ''
    }));

    tbody.innerHTML = '';
    _tradeLogRows.forEach((row, idx) => {
        const isSell = row.type === 'SELL';
        const profitPct = row.profitPct != null ? (row.profitPct + '%') : '—';
        const reasonShort = truncateStr(row.tagLabel, 8);
        const memoShort = truncateStr(row.memoText, 10);
        const reasonClass = reasonShort.length > 7 ? 'cursor-pointer text-blue-300 hover:underline' : '';
        const memoClass = memoShort.length > 9 ? 'cursor-pointer text-blue-300 hover:underline' : '';
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/50';
        tr.id = 'tradeLogRow_' + idx;
        tr.innerHTML =
            '<td class="p-2 text-center text-slate-300">' + row.date + '</td>' +
            '<td class="p-2 text-center font-bold text-white">' + row.sym + '</td>' +
            '<td class="p-2 text-center"><span class="' + (row.type === 'BUY' ? 'text-red-400' : (row.type === 'DIV' ? 'text-yellow-400' : 'text-blue-400')) + ' font-bold">' + row.type + '</span></td>' +
            '<td class="p-2 text-right text-white">$' + (row.price && row.price.toFixed(2)) + '</td>' +
            '<td class="p-2 text-right text-slate-300">' + row.qty + '</td>' +
            '<td class="p-2 text-right text-slate-300">$' + (row.total != null ? row.total.toFixed(2) : '—') + '</td>' +
            '<td class="p-2 text-right ' + (isSell && row.profitPct != null ? (row.profitPct >= 0 ? 'text-red-400' : 'text-blue-400') : 'text-slate-500') + '">' + profitPct + '</td>' +
            '<td class="p-2 text-left max-w-[80px] truncate ' + reasonClass + '" data-detail-type="reason" data-row-idx="' + idx + '" title="' + (row.tagLabel || '').replace(/"/g, '&quot;') + '">' + reasonShort + '</td>' +
            '<td class="p-2 text-left max-w-[100px] truncate ' + memoClass + '" data-detail-type="memo" data-row-idx="' + idx + '" title="' + (row.memoText || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '">' + memoShort + '</td>';
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-detail-type]').forEach(cell => {
        cell.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-row-idx'), 10);
            const type = this.getAttribute('data-detail-type');
            if (isNaN(idx) || !_tradeLogRows[idx]) return;
            const row = _tradeLogRows[idx];
            const title = type === 'reason' ? '매매 이유' : '심리 메모';
            const content = type === 'reason' ? row.tagLabel : row.memoText;
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
        if(portfolioChart) portfolioChart.destroy(); 
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
function openNewsModal() { document.getElementById('newsModal').classList.remove('hidden'); document.getElementById('newsModal').classList.add('flex'); }
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

