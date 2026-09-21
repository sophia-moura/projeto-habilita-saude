// ==========================================================
// HABILITA SAÚDE — VISÃO DO ALUNO — DADOS COMPARTILHADOS
// O MVP não possui backend nem banco de dados, então os dados
// do aluno ficam no localStorage. Este arquivo cria os dados
// de exemplo e é carregado por todas as páginas da área do aluno.
// ==========================================================

// Chave versionada: se a estrutura dos dados mudar, basta
// alterar a versão para que o seed seja recriado.
const CHAVE_CURSOS_ALUNO = "cursosAluno_v2";
const CHAVE_RECOMENDADOS_ALUNO = "cursosRecomendadosAluno_v2";

// ----------------------------------------------------------
// CURSOS DO ALUNO
// status: "andamento" | "concluido" | "nao-iniciado"
// ----------------------------------------------------------

function seedCursosAluno() {
  if (localStorage.getItem(CHAVE_CURSOS_ALUNO)) return;

  const cursosAluno = [
    {
      id: 1,
      nome: "Cardiologia na Prática",
      area: "Medicina",
      categoria: "Cardiologia",
      imagem:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=60",
      progresso: 65,
      cargaHoraria: 24,
      professor: "Dra. Ana Beatriz",
      dataMatricula: "2026-06-10",
      ultimoAcesso: "2026-09-12T14:30:00",
      status: "andamento",
    },
    {
      id: 2,
      nome: "Primeiros Socorros Essenciais",
      area: "Enfermagem",
      categoria: "Emergência",
      imagem:
        "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=60",
      progresso: 100,
      cargaHoraria: 12,
      professor: "Prof. Marcos Lima",
      dataMatricula: "2026-04-22",
      ultimoAcesso: "2026-08-30T09:10:00",
      status: "concluido",
    },
    {
      id: 3,
      nome: "Nutrição Clínica Aplicada",
      area: "Nutrição",
      categoria: "Nutrição Clínica",
      imagem:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=60",
      progresso: 30,
      cargaHoraria: 18,
      professor: "Dra. Carla Souza",
      dataMatricula: "2026-07-05",
      ultimoAcesso: "2026-09-13T19:00:00",
      status: "andamento",
    },
    {
      id: 4,
      nome: "Fisioterapia Ortopédica",
      area: "Fisioterapia",
      categoria: "Ortopedia",
      imagem:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=60",
      progresso: 100,
      cargaHoraria: 20,
      professor: "Prof. Rafael Torres",
      dataMatricula: "2026-03-18",
      ultimoAcesso: "2026-08-15T11:00:00",
      status: "concluido",
    },
    {
      id: 5,
      nome: "Farmacologia para Enfermagem",
      area: "Enfermagem",
      categoria: "Farmacologia",
      imagem:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=60",
      progresso: 0,
      cargaHoraria: 16,
      professor: "Dra. Juliana Alves",
      dataMatricula: "2026-09-08",
      ultimoAcesso: null,
      status: "nao-iniciado",
    },
    {
      id: 6,
      nome: "Saúde Mental e Acolhimento",
      area: "Psicologia",
      categoria: "Saúde Mental",
      imagem:
        "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&q=60",
      progresso: 0,
      cargaHoraria: 30,
      professor: "Prof. Diego Martins",
      dataMatricula: "2026-09-01",
      ultimoAcesso: null,
      status: "nao-iniciado",
    },
  ];

  localStorage.setItem(CHAVE_CURSOS_ALUNO, JSON.stringify(cursosAluno));
}

// ----------------------------------------------------------
// CURSOS RECOMENDADOS (usados na página inicial)
// ----------------------------------------------------------

function seedRecomendadosAluno() {
  if (localStorage.getItem(CHAVE_RECOMENDADOS_ALUNO)) return;

  const recomendados = [
    {
      id: 101,
      nome: "Farmacologia Básica",
      categoria: "Farmácia",
      imagem:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=60",
    },
    {
      id: 102,
      nome: "Saúde Mental no Trabalho",
      categoria: "Psicologia",
      imagem:
        "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&q=60",
    },
    {
      id: 103,
      nome: "Enfermagem em UTI",
      categoria: "Enfermagem",
      imagem:
        "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400&q=60",
    },
    {
      id: 104,
      nome: "Anatomia Humana Essencial",
      categoria: "Medicina",
      imagem:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=60",
    },
  ];

  localStorage.setItem(CHAVE_RECOMENDADOS_ALUNO, JSON.stringify(recomendados));
}

// ----------------------------------------------------------
// NOTIFICAÇÕES / AVISOS
// Usa a mesma chave "notificacoes" já utilizada pelo global.js
// ----------------------------------------------------------

function seedNotificacoesAluno() {
  if (localStorage.getItem("notificacoes")) return;

  const notificacoes = [
    {
      id: Date.now() - 3000,
      titulo: "Novo módulo disponível",
      descricao: "O curso Cardiologia na Prática recebeu um novo módulo.",
      tipo: "curso",
      lida: false,
      data: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString("pt-BR"),
    },
    {
      id: Date.now() - 2000,
      titulo: "Avaliação pendente",
      descricao:
        "Você tem uma avaliação pendente em Nutrição Clínica Aplicada.",
      tipo: "avaliacao",
      lida: false,
      data: new Date(Date.now() - 1000 * 60 * 60 * 26).toLocaleString("pt-BR"),
    },
    {
      id: Date.now() - 1000,
      titulo: "Certificado emitido",
      descricao:
        "Seu certificado de Primeiros Socorros Essenciais já está disponível.",
      tipo: "certificado",
      lida: true,
      data: new Date(Date.now() - 1000 * 60 * 60 * 72).toLocaleString("pt-BR"),
    },
  ];

  localStorage.setItem("notificacoes", JSON.stringify(notificacoes));
}

seedCursosAluno();
seedRecomendadosAluno();
seedNotificacoesAluno();

// ----------------------------------------------------------
// FUNÇÕES DE ACESSO AOS DADOS
// ----------------------------------------------------------

function obterCursosAluno() {
  return JSON.parse(localStorage.getItem(CHAVE_CURSOS_ALUNO)) || [];
}

function salvarCursosAluno(cursos) {
  localStorage.setItem(CHAVE_CURSOS_ALUNO, JSON.stringify(cursos));
}

function obterRecomendadosAluno() {
  return JSON.parse(localStorage.getItem(CHAVE_RECOMENDADOS_ALUNO)) || [];
}

function obterNotificacoesAluno() {
  return JSON.parse(localStorage.getItem("notificacoes")) || [];
}

// Formata "2026-06-10" para "10/06/2026"
function formatarData(dataISO) {
  if (!dataISO) return "—";

  const data = new Date(dataISO);

  if (isNaN(data)) return "—";

  return data.toLocaleDateString("pt-BR");
}
