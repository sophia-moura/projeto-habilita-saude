// ==========================================================
// HABILITA SAÚDE — VISÃO DO ALUNO — PÁGINA INICIAL
// Depende de js/aluno-dados.js (dados no localStorage).
// ==========================================================

const cursosAluno = obterCursosAluno();
const cursosRecomendadosAluno = obterRecomendadosAluno();
const notificacoesAluno = obterNotificacoesAluno();

// ----------------------------------------------------------
// SAUDAÇÃO
// ----------------------------------------------------------

function renderizarSaudacao() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const saudacaoEl = document.getElementById("saudacaoAluno");

  if (!saudacaoEl) return;

  const primeiroNome = usuario?.nome ? usuario.nome.split(" ")[0] : "aluno(a)";

  saudacaoEl.textContent = `Olá, ${primeiroNome}!`;
}

// ----------------------------------------------------------
// ATALHO "CONTINUAR ESTUDANDO"
// (curso em andamento acessado mais recentemente)
// ----------------------------------------------------------

function renderizarAtalhoContinuar() {
  const emAndamento = cursosAluno
    .filter((curso) => curso.status === "andamento")
    .sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso));

  const nomeEl = document.getElementById("atalhoCursoNome");
  const textoEl = document.getElementById("atalhoProgressoTexto");
  const barraEl = document.getElementById("atalhoProgressoBarra");
  const btnEl = document.getElementById("btnAtalhoContinuar");

  if (emAndamento.length === 0) {
    nomeEl.textContent = "Nenhum curso em andamento";
    textoEl.textContent = "0%";
    barraEl.style.width = "0%";
    btnEl.disabled = true;
    btnEl.style.opacity = "0.6";
    btnEl.style.cursor = "not-allowed";
    return;
  }

  const curso = emAndamento[0];

  nomeEl.textContent = curso.nome;
  textoEl.textContent = `${curso.progresso}%`;
  barraEl.style.width = `${curso.progresso}%`;

  btnEl.onclick = () => {
    window.location.href = "./aluno-meus-cursos.html";
  };
}

// ----------------------------------------------------------
// MÉTRICAS RESUMO
// ----------------------------------------------------------

function atualizarMetricas() {
  const emAndamento = cursosAluno.filter((c) => c.status === "andamento");
  const concluidos = cursosAluno.filter((c) => c.status === "concluido");

  const progressoMedio =
    cursosAluno.length === 0
      ? 0
      : Math.round(
          cursosAluno.reduce((total, c) => total + c.progresso, 0) /
            cursosAluno.length,
        );

  document.getElementById("qtdEmAndamento").textContent = emAndamento.length;
  document.getElementById("qtdConcluidos").textContent = concluidos.length;
  document.getElementById("progressoMedio").textContent = `${progressoMedio}%`;
  document.getElementById("qtdCertificados").textContent = concluidos.length;
}

// ----------------------------------------------------------
// ÚLTIMOS CURSOS ACESSADOS
// ----------------------------------------------------------

function renderizarUltimosAcessados() {
  const lista = document.getElementById("listaUltimosAcessados");

  lista.innerHTML = "";

  const acessados = cursosAluno.filter((c) => c.ultimoAcesso);

  if (acessados.length === 0) {
    lista.innerHTML = `<p class="vazio">Você ainda não acessou nenhum curso.</p>`;
    return;
  }

  const ultimos = acessados
    .sort((a, b) => new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso))
    .slice(0, 4);

  ultimos.forEach((curso) => {
    lista.innerHTML += `
      <div class="curso-mini">
        <img src="${curso.imagem}" alt="${curso.nome}" />

        <div class="curso-mini-info">
          <strong>${curso.nome}</strong>
          <small>Acessado em ${formatarData(curso.ultimoAcesso)}</small>
          <div class="barra-progresso">
            <div style="width: ${curso.progresso}%"></div>
          </div>
        </div>

        <button class="btn-continuar-mini" title="Continuar curso">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
    `;
  });
}

// ----------------------------------------------------------
// CURSOS RECOMENDADOS
// ----------------------------------------------------------

function renderizarRecomendados() {
  const lista = document.getElementById("listaRecomendados");

  lista.innerHTML = "";

  if (cursosRecomendadosAluno.length === 0) {
    lista.innerHTML = `<p class="vazio">Nenhuma recomendação no momento.</p>`;
    return;
  }

  cursosRecomendadosAluno.forEach((curso) => {
    lista.innerHTML += `
      <div class="curso-recomendado">
        <img src="${curso.imagem}" alt="${curso.nome}" />

        <div class="curso-recomendado-info">
          <strong>${curso.nome}</strong>
          <span class="tag-area">${curso.categoria}</span>
        </div>
      </div>
    `;
  });
}

// ----------------------------------------------------------
// AVISOS E NOTIFICAÇÕES
// ----------------------------------------------------------

const iconesAviso = {
  curso: { classe: "curso", icone: "fa-solid fa-book" },
  avaliacao: { classe: "avaliacao", icone: "fa-solid fa-clipboard-check" },
  certificado: { classe: "certificado", icone: "fa-solid fa-award" },
  sistema: { classe: "sistema", icone: "fa-solid fa-gear" },
};

function renderizarAvisos() {
  const lista = document.getElementById("listaAvisos");

  lista.innerHTML = "";

  if (notificacoesAluno.length === 0) {
    lista.innerHTML = `<p class="vazio">Nenhum aviso no momento.</p>`;
    return;
  }

  notificacoesAluno.slice(0, 5).forEach((aviso) => {
    const config = iconesAviso[aviso.tipo] || iconesAviso.sistema;

    lista.innerHTML += `
      <div class="aviso-item">
        <div class="aviso-icone ${config.classe}">
          <i class="${config.icone}"></i>
        </div>

        <div class="aviso-conteudo">
          <strong>${aviso.titulo}</strong>
          <p>${aviso.descricao}</p>
          <small>${aviso.data}</small>
        </div>
      </div>
    `;
  });
}

// ----------------------------------------------------------
// CERTIFICADOS DISPONÍVEIS
// ----------------------------------------------------------

function renderizarCertificados() {
  const lista = document.getElementById("listaCertificados");

  lista.innerHTML = "";

  const concluidos = cursosAluno.filter((c) => c.status === "concluido");

  if (concluidos.length === 0) {
    lista.innerHTML = `<p class="vazio">Você ainda não concluiu nenhum curso.</p>`;
    return;
  }

  concluidos.forEach((curso) => {
    lista.innerHTML += `
      <div class="certificado-item">
        <i class="fa-solid fa-award"></i>

        <div>
          <strong>${curso.nome}</strong>
          <small>Carga horária: ${curso.cargaHoraria}h</small>
        </div>

  <button
      class="btn-baixar-certificado"
      title="Baixar certificado"
      onclick="baixarCertificado('${curso.nome}')">
      <i class="fa-solid fa-download"></i>
  </button>
      </div>
    `;
  });
}

// ----------------------------------------------------------
// INICIALIZAÇÃO
// ----------------------------------------------------------

renderizarSaudacao();
renderizarAtalhoContinuar();
atualizarMetricas();
renderizarUltimosAcessados();
renderizarRecomendados();
renderizarAvisos();
renderizarCertificados();


function baixarCertificado(nomeCurso) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const nomeAluno =
    usuario && usuario.nome ? usuario.nome : "Aluno";

  const curso = cursosAluno.find((c) => c.nome === nomeCurso);
  const cargaHoraria = curso ? curso.cargaHoraria : "";

  // ===== BORDA =====
  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 277);

  doc.setLineWidth(0.5);
  doc.rect(15, 15, 180, 267);

  // ===== TÍTULO =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("HABILITA SAÚDE", 105, 50, {
    align: "center",
  });

  doc.setFontSize(20);
  doc.text("CERTIFICADO DE CONCLUSÃO", 105, 70, {
    align: "center",
  });

  // ===== TEXTO =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Certificamos que", 105, 100, {
    align: "center",
  });

  // ===== NOME DO ALUNO =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(nomeAluno, 105, 120, {
    align: "center",
  });

  // ===== CURSO =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("concluiu com êxito o curso", 105, 145, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  // Divide o nome do curso caso seja muito grande
  const linhasCurso = doc.splitTextToSize(nomeCurso, 150);

  doc.text(linhasCurso, 105, 165, {
    align: "center",
  });

  // ===== CARGA HORÁRIA =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);

  const posicaoCargaHoraria = 165 + linhasCurso.length * 10;

  doc.text(
    `Carga horária: ${cargaHoraria} horas`,
    105,
    posicaoCargaHoraria,
    {
      align: "center",
    }
  );

  // ===== DATA =====
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(12);
  doc.text(
    `Data de conclusão: ${dataAtual}`,
    105,
    posicaoCargaHoraria + 25,
    {
      align: "center",
    }
  );

  // ===== ASSINATURA =====
  const linhaAssinaturaY = posicaoCargaHoraria + 55;

  doc.line(65, linhaAssinaturaY, 145, linhaAssinaturaY);

  doc.setFontSize(11);
  doc.text("Habilita Saúde", 105, linhaAssinaturaY + 8, {
    align: "center",
  });

  // ===== RODAPÉ =====
  doc.setFontSize(10);
  doc.text(
    "Plataforma de Educação em Saúde",
    105,
    270,
    {
      align: "center",
    }
  );

  // ===== DOWNLOAD =====
  doc.save(`Certificado-${nomeCurso}.pdf`);
}

