const CACHE_NAME = 'guitar-shell-v';

// 🌟 把所有核心文件、本地库都加进缓存列表
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/layout.css',
  './js/main.js',
  './js/services/db.js',
  './js/components/metronome.js',
  './js/components/sheet-reader.js',
  './js/components/practice-log.js',
  './js/components/tuner.js',
  './js/lib/pdf.js',
  './js/lib/pdf.worker.js',
  './manifest.json'
  // 🌟 换成新图标
  './icon-gShell-32.png',
  './icon-gShell-192.png',
  './icon-gShell-512.png'
];

// 1. 安装 Service Worker 并缓存文件
self.addEventListener('install', (e) => {
  self.skipWaiting(); // 强制新的 SW 立即接管
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('正在将 Guitar Shell 的核心文件写入离线缓存...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('清理旧版本缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 拦截网络请求，优先使用缓存（离线可用）
self.addEventListener('fetch', (e) => {
  // 只拦截 HTTP/HTTPS 请求，且跳过 chrome 扩展的请求
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((response) => {
      // 如果缓存中有，直接返回缓存；如果没有，则去网络请求
      if (response) return response;
      return fetch(e.request);
    })
  );
});
