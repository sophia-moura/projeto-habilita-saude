(function () {
  const tabelaAlunos = document.getElementById("tabelaUsuarios");
  const selCurso = document.getElementById("filtroCurso");
  const selStatus = document.getElementById("filtroStatus");
  const campoBuscaAluno = document.getElementById("buscarAluno");
  if (!tabelaAlunos) return;

  const esc =
    HS.esc ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));
  const cursosProf = JSON.parse(localStorage.getItem("cursos") || "[]");
  const listaCursos = Array.isArray(cursosProf) ? cursosProf : [];

  if (selCurso) {
    listaCursos.forEach((c) => {
      if (!c || c.id === undefined || !c.nome) return;
      selCurso.insertAdjacentHTML(
        "beforeend",
        `<option value="${esc(String(c.id))}">${esc(c.nome)}</option>`,
      );
    });
  }

  const matriculas = HS.matriculas();

  function metricas() {
    const emails = new Set(matriculas.map((m) => m.email).filter(Boolean));
    const ativos = new Set(
      matriculas
        .filter((m) => m.status !== "concluido")
        .map((m) => m.email)
        .filter(Boolean),
    );
    const semana = Date.now() - 7 * 864e5;
    const concluintes = new Set(
      matriculas
        .filter((m) => m.status === "concluido")
        .map((m) => m.email)
        .filter(Boolean),
    );
    const novos = new Set(
      matriculas
        .filter((m) => {
          const d = new Date(m.data);
          return !isNaN(d) && d.getTime() >= semana;
        })
        .map((m) => m.email)
        .filter(Boolean),
    );

    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };
    set("totalAlunos", emails.size);
    set("alunosAtivos", ativos.size);
    set("concluintes", concluintes.size);
    set("novosSemana", novos.size);
  }

  function render() {
    const texto = (campoBuscaAluno?.value || "").trim().toLowerCase();
    const curso = selCurso?.value || "";
    const status = selStatus?.value || "";

    const lista = matriculas.filter((m) => {
      const nome = String(m.nome || "").toLowerCase();
      const email = String(m.email || "").toLowerCase();
      const cursoNome = String(m.cursoNome || "").toLowerCase();
      const combinaTexto = !texto || nome.includes(texto) || email.includes(texto) || cursoNome.includes(texto);
      const combinaCurso = !curso || String(m.cursoId) === curso;
      const combinaStatus =
        !status || (status === "concluido" ? m.status === "concluido" : m.status !== "concluido");
      return combinaTexto && combinaCurso && combinaStatus;
    });

    if (!lista.length) {
      tabelaAlunos.innerHTML = `<tr><td colspan="5" class="vazio">Nenhum aluno encontrado com os filtros selecionados.</td></tr>`;
      return;
    }

    tabelaAlunos.innerHTML = lista
      .map((m) => {
        const cursoDoAluno = listaCursos.find((c) => String(c.id) === String(m.cursoId));
        const cert =
          m.status === "concluido" && cursoDoAluno?.certificado !== "Sem Certificado"
            ? "Emitido"
            : "—";
        const progresso = Math.max(0, Math.min(100, Number(m.progresso) || 0));
        return `<tr>
          <td>${esc(m.nome)}<br><small>${esc(m.email)}</small></td>
          <td>${esc(m.cursoNome || cursoDoAluno?.nome || "—")}</td>
          <td>${progresso}%</td>
          <td>${cert}</td>
          <td>—</td>
        </tr>`;
      })
      .join("");
  }

  campoBuscaAluno?.addEventListener("input", render);
  selCurso?.addEventListener("change", render);
  selStatus?.addEventListener("change", render);
  metricas();
  render();
})();
