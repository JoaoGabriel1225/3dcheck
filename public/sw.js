// public/sw.js

// Nome do cache (pode mudar quando atualizar o app)
const CACHE_NAME = '3dcheck-v1';

// Evento de Instalação
self.addEventListener('install', (event) => {
  console.log('SW: Instalado');
});

// Evento de Ativação
self.addEventListener('activate', (event) => {
  console.log('SW: Ativado');
});

// Evento de Fetch (Obrigatório para ser instalável)
self.addEventListener('fetch', (event) => {
  // Por enquanto, apenas deixa as requisições passarem normalmente
  event.respondWith(fetch(event.request));
});
