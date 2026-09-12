import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const host = document.getElementById('root');
if (!host) throw new Error('Root element is missing from index.html');

// Chrome will not offer to install a site without one, and it gives the app a
// readable shell on a bad connection. Registered after load so it never
// competes with the first paint.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // An unregistered worker costs the install offer, nothing else.
    });
  });
}

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
