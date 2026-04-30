// public/sw.js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
  // Apenas ignora e deixa o navegador seguir o fluxo normal
  return;
});
