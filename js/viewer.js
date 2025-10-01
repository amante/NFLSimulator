import { renderTable, sortRows, filterRows } from './table.js';
import { loadTeams, loadPlayers, loadMeta, clearAll, loadGames } from './storage.js';

const state = {
  teams: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
  players: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
  games: { raw: [], view: [], sortKey: null, sortDir: 'asc' },
};

  // Tabs
  const tabBtnTeams = document.getElementById('tabBtnTeams');
  const tabBtnPlayers = document.getElementById('tabBtnPlayers');
  const tabBtnSummary = document.getElementById('tabBtnSummary');
  const tabTeams = document.getElementById('tabTeams');
  const tabPlayers = document.getElementById('tabPlayers');
  const tabSummary = document.getElementById('tabSummary');

  function activate(tab){
    const btns = [tabBtnTeams, tabBtnPlayers, tabBtnSummary];
    const panels = [tabTeams, tabPlayers, tabSummary];
    ['teams','players','summary'].forEach((name, idx) => {
      if (tab === name){ btns[idx].classList.add('active'); panels[idx].classList.add('active'); }
      else { btns[idx].classList.remove('active'); panels[idx].classList.remove('active'); }
    });
    if (tab === 'summary') ensureDateInit();
  }
  tabBtnTeams.addEventListener('click', () => activate('teams'));
  tabBtnPlayers.addEventListener('click', () => activate('players'));
  tabBtnSummary.addEventListener('click', () => activate('summary'));


const els = {
  teamsTable: document.getElementById('teamsTableV'),
  playersTable: document.getElementById('playersTableV'),
  teamsSearch: document.getElementById('teamsSearchV'),
  playersSearch: document.getElementById('playersSearchV'),
  refreshTeams: document.getElementById('refreshTeams'),
  refreshPlayers: document.getElementById('refreshPlayers'),
  clearData: document.getElementById('clearData'),
  metaInfo: document.getElementById('metaInfo'),
  tabBtnSummary: document.getElementById('tabBtnSummary'),
  tabSummary: document.getElementById('tabSummary'),
  datePicker: document.getElementById('datePicker'),
  prevDay: document.getElementById('prevDay'),
  nextDay: document.getElementById('nextDay'),
  gamesTableSummary: document.getElementById('gamesTableSummary'),
  refreshGames: document.getElementById('refreshGames'),
  summaryInfo: document.getElementById('summaryInfo'),
};

  // Tabs
  const tabBtnTeams = document.getElementById('tabBtnTeams');
  const tabBtnPlayers = document.getElementById('tabBtnPlayers');
  const tabBtnSummary = document.getElementById('tabBtnSummary');
  const tabTeams = document.getElementById('tabTeams');
  const tabPlayers = document.getElementById('tabPlayers');
  const tabSummary = document.getElementById('tabSummary');

  function activate(tab){
    const btns = [tabBtnTeams, tabBtnPlayers, tabBtnSummary];
    const panels = [tabTeams, tabPlayers, tabSummary];
    ['teams','players','summary'].forEach((name, idx) => {
      if (tab === name){ btns[idx].classList.add('active'); panels[idx].classList.add('active'); }
      else { btns[idx].classList.remove('active'); panels[idx].classList.remove('active'); }
    });
    if (tab === 'summary') ensureDateInit();
  }
  tabBtnTeams.addEventListener('click', () => activate('teams'));
  tabBtnPlayers.addEventListener('click', () => activate('players'));
  tabBtnSummary.addEventListener('click', () => activate('summary'));


function loadAll() {
  state.teams.raw = loadTeams();
  state.players.raw = loadPlayers();
  state.games.raw = loadGames();
  state.teams.view = state.teams.raw;
  state.players.view = state.players.raw;
  state.games.view = state.games.raw;
  updateMeta();
  renderTeams();
  renderPlayers();
  // init summary if tab is active
  if (document.getElementById('tabSummary')?.classList.contains('active')) ensureDateInit();
}

function updateMeta() {
  const meta = loadMeta();
  if (meta?.updatedAt) {
    const t = new Date(meta.updatedAt);
    const counts = meta.counts || {teams: state.teams.raw.length, players: state.players.raw.length};

  // Tabs
  const tabBtnTeams = document.getElementById('tabBtnTeams');
  const tabBtnPlayers = document.getElementById('tabBtnPlayers');
  const tabBtnSummary = document.getElementById('tabBtnSummary');
  const tabTeams = document.getElementById('tabTeams');
  const tabPlayers = document.getElementById('tabPlayers');
  const tabSummary = document.getElementById('tabSummary');

  function activate(tab){
    const btns = [tabBtnTeams, tabBtnPlayers, tabBtnSummary];
    const panels = [tabTeams, tabPlayers, tabSummary];
    ['teams','players','summary'].forEach((name, idx) => {
      if (tab === name){ btns[idx].classList.add('active'); panels[idx].classList.add('active'); }
      else { btns[idx].classList.remove('active'); panels[idx].classList.remove('active'); }
    });
    if (tab === 'summary') ensureDateInit();
  }
  tabBtnTeams.addEventListener('click', () => activate('teams'));
  tabBtnPlayers.addEventListener('click', () => activate('players'));
  tabBtnSummary.addEventListener('click', () => activate('summary'));

    els.metaInfo.textContent = `Última actualización: ${t.toLocaleString()} • Equipos: ${counts.teams} • Jugadores: ${counts.players}`;
  } else {
    els.metaInfo.textContent = '';
  }
}

function renderTeams() {
  renderTable(els.teamsTable, maybeSort('teams'), key => toggleSort('teams', key), row => openProfile('team', row['Team'] || row['TEAM'] || row['team']));
}
function renderPlayers() {
  renderTable(els.playersTable, maybeSort('players'), key => toggleSort('players', key), row => openProfile('player', row['Player'] || row['PLAYER'] || row['player']));
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


function openProfile(kind, id) {
  if (!id) return;
  const url = new URL('profile.html', window.location.href);
  url.searchParams.set('type', kind);
  url.searchParams.set('id', id);
  window.open(url.toString(), '_blank');
}


// ===== Summary (games by date) =====
function ensureDateInit(){
  if (!els.datePicker.value){
    const dates = uniqueGameDates();
    if (dates.length){
      els.datePicker.value = dates[0]; // earliest by default
      renderSummaryForDate(dates[0]);
    }
  }
}

function uniqueGameDates(){
  const set = new Set();
  state.games.raw.forEach(g => {
    const d = (g['Date'] || '').toString().slice(0,10);
    if (d) set.add(d);
  });
  return Array.from(set).sort();
}

function adjustDate(days){
  const cur = els.datePicker.value || new Date().toISOString().slice(0,10);
  const d = new Date(cur + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const da = String(d.getUTCDate()).padStart(2,'0');
  const iso = `${y}-${m}-${da}`;
  els.datePicker.value = iso;
  renderSummaryForDate(iso);
}

els.datePicker.addEventListener('change', () => {
  const v = els.datePicker.value;
  renderSummaryForDate(v);
});
els.prevDay.addEventListener('click', () => adjustDate(-1));
els.nextDay.addEventListener('click', () => adjustDate(1));
els.refreshGames.addEventListener('click', () => {
  state.games.raw = loadGames();
  renderSummaryForDate(els.datePicker.value || uniqueGameDates()[0] || '');
});

function renderSummaryForDate(isoDate){
  const rows = state.games.raw.filter(g => (g['Date'] || '').toString().startsWith(isoDate));
  if (!rows.length){
    els.gamesTableSummary.classList.add('empty');
    els.gamesTableSummary.innerHTML = '<div class="empty-state">No hay partidos para esta fecha.</div>';
    els.summaryInfo.textContent = '';
    return;
  }
  els.gamesTableSummary.classList.remove('empty');
  const headers = ['Time','AwayTeam','HomeTeam','Status','Score'];
  const htmlRows = rows.map(r => {
    const score = (r['ScoreAway'] && r['ScoreHome']) ? `${r['ScoreAway']} - ${r['ScoreHome']}` : (r['Status'] || '—');
    const time = r['Time'] || '—';
    const away = escapeHTML(r['AwayTeam'] || '');
    const home = escapeHTML(r['HomeTeam'] || '');
    const status = escapeHTML(r['Status'] || '');
    return `<tr>
      <td>${escapeHTML(time)}</td>
      <td><a href="#" data-kind="team" data-id="${away}">${away}</a></td>
      <td><a href="#" data-kind="team" data-id="${home}">${home}</a></td>
      <td>${status}</td>
      <td>${escapeHTML(score)}</td>
    </tr>`;
  }).join('');
  els.gamesTableSummary.innerHTML = `<table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${htmlRows}</tbody></table>`;
  els.gamesTableSummary.querySelectorAll('a[data-kind="team"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openProfile('team', a.getAttribute('data-id'));
    });
  });
  // Info text
  const wk = rows[0]['Week'] ? ` • Semana ${rows[0]['Week']}` : '';
  els.summaryInfo.textContent = `${rows.length} partido(s) para ${isoDate}${wk}`;
}

function escapeHTML(str) {
  return (str ?? "").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

