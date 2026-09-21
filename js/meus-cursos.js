let cursos = JSON.parse(localStorage.getItem("cursos")) || [];

function carregarFiltros() {
  const cargas = [...new Set(cursos.map((c) => c.cargaHoraria))];

  const publicos = [...new Set(cursos.map((c) => c.publico))];

  cargas.forEach((carga) => {
    if (!carga) return;

    filtroCarga.innerHTML += `
      <option value="${carga}">
        ${carga}
      </option>
    `;
  });

  publicos.forEach((publico) => {
    if (!publico) return;

    filtroPublico.innerHTML += `
      <option value="${publico}">
        ${publico}
      </option>
    `;
  });
}

const grid = document.getElementById("cursosGrid");

const modalCurso = document.getElementById("modalCurso");

const detalhesCurso = document.getElementById("detalhesCurso");

const fechar = document.getElementById("fechar");

const busca = document.getElementById("buscaCurso");

const categoria = document.getElementById("categoria");

const filtroCarga = document.getElementById("filtroCarga");

const filtroPublico = document.getElementById("filtroPublico");

carregarFiltros();

// ========================
// RENDERIZAR CURSOS
// ========================

function renderCursos(lista) {
  grid.innerHTML = "";

  if (lista.length === 0) {
    grid.innerHTML = `
      <p style="
        grid-column:1/-1;
        text-align:center;
      ">
        Nenhum curso encontrado.
      </p>
    `;

    return;
  }

  lista.forEach((curso) => {
    const nivel = curso.nivel || "Silver";

    grid.innerHTML += `
      <div
        class="curso-card"
        data-id="${curso.id}"
      >

        <div class="curso-top">

          <img
            src="${curso.imagem}"
            alt="${curso.nome}"
          >

          <div class="tags">

            <span
              class="tag ${nivel.toLowerCase()}"
            >
              ${nivel}
            </span>

            <span
              class="status ${
                curso.status === "Privado" ? "privado" : "publicado"
              }"
            >
              ${curso.status}
            </span>

          </div>

        </div>

        <div class="curso-content">

          <h3>${curso.nome}</h3>

          <p>
            ${curso.descricao || "Sem descrição"}
          </p>

        </div>

        <div class="curso-info">

          <div>

            <strong>
              R$
              ${
                Number(curso.preco) === 0
                  ? "Gratuito"
                  : `${Number(curso.preco).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
              }
            </strong>

            <span>Receita</span>

          </div>

          <div>

            <strong>
              ${curso.alunos || 0}
            </strong>

            <span>Alunos</span>

          </div>

          <div>

            <strong>
              ${curso.vendas || 0}
            </strong>

            <span>Vendas</span>

          </div>

        </div>

        <div class="acoes">

  <button>Ver Ganhos</button>

  <button
    class="btn-editar"
    data-id="${curso.id}"
  >
    Editar
  </button>

  <button
    class="btn-excluir"
    data-id="${curso.id}"
  >
    Excluir
  </button>

</div>

      </div>
    `;
  });
}

// ========================
// MODAL
// ========================

function aplicarFiltros() {
  const texto = busca.value.toLowerCase();

  const categoriaSelecionada = categoria.value;

  const cargaSelecionada = filtroCarga.value;

  const publicoSelecionado = filtroPublico.value;

  let resultado = [...cursos];

  if (texto) {
    resultado = resultado.filter((c) => c.nome.toLowerCase().includes(texto));
  }

  if (categoriaSelecionada !== "Todas") {
    resultado = resultado.filter((c) => c.categoria === categoriaSelecionada);
  }

  if (cargaSelecionada !== "Todas") {
    resultado = resultado.filter((c) => c.cargaHoraria === cargaSelecionada);
  }

  if (publicoSelecionado !== "Todos") {
    resultado = resultado.filter((c) => c.publico === publicoSelecionado);
  }

  renderCursos(resultado);
}

function abrirDetalhes(curso) {
  detalhesCurso.innerHTML = `

    <h2>${curso.nome}</h2>

    <img
      src="${curso.imagem}"
      alt="${curso.nome}"
      style="
        width:100%;
        border-radius:12px;
        margin:15px 0;
      "
    >

    <p>
      ${curso.descricao || ""}
    </p>

    <hr style="margin:20px 0">

    <p>
      <strong>Categoria:</strong>
      ${curso.categoria || "-"}
    </p>

    <p>
      <strong>Alunos:</strong>
      ${curso.alunos || 0}
    </p>

    <p>
      <strong>Vendas:</strong>
      ${curso.vendas || 0}
    </p>

    <p>
      <strong>Receita:</strong>
      R$
      ${
        Number(curso.preco) === 0
          ? "Gratuito"
          : `${Number(curso.preco).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
      }
    </p>

    <p>
      <strong>Status:</strong>
      ${curso.status}
    </p>

  `;

  modalCurso.classList.add("show");
}

// ========================
// CLIQUES
// ========================

document.addEventListener("click", (e) => {
  // EDITAR

  if (e.target.classList.contains("btn-editar")) {
    e.stopPropagation();

    const id = Number(e.target.dataset.id);

    const curso = cursos.find((c) => c.id === id);

    if (!curso) return;

    localStorage.setItem("cursoEditando", JSON.stringify(curso));

    window.location.href = "criar-curso.html";

    return;
  }

  // ABRIR MODAL

  const card = e.target.closest(".curso-card");

  if (!card) return;

  const id = Number(card.dataset.id);

  const curso = cursos.find((c) => c.id === id);

  if (curso) {
    abrirDetalhes(curso);
  }
});

// ========================
// FECHAR MODAL
// ========================

fechar.addEventListener("click", () => {
  modalCurso.classList.remove("show");
});

// ========================
// BUSCA
// ========================

busca.addEventListener("input", aplicarFiltros);

categoria.addEventListener("change", aplicarFiltros);

filtroCarga.addEventListener("change", aplicarFiltros);

filtroPublico.addEventListener("change", aplicarFiltros);

// ========================
// FILTRO CATEGORIA
// ========================

// ========================
// SALVAR
// ========================

function salvarCursos() {
  localStorage.setItem("cursos", JSON.stringify(cursos));
}

salvarCursos();

renderCursos(cursos);

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("btn-excluir")) return;

  const id = Number(e.target.dataset.id);

  const confirmar = confirm("Deseja realmente excluir este curso?");

  if (!confirmar) return;

  cursos = cursos.filter((curso) => curso.id !== id);

  localStorage.setItem("cursos", JSON.stringify(cursos));

  filtroCarga.innerHTML =
    '<option value="Todas">Todas Cargas Horárias</option>';

  filtroPublico.innerHTML = '<option value="Todos">Todos os Públicos</option>';

  carregarFiltros();

  aplicarFiltros();
});

const menuMobile = document.getElementById("menuMobile");

const sidebar = document.querySelector(".sidebar");

const overlay = document.getElementById("overlay");

if (menuMobile) {
  menuMobile.addEventListener("click", () => {
    sidebar.classList.toggle("ativa");

    overlay.classList.toggle("ativo");
  });
}

if (overlay) {
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("ativa");

    overlay.classList.remove("ativo");
  });
}