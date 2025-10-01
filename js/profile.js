
// Show version/build
try {
  document.querySelectorAll('.version-badge').forEach(el => el.textContent = APP_VERSION);
  const meta = document.getElementById('buildMeta');
  if (meta) meta.textContent = `Versión ${APP_VERSION} • build ${BUILD_TIME}`;
  document.title = `${document.title} — ${APP_VERSION}`;
} catch {}

import { loadTeams, loadPlayers } from './storage.js';
import { APP_VERSION, BUILD_TIME } from './version.js';
import { renderBarChart } from './charts.js';

const params = new URLSearchParams(location.search);
const kind = params.get('type'); // 'team' | 'player'
const id = params.get('id');

const els = {
  titleName: document.getElementById('titleName'),
  kindBadge: document.getElementById('kindBadge'),
  metaKV: document.getElementById('metaKV'),
  chartMain: document.getElementById('chartMain'),
  copyLink: document.getElementById('copyLink'),
};

function init(){
  if (!kind || !id) {
    els.titleName.textContent = 'Parámetros inválidos.';
    return;
  }
  els.kindBadge.textContent = kind === 'team' ? 'EQUIPO' : 'JUGADOR';
  const rec = (kind === 'team' ? loadTeams() : loadPlayers()).find(r =>
    String(r['Team'] || r['TEAM'] || r['team'] || r['Player'] || r['PLAYER'] || r['player']) === id
  );
  if (!rec) {
    els.titleName.textContent = `No se encontró ${kind} "${id}".`;
    return;
  }
  els.titleName.innerHTML = `<b>${escapeHTML(id)}</b>` + (kind==='player' && rec['Team'] ? ` <span class="badge team">${escapeHTML(rec['Team'])}</span>` : '' ) + (kind==='player' && rec['Pos'] ? ` <span class="badge pos">${escapeHTML(rec['Pos'])}</span>` : '');

  // Render meta (show up to 10 fields, prioritizing common keys)
  const keysPreferred = kind==='team'
    ? ['Team','Att','Cmp','Cmp%','Yds/Att','PassYds','TD','INT','Rate','1st','1st%','20+','40+','Lng','Sck','SckY']
    : ['Player','Team','Pos','GP','PassAtt','PassYds','PassTD','INT','RushAtt','RushYds','RushTD','Rec','RecYds','RecTD','Tackles','Sacks','DefINT','FantasyPts'];

  const kv = [];
  const presentKeys = Object.keys(rec);
  for (const k of keysPreferred){
    if (presentKeys.includes(k)) kv.push([k, rec[k]]);
  }
  // Fallback include rest (limit)
  for (const k of presentKeys){
    if (!keysPreferred.includes(k) && kv.length < 18) kv.push([k, rec[k]]);
  }
  els.metaKV.innerHTML = kv.slice(0, 18).map(([k,v]) => `<div><b>${escapeHTML(k)}</b>${escapeHTML(v)}</div>`).join('');

  // Build chart series: pick numeric fields and limit to 8
  const numericKeys = Object.keys(rec).filter(k => isFinite(normalizeNumber(rec[k])));
  // Prioritize common metrics
  const priority = kind==='team'
    ? ['PassYds','TD','INT','Rate','Sck','Att','Cmp','Yds/Att']
    : ['PassYds','PassTD','INT','RushYds','RushTD','RecYds','RecTD','FantasyPts','Tackles','Sacks','DefINT'];

  const ordered = [...new Set([...priority, ...numericKeys])];
  const series = ordered.slice(0, 8).map(k => ({ label:k, value: normalizeNumber(rec[k]) }));
  renderBarChart(els.chartMain, series);

  els.copyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).then(()=>{
      els.copyLink.textContent = '¡Enlace copiado!';
      setTimeout(()=> els.copyLink.textContent = 'Copiar enlace del perfil', 1500);
    });
  });
}

function normalizeNumber(v){
  if (v === null || v === undefined) return NaN;
  const s = String(v).replace(/,/g, '');
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}
function escapeHTML(str) {
  return (str ?? "").toString().replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

init();
