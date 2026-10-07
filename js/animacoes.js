(function () {
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function logos() {
    document.querySelectorAll(".logo-img,.logo-h").forEach((img) => {
      if (img.parentElement.classList.contains("logo-wrap")) return;
      const w = document.createElement("span");
      w.className = "logo-wrap";
      w.style.setProperty("--m", `url("${img.getAttribute("src")}")`);
      img.replaceWith(w);
      w.appendChild(img);
    });
  }

  const SEL_NUM = ".card-metrica strong,.card-relatorio strong,.stats h3,#qtdEmAndamento,#qtdConcluidos,#progressoMedio,#qtdCertificados,.ranking-item-header strong";
  function contar(el) {
    const m = el.textContent.trim().match(/^([^\d-]*)([\d.,]+)(.*)$/);
    if (!m) return;
    const dec = (m[2].split(",")[1] || "").length;
    const alvo = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
    if (!isFinite(alvo) || alvo === 0) return;
    const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const t0 = performance.now();
    (function passo(t) {
      const p = Math.min(1, (t - t0) / 1100);
      el.textContent = m[1] + fmt(alvo * (1 - Math.pow(1 - p, 3))) + m[3];
      if (p < 1) requestAnimationFrame(passo);
    })(t0);
  }

  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      if (el.classList.contains("rv")) {
        el.classList.add("in");
        setTimeout(() => el.classList.remove("rv", "in"), 1400 + parseFloat(el.style.getPropertyValue("--d") || 0) * 1000);
      }
      if (el._contar) contar(el);
      if (el._largura) requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = "width 1.3s cubic-bezier(.2,.8,.2,1)";
        el.style.width = el._largura;
      }));
    });
  }, { threshold: 0.08 });

  const CONTAINERS = "#cursosGrid,#listaCursos,#listaNotificacoes,#listaTickets,#listaRecomendados,#listaUltimosAcessados,#listaAvisos,#listaCertificados,#listaFaq,#listaChamados,#rankingCursos,#tabelaUsuarios,#tabelaRepasses,#rankingVendas,#rankingAvaliacoes,#listaUsuariosDashboard,#listaCursosDashboard,.cards,.bottom-cards,.metricas-financeiras,.metricas-relatorios,.metricas-dashboard,.metricas-notificacao,.metricas-suporte,.acoes-suporte,.conteudos-grid,.stats";
  const BARRAS = ".barra-progresso>div,.gam-barra>div,.barra>div,#atalhoProgressoBarra";

  function preparar() {
    if (reduz) return;
    const alvos = [];
    document.querySelectorAll("main>*,.hero-right>*,.secao,main section>.card,main .perfil-card").forEach((el) => alvos.push([el, 0]));
    document.querySelectorAll(CONTAINERS).forEach((c) => [...c.children].forEach((el, i) => alvos.push([el, Math.min(i, 10) * 0.07])));
    alvos.forEach(([el, d]) => {
      if (el.dataset.an || el.matches(".modal,script,style,canvas,.topbar,#overlay,.rv") ) return;
      el.dataset.an = "1";
      el.style.setProperty("--d", d + "s");
      el.classList.add("rv");
      io.observe(el);
    });
    document.querySelectorAll(SEL_NUM).forEach((el) => {
      if (el.dataset.cn) return;
      el.dataset.cn = "1"; el._contar = true; io.observe(el);
    });
    document.querySelectorAll(BARRAS).forEach((el) => {
      if (el.dataset.br || !el.style.width) return;
      el.dataset.br = "1";
      el._largura = el.style.width;
      el.style.transition = "none";
      el.style.width = "0%";
      io.observe(el);
    });

    const b = document.getElementById("badgeNotificacao");
    const sino = document.querySelector(".notification i");
    if (b && sino && Number(b.textContent) > 0) sino.classList.add("bell-shake");
  }

  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button,.btn-primary,.btn-outline");
    if (!b || reduz) return;
    const r = b.getBoundingClientRect();
    const s = document.createElement("span");
    const d = Math.max(r.width, r.height);
    s.className = "ripple";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    if (getComputedStyle(b).position === "static") b.style.position = "relative";
    b.appendChild(s);
    setTimeout(() => s.remove(), 650);
  });

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || reduz || e.ctrlKey || e.metaKey || a.target === "_blank") return;
    const h = a.getAttribute("href");
    if (!h || h.startsWith("#") || /^(https?:|mailto:|tel:)/.test(h)) return;
    e.preventDefault();
    document.body.classList.add("saindo");
    setTimeout(() => (location.href = a.href), 200);
  });
  addEventListener("pageshow", () => document.body.classList.remove("saindo"));

  const nav = document.querySelector(".navbar");
  if (nav) addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 20), { passive: true });
  const hero = document.querySelector(".hero");
  if (hero && !reduz) hero.addEventListener("mousemove", (e) => {
    const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
    hero.querySelectorAll(".hero-right .dashboard-card").forEach((el) => (el.style.transform = `translate(${x * -8}px,${y * -8}px) rotateY(${x * 4}deg)`));
    hero.querySelectorAll(".hero-right .floating").forEach((el, i) => (el.style.translate = `${x * (14 + i * 8)}px ${y * (14 + i * 8)}px`));
  });

  window.HS = window.HS || {};
  HS.confete = function () {
    if (reduz) return;
    const c = document.createElement("canvas");
    c.id = "confete";
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const g = c.getContext("2d");
    const cores = ["#163b97", "#4f7cff", "#3aa935", "#7ac943", "#ffd23f", "#ffffff"];
    const ps = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 3,
      s: Math.random() * 8 + 4, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      cor: cores[(Math.random() * cores.length) | 0],
    }));
    const t0 = performance.now();
    (function f(t) {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.cor; g.globalAlpha = Math.max(0, 1 - (t - t0) / 3200);
        g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      });
      if (t - t0 < 3200) requestAnimationFrame(f); else c.remove();
    })(t0);
  };
  if (sessionStorage.getItem("confete")) { sessionStorage.removeItem("confete"); setTimeout(HS.confete, 500); }

  logos();
  preparar();
  let agenda;
  new MutationObserver(() => { clearTimeout(agenda); agenda = setTimeout(() => { logos(); preparar(); }, 60); })
    .observe(document.body, { childList: true, subtree: true });
})();
