// charts.js - minimal SVG charts (no deps)
export function renderBarChart(el, series, {height=220, pad=24, barGap=6, yTicks=4} = {}) {
  // series: [{label, value}] - numeric
  const data = series.filter(s => isFinite(Number(s.value)));
  const labels = data.map(d => d.label);
  const values = data.map(d => Number(d.value));
  const max = Math.max(1, ...values);
  const W = el.clientWidth || 600;
  const H = height;
  const innerW = W - pad*2;
  const innerH = H - pad*2;
  const barW = Math.max(8, Math.floor((innerW - barGap*(data.length-1)) / data.length));
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${H}`, width:'100%', height:String(H)});
  const g = svgEl('g', {transform:`translate(${pad},${pad})`});
  // Axes (simple)
  const axis = svgEl('line', {x1:0, y1:innerH, x2:innerW, y2:innerH, stroke:'#263244', 'stroke-width':1});
  g.appendChild(axis);
  // Bars
  data.forEach((d, i) => {
    const x = i*(barW+barGap);
    const h = Math.round((Number(d.value)/max)*innerH);
    const y = innerH - h;
    const rect = svgEl('rect', {x, y, width:barW, height:h, rx:4, ry:4, fill:'currentColor', opacity:'0.85'});
    // label
    const lbl = svgEl('text', {x:x+barW/2, y:innerH+14, 'text-anchor':'middle', 'font-size':'10', fill:'#9aa7b4'});
    lbl.textContent = truncate(d.label, 8);
    // value tag
    const val = svgEl('text', {x:x+barW/2, y:y-4, 'text-anchor':'middle', 'font-size':'11', fill:'#cfe6ff'});
    val.textContent = formatNumber(d.value);
    g.appendChild(rect); g.appendChild(lbl); g.appendChild(val);
  });
  // Y ticks
  for (let t=1;t<=yTicks;t++){
    const y = innerH - Math.round((t/yTicks)*innerH);
    const line = svgEl('line', {x1:0, y1:y, x2:innerW, y2:y, stroke:'#1a2432', 'stroke-width':1});
    g.appendChild(line);
    const tv = svgEl('text', {x:-6, y:y+3, 'text-anchor':'end', 'font-size':'10', fill:'#74808d'});
    tv.textContent = formatNumber((t/yTicks)*max);
    g.appendChild(tv);
  }
  svg.appendChild(g);
  el.innerHTML = '';
  el.appendChild(svg);
}

function svgEl(tag, attrs={}){
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
  return e;
}

function truncate(s, n){ const str = String(s); return str.length>n?str.slice(0,n-1)+'…':str; }
function formatNumber(v){
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  return n % 1 === 0 ? n.toString() : n.toFixed(2);
}
