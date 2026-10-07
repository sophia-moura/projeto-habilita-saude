(function () {
  const PADRAO = {
    operacional: { trilha: "Qualificação e Capacitação", nome: "Nível Operacional", chMin: 4, chMax: 8, precoMin: 49, precoMax: 97, docente: 85, aprovacao: 70, notaMin: 6.0, prazo: 3 },
    estrategico: { trilha: "Atualização e Aperfeiçoamento", nome: "Nível Estratégico", chMin: 12, chMax: 20, precoMin: 197, precoMax: 397, docente: 90, aprovacao: 75, notaMin: 7.5, prazo: 7 },
    expert: { trilha: "Proficiência Avançada", nome: "Nível Expert", chMin: 30, chMax: 9999, precoMin: 497, precoMax: 997, docente: 92, aprovacao: 80, notaMin: 8.0, prazo: 15 },
  };
  const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

  HS.niveis = () => {
    const salvo = ls("niveisConfig", {});
    const r = {};
    Object.keys(PADRAO).forEach((k) => (r[k] = { ...PADRAO[k], ...(salvo[k] || {}) }));
    return r;
  };
  HS.salvarNiveis = (cfg) => localStorage.setItem("niveisConfig", JSON.stringify(cfg));
  HS.restaurarNiveis = () => localStorage.removeItem("niveisConfig");

  HS.requisitos = (k) => {
    const n = HS.niveis()[k];
    const base = {
      operacional: ["Aulas modulares curtas (5 a 15 minutos)", `Quiz objetivo por módulo (aprovação mínima de ${n.aprovacao}%)`, "Vídeo em 1080p, áudio sem ruído contínuo e câmera estável"],
      estrategico: ["Unidades temáticas encadeadas com profundidade analítica", `Avaliação por módulo + estudo de caso prático (média mínima de ${n.aprovacao}%)`, "Microfone lapela/direcional e iluminação profissional", "Materiais complementares em formato padronizado"],
      expert: ["Gravação em estúdio profissional com múltiplos ângulos", `Exame geral + projeto prático avaliado por banca (mínimo de ${n.aprovacao}%)`, "Apostila detalhada, diretrizes e formulários técnicos", `Mínimo de ${n.chMin} horas de conteúdo`],
    };
    return base[k];
  };

  HS.rotulo = (c) => {
    const n = HS.niveis()[c.nivel];
    return n ? `Certificação HabilitaSaúde — ${n.trilha}, ${n.nome} — Área: ${c.categoria || "—"}` : "";
  };

  HS.curar = (c, checklistOk) => {
    const n = HS.niveis()[c.nivel];
    const tipos = (c.conteudos || []).map((x) => x.tipo);
    const tem = (...t) => t.some((x) => tipos.includes(x));
    const crit = {
      "Profundidade do Conteúdo": [30, Math.min(10, (c.descricao || "").length / 40) * 0.5 + Math.min(10, tipos.length * 2) * 0.5],
      "Qualidade de Produção": [20, checklistOk * 10],
      "Rigor da Avaliação": [20, tem("quiz") && tem("caso") ? 10 : tem("quiz", "caso") ? 7 : 3],
      "Coerência Curricular": [15, [c.subtitulo, c.publico, c.categoria, c.descricao].filter(Boolean).length * 2.5],
      "Atualização e Evidências": [15, tem("pdf", "ebook", "link") ? 9 : 4],
    };
    let nota = 0;
    const linhas = Object.entries(crit).map(([nome, [peso, v]]) => { v = Math.round(v * 10) / 10; nota += (peso / 100) * v; return `${nome}: ${v}/10 (peso ${peso}%)`; });
    nota = Math.round(nota * 10) / 10;
    const aprovado = nota >= n.notaMin;
    const op = HS.niveis().operacional.notaMin;
    const sugestao = !aprovado && c.nivel !== "operacional" && nota >= op;
    return {
      nota, aprovado, linhas, data: new Date().toLocaleString("pt-BR"),
      parecer: aprovado ? `Aprovado no ${n.nome} (média mínima ${n.notaMin}).`
        : sugestao ? `Nota ${nota}: abaixo do mínimo do ${n.nome} (${n.notaMin}). Pode ser publicado como Nível Operacional ou ajustado para nova submissão.`
        : `Nota ${nota}: abaixo do mínimo do ${n.nome} (${n.notaMin}). Ajuste o material e submeta novamente.`,
    };
  };
})();
