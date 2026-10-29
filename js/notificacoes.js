(function () {
  const esc =
    HS.esc ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));
  const ehVisivel = HS.visivel;

  const lerTodas = () => {
    try {
      const lista = JSON.parse(localStorage.getItem("notificacoes"));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  };

  let notificacoes = lerTodas().filter(ehVisivel);
  const container = document.getElementById("listaNotificacoes");
  if (!container) return;

  const ICONES = {
    curso: "fa-book",
    ticket: "fa-ticket",
    relatorio: "fa-trophy",
    alerta: "fa-circle-exclamation",
    avaliacao: "fa-clipboard-check",
    certificado: "fa-award",
    sistema: "fa-gear",
  };

  function vazio(texto) {
    container.innerHTML = `<p class="vazio">${esc(texto)}</p>`;
  }

  function renderizarNotificacoes(lista) {
    if (!lista.length) {
      vazio("Nenhuma notificação encontrada.");
      return;
    }

    container.innerHTML = lista
      .map((n) => {
        const icone = ICONES[n.tipo] || "fa-bell";
        const tipo = esc(n.tipo || "sistema");
        return `
      <div class="notificacao-card">
        <div class="icone ${tipo}">
          <i class="fa-solid ${icone}"></i>
        </div>
        <div class="conteudo">
          <h3>${esc(n.titulo || "Notificação")}</h3>
          <p>${esc(n.descricao || "")}</p>
          <small>${esc(n.data || "")}</small>
          ${
            !n.lida
              ? `<button type="button" class="marcar-lida" data-lida="${esc(n.id)}">
                   <i class="fa-solid fa-check"></i> Marcar como lida
                 </button>`
              : ""
          }
        </div>
      </div>`;
      })
      .join("");
  }

  function ativarFiltro(id) {
    document.querySelectorAll(".metricas-notificacao .card-metrica").forEach((card) => {
      card.classList.remove("ativo");
      card.setAttribute("aria-pressed", "false");
    });
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("ativo");
      el.setAttribute("aria-pressed", "true");
    }
  }

  const filtros = {
    filtroTotal: () => notificacoes,
    filtroNaoLidas: () => notificacoes.filter((n) => !n.lida),
    filtroLidas: () => notificacoes.filter((n) => n.lida),
    filtroHoje: () => {
      const hoje = new Date().toLocaleDateString("pt-BR");
      return notificacoes.filter((n) => String(n.data || "").includes(hoje));
    },
  };

  Object.keys(filtros).forEach((id) => {
    const botao = document.getElementById(id);
    if (!botao) return;
    botao.setAttribute("role", "button");
    botao.setAttribute("tabindex", "0");
    const acao = () => {
      ativarFiltro(id);
      renderizarNotificacoes(filtros[id]());
    };
    botao.addEventListener("click", acao);
    botao.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        acao();
      }
    });
  });

  function atualizarMetricas() {
    const todas = lerTodas().filter(ehVisivel);
    const hoje = new Date().toLocaleDateString("pt-BR");
    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };
    set("totalNotificacoes", todas.length);
    set("naoLidas", todas.filter((n) => !n.lida).length);
    set("lidas", todas.filter((n) => n.lida).length);
    set("hoje", todas.filter((n) => String(n.data || "").includes(hoje)).length);
  }

  function marcarComoLida(id) {
    const lista = lerTodas();
    const notificacao = lista.find((n) => String(n.id) === String(id));
    if (!notificacao) return;
    notificacao.lida = true;
    try {
      localStorage.setItem("notificacoes", JSON.stringify(lista));
    } catch (e) {
      alert("Não foi possível atualizar a notificação.");
      return;
    }
    notificacoes = lista.filter(ehVisivel);
    atualizarMetricas();
    renderizarNotificacoes(notificacoes);
  }

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lida]");
    if (btn) marcarComoLida(btn.dataset.lida);
  });

  atualizarMetricas();
  renderizarNotificacoes(notificacoes);

  document.getElementById("btnExcluirTodas")?.addEventListener("click", () => {
    if (!confirm("Deseja realmente excluir todas as notificações?")) return;
    const restantes = lerTodas().filter((n) => !ehVisivel(n));
    try {
      localStorage.setItem("notificacoes", JSON.stringify(restantes));
    } catch (e) {
      alert("Não foi possível excluir as notificações.");
      return;
    }
    notificacoes = [];
    atualizarMetricas();
    renderizarNotificacoes([]);
  });
})();
