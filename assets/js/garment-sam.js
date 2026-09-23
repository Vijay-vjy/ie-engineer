/* =========================================================
   Garment SAM — list of operations, total and machine split
   ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const KEY = "vp-ie-garment-v1";
  const MACHINES = ["SNLS", "DNLS", "Overlock", "Flatlock", "Bartack", "Buttonhole", "Button sew", "Kansai", "Snap / Rivet", "Iron / Press", "Manual / Helper", "Other"];
  const SAMPLE = [
    ["Shoulder join", "Overlock", 0.25], ["Neck rib attach", "Overlock", 0.35], ["Neck top stitch", "Flatlock", 0.30],
    ["Back neck tape", "SNLS", 0.40], ["Label attach", "SNLS", 0.25], ["Sleeve attach", "Overlock", 0.55],
    ["Side seam", "Overlock", 0.70], ["Sleeve hem", "Flatlock", 0.45], ["Bottom hem", "Flatlock", 0.40],
    ["Thread trim & check", "Manual / Helper", 0.60]
  ];

  let rows = IE.store.get(KEY, []);
  let uid = rows.reduce((m, r) => Math.max(m, r.id || 0), 0);
  rows.forEach(r => { if (!r.id) r.id = ++uid; });

  const body = $("#gBody");
  const save = () => IE.store.set(KEY, rows);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function machineOptions(sel) {
    const list = sel && !MACHINES.includes(sel) ? [sel, ...MACHINES] : MACHINES;
    return `<option value="">—</option>` + list.map(m => `<option${m === sel ? " selected" : ""}>${esc(m)}</option>`).join("");
  }

  function render() {
    if (!rows.length) {
      body.innerHTML = `<tr class="empty"><td colspan="5">No operations yet. Add one below, send one from the Operation SAM tab, or load the sample T-shirt.</td></tr>`;
    } else {
      body.innerHTML = rows.map((r, i) => `
        <tr data-id="${r.id}">
          <td class="num">${i + 1}</td>
          <td><input type="text" data-f="op" value="${esc(r.op)}" placeholder="Operation name" aria-label="Operation ${i + 1} name"></td>
          <td><select data-f="machine" aria-label="Operation ${i + 1} machine">${machineOptions(r.machine)}</select></td>
          <td style="text-align:right"><input class="sam" type="number" step="0.001" min="0" inputmode="decimal" data-f="sam" value="${Number.isFinite(r.sam) ? r.sam : ""}" aria-label="Operation ${i + 1} SAM"></td>
          <td class="act"><button type="button" class="icon-btn" data-del aria-label="Delete operation ${i + 1}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button></td>
        </tr>`).join("");
    }
    summary();
  }

  function total() { return rows.reduce((a, r) => a + (Number.isFinite(r.sam) ? r.sam : 0), 0); }

  function summary() {
    const t = total();
    $("#gTotal").textContent = IE.fmt(t);
    $("#gTotalSide").innerHTML = IE.fmt(t) + "<small>min</small>";
    $("#gCount").textContent = rows.length + (rows.length === 1 ? " operation" : " operations");
    $("#gT100").textContent = t > 0 ? IE.fmt(60 / t, 1) + " pcs/hr per operator" : "—";

    const split = {};
    rows.forEach(r => { if (r.sam > 0) { const k = r.machine || "Unassigned"; split[k] = (split[k] || 0) + r.sam; } });
    const entries = Object.entries(split).sort((a, b) => b[1] - a[1]);
    $("#gSplit").innerHTML = entries.length
      ? entries.map(([m, v]) => {
          const pct = (v / t) * 100;
          return `<li><div class="split-head"><span>${esc(m)}</span><b>${IE.fmt(v)} · ${IE.fmt(pct, 0)}%</b></div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div></li>`;
        }).join("")
      : `<li class="rp-empty">Machine-wise split appears here.</li>`;
    document.dispatchEvent(new CustomEvent("garment:changed", { detail: { total: t } }));
  }

  body.addEventListener("input", e => {
    const tr = e.target.closest("tr[data-id]"); if (!tr) return;
    const r = rows.find(x => x.id === +tr.dataset.id); if (!r) return;
    const k = e.target.dataset.f;
    r[k] = k === "sam" ? IE.num(e.target.value) : e.target.value;
    save(); summary();
  });
  body.addEventListener("change", e => { if (e.target.dataset.f === "machine") body.dispatchEvent(new Event("input", { bubbles: true })); });
  body.addEventListener("click", e => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    const id = +b.closest("tr").dataset.id;
    rows = rows.filter(r => r.id !== id); save(); render();
  });

  function add(r = { op: "", machine: "", sam: NaN }, focus) {
    rows.push({ id: ++uid, op: r.op, machine: r.machine, sam: r.sam });
    save(); render();
    if (focus) body.querySelector("tr:last-child input")?.focus();
  }

  $("#gAdd").addEventListener("click", () => add(undefined, true));
  $("#gSample").addEventListener("click", () => {
    rows = SAMPLE.map(([op, machine, sam]) => ({ id: ++uid, op, machine, sam }));
    save(); render(); showToast("Sample T-shirt operations loaded");
  });
  $("#gClear").addEventListener("click", () => {
    if (!rows.length) return;
    rows = []; save(); render(); showToast("Garment list cleared");
  });
  $("#gCsv").addEventListener("click", () => {
    if (!rows.length) { showToast("Add operations first"); return; }
    const style = $("#gStyle").value.trim() || "Garment";
    const t = total();
    const data = [["Style", style], [], ["#", "Operation", "Machine", "SAM (min)"]];
    rows.forEach((r, i) => data.push([i + 1, r.op, r.machine, Number.isFinite(r.sam) ? r.sam.toFixed(3) : ""]));
    data.push([], ["", "Total garment SAM", "", t.toFixed(3)], [], ["Machine", "SAM (min)", "Share %"]);
    const split = {};
    rows.forEach(r => { if (r.sam > 0) { const k = r.machine || "Unassigned"; split[k] = (split[k] || 0) + r.sam; } });
    Object.entries(split).forEach(([m, v]) => data.push([m, v.toFixed(3), ((v / t) * 100).toFixed(1)]));
    IE.downloadCSV(style.replace(/[^\w\-]+/g, "_") + "_SAM.csv", data);
  });
  $("#gPrint").addEventListener("click", IE.printPDF);
  $("#gToPlan").addEventListener("click", () => {
    const t = total();
    if (!(t > 0)) { showToast("Add operations with SAM first"); return; }
    IE.plan && IE.plan.setSam(t);
    IE.openTab("planning");
    document.getElementById("panel-planning").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  IE.garment = { add, total };
  render();
})();
