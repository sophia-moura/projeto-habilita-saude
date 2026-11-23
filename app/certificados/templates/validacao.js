(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HabilitaValidacao = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const nomes = Object.freeze({
    operacional: "Qualificação e Capacitação — Nível Operacional",
    estrategico: "Atualização e Aperfeiçoamento — Nível Estratégico",
    expert: "Proficiência Avançada — Nível Expert",
  });
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const allowed = [
    "schemaVersion",
    "nivel",
    "demo",
    "alunoNome",
    "cpfMascarado",
    "cursoTitulo",
    "area",
    "professorNome",
    "cargaHoraria",
    "dataInicio",
    "dataConclusao",
    "dataEmissao",
    "codigo",
    "verificationUrl",
    "razaoSocial",
    "cnpj",
    "criterios",
    "modulos",
    "assinaturaProfessor",
    "assinaturaInstitucional",
  ];
  function validate(d) {
    const errors = [];
    if (!d || typeof d !== "object" || Array.isArray(d))
      return ["Os dados devem ser um objeto JSON."];
    for (const k of Object.keys(d))
      if (!allowed.includes(k)) errors.push("Campo não reconhecido: " + k);
    if (d.schemaVersion !== "2.0") errors.push("schemaVersion deve ser 2.0.");
    if (!Object.hasOwn(nomes, d.nivel)) errors.push("Nível inválido.");
    if (typeof d.demo !== "boolean")
      errors.push("demo deve ser true ou false.");
    const lengths = {
      alunoNome: 96,
      cursoTitulo: 150,
      area: 65,
      professorNome: 96,
      razaoSocial: 130,
      cnpj: 40,
      criterios: 420,
    };

    const camposQuePodemFicarVazios = ["razaoSocial", "cnpj"];
    for (const [k, max] of Object.entries(lengths))
      if (
        typeof d[k] !== "string" ||
        (!camposQuePodemFicarVazios.includes(k) && !d[k].trim()) ||
        d[k].length > max ||
        /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(d[k])
      )
        errors.push(k + ": obrigatório, texto com até " + max + " caracteres.");
    if (
      typeof d.cpfMascarado !== "string" ||
      !/^\*{3}\.\*{3}\.\*{3}-(?:\d{2}|\*{2})$/.test(d.cpfMascarado)
    )
      errors.push(
        "CPF deve estar mascarado: ***.***.***-00 ou ***.***.***-**.",
      );
    if (
      typeof d.cargaHoraria !== "number" ||
      !Number.isFinite(d.cargaHoraria) ||
      d.cargaHoraria <= 0 ||
      d.cargaHoraria > 9999 ||
      Math.abs(d.cargaHoraria * 100 - Math.round(d.cargaHoraria * 100)) > 1e-7
    )
      errors.push(
        "Carga horária deve ser positiva, com até duas casas decimais.",
      );
    for (const k of ["dataInicio", "dataConclusao", "dataEmissao"]) {
      const v = d[k];
      const date = typeof v === "string" ? new Date(v + "T12:00:00Z") : null;
      if (
        !date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== v
      )
        errors.push(k + ": data real no formato AAAA-MM-DD.");
    }
    if (d.dataInicio > d.dataConclusao)
      errors.push("Início posterior à conclusão.");
    if (d.dataConclusao > d.dataEmissao)
      errors.push("Emissão anterior à conclusão.");
    if (typeof d.codigo !== "string" || !uuid.test(d.codigo))
      errors.push("Código deve ser UUID v4.");
    try {
      if (
        typeof d.verificationUrl !== "string" ||
        d.verificationUrl.length > 220
      )
        throw Error();
      const u = new URL(d.verificationUrl);
      const hostLocal = [
          "localhost",
          "127.0.0.1"
      ].includes(u.hostname);

      const protocoloInvalido = d.demo === true
          ? !(u.protocol === "https:" || (u.protocol === "http:" && hostLocal))
          : u.protocol !== "https:";

      if (
          protocoloInvalido ||
          u.username ||
          u.password ||
          u.search ||
          u.hash ||
          !u.pathname.endsWith("/" + d.codigo)
      )
          throw Error();
      if (
        d.demo !== true &&
        (/(^|\.)localhost$|\.(invalid|example|test|local)$|^example\.(com|org|net)$/.test(
          u.hostname,
        ) ||
          /^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) ||
          u.hostname.includes(":"))
      )
        throw Error();
    } catch {
      errors.push(
        "verificationUrl deve ser HTTPS, terminar em /UUID e não conter consulta, fragmento ou credenciais; produção exige domínio real.",
      );
    }
    if (
      !Array.isArray(d.modulos) ||
      d.modulos.length < 1 ||
      d.modulos.length > 10
    )
      errors.push("Conteúdo programático deve ter de 1 a 10 módulos.");
    else {
      let total = 0;
      for (const [i, m] of d.modulos.entries()) {
        if (
          !m ||
          typeof m !== "object" ||
          typeof m.titulo !== "string" ||
          !m.titulo.trim() ||
          m.titulo.length > 100 ||
          typeof m.horas !== "number" ||
          !Number.isFinite(m.horas) ||
          m.horas <= 0 ||
          Math.abs(m.horas * 100 - Math.round(m.horas * 100)) > 1e-7
        )
          errors.push(
            "Módulo " +
              (i + 1) +
              ": título até 100 caracteres e horas positivas, até duas casas decimais.",
          );
        else total += m.horas;
      }
      if (Math.abs(total - d.cargaHoraria) > 0.00001)
        errors.push("A soma dos módulos deve coincidir com a carga horária.");
    }
    for (const key of ["assinaturaProfessor", "assinaturaInstitucional"])
      if (
        d[key] !== undefined &&
        d[key] !== "" &&
        (typeof d[key] !== "string" ||
          !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(d[key]) ||
          d[key].length > 2800000)
      )
        errors.push(key + ": apenas PNG/JPEG em base64, até cerca de 2 MB.");
    if (d.demo === false) {
      if (
        /demonstra|fictíci|substituir|a definir|não cadastrad/i.test(
          d.razaoSocial + " " + d.cnpj,
        )
      )
        errors.push("Produção exige razão social e CNPJ oficiais.");
      if (
        d.cnpj.trim() !== "" &&
        !/^[A-Z0-9]{2}\.?[A-Z0-9]{3}\.?[A-Z0-9]{3}\/?[A-Z0-9]{4}-?\d{2}$/i.test(
            d.cnpj
        )
      )
        errors.push(
          "CNPJ com formato inválido; validar cadastro e dígitos no backend.",
        );
    }
    return errors;
  }
  function assert(d) {
    const errors = validate(d);
    if (errors.length)
      throw new Error("Emissão bloqueada:\n" + errors.join("\n"));
    return d;
  }
  return { validate, assert, nomes, version: "2.0.0" };
});
