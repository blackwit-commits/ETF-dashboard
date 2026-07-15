# UMT V2 — 매크로 기반 ETF 매매 시스템

## 기술 스택
- 프론트엔드: HTML + Tailwind CSS + Vanilla JS (index.html, script.js, style.css)
- 백엔드: Cloudflare Worker (worker/index.js) — Yahoo Finance + Gemini AI + Google Sheets 프록시
- AI: Gemini Flash 2.5 + Google Search Grounding (매크로 분석 + 주간 리포트)
- 호스팅: GitHub Pages (https://blackwit-commits.github.io/ETF-dashboard/)
- 차트: TradingView 위젯
- 클라우드 동기화: Google Sheets (Worker /sync 프록시 경유)

## 프로젝트 구조
```
index.html        — UI (4탭: 홈/전략/매매일지/설정)
script.js         — 전체 앱 로직
style.css         — 커스텀 스타일
worker/index.js   — Cloudflare Worker (5개 엔드포인트)
worker/wrangler.toml — Worker 배포 설정
UMT_V2_PRD.md     — V2 기획서
```

## API 엔드포인트 (Cloudflare Worker)
- `GET /price?ticker={sym}` — 개별 ETF 가격/RSI/MA200/EMA8/ATR (Yahoo Finance)
- `GET /news` — Bing News RSS 파싱 (글로벌 경제/지정학 뉴스 10개)
- `GET /macro` — Gemini AI Quad 판정 + 뉴스 브리핑 + 심층분석
- `GET /weekly` — Gemini AI 주간 리포트
- `GET|POST /sync?url={sheetUrl}` — Google Sheets 프록시 (POST 302 리다이렉트 해결)

## Cloudflare Worker 환경변수
- `GEMINI_API_KEY` — Gemini API 키 (wrangler secret)

## localStorage 키
- `umt_v172_global` — 전역 설정 (시드, 환율, 수수료 등)
- `umt_v172_ports` — 포트폴리오 (종목별 보유/설정/매매기록)
- `umt_macro_cache` — /macro 응답 캐시 (12시간 TTL)
- `umt_weekly_cache` — /weekly 응답 캐시 (24시간 TTL)
- `umt_sync_url` — Google Sheets 동기화 URL

## V2 업그레이드 완료 현황

### Phase 1 — MVP (완료)
- [x] 1-1. ETF_DB 교체 (22개 → 20개, Quad/Tier 메타데이터)
- [x] 1-2. Worker `/macro` 엔드포인트 (Gemini Flash 2.5 + Google Search Grounding)
- [x] 1-3. 홈 탭 Quad 대시보드 + 3단계 뉴스 브리핑 + HOLD/WATCH/EXIT
- [x] 1-4. AI 매수 포착 → Quad 기반 추천 + 기술적 시그널 (TREND/TRADE/가격위치)
- [x] 1-5. 비중 모드 자동 추천 (공격/균등/방어)

### Phase 2 — 고도화 (완료)
- [x] 2-1. Quad별 MDD 간격 차등 (QUAD_PULLBACK 프리셋 연동)
- [x] 2-2. ETF 상세 정보 바텀시트 (ETF_DETAIL 20개 + 분석 모달)
- [x] 2-3. 보유 종목 HOLD/WATCH/EXIT 상태
- [x] 2-4. 상관관계 경고 (CORRELATION_MAP + 종목 추가 시 confirm)
- [x] 2-5. 용어 사전/가이드 (설정 탭 4개 아코디언)

### Phase 3 — 확장 (완료)
- [x] 3-1. 주간 리포트 (Worker /weekly + 홈 탭 UI + 24시간 캐시)
- [x] 3-2. 이벤트 오버레이 고도화 (EVENT_OVERLAY_BOOST 5개 유형)
- [x] 3-3. 이벤트 캘린더 (타임라인 뷰 + 날짜별 그룹핑)

### 추가 완료 항목 (PRD 외)
- [x] Gemini Flash 2.5 전환 (Claude → Gemini, 무료 tier)
- [x] Google Sheets 동기화 수정 (Worker /sync 프록시)
- [x] 뉴스 전광판 Bing News 전환 (Google News 차단 대응)
- [x] 매매일지 카드형 + 월별 접기/펼치기
- [x] ETF 리스트 Quad별 접기/펼치기 (현재 Quad 자동 펼침)
- [x] 매도 시그널 3가지 트리거 (Quad 전환/MA200 이탈/익절 목표)
- [x] 부스터 수동 전환 + 조건부 권장 알림
- [x] 누적 평균 환율 (설정 탭)
- [x] 계획가/실제매수가 슬래시 구분 + 간격 축소
- [x] 스마트 최적화 confirm 복원
- [x] 실시간 VIX 표시
- [x] 매수/매도 모달 메모/태그 초기화
- [x] 코드 정리 (미사용 함수 + DEBUG 로그 제거)
- [x] JS 구문 오류 수정 (DEBUG 로그 제거 시 잔여 객체 리터럴 3곳 삭제)

## 변경 시 주의사항
- ETF_DB 필드: sym, lev, tier(1~4), quad(배열), name, desc, holdings
- `group` (A/B/C) → `tier` (1~4)로 대체됨
- 부스터는 자동 활성화 안 됨 (사용자 수동 판단)
- Worker 배포: `cd worker && npx wrangler@4.40.0 deploy --outdir dist` (최신 wrangler 4.111은 이 PC의 Node 24에서 크래시 — 4.40.0 고정. 종료 코드 9는 종료 시점 libuv 크래시로 무해, "Deployed" 출력 여부로 성공 판단)
- GitHub Pages 캐시: URL에 `?v=N` 붙여서 강제 새로고침
