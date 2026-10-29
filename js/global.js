(function () {
  const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const salvar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = (t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const pagina = location.pathname.split("/").pop() || "index.html";
  const logado = localStorage.getItem("usuarioLogado") === "true";
  const usuario = ls("usuario", null);
  const tipo = usuario && usuario.tipo;
  const home = (t) => (t === "aluno" ? "aluno-inicio.html" : "professor-inicio.html");
  const soProfessor = ["professor-inicio.html", "professor-meus-cursos.html", "criar-curso.html", "financas.html", "usuarios.html", "relatorios.html", "professor-suporte.html", "configuracoes-niveis.html"];
  const soAluno = ["aluno-inicio.html", "aluno-meus-cursos.html", "aluno-suporte.html", "aula.html", "certificados.html"];
  const publicas = ["index.html", "login.html", "validar.html"];

  if (!publicas.includes(pagina)) {
    if (!logado || !tipo) return void location.replace("index.html");
    if (soProfessor.includes(pagina) && tipo !== "professor") return void location.replace(home(tipo));
    if (soAluno.includes(pagina) && tipo !== "aluno") return void location.replace(home(tipo));
  } else if (pagina === "login.html" && logado && tipo) {
    return void location.replace(home(tipo));
  }

  // Navegação canônica (Guia de Estilo v1.3): mesmos nomes e ícones nos dois perfis.
  const NAV = {
    aluno: [
      ["aluno-inicio.html", "house", "Início"],
      ["aluno-meus-cursos.html", "book", "Meus cursos"],
      ["certificados.html", "award", "Certificados"],
      ["aluno-suporte.html", "circle-question", "Suporte"],
    ],
    professor: [
      ["professor-inicio.html", "house", "Início"],
      ["professor-meus-cursos.html", "book", "Meus cursos"],
      ["criar-curso.html", "plus", "Criar curso"],
      ["usuarios.html", "users", "Usuários"],
      ["relatorios.html", "chart-line", "Relatórios"],
      ["financas.html", "chart-pie", "Finanças"],
      ["configuracoes-niveis.html", "gear", "Configurações"],
    ],
  };
  const ativoComo = { "aula.html": "aluno-meus-cursos.html" };
  const suporteDe = (t) => (t === "aluno" ? "aluno-suporte.html" : "professor-suporte.html");

  function montarShell() {
    if (!tipo || !NAV[tipo]) return;
    const ul = document.querySelector(".sidebar ul");
    if (ul) {
      const ativo = ativoComo[pagina] || pagina;
      ul.innerHTML = NAV[tipo]
        .map(([p, i, t]) => `<li><a href="./${p}"${p === ativo ? ' class="menu-ativo" aria-current="page"' : ""}><i class="fa-solid fa-${i}"></i> ${t}</a></li>`)
        .join("");
    }
    const logoLink = document.querySelector(".logo-side a");
    if (logoLink) logoLink.href = "./" + home(tipo);
    const raiz = document.querySelector(".breadcrumb a:first-child");
    if (raiz) raiz.href = "./" + home(tipo);
    const tag = document.querySelector(".perfil-tag");
    if (tag) tag.textContent = tipo === "aluno" ? "Aluno" : "Professor";
    document.querySelectorAll(".link-suporte").forEach((a) => (a.href = "./" + suporteDe(tipo)));
  }
  montarShell();

  if (!document.querySelector('link[rel="icon"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="./img/favicon.png">');

  document.querySelectorAll('a[href$="criar-curso.html"]').forEach((a) =>
    a.addEventListener("click", () => localStorage.removeItem("cursoEditando")));

  const visivel = (n) => !n.para || n.para === tipo;
  function atualizarSino() {
    const naoLidas = ls("notificacoes", []).filter(visivel).filter((n) => !n.lida).length;
    const badge = document.getElementById("badgeNotificacao");
    if (badge) { badge.textContent = naoLidas; badge.style.display = naoLidas > 0 ? "flex" : "none"; }
    const link = badge && badge.closest("a");
    if (link) {
      link.setAttribute(
        "aria-label",
        naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações",
      );
    }
  }
  function notificar(titulo, descricao, tipoNotif, para) {
    const l = ls("notificacoes", []);
    const lista = Array.isArray(l) ? l : [];
    lista.unshift({ id: Date.now() + Math.floor(Math.random() * 1000), titulo, descricao, tipo: tipoNotif, para, lida: false, data: new Date().toLocaleString("pt-BR") });
    salvar("notificacoes", lista);
  }
  atualizarSino();

  const HS = {
    esc,
    visivel,
    cursosPublicados: () => ls("cursos", []).filter((c) => c.status === "Publicado"),

    // Conteúdos de um curso: os do professor ou, na falta deles, os de exemplo.
    conteudosDoCurso(id) {
      const chave = String(id);
      const prof = ls("cursos", []).find((c) => String(c.id) === chave);
      if (prof && (prof.conteudos || []).length) return prof.conteudos;
      return (window.HS_CONTEUDOS_DEMO || {})[id] || (window.HS_CONTEUDOS_DEMO || {})[chave] || [];
    },

    matricular(cursoId) {
      const cursos = ls("cursos", []);
      const chave = String(cursoId);
      const c = cursos.find((x) => String(x.id) === chave);
      const u = ls("usuario", null);
      if (!c || !u || !u.email) return false;

      const mats = ls("matriculas", []);
      if (mats.some((m) => m.email === u.email && String(m.cursoId) === chave)) return false;

      const meus = ls("cursosAluno_v2", []);
      if (meus.some((m) => String(m.id) === chave)) return false;

      mats.push({ id: Date.now(), cursoId: c.id, cursoNome: c.nome, nome: u.nome, email: u.email, foto: u.foto || "", data: new Date().toISOString() });
      c.alunos = (Number(c.alunos) || 0) + 1;
      c.vendas = (Number(c.vendas) || 0) + 1;
      salvar("matriculas", mats);
      salvar("cursos", cursos);

      meus.push({
        id: c.id, nome: c.nome, area: c.categoria || "Saúde", categoria: c.nivel || c.categoria || "Curso",
        imagem: c.imagem, progresso: 0, cargaHoraria: parseInt(c.cargaHoraria, 10) || 0,
        professor: c.professor || "Professor(a)", dataMatricula: new Date().toISOString().slice(0, 10),
        ultimoAcesso: null, status: "nao-iniciado", certificado: c.certificado || "",
      });
      salvar("cursosAluno_v2", meus);

      notificar("Nova matrícula", `${u.nome} se matriculou em "${c.nome}".`, "curso", "professor");
      notificar("Matrícula confirmada", `Você agora está matriculado em "${c.nome}".`, "curso", "aluno");
      return true;
    },

    matriculas() {
      const meus = ls("cursosAluno_v2", []);
      return ls("matriculas", []).map((m) => {
        const a = meus.find((c) => String(c.id) === String(m.cursoId));
        return { ...m, progresso: a ? a.progresso : 0, status: a ? a.status : "nao-iniciado" };
      });
    },

    alunos() {
      const vistos = new Set();
      return ls("matriculas", []).slice().reverse().filter((m) => !vistos.has(m.email) && vistos.add(m.email));
    },

    notificar,
  };
  window.HS = HS;

  HS.boasVindas = function (forcar) {
    const chave = `boasVindas_${usuario.email}`;
    if (!forcar && localStorage.getItem(chave)) return;
    const ov = document.createElement("div");
    ov.id = "bvOverlay";
    ov.innerHTML = `
      <style>
        #bvOverlay{position:fixed;inset:0;z-index:100000;background:rgba(8,20,60,.82);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px;animation:bvF .4s ease}
        .bv-box{background:#fff;border-radius:22px;max-width:760px;width:100%;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.45);animation:bvP .6s cubic-bezier(.2,1.4,.4,1)}
        .bv-box video{width:100%;display:block;background:#000;aspect-ratio:16/9}
        .bv-rodape{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 22px;flex-wrap:wrap}
        .bv-rodape h3{margin:0;color:#0055c3;font-size:18px}.bv-rodape p{margin:2px 0 0;color:#718096;font-size:13px}
        .bv-rodape button{border:0;border-radius:10px;padding:10px 18px;cursor:pointer;font-weight:600}
        #bvPular{background:#eef2fb;color:#0055c3;margin-right:8px}#bvComecar{background:#0055c3;color:#fff}
        @keyframes bvF{from{opacity:0}}@keyframes bvP{from{opacity:0;transform:translateY(40px) scale(.9)}}
      </style>
      <div class="bv-box">
        <video id="bvVideo" src="./media/boas-vindas.mp4" poster="./media/boas-vindas.jpg" controls playsinline></video>
        <div class="bv-rodape">
          <div><h3>Bem-vindo(a), ${esc((usuario.nome || "").split(" ")[0])}!</h3><p>${tipo === "professor" ? "Veja como publicar seus cursos e crescer na plataforma." : "Veja como começar sua jornada de aprendizado."}</p></div>
          <div><button id="bvPular">Pular</button><button id="bvComecar">Começar</button></div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const v = ov.querySelector("#bvVideo");
    v.play().catch(() => {});
    const fechar = () => { v.pause(); ov.remove(); localStorage.setItem(chave, "1"); };
    ov.querySelector("#bvPular").onclick = fechar;
    ov.querySelector("#bvComecar").onclick = fechar;
    v.addEventListener("ended", () => setTimeout(fechar, 600));
  };
  if (tipo && (pagina === "professor-inicio.html" || pagina === "aluno-inicio.html")) setTimeout(() => HS.boasVindas(false), 700);

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", () => {
    if (!confirm("Deseja realmente sair da plataforma?")) return;
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("usuario");
    location.href = "index.html";
  });

  // Menu lateral no celular. Algumas páginas antigas não tinham #overlay;
  // criamos o elemento aqui para o comportamento ser igual em todas.
  const menuMobile = document.getElementById("menuMobile");
  const sidebar = document.querySelector(".sidebar");
  let overlay = document.getElementById("overlay");
  if (menuMobile && sidebar) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "overlay";
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    const menuAberto = () => sidebar.classList.contains("ativa");
    const definirMenu = (aberto) => {
      sidebar.classList.toggle("ativa", aberto);
      overlay.classList.toggle("ativo", aberto);
      menuMobile.setAttribute("aria-expanded", String(aberto));
      menuMobile.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("menu-aberto", aberto);
      if (aberto) {
        const primeiro = sidebar.querySelector("a, button");
        if (primeiro) primeiro.focus({ preventScroll: true });
      }
    };

    if (!sidebar.id) sidebar.id = "sidebarPrincipal";
    menuMobile.setAttribute("aria-expanded", "false");
    menuMobile.setAttribute("aria-controls", sidebar.id);
    menuMobile.addEventListener("click", () => definirMenu(!menuAberto()));
    overlay.addEventListener("click", () => definirMenu(false));
    sidebar.addEventListener("click", (e) => {
      if (e.target.closest("a")) definirMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuAberto()) {
        definirMenu(false);
        menuMobile.focus();
      }
    });
    addEventListener("resize", () => {
      if (innerWidth > 900 && menuAberto()) definirMenu(false);
    });
  }
})();
