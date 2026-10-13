// Ranking: público no Supabase quando config.js tem RANK_URL e RANK_KEY; senão, guardado só neste navegador.
// Os nomes vêm de qualquer pessoa: a tela sempre usa textContent, nunca HTML.
import { RANK_URL, RANK_KEY } from '../config.js';
import { store } from '../shared/util.js';

const LOCAL = 'oop-rank';
const online = Boolean(RANK_URL && RANK_KEY);
// Chave publishable (sb_publishable_…) vai só no apikey; a anon antiga é um JWT e também vai como Bearer.
const headers = { apikey: RANK_KEY, 'Content-Type': 'application/json', ...(RANK_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${RANK_KEY}` } : {}) };
const byScore = (a, b) => b.score - a.score || String(a.created_at).localeCompare(String(b.created_at));

function readLocal() { try { return JSON.parse(store.get(LOCAL) || '[]'); } catch (e) { return []; } }

// entries: [{ name, score, stage, level }]. Também guarda cópia local para quando a rede falhar.
export async function addScores(entries) {
  if (!entries.length) return;
  const created_at = new Date().toISOString();
  store.set(LOCAL, JSON.stringify([...readLocal(), ...entries.map(e => ({ ...e, created_at }))].sort(byScore).slice(0, 300)));
  if (!online) return;
  try {
    await fetch(`${RANK_URL}/rest/v1/scores`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(entries) });
  } catch (e) { console.warn('ranking: não consegui enviar', e); }
}

// Top n do nível. where diz de onde veio: 'online' (todo mundo) ou 'local' (só esta TV).
export async function topScores(level, n = 10) {
  if (online) {
    try {
      const q = `select=name,score,stage,level,created_at&level=eq.${encodeURIComponent(level)}&order=score.desc,created_at.asc&limit=${n}`;
      const r = await fetch(`${RANK_URL}/rest/v1/scores?${q}`, { headers });
      if (r.ok) return { where: 'online', rows: await r.json() };
    } catch (e) { console.warn('ranking: não consegui ler', e); }
  }
  return { where: 'local', rows: readLocal().filter(e => e.level === level).sort(byScore).slice(0, n) };
}
