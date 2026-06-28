// UMT 서비스워커 — 설치형(PWA) + 정적 자원 오프라인 폴백
// 전략: 동일 출처 정적 파일은 '네트워크 우선'(최신 코드 유지) → 실패 시 캐시.
// API(워커)·외부 CDN은 캐시하지 않음(항상 최신 시세/분석).
const CACHE = 'umt-cache-v1';

self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부(API/CDN)는 그대로 통과
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () { return caches.match(req); })
  );
});
