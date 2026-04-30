import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- CAPTURA GLOBAL DO PWA ---
// Capturamos o evento de instalação no ponto mais alto da aplicação.
// Isso evita que a Sidebar "perca" o sinal de instalação do navegador.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Guardamos o evento globalmente para ser usado por qualquer componente
  (window as any).deferredPrompt = e;
  console.log('✅ 3DCheck: Sinal de instalação capturado e guardado globalmente!');
});

// Renderização principal do React
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// --- CÓDIGO PARA O APP (PWA) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('3DCheck PWA: Service Worker registrado!', registration.scope);
      })
      .catch((error) => {
        console.log('Erro ao registrar o Service Worker:', error);
      });
  });
}
