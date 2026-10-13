// Analytics: Google Analytics 4 quando config.js tem GA_ID; sem ID, nada sai do navegador.
// Os eventos também ficam em `events` (memória), o que permite conferir tudo nos testes (?teste).
import { GA_ID } from '../config.js';

export const events = [];
let role = '';

// Carrega o gtag.js uma vez. role = 'tv' ou 'camera', enviado junto com cada evento.
export function initAnalytics(screenRole) {
  role = screenRole;
  if (!GA_ID || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { app_role: role });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.append(s);
}

// Nomes em snake_case, como o GA4 recomenda. Parâmetros curtos e sem dados pessoais (nada de nome de jogador).
export function track(name, params = {}) {
  const payload = { app_role: role, ...params };
  events.push({ name, ...payload });
  if (events.length > 200) events.shift();
  if (GA_ID && window.gtag) window.gtag('event', name, payload);
}
