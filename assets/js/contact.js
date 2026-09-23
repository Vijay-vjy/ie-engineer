/* =========================================================
   Contact form — validation + submit
   Sends to SITE.formEndpoint (e.g. Formspree) if set,
   otherwise opens the visitor's email app.
   ========================================================= */
(function () {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const status = document.getElementById("formStatus");
  const btn = form.querySelector('button[type="submit"]');

  const rules = {
    name: v => v.trim().length >= 2 || "Please enter your name",
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email",
    phone: v => !v.trim() || /^[+\d][\d\s\-()]{6,}$/.test(v.trim()) || "Please enter a valid phone number",
    message: v => v.trim().length >= 10 || "Please write a short message (10+ characters)"
  };

  function check(el) {
    const rule = rules[el.name];
    if (!rule) return true;
    const res = rule(el.value);
    const field = el.closest(".field");
    field.classList.toggle("invalid", res !== true);
    field.querySelector(".err").textContent = res === true ? "" : res;
    return res === true;
  }

  form.querySelectorAll("input, textarea").forEach(el => {
    el.addEventListener("blur", () => check(el));
    el.addEventListener("input", () => el.closest(".field").classList.contains("invalid") && check(el));
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.className = "form-status";
    if (form.company_website.value) return; // spam honeypot
    const els = [...form.querySelectorAll("input, textarea")].filter(el => rules[el.name]);
    const allOk = els.map(check).every(Boolean);
    if (!allOk) { els.find(el => el.closest(".field").classList.contains("invalid"))?.focus(); return; }

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.company_website;

    if (!SITE.formEndpoint) {
      const body = [
        `Name: ${data.name}`, `Company: ${data.company || "-"}`, `Email: ${data.email}`, `Phone: ${data.phone || "-"}`,
        `Industry: ${data.industry || "-"}`, `Service: ${data.service || "-"}`, "", data.message
      ].join("\n");
      location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("Website enquiry – " + (data.service || "General"))}&body=${encodeURIComponent(body)}`;
      status.textContent = "Your email app should open with the message ready to send.";
      status.className = "form-status ok";
      return;
    }

    btn.disabled = true; const label = btn.innerHTML; btn.textContent = "Sending…";
    try {
      const res = await fetch(SITE.formEndpoint, {
        method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = "Thank you! Your message has been sent. I'll reply within 24 hours.";
      status.className = "form-status ok";
    } catch (err) {
      status.textContent = "Sorry, the message could not be sent. Please email me directly at " + SITE.email + ".";
      status.className = "form-status fail";
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  });
})();
