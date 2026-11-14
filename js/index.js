(function () {
  // Sessão ativa: a landing continua pública, mas os atalhos apontam para o
  // painel correto em vez de obrigar o usuário a passar pelo login novamente.
  function lerUsuarioLogado() {
    try {
      if (localStorage.getItem("usuarioLogado") !== "true") return null;
      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      return usuario && ["aluno", "professor"].includes(usuario.tipo) ? usuario : null;
    } catch (e) {
      return null;
    }
  }

  const usuarioLogado = lerUsuarioLogado();
  const professorLogado = usuarioLogado && usuarioLogado.tipo === "professor";
  const homeLogado = professorLogado ? "professor-inicio.html" : "aluno-inicio.html";
  const cursosLogado = professorLogado ? "professor-meus-cursos.html" : "aluno-meus-cursos.html";

  function configurarAtalhos() {
    if (!usuarioLogado) return;

    document.querySelectorAll(".acoes, .menu-acoes").forEach((grupo) => {
      grupo.innerHTML =
        `<a href="./${homeLogado}" class="btn-primary">Meu painel</a>` +
        `<a href="./index.html" class="btn-outline" data-logout>Sair</a>`;
    });

    const botoesHero = document.querySelector(".hero-buttons");
    if (botoesHero) {
      const principal = botoesHero.querySelector("a");
      const secundario = botoesHero.querySelectorAll("a")[1];
      if (principal) {
        principal.href = "./" + cursosLogado;
        principal.textContent = "Meus cursos →";
      }
      if (secundario) {
        secundario.href = professorLogado ? "./criar-curso.html" : "./certificados.html";
        secundario.textContent = professorLogado ? "Criar curso" : "Meus certificados";
      }
    }

    document.querySelectorAll('a[href="login.html?perfil=aluno"]').forEach((a) => {
      a.href = "./" + cursosLogado;
    });

    if (professorLogado) {
      document.querySelectorAll('a[href="login.html?perfil=professor"]').forEach((a) => {
        a.href = "./criar-curso.html";
        if (/ensinar/i.test(a.textContent)) a.textContent = "Criar curso";
      });
    }

    const navPlataforma = document.querySelector('.rodape-nav[aria-label="Plataforma"]');
    if (navPlataforma) {
      navPlataforma.innerHTML =
        `<h4>Plataforma</h4>` +
        `<a href="./${homeLogado}">Meu painel</a>` +
        `<a href="./index.html" data-logout>Sair</a>` +
        `<a href="validar.html">Validar certificado</a>`;
    }

    document.addEventListener("click", (e) => {
      const sair = e.target.closest("[data-logout]");
      if (!sair) return;
      e.preventDefault();
      if (!confirm("Deseja realmente sair da plataforma?")) return;
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("usuario");
      location.reload();
    });
  }

  configurarAtalhos();

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto) e.textContent = texto;
    return e;
  }

  function criarCard(curso) {
    const card = el("a", "curso-card");
    card.href = usuarioLogado ? "./" + cursosLogado : "login.html?perfil=aluno";

    const imgBox = el("div", "curso-img");
    if (curso.imagem) {
      const img = document.createElement("img");
      img.src = curso.imagem;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => img.remove();
      imgBox.appendChild(img);
    }

    const corpo = el("div", "curso-corpo");
    if (curso.categoria) corpo.appendChild(el("span", "curso-area", curso.categoria));
    corpo.appendChild(el("h3", "", curso.nome));

    const meta = el("div", "curso-meta");
    if (curso.professor) meta.appendChild(el("span", "", curso.professor));
    if (curso.cargaHoraria) meta.appendChild(el("span", "", String(curso.cargaHoraria)));
    if (meta.children.length) corpo.appendChild(meta);

    const rodape = el("div", "curso-rodape");
    rodape.appendChild(el("span", "", "Ver curso"));
    const seta = el("i", "", "→");
    seta.setAttribute("aria-hidden", "true");
    rodape.appendChild(seta);
    corpo.appendChild(rodape);

    card.append(imgBox, corpo);
    return card;
  }

  const grid = document.getElementById("cursosGrid");

  async function carregarCursosPublicados() {
    if (!grid) return;

    try {
      const resposta = await fetch("/api/cursos", {
        method: "GET",
        credentials: "include"
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível buscar os cursos.");
      }

      const cursos = await resposta.json();

      grid.innerHTML = "";

      if (!Array.isArray(cursos) || cursos.length === 0) {
        grid.textContent = "Nenhum curso publicado no momento.";
        return;
      }

      cursos.forEach((curso) => {
        grid.appendChild(criarCard({
          id: curso.id_curso,
          nome: curso.nome_curso,
          categoria: "Curso",
          professor: curso.nome_professor,
          descricao: curso.descricao,
          preco: curso.preco
        }));
      });

    } catch (erro) {
      console.error("Erro ao carregar cursos:", erro);
      grid.textContent = "Não foi possível carregar os cursos.";
    }
  }

  carregarCursosPublicados();

  /* ---------- Menu ---------- */

  const menu = document.getElementById("menu");
  const botaoMenu = document.getElementById("menuMobile");
  const indicador = document.querySelector(".menu-indicator");
  const links = [...document.querySelectorAll("#menu > a")];

  function definirMenu(aberto) {
    menu.classList.toggle("ativo", aberto);
    botaoMenu.setAttribute("aria-expanded", String(aberto));
    botaoMenu.textContent = aberto ? "✕" : "☰";
  }

  botaoMenu.addEventListener("click", () => definirMenu(!menu.classList.contains("ativo")));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) definirMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") definirMenu(false);
  });
  addEventListener("resize", () => {
    if (innerWidth > 860) definirMenu(false);
  });

  /* Indicador do link da seção visível */
  const secoes = links
    .map((a) => ({ link: a, secao: document.querySelector(a.getAttribute("href")) }))
    .filter((x) => x.secao);

  function moverIndicador(link) {
    if (!indicador || !link) return;
    indicador.style.left = link.offsetLeft + "px";
    indicador.style.width = link.offsetWidth + "px";
  }

  function atualizarAtivo() {
    let atual = secoes[0];
    secoes.forEach((s) => {
      if (scrollY >= s.secao.offsetTop - 160) atual = s;
    });
    // no fim da página, a última seção é a ativa
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      atual = secoes[secoes.length - 1];
    }
    links.forEach((a) => a.classList.toggle("ativo", a === atual.link));
    moverIndicador(atual.link);
  }

  addEventListener("scroll", atualizarAtivo, { passive: true });
  addEventListener("resize", atualizarAtivo);
  addEventListener("load", atualizarAtivo);
  atualizarAtivo();

  /* ---------- Rodapé ---------- */
  const ano = document.getElementById("anoAtual");
  if (ano) ano.textContent = new Date().getFullYear();
})();
