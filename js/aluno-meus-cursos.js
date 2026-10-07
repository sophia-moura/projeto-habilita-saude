const cursos = obterCursosAluno();

const filtros = {
  status: "todos",
  busca: "",
  area: "",
  categoria: "",
  ordenacao: "recentes",
};

const listaCursos = document.getElementById("listaCursos");
const campoBusca = document.getElementById("campoBusca");
const filtroArea = document.getElementById("filtroArea");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroOrdenacao = document.getElementById("filtroOrdenacao");
const abas = document.querySelectorAll(".aba");

const rotulosStatus = {
  andamento: { texto: "Em andamento", classe: "status-andamento" },
  concluido: { texto: "Concluído", classe: "status-concluido" },
  "nao-iniciado": { texto: "Não iniciado", classe: "status-nao-iniciado" },
};

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

function filtrarCursos() {
  let resultado = [...cursos];

  if (filtros.status !== "todos") {
    resultado = resultado.filter((c) => c.status === filtros.status);
  }

  if (filtros.busca) {
    const termo = filtros.busca.toLowerCase();

    resultado = resultado.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.professor.toLowerCase().includes(termo) ||
        c.categoria.toLowerCase().includes(termo),
    );
  }

  if (filtros.area) {
    resultado = resultado.filter((c) => c.area === filtros.area);
  }

  if (filtros.categoria) {
    resultado = resultado.filter((c) => c.categoria === filtros.categoria);
  }

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

abas.forEach((aba) => {
  aba.addEventListener("click", () => {
    abas.forEach((a) => a.classList.remove("ativa"));
    aba.classList.add("ativa");

    filtros.status = aba.dataset.status;

    renderizarCursos();
  });
});

campoBusca.addEventListener("input", (e) => {
  filtros.busca = e.target.value.trim();
  renderizarCursos();
});

filtroArea.addEventListener("change", (e) => {
  filtros.area = e.target.value;
  renderizarCursos();
});

filtroCategoria.addEventListener("change", (e) => {
  filtros.categoria = e.target.value;
  renderizarCursos();
});

filtroOrdenacao.addEventListener("change", (e) => {
  filtros.ordenacao = e.target.value;
  renderizarCursos();
});

atualizarContadores();
preencherFiltros();
renderizarCursos();

listaCursos.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-curso");
  if (!btn) return;
  const curso = cursos.find((c) => c.id === Number(btn.dataset.id));
  if (!curso) return;
  const prof = JSON.parse(localStorage.getItem("cursos") || "[]").find((c) => c.id === curso.id);
  if (prof && (prof.conteudos || []).length) { location.href = "aula.html?id=" + curso.id; return; }
  if (curso.status === "concluido") return;

  curso.progresso = Math.min(100, curso.progresso + 20);
  curso.ultimoAcesso = new Date().toISOString();
  curso.status = curso.progresso >= 100 ? "concluido" : "andamento";
  salvarCursosAluno(cursos);

  HS.gam.xp(30, "Avançou em " + curso.nome);
  if (curso.status === "concluido") {
    HS.gam.xp(100, "Curso concluído");
    HS.confete && HS.confete();
    HS.notificar("Certificado emitido", `Seu certificado de ${curso.nome} já está disponível.`, "certificado", "aluno");
    const u = JSON.parse(localStorage.getItem("usuario") || "{}");
    HS.notificar("Curso concluído", `${u.nome} concluiu "${curso.nome}".`, "curso", "professor");
  }
  atualizarContadores();
  renderizarCursos();
});
