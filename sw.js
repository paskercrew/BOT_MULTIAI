// Bot Tele MultiAI — Service Worker
const CACHE = "bottelemultiai-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = e.request.url;
  // Don't cache API calls or non-GET — let them go through
  if (
    e.request.method !== "GET" ||
    url.includes("/api/") ||
    url.includes("/v1/chat/completions") ||
    url.includes("/v1/messages") ||
    url.includes("/v1/models") ||
    url.includes("/chat") ||
    url.includes("/health") ||
    url.includes("anthropic.com") ||
    url.includes("localhost") ||
    url.match(/192\.168\./) ||
    url.match(/10\.\d+\./) ||
    url.match(/127\.0\.0\.1/)
  ) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone).catch(() => {}));
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
