// ==========================================================
// HABILITA SAÚDE — VISÃO DO ALUNO — SUPORTE
// Depende de js/aluno-dados.js.
// Os chamados são salvos no localStorage, já que o MVP
// não possui backend nem banco de dados.
// ==========================================================

const CHAVE_CHAMADOS = "chamadosAluno";

// ----------------------------------------------------------
// FAQ
// ----------------------------------------------------------

const perguntasFaq = [
  {
    pergunta: "Como acesso os cursos em que estou matriculado?",
    resposta:
      "Acesse o menu 'Meus Cursos' na barra lateral. Lá aparecem todos os cursos em andamento, concluídos e ainda não iniciados, com o percentual de progresso de cada um.",
  },
  {
    pergunta: "Como continuo um curso de onde parei?",
    resposta:
      "Na página inicial há o atalho 'Continuar estudando', que leva direto ao último curso acessado. Você também pode usar o botão 'Continuar curso' na página Meus Cursos.",
  },
  {
    pergunta: "Como o meu progresso é calculado?",
    resposta:
      "O progresso é atualizado automaticamente conforme você marca as aulas como concluídas. O percentual considera o total de aulas de cada curso.",
  },
  {
    pergunta: "Quando o meu certificado fica disponível?",
    resposta:
      "O certificado é liberado quando o curso atinge 100% de conclusão e as avaliações obrigatórias são aprovadas. Ele aparece na página inicial, na seção 'Certificados disponíveis'.",
  },
  {
    pergunta: "Posso baixar os materiais das aulas?",
    resposta:
      "Sim, quando o professor autoriza o download. Os materiais liberados ficam disponíveis dentro da sala de aula, na seção de materiais complementares do módulo.",
  },
  {
    pergunta: "Esqueci minha senha. O que fazer?",
    resposta:
      "Na tela de login, escolha seu perfil e use a opção de recuperação de senha. Você receberá um e-mail com as instruções para cadastrar uma nova senha.",
  },
  {
    pergunta: "Como tiro dúvidas sobre o conteúdo com o professor?",
    resposta:
      "Dentro da sala de aula de cada curso existe um canal de comunicação com o professor, quando essa opção está habilitada pelo responsável pelo curso.",
  },
  {
    pergunta: "Como altero meus dados cadastrais?",
    resposta:
      "Os dados de perfil (nome, telefone, formação e área de atuação) podem ser editados na página de perfil do estudante.",
  },
];

const listaFaq = document.getElementById("listaFaq");
const buscaFaq = document.getElementById("buscaFaq");

function renderizarFaq(termo = "") {
  const filtradas = perguntasFaq.filter(
    (item) =>
      item.pergunta.toLowerCase().includes(termo.toLowerCase()) ||
      item.resposta.toLowerCase().includes(termo.toLowerCase()),
  );

  listaFaq.innerHTML = "";

  if (filtradas.length === 0) {
    listaFaq.innerHTML = `<p class="vazio">Nenhuma pergunta encontrada. Abra um chamado ao lado.</p>`;
    return;
  }

  filtradas.forEach((item, indice) => {
    listaFaq.innerHTML += `
      <div class="faq-item" data-indice="${indice}">
        <button class="faq-pergunta">
          <span>${item.pergunta}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>

        <div class="faq-resposta">
          <p>${item.resposta}</p>
        </div>
      </div>
    `;
  });

  // Abrir e fechar as respostas
  document.querySelectorAll(".faq-item").forEach((item) => {
    item.querySelector(".faq-pergunta").addEventListener("click", () => {
      item.classList.toggle("aberto");
    });
  });
}

buscaFaq.addEventListener("input", (e) => {
  renderizarFaq(e.target.value.trim());
});

// ----------------------------------------------------------
// SELECT DE CURSOS (preenchido com os cursos do aluno)
// ----------------------------------------------------------

const cursoChamado = document.getElementById("cursoChamado");

function preencherCursos() {
  const cursos = obterCursosAluno();

  cursos.forEach((curso) => {
    cursoChamado.innerHTML += `<option value="${curso.nome}">${curso.nome}</option>`;
  });
}

// ----------------------------------------------------------
// ABRIR CHAMADO
// ----------------------------------------------------------

const assuntoChamado = document.getElementById("assuntoChamado");
const mensagemChamado = document.getElementById("mensagemChamado");
const mensagemRetorno = document.getElementById("mensagemRetorno");
const btnEnviarChamado = document.getElementById("btnEnviarChamado");

function obterChamados() {
  return JSON.parse(localStorage.getItem(CHAVE_CHAMADOS)) || [];
}

function salvarChamados(chamados) {
  localStorage.setItem(CHAVE_CHAMADOS, JSON.stringify(chamados));
}

function enviarChamado() {
  const assunto = assuntoChamado.value;
  const mensagem = mensagemChamado.value.trim();

  if (!assunto) {
    mensagemRetorno.className = "mensagem-retorno erro";
    mensagemRetorno.textContent = "Selecione o assunto do chamado.";
    return;
  }

  if (mensagem.length < 10) {
    mensagemRetorno.className = "mensagem-retorno erro";
    mensagemRetorno.textContent =
      "Descreva sua dúvida com pelo menos 10 caracteres.";
    return;
  }

  const chamados = obterChamados();

  const novoChamado = {
    id: Date.now(),
    protocolo: `#${String(Date.now()).slice(-6)}`,
    assunto: assunto,
    curso: cursoChamado.value || "—",
    mensagem: mensagem,
    status: "aberto",
    data: new Date().toLocaleString("pt-BR"),
  };

  chamados.unshift(novoChamado);
  salvarChamados(chamados);

  mensagemRetorno.className = "mensagem-retorno sucesso";
  mensagemRetorno.textContent = `Chamado ${novoChamado.protocolo} enviado! Responderemos em até 24h.`;

  assuntoChamado.value = "";
  cursoChamado.value = "";
  mensagemChamado.value = "";

  renderizarChamados();
}

btnEnviarChamado.addEventListener("click", enviarChamado);

// ----------------------------------------------------------
// LISTA DE CHAMADOS
// ----------------------------------------------------------

const listaChamados = document.getElementById("listaChamados");

const rotulosStatusChamado = {
  aberto: { texto: "Aberto", classe: "chamado-aberto" },
  respondido: { texto: "Respondido", classe: "chamado-respondido" },
  encerrado: { texto: "Encerrado", classe: "chamado-encerrado" },
};

function renderizarChamados() {
  const chamados = obterChamados();

  listaChamados.innerHTML = "";

  if (chamados.length === 0) {
    listaChamados.innerHTML = `
      <div class="lista-vazia">
        <i class="fa-regular fa-comments"></i>
        <p>Você ainda não abriu nenhum chamado.</p>
      </div>
    `;
    return;
  }

  chamados.forEach((chamado) => {
    const status =
      rotulosStatusChamado[chamado.status] || rotulosStatusChamado.aberto;

    listaChamados.innerHTML += `
      <div class="chamado-item">
        <div class="chamado-topo">
          <div>
            <strong>${chamado.assunto}</strong>
            <span class="protocolo">${chamado.protocolo}</span>
          </div>

          <span class="status-chamado ${status.classe}">${status.texto}</span>
        </div>

        <p class="chamado-mensagem">${chamado.mensagem}</p>

        <div class="chamado-rodape">
          <span><i class="fa-solid fa-book"></i> ${chamado.curso}</span>
          <span><i class="fa-regular fa-clock"></i> ${chamado.data}</span>
        </div>
      </div>
    `;
  });
}

// ----------------------------------------------------------
// INICIALIZAÇÃO
// ----------------------------------------------------------

renderizarFaq();
preencherCursos();
renderizarChamados();
