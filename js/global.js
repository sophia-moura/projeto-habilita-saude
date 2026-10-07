(function () {
  const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const salvar = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const pagina = location.pathname.split("/").pop() || "index.html";
  const logado = localStorage.getItem("usuarioLogado") === "true";
  const usuario = ls("usuario", null);
  const tipo = usuario && usuario.tipo;
  const home = (t) => (t === "aluno" ? "aluno-inicio.html" : "dashboard.html");
  const soProfessor = ["dashboard.html", "meus-cursos.html", "criar-curso.html", "financas.html", "usuarios.html", "relatorios.html", "suporte.html", "configuracoes-niveis.html"];
  const soAluno = ["aluno-inicio.html", "aluno-meus-cursos.html", "aluno-suporte.html", "aula.html"];
  const publicas = ["index.html", "login.html", "validar.html"];

  if (!publicas.includes(pagina)) {
    if (!logado || !tipo) return void location.replace("index.html");
    if (soProfessor.includes(pagina) && tipo !== "professor") return void location.replace(home(tipo));
    if (soAluno.includes(pagina) && tipo !== "aluno") return void location.replace(home(tipo));
  } else if (pagina === "login.html" && logado && tipo) {
    return void location.replace(home(tipo));
  }

  if (tipo === "professor") {
    const ul = document.querySelector(".sidebar ul");
    if (ul && !ul.querySelector('a[href*="dashboard"]')) {
      const itens = [["dashboard", "house", "Início"], ["meus-cursos", "book", "Meus Cursos"], ["financas", "chart-pie", "Finanças"], ["criar-curso", "plus", "Criar Curso"], ["usuarios", "users", "Usuários"], ["relatorios", "chart-line", "Relatórios"]];
      ul.innerHTML = itens.map(([p, i, t]) => `<li><a href="./${p}.html"><i class="fa-solid fa-${i}"></i> ${t}</a></li>`).join("");
    }
    const h1 = document.querySelector(".topbar h1");
    if (h1 && /ALUNO/i.test(h1.textContent)) h1.textContent = "PROFESSOR";
  }
  if (tipo === "aluno") {
    document.querySelectorAll('a[href="suporte.html"]').forEach((a) => (a.href = "aluno-suporte.html"));
  }

  if (tipo === "professor") {
    const ul2 = document.querySelector(".sidebar ul");
    if (ul2 && !ul2.querySelector('a[href*="configuracoes-niveis"]'))
      ul2.insertAdjacentHTML("beforeend", `<li><a href="./configuracoes-niveis.html" ${pagina === "configuracoes-niveis.html" ? 'class="menu-ativo"' : ""}><i class="fa-solid fa-sliders"></i> Níveis</a></li>`);
  }

  if (!document.querySelector('link[rel="icon"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="./img/favicon.png">');
  const logoSide = document.querySelector(".logo-side");
  if (logoSide) {
    document.head.insertAdjacentHTML("beforeend", `<style>
      .logo-card{padding:0 4px;margin-bottom:8px;transition:transform .3s}
      .logo-card:hover{transform:scale(1.04)}
      .logo-h{height:58px;width:auto;display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}
    </style>`);
    logoSide.querySelectorAll("h2,p").forEach((e) => (e.style.display = "none"));
    logoSide.insertAdjacentHTML("afterbegin", '<div class="logo-card"><img class="logo-h" src="./img/logo-claro.png" alt="Habilita Saúde"></div>');
  }

  document.querySelectorAll('a[href$="criar-curso.html"]').forEach((a) =>
    a.addEventListener("click", () => localStorage.removeItem("cursoEditando")));

  const visivel = (n) => !n.para || n.para === tipo;
  function atualizarSino() {
    const naoLidas = ls("notificacoes", []).filter(visivel).filter((n) => !n.lida).length;
    const badge = document.getElementById("badgeNotificacao");
    if (badge) { badge.textContent = naoLidas; badge.style.display = naoLidas > 0 ? "flex" : "none"; }
  }
  function notificar(titulo, descricao, tipoNotif, para) {
    const l = ls("notificacoes", []);
    l.unshift({ id: Date.now() + Math.floor(Math.random() * 1000), titulo, descricao, tipo: tipoNotif, para, lida: false, data: new Date().toLocaleString("pt-BR") });
    salvar("notificacoes", l);
  }
  atualizarSino();

  const HS = {
    visivel,
    cursosPublicados: () => ls("cursos", []).filter((c) => c.status === "Publicado"),

    matricular(cursoId) {
      const cursos = ls("cursos", []);
      const c = cursos.find((x) => x.id === cursoId);
      const u = ls("usuario", null);
      if (!c || !u) return false;
      const mats = ls("matriculas", []);
      if (mats.some((m) => m.email === u.email && m.cursoId === c.id)) return false;

      mats.push({ id: Date.now(), cursoId: c.id, cursoNome: c.nome, nome: u.nome, email: u.email, foto: u.foto || "", data: new Date().toISOString() });
      c.alunos = (c.alunos || 0) + 1;
      c.vendas = (c.vendas || 0) + 1;
      salvar("matriculas", mats);
      salvar("cursos", cursos);

      const meus = ls("cursosAluno_v2", []);
      meus.push({
        id: c.id, nome: c.nome, area: c.categoria || "Saúde", categoria: c.nivel || c.categoria || "Curso",
        imagem: c.imagem, progresso: 0, cargaHoraria: parseInt(c.cargaHoraria) || 0,
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
        const a = meus.find((c) => c.id === m.cursoId);
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
        .bv-rodape h3{margin:0;color:#163b97;font-size:18px}.bv-rodape p{margin:2px 0 0;color:#6b7a99;font-size:13px}
        .bv-rodape button{border:0;border-radius:10px;padding:10px 18px;cursor:pointer;font-weight:600}
        #bvPular{background:#eef2fb;color:#163b97;margin-right:8px}#bvComecar{background:#163b97;color:#fff}
        @keyframes bvF{from{opacity:0}}@keyframes bvP{from{opacity:0;transform:translateY(40px) scale(.9)}}
      </style>
      <div class="bv-box">
        <video id="bvVideo" src="./media/boas-vindas.mp4" poster="./media/boas-vindas.jpg" controls playsinline></video>
        <div class="bv-rodape">
          <div><h3>Bem-vindo(a), ${(usuario.nome || "").split(" ")[0]}!</h3><p>${tipo === "professor" ? "Veja como publicar seus cursos e crescer na plataforma." : "Veja como começar sua jornada de aprendizado."}</p></div>
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
  if (tipo && (pagina === "dashboard.html" || pagina === "aluno-inicio.html")) setTimeout(() => HS.boasVindas(false), 700);

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", () => {
    if (!confirm("Deseja realmente sair da plataforma?")) return;
    localStorage.removeItem("usuarioLogado");
    location.href = "index.html";
  });

  const menuMobile = document.getElementById("menuMobile");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");
  if (menuMobile && sidebar && overlay) {
    menuMobile.addEventListener("click", () => { sidebar.classList.toggle("ativa"); overlay.classList.toggle("ativo"); });
    overlay.addEventListener("click", () => { sidebar.classList.remove("ativa"); overlay.classList.remove("ativo"); });
  }
})();
