(function () {
  const tabelaAlunos = document.getElementById("tabelaUsuarios");
  const selCurso = document.getElementById("filtroCurso");
  const selStatus = document.getElementById("filtroStatus");
  const campoBuscaAluno = document.getElementById("buscarAluno");
  if (!tabelaAlunos) return;

  const esc =
    HS.esc ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));
  
  let matriculas = [];
  let listaCursos = [];
  
  function metricas(dados) {
    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };

    set("totalAlunos", dados.totalAlunos);
    set("alunosAtivos", dados.alunosAtivos);
    set("concluintes", dados.concluintes);
    set("novosSemana", dados.novosSemana);
  }

  function render() {
    const texto = (campoBuscaAluno?.value || "").trim().toLowerCase();
    const curso = selCurso?.value || "";
    const status = selStatus?.value || "";

    const lista = matriculas.filter((m) => {
      const nome = String(m.nome || "").toLowerCase();
      const email = String(m.email || "").toLowerCase();
      const cursoNome = String(m.cursoNome || "").toLowerCase();

      const combinaTexto =
        !texto ||
        nome.includes(texto) ||
        email.includes(texto) ||
        cursoNome.includes(texto);

      const combinaCurso = !curso || String(m.cursoId) === curso;

      const combinaStatus =
        !status || m.status === status;

      return combinaTexto && combinaCurso && combinaStatus;
    });

    if (!lista.length) {
      tabelaAlunos.innerHTML = `
        <tr>
          <td colspan="5" class="vazio">
            Nenhum aluno encontrado com os filtros selecionados.
          </td>
        </tr>
      `;
      return;
    }

    tabelaAlunos.innerHTML = lista.map((m) => {
      const progresso = Math.max(
        0,
        Math.min(100, Number(m.progresso) || 0)
      );

      const certificado = m.certificado
        ? "Emitido"
        : "—";

      const nota = m.nota !== null && m.nota !== undefined
        ? m.nota
        : "—";

      return `
        <tr>
          <td>
            ${esc(m.nome)}
            <br>
            <small>${esc(m.email)}</small>
          </td>
          <td>${esc(m.cursoNome || "—")}</td>
          <td>${progresso}%</td>
          <td>${certificado}</td>
          <td>${esc(String(nota))}</td>
        </tr>
      `;
    }).join("");
  }


async function carregarUsuarios() {
  tabelaAlunos.innerHTML = `
    <tr>
      <td colspan="5" class="vazio">Carregando alunos...</td>
    </tr>
  `;

    try {
      const resposta = await API.get("/professor/usuarios");

      matriculas = resposta.matriculas || [];

      metricas(resposta.metricas);

      // Identifica os cursos sem repetir opções.
      listaCursos = [
        ...new Map(
          matriculas.map((m) => [
            String(m.cursoId),
            {
              id: m.cursoId,
              nome: m.cursoNome
            }
          ])
        ).values()
      ];

      if (selCurso) {
        selCurso.innerHTML = '<option value="">Todos os cursos</option>';

        listaCursos.forEach((curso) => {
          const option = document.createElement("option");

          option.value = curso.id;
          option.textContent = curso.nome;

          selCurso.appendChild(option);
        });
      }

      render();

    } catch (erro) {
      console.error("Erro ao carregar usuários:", erro);

      tabelaAlunos.innerHTML = `
        <tr>
          <td colspan="5" class="vazio">
            Não foi possível carregar os alunos.
          </td>
        </tr>
      `;
    }
  }

  campoBuscaAluno?.addEventListener("input", render);
  selCurso?.addEventListener("change", render);
  selStatus?.addEventListener("change", render);

  carregarUsuarios();
})();
