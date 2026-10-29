(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  const lerTickets = () => {
    try {
      const lista = JSON.parse(localStorage.getItem("tickets"));
      if (Array.isArray(lista)) return lista;
    } catch (e) {
      /* dados inválidos: recomeça */
    }
    return [
      {
        id: 1,
        titulo: "Problema ao acessar curso",
        status: "Aberto",
        prioridade: "Alta",
        criadoEm: "2026-06-10",
        mensagens: [
          { autor: "usuario", texto: "Não consigo entrar." },
          { autor: "suporte", texto: "Estamos verificando seu acesso." },
        ],
      },
    ];
  };

  let tickets = lerTickets();
  const listaTickets = document.getElementById("listaTickets");
  const modalTicket = document.getElementById("modalTicket");
  const modalChat = document.getElementById("modalChat");
  const btnNovoTicket = document.getElementById("btnNovoTicket");
  const salvarTicket = document.getElementById("salvarTicket");
  const mensagensTicket = document.getElementById("mensagensTicket");
  const filtroStatus = document.getElementById("filtroStatus");
  const campoNovaMensagem = document.getElementById("novaMensagem");
  const btnEnviarMensagem = document.getElementById("btnEnviarMensagem");

  if (!listaTickets || !modalTicket || !modalChat) return;

  let ticketAtual = null;

  const mensagensDe = (ticket) => (Array.isArray(ticket?.mensagens) ? ticket.mensagens : []);
  const salvarTickets = () => {
    try {
      localStorage.setItem("tickets", JSON.stringify(tickets));
      return true;
    } catch (e) {
      alert("Não foi possível salvar os tickets neste navegador.");
      return false;
    }
  };

  function renderizarTickets() {
    const filtro = filtroStatus?.value || "Todos";
    const ticketsFiltrados =
      filtro === "Todos" ? tickets : tickets.filter((ticket) => ticket.status === filtro);

    if (!ticketsFiltrados.length) {
      listaTickets.innerHTML = `
        <div class="ticket-card">
          <h3>Nenhum ticket encontrado.</h3>
        </div>`;
      return;
    }

    listaTickets.innerHTML = ticketsFiltrados
      .map((ticket) => {
        const status = String(ticket.status || "Aberto");
        const classeStatus =
          status === "Aberto" ? "aberto" : status === "Andamento" ? "andamento" : "resolvido";
        return `
      <div class="ticket-card">
        <div class="ticket-esquerda">
          <i class="fa-solid fa-ticket ticket-icon"></i>
        </div>
        <div class="ticket-centro">
          <div class="ticket-topo">
            <div>
              <h3>${esc(ticket.titulo || "Ticket")}</h3>
              <span class="status ${classeStatus}">${esc(status)}</span>
            </div>
          </div>
          <div class="ticket-info">
            <span>Prioridade: ${esc(ticket.prioridade || "—")}</span>
            <span>${mensagensDe(ticket).length} mensagens</span>
            <span>${esc(ticket.criadoEm || "—")}</span>
          </div>
        </div>
        <button class="btn-abrir" type="button" data-abrir="${esc(ticket.id)}">Abrir</button>
        <button class="btn-excluir" type="button" data-excluir="${esc(ticket.id)}" aria-label="Excluir ticket">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
      })
      .join("");

    salvarTickets();
  }

  function criarNotificacao(titulo, descricao, tipo) {
    if (window.HS && HS.notificar) {
      HS.notificar(titulo, descricao, tipo, "professor");
      return;
    }
    try {
      const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];
      notificacoes.unshift({
        id: Date.now(),
        titulo,
        descricao,
        tipo,
        para: "professor",
        lida: false,
        data: new Date().toLocaleString("pt-BR"),
      });
      localStorage.setItem("notificacoes", JSON.stringify(notificacoes));
    } catch (e) {
      /* sem notificação, sem problema */
    }
  }

  function atualizarMetricas() {
    const contar = (status) => tickets.filter((ticket) => ticket.status === status).length;
    const mensagens = tickets.reduce((total, ticket) => total + mensagensDe(ticket).length, 0);
    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };
    set("totalAbertos", contar("Aberto"));
    set("totalAndamento", contar("Andamento"));
    set("totalResolvidos", contar("Resolvido"));
    set("totalMensagens", mensagens);
  }

  function abrirModal(modal) {
    modal.classList.add("ativo");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const foco = modal.querySelector("input, textarea, select, button");
    if (foco) setTimeout(() => foco.focus(), 30);
  }

  function fecharModal(modal) {
    modal.classList.remove("ativo");
    modal.setAttribute("aria-hidden", "true");
    if (!modalTicket.classList.contains("ativo") && !modalChat.classList.contains("ativo")) {
      document.body.style.overflow = "";
    }
  }

  btnNovoTicket?.addEventListener("click", () => abrirModal(modalTicket));

  salvarTicket?.addEventListener("click", () => {
    const titulo = document.getElementById("tituloTicket")?.value.trim() || "";
    const prioridade = document.getElementById("prioridadeTicket")?.value || "Baixa";
    const mensagem = document.getElementById("mensagemTicket")?.value.trim() || "";

    if (titulo.length < 3) {
      alert("Informe um título com pelo menos 3 caracteres.");
      return;
    }
    if (mensagem.length < 10) {
      alert("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }

    tickets.push({
      id: Date.now(),
      titulo: titulo.slice(0, 120),
      prioridade,
      status: "Aberto",
      criadoEm: new Date().toLocaleDateString("pt-BR"),
      mensagens: [{ autor: "usuario", texto: mensagem.slice(0, 2000) }],
    });

    criarNotificacao("Novo ticket criado", titulo, "ticket");
    if (!salvarTickets()) return;

    renderizarTickets();
    atualizarMetricas();
    fecharModal(modalTicket);

    const tituloTicket = document.getElementById("tituloTicket");
    const mensagemTicket = document.getElementById("mensagemTicket");
    if (tituloTicket) tituloTicket.value = "";
    if (mensagemTicket) mensagemTicket.value = "";
  });

  function excluirTicket(id) {
    if (!confirm("Deseja realmente excluir este ticket?")) return;
    tickets = tickets.filter((ticket) => String(ticket.id) !== String(id));
    if (!salvarTickets()) return;
    if (ticketAtual && String(ticketAtual.id) === String(id)) {
      ticketAtual = null;
      fecharModal(modalChat);
    }
    renderizarTickets();
    atualizarMetricas();
  }

  function renderizarMensagens() {
    if (!ticketAtual || !mensagensTicket) return;
    mensagensTicket.innerHTML = mensagensDe(ticketAtual)
      .map(
        (msg) =>
          `<div class="mensagem ${msg.autor === "suporte" ? "suporte" : "usuario"}">${esc(
            msg.texto || "",
          )}</div>`,
      )
      .join("");
  }

  function abrirTicket(id) {
    ticketAtual = tickets.find((ticket) => String(ticket.id) === String(id)) || null;
    if (!ticketAtual) {
      alert("Ticket não encontrado.");
      return;
    }
    renderizarMensagens();
    abrirModal(modalChat);
    const tituloModal = modalChat.querySelector("h2");
    if (tituloModal) tituloModal.textContent = ticketAtual.titulo || "Ticket";
  }

  listaTickets.addEventListener("click", (e) => {
    const abrir = e.target.closest("[data-abrir]");
    if (abrir) {
      abrirTicket(abrir.dataset.abrir);
      return;
    }
    const excluir = e.target.closest("[data-excluir]");
    if (excluir) excluirTicket(excluir.dataset.excluir);
  });

  btnEnviarMensagem?.addEventListener("click", () => {
    const texto = campoNovaMensagem?.value.trim() || "";
    if (!texto) return;
    if (!ticketAtual) {
      alert("Abra um ticket antes de enviar uma mensagem.");
      return;
    }

    ticketAtual.mensagens = mensagensDe(ticketAtual);
    ticketAtual.mensagens.push({ autor: "usuario", texto: texto.slice(0, 2000) });
    if (!salvarTickets()) return;
    renderizarMensagens();
    atualizarMetricas();
    if (campoNovaMensagem) campoNovaMensagem.value = "";

    const idTicket = ticketAtual.id;
    setTimeout(() => {
      const ticket = tickets.find((t) => String(t.id) === String(idTicket));
      if (!ticket) return;
      ticket.mensagens = mensagensDe(ticket);
      ticket.mensagens.push({
        autor: "suporte",
        texto: "Recebemos sua mensagem. Nossa equipe retornará em breve.",
      });
      if (!salvarTickets()) return;
      if (ticketAtual && String(ticketAtual.id) === String(idTicket)) renderizarMensagens();
      atualizarMetricas();
    }, 1000);
  });

  campoNovaMensagem?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnEnviarMensagem?.click();
    }
  });

  filtroStatus?.addEventListener("change", renderizarTickets);

  [modalTicket, modalChat].forEach((modal) => {
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.addEventListener("click", (e) => {
      if (e.target === modal) fecharModal(modal);
    });
    modal.querySelectorAll("[data-fechar-modal]").forEach((btn) => {
      btn.addEventListener("click", () => fecharModal(modal));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (modalChat.classList.contains("ativo")) fecharModal(modalChat);
    else if (modalTicket.classList.contains("ativo")) fecharModal(modalTicket);
  });

  renderizarTickets();
  atualizarMetricas();
})();
