// Ajudantes do navegador usados pela TV e pela câmera.
import { PORTFOLIO_URL } from '../config.js';
export const $ = id => document.getElementById(id);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const num = v => (Number.isFinite(v) ? v : 0);
export const rand = (a, b) => a + Math.random() * (b - a);
export const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 14);
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// localStorage pode falhar (aba anônima, cota): o jogo segue sem lembrar.
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

export function wakeLock() { try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {} }
// Link "Conhecer outros projetos": o configurado, ou a raiz do site onde o jogo está.
export const portfolioUrl = () => PORTFOLIO_URL || new URL('/', location.href).href;

export function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

// Reinicia uma animação CSS (remove a classe, força layout, coloca de novo).
export function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
