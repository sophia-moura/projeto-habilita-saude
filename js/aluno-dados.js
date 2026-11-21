async function obterRecomendadosAluno() {
  const [cursos, matriculasResposta] = await Promise.all([
    API.get("/cursos"),
    API.get("/aluno/matriculas")
  ]);

  const meus = (matriculasResposta.cursos || []).map((c) => Number(c.id));

  return cursos
    .filter((c) => !meus.includes(Number(c.id_curso)))
    .map((c) => ({
      id: c.id_curso,
      nome: c.nome_curso,
      categoria: c.area_tematica || "Curso",
      imagem: c.imagem_url,
      preco: c.preco || 0
    }));
}

async function obterNotificacoesAluno() {
  return await API.get("/notificacoes");
}

function formatarData(dataISO) {
  if (!dataISO) return "—";

  const data = new Date(dataISO);

  if (isNaN(data)) return "—";

  return data.toLocaleDateString("pt-BR");
}
