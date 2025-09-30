// nfl-win-prob-web v2

const LS_KEY = "nfl_prob_app_v2";

const defaultWeights = {
  // pesos de métricas base
  off_rating: 0.4,
  def_rating: 0.35,        // se aplica como +def si mayor es mejor; para epa_def usamos negativo
  special_rating: 0.1,
  epa_off: 0.15,
  epa_def: 0.15,           // aplicado con signo negativo
  dvoa_off: 0.1,
  dvoa_def: 0.1,           // aplicado con signo negativo
  sos: 0.05,               // strength of schedule (mayor = más difícil)
  // intercepto y k
  intercept: 0.0,
  logistic_k: 0.9
};

const defaultMeta = {
  normalization: "z",      // "z" | "pct" | "none"
  home_adv: 3.0,           // ΔPower por localía
  temp_neutral_c: 15.0,    // temperatura neutra
  temp_weight: 0.03,       // ΔPower por grado de desviación respecto a neutral
  rest_weight: 0.15,       // ΔPower por día de descanso adicional
  injury_weight: 0.4       // ΔPower por punto de índice de lesiones
};

let state = {
  teams: [],
  weights: { ...defaultWeights },
  meta: { ...defaultMeta }
};

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}
function load() {
  const s = localStorage.getItem(LS_KEY);
  if (s) { try { state = JSON.parse(s); } catch(e) {} }
  if (!state.weights) state.weights = { ...defaultWeights };
  if (!state.meta) state.meta = { ...defaultMeta };
}

function resetAll() {
  state = { teams: [], weights: { ...defaultWeights }, meta: { ...defaultMeta } };
  save(); renderAll();
}

function loadSample() {
  state.teams = [
    { team:"Kansas City Chiefs", off_rating:92, def_rating:85, special_rating:78, epa_off:0.22, epa_def:-0.12, dvoa_off:18.5, dvoa_def:-12.3, sos:1.2, rest_days:6, injuries:1.0 },
    { team:"San Francisco 49ers", off_rating:90, def_rating:88, special_rating:80, epa_off:0.20, epa_def:-0.14, dvoa_off:16.9, dvoa_def:-14.1, sos:0.8, rest_days:6, injuries:0.9 },
    { team:"Baltimore Ravens", off_rating:87, def_rating:86, special_rating:77, epa_off:0.15, epa_def:-0.15, dvoa_off:12.1, dvoa_def:-13.7, sos:1.5, rest_days:7, injuries:1.3 },
    { team:"Buffalo Bills", off_rating:88, def_rating:83, special_rating:76, epa_off:0.17, epa_def:-0.10, dvoa_off:13.2, dvoa_def:-9.8, sos:1.0, rest_days:6, injuries:1.4 },
    { team:"Dallas Cowboys", off_rating:86, def_rating:82, special_rating:75, epa_off:0.14, epa_def:-0.09, dvoa_off:10.5, dvoa_def:-8.1, sos:0.6, rest_days:6, injuries:1.6 },
    { team:"Philadelphia Eagles", off_rating:85, def_rating:81, special_rating:74, epa_off:0.13, epa_def:-0.08, dvoa_off:9.8, dvoa_def:-7.2, sos:0.9, rest_days:5, injuries:1.8 },
    { team:"Detroit Lions", off_rating:84, def_rating:79, special_rating:73, epa_off:0.11, epa_def:-0.06, dvoa_off:8.1, dvoa_def:-6.0, sos:0.7, rest_days:6, injuries:2.0 },
    { team:"Cincinnati Bengals", off_rating:83, def_rating:80, special_rating:72, epa_off:0.12, epa_def:-0.07, dvoa_off:8.7, dvoa_def:-6.5, sos:1.1, rest_days:5, injuries:1.5 }
  ];
  save(); renderAll();
}

// ---------- Normalización ----------
function getNumericColumns(rows) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const numeric = [];
  for (const k of keys) {
    if (k === "team") continue;
    const vals = rows.map(r => Number(r[k])).filter(v => Number.isFinite(v));
    if (vals.length >= rows.length*0.7) numeric.push(k);
  }
  return numeric;
}

function stats(vals) {
  const n = vals.length;
  const mean = vals.reduce((a,b)=>a+b,0)/Math.max(1,n);
  const sd = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,n));
  const sorted = [...vals].sort((a,b)=>a-b);
  const pct = v => (sorted.findIndex(x=>x>=v) / Math.max(1,n-1));
  return { mean, sd, pct };
}

function buildNormalization(teams) {
  const numeric = getNumericColumns(teams);
  const map = {};
  numeric.forEach(k => {
    const vals = teams.map(t => Number(t[k])||0);
    map[k] = stats(vals);
  });
  return { numeric, map };
}

function normalizeValue(k, v, normInfo, mode="z") {
  const s = normInfo.map[k];
  if (!s) return Number(v)||0;
  if (mode === "none") return Number(v)||0;
  if (mode === "z") {
    if (!s.sd || s.sd === 0) return 0;
    return (Number(v||0)-s.mean)/s.sd;
  }
  if (mode === "pct") {
    const vals = state.teams.map(t => Number(t[k])||0).sort((a,b)=>a-b);
    const idx = vals.findIndex(x => x >= (Number(v)||0));
    return idx < 0 ? 0 : idx/Math.max(1, vals.length-1);
  }
  return Number(v)||0;
}

// ---------- Power Score ----------
const DEF_NEG = new Set(["epa_def", "dvoa_def"]);  // menor es mejor
function computePower(t, normInfo) {
  const w = state.weights;
  const meta = state.meta;
  const mode = meta.normalization;

  // Métricas candidatas (si existen)
  const keys = [
    "off_rating","def_rating","special_rating",
    "epa_off","epa_def","dvoa_off","dvoa_def","sos"
  ];

  let sum = w.intercept || 0;
  keys.forEach(k => {
    if (t[k] == null || w[k] == null) return;
    let v = normalizeValue(k, t[k], normInfo, mode);
    const sign = DEF_NEG.has(k) ? -1 : 1;
    sum += sign * (w[k] * v);
  });

  return sum;
}

function logistic(pdiff, k=1.0) {
  return 1 / (1 + Math.exp(-k * pdiff));
}

// ---------- CSV ----------
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(x => x.trim().length);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map(h=>h.trim());
  const rows = [];
  for (let i=1;i<lines.length;i++) {
    const cells = lines[i].split(",").map(c=>c.trim());
    if (!cells.length || cells.every(c=>!c)) continue;
    const obj = {};
    headers.forEach((h,j)=>{
      const key = h;
      const num = Number(cells[j]);
      obj[key] = Number.isFinite(num) ? num : cells[j];
    });
    rows.push(obj);
  }
  return rows;
}

// ---------- Render ----------
function renderWeights() {
  const panel = document.getElementById("weightsPanel");
  panel.innerHTML = "";
  const defs = [
    { key:"off_rating", label:"Peso Offense" },
    { key:"def_rating", label:"Peso Defense" },
    { key:"special_rating", label:"Peso ST" },
    { key:"epa_off", label:"Peso EPA Off" },
    { key:"epa_def", label:"Peso EPA Def (neg)" },
    { key:"dvoa_off", label:"Peso DVOA Off" },
    { key:"dvoa_def", label:"Peso DVOA Def (neg)" },
    { key:"sos", label:"Peso SOS" }
  ];

  defs.forEach(d => {
    const wrap = document.createElement("div");
    wrap.className = "space-y-1";
    wrap.innerHTML = `
      <label class="block text-sm font-medium">${d.label}</label>
      <input data-weight="${d.key}" type="number" step="0.01" value="${state.weights[d.key] ?? 0}"
             class="w-full px-3 py-2 rounded-xl bg-slate-100 focus:outline-none focus:ring">
    `;
    panel.appendChild(wrap);
  });

  // Bind
  panel.querySelectorAll("[data-weight]").forEach(inp => {
    inp.addEventListener("change", () => {
      const key = inp.getAttribute("data-weight");
      state.weights[key] = Number(inp.value || 0);
      save(); renderTeams(document.getElementById("searchInput").value);
      renderTeamSelectors();
    });
  });
}

function renderTeams(filter="") {
  const tbody = document.getElementById("teamsTbody");
  tbody.innerHTML = "";

  const normInfo = buildNormalization(state.teams);
  const q = (filter||"").toLowerCase();

  const rows = state.teams
    .map(t => ({ ...t, power: computePower(t, normInfo) }))
    .filter(t => !q || (String(t.team||"").toLowerCase().includes(q)))
    .sort((a,b) => (b.power||0)-(a.power||0));

  rows.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2 px-3">${t.team ?? "-"}</td>
      <td class="py-2 px-3 font-semibold">${(t.power||0).toFixed(2)}</td>
      <td class="py-2 px-3">${t.off_rating ?? "-"}</td>
      <td class="py-2 px-3">${t.def_rating ?? "-"}</td>
      <td class="py-2 px-3">${t.special_rating ?? "-"}</td>
      <td class="py-2 px-3">${t.epa_off ?? "-"}</td>
      <td class="py-2 px-3">${t.epa_def ?? "-"}</td>
      <td class="py-2 px-3">
        <button class="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300" data-edit="${idx}">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-edit"));
      const t = state.teams[idx];
      const fields = ["off_rating","def_rating","special_rating","epa_off","epa_def","dvoa_off","dvoa_def","sos","rest_days","injuries","temp_c","home"];
      fields.forEach(f => {
        const cur = t[f] ?? "";
        const val = prompt(`${f}:`, cur);
        if (val !== null) {
          const num = Number(val);
          t[f] = Number.isFinite(num) ? num : val;
        }
      });
      save();
      renderTeams(document.getElementById("searchInput").value);
      renderTeamSelectors();
    });
  });
}

function renderTeamSelectors() {
  const selA = document.getElementById("teamA");
  const selB = document.getElementById("teamB");
  selA.innerHTML = ""; selB.innerHTML = "";
  const opts = state.teams.slice().sort((x,y)=> String(x.team||"").localeCompare(String(y.team||"")));
  opts.forEach(t => {
    const o1 = document.createElement("option"); o1.value = t.team; o1.textContent = t.team;
    const o2 = document.createElement("option"); o2.value = t.team; o2.textContent = t.team;
    selA.appendChild(o1); selB.appendChild(o2);
  });
}

function readModelControls() {
  // normalización
  const norm = document.querySelector('input[name="norm"]:checked')?.value || "z";
  state.meta.normalization = norm;
  // intercepto y k
  state.weights.intercept = Number(document.getElementById("w_intercept").value || 0);
  state.weights.logistic_k = Number(document.getElementById("w_k").value || 1);
  // factores
  state.meta.home_adv = Number(document.getElementById("homeAdv").value || defaultMeta.home_adv);
  state.meta.temp_neutral_c = Number(document.getElementById("tempNeutral").value || defaultMeta.temp_neutral_c);
  state.meta.temp_weight = Number(document.getElementById("tempWeight").value || defaultMeta.temp_weight);
  state.meta.rest_weight = Number(document.getElementById("restWeight").value || defaultMeta.rest_weight);
  state.meta.injury_weight = Number(document.getElementById("injWeight").value || defaultMeta.injury_weight);
  save();
}

function setModelControls() {
  // normalización radios
  const mode = state.meta.normalization || "z";
  document.getElementById("normalizeZ").checked = mode==="z";
  document.getElementById("normalizePct").checked = mode==="pct";
  document.getElementById("normalizeNone").checked = mode==="none";
  // intercepto y k
  document.getElementById("w_intercept").value = state.weights.intercept ?? 0;
  document.getElementById("w_k").value = state.weights.logistic_k ?? 1;
  // factores
  document.getElementById("homeAdv").value = state.meta.home_adv ?? defaultMeta.home_adv;
  document.getElementById("tempNeutral").value = state.meta.temp_neutral_c ?? defaultMeta.temp_neutral_c;
  document.getElementById("tempWeight").value = state.meta.temp_weight ?? defaultMeta.temp_weight;
  document.getElementById("restWeight").value = state.meta.rest_weight ?? defaultMeta.rest_weight;
  document.getElementById("injWeight").value = state.meta.injury_weight ?? defaultMeta.injury_weight;
  // defaults simulación
  document.getElementById("homeA").checked = false;
  document.getElementById("homeB").checked = false;
  document.getElementById("tempC").value = state.meta.temp_neutral_c ?? 15;
  document.getElementById("restDiff").value = 0;
  document.getElementById("injDiff").value = 0;
}

function simulate() {
  readModelControls();
  const selA = document.getElementById("teamA").value;
  const selB = document.getElementById("teamB").value;
  const res = document.getElementById("simResult");
  if (!selA || !selB || selA === selB) {
    res.innerHTML = "<p class='text-slate-600'>Selecciona dos equipos distintos.</p>";
    return;
  }
  const A = state.teams.find(t => t.team===selA);
  const B = state.teams.find(t => t.team===selB);
  const normInfo = buildNormalization(state.teams);
  let pA = computePower(A, normInfo);
  let pB = computePower(B, normInfo);

  // Ajustes de contexto
  const homeA = document.getElementById("homeA").checked;
  const homeB = document.getElementById("homeB").checked;
  const tempC = Number(document.getElementById("tempC").value || state.meta.temp_neutral_c);
  const restDiff = Number(document.getElementById("restDiff").value || 0);
  const injDiff = Number(document.getElementById("injDiff").value || 0);

  // Localía (solo si uno es local)
  if (homeA ^ homeB) {
    if (homeA) pA += state.meta.home_adv;
    if (homeB) pB += state.meta.home_adv;
  }

  // Clima: penaliza al equipo con mayor desviación respecto a neutral (simple)
  const neutral = state.meta.temp_neutral_c;
  const dA = Math.abs((A.temp_c ?? tempC) - neutral);
  const dB = Math.abs((B.temp_c ?? tempC) - neutral);
  if (dA > dB) pA -= state.meta.temp_weight * (dA - dB);
  else if (dB > dA) pB -= state.meta.temp_weight * (dB - dA);

  // Descanso: restDiff = A - B (positivo favorece A)
  pA += state.meta.rest_weight * Math.max(0, restDiff);
  pB += state.meta.rest_weight * Math.max(0, -restDiff);

  // Lesiones: injDiff = A - B (positivo = A más lesionado => penaliza A)
  pA -= state.meta.injury_weight * Math.max(0, injDiff);
  pB -= state.meta.injury_weight * Math.max(0, -injDiff);

  const k = state.weights.logistic_k || 1;
  const probA = logistic(pA - pB, k);
  const probB = 1 - probA;

  res.innerHTML = `
    <div class="grid md:grid-cols-2 gap-4 items-center">
      <div class="p-4 rounded-xl bg-slate-100">
        <h3 class="font-semibold text-lg">${A.team}</h3>
        <p class="text-sm text-slate-600">Power adj: ${pA.toFixed(2)}</p>
        <p class="text-3xl font-bold mt-2">${(probA*100).toFixed(1)}%</p>
      </div>
      <div class="p-4 rounded-xl bg-slate-100">
        <h3 class="font-semibold text-lg">${B.team}</h3>
        <p class="text-sm text-slate-600">Power adj: ${pB.toFixed(2)}</p>
        <p class="text-3xl font-bold mt-2">${(probB*100).toFixed(1)}%</p>
      </div>
    </div>
    <p class="text-xs text-slate-500 mt-3">Modelo v2: normalización + factores (localía, clima, descanso, lesiones).</p>
  `;
}

// ---------- Export / Import ----------
function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nfl_prob_app_state_v2.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importState(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      if (obj && obj.teams && obj.weights && obj.meta) {
        state = obj;
        save(); renderAll();
      } else {
        alert("Archivo inválido.");
      }
    } catch(e) {
      alert("No se pudo leer el JSON.");
    }
  };
  reader.readAsText(file);
}

// ---------- Wire-up ----------
function renderAll() {
  renderWeights();
  renderTeams(document.getElementById("searchInput")?.value || "");
  renderTeamSelectors();
  setModelControls();
  document.getElementById("simResult").innerHTML = "<p class='text-slate-600'>Selecciona equipos, ajusta factores y calcula.</p>";
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  renderAll();

  document.getElementById("fileInput").addEventListener("change", e => {
    const f = e.target.files?.[0];
    if (f) {
      const rd = new FileReader();
      rd.onload = ev => {
        const rows = parseCSV(ev.target.result);
        if (!rows.length) { alert("CSV vacío."); return; }
        state.teams = rows; save(); renderAll();
      };
      rd.readAsText(f);
    }
  });

  document.getElementById("loadSample").addEventListener("click", loadSample);
  document.getElementById("resetAll").addEventListener("click", resetAll);
  document.getElementById("recompute").addEventListener("click", () => renderTeams(document.getElementById("searchInput").value));
  document.getElementById("searchInput").addEventListener("input", e => renderTeams(e.target.value));
  document.getElementById("simulate").addEventListener("click", simulate);

  document.getElementById("btnExport").addEventListener("click", exportState);
  document.getElementById("importState").addEventListener("change", e => {
    const f = e.target.files?.[0];
    if (f) importState(f);
  });

  // radios + inputs de modelo/factores
  document.querySelectorAll('input[name="norm"]').forEach(r => r.addEventListener("change", readModelControls));
  ["w_intercept","w_k","homeAdv","tempNeutral","tempWeight","restWeight","injWeight"].forEach(id => {
    document.getElementById(id).addEventListener("change", readModelControls);
  });
});
