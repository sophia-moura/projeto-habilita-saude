(function () {
  /* ---------- Cursos em destaque ---------- */

  // Dados de demonstração: os mesmos cursos recomendados já presentes em
  // js/aluno-dados.js. Só são usados quando ainda não há cursos publicados.
  const CURSOS_DEMO = [
    {
      nome: "Farmacologia Básica",
      categoria: "Farmácia",
      imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=60",
    },
    {
      nome: "Saúde Mental no Trabalho",
      categoria: "Psicologia",
      imagem: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&q=60",
    },
    {
      nome: "Enfermagem em UTI",
      categoria: "Enfermagem",
      imagem: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400&q=60",
    },
    {
      nome: "Anatomia Humana Essencial",
      categoria: "Medicina",
      imagem: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=60",
    },
  ];

  function cursosPublicados() {
    try {
      const lista = JSON.parse(localStorage.getItem("cursos")) || [];
      return lista.filter((c) => c && c.status === "Publicado" && c.nome).slice(0, 4);
    } catch (e) {
      return [];
    }
  }

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto) e.textContent = texto;
    return e;
  }

  function criarCard(curso) {
    const card = el("a", "curso-card");
    card.href = "login.html?perfil=aluno";

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
  if (grid) {
    const reais = cursosPublicados();
    (reais.length ? reais : CURSOS_DEMO).forEach((c) => grid.appendChild(criarCard(c)));
  }

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
