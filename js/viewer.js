import { renderTable } from './table.js';
import { APP_VERSION, BUILD_TIME } from './version.js';
import { loadTeams, loadPlayers, loadMeta } from './storage.js';
import { SCHEDULE_2025 } from './schedule.js';
import { loadCachedSchedule, loadSchedule2025 } from './scheduleLoader.js';

// ---- Version badge / title ----
try {
  document.querySelectorAll('.version-badge').forEach(el => el.textContent = APP_VERSION);
  const meta = document.getElementById('buildMeta');
  if (meta) meta.textContent = `Versión ${APP_VERSION} • build ${BUILD_TIME}`;
  document.title = `${document.title} — ${APP_VERSION}`;
} catch {}

// ---- Elements ----
const els = {
  teamsTable: document.getElementById('teamsTable'),
  playersTable: document.getElementById('playersTable'),
  metaInfo: document.getElementById('metaInfo'),

  // Summary
  datePicker: document.getElementById('summaryDate'),
  summaryTable: document.getElementById('summaryTable'),
  refreshGames: document.getElementById('refreshGames'),
};

// ---- State ----
const state = {
  teams: { raw: [] },
  players: { raw: [] },
  games: { raw: [] }
};

// ---- Tabs (guarded single init) ----
if (!window.__viewerTabsInit) {
  window.__viewerTabsInit = true;
  const tabBtnTeams = document.getElementById('tabBtnTeams');
  const tabBtnPlayers = document.getElementById('tabBtnPlayers');
  const tabBtnSummary = document.getElementById('tabBtnSummary');
  const tabTeams = document.getElementById('tabTeams');
  const tabPlayers = document.getElementById('tabPlayers');
  const tabSummary = document.getElementById('tabSummary');

  function activateTab(which) {
    const btns = [tabBtnTeams, tabBtnPlayers, tabBtnSummary];
    const panels = [tabTeams, tabPlayers, tabSummary];
    const names = ['teams','players','summary'];
    names.forEach((name, i) => {
      if (which === name) { btns[i]?.classList.add('active'); panels[i]?.classList.add('active'); }
      else { btns[i]?.classList.remove('active'); panels[i]?.classList.remove('active'); }
    });
    if (which === 'summary') ensureDateInit();
  }

  tabBtnTeams?.addEventListener('click', () => activateTab('teams'));
  tabBtnPlayers?.addEventListener('click', () => activateTab('players'));
  tabBtnSummary?.addEventListener('click', () => activateTab('summary'));

  // default
  activateTab('teams');
}

// ---- Helpers ----
function updateMetaInfo(counts) {
  if (!els.metaInfo) return;
  if (counts) {
    const now = new Date().toLocaleString();
    els.metaInfo.textContent = `Última actualización: ${now} • Equipos: ${counts.teams} • Jugadores: ${counts.players}`;
  } else {
    els.metaInfo.textContent = '';
  }
}

// ---- Loaders ----
async function loadAll() {
  try {
    const teams = await loadTeams();
    const players = await loadPlayers();
    state.teams.raw = Array.isArray(teams) ? teams : [];
    state.players.raw = Array.isArray(players) ? players : [];

    // schedule (use cache, else JSON-only loader, else embedded sample)
    let games = loadCachedSchedule();
    if (!Array.isArray(games) || !games.length) {
      try { games = await loadSchedule2025(); } catch { games = []; }
    }
    if (!Array.isArray(games) || !games.length) games = Array.isArray(SCHEDULE_2025) ? SCHEDULE_2025 : [];
    state.games.raw = games;

    updateMetaInfo({ teams: state.teams.raw.length, players: state.players.raw.length });
    renderTeams();
    renderPlayers();
    ensureDateInit();
  } catch (e) {
    console.warn('loadAll failed', e);
  }
}

// ---- Renderers ----
function renderTeams() {
  if (!els.teamsTable) return;
  const rows = Array.isArray(state.teams.raw) ? state.teams.raw : [];
  renderTable(els.teamsTable, rows, (row) => {
    // placeholder for future: open team profile
    console.log('team row click', row);
  }, null);
}

function renderPlayers() {
  if (!els.playersTable) return;
  const rows = Array.isArray(state.players.raw) ? state.players.raw : [];
  renderTable(els.playersTable, rows, (row) => {
    // placeholder for future: open player profile
    console.log('player row click', row);
  }, null);
}

// ---- Summary (Schedule by date) ----
function uniqueGameDates() {
  const set = new Set((state.games.raw || []).map(g => g.Date).filter(Boolean));
  return Array.from(set).sort();
}

function renderSummaryForDate(dateISO) {
  if (!els.summaryTable || !dateISO) return;
  const rows = (state.games.raw || []).filter(g => g.Date === dateISO).map(g => ({
    TimeET: g.TimeET || '—',
    Away: g.AwayTeam,
    Home: g.HomeTeam,
    Network: g.Network || '—',
    Notes: g.Notes || ''
  }));
  renderTable(els.summaryTable, rows, () => {}, null);
}

function ensureDateInit() {
  if (!els.datePicker) return;
  const dates = uniqueGameDates();
  els.datePicker.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
  const first = dates[0] || '';
  els.datePicker.value = els.datePicker.value || first;
  renderSummaryForDate(els.datePicker.value);
}

els.datePicker?.addEventListener('change', () => renderSummaryForDate(els.datePicker.value));
els.refreshGames?.addEventListener('click', async () => {
  let games = loadCachedSchedule();
  if (!Array.isArray(games) || !games.length) {
    try { games = await loadSchedule2025(); } catch { games = state.games.raw || []; }
  }
  state.games.raw = games;
  ensureDateInit();
});

// ---- Kickoff ----
loadAll();
