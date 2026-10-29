(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  const ler = (chave, padrao) => {
    try {
      const valor = JSON.parse(localStorage.getItem(chave));
      return valor ?? padrao;
    } catch (e) {
      return padrao;
    }
  };

  let cursos = ler("cursos", []);
  if (!Array.isArray(cursos)) cursos = [];

  const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const imagem = (src) => esc(src || "./img/perfil.svg");

  function atualizarMetricas() {
    const totalCursos = cursos.length;
    const totalAlunos = cursos.reduce((total, curso) => total + numero(curso.alunos), 0);
    const receitaTotal = cursos.reduce((total, curso) => total + numero(curso.preco) * numero(curso.vendas), 0);
    const publicados = cursos.filter((curso) => curso.status === "Publicado").length;

    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };
    set("totalCursos", totalCursos);
    set("totalAlunos", totalAlunos);
    set("receitaTotal", "R$ " + receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    set("cursosPublicados", publicados);
  }

  function renderizarCursosDashboard() {
    const lista = document.getElementById("listaCursosDashboard");
    if (!lista) return;
    const busca = document.querySelector(".cards .search input");
    const termo = (busca?.value || "").trim().toLowerCase();
    const filtrados = termo
      ? cursos.filter((curso) => String(curso.nome || "").toLowerCase().includes(termo))
      : cursos;

    if (!filtrados.length) {
      lista.innerHTML = `<p class="vazio">${termo ? "Nenhum curso encontrado para a busca." : "Nenhum curso criado ainda."}</p>`;
      return;
    }

    lista.innerHTML = filtrados
      .map(
        (curso) => `
      <div class="curso">
        <img src="${imagem(curso.imagem)}" alt="${esc(curso.nome || "Curso")}" />
        <div>
          <h4>${esc(curso.nome || "Curso sem nome")}</h4>
          <p>${esc(curso.status || "—")}</p>
        </div>
        <strong>${numero(curso.alunos)}</strong>
      </div>`,
      )
      .join("");
  }

  function renderizarMaisVendidos() {
    const tabela = document.getElementById("rankingVendas");
    if (!tabela) return;

    if (!cursos.length) {
      tabela.innerHTML = `<tr><td colspan="3">Nenhum curso encontrado</td></tr>`;
      return;
    }

    const ranking = cursos
      .slice()
      .sort((a, b) => numero(b.vendas) - numero(a.vendas))
      .slice(0, 3);

    tabela.innerHTML = ranking
      .map(
        (curso, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(curso.nome || "Curso")}</td>
        <td>${numero(curso.vendas)}</td>
      </tr>`,
      )
      .join("");
  }

  function renderizarAvaliacoes() {
    const tabela = document.getElementById("rankingAvaliacoes");
    if (!tabela) return;

    const cursosComAvaliacao = cursos.filter(
      (curso) => numero(curso.vendas) > 0 && numero(curso.avaliacao) > 0,
    );

    if (!cursosComAvaliacao.length) {
      tabela.innerHTML = `<tr><td colspan="3">Nenhum curso avaliado ainda</td></tr>`;
      return;
    }

    const ranking = cursosComAvaliacao
      .slice()
      .sort((a, b) => numero(b.avaliacao) - numero(a.avaliacao))
      .slice(0, 3);

    tabela.innerHTML = ranking
      .map(
        (curso, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(curso.nome || "Curso")}</td>
        <td>⭐ ${numero(curso.avaliacao).toFixed(1)}</td>
      </tr>`,
      )
      .join("");
  }

  function renderizarUsuariosDashboard() {
    const lista = document.getElementById("listaUsuariosDashboard");
    if (!lista) return;

    const usuarios = HS.alunos();
    if (!usuarios.length) {
      lista.innerHTML = `<p>Nenhum usuário encontrado.</p>`;
      return;
    }

    lista.innerHTML = usuarios
      .slice(0, 5)
      .map((usuario) => {
        const nome = usuario.nome || "Aluno";
        const avatar =
          usuario.foto ||
          (typeof window.HSAvatar === "function" ? window.HSAvatar(nome) : "./img/perfil.svg");
        return `
      <div class="usuario-dashboard">
        <img src="${esc(avatar)}" alt="${esc(nome)}" />
        <div class="usuario-info">
          <strong>${esc(nome)}</strong>
          <small>${esc(usuario.cursoNome || "—")}</small>
        </div>
      </div>`;
      })
      .join("");
  }

  /* ---------- Gráfico ---------- */
  function meses(qtd) {
    const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const hoje = new Date();
    const labels = [];
    for (let i = qtd - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      labels.push(nomes[d.getMonth()]);
    }
    return labels;
  }

  function dadosGrafico(qtd) {
    const total = cursos.reduce((t, c) => t + numero(c.alunos), 0);
    return Array.from({ length: qtd }, (_, i) => Math.round((total * (i + 1)) / qtd));
  }

  let grafico = null;

  function criarGrafico() {
    const canvas = document.getElementById("graficoVendas");
    if (!canvas) return;
    if (!window.Chart) {
      canvas.style.display = "none";
      const aviso = document.createElement("p");
      aviso.className = "vazio";
      aviso.textContent = "Não foi possível carregar o gráfico. Verifique sua conexão.";
      canvas.insertAdjacentElement("afterend", aviso);
      return;
    }
    if (grafico) {
      grafico.destroy();
      grafico = null;
    }
    grafico = new Chart(canvas, {
      type: "line",
      data: {
        labels: meses(6),
        datasets: [
          {
            label: "Matrículas",
            data: dadosGrafico(6),
            borderColor: "#4f7cff",
            backgroundColor: "rgba(79,124,255,0.15)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#4f7cff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#f7f9fa" },
            border: { display: false },
          },
          x: { grid: { display: false }, border: { display: false } },
        },
      },
    });
  }

  atualizarMetricas();
  renderizarCursosDashboard();
  renderizarMaisVendidos();
  renderizarAvaliacoes();
  renderizarUsuariosDashboard();
  criarGrafico();

  document.querySelector(".cards .search input")?.addEventListener("input", renderizarCursosDashboard);

  document.querySelector(".grafico-topo select")?.addEventListener("change", (e) => {
    const qtd = String(e.target.value).includes("12") ? 12 : 6;
    if (!grafico) return;
    grafico.data.labels = meses(qtd);
    grafico.data.datasets[0].data = dadosGrafico(qtd);
    grafico.update();
  });
})();
