import { renderTable, sortRows, filterRows } from './table.js';
import { loadTeams, loadPlayers, loadMeta, clearAll } from './storage.js';

const state = {
  teams: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
  players: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
};

const els = {
  teamsTable: document.getElementById('teamsTableV'),
  playersTable: document.getElementById('playersTableV'),
  teamsSearch: document.getElementById('teamsSearchV'),
  playersSearch: document.getElementById('playersSearchV'),
  refreshTeams: document.getElementById('refreshTeams'),
  refreshPlayers: document.getElementById('refreshPlayers'),
  clearData: document.getElementById('clearData'),
  metaInfo: document.getElementById('metaInfo'),
};

function loadAll() {
  state.teams.raw = loadTeams();
  state.players.raw = loadPlayers();
  state.teams.view = state.teams.raw;
  state.players.view = state.players.raw;
  updateMeta();
  renderTeams();
  renderPlayers();
}

function updateMeta() {
  const meta = loadMeta();
  if (meta?.updatedAt) {
    const t = new Date(meta.updatedAt);
    const counts = meta.counts || {teams: state.teams.raw.length, players: state.players.raw.length};
    els.metaInfo.textContent = `Última actualización: ${t.toLocaleString()} • Equipos: ${counts.teams} • Jugadores: ${counts.players}`;
  } else {
    els.metaInfo.textContent = '';
  }
}

function renderTeams() {
  renderTable(els.teamsTable, maybeSort('teams'), key => toggleSort('teams', key));
}
function renderPlayers() {
  renderTable(els.playersTable, maybeSort('players'), key => toggleSort('players', key));
}
function maybeSort(kind) {
  const s = state[kind];
  if (!s.sortKey) return s.view;
  return sortRows(s.view, s.sortKey, s.sortDir);
}
function toggleSort(kind, key) {
  const s = state[kind];
  if (s.sortKey === key) {
    s.sortDir = s.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    s.sortKey = key; s.sortDir = 'asc';
  }
  if (kind === 'teams') renderTeams(); else renderPlayers();
}

// Search handlers
els.teamsSearch.addEventListener('input', () => {
  const q = els.teamsSearch.value;
  state.teams.view = filterRows(state.teams.raw, q);
  renderTeams();
});
els.playersSearch.addEventListener('input', () => {
  const q = els.playersSearch.value;
  state.players.view = filterRows(state.players.raw, q);
  renderPlayers();
});

// Refresh / Clear
els.refreshTeams.addEventListener('click', loadAll);
els.refreshPlayers.addEventListener('click', loadAll);
els.clearData.addEventListener('click', () => {
  if (confirm('Esto borrará los datos locales (equipos y jugadores). ¿Continuar?')) {
    clearAll();
    loadAll();
  }
});

// Live update if another tab saves
window.addEventListener('storage', (e) => {
  if (!e.key) return;
  // Just reload everything to keep it simple
  loadAll();
});

// init
loadAll();
