// Geração do PDF do certificado (jsPDF + qrcode-generator).
// Compartilhado por aluno-inicio.html e certificados.html.
// Requer: jspdf, qrcode-generator e js/global.js (HS) carregados antes.
function baixarCertificado(nomeCurso) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null") || {};
  const cursosAluno = JSON.parse(localStorage.getItem("cursosAluno_v2") || "[]");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const nomeAluno =
    usuario && usuario.nome ? usuario.nome : "Aluno";

  const curso = cursosAluno.find((c) => c.nome === nomeCurso);
  const cargaHoraria = curso ? curso.cargaHoraria : "";

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

  const linhaAssinaturaY = posicaoCargaHoraria + 28;

  doc.line(65, linhaAssinaturaY, 145, linhaAssinaturaY);

  doc.setFontSize(11);
  doc.text("Habilita Saúde", 105, linhaAssinaturaY + 8, {
    align: "center",
  });

  const BASE_VALIDACAO = "https://habilitasaude.com.br/validar/";
  const registros = JSON.parse(localStorage.getItem("certificados") || "[]");
  const cursoProf = (JSON.parse(localStorage.getItem("cursos") || "[]")).find((c) => curso && c.id === curso.id);
  let reg = registros.find((r) => r.email === usuario.email && r.cursoId === (curso && curso.id));
  if (!reg) {
    const b = crypto.getRandomValues(new Uint8Array(16));
    reg = {
      uuid: Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase(),
      email: usuario.email, aluno: nomeAluno, cursoId: curso && curso.id, curso: nomeCurso,
      rotulo: cursoProf && cursoProf.nivel && HS.rotulo ? HS.rotulo(cursoProf) : "Certificação HabilitaSaúde",
      area: (cursoProf && cursoProf.categoria) || (curso && curso.area) || "",
      cargaHoraria, data: new Date().toLocaleDateString("pt-BR"),
    };
    registros.push(reg);
    localStorage.setItem("certificados", JSON.stringify(registros));
  }
  const dig = String(usuario.cpf || "").replace(/\D/g, "");
  const cpfMasc = dig.length === 11 ? `***.${dig.slice(3, 6)}.${dig.slice(6, 9)}-**` : "não informado";

  doc.setFontSize(10);
  doc.text(`CPF: ${cpfMasc}   |   Concluído em: ${reg.data}`, 105, linhaAssinaturaY + 17, { align: "center" });
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(reg.rotulo, 165), 105, linhaAssinaturaY + 23, { align: "center" });

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

  const area = (reg.area || "").toLowerCase();
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
