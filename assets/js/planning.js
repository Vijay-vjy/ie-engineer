/* =========================================================
   Production planning from SAM
   Target output   = Operators × Minutes × Eff% ÷ SAM
   Operators req.  = Output × SAM ÷ (Minutes × Eff%)
   Line efficiency = Output × SAM ÷ (Operators × Minutes) × 100
   ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const f = {
    sam: $("#pSam"), ops: $("#pOps"), hours: $("#pHours"), eff: $("#pEff"),
    want: $("#pWant"), actual: $("#pActual")
  };

  function set(id, v, sub) { $(id).textContent = v; if (sub !== undefined) $(id + "Sub").textContent = sub; }

  function calc() {
    const sam = IE.num(f.sam.value), ops = IE.num(f.ops.value), hrs = IE.num(f.hours.value);
    const eff = IE.num(f.eff.value), want = IE.num(f.want.value), actual = IE.num(f.actual.value);
    const mins = hrs * 60;
    const ok = x => Number.isFinite(x) && x > 0;

    // 1. Target output
    if (ok(sam) && ok(ops) && ok(mins) && ok(eff)) {
      const day = ops * mins * (eff / 100) / sam;
      set("#pTarget", IE.fmtInt(day), `pcs/day · ${IE.fmtInt(day / hrs)} pcs/hr · ${IE.fmtInt(ops * mins / sam)} at 100%`);
    } else set("#pTarget", "—", "Needs SAM, operators, hours, efficiency");

    // 2. Operators required
    if (ok(sam) && ok(want) && ok(mins) && ok(eff)) {
      const need = want * sam / (mins * eff / 100);
      set("#pNeed", IE.fmt(need, 1), `→ plan ${Math.ceil(need - 1e-9)} operators for ${IE.fmtInt(want)} pcs/day`);
    } else set("#pNeed", "—", "Needs SAM, target output, hours, efficiency");

    // 3. Line efficiency
    const box = $("#pEffBox");
    box.classList.remove("good", "warn");
    if (ok(sam) && ok(actual) && ok(ops) && ok(mins)) {
      const le = actual * sam / (ops * mins) * 100;
      set("#pLine", IE.fmt(le, 1) + "%", `Produced ${IE.fmtInt(actual * sam)} of ${IE.fmtInt(ops * mins)} available minutes`);
      box.classList.add(le >= 65 ? "good" : le < 50 ? "warn" : "x");
    } else set("#pLine", "—", "Needs SAM, actual output, operators, hours");
  }

  document.getElementById("panel-planning").addEventListener("input", calc);
  $("#pUseGarment").addEventListener("click", () => {
    const t = IE.garment ? IE.garment.total() : 0;
    if (t > 0) { f.sam.value = t.toFixed(3); calc(); showToast("Garment SAM applied"); }
    else showToast("Garment list is empty");
  });
  $("#pReset").addEventListener("click", () => {
    f.sam.value = ""; f.ops.value = 30; f.hours.value = 8; f.eff.value = 65; f.want.value = ""; f.actual.value = "";
    calc();
  });
  document.addEventListener("garment:changed", e => {
    $("#pGarmentTotal").textContent = e.detail.total > 0 ? `(${IE.fmt(e.detail.total)} min)` : "";
  });

  IE.plan = { setSam(v) { f.sam.value = (+v).toFixed(3); calc(); } };

  if (!f.sam.value && IE.garment && IE.garment.total() > 0) f.sam.value = IE.garment.total().toFixed(3);
  $("#pGarmentTotal").textContent = IE.garment && IE.garment.total() > 0 ? `(${IE.fmt(IE.garment.total())} min)` : "";
  calc();
})();
