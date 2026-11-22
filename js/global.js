
/* ==========================================
   API CENTRAL — HABILITA SAÚDE
========================================== */

window.API = {
    baseURL: "/api",

    async request(endpoint, options = {}) {
        const headers = {
            ...(options.headers || {})
        };

        const corpoEhFormData =
            options.body instanceof FormData;

        if (options.body && !corpoEhFormData) {
            headers["Content-Type"] =
                headers["Content-Type"] || "application/json";
        }

        const resposta = await fetch(
            `${this.baseURL}${endpoint}`,
            {
                ...options,
                credentials: "include",
                headers
            }
        );

        const tipoResposta =
            resposta.headers.get("content-type") || "";

        const dados = tipoResposta.includes("application/json")
            ? await resposta.json()
            : null;

        if (!resposta.ok) {
            throw new Error(
                dados?.erro ||
                `Erro na comunicação com o servidor (${resposta.status}).`
            );
        }

        return dados;
    },

    get(endpoint) {
        return this.request(endpoint);
    },

    post(endpoint, dados) {
        return this.request(endpoint, {
            method: "POST",
            body: JSON.stringify(dados)
        });
    },

    put(endpoint, dados) {
        return this.request(endpoint, {
            method: "PUT",
            body: JSON.stringify(dados)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, {
            method: "DELETE"
        });
    }
};


(async function () {

  const esc = (t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);

  const pagina = location.pathname.split("/").pop() || "index.html";

  let usuario = null;
  let tipo = null;

  const visivel = (n) => !n.para || n.para === tipo;
  
  async function notificar(titulo, descricao, tipoNotif, para) {
    try {
      // Só grava quando o destinatário é o usuário logado.
      if (!usuario || !usuario.id || para !== tipo) {
        return false;
      }

      await API.post("/notificacoes", {
        titulo: titulo,
        mensagem: descricao,
        destinatarioTipo: tipo,
        destinatarioId: usuario.id
      });

      await atualizarSino();
      return true;

    } catch (erro) {
      console.error("Erro ao criar notificação:", erro);
      return false;
    }
  }

  async function atualizarSino() {
    const badge = document.getElementById("badgeNotificacao");

    if (!badge || !usuario) return;

    try {
      const notificacoes = await API.get("/notificacoes");

      const naoLidas = notificacoes.filter(
        (n) => !n.lida
      ).length;

      badge.textContent = naoLidas > 99 ? "99+" : String(naoLidas);
      badge.hidden = naoLidas === 0;

      badge.setAttribute(
        "aria-label",
        naoLidas
          ? `${naoLidas} notificações não lidas`
          : "Nenhuma notificação não lida"
      );

    } catch (erro) {
      console.error("Erro ao atualizar sino:", erro);
    }
  }

  const HS = {
    esc,
    visivel,

    async cursosPublicados() {
    const cursos = await API.get("/cursos");

    return cursos.map((c) => ({
        id: c.id_curso,
        nome: c.nome_curso,
        descricao: c.descricao,
        preco: c.preco,
        status: c.status,
        imagem: c.imagem_url,
        professor: c.nome_professor
    }));
  },

    notificar,
    atualizarSino
  };
  window.HS = HS;

  HS.usuarioAtual = null;

  HS.carregarUsuario = async function () {
    try {
      const dados = await API.get("/usuario-logado");
      HS.usuarioAtual = dados?.usuario || null;
      return HS.usuarioAtual;
    } catch (erro) {
      HS.usuarioAtual = null;
      return null;
    }
  };

  HS.exigirLogin = async function (tipoEsperado = null) {
    const usuarioAtual = await HS.carregarUsuario();

    if (!usuarioAtual) {
      window.location.href = "login.html";
      return null;
    }

    if (tipoEsperado && usuarioAtual.tipo !== tipoEsperado) {
      window.location.href = "index.html";
      return null;
    }

    return usuarioAtual;
  };

  Object.defineProperties(HS, {
    usuario: { get: () => usuario },
    tipo: { get: () => tipo }
  });

  const home = (t) =>
      t === "aluno" ? "aluno-inicio.html" : "professor-inicio.html";

  const soProfessor = [
      "professor-inicio.html",
      "professor-meus-cursos.html",
      "criar-curso.html",
      "financas.html",
      "usuarios.html",
      "relatorios.html",
      "professor-suporte.html",
      "configuracoes-niveis.html"
  ];

  const soAluno = [
      "aluno-inicio.html",
      "aluno-meus-cursos.html",
      "aluno-suporte.html",
      "aula.html",
      "certificados.html"
  ];

  const publicas = ["index.html", "login.html", "validar.html"];

  HS.ready = (async () => {
    // Páginas que não exigem autenticação
    if (!publicas.includes(pagina)) {
      try {
        const dados = await API.get("/usuario-logado");

        if (!dados || !dados.usuario) {
          location.replace("index.html");
          return false;
        }

        usuario = dados.usuario;
        tipo = usuario.tipo;

      } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
        location.replace("index.html");
        return false;
      }

      // Impede que alunos acessem páginas de professores
      if (soProfessor.includes(pagina) && tipo !== "professor") {
        location.replace(home(tipo));
        return false;
      }

      // Impede que professores acessem páginas de alunos
      if (soAluno.includes(pagina) && tipo !== "aluno") {
        location.replace(home(tipo));
        return false;
      }

    } else if (pagina === "login.html") {
        try {
            const dados = await API.get("/usuario-logado");

            if (dados && dados.usuario) {
                usuario = dados.usuario;
                tipo = usuario.tipo;

                if (pagina === "login.html") {
                    location.replace(home(tipo));
                    return false;
                }
            }
        } catch (erro) {
            // É normal não haver sessão ativa.
        }
    }

    return true;
  })();

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
        .map(([p, i, t]) =>
          `<li><a href="./${p}"${p === ativo ? ' class="menu-ativo" aria-current="page"' : ""}><i class="fa-solid fa-${i}"></i> ${t}</a></li>`
        )
        .join("");
    }

    const logoLink = document.querySelector(".logo-side a");
    if (logoLink) logoLink.href = "./" + home(tipo);

    const raiz = document.querySelector(".breadcrumb a:first-child");
    if (raiz) raiz.href = "./" + home(tipo);

    const tag = document.querySelector(".perfil-tag");
    if (tag) tag.textContent = tipo === "aluno" ? "Aluno" : "Professor";

    document.querySelectorAll(".link-suporte").forEach((a) => {
      a.href = "./" + suporteDe(tipo);
    });
  }

  if (!document.querySelector('link[rel="icon"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="icon" href="./img/favicon.png">');

  HS.boasVindas = async function (forcar) {
    let boasVindasVista = false;

    try {
        const preferencias = await API.get("/preferencias/boas-vindas");
        boasVindasVista = preferencias.boasVindasVista;
    } catch (erro) {
        console.error("Erro ao consultar preferência de boas-vindas:", erro);
    }

    if (!forcar && boasVindasVista) return;
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
    const fechar = async () => {
    v.pause();
    ov.remove();

    try {
        await API.put("/preferencias/boas-vindas", {});
    } catch (erro) {
        console.error("Erro ao salvar preferência de boas-vindas:", erro);
    }
  };
    ov.querySelector("#bvPular").onclick = fechar;
    ov.querySelector("#bvComecar").onclick = fechar;
    v.addEventListener("ended", () => setTimeout(fechar, 600));
  };

  HS.ready.then((ok) => {
    if (!ok) return;

    montarShell();
    atualizarSino();

    if (pagina === "professor-inicio.html" || pagina === "aluno-inicio.html") {
      setTimeout(() => HS.boasVindas(false), 700);
    }
  });

  const btnLogout = document.getElementById("btnLogout");

  if (btnLogout) {
      btnLogout.addEventListener("click", (e) => {
          e.preventDefault();
          location.replace("index.html");
      });
  }

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
