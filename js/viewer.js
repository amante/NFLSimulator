import { renderTable, sortRows, filterRows } from './table.js';
import { APP_VERSION, BUILD_TIME } from './version.js';
import { loadTeams, loadPlayers, loadMeta, clearAll, loadGames } from './storage.js';


// Show version/build
try {
  document.querySelectorAll('.version-badge').forEach(el => el.textContent = APP_VERSION);
  const meta = document.getElementById('buildMeta');
  if (meta) meta.textContent = `Versión ${APP_VERSION} • build ${BUILD_TIME}`;
  document.title = `${document.title} — ${APP_VERSION}`;
} catch {}

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
  weekFilter: document.getElementById('weekFilter'),
  teamFilter: document.getElementById('teamFilter'),
  exportCSV: document.getElementById('exportCSV'),
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
  populateWeekFilter();
  populateTeamFilter();
  if (!els.datePicker.value){
    const dates = uniqueGameDates();
    if (dates.length){
      els.datePicker.value = dates[0]; // earliest by default
      renderSummaryForDate(dates[0]);
    }
  } else {
    renderSummaryForDate(els.datePicker.value);
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
  const rows = filterRowsByControls(state.games.raw, isoDate);
  if (!rows.length){
    els.gamesTableSummary.classList.add('empty');
    els.gamesTableSummary.innerHTML = '<div class="empty-state">No hay partidos para la selección actual.</div>';
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
  // Info text: show week if unique among filtered rows
  const weeks = Array.from(new Set(rows.map(r => (r['Week'] ?? '').toString()).filter(Boolean)));
  const wkTxt = weeks.length === 1 ? ` • Semana ${weeks[0]}` : (weeks.length > 1 ? ` • Semanas ${weeks.join(', ')}` : '');
  const teamFilterTxt = (els.teamFilter.value && els.teamFilter.value !== 'all') ? ` • Equipo: ${els.teamFilter.value}` : '';
  els.summaryInfo.textContent = `${rows.length} partido(s) para ${isoDate}${wkTxt}${teamFilterTxt}`;
}

function escapeHTML(str) {
  return (str ?? "").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}



function populateWeekFilter(){
  const weeks = Array.from(new Set(state.games.raw.map(g => (g['Week'] ?? '').toString().trim()).filter(Boolean)))
    .sort((a,b)=> Number(a)-Number(b));
  els.weekFilter.innerHTML = `<option value="all">Todas las semanas</option>` + weeks.map(w=>`<option value="${w}">Semana ${w}</option>`).join('');
}
function populateTeamFilter(){
  const teams = new Set();
  state.games.raw.forEach(g => { if (g['AwayTeam']) teams.add(String(g['AwayTeam']).trim()); if (g['HomeTeam']) teams.add(String(g['HomeTeam']).trim()); });
  const list = Array.from(teams).filter(Boolean).sort();
  els.teamFilter.innerHTML = `<option value="all">Todos los equipos</option>` + list.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
}

// Filter rows by active controls (date + optional week/team)
function filterRowsByControls(rows, isoDate){
  let out = rows.filter(g => (g['Date'] || '').toString().startsWith(isoDate));
  const w = els.weekFilter.value;
  const t = els.teamFilter.value;
  if (w && w !== 'all') out = out.filter(g => (g['Week'] ?? '').toString().trim() === w);
  if (t && t !== 'all') out = out.filter(g => (String(g['AwayTeam']).trim() === t) || (String(g['HomeTeam']).trim() === t));
  return out;
}

els.weekFilter.addEventListener('change', () => {
  if (els.tabSummary?.classList.contains('active')) renderSummaryForDate(els.datePicker.value);
});
els.teamFilter.addEventListener('change', () => {
  if (els.tabSummary?.classList.contains('active')) renderSummaryForDate(els.datePicker.value);
});

// Export CSV of the currently filtered games
els.exportCSV.addEventListener('click', () => {
  const iso = els.datePicker.value || uniqueGameDates()[0] || '';
  const rows = filterRowsByControls(state.games.raw, iso);
  const headers = ['Date','Time','Week','AwayTeam','HomeTeam','Venue','Status','ScoreAway','ScoreHome','Spread','Total'];
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => csvEscape(r[h])).join(','))).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `games_${iso || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

function csvEscape(v){
  const s = (v ?? '').toString();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}

