(function () {
  const esc = (t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  let cursos = [];
  let concluidos = [];
  let emitidos = [];
  let proximos = [];

  const oferece = (c) =>
    c.tipoCertificado &&
    c.tipoCertificado !== "Sem Certificado";

  const horas = (c) => Number(c.cargaHoraria) || 0;

  const registro = (c) => {
    if (!c.codigoCertificado) return null;

    return {
      uuid: c.codigoCertificado,
      data: c.dataEmissaoCertificado
        ? new Date(c.dataEmissaoCertificado).toLocaleDateString("pt-BR")
        : ""
    };
  };

  const $ = (id) => document.getElementById(id);
  let nomeAluno = "Aluno";

  async function carregarCertificados() {
    try {
      const resposta = await API.get("/aluno/matriculas");

      const usuarioAtual = await HS.carregarUsuario();
      nomeAluno = usuarioAtual?.nome || "Aluno";

      cursos = resposta.cursos || [];

      concluidos = cursos.filter(
        (c) => c.status === "concluido"
      );

      emitidos = concluidos.filter(
          (c) =>
              oferece(c) &&
              c.codigoCertificado &&
              c.statusCertificado === "emitido"
      );

      proximos = cursos
        .filter(
          (c) => c.status !== "concluido" && oferece(c)
        )
        .sort((a, b) => b.progresso - a.progresso);

      renderizarResumo();
      renderizarCertificados();
      renderizarProximos();

    } catch (erro) {
      console.error("Erro ao carregar certificados:", erro);

      $("listaCertificados").innerHTML =
        '<p class="vazio">Não foi possível carregar seus certificados. Tente novamente.</p>';
    }
  }

  function cartao(c) {
    const reg = registro(c);
    return `
      <article class="cert-card" id="cert-${c.id}" data-id="${c.id}">

        <div class="cert-info">
          ${c.area ? `<span class="tag-area">${esc(c.area)}</span>` : ""}
          <h4>${esc(c.nome)}</h4>

          <ul class="cert-meta">
            ${horas(c) ? `<li><i class="fa-regular fa-clock"></i> ${horas(c)}h de carga horária</li>` : ""}
            ${c.professor ? `<li><i class="fa-solid fa-chalkboard-user"></i> ${esc(c.professor)}</li>` : ""}
            ${reg ? `<li><i class="fa-regular fa-calendar"></i> Emitido em ${esc(reg.data)}</li>` : ""}
          </ul>

          <p class="cert-codigo">
            ${
              reg
                ? `<i class="fa-solid fa-shield-halved"></i> Código <b>${esc(reg.uuid.slice(0, 8))}…</b>
                   <a href="./validar.html?id=${encodeURIComponent(reg.uuid)}" target="_blank" rel="noopener">Validar autenticidade</a>`
                : `<i class="fa-solid fa-shield-halved"></i> Código de validação ainda não disponível.`
            }
          </p>

          <div class="cert-acoes">
            <button class="cert-btn cert-btn-primario" data-acao="baixar" data-id="${c.id}">
              <i class="fa-solid fa-download"></i> Baixar PDF
            </button>
            <button class="cert-btn" data-acao="ver" data-id="${c.id}">
              <i class="fa-regular fa-eye"></i> Visualizar
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderizarCertificados() {
    const lista = $("listaCertificados");

    if (emitidos.length === 0) {
      lista.className = "";
      lista.innerHTML = `
        <div class="cert-vazio">
          <i class="fa-solid fa-award"></i>
          <strong>Você ainda não tem certificados.</strong>
          <p>Conclua um curso para liberar o seu primeiro certificado.</p>
          <a href="./aluno-meus-cursos.html" class="cert-btn cert-btn-primario">Ver meus cursos</a>
        </div>`;
      return;
    }

    lista.className = "cert-grid";
    lista.innerHTML = emitidos.map(cartao).join("");
  }

  function renderizarProximos() {
    const lista = $("listaProximos");

    if (proximos.length === 0) {
      lista.innerHTML = `<p class="vazio">Nenhum curso em andamento no momento.</p>`;
      return;
    }

    lista.innerHTML = proximos
      .slice(0, 4)
      .map(
        (c) => `
        <a class="prox-item" href="./aluno-meus-cursos.html">
          <div class="prox-info">
            <strong>${esc(c.nome)}</strong>
            <small>${esc(c.area || "")}${horas(c) ? ` · ${horas(c)}h` : ""}</small>
            <div class="barra-progresso"><div style="width: ${Number(c.progresso) || 0}%"></div></div>
          </div>
          <span class="prox-pct">${Number(c.progresso) || 0}%</span>
        </a>`,
      )
      .join("");
  }

  function renderizarResumo() {
    $("qtdCertificados").textContent = emitidos.length;
    $("totalHoras").textContent = emitidos.reduce((t, c) => t + horas(c), 0) + "h";
    $("qtdProximos").textContent = proximos.length;

    const sem = concluidos.length - emitidos.length;
    const nota = $("notaSemCertificado");
    if (sem > 0) {
      nota.textContent = `${sem} curso${sem > 1 ? "s concluídos não oferecem" : " concluído não oferece"} certificado.`;
      nota.hidden = false;
    }
  }

  /* ---------- Ações ---------- */

  function baixar(c) {
      if (!c || !c.codigoCertificado) {
          alert("Certificado não encontrado.");
          return;
      }

      window.location.href =
          `/api/aluno/certificados/${encodeURIComponent(c.codigoCertificado)}/pdf`;
  }

  const modal = $("certModal");
  let abertoId = null;

  function abrirModal(c) {
    abertoId = c.id;

    $("certModalPapel").innerHTML = `
      <iframe
        src="/api/aluno/certificados/${encodeURIComponent(c.codigoCertificado)}/pdf?visualizar=1"
        title="Certificado de ${esc(c.nome)}"
      ></iframe>
    `;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $("certModalFechar").focus();
  }

  function fecharModal() {
    modal.hidden = true;
    abertoId = null;
    document.body.style.overflow = "";
  }

  $("listaCertificados").addEventListener("click", (e) => {
    const b = e.target.closest("[data-acao]");
    if (!b) return;
    const c = emitidos.find((x) => x.id === Number(b.dataset.id));
    if (!c) return;
    if (b.dataset.acao === "baixar") baixar(c);
    else abrirModal(c);
  });

  $("certModalFechar").addEventListener("click", fecharModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) fecharModal();
  });
  $("certModalBaixar").addEventListener("click", () => {
    const c = emitidos.find((x) => x.id === abertoId);
    if (c) baixar(c);
  });

  $("formValidar").addEventListener("submit", (e) => {
    e.preventDefault();
    const codigo = $("campoCodigo").value.trim().toUpperCase();
    if (!codigo) return $("campoCodigo").focus();
    location.href = "./validar.html?id=" + encodeURIComponent(codigo);
  });

  /* ---------- Início ---------- */
  carregarCertificados();

  // Vindo de "Meus cursos" (?curso=ID): rola até o certificado e o destaca.
  const alvo = new URLSearchParams(location.search).get("curso");
  const cartaoAlvo = alvo && $("cert-" + Number(alvo));
  if (cartaoAlvo) {
    setTimeout(() => {
      cartaoAlvo.scrollIntoView({ behavior: "smooth", block: "center" });
      cartaoAlvo.classList.add("destaque");
    }, 500);
  }
})();
