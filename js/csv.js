// csv.js - pequeño parser CSV (maneja comillas y delimitador)
export function parseCSV(text, delimiter = ",") {
  const rows = [];
  let field = "", row = [], inQuotes = false, i = 0;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i+1] === '"') { field += '"'; i++; } // escape ""
        else { inQuotes = false; }
      } else {
        field += char;
      }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === delimiter) pushField();
      else if (char === "\n") { pushField(); pushRow(); }
      else if (char === "\r") { /* ignore CR */ }
      else field += char;
    }
    i++;
  }
  // último campo/fila
  pushField();
  if (row.length > 1 || (row.length === 1 && row[0] !== "")) pushRow();
  // separar headers + data
  const headers = rows.length ? rows[0] : [];
  const dataRows = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, idx) => obj[h.trim()] = (r[idx] ?? "").trim());
    return obj;
  });
  return { headers: headers.map(h => h.trim()), rows: dataRows };
}

export function toJSON(rows) {
  return JSON.stringify(rows, null, 2);
}
