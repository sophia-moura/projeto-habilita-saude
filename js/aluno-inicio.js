(function () {
  const esc =
    HS.esc ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));
  let cursosAluno = [];
  let cursosRecomendadosAluno = [];
  let notificacoesAluno = [];

  const fotoCurso = (src) => esc(src || "./img/perfil.svg");
  const numero = (v) => Math.max(0, Math.min(100, Number(v) || 0));

  async function renderizarSaudacao() {
    const saudacaoEl = document.getElementById("saudacaoAluno");
    if (!saudacaoEl) return;

    const usuario = await HS.carregarUsuario();
    const primeiroNome = usuario?.nome
        ? usuario.nome.split(" ")[0]
        : "aluno(a)";

    saudacaoEl.textContent = `Olá, ${primeiroNome}!`;
  }

  // Abre a aula quando o professor já publicou conteúdos; senão, a lista de cursos.
  function urlCurso(id) {
    return "./aula.html?id=" + encodeURIComponent(id);
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
    
    const progresso = Math.max(0, Math.min(100, numero(curso.progresso)));

    textoEl.textContent = `${progresso}%`;

    barraEl.style.width = `${progresso}%`;

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
    const certificadosEmitidos = cursosAluno.filter(
    (curso) => curso.codigoCertificado
    );

    set("qtdCertificados", certificadosEmitidos.length);
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
          <span class="tag-area">Professor: ${esc(curso.professor || "Não informado")}</span>
          <button class="btn-curso" data-matricular="${esc(curso.id)}">
            Matricular-se
          </button>
        </div>
      </div>`;
      })
      .join("");
  }

  async function carregarCursosRecomendados() {
    const lista = document.getElementById("listaRecomendados");
    if (!lista) return;

    try {
      const resposta = await API.get("/cursos");

      cursosRecomendadosAluno = (Array.isArray(resposta) ? resposta : [])
        .map((curso) => ({
          id: Number(curso.id_curso),
          nome: curso.nome_curso,
          categoria: "Curso",
          imagem: curso.imagem_url || "",
          preco: Number(curso.preco) || 0,
          professor: curso.nome_professor
        }));

      renderizarRecomendados();

    } catch (erro) {
      console.error("Erro ao buscar cursos publicados:", erro);
      lista.innerHTML = `<p class="vazio">Não foi possível carregar os cursos publicados.</p>`;
    }
  }

  const iconesAviso = {
    curso: { classe: "curso", icone: "fa-solid fa-book" },
    avaliacao: { classe: "avaliacao", icone: "fa-solid fa-clipboard-check" },
    certificado: { classe: "certificado", icone: "fa-solid fa-award" },
    sistema: { classe: "sistema", icone: "fa-solid fa-gear" },
  };

  async function renderizarAvisos() {
    const lista = document.getElementById("listaAvisos");
    if (!lista) return;

    lista.innerHTML = `<p class="vazio">Carregando avisos...</p>`;

    try {
      const resposta = await API.get("/notificacoes");

      notificacoesAluno = (Array.isArray(resposta) ? resposta : [])
        .map((aviso) => {
          const texto = `${aviso.titulo || ""} ${aviso.mensagem || ""}`.toLowerCase();

          let tipo = "sistema";

          if (texto.includes("certificado")) {
            tipo = "certificado";
          } else if (texto.includes("matrícula") || texto.includes("curso")) {
            tipo = "curso";
          } else if (texto.includes("avaliação")) {
            tipo = "avaliacao";
          }

          return {
            id: aviso.id,
            titulo: aviso.titulo,
            descricao: aviso.mensagem,
            data: aviso.data,
            tipo,
            lida: Boolean(aviso.lida)
          };
        });

      if (notificacoesAluno.length === 0) {
        lista.innerHTML = `<p class="vazio">Nenhum aviso no momento.</p>`;
        return;
      }

      lista.innerHTML = notificacoesAluno
        .slice(0, 5)
        .map((aviso) => {
          const config = iconesAviso[aviso.tipo] || iconesAviso.sistema;

          const data = aviso.data
            ? new Date(aviso.data).toLocaleString("pt-BR")
            : "";

          return `
            <div class="aviso-item">
              <div class="aviso-icone ${config.classe}">
                <i class="${config.icone}"></i>
              </div>
              <div class="aviso-conteudo">
                <strong>${esc(aviso.titulo || "Aviso")}</strong>
                <p>${esc(aviso.descricao || "")}</p>
                <small>${esc(data)}</small>
              </div>
            </div>`;
        })
        .join("");

    } catch (erro) {
      console.error("Erro ao carregar avisos:", erro);
      lista.innerHTML = `<p class="vazio">Não foi possível carregar os avisos.</p>`;
    }
  }

  function renderizarCertificados() {
    const lista = document.getElementById("listaCertificados");
    if (!lista) return;
    lista.innerHTML = "";

    const emitidos = cursosAluno.filter(
        (curso) => curso.codigoCertificado
    );

    if (emitidos.length === 0) {
        lista.innerHTML = `<p class="vazio">Você ainda não tem certificados emitidos.</p>`;
        return;
    }

    lista.innerHTML = emitidos
        .map((curso) => `
            <div class="certificado-item">
                <i class="fa-solid fa-award"></i>
                <div>
                    <strong>${esc(curso.nome || "Curso")}</strong>
                    <small>Carga horária: ${esc(curso.cargaHoraria || 0)}h</small>
                </div>
                <button class="btn-baixar-certificado"
                    title="Baixar certificado"
                    data-certificado="${esc(curso.id)}">
                    <i class="fa-solid fa-download"></i>
                </button>
            </div>
        `)
        .join("");
  }
  
  async function inicializarPainelAluno() {
    try {
      // Aguarda a confirmação da sessão.
      await HS.ready;

      // Busca o progresso atualizado diretamente do MySQL.
      const resposta = await API.get("/aluno/matriculas");

      cursosAluno = Array.isArray(resposta.cursos)
        ? resposta.cursos
        : [];

      await renderizarSaudacao();

      if (window.HS.gam) {
        window.HS.gam.renderizar("painelGamificacao");
      }

      renderizarAtalhoContinuar();
      atualizarMetricas();
      renderizarUltimosAcessados();
      carregarCursosRecomendados();
      renderizarAvisos();
      renderizarCertificados();

    } catch (erro) {
      console.error("Erro ao carregar painel do aluno:", erro);

      const lista = document.getElementById("listaUltimosAcessados");

      if (lista) {
        lista.innerHTML =
          '<p class="vazio">Não foi possível carregar seus cursos.</p>';
      }
    }
  }

  window.addEventListener("pageshow", () => {
    inicializarPainelAluno();
  });
  
  document.getElementById("listaRecomendados")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-matricular]");
    if (!btn) return;

    const idCurso = Number(btn.dataset.matricular);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      alert("Curso inválido.");
      return;
    }

    const curso = cursosRecomendadosAluno.find(
      (c) => Number(c.id) === idCurso
    );

    if (!curso) {
      alert("Curso não encontrado.");
      return;
    }

    const gratuito = Number(curso.preco) <= 0;

    btn.disabled = true;
    btn.textContent = gratuito
      ? "Realizando matrícula..."
      : "Processando pagamento...";

    try {
      // Cursos pagos precisam passar pelo pagamento.
      if (!gratuito) {
        const pagamento = await API.post("/pagamentos/simular", {
          id_curso: idCurso
        });

        if (!pagamento.sucesso || pagamento.pagamento !== "aprovado") {
          throw new Error(
            pagamento.erro || "O pagamento simulado não foi aprovado."
          );
        }
      }

      // Realiza a matrícula do aluno.
      btn.textContent = "Confirmando matrícula...";

      const matricula = await API.post("/aluno/matriculas", {
        id_curso: idCurso
      });

      if (!matricula.sucesso) {
        throw new Error(
          matricula.erro || "Não foi possível realizar a matrícula."
        );
      }

      alert(
        gratuito
          ? "Matrícula realizada com sucesso!"
          : "Pagamento simulado aprovado! Matrícula realizada com sucesso."
      );

      setTimeout(() => {
        location.href = "aluno-meus-cursos.html";
      }, 2000);

    } catch (erro) {
      console.error("Erro ao realizar matrícula:", erro);

      alert(erro.message || "Não foi possível concluir a matrícula.");

      btn.disabled = false;
      btn.textContent = "Matricular-se";
    }
  });

  document.getElementById("listaUltimosAcessados")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-continuar-mini");
    if (btn) location.href = urlCurso(btn.dataset.id);
  });

  document.getElementById("listaCertificados")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-certificado]");
  if (!btn) return;

  const idCurso = Number(btn.dataset.certificado);

  const curso = cursosAluno.find(
    (c) => Number(c.id) === idCurso && c.codigoCertificado
  );

  if (!curso) {
    alert("Certificado não encontrado.");
    return;
  }

  window.location.href =
    `/api/aluno/certificados/${encodeURIComponent(curso.codigoCertificado)}/pdf`;
  });
})();
