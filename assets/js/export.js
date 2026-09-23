/* =========================================================
   Shared helpers for the calculator: formatting, copy,
   CSV (Excel) download and PDF (print) export.
   Loaded first — other calculator files use window.IE.
   ========================================================= */
window.IE = window.IE || {};

IE.num = v => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
IE.fmt = (n, d = 3) => (Number.isFinite(n) ? n.toFixed(d) : "—");
IE.fmtInt = n => (Number.isFinite(n) ? Math.floor(n + 1e-9).toLocaleString("en-IN") : "—");

/* In-memory store: calculator data lives only for the current page view,
   so a refresh always starts with a clean calculator. */
IE.store = (() => {
  const mem = {};
  // Remove data saved by earlier versions of the site
  try { Object.keys(localStorage).filter(k => k.startsWith("vp-ie-")).forEach(k => localStorage.removeItem(k)); } catch (e) {}
  return {
    get(key, fallback) { return key in mem ? JSON.parse(mem[key]) : fallback; },
    set(key, val) { mem[key] = JSON.stringify(val); }
  };
})();

/* Page restored from the back/forward cache keeps old values — reload it fresh. */
window.addEventListener("pageshow", e => { if (e.persisted) location.reload(); });

IE.copyText = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    ta.remove();
  }
  if (typeof showToast === "function") showToast("Result copied to clipboard");
};

/* rows: array of arrays. Opens directly in Excel. */
IE.downloadCSV = (filename, rows) => {
  const esc = v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = "﻿" + rows.map(r => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  if (typeof showToast === "function") showToast("Excel (CSV) file downloaded");
};

/* Print only the active tab — choose "Save as PDF" in the print dialog. */
IE.printPDF = () => {
  if (typeof showToast === "function") showToast("Choose “Save as PDF” in the print window");
  setTimeout(() => window.print(), 300);
};
