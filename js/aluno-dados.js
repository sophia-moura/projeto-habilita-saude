async function obterCursosAluno() {
  const resposta = await API.get("/aluno/matriculas");

  return (resposta.cursos || []).map((curso) => ({
    id: curso.id,
    idMatricula: curso.idMatricula,
    nome: curso.nome,
    area: curso.area,
    categoria: curso.categoria,
    imagem: curso.imagem,
    progresso: curso.progresso,
    cargaHoraria: curso.cargaHoraria,
    nivel: curso.nivel,
    tipoCertificado: curso.tipoCertificado,
    professor: curso.professor,
    dataMatricula: curso.dataMatricula,
    ultimoAcesso: curso.ultimoAcesso,
    notaFinal: curso.notaFinal,
    situacao: curso.situacao,
    status: curso.status,
    certificado: curso.certificado,
  }));
}

async function obterRecomendadosAluno() {
  const meus = (await obterCursosAluno()).map((c) => c.id);
  const cursos = await API.get("/cursos");

  return (cursos || [])
    .filter((c) => !meus.includes(c.id_curso))
    .map((c) => ({
      id: c.id_curso,
      nome: c.nome_curso,
      categoria: "Curso",
      imagem: c.imagem_url,
      preco: c.preco || 0,
      professor: c.nome_professor,
    }));
}

async function obterNotificacoesAluno() {
  const notificacoes = await API.get("/notificacoes");

  return (notificacoes || []).map((item) => ({
    id: item.id,
    titulo: item.titulo,
    descricao: item.mensagem,
    tipo: "geral",
    para: "aluno",
    lida: Boolean(item.lida),
    data: item.data,
  }));
}

function formatarData(dataISO) {
  if (!dataISO) return "—";

  const data = new Date(dataISO);

  if (isNaN(data)) return "—";

  return data.toLocaleDateString("pt-BR");
}
