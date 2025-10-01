// storage.js - helpers to persist and load data across tabs via localStorage
const NS = 'NFLSimulator';
const KEYS = {
  teams: `${NS}:teams`,
  players: `${NS}:players`,
  games: `${NS}:games`,
  meta: `${NS}:meta`,
};

export function saveData({ teams, players, games }) {
  if (teams) localStorage.setItem(KEYS.teams, JSON.stringify(teams));
  if (players) localStorage.setItem(KEYS.players, JSON.stringify(players));
  if (games) localStorage.setItem(KEYS.games, JSON.stringify(games));
  const meta = loadMeta();
  const now = new Date().toISOString();
  const newMeta = { ...meta, updatedAt: now, counts: {
    teams: (teams ?? loadTeams())?.length || 0,
    players: (players ?? loadPlayers())?.length || 0,
    games: (games ?? loadGames())?.length || 0
  }};
  localStorage.setItem(KEYS.meta, JSON.stringify(newMeta));
  return newMeta;
}

export function loadTeams() {
  try { return JSON.parse(localStorage.getItem(KEYS.teams) || '[]'); } catch { return []; }
}
export function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(KEYS.players) || '[]'); } catch { return []; }
}
export function loadGames() {
  try { return JSON.parse(localStorage.getItem(KEYS.games) || '[]'); } catch { return []; }
}

export function loadMeta() {
  try { return JSON.parse(localStorage.getItem(KEYS.meta) || '{}'); } catch { return {}; }
}

export function clearAll() {
  localStorage.removeItem(KEYS.teams);
  localStorage.removeItem(KEYS.players);
  localStorage.removeItem(KEYS.meta);
  localStorage.removeItem(KEYS.games);
}

// For other modules
export const STORAGE_KEYS = KEYS;

// ---- v3.7 dataset helpers ----
export function datasetKey(area, sub){
  const a = String(area||'').trim(); const s = String(sub||'').trim();
  return `${NS}:datasets:${a}:${s}`;
}
export function saveDataset(area, sub, rows){
  try { localStorage.setItem(datasetKey(area, sub), JSON.stringify(rows||[])); } catch {}
  const meta = loadMeta();
  const now = new Date().toISOString();
  const key = `${area}:${sub}`;
  const datasets = meta.datasets || {};
  datasets[key] = { updatedAt: now, rows: (rows||[]).length };
  localStorage.setItem(KEYS.meta, JSON.stringify({ ...meta, datasets }));
}
export function loadDataset(area, sub){
  try { return JSON.parse(localStorage.getItem(datasetKey(area, sub)) || '[]'); } catch { return []; }
}
export function listDatasets(){
  try { const m = loadMeta(); return Object.entries(m.datasets||{}).map(([k,v]) => ({ key:k, ...v })); } catch { return []; }
}
