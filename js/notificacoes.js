(function () {
  const esc =
    HS.esc ||
    ((t) =>
      String(t ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]));

  const container = document.getElementById("listaNotificacoes");
  if (!container) return;

  let notificacoes = [];

  function dataValida(valor) {
    if (!valor) return null;

    const data = new Date(
      String(valor).replace(" ", "T")
    );

    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarData(valor) {
    const data = dataValida(valor);

    return data
      ? data.toLocaleString("pt-BR")
      : "";
  }

  function ehDeHoje(valor) {
    const data = dataValida(valor);
    if (!data) return false;

    const hoje = new Date();

    return (
      data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  }

  function vazio(texto) {
    container.innerHTML = `<p class="vazio">${esc(texto)}</p>`;
  }

  function renderizarNotificacoes(lista) {
    if (!lista.length) {
      vazio("Nenhuma notificação encontrada.");
      return;
    }

    container.innerHTML = lista
      .map((n) => `
        <div class="notificacao-card">
          <div class="icone sistema">
            <i class="fa-solid fa-bell"></i>
          </div>

          <div class="conteudo">
            <h3>${esc(n.titulo || "Notificação")}</h3>
            <p>${esc(n.mensagem || "")}</p>
            <small>${esc(formatarData(n.data))}</small>

            ${
              !n.lida
                ? `<button type="button" class="marcar-lida" data-lida="${esc(n.id)}">
                    <i class="fa-solid fa-check"></i> Marcar como lida
                  </button>`
                : ""
            }

            <button type="button" class="excluir-notificacao" data-excluir="${esc(n.id)}">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      `)
      .join("");
  }

  function ativarFiltro(id) {
    document
      .querySelectorAll(".metricas-notificacao .card-metrica")
      .forEach((card) => {
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
    filtroHoje: () => notificacoes.filter((n) => ehDeHoje(n.data)),
  };

  function atualizarMetricas() {
    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };

    set("totalNotificacoes", notificacoes.length);
    set("naoLidas", notificacoes.filter((n) => !n.lida).length);
    set("lidas", notificacoes.filter((n) => n.lida).length);
    set("hoje", notificacoes.filter((n) => ehDeHoje(n.data)).length);
  }

  function atualizarTela() {
    atualizarMetricas();

    // Atualiza também o contador do sino no cabeçalho.
    const badge = document.getElementById("badgeNotificacao");

    if (badge) {
      const naoLidas = notificacoes.filter((n) => !n.lida).length;

      badge.textContent = naoLidas > 99 ? "99+" : String(naoLidas);
      badge.hidden = naoLidas === 0;

      badge.setAttribute(
        "aria-label",
        naoLidas
          ? `${naoLidas} notificações não lidas`
          : "Nenhuma notificação não lida"
      );
    }

    const filtroAtivo = document.querySelector(
      ".metricas-notificacao .card-metrica.ativo"
    );

    const id = filtroAtivo?.id || "filtroTotal";

    renderizarNotificacoes(
      filtros[id] ? filtros[id]() : notificacoes
    );
  }

  async function carregarNotificacoes() {
    try {
      const resposta = await fetch("/api/notificacoes");

      if (!resposta.ok) {
        throw new Error("Erro ao carregar notificações.");
      }

      notificacoes = await resposta.json();

      notificacoes = notificacoes.map((n) => ({
        ...n,
        lida: Boolean(n.lida),
      }));

      atualizarTela();
    } catch (erro) {
      console.error(erro);
      vazio("Não foi possível carregar as notificações.");
    }
  }

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

  container.addEventListener("click", async (e) => {
    const botaoLida = e.target.closest("[data-lida]");
    const botaoExcluir = e.target.closest("[data-excluir]");

    if (botaoLida) {
      const id = botaoLida.dataset.lida;

      try {
        const resposta = await fetch(
          `/api/notificacoes/${id}/lida`,
          { method: "PATCH" }
        );

        if (!resposta.ok) {
          throw new Error("Não foi possível marcar como lida.");
        }

        const notificacao = notificacoes.find(
          (n) => String(n.id) === String(id)
        );

        if (notificacao) notificacao.lida = true;

        atualizarTela();
      } catch (erro) {
        console.error(erro);
        alert("Não foi possível atualizar a notificação.");
      }
    }

    if (botaoExcluir) {
      const id = botaoExcluir.dataset.excluir;

      if (!confirm("Deseja realmente excluir esta notificação?")) {
        return;
      }

      try {
        const resposta = await fetch(
          `/api/notificacoes/${id}`,
          { method: "DELETE" }
        );

        if (!resposta.ok) {
          throw new Error("Não foi possível excluir a notificação.");
        }

        notificacoes = notificacoes.filter(
          (n) => String(n.id) !== String(id)
        );

        atualizarTela();
      } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir a notificação.");
      }
    }
  });

  
  document
    .getElementById("btnExcluirTodas")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();

      const botao = e.currentTarget;

      if (!confirm("Deseja realmente excluir todas as notificações?")) {
        return;
      }

      botao.disabled = true;

      try {
        const resposta = await fetch("/api/notificacoes", {
          method: "DELETE",
          credentials: "include"
        });

        if (!resposta.ok) {
          throw new Error("Não foi possível excluir as notificações.");
        }

        notificacoes = [];

        const badge = document.getElementById("badgeNotificacao");

        if (badge) {
          badge.textContent = "0";
          badge.hidden = true;
        }
        
        // Atualiza os números imediatamente.
        atualizarMetricas();

        // Limpa a lista imediatamente.
        container.innerHTML =
          '<p class="vazio">Nenhuma notificação encontrada.</p>';

      } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir as notificações.");
      } finally {
        botao.disabled = false;
      }
    });

  carregarNotificacoes();
})();