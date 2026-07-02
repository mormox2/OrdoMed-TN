import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import TermsOfUse from './components/TermsOfUse.tsx';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('ServiceWorker successfully registered:', reg.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/conditions-utilisation' ? <TermsOfUse /> : <App />}
  </StrictMode>,
);
