// js/scheduleLoader.js — v3.10.6 (JSON-only, no web fetch)
import { SCHEDULE_2025 } from './schedule.js';

const NS = 'NFLSimulator';
const SCHED_KEY = `${NS}:schedule:2025`;

let LAST_SOURCE = 'unknown';
export function getScheduleSource(){ return LAST_SOURCE; }

export function loadCachedSchedule(){
  try { return JSON.parse(localStorage.getItem(SCHED_KEY) || '[]'); } catch { return []; }
}
export function saveCachedSchedule(rows){
  try { localStorage.setItem(SCHED_KEY, JSON.stringify(rows || [])); } catch {}
}

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

async function loadLocalJson(){
  try {
    const res = await fetch('data/schedule_2025.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('missing json');
    const data = await res.json();
    const games = Array.isArray(data?.games) ? data.games : [];
    return games.map(normRow);
  } catch { return []; }
}

// Main API: load schedule strictly from local JSON, then cache; fallback to embedded sample
export async function loadSchedule2025(){
  const local = await loadLocalJson();
  if (Array.isArray(local) && local.length){
    LAST_SOURCE = 'offline-json';
    saveCachedSchedule(local);
    return local;
  }
  const cached = loadCachedSchedule();
  if (Array.isArray(cached) && cached.length){
    LAST_SOURCE = 'cache';
    return cached;
  }
  LAST_SOURCE = 'embedded';
  return SCHEDULE_2025.map(normRow);
}
