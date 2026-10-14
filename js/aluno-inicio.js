const cursosAluno = obterCursosAluno();
const cursosRecomendadosAluno = obterRecomendadosAluno();
const notificacoesAluno = obterNotificacoesAluno();

function renderizarSaudacao() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const saudacaoEl = document.getElementById("saudacaoAluno");

  if (!saudacaoEl) return;

  const primeiroNome = usuario?.nome ? usuario.nome.split(" ")[0] : "aluno(a)";

  saudacaoEl.textContent = `Olá, ${primeiroNome}!`;
}

// Abre a aula quando o professor já publicou conteúdos; senão, a lista de cursos.
function urlCurso(id) {
  const prof = (JSON.parse(localStorage.getItem("cursos") || "[]")).find((c) => c.id === id);
  return prof && (prof.conteudos || []).length ? "./aula.html?id=" + id : "./aluno-meus-cursos.html";
}

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
    window.location.href = urlCurso(curso.id);
  };
}

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

        <button class="btn-continuar-mini" title="Continuar curso" data-id="${curso.id}">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
    `;
  });
}

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
          <button class="btn-curso" data-matricular="${curso.id}">
            ${curso.preco > 0 ? "Matricular-se · " + curso.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Matricular-se grátis"}
          </button>
        </div>
      </div>
    `;
  });
}

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

renderizarSaudacao();
HS.gam.renderizar("painelGamificacao");
renderizarAtalhoContinuar();
atualizarMetricas();
renderizarUltimosAcessados();
renderizarRecomendados();
renderizarAvisos();
renderizarCertificados();

document.getElementById("listaRecomendados").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-matricular]");
  if (!btn) return;
  if (HS.matricular(Number(btn.dataset.matricular))) {
    HS.gam.xp(20, "Nova matrícula");
    alert("Matrícula realizada! O curso já está em Meus Cursos.");
    location.reload();
  }
});

document.getElementById("listaUltimosAcessados").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-continuar-mini");
  if (btn) location.href = urlCurso(Number(btn.dataset.id));
});
