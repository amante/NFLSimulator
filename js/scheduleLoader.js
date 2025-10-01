// js/scheduleLoader.js — v3.9
import { SCHEDULE_2025 } from './schedule.js';

const NS = 'NFLSimulator';
const SCHED_KEY = `${NS}:schedule:2025`;

// Return cached if present
export function loadCachedSchedule(){
  try { return JSON.parse(localStorage.getItem(SCHED_KEY) || '[]'); } catch { return []; }
}
export function saveCachedSchedule(rows){
  try { localStorage.setItem(SCHED_KEY, JSON.stringify(rows || [])); } catch {}
}

// Normalize to [{Week, Date, TimeET, AwayTeam, HomeTeam, Network, Notes}]
function normRow(obj){
  return {
    Week: Number(obj.Week) || null,
    Date: obj.Date || '',
    TimeET: obj.TimeET || '',
    AwayTeam: obj.AwayTeam || '',
    HomeTeam: obj.HomeTeam || '',
    Network: obj.Network || '',
    Notes: obj.Notes || ''
  };
}

// Attempt 1: ESPN "scoreboard" (week by week)
async function fetchWeekFromScoreboard(week){
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?year=2025&seasontype=2&week=${week}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('scoreboard not ok');
  const data = await res.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  return events.map(ev => {
    const comp = ev?.competitions?.[0];
    const dateISO = ev?.date || comp?.date || '';
    const d = dateISO ? new Date(dateISO) : null;
    const et = d ? new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' })) : null;
    const timeET = et ? String(et.getHours()).padStart(2,'0') + ':' + String(et.getMinutes()).padStart(2,'0') : '';

    const aw = comp?.competitors?.find(c => c?.homeAway === 'away');
    const hm = comp?.competitors?.find(c => c?.homeAway === 'home');
    return normRow({
      Week: week,
      Date: dateISO?.slice(0,10) || '',
      TimeET: timeET,
      AwayTeam: (aw?.team?.abbreviation || aw?.team?.displayName || aw?.team?.name || '').toUpperCase(),
      HomeTeam: (hm?.team?.abbreviation || hm?.team?.displayName || hm?.team?.name || '').toUpperCase(),
      Network: ev?.competitions?.[0]?.broadcasts?.[0]?.names?.[0] || '',
      Notes: ''
    });
  });
}

// Attempt 2: ESPN "cdn schedule" (week by week)
async function fetchWeekFromCdn(week){
  const url = `https://cdn.espn.com/core/nfl/schedule?xhr=1&year=2025&week=${week}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('cdn not ok');
  const data = await res.json();
  // Heuristic parse
  const cards = data?.content?.schedule?.games || data?.content?.schedule || data?.schedule || [];
  const rows = [];
  const pushGame = (g) => {
    try {
      const date = (g.date || g.startDate || '').slice(0,10);
      const time = (g.time || g.startTime || '').replace(/\s*ET/i,'').trim();
      // Teams
      const away = g?.competitors?.find?.(c => c.homeAway === 'away')?.abbrev || g.awayTeam?.abbrev;
      const home = g?.competitors?.find?.(c => c.homeAway === 'home')?.abbrev || g.homeTeam?.abbrev;
      const network = (g.tv || g.network || (g.broadcasts && g.broadcasts[0]?.names?.[0]) || '') || '';
      rows.push(normRow({ Week: week, Date: date, TimeET: time, AwayTeam: String(away||'').toUpperCase(), HomeTeam: String(home||'').toUpperCase(), Network: network, Notes: '' }));
    } catch {}
  };
  if (Array.isArray(cards)) {
    cards.forEach(pushGame);
  } else if (cards && typeof cards === 'object') {
    Object.values(cards).forEach(v => Array.isArray(v) && v.forEach(pushGame));
  }
  return rows;
}

// Load all weeks 1..18 into a single array (with caching/fallback)
export async function loadSchedule2025(fullReload=false){
  if (!fullReload){
    const cached = loadCachedSchedule();
    if (cached?.length >= 250) return cached; // likely full season
  }
  const all = [];
  for (let w = 1; w <= 18; w++){
    let rows = [];
    try { rows = await fetchWeekFromScoreboard(w); }
    catch (_) {
      try { rows = await fetchWeekFromCdn(w); } catch { rows = []; }
    }
    all.push(...rows.map(normRow));
  }
  // Fallback to embedded sample if nothing found
  const out = all.length ? all : SCHEDULE_2025.map(normRow);
  saveCachedSchedule(out);
  return out;
}
