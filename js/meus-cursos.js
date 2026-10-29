(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  let cursos = (() => {
    try {
      const lista = JSON.parse(localStorage.getItem("cursos"));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  })();

  const grid = document.getElementById("cursosGrid");
  const modalCurso = document.getElementById("modalCurso");
  const detalhesCurso = document.getElementById("detalhesCurso");
  const fechar = document.getElementById("fechar");
  const busca = document.getElementById("buscaCurso");
  const categoria = document.getElementById("categoria");
  const filtroCarga = document.getElementById("filtroCarga");
  const filtroPublico = document.getElementById("filtroPublico");

  if (!grid) return;

  const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  function carregarFiltros() {
    if (!filtroCarga || !filtroPublico) return;
    filtroCarga.innerHTML = '<option value="Todas">Todas as cargas horárias</option>';
    filtroPublico.innerHTML = '<option value="Todos">Todos os públicos</option>';

    const cargas = [...new Set(cursos.map((c) => c.cargaHoraria).filter(Boolean))];
    const publicos = [...new Set(cursos.map((c) => c.publico).filter(Boolean))];

    cargas.forEach((carga) => {
      filtroCarga.insertAdjacentHTML("beforeend", `<option value="${esc(carga)}">${esc(carga)}</option>`);
    });
    publicos.forEach((publico) => {
      filtroPublico.insertAdjacentHTML("beforeend", `<option value="${esc(publico)}">${esc(publico)}</option>`);
    });
  }

  function renderCursos(lista) {
    if (!lista.length) {
      grid.innerHTML = cursos.length
        ? `<p class="estado-vazio">Nenhum curso encontrado com os filtros selecionados.</p>`
        : `<p class="estado-vazio">Você ainda não criou nenhum curso. <a href="./criar-curso.html">Criar meu primeiro curso</a>.</p>`;
      return;
    }

    grid.innerHTML = lista
      .map((curso) => {
        const nivel = (HS.niveis()[curso.nivel] || {}).nome || curso.nivel || "—";
        const preco = numero(curso.preco);
        const receita = preco === 0 ? "Gratuito" : preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
      <div class="curso-card" data-id="${esc(String(curso.id))}">
        <div class="curso-top">
          <img src="${esc(curso.imagem || "./img/perfil.svg")}" alt="${esc(curso.nome || "Curso")}" />
          <div class="tags">
            <span class="tag nivel-${esc(curso.nivel || "x")}">${esc(nivel)}</span>
            <span class="status ${curso.status === "Publicado" ? "publicado" : "privado"}">${esc(curso.status || "Privado")}</span>
          </div>
        </div>
        <div class="curso-content">
          <h3>${esc(curso.nome || "Curso sem nome")}</h3>
          <p>${esc(curso.descricao || "Sem descrição")}</p>
        </div>
        <div class="curso-info">
          <div><strong>R$ ${receita}</strong><span>Receita</span></div>
          <div><strong>${numero(curso.alunos)}</strong><span>Alunos</span></div>
          <div><strong>${numero(curso.vendas)}</strong><span>Vendas</span></div>
        </div>
        <div class="acoes">
          <button type="button" data-financas>Ver ganhos</button>
          <button type="button" class="btn-editar" data-id="${esc(String(curso.id))}">Editar</button>
          <button type="button" class="btn-excluir" data-id="${esc(String(curso.id))}">Excluir</button>
        </div>
      </div>`;
      })
      .join("");
  }

  function aplicarFiltros() {
    const texto = (busca?.value || "").trim().toLowerCase();
    const categoriaSelecionada = categoria?.value || "Todas";
    const cargaSelecionada = filtroCarga?.value || "Todas";
    const publicoSelecionado = filtroPublico?.value || "Todos";

    const resultado = cursos.filter((curso) => {
      if (texto && !String(curso.nome || "").toLowerCase().includes(texto)) return false;
      if (categoriaSelecionada !== "Todas" && curso.categoria !== categoriaSelecionada) return false;
      if (cargaSelecionada !== "Todas" && curso.cargaHoraria !== cargaSelecionada) return false;
      if (publicoSelecionado !== "Todos" && curso.publico !== publicoSelecionado) return false;
      return true;
    });

    renderCursos(resultado);
  }

  function abrirDetalhes(curso) {
    if (!detalhesCurso || !modalCurso) return;
    const preco = numero(curso.preco);
    const receita = preco === 0 ? "Gratuito" : preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const linhasCuradoria = Array.isArray(curso.curadoria?.linhas)
      ? curso.curadoria.linhas.map((l) => esc(l)).join("<br>")
      : "";

    detalhesCurso.innerHTML = `
      <h2>${esc(curso.nome || "Curso")}</h2>
      <img src="${esc(curso.imagem || "./img/perfil.svg")}" alt="${esc(curso.nome || "Curso")}" style="width:100%;border-radius:12px;margin:15px 0" />
      <p>${esc(curso.descricao || "")}</p>
      <hr style="margin:20px 0" />
      <p><strong>Categoria:</strong> ${esc(curso.categoria || "—")}</p>
      <p><strong>Alunos:</strong> ${numero(curso.alunos)}</p>
      <p><strong>Vendas:</strong> ${numero(curso.vendas)}</p>
      <p><strong>Receita:</strong> R$ ${receita}</p>
      <p><strong>Status:</strong> ${esc(curso.status || "—")}</p>
      ${curso.nivel ? `<p><strong>Certificação:</strong> ${esc(HS.rotulo(curso))}</p>` : ""}
      ${
        curso.curadoria
          ? `<p><strong>Curadoria (nota ${esc(curso.curadoria.nota)}):</strong> ${esc(curso.curadoria.parecer)}</p><small>${linhasCuradoria}</small>`
          : ""
      }`;

    modalCurso.classList.add("show");
    modalCurso.setAttribute("aria-hidden", "false");
  }

  function fecharModal() {
    if (!modalCurso) return;
    modalCurso.classList.remove("show");
    modalCurso.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", (e) => {
    const ganhos = e.target.closest("[data-financas]");
    if (ganhos) {
      e.stopPropagation();
      window.location.href = "financas.html";
      return;
    }

    const editar = e.target.closest(".btn-editar");
    if (editar) {
      e.stopPropagation();
      const curso = cursos.find((c) => String(c.id) === String(editar.dataset.id));
      if (!curso) return;
      try {
        localStorage.setItem("cursoEditando", JSON.stringify(curso));
      } catch (err) {
        alert("Não foi possível abrir o curso para edição.");
        return;
      }
      window.location.href = "criar-curso.html";
      return;
    }

    const excluir = e.target.closest(".btn-excluir");
    if (excluir) {
      e.stopPropagation();
      const id = excluir.dataset.id;
      if (!confirm("Deseja realmente excluir este curso?")) return;
      cursos = cursos.filter((curso) => String(curso.id) !== String(id));
      try {
        localStorage.setItem("cursos", JSON.stringify(cursos));
      } catch (err) {
        alert("Não foi possível excluir o curso.");
        return;
      }
      carregarFiltros();
      aplicarFiltros();
      return;
    }

    if (e.target.closest(".acoes")) return;
    const card = e.target.closest(".curso-card");
    if (!card) return;
    const curso = cursos.find((c) => String(c.id) === String(card.dataset.id));
    if (curso) abrirDetalhes(curso);
  });

  fechar?.addEventListener("click", fecharModal);
  modalCurso?.addEventListener("click", (e) => {
    if (e.target === modalCurso) fecharModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalCurso?.classList.contains("show")) fecharModal();
  });

  busca?.addEventListener("input", aplicarFiltros);
  categoria?.addEventListener("change", aplicarFiltros);
  filtroCarga?.addEventListener("change", aplicarFiltros);
  filtroPublico?.addEventListener("change", aplicarFiltros);

  carregarFiltros();
  renderCursos(cursos);
})();
