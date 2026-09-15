let notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

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

function renderizarNotificacoes(lista) {
  const container = document.getElementById("listaNotificacoes");

  container.innerHTML = "";

  lista.forEach((n) => {
    let icone = "fa-bell";

    if (n.tipo === "curso") {
      icone = "fa-book";
    }

    if (n.tipo === "ticket") {
      icone = "fa-ticket";
    }

    if (n.tipo === "relatorio") {
      icone = "fa-trophy";
    }

    if (n.tipo === "alerta") {
      icone = "fa-circle-exclamation";
    }

    container.innerHTML += `
      <div class="notificacao-card">

        <div class="icone ${n.tipo}">
          <i class="fa-solid ${icone}"></i>
        </div>

        <div class="conteudo">

          <h3>${n.titulo}</h3>

          <p>${n.descricao}</p>

          <small>${n.data}</small>

          ${
            !n.lida
              ? `
    <span
      class="marcar-lida"
      onclick="marcarComoLida(${n.id})"
    >
      <i class="fa-solid fa-check"></i>
      Marcar como lida
    </span>
  `
              : ""
          }

        </div>

      </div>
    `;
  });
}

function ativarFiltro(id) {
  document
    .querySelectorAll(".metricas-notificacao .card-metrica")
    .forEach((card) => card.classList.remove("ativo"));

  document.getElementById(id).classList.add("ativo");
}

document.getElementById("filtroTotal").addEventListener("click", () => {
  ativarFiltro("filtroTotal");

  renderizarNotificacoes(notificacoes);
});

document.getElementById("filtroNaoLidas").addEventListener("click", () => {
  ativarFiltro("filtroNaoLidas");

  renderizarNotificacoes(notificacoes.filter((n) => !n.lida));
});

document.getElementById("filtroLidas").addEventListener("click", () => {
  ativarFiltro("filtroLidas");

  renderizarNotificacoes(notificacoes.filter((n) => n.lida));
});

document.getElementById("filtroHoje").addEventListener("click", () => {
  ativarFiltro("filtroHoje");

  renderizarNotificacoes(
    notificacoes.filter((n) =>
      n.data.includes(new Date().toLocaleDateString("pt-BR")),
    ),
  );
});

function atualizarMetricas() {
  const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

  document.getElementById("totalNotificacoes").textContent =
    notificacoes.length;

  document.getElementById("naoLidas").textContent = notificacoes.filter(
    (n) => !n.lida,
  ).length;

  document.getElementById("lidas").textContent = notificacoes.filter(
    (n) => n.lida,
  ).length;

  document.getElementById("hoje").textContent = notificacoes.filter((n) =>
    n.data.includes(new Date().toLocaleDateString("pt-BR")),
  ).length;
}

function marcarComoLida(id) {
  const lista = JSON.parse(localStorage.getItem("notificacoes")) || [];

  const notificacao = lista.find((n) => n.id === id);

  if (notificacao) {
    notificacao.lida = true;
  }

  localStorage.setItem("notificacoes", JSON.stringify(lista));

  notificacoes = lista;

  atualizarMetricas();
  renderizarNotificacoes(notificacoes);
}

atualizarMetricas();

renderizarNotificacoes(notificacoes);

function excluirTodasNotificacoes() {
  const confirmar = confirm("Deseja realmente excluir todas as notificações?");

  if (!confirmar) return;

  localStorage.removeItem("notificacoes");

  notificacoes = [];

  atualizarMetricas();
  renderizarNotificacoes([]);
}

document
  .getElementById("btnExcluirTodas")
  .addEventListener("click", excluirTodasNotificacoes);
