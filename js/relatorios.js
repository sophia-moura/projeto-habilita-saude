const cursos = JSON.parse(localStorage.getItem("cursos")) || [];

const filtroCurso = document.getElementById("filtroCurso");

// ========================
// MÉTRICAS
// ========================

function atualizarMetricas() {
  const totalInscricoes = cursos.reduce(
    (total, curso) => total + (curso.alunos || 0),
    0,
  );

  const totalConcluidos = cursos.reduce(
    (total, curso) => total + (curso.concluidos || 0),
    0,
  );

  const atividadesPendentes = cursos.reduce(
    (total, curso) => total + (curso.atividadesPendentes || 0),
    0,
  );

  const receitaTotal = cursos.reduce(
    (total, curso) => total + (curso.alunos || 0) * (curso.preco || 0),
    0,
  );

  document.getElementById("totalInscricoes").textContent = totalInscricoes;

  document.getElementById("totalConcluidos").textContent = totalConcluidos;

  document.getElementById("atividadesPendentes").textContent =
    atividadesPendentes;

  document.getElementById("receitaTotal").textContent =
    receitaTotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
}

// ========================
// FILTRO CURSOS
// ========================

function carregarCursosFiltro() {
  cursos.forEach((curso) => {
    filtroCurso.innerHTML += `
      <option value="${curso.id}">
        ${curso.nome}
      </option>
    `;
  });
}

// ========================
// GRÁFICO CURSOS
// ========================

function criarGraficoCursos() {
  new Chart(document.getElementById("graficoCursos"), {
    type: "line",

    data: {
      labels: cursos.map((c) => c.nome),

      datasets: [
        {
          label: "Inscrições",
          data: cursos.map((c) => c.alunos || 0),
          borderColor: "#163b97",
          backgroundColor: "#163b97",
          tension: 0.4,
          fill: false,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,
    },
  });
}

function criarGraficoStatus() {
  const concluidas = cursos.reduce((t, c) => t + (c.concluidos || 0), 0);

  const pendentes = cursos.reduce(
    (t, c) => t + (c.atividadesPendentes || 0),
    0,
  );

  const atrasadas = Math.floor(pendentes * 0.3);

  new Chart(document.getElementById("graficoStatus"), {
    type: "doughnut",

    data: {
      labels: ["Concluídas", "Atrasadas", "Pendentes"],

      datasets: [
        {
          data: [concluidas, atrasadas, pendentes],

          backgroundColor: ["#22c55e", "#f59e0b", "#163b97"],

          borderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// ========================
// GRÁFICO STATUS
// ========================

function atualizarStatus() {
  const concluidas = cursos.reduce((t, c) => t + (c.concluidos || 0), 0);

  const pendentes = cursos.reduce(
    (t, c) => t + (c.atividadesPendentes || 0),
    0,
  );

  document.getElementById("statusConcluidas").textContent = concluidas;

  document.getElementById("statusPendentes").textContent = pendentes;

  document.getElementById("statusAtrasadas").textContent = Math.floor(
    pendentes * 0.3,
  );

  atualizarMetricas();

  atualizarStatus();

  carregarCursosFiltro();

  criarGraficoCursos();

  criarGraficoStatus();

  renderRanking();
}

// ========================
// RANKING
// ========================

function renderRanking() {
  const ranking = [...cursos]
    .sort((a, b) => (b.alunos || 0) - (a.alunos || 0))
    .slice(0, 5);

  const container = document.getElementById("rankingCursos");

  container.innerHTML = "";

  const maior = ranking[0]?.alunos || 1;

  ranking.forEach((curso) => {
    const porcentagem = ((curso.alunos || 0) * 100) / maior;

    container.innerHTML += `
      <div class="ranking-item">

        <div class="ranking-item-header">

          <span>
            ${curso.nome}
          </span>

          <strong>
  ${curso.alunos || 0}
</strong>

        </div>

        <div class="barra">
          <div
            style="
              width:${porcentagem}%;
            "
          ></div>
        </div>

      </div>
    `;
  });
}

document.getElementById("btnRelatorio").addEventListener("click", () => {
  criarNotificacao(
    "Relatório Gerado",
    "Relatório criado com sucesso",
    "relatorio",
  );

  alert("Relatório gerado com sucesso!");
});

// ========================

atualizarMetricas();

carregarCursosFiltro();

criarGraficoCursos();

criarGraficoStatus();

renderRanking();

document.getElementById("btnDownload").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  const totalInscricoes =
    document.getElementById("totalInscricoes").textContent;

  const totalConcluidos =
    document.getElementById("totalConcluidos").textContent;

  const atividadesPendentes = document.getElementById(
    "atividadesPendentes",
  ).textContent;

  const receita = document.getElementById("receitaTotal").textContent;

  doc.setFontSize(18);
  doc.text("Relatório Geral da Plataforma", 20, 20);

  doc.setFontSize(12);

  doc.text(`Total de Inscrições: ${totalInscricoes}`, 20, 40);

  doc.text(`Conclusões de Curso: ${totalConcluidos}`, 20, 55);

  doc.text(`Atividades Pendentes: ${atividadesPendentes}`, 20, 70);

  doc.text(`Receita Gerada: ${receita}`, 20, 85);

  doc.save("relatorio-geral.pdf");
});

document.getElementById("btnBaixarRanking").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  const ranking = [...cursos]
    .sort((a, b) => (b.alunos || 0) - (a.alunos || 0))
    .slice(0, 5);

  doc.setFontSize(18);
  doc.text("Ranking de Cursos Mais Acessados", 20, 20);

  doc.setFontSize(12);

  let y = 40;

  ranking.forEach((curso, index) => {
    doc.text(
      `${index + 1}º - ${curso.nome} (${curso.alunos || 0} alunos)`,
      20,
      y,
    );

    y += 15;
  });

  doc.save("ranking-cursos.pdf");
});
