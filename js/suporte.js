(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  function formatarData(data) {
    if (!data) return "—";

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(dataConvertida);
  }

  // Os chamados agora são carregados diretamente do banco de dados
  let tickets = [];

  async function carregarTickets() {
    try {
      const resposta = await fetch("/api/professor/suporte", {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar os chamados.");
      }

      tickets = dados.map((chamado) => {
        const statusMapeado = {
          aberto: "Aberto",
          lido: "Aberto",
          em_atendimento: "Andamento",
          resolvido: "Resolvido"
        };

        return {
          id: chamado.id,
          idAluno: chamado.id_aluno,
          nomeAluno: chamado.nomeAluno,
          titulo: chamado.titulo,
          curso: chamado.curso,
          mensagem: chamado.mensagem,
          status: statusMapeado[chamado.status] || "Aberto",
          statusOriginal: chamado.status,
          criadoEm: chamado.criadoEm,
          totalMensagens: Number(chamado.totalMensagens) || 1,
          mensagens: []
        };
      });

      renderizarTickets();
      atualizarMetricas();

    } catch (erro) {
      console.error("Erro ao carregar chamados:", erro);
      listaTickets.innerHTML = `
        <div class="ticket-card">
          <h3>Não foi possível carregar os chamados.</h3>
          <p>${esc(erro.message)}</p>
        </div>`;
    }
  }
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
            <span>${ticket.totalMensagens ?? mensagensDe(ticket).length} mensagens</span>
            <span>${esc(formatarData(ticket.criadoEm))}</span>
          </div>
        </div>
        <button class="btn-abrir" type="button" data-abrir="${esc(ticket.id)}">Abrir</button>
        <button class="btn-excluir" type="button" data-excluir="${esc(ticket.id)}" aria-label="Excluir ticket">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
      })
      .join("");
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
    const mensagens = tickets.reduce(
      (total, ticket) => total + Number(ticket.totalMensagens ?? mensagensDe(ticket).length),
      0
    );
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

  async function excluirTicket(id) {
    if (!confirm("Deseja realmente excluir este chamado?")) return;

    try {
      const resposta = await fetch(
        `/api/professor/suporte/${id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível excluir o chamado.");
      }

      tickets = tickets.filter(
        (ticket) => String(ticket.id) !== String(id)
      );

      if (ticketAtual && String(ticketAtual.id) === String(id)) {
        ticketAtual = null;
        fecharModal(modalChat);
      }

      renderizarTickets();
      atualizarMetricas();

    } catch (erro) {
      console.error("Erro ao excluir chamado:", erro);
      alert(erro.message);
    }
  }

    function renderizarMensagens() {
    if (!ticketAtual || !mensagensTicket) return;

    mensagensTicket.innerHTML = mensagensDe(ticketAtual)
      .map((msg) => `
        <div class="mensagem ${msg.autor === "suporte" ? "suporte" : "usuario"}">
          ${esc(msg.texto || "")}
        </div>
      `)
      .join("");
  }

  async function abrirTicket(id) {
    ticketAtual = tickets.find(
      (ticket) => String(ticket.id) === String(id)
    ) || null;

    if (!ticketAtual) {
      alert("Chamado não encontrado.");
      return;
    }

    const chamadoSelecionado = ticketAtual;

    mensagensTicket.innerHTML = "<p>Carregando conversa...</p>";

    const tituloModal = modalChat.querySelector("h2");
    if (tituloModal) {
      tituloModal.textContent = chamadoSelecionado.titulo || "Chamado";
    }

    abrirModal(modalChat);

    try {
      const resposta = await fetch(
        `/api/professor/suporte/${chamadoSelecionado.id}/mensagens`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar a conversa.");
      }

      chamadoSelecionado.mensagens = (dados.mensagens || []).map((msg) => ({
        autor: msg.remetente === "professor" ? "suporte" : "usuario",
        texto: msg.mensagem,
        data: msg.data
      }));

      if (ticketAtual === chamadoSelecionado) {
        renderizarMensagens();
      }

    } catch (erro) {
      console.error("Erro ao carregar conversa:", erro);
      mensagensTicket.innerHTML = `
        <p>${esc(erro.message)}</p>
      `;
    }
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

  btnEnviarMensagem?.addEventListener("click", async () => {
  const texto = campoNovaMensagem?.value.trim() || "";

  if (!texto) return;

  if (!ticketAtual) {
    alert("Abra um chamado antes de enviar uma mensagem.");
    return;
  }

  const chamadoSelecionado = ticketAtual;

  try {
    btnEnviarMensagem.disabled = true;

    const resposta = await fetch(
      `/api/professor/suporte/${chamadoSelecionado.id}/mensagens`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          mensagem: texto.slice(0, 2000)
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível enviar a mensagem.");
    }

    if (campoNovaMensagem) {
      campoNovaMensagem.value = "";
    }

    // Atualiza a conversa com as mensagens salvas no banco
    await abrirTicket(chamadoSelecionado.id);

    // Atualiza a quantidade de mensagens exibida na listagem
    await carregarTickets();

  } catch (erro) {
    console.error("Erro ao enviar mensagem:", erro);
    alert(erro.message);
  } finally {
    btnEnviarMensagem.disabled = false;
  }
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

  carregarTickets();
})();
