(function () {
  const esc =
    HS.esc ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));
  const cursosAluno = obterCursosAluno();
  const cursosRecomendadosAluno = obterRecomendadosAluno();
  const notificacoesAluno = obterNotificacoesAluno();

  const fotoCurso = (src) => esc(src || "./img/perfil.svg");
  const numero = (v) => Math.max(0, Math.min(100, Number(v) || 0));

  function renderizarSaudacao() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null") || {};
    const saudacaoEl = document.getElementById("saudacaoAluno");
    if (!saudacaoEl) return;
    const primeiroNome = usuario.nome ? usuario.nome.split(" ")[0] : "aluno(a)";
    saudacaoEl.textContent = `Olá, ${primeiroNome}!`;
  }

  // Abre a aula quando o professor já publicou conteúdos; senão, a lista de cursos.
  function urlCurso(id) {
    return HS.conteudosDoCurso(id).length ? "./aula.html?id=" + encodeURIComponent(id) : "./aluno-meus-cursos.html";
  }

  function renderizarAtalhoContinuar() {
    const emAndamento = cursosAluno
      .filter((curso) => curso.status === "andamento")
      .sort((a, b) => new Date(b.ultimoAcesso || 0) - new Date(a.ultimoAcesso || 0));

    const nomeEl = document.getElementById("atalhoCursoNome");
    const textoEl = document.getElementById("atalhoProgressoTexto");
    const barraEl = document.getElementById("atalhoProgressoBarra");
    const btnEl = document.getElementById("btnAtalhoContinuar");
    if (!nomeEl || !textoEl || !barraEl || !btnEl) return;

    if (emAndamento.length === 0) {
      nomeEl.textContent = "Nenhum curso em andamento";
      textoEl.textContent = "0%";
      barraEl.style.width = "0%";
      btnEl.disabled = true;
      btnEl.style.opacity = "0.6";
      btnEl.style.cursor = "not-allowed";
      btnEl.onclick = null;
      return;
    }

    const curso = emAndamento[0];
    nomeEl.textContent = curso.nome || "Curso";
    textoEl.textContent = `${numero(curso.progresso)}%`;
    barraEl.style.width = `${numero(curso.progresso)}%`;
    btnEl.onclick = () => {
      window.location.href = urlCurso(curso.id);
    };
  }

  function atualizarMetricas() {
    const emAndamento = cursosAluno.filter((c) => c.status === "andamento");
    const concluidos = cursosAluno.filter((c) => c.status === "concluido");
    const progressoMedio = cursosAluno.length
      ? Math.round(cursosAluno.reduce((total, c) => total + numero(c.progresso), 0) / cursosAluno.length)
      : 0;

    const set = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };
    set("qtdEmAndamento", emAndamento.length);
    set("qtdConcluidos", concluidos.length);
    set("progressoMedio", `${progressoMedio}%`);
    set("qtdCertificados", concluidos.length);
  }

  function renderizarUltimosAcessados() {
    const lista = document.getElementById("listaUltimosAcessados");
    if (!lista) return;
    lista.innerHTML = "";

    const acessados = cursosAluno.filter((c) => c.ultimoAcesso);
    if (acessados.length === 0) {
      lista.innerHTML = `<p class="vazio">Você ainda não acessou nenhum curso.</p>`;
      return;
    }

    const ultimos = acessados
      .slice()
      .sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso))
      .slice(0, 4);

    lista.innerHTML = ultimos
      .map(
        (curso) => `
      <div class="curso-mini">
        <img src="${fotoCurso(curso.imagem)}" alt="${esc(curso.nome || "Curso")}" />
        <div class="curso-mini-info">
          <strong>${esc(curso.nome || "Curso")}</strong>
          <small>Acessado em ${esc(formatarData(curso.ultimoAcesso))}</small>
          <div class="barra-progresso">
            <div style="width: ${numero(curso.progresso)}%"></div>
          </div>
        </div>
        <button class="btn-continuar-mini" title="Continuar curso" data-id="${esc(curso.id)}">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>`,
      )
      .join("");
  }

  function renderizarRecomendados() {
    const lista = document.getElementById("listaRecomendados");
    if (!lista) return;
    lista.innerHTML = "";

    if (cursosRecomendadosAluno.length === 0) {
      lista.innerHTML = `<p class="vazio">Nenhuma recomendação no momento.</p>`;
      return;
    }

    lista.innerHTML = cursosRecomendadosAluno
      .map((curso) => {
        const preco = Number(curso.preco) || 0;
        const textoPreco = preco > 0 ? "Matricular-se · " + preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Matricular-se grátis";
        return `
      <div class="curso-recomendado">
        <img src="${fotoCurso(curso.imagem)}" alt="${esc(curso.nome || "Curso")}" />
        <div class="curso-recomendado-info">
          <strong>${esc(curso.nome || "Curso")}</strong>
          <span class="tag-area">${esc(curso.categoria || "Curso")}</span>
          <button class="btn-curso" data-matricular="${esc(curso.id)}">${esc(textoPreco)}</button>
        </div>
      </div>`;
      })
      .join("");
  }

  const iconesAviso = {
    curso: { classe: "curso", icone: "fa-solid fa-book" },
    avaliacao: { classe: "avaliacao", icone: "fa-solid fa-clipboard-check" },
    certificado: { classe: "certificado", icone: "fa-solid fa-award" },
    sistema: { classe: "sistema", icone: "fa-solid fa-gear" },
  };

  function renderizarAvisos() {
    const lista = document.getElementById("listaAvisos");
    if (!lista) return;
    lista.innerHTML = "";

    if (notificacoesAluno.length === 0) {
      lista.innerHTML = `<p class="vazio">Nenhum aviso no momento.</p>`;
      return;
    }

    lista.innerHTML = notificacoesAluno
      .slice(0, 5)
      .map((aviso) => {
        const config = iconesAviso[aviso.tipo] || iconesAviso.sistema;
        return `
      <div class="aviso-item">
        <div class="aviso-icone ${config.classe}">
          <i class="${config.icone}"></i>
        </div>
        <div class="aviso-conteudo">
          <strong>${esc(aviso.titulo || "Aviso")}</strong>
          <p>${esc(aviso.descricao || "")}</p>
          <small>${esc(aviso.data || "")}</small>
        </div>
      </div>`;
      })
      .join("");
  }

  function renderizarCertificados() {
    const lista = document.getElementById("listaCertificados");
    if (!lista) return;
    lista.innerHTML = "";

    const concluidos = cursosAluno.filter((c) => c.status === "concluido");
    if (concluidos.length === 0) {
      lista.innerHTML = `<p class="vazio">Você ainda não concluiu nenhum curso.</p>`;
      return;
    }

    lista.innerHTML = concluidos
      .map(
        (curso) => `
      <div class="certificado-item">
        <i class="fa-solid fa-award"></i>
        <div>
          <strong>${esc(curso.nome || "Curso")}</strong>
          <small>Carga horária: ${esc(curso.cargaHoraria || 0)}h</small>
        </div>
        <button class="btn-baixar-certificado" title="Baixar certificado" data-certificado="${esc(curso.nome || "")}">
          <i class="fa-solid fa-download"></i>
        </button>
      </div>`,
      )
      .join("");
  }

  renderizarSaudacao();
  if (window.HS.gam) HS.gam.renderizar("painelGamificacao");
  renderizarAtalhoContinuar();
  atualizarMetricas();
  renderizarUltimosAcessados();
  renderizarRecomendados();
  renderizarAvisos();
  renderizarCertificados();

  document.getElementById("listaRecomendados")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-matricular]");
    if (!btn) return;
    if (HS.matricular(btn.dataset.matricular)) {
      if (window.HS.gam) HS.gam.xp(20, "Nova matrícula");
      alert("Matrícula realizada! O curso já está em Meus cursos.");
      location.reload();
    } else {
      alert("Não foi possível concluir a matrícula. O curso pode já estar na sua lista.");
    }
  });

  document.getElementById("listaUltimosAcessados")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-continuar-mini");
    if (btn) location.href = urlCurso(btn.dataset.id);
  });

  document.getElementById("listaCertificados")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-certificado]");
    if (!btn) return;
    const nome = btn.dataset.certificado;
    if (typeof window.baixarCertificado !== "function") {
      alert("O gerador de certificados não foi carregado. Verifique sua conexão e tente novamente.");
      return;
    }
    if (!window.jspdf || !window.qrcode) {
      alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.");
      return;
    }
    try {
      window.baixarCertificado(nome);
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar o PDF do certificado.");
    }
  });
})();
