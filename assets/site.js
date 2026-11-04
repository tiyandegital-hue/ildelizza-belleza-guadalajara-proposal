/* ============================================================
   Ildelizza demo — site.js
   ONE swappable business constant. Everything renders from it.
   ============================================================ */
"use strict";

const BUSINESS = {
  name: "Ildelizza Belleza Profesional",
  short: "Ildelizza",
  wa: "523336710133",                 // public mobile from lead data (WhatsApp not independently verified)
  waDisplay: "+52 33 3671 0133",
  address: "Av Mandarina 1622, Guadalajara, Jalisco, México",
  rating: "Google 4.58★ (50 reseñas)", // exact sourced form only
  demoUrl: "https://ildelizza-belleza-guadalajara-proposal.vercel.app",
};

const waLink = (text) =>
  "https://wa.me/" + BUSINESS.wa + "?text=" + encodeURIComponent(text || "Hola, vi la demo del asistente de WhatsApp y me interesa para mi salón.");

/* ---------- bind business data ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-biz]").forEach((el) => {
    const key = el.getAttribute("data-biz");
    if (key === "wa-link") el.setAttribute("href", waLink(el.getAttribute("data-wa-text") || undefined));
    else if (key === "wa-display") el.textContent = BUSINESS.waDisplay;
    else if (key === "maps") el.setAttribute("href",
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(BUSINESS.name + " " + BUSINESS.address));
    else if (BUSINESS[key] !== undefined) el.textContent = BUSINESS[key];
  });
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- nav ---------- */
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }));
  }

  /* ---------- reveal on scroll ---------- */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rvEls = document.querySelectorAll(".rv");
  if (reduced || !("IntersectionObserver" in window)) rvEls.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((ents) =>
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 });
    rvEls.forEach((el) => io.observe(el));
    // safety net: never leave content invisible if IO misbehaves
    setTimeout(() => rvEls.forEach((el) => el.classList.add("in")), 3000);
  }

  /* ---------- chat players ---------- */
  document.querySelectorAll("[data-chat]").forEach((root) => {
    const scriptName = root.getAttribute("data-chat");
    const script = CHAT_SCRIPTS[scriptName];
    if (script) new ChatPlayer(root, script, { autoplay: root.hasAttribute("data-autoplay") });
  });

  /* ---------- scenario tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach((wrap) => {
    const tabs = [...wrap.querySelectorAll('[role="tab"]')];
    const panels = [...wrap.querySelectorAll('[role="tabpanel"]')];
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.setAttribute("aria-selected", "true");
      const panel = wrap.querySelector("#" + tab.getAttribute("aria-controls"));
      if (panel) { panel.classList.add("active"); panel.querySelector(".chat-body")?.scrollTo(0, 0); }
    }));
  });
});

/* ============================================================
   ChatPlayer — scripted WhatsApp mock. A paused state machine:
   play → type → message → chips → play … replay resets all.
   ============================================================ */
class ChatPlayer {
  constructor(root, script, opts = {}) {
    this.root = root;
    this.body = root.querySelector(".chat-body");
    this.script = script;
    this.speed = 1;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.timer = null;
    this.buildControls();
    if (this.reduced) this.renderAll();
    else if (opts.autoplay) this.play();
    else this.renderIdle();
  }

  buildControls() {
    const bar = document.createElement("div");
    bar.className = "chat-controls";
    bar.innerHTML =
      '<button type="button" class="ctl-btn" data-act="play">▶ Reproducir</button>' +
      '<button type="button" class="ctl-btn" data-act="replay">↺ Repetir</button>' +
      '<button type="button" class="ctl-btn" data-act="speed" aria-pressed="false">Velocidad 1×</button>';
    bar.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.getAttribute("data-act");
      if (act === "play") this.play();
      if (act === "replay") this.replay();
      if (act === "speed") {
        this.speed = this.speed === 1 ? 2 : 1;
        e.target.textContent = "Velocidad " + this.speed + "×";
        e.target.setAttribute("aria-pressed", String(this.speed === 2));
      }
    });
    this.root.appendChild(bar);
  }

  clear() { this.stop(); this.body.innerHTML = ""; }
  stop() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }
  wait(ms) { return new Promise((res) => { this.timer = setTimeout(res, ms / this.speed); }); }
  scroll() { this.body.scrollTop = this.body.scrollHeight; }

  renderIdle() {
    this.body.innerHTML =
      '<div style="margin:auto;text-align:center;color:#8a8a8a;font-size:13.5px;max-width:34ch">' +
      "Pulsa <b>Reproducir</b> para ver cómo el asistente agenda una cita." + "</div>";
  }

  renderAll() {
    this.body.innerHTML = "";
    this.script.forEach((item) => {
      if (item.chips) return;
      this.addMsg(item.f, item.x, item.t, item.ej);
    });
    this.scroll();
  }

  addMsg(from, html, t, ejemplo) {
    const d = document.createElement("div");
    d.className = "msg " + (from === "m" ? "out" : "in");
    d.innerHTML = html + (ejemplo ? '<span class="ej">ejemplo</span>' : "") +
      (t ? '<span class="t">' + t + "</span>" : "");
    this.body.appendChild(d);
    this.scroll();
    return d;
  }

  typing() {
    const d = document.createElement("div");
    d.className = "msg in typing";
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = "<i></i><i></i><i></i>";
    this.body.appendChild(d); this.scroll();
    return d;
  }

  async play() {
    this.clear();
    for (const item of this.script) {
      if (item.chips) { await this.chipStep(item); continue; }
      if (item.f === "b") {
        const tp = this.typing();
        await this.wait(900 + Math.min(item.x.length * 12, 1400));
        tp.remove();
      } else {
        await this.wait(650);
      }
      this.addMsg(item.f, item.x, item.t, item.ej);
    }
  }

  chipStep(item) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "chips";
      let done = false;
      const pick = (label) => {
        if (done) return; done = true;
        wrap.remove();
        const t = item.then && item.then.t;
        this.addMsg("m", label, t || "");
        resolve();
      };
      item.chips.forEach((label) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.textContent = label;
        b.addEventListener("click", () => pick(label));
        wrap.appendChild(b);
      });
      this.body.appendChild(wrap); this.scroll();
      this.timer = setTimeout(() => pick(item.chips[0]), 2600 / this.speed);
    });
  }

  replay() { this.play(); }
}

/* ============================================================
   Scripts — every invented service/price/hour carries ej:true.
   ============================================================ */
const CHAT_SCRIPTS = {
  /* compact hero version */
  hero: [
    { f: "m", x: "Hola, ¿tienen lugar mañana para un corte?", t: "19:42" },
    { f: "b", x: "¡Hola! Claro que sí. Mañana tenemos estos horarios disponibles:", t: "19:42", ej: true },
    { chips: ["10:00", "12:30", "17:00"], then: { t: "19:43" } },
    { f: "b", x: "Perfecto: <b>corte de cabello</b>, mañana <b>12:30</b>. ¿A nombre de quién reservo?", t: "19:43", ej: true },
    { f: "m", x: "Mariana", t: "19:44" },
    { f: "b", x: "Listo, Mariana. Te esperamos mañana a las 12:30 en Av Mandarina 1622. Te enviaré un recordatorio un día antes.", t: "19:44", ej: true },
  ],

  /* full booking scenario */
  reservar: [
    { f: "m", x: "Hola, ¿tienen lugar mañana para un corte?", t: "19:42" },
    { f: "b", x: "¡Hola! Bienvenida a <b>" + BUSINESS.name + "</b>. Claro que sí — mañana tenemos estos horarios libres:", t: "19:42", ej: true },
    { chips: ["10:00", "12:30", "17:00"], then: { t: "19:43" } },
    { f: "b", x: "Anotado: <b>corte de cabello</b> — $250 MXN, mañana <b>12:30</b>. ¿A nombre de quién reservo?", t: "19:43", ej: true },
    { f: "m", x: "Mariana", t: "19:44" },
    { f: "b", x: "Listo, Mariana ✓ Tu cita quedó reservada.<br>Mañana 12:30 · Av Mandarina 1622, Guadalajara.<br>Te enviaré un recordatorio un día antes.", t: "19:44", ej: true },
  ],

  recordatorio: [
    { f: "b", x: "Hola Mariana, te escribe el asistente de <b>" + BUSINESS.name + "</b>.<br>Te recordamos tu cita de <b>mañana</b>: corte de cabello, <b>12:30</b>.", t: "09:00", ej: true },
    { chips: ["Confirmo mi cita", "Reprogramar"], then: { t: "09:12" } },
    { f: "b", x: "Cita confirmada. ¡Nos vemos mañana a las 12:30!", t: "09:12", ej: true },
  ],

  noShow: [
    { f: "b", x: "Hola Mariana, notamos que no pudiste asistir a tu cita de ayer.<br>¿Quieres reprogramarla? Tenemos estos espacios esta semana:", t: "10:15", ej: true },
    { chips: ["Jueves 11:00", "Viernes 16:00"], then: { t: "10:31" } },
    { f: "b", x: "Reprogramada para el <b>jueves 11:00</b>. Gracias por avisarnos — tu lugar quedó asegurado.", t: "10:31", ej: true },
  ],

  catalogo: [
    { f: "m", x: "¿Qué servicios tienen y cuánto cuestan?", t: "15:20" },
    { f: "b", x: "Con gusto. Este es nuestro menú:", t: "15:20", ej: true },
    { f: "b", x: "· Corte de cabello — <b>$250 MXN</b><br>· Manicura — <b>$300 MXN</b><br>· Maquillaje social — <b>$600 MXN</b><br>· Color — <b>desde $800 MXN</b>", t: "15:20", ej: true },
    { f: "b", x: "¿Te reservo alguno? También puedo mostrarte horarios.", t: "15:21" },
  ],
};
