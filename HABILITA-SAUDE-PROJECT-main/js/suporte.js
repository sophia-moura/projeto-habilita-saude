let tickets = JSON.parse(localStorage.getItem("tickets")) || [
  {
    id: 1,
    titulo: "Problema ao acessar curso",
    status: "Aberto",
    prioridade: "Alta",
    criadoEm: "2026-06-10",
    mensagens: [
      {
        autor: "usuario",
        texto: "Não consigo entrar.",
      },
      {
        autor: "suporte",
        texto: "Estamos verificando seu acesso.",
      },
    ],
  },
];

const listaTickets = document.getElementById("listaTickets");

const modalTicket = document.getElementById("modalTicket");
const modalChat = document.getElementById("modalChat");

const btnNovoTicket = document.getElementById("btnNovoTicket");
const salvarTicket = document.getElementById("salvarTicket");

const mensagensTicket = document.getElementById("mensagensTicket");
const filtroStatus = document.getElementById("filtroStatus");

let ticketAtual = null;

// ========================
// RENDERIZAR TICKETS
// ========================

function renderizarTickets() {
  listaTickets.innerHTML = "";

  let ticketsFiltrados = tickets;

  if (filtroStatus.value !== "Todos") {
    ticketsFiltrados = tickets.filter(
      (ticket) => ticket.status === filtroStatus.value,
    );
  }

  if (ticketsFiltrados.length === 0) {
    listaTickets.innerHTML = `
      <div class="ticket-card">
        <h3>Nenhum ticket encontrado.</h3>
      </div>
    `;
    return;
  }

  ticketsFiltrados.forEach((ticket) => {
    const classeStatus =
      ticket.status === "Aberto"
        ? "aberto"
        : ticket.status === "Andamento"
          ? "andamento"
          : "resolvido";

    listaTickets.innerHTML += `
  <div class="ticket-card">

    <div class="ticket-esquerda">
      <i class="fa-solid fa-ticket ticket-icon"></i>
    </div>

    <div class="ticket-centro">

      <div class="ticket-topo">
        <div>
          <h3>${ticket.titulo}</h3>

          <span class="status ${classeStatus}">
            ${ticket.status}
          </span>
        </div>
      </div>

      <div class="ticket-info">
        <span>Prioridade: ${ticket.prioridade}</span>
        <span>${ticket.mensagens.length} mensagens</span>
        <span>${ticket.criadoEm}</span>
      </div>

    </div>

    <button
      class="btn-abrir"
      onclick="abrirTicket(${ticket.id})"
    >
      Abrir
    </button>

    <button
      class="btn-excluir"
      onclick="excluirTicket(${ticket.id})"
    >
      <i class="fa-solid fa-trash"></i>
    </button>

  </div>
`;
  });

  localStorage.setItem("tickets", JSON.stringify(tickets));
}

function criarNotificacao(titulo, descricao, tipo) {
  const notificacoes =
    JSON.parse(localStorage.getItem("notificacoes")) || [];

  notificacoes.unshift({
    id: Date.now(),
    titulo,
    descricao,
    tipo,
    lida: false,
    data: new Date().toLocaleString("pt-BR"),
  });

  localStorage.setItem(
    "notificacoes",
    JSON.stringify(notificacoes),
  );
}

// ========================
// MÉTRICAS
// ========================

function atualizarMetricas() {
  const abertos = tickets.filter((ticket) => ticket.status === "Aberto").length;

  const andamento = tickets.filter(
    (ticket) => ticket.status === "Andamento",
  ).length;

  const resolvidos = tickets.filter(
    (ticket) => ticket.status === "Resolvido",
  ).length;

  const mensagens = tickets.reduce(
    (total, ticket) => total + ticket.mensagens.length,
    0,
  );

  document.getElementById("totalAbertos").textContent = abertos;
  document.getElementById("totalAndamento").textContent = andamento;
  document.getElementById("totalResolvidos").textContent = resolvidos;
  document.getElementById("totalMensagens").textContent = mensagens;
}

// ========================
// NOVO TICKET
// ========================

btnNovoTicket.addEventListener("click", () => {
  modalTicket.classList.add("ativo");
});

salvarTicket.addEventListener("click", () => {
  const titulo = document.getElementById("tituloTicket").value.trim();

  const prioridade = document.getElementById("prioridadeTicket").value;

  const mensagem = document.getElementById("mensagemTicket").value.trim();

  if (!titulo || !mensagem) {
    alert("Preencha todos os campos.");
    return;
  }

  tickets.push({
    id: Date.now(),

    titulo,

    prioridade,

    status: "Aberto",

    

    criadoEm: new Date().toLocaleDateString("pt-BR"),

    mensagens: [
      {
        autor: "usuario",
        texto: mensagem,
      },
    ],
  });

  criarNotificacao(
  "Novo Ticket Criado",
  titulo,
  "ticket"
);

  localStorage.setItem("tickets", JSON.stringify(tickets));

  renderizarTickets();
  atualizarMetricas();

  modalTicket.classList.remove("ativo");

  document.getElementById("tituloTicket").value = "";
  document.getElementById("mensagemTicket").value = "";
});

function excluirTicket(id) {
  const confirmar = confirm("Deseja realmente excluir este ticket?");

  if (!confirmar) return;

  tickets = tickets.filter((ticket) => ticket.id !== id);

  localStorage.setItem("tickets", JSON.stringify(tickets));

  renderizarTickets();
  atualizarMetricas();
}

// ========================
// ABRIR CHAT
// ========================

function abrirTicket(id) {
  ticketAtual = tickets.find((ticket) => ticket.id === id);

  mensagensTicket.innerHTML = "";

  ticketAtual.mensagens.forEach((msg) => {
    mensagensTicket.innerHTML += `
      <div class="mensagem ${msg.autor}">
        ${msg.texto}
      </div>
    `;
  });

  modalChat.classList.add("ativo");
}

// ========================
// ENVIAR MENSAGEM
// ========================

document.getElementById("btnEnviarMensagem").addEventListener("click", () => {
  const input = document.getElementById("novaMensagem");

  const texto = input.value.trim();

  if (!texto) return;

  ticketAtual.mensagens.push({
    autor: "usuario",
    texto,
  });

  // resposta automática

  setTimeout(() => {
    ticketAtual.mensagens.push({
      autor: "suporte",
      texto: "Recebemos sua mensagem. Nossa equipe retornará em breve.",
    });

    localStorage.setItem("tickets", JSON.stringify(tickets));

    abrirTicket(ticketAtual.id);
    atualizarMetricas();
  }, 1000);

  localStorage.setItem("tickets", JSON.stringify(tickets));

  abrirTicket(ticketAtual.id);

  input.value = "";
});

// ========================
// FILTRO
// ========================

filtroStatus.addEventListener("change", () => {
  renderizarTickets();
});

// ========================
// FECHAR MODAIS
// ========================

window.addEventListener("click", (e) => {
  if (e.target === modalTicket) {
    modalTicket.classList.remove("ativo");
  }

  if (e.target === modalChat) {
    modalChat.classList.remove("ativo");
  }
});

// ========================
// INICIAR
// ========================

renderizarTickets();
atualizarMetricas();
