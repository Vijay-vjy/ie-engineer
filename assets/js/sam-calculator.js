/* =========================================================
   Operation SAM calculator + page tabs
   SAM = Avg observed time × (Rating/100) × (1 + Allowance/100)
   ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const DEFAULT_READINGS = 5;
  const OUTLIER_LIMIT = 0.25; // ±25% from median

  /* ---------- Tabs ---------- */
  const tabs = document.querySelectorAll(".tab");
  function openTab(name, focus) {
    tabs.forEach(t => {
      const on = t.dataset.tab === name;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById("panel-" + t.dataset.tab).hidden = !on;
      if (on && focus) t.focus();
    });
    if (history.replaceState) history.replaceState(null, "", "#" + name);
  }
  IE.openTab = openTab;
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => openTab(t.dataset.tab));
    t.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      openTab(next.dataset.tab, true);
    });
  });
  const initial = location.hash.replace("#", "");
  if (["operation", "garment", "planning"].includes(initial)) openTab(initial);

  /* ---------- Readings ---------- */
  const box = $("#readings");
  function addReading(value = "", focus = false) {
    const idx = box.children.length + 1;
    const wrap = document.createElement("div");
    wrap.className = "reading";
    wrap.innerHTML =
      `<span>R${idx}</span>` +
      `<input type="number" autocomplete="off" min="0" step="0.01" inputmode="decimal" aria-label="Reading ${idx} in seconds" value="${value}">` +
      `<button type="button" class="rm" aria-label="Remove reading ${idx}">×</button>`;
    wrap.querySelector(".rm").addEventListener("click", () => {
      if (box.children.length <= 1) return;
      wrap.remove(); renumber(); calc();
    });
    box.appendChild(wrap);
    if (focus) wrap.querySelector("input").focus();
  }
  function renumber() {
    [...box.children].forEach((w, i) => {
      w.querySelector("span").textContent = "R" + (i + 1);
      w.querySelector("input").setAttribute("aria-label", `Reading ${i + 1} in seconds`);
    });
  }
  function readingInputs() { return [...box.querySelectorAll("input")]; }

  /* ---------- Inputs ---------- */
  const f = {
    op: $("#opName"), machine: $("#machine"), rating: $("#rating"),
    pfd: $("#allowPfd"), mach: $("#allowMachine"), bundle: $("#allowBundle"),
    eff: $("#effPlan"), hours: $("#hoursDay"), excl: $("#excludeOutliers")
  };

  let last = null;

  function calc() {
    const inputs = readingInputs();
    const vals = inputs.map(i => IE.num(i.value));
    const valid = vals.filter(v => v > 0);

    // Outliers vs median
    let median = NaN;
    if (valid.length) {
      const s = [...valid].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      median = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    const used = [];
    inputs.forEach((inp, i) => {
      const v = vals[i];
      const isOut = f.excl.checked && v > 0 && valid.length >= 3 && Math.abs(v - median) / median > OUTLIER_LIMIT;
      inp.parentElement.classList.toggle("outlier", !!isOut);
      inp.parentElement.title = isOut ? "Excluded: more than 25% away from the median" : "";
      if (v > 0 && !isOut) used.push(v);
    });

    const allow = [f.pfd, f.mach, f.bundle].map(x => IE.num(x.value) || 0).reduce((a, b) => a + b, 0);
    $("#allowTotal").textContent = IE.fmt(allow, 1) + " %";

    const rating = IE.num(f.rating.value);
    const eff = IE.num(f.eff.value);
    const hours = IE.num(f.hours.value);

    $("#rsCount").textContent = used.length + (valid.length !== used.length ? ` of ${valid.length}` : "");
    $("#rsMin").textContent = used.length ? IE.fmt(Math.min(...used), 2) + " s" : "—";
    $("#rsMax").textContent = used.length ? IE.fmt(Math.max(...used), 2) + " s" : "—";

    const opLabel = (f.op.value.trim() || "Untitled operation") + (f.machine.value ? " · " + f.machine.value : "");
    $("#rpOp").textContent = opLabel;

    if (!used.length || !(rating > 0)) {
      last = null;
      $("#rpSam").innerHTML = "—<small>min</small>";
      $("#rpSec").textContent = "Enter at least one cycle time reading";
      ["#rAvg", "#rBasic", "#rAllow", "#rT100", "#rTeff", "#rDay"].forEach(id => ($(id).textContent = "—"));
      $("#rsAvg").textContent = "—";
      return;
    }

    const avgSec = used.reduce((a, b) => a + b, 0) / used.length;
    const avgMin = avgSec / 60;
    const basic = avgMin * rating / 100;
    const sam = basic * (1 + allow / 100);
    const t100 = 60 / sam;
    const tEff = eff > 0 ? t100 * eff / 100 : NaN;
    const tDay = hours > 0 ? tEff * hours : NaN;

    last = { op: f.op.value.trim(), machine: f.machine.value, readings: used, avgSec, avgMin, rating, basic, allow, sam, t100, eff, tEff, hours, tDay };

    const samEl = $("#rpSam");
    const newHtml = IE.fmt(sam) + "<small>min</small>";
    if (samEl.innerHTML !== newHtml) {
      samEl.innerHTML = newHtml;
      samEl.classList.remove("flash"); void samEl.offsetWidth; samEl.classList.add("flash");
    }
    $("#rpSec").textContent = "= " + IE.fmt(sam * 60, 1) + " seconds per piece";
    $("#rsAvg").textContent = IE.fmt(avgSec, 2) + " s";
    $("#rAvg").textContent = IE.fmt(avgSec, 2) + " s · " + IE.fmt(avgMin) + " min";
    $("#rBasic").textContent = IE.fmt(basic) + " min";
    $("#rAllow").textContent = IE.fmt(allow, 1) + " %";
    $("#rT100").textContent = IE.fmtInt(t100) + " pcs/hr";
    $("#rTeffLbl").textContent = `Target @ ${eff > 0 ? IE.fmt(eff, 0) : "—"}% efficiency`;
    $("#rTeff").textContent = IE.fmtInt(tEff) + " pcs/hr";
    $("#rDayLbl").textContent = `Target per day (${hours > 0 ? IE.fmt(hours, hours % 1 ? 1 : 0) : "—"} hrs)`;
    $("#rDay").textContent = IE.fmtInt(tDay) + " pcs";
  }

  /* ---------- Buttons ---------- */
  function reset() {
    f.op.value = ""; f.machine.value = "";
    f.rating.value = 100; f.pfd.value = 10; f.mach.value = 3; f.bundle.value = 2;
    f.eff.value = 70; f.hours.value = 8; f.excl.checked = true;
    box.innerHTML = "";
    for (let i = 0; i < DEFAULT_READINGS; i++) addReading();
    calc();
  }
  function loadExample() {
    f.op.value = "Collar attach"; f.machine.value = "SNLS";
    f.rating.value = 90; f.pfd.value = 10; f.mach.value = 3; f.bundle.value = 2;
    box.innerHTML = "";
    [30, 32, 31, 29, 33].forEach(v => addReading(v));
    calc();
    showToast("Worked example loaded");
  }
  function copyResult() {
    if (!last) { showToast("Enter readings first"); return; }
    const L = last;
    const text = [
      `SAM / SMV — ${L.op || "Operation"}${L.machine ? " (" + L.machine + ")" : ""}`,
      `Readings (s): ${L.readings.join(", ")}`,
      `Average observed time: ${IE.fmt(L.avgSec, 2)} s (${IE.fmt(L.avgMin)} min)`,
      `Performance rating: ${L.rating}%`,
      `Basic time: ${IE.fmt(L.basic)} min`,
      `Allowances: ${IE.fmt(L.allow, 1)}%`,
      `SAM: ${IE.fmt(L.sam)} min`,
      `Target @100%: ${IE.fmtInt(L.t100)} pcs/hr`,
      `Target @${L.eff}%: ${IE.fmtInt(L.tEff)} pcs/hr · ${IE.fmtInt(L.tDay)} pcs/day (${L.hours} hrs)`
    ].join("\n");
    IE.copyText(text);
  }
  function addToGarment() {
    if (!last) { showToast("Enter readings first"); return; }
    IE.garment.add({ op: last.op || "Operation", machine: last.machine || "", sam: +last.sam.toFixed(3) });
    IE.openTab("garment");
    document.getElementById("panel-garment").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`Added “${last.op || "Operation"}” to garment list`);
  }

  $("#addReading").addEventListener("click", () => { addReading("", true); });
  $("#btnReset").addEventListener("click", reset);
  $("#btnExample").addEventListener("click", loadExample);
  $("#btnCopy").addEventListener("click", copyResult);
  $("#btnAdd").addEventListener("click", addToGarment);
  $("#btnPrintOp").addEventListener("click", IE.printPDF);
  document.querySelectorAll("[data-load-example]").forEach(b => b.addEventListener("click", () => {
    IE.openTab("operation"); loadExample();
    document.getElementById("calculator").scrollIntoView({ behavior: "smooth" });
  }));

  document.getElementById("panel-operation").addEventListener("input", calc);
  document.getElementById("panel-operation").addEventListener("change", calc);
  // Enter in last reading adds a new one
  box.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const ins = readingInputs();
      if (e.target === ins[ins.length - 1]) addReading("", true);
      else ins[ins.indexOf(e.target) + 1]?.focus();
    }
  });

  reset();
})();
