// EPL 예측기 서비스워커 — stale-while-revalidate 전략
// index.html과 같은 폴더에 두면 자동으로 등록되어 오프라인에서도 마지막으로 불러온 화면을 볼 수 있습니다.
const CACHE_NAME = "epl-predictor-v1";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js",
  "https://cdn.jsdelivr.net/npm/@babel/standalone@7.25.6/babel.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // 같은 출처(내 앱)나 CDN 스크립트만 캐시 대상으로 삼는다.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      // 캐시가 있으면 즉시 반환(빠른 로딩) + 백그라운드에서 최신화, 없으면 네트워크 응답 대기
      return cached || networkFetch;
    })
  );
});
