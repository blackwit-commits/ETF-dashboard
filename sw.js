// UMT 서비스워커 — 설치형(PWA) + 정적 자원 오프라인 폴백
// 핵심: HTML 문서는 HTTP 캐시를 우회(no-store)해 '켤 때마다 최신' → 배포 즉시 반영.
//      그 외 동일 출처 자원은 네트워크 우선 → 실패 시 캐시. API/CDN은 그대로 통과.
const CACHE = 'umt-cache-v2';

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

  var isDoc = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isDoc) {
    // HTML은 항상 최신(HTTP 캐시 우회). 오프라인이면 캐시 폴백.
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }
  // 그 외 정적 자원: 네트워크 우선 → 실패 시 캐시
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      return res;
    }).catch(function () { return caches.match(req); })
  );
});
