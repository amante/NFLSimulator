// storage.js - helpers to persist and load data across tabs via localStorage
const NS = 'NFLSimulator';
const KEYS = {
  teams: `${NS}:teams`,
  players: `${NS}:players`,
  meta: `${NS}:meta`,
};

export function saveData({ teams, players }) {
  if (teams) localStorage.setItem(KEYS.teams, JSON.stringify(teams));
  if (players) localStorage.setItem(KEYS.players, JSON.stringify(players));
  const meta = loadMeta();
  const now = new Date().toISOString();
  const newMeta = { ...meta, updatedAt: now, counts: {
    teams: (teams ?? loadTeams())?.length || 0,
    players: (players ?? loadPlayers())?.length || 0
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
export function loadMeta() {
  try { return JSON.parse(localStorage.getItem(KEYS.meta) || '{}'); } catch { return {}; }
}

export function clearAll() {
  localStorage.removeItem(KEYS.teams);
  localStorage.removeItem(KEYS.players);
  localStorage.removeItem(KEYS.meta);
}

// For other modules
export const STORAGE_KEYS = KEYS;
