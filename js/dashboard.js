const cursos = JSON.parse(localStorage.getItem("cursos")) || [];

console.log("Cursos carregados:", cursos);

console.log(
  "Elemento Dashboard:",
  document.getElementById("listaCursosDashboard"),
);

console.log(cursos);

function atualizarMetricas() {
  const totalCursos = cursos.length;

  const totalAlunos = cursos.reduce(
    (total, curso) => total + (curso.alunos || 0),
    0,
  );

  const receitaTotal = cursos.reduce(
    (total, curso) => total + curso.preco * (curso.vendas || 0),
    0,
  );

  const publicados = cursos.filter(
    (curso) => curso.status === "Publicado",
  ).length;

  const totalCursosEl = document.getElementById("totalCursos");
  const totalAlunosEl = document.getElementById("totalAlunos");
  const receitaTotalEl = document.getElementById("receitaTotal");
  const cursosPublicadosEl = document.getElementById("cursosPublicados");

  if (totalCursosEl) {
    totalCursosEl.textContent = totalCursos;
  }

  if (totalAlunosEl) {
    totalAlunosEl.textContent = totalAlunos;
  }

  if (receitaTotalEl) {
    receitaTotalEl.textContent = "R$ " + receitaTotal.toLocaleString("pt-BR");
  }

  if (cursosPublicadosEl) {
    cursosPublicadosEl.textContent = publicados;
  }
}

function renderizarCursosDashboard() {
  const lista = document.getElementById("listaCursosDashboard");

  lista.innerHTML = "";

  if (cursos.length === 0) {
    lista.innerHTML = `
      <p>
        Nenhum curso criado.
      </p>
    `;

    return;
  }

  cursos.forEach((curso) => {
    lista.innerHTML += `
        <div class="curso">

          <img
            src="${curso.imagem}"
            alt="${curso.nome}"
          >

          <div>
            <h4>${curso.nome}</h4>

            <p>
              ${curso.status}
            </p>
          </div>

          <strong>
            ${curso.alunos || 0}
          </strong>

        </div>
      `;
  });
}

function renderizarMaisVendidos() {
  const tabela = document.getElementById("rankingVendas");

  tabela.innerHTML = "";

  if (cursos.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="3">
          Nenhum curso encontrado
        </td>
      </tr>
    `;

    return;
  }

  const ranking = [...cursos]
    .sort((a, b) => (b.vendas || 0) - (a.vendas || 0))
    .slice(0, 3);

  ranking.forEach((curso, index) => {
    tabela.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${curso.nome}</td>
          <td>${curso.vendas || 0}</td>
        </tr>
      `;
  });
}

function renderizarAvaliacoes() {
  const tabela = document.getElementById("rankingAvaliacoes");

  tabela.innerHTML = "";

  const cursosComAvaliacao = cursos.filter(
    (curso) => (curso.vendas || 0) > 0 && (curso.avaliacao || 0) > 0,
  );

  if (cursosComAvaliacao.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="3">
          Nenhum curso avaliado ainda
        </td>
      </tr>
    `;

    return;
  }

  const ranking = cursosComAvaliacao
    .sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0))
    .slice(0, 3);

  ranking.forEach((curso, index) => {
    tabela.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${curso.nome}</td>
        <td>⭐ ${curso.avaliacao || 0}</td>
      </tr>
    `;
  });
}

function renderizarUsuariosDashboard() {
  const lista = document.getElementById("listaUsuariosDashboard");

  if (!lista) return;

  lista.innerHTML = "";

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  if (usuarios.length === 0) {
    lista.innerHTML = `
      <p>Nenhum usuário encontrado.</p>
    `;
    return;
  }

  usuarios.slice(0, 5).forEach((usuario) => {
    lista.innerHTML += `
      <div class="usuario-dashboard">
        <img
          src="${usuario.foto || "./img/perfil.jpg"}"
          alt="${usuario.nome}"
        >

        <div class="usuario-info">
          <strong>${usuario.nome}</strong>
          <small>${usuario.status || "Ativo"}</small>
        </div>
      </div>
    `;
  });
}

renderizarUsuariosDashboard();

function criarNotificacao(titulo, descricao, tipo) {
  const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

  notificacoes.unshift({
    id: Date.now(),
    titulo,
    descricao,
    tipo,
    lida: false,
    data: new Date().toLocaleString("pt-BR"),
  });

  localStorage.setItem("notificacoes", JSON.stringify(notificacoes));
}

const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

const naoLidas = notificacoes.filter((n) => !n.lida).length;

document.getElementById("badgeNotificacao").textContent = naoLidas;

atualizarMetricas();

renderizarCursosDashboard();

renderizarMaisVendidos();

renderizarAvaliacoes();

const totalAlunos = cursos.reduce(
  (total, curso) => total + (curso.alunos || 0),
  0,
);

const dadosGrafico = [
  0,
  totalAlunos * 0.2,
  totalAlunos * 0.4,
  totalAlunos * 0.6,
  totalAlunos * 0.8,
  totalAlunos,
];

const ctx = document.getElementById("graficoVendas");

new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"],
    datasets: [
      {
        label: "Matrículas",
        data: dadosGrafico,

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

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      y: {
        y: {
  beginAtZero: true,
},

        grid: {
          color: "#edf1f7",
        },

        border: {
          display: false,
        },
      },

      x: {
        grid: {
          display: false,
        },

        border: {
          display: false,
        },
      },
    },
  },
});
