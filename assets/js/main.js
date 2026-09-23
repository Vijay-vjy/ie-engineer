/* =========================================================
   SITE SETTINGS — edit your contact details here once;
   every page picks them up automatically.
   ========================================================= */
const SITE = {
  name: "Vignesh Prabhu .S",
  email: "vigneshprabhuindia@gmail.com",          // TODO: your email
  phone: "+91 99437 49824",                  // TODO: your phone (display format)
  whatsapp: "919943749824",                  // TODO: WhatsApp number, digits only with country code
  linkedin: "https://www.linkedin.com/in/vignesh-prabhu-senthilkumar-636778305/",     // TODO: your LinkedIn profile URL
  location: "Tiruppur, Tamil Nadu, India",
  // Contact form: create a free form at https://formspree.io and paste its URL here.
  // Leave empty to open the visitor's email app instead.
  formEndpoint: ""
};

/* ---------- Fill contact details ---------- */
function fillSiteDetails() {
  const phoneHref = "tel:" + SITE.phone.replace(/[^\d+]/g, "");
  const map = {
    email: { text: SITE.email, href: "mailto:" + SITE.email },
    phone: { text: SITE.phone, href: phoneHref },
    whatsapp: { text: "Chat on WhatsApp", href: "https://wa.me/" + SITE.whatsapp },
    linkedin: { text: "LinkedIn profile", href: SITE.linkedin },
    location: { text: SITE.location }
  };
  document.querySelectorAll("[data-site]").forEach(el => {
    const d = map[el.dataset.site];
    if (!d) return;
    if (!el.hasAttribute("data-keep-text")) el.textContent = d.text;
    if (d.href && el.tagName === "A") {
      el.href = d.href;
      if (/^https?:/.test(d.href)) { el.target = "_blank"; el.rel = "noopener"; }
    }
  });
  document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
}

/* ---------- Header: shadow on scroll + mobile menu ---------- */
function initHeader() {
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  // Active link
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a[data-page]").forEach(a => {
    if (a.dataset.page === page || (page === "" && a.dataset.page === "index.html")) a.classList.add("active");
  });
}

/* ---------- Fade-up on scroll ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("visible")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(i => io.observe(i));
}

/* ---------- Animated counters ---------- */
function initCounters() {
  const els = document.querySelectorAll("[data-count]");
  const run = el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const start = performance.now(), dur = 1400;
    const step = t => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

/* ---------- Small toast helper (used by calculator) ---------- */
function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

document.addEventListener("DOMContentLoaded", () => {
  fillSiteDetails();
  initHeader();
  initReveal();
  initCounters();
});
