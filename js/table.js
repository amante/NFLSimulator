// table helpers: render, sort, filter
export function detectType(value) {
  if (value === null || value === undefined) return "string";
  const n = Number(value.toString().replace(/,/g, ""));
  return Number.isFinite(n) && value !== "" ? "number" : "string";
}

export function sortRows(rows, key, dir = "asc") {
  const type = rows.length ? detectType(rows[0][key]) : "string";
  const mult = dir === "asc" ? 1 : -1;
  return [...rows].sort((a,b) => {
    const av = (a[key] ?? "").toString();
    const bv = (b[key] ?? "").toString();
    if (type === "number") {
      const an = Number(av.replace(/,/g, "")) || 0;
      const bn = Number(bv.replace(/,/g, "")) || 0;
      return (an - bn) * mult;
    }
    return av.localeCompare(bv) * mult;
  });
}

export function filterRows(rows, query) {
  if (!query) return rows;
  const q = query.toLowerCase();
  return rows.filter(r => Object.values(r).some(v => (v ?? "").toString().toLowerCase().includes(q)));
}

export function renderTable(el, rows, onSort, onRowClick) {
  if (!rows || rows.length === 0) {
    el.innerHTML = '<div class="empty-state">No hay datos para mostrar.</div>';
    el.classList.add("empty");
    return;
  }
  el.classList.remove("empty");
  const headers = Object.keys(rows[0]);
  const thead = `<thead><tr>${headers.map(h => `<th data-key="${h}">${h} <span class="sort">↕</span></th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r => `<tr class="clickable-row">${headers.map(h => `<td>${escapeHTML(r[h])}</td>`).join("")}</tr>`).join("")}</tbody>`;
  el.innerHTML = `<table class="table">${thead}${tbody}</table>`;
  if (onRowClick) {
    el.querySelectorAll('tbody tr').forEach((tr, idx) => tr.addEventListener('click', () => onRowClick(rows[idx])));
  }
  el.querySelectorAll("th").forEach(th => {
    th.addEventListener("click", () => onSort(th.dataset.key));
  });
}

function escapeHTML(str) {
  return (str ?? "").toString().replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
