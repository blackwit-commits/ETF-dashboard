# UMT V2 — 매크로 기반 ETF 매매 시스템

## 기술 스택
- 프론트엔드: HTML + Tailwind CSS + Vanilla JS (단일 파일: index.html, script.js, style.css)
- 백엔드: Cloudflare Worker (worker/index.js) — Yahoo Finance 가격 API + Google News RSS
- 호스팅: GitHub Pages
- 차트: TradingView 위젯
- 클라우드 동기화: Google Sheets (사용자 설정)

## 프로젝트 구조
```
index.html      — UI (4탭: 홈/전략/매매일지/설정)
script.js       — 전체 앱 로직 (~2400줄)
style.css       — 커스텀 스타일
worker/index.js — Cloudflare Worker (API 프록시)
UMT_V2_PRD.md   — V2 기획서
```

## API 엔드포인트 (Cloudflare Worker)
- `GET /price?ticker={sym}` — 개별 ETF 가격/RSI/MA200/EMA8/ATR
- `GET /news` — Google News RSS 파싱 (10개)
- `GET /macro` �� Claude API 웹서치로 Quad 판정 + 뉴스 브리핑 + 심층분석 (120초 타임아웃)

## localStorage 키
- `umt_v172_global` — 전역 설정 (시드, 환율, 수수료 등)
- `umt_v172_ports` — 포트폴리오 (종목별 보유/설정/매매기록)
- `umt_macro_cache` — /macro 응답 캐시 (12시간 TTL, `_cachedAt` 타임스탬프 포함)

## Cloudflare Worker 환경변수
- `CLAUDE_API_KEY` — Claude API 키 (wrangler secret으로 설정)

## V2 업그레이드 진행 상황

### Phase 1 — MVP
- [x] 1-1. ETF_DB 교체 (22개 → 20개, Quad/Tier 메타데이터 추가)
- [x] 1-2. Cloudflare Worker `/macro` 엔드포인트 (Claude API 웹서치 연동)
- [x] 1-3. 홈 탭 리디자인 (Quad 대시보드 + 3단계 뉴스 브리핑 + 보유종목 HOLD/WATCH/EXIT)
- [x] 1-4. AI 매수 포착 → Quad 기반 추천 + 3가지 기술적 시그널 (TREND/TRADE/가격위치)
- [x] 1-5. 비중 모드 자동 추천 (공격/균등/방어) — Quad 순풍/역풍 + TREND + RSI 기반

### Phase 2 — 고도화
- [ ] 2-1. Quad별 MDD 간격 차등 (프리셋 테이블 연동)
- [ ] 2-2. ETF 상세 정보 바텀시트
- [ ] 2-3. 보유 종목 HOLD/WATCH/EXIT 상태
- [ ] 2-4. 상관관계 경고
- [x] 2-5. 용어 사전/가이드 (설정 탭 — Quad/기술적지표/매크로지표/시스템용어 4개 섹션)

### Phase 3 — 확장
- [ ] 3-1. 주간 리포트
- [ ] 3-2. 이벤트 오버레이 고도화
- [ ] 3-3. 이벤트 캘린더

## 주요 함수 참조
- `initApp()` — 앱 초기화 (script.js:205)
- `sanitizeData()` — 데이터 무결성 검증 (script.js:134)
- `runAiResultLogic()` — MDD 전략 엔진 (script.js:1204)
- `updateRecommendationsUI()` — AI 매수 추천 (script.js:698)
- `updateFearGreed()` — 시장 센티먼트 (script.js:743)
- `renderInitialMarketList()` — ETF 섹터별 리스트 (script.js:612)
- `fetchMarketDataInBackground()` — 시세 폴링 (script.js:315)

## 변경 시 주의사항
- ETF_DB에 새 필드 추가 시 `sanitizeData()`에서 기존 포트폴리오 호환성 확인 필요
- 기존 사용자의 localStorage에 제거된 ETF(FNGU, NVDL 등) 포트폴리오가 남아있을 수 있음
- `group` 필드는 `tier` (1~4)로 대체됨, volAtrAdj 계산식 변경됨
- QUAD_PULLBACK 프리셋은 Phase 2에서 MDD 간격 차등에 사용 예정
