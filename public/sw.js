// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

/**
 * A mágica para acabar com o carregamento infinito e lentidão:
 * Separamos o que precisa de internet (Loja) do que pode ser rápido (Arquivos do App).
 */
self.addEventListener('fetch', (event) => {
  // 1. ESTRATÉGIA PARA NAVEGAÇÃO (Páginas e Loja Digital)
  // Quando o usuário muda de página, tentamos SEMPRE a rede primeiro.
  // Isso evita que a loja fique "presa" em um carregamento antigo ou infinito.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se a rede falhar totalmente (offline), ele mostra a página inicial do cache
        return caches.match('/');
      })
    );
    return;
  }

  // 2. ESTRATÉGIA PARA ATIVOS (Imagens, Scripts, CSS)
  // Aqui usamos "Cache Primeiro". Se o ícone já está no celular, ele abre instantâneo.
  // Isso resolve a demora de carregamento que você sentiu no celular.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
