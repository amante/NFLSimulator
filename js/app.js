import { parseCSV, toJSON } from './csv.js';
import { saveData, loadTeams, loadPlayers } from './storage.js';
import { renderTable, sortRows, filterRows } from './table.js';

const state = {
  teams: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
  players: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
  games: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
};

const els = {
  teamsFile: document.getElementById('teamsFile'),
  playersFile: document.getElementById('playersFile'),
  gamesFile: document.getElementById('gamesFile'),
  teamsTable: document.getElementById('teamsTable'),
  playersTable: document.getElementById('playersTable'),
  gamesTable: document.getElementById('gamesTable'),
  teamsSearch: document.getElementById('teamsSearch'),
  playersSearch: document.getElementById('playersSearch'),
  gamesSearch: document.getElementById('gamesSearch'),
  teamsDownloadJSON: document.getElementById('teamsDownloadJSON'),
  playersDownloadJSON: document.getElementById('playersDownloadJSON'),
  gamesDownloadJSON: document.getElementById('gamesDownloadJSON'),
  exportProject: document.getElementById('exportProject'),
};

initUploader(document.querySelector('.uploader[data-target="teams"]'), handleTeamsFile);
initUploader(document.querySelector('.uploader[data-target="players"]'), handlePlayersFile);
initUploader(document.querySelector('.uploader[data-target="games"]'), handleGamesFile);

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

els.gamesSearch.addEventListener('input', () => {
  const q = els.gamesSearch.value;
  state.games.view = filterRows(state.games.raw, q);
  renderGames();
});

els.teamsDownloadJSON.addEventListener('click', () => downloadJSON(state.teams.view, 'teams.json'));
els.playersDownloadJSON.addEventListener('click', () => downloadJSON(state.players.view, 'players.json'));
els.gamesDownloadJSON.addEventListener('click', () => downloadJSON(state.games.view, 'games.json'));

els.exportProject.addEventListener('click', exportHTMLSnapshot);
// Intentar hidratar desde storage al cargar (por si hay datos previos)
try {
  const t = loadTeams();
  const p = loadPlayers();
  if (t?.length) { state.teams.raw = t; state.teams.view = t; renderTeams(); }
  if (p?.length) { state.players.raw = p; state.players.view = p; renderPlayers(); }
  try { const g = loadGames(); if (g?.length) { state.games.raw = g; state.games.view = g; renderGames(); } } catch {}
} catch {}


function initUploader(dropzone, onFile) {
  const input = dropzone.querySelector('input[type="file"]');
  dropzone.addEventListener('dragenter', e => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.classList.remove('drag'); });
  dropzone.addEventListener('drop', async e => {
    e.preventDefault(); dropzone.classList.remove('drag');
    const file = e.dataTransfer.files?.[0];
    if (file) await onFile(file);
  });
  input.addEventListener('change', async () => {
    if (input.files?.[0]) await onFile(input.files[0]);
  });
}

async function handleTeamsFile(file) {
  const text = await file.text();
  const { rows } = parseCSV(text);
  state.teams.raw = rows;
  state.teams.view = rows;
  saveData({ teams: rows });
  renderTeams();
}

async function handlePlayersFile(file) {
  const text = await file.text();
  const { rows } = parseCSV(text);
  state.players.raw = rows;
  state.players.view = rows;
  saveData({ players: rows });
  renderPlayers();
}

function renderTeams() {
  renderTable(els.teamsTable, maybeSort('teams'), key => toggleSort('teams', key));
}
function renderPlayers() {
  renderTable(els.playersTable, maybeSort('players'), key => toggleSort('players', key));
}
function renderGames() {
  renderTable(els.gamesTable, maybeSort('games'), key => toggleSort('games', key));
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

function downloadJSON(data, filename) {
  const blob = new Blob([toJSON(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Exporta un HTML estático con los datos actualmente visibles para compartir un snapshot
function exportHTMLSnapshot() {
  const snapshot = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Snapshot NFL Stats</title><style>${document.querySelector('link[href$="styles.css"]') ? '' : ''}</style></head>
<body>
  <h1>Snapshot NFL Stats</h1>
  <h2>Equipos</h2>
  ${tableHTML(state.teams.view)}
  <h2>Jugadores</h2>
  ${tableHTML(state.players.view)}
</body></html>`;
  const blob = new Blob([snapshot], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nfl-stats-snapshot.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

function tableHTML(rows){
  if (!rows?.length) return '<p>(sin datos)</p>';
  const headers = Object.keys(rows[0]);
  const thead = `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${escapeHTML(r[h])}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table border="1" cellpadding="6" cellspacing="0">${thead}${tbody}</table>`;
}

function escapeHTML(str) {
  return (str ?? "").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Módulo futuro: fuente de datos por API
export const dataSource = {
  // Ejemplo de interfaz que podrás implementar más adelante
  async fetchFromAPI(endpoint, params = {}) {
    // TODO: implementar llamada real a la API de tu proveedor
    // const url = new URL(endpoint);
    // Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    // const res = await fetch(url, { headers: { 'Authorization': 'Bearer TU_TOKEN' } });
    // return await res.json();
    return Promise.resolve({ ok: true, message: 'Simulación API: aún no implementado.' });
  }
};


async function handleGamesFile(file) {
  const text = await file.text();
  const { rows } = parseCSV(text);
  // normalize Date to YYYY-MM-DD if possible (optional)
  rows.forEach(r => {
    if (r['Date']) {
      const s = String(r['Date']).trim();
      // try parse known formats
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) {
        const d = new Date(s);
        if (!isNaN(d)) {
          const y = d.getFullYear();
          const mo = String(d.getMonth()+1).padStart(2,'0');
          const da = String(d.getDate()).padStart(2,'0');
          r['Date'] = `${y}-${mo}-${da}`;
        }
      }
    }
  });
  state.games.raw = rows;
  state.games.view = rows;
  saveData({ games: rows });
  renderGames();
}
