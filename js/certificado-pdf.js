// Geração do PDF do certificado (jsPDF + qrcode-generator).
// Compartilhado por aluno-inicio.html e certificados.html.
// Requer: jspdf, qrcode-generator e js/global.js (HS) carregados antes.
async function baixarCertificado(curso, reg) {
  const usuario = await HS.carregarUsuario() || {};
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const nomeAluno = usuario.nome || "Aluno";
  const nomeCurso = curso.nome;
  const cargaHoraria = curso.cargaHoraria || "";

  if (!reg || !reg.uuid) {
    alert("Certificado ainda não possui código de validação.");
    return;
  }

  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 277);

  doc.setLineWidth(0.5);
  doc.rect(15, 15, 180, 267);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("HABILITA SAÚDE", 105, 50, {
    align: "center",
  });

  doc.setFontSize(20);
  doc.text("CERTIFICADO DE CONCLUSÃO", 105, 70, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Certificamos que", 105, 100, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(nomeAluno, 105, 120, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("concluiu com êxito o curso", 105, 145, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  const linhasCurso = doc.splitTextToSize(nomeCurso, 150);

  doc.text(linhasCurso, 105, 165, {
    align: "center",
  });

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

  const dataAtual = reg.data || new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(12);
  doc.text(
    `Data de conclusão: ${dataAtual}`,
    105,
    posicaoCargaHoraria + 25,
    {
      align: "center",
    }
  );

  const linhaAssinaturaY = posicaoCargaHoraria + 28;

  doc.line(65, linhaAssinaturaY, 145, linhaAssinaturaY);

  doc.setFontSize(11);
  doc.text("Habilita Saúde", 105, linhaAssinaturaY + 8, {
    align: "center",
  });
  
  const BASE_VALIDACAO = `${location.origin}/validar.html?id=`;

  const dig = String(usuario.cpf || "").replace(/\D/g, "");

  const cpfMasc = dig.length === 11
    ? `***.${dig.slice(3, 6)}.${dig.slice(6, 9)}-**`
    : "não informado";

  doc.setFontSize(10);
  doc.text(`CPF: ${cpfMasc}   |   Concluído em: ${reg.data}`, 105, linhaAssinaturaY + 17, { align: "center" });
  doc.setFontSize(9);
  doc.text(
    doc.splitTextToSize(
      `Certificado de conclusão do curso ${nomeCurso}`,
      165
    ),
    105,
    linhaAssinaturaY + 23,
    { align: "center" }
  );

  const qr = qrcode(0, "M");
  qr.addData(BASE_VALIDACAO + reg.uuid);
  qr.make();
  const n = qr.getModuleCount(), tam = 26 / n;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c)) doc.rect(22 + c * tam, 238 + r * tam, tam + 0.05, tam + 0.05, "F");
  doc.setFontSize(8);
  doc.text("Validação de autenticidade", 54, 244);
  doc.text(`Código: ${reg.uuid}`, 54, 249);
  doc.text(BASE_VALIDACAO + reg.uuid, 54, 254);

  const area = (curso.area || "").toLowerCase();
  const conselho = /enferm/.test(area) ? "COREN – no caso de Enfermagem"
    : /odont/.test(area) ? "CRO – no caso de Odontologia"
    : /medic/.test(area) ? "CFM – no caso de Medicina"
    : /radio|imagem/.test(area) ? "CRTR – no caso de radiologia"
    : /nutri/.test(area) ? "CRN – no caso de Nutrição"
    : /farm/.test(area) ? "CRF – no caso de Farmácia"
    : /psic/.test(area) ? "CRP – no caso de Psicologia"
    : /fisio|terapia ocup/.test(area) ? "CREFITO – no caso de Fisioterapia e Terapia Ocupacional"
    : "conselho de classe correspondente";
  doc.setFontSize(7);
  doc.text(doc.splitTextToSize(
    `Curso livre de atualização profissional. Este certificado não confere habilitação profissional nem substitui credenciamento junto a conselhos de classe (${conselho} ou equivalentes).`, 165), 105, 270, { align: "center" });

  doc.save(`Certificado-${nomeCurso}.pdf`);
}
