// ==========================================================
// HABILITA SAÚDE — VISÃO DO ALUNO — MEUS CURSOS
// Depende de js/aluno-dados.js (dados no localStorage).
// ==========================================================

const cursos = obterCursosAluno();

// Estado atual dos filtros da tela
const filtros = {
  status: "todos",
  busca: "",
  area: "",
  categoria: "",
  ordenacao: "recentes",
};

// Elementos
const listaCursos = document.getElementById("listaCursos");
const campoBusca = document.getElementById("campoBusca");
const filtroArea = document.getElementById("filtroArea");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroOrdenacao = document.getElementById("filtroOrdenacao");
const abas = document.querySelectorAll(".aba");

// Rótulos dos status
const rotulosStatus = {
  andamento: { texto: "Em andamento", classe: "status-andamento" },
  concluido: { texto: "Concluído", classe: "status-concluido" },
  "nao-iniciado": { texto: "Não iniciado", classe: "status-nao-iniciado" },
};

// ----------------------------------------------------------
// CONTADORES DAS ABAS
// ----------------------------------------------------------

function atualizarContadores() {
  document.getElementById("contTodos").textContent = cursos.length;

  document.getElementById("contAndamento").textContent = cursos.filter(
    (c) => c.status === "andamento",
  ).length;

  document.getElementById("contConcluido").textContent = cursos.filter(
    (c) => c.status === "concluido",
  ).length;

  document.getElementById("contNaoIniciado").textContent = cursos.filter(
    (c) => c.status === "nao-iniciado",
  ).length;
}

// ----------------------------------------------------------
// PREENCHER OS SELECTS DE ÁREA E CATEGORIA
// (gerados a partir dos próprios cursos do aluno)
// ----------------------------------------------------------

function preencherFiltros() {
  const areas = [...new Set(cursos.map((c) => c.area))].sort();
  const categorias = [...new Set(cursos.map((c) => c.categoria))].sort();

  areas.forEach((area) => {
    filtroArea.innerHTML += `<option value="${area}">${area}</option>`;
  });

  categorias.forEach((categoria) => {
    filtroCategoria.innerHTML += `<option value="${categoria}">${categoria}</option>`;
  });
}

// ----------------------------------------------------------
// APLICAR FILTROS E ORDENAÇÃO
// ----------------------------------------------------------

function filtrarCursos() {
  let resultado = [...cursos];

  // Status (abas)
  if (filtros.status !== "todos") {
    resultado = resultado.filter((c) => c.status === filtros.status);
  }

  // Busca por palavra-chave (nome, professor, categoria)
  if (filtros.busca) {
    const termo = filtros.busca.toLowerCase();

    resultado = resultado.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.professor.toLowerCase().includes(termo) ||
        c.categoria.toLowerCase().includes(termo),
    );
  }

  // Área
  if (filtros.area) {
    resultado = resultado.filter((c) => c.area === filtros.area);
  }

  // Categoria
  if (filtros.categoria) {
    resultado = resultado.filter((c) => c.categoria === filtros.categoria);
  }

  // Ordenação
  if (filtros.ordenacao === "recentes") {
    resultado.sort((a, b) => {
      const dataA = a.ultimoAcesso ? new Date(a.ultimoAcesso) : 0;
      const dataB = b.ultimoAcesso ? new Date(b.ultimoAcesso) : 0;
      return dataB - dataA;
    });
  } else if (filtros.ordenacao === "progresso") {
    resultado.sort((a, b) => b.progresso - a.progresso);
  } else if (filtros.ordenacao === "matricula") {
    resultado.sort(
      (a, b) => new Date(b.dataMatricula) - new Date(a.dataMatricula),
    );
  } else if (filtros.ordenacao === "nome") {
    resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  return resultado;
}

// ----------------------------------------------------------
// RENDERIZAR A LISTA DE CURSOS
// ----------------------------------------------------------

function renderizarCursos() {
  const resultado = filtrarCursos();

  listaCursos.innerHTML = "";

  if (resultado.length === 0) {
    listaCursos.innerHTML = `
      <div class="lista-vazia">
        <i class="fa-regular fa-folder-open"></i>
        <p>Nenhum curso encontrado com os filtros selecionados.</p>
      </div>
    `;
    return;
  }

  resultado.forEach((curso) => {
    const status = rotulosStatus[curso.status];

    const textoBotao =
      curso.status === "concluido"
        ? "Revisar curso"
        : curso.status === "nao-iniciado"
          ? "Iniciar curso"
          : "Continuar curso";

    const iconeBotao =
      curso.status === "concluido" ? "fa-rotate-right" : "fa-play";

    listaCursos.innerHTML += `
      <article class="curso-card">
        <img src="${curso.imagem}" alt="${curso.nome}" />

        <div class="curso-card-conteudo">
          <div class="curso-card-topo">
            <h3>${curso.nome}</h3>
            <span class="status-curso ${status.classe}">${status.texto}</span>
          </div>

          <p class="curso-professor">
            <i class="fa-solid fa-chalkboard-user"></i>
            ${curso.professor}
          </p>

          <div class="curso-detalhes">
            <span><i class="fa-regular fa-clock"></i> ${curso.cargaHoraria}h</span>
            <span><i class="fa-solid fa-layer-group"></i> ${curso.categoria}</span>
            <span><i class="fa-regular fa-calendar"></i> Matrícula: ${formatarData(curso.dataMatricula)}</span>
          </div>

          <div class="curso-progresso">
            <div class="curso-progresso-texto">
              <span>Progresso</span>
              <strong>${curso.progresso}%</strong>
            </div>

            <div class="barra-progresso">
              <div style="width: ${curso.progresso}%"></div>
            </div>
          </div>
        </div>

        <div class="curso-card-acao">
          <button class="btn-curso" data-id="${curso.id}">
            <i class="fa-solid ${iconeBotao}"></i>
            ${textoBotao}
          </button>

          ${
            curso.status === "concluido"
              ? `<button class="btn-certificado" data-id="${curso.id}">
                   <i class="fa-solid fa-award"></i>
                   Certificado
                 </button>`
              : ""
          }
        </div>
      </article>
    `;
  });
}

// ----------------------------------------------------------
// EVENTOS
// ----------------------------------------------------------

// Abas de status
abas.forEach((aba) => {
  aba.addEventListener("click", () => {
    abas.forEach((a) => a.classList.remove("ativa"));
    aba.classList.add("ativa");

    filtros.status = aba.dataset.status;

    renderizarCursos();
  });
});

// Busca
campoBusca.addEventListener("input", (e) => {
  filtros.busca = e.target.value.trim();
  renderizarCursos();
});

// Filtro por área
filtroArea.addEventListener("change", (e) => {
  filtros.area = e.target.value;
  renderizarCursos();
});

// Filtro por categoria
filtroCategoria.addEventListener("change", (e) => {
  filtros.categoria = e.target.value;
  renderizarCursos();
});

// Ordenação
filtroOrdenacao.addEventListener("change", (e) => {
  filtros.ordenacao = e.target.value;
  renderizarCursos();
});

// ----------------------------------------------------------
// INICIALIZAÇÃO
// ----------------------------------------------------------

atualizarContadores();
preencherFiltros();
renderizarCursos();
