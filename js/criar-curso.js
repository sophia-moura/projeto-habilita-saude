(async function () {
  const acessoPermitido = await HS.ready;

  if (!acessoPermitido) return;

  const esc = HS.esc || ((t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  const IMG_PADRAO =
    "data:image/svg+xml;utf8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="#0055c3"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="22" text-anchor="middle">Habilita Saúde</text></svg>');

  const usuarioAtual = HS.usuario || {};

  const form = document.getElementById("formCurso");
  const nomeCurso = document.getElementById("nomeCurso");
  const subtituloCurso = document.getElementById("subtituloCurso");
  const descricaoCurso = document.getElementById("descricaoCurso");
  const areaCurso = document.getElementById("areaCurso");
  const publicoCurso = document.getElementById("publicoCurso");
  const cargaHoraria = document.getElementById("cargaHoraria");
  const categoriaCurso = document.getElementById("categoriaCurso");
  const precoCurso = document.getElementById("precoCurso");
  const uploadBox = document.getElementById("uploadBox");
  const inputImagem = document.getElementById("imagemCurso");
  const previewImagem = document.getElementById("previewImagem");
  const listaConteudos = document.getElementById("listaConteudos");
  const inputConteudo = document.getElementById("arquivoConteudo");
  const btnRascunho = document.getElementById("btnRascunho");

  if (!form || !nomeCurso || !categoriaCurso || !precoCurso) return;

  const NIVEIS = HS.niveis ? HS.niveis() : {};
  let conteudosCurso = [];
  let imagemBase64 = "";
  let arquivoImagem = null;
  let tipoAtual = "";

  const moeda = (v) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function lerPreco() {
    const texto = String(precoCurso.value || "");
    const digitos = texto.replace(/\D/g, "");
    if (!digitos) return 0;
    return Number(digitos) / 100;
  }

  /* ---------- Níveis ---------- */
  categoriaCurso.innerHTML =
    '<option value="">Selecione o nível</option>' +
    Object.entries(NIVEIS)
      .map(
        ([k, n], i) =>
          `<option value="${esc(k)}">Nível ${i + 1} — ${esc(n.trilha)} (${esc(
            String(n.nome || "").replace("Nível ", ""),
          )})</option>`,
      )
      .join("");

  function renderNivel() {
    const k = categoriaCurso.value;
    const info = document.getElementById("infoNivel");
    const lista = document.getElementById("checklistNivel");
    if (!info || !lista) return;
    if (!k || !NIVEIS[k]) {
      info.innerHTML = "";
      lista.innerHTML = "";
      return;
    }
    const n = NIVEIS[k];
    const ch = n.chMax >= 9999 ? `${n.chMin}h ou mais` : `${n.chMin} a ${n.chMax}h`;
    info.innerHTML = `<b>${esc(n.nome)}</b><br>Carga horária: ${esc(ch)} · Preço: ${moeda(
      n.precoMin,
    )} a ${moeda(n.precoMax)}<br>Repasse: ${Number(n.docente) || 0}% professor / ${
      100 - (Number(n.docente) || 0)
    }% portal · Curadoria em até ${Number(n.prazo) || 0} dias úteis`;
    const requisitos = HS.requisitos ? HS.requisitos(k) : [];
    lista.innerHTML =
      "<b>Autoavaliação — marque o que seu curso cumpre:</b>" +
      requisitos
        .map(
          (r, i) =>
            `<label style="display:block;margin-top:6px"><input type="checkbox" class="req-nivel" data-i="${i}"> ${esc(
              r,
            )}</label>`,
        )
        .join("");
  }
  categoriaCurso.addEventListener("change", renderNivel);

  /* ---------- Curso em edição / rascunho ---------- */

  let cursoEditando = null;

  const parametros = new URLSearchParams(window.location.search);
  const idCursoEdicao = parametros.get("editar");

  function preencherFormulario(dados) {
      if (!dados) return;

      nomeCurso.value = dados.nome_curso || "";
      subtituloCurso.value = dados.subtitulo || "";
      descricaoCurso.value = dados.descricao || "";
      areaCurso.value = dados.area_tematica || "";
      publicoCurso.value = dados.publico_alvo || "";
      cargaHoraria.value = dados.carga_horaria || "";
      categoriaCurso.value = dados.nivel || "";

      precoCurso.value = dados.preco != null
          ? moeda(Number(dados.preco))
          : "";

      document.querySelectorAll('input[name="certificado"]').forEach((radio) => {
          radio.checked = radio.value === dados.certificado;
      });

      renderNivel();

      let checklist = dados.checklist || [];

      if (typeof checklist === "string") {
          try {
              checklist = JSON.parse(checklist);
          } catch (e) {
              checklist = [];
          }
      }

      if (Array.isArray(checklist)) {
          document.querySelectorAll(".req-nivel").forEach((req, i) => {
              req.checked = checklist[i] === true;
          });
      }

      imagemBase64 = dados.imagem_url || "";

      if (imagemBase64) {
          mostrarPreview(imagemBase64);
      }
  }

  // Buscar curso diretamente na API
  
  if (idCursoEdicao) {
    try {
      cursoEditando = await API.get(
        `/professor/cursos/${encodeURIComponent(idCursoEdicao)}`
      );

      preencherFormulario(cursoEditando);

      // Buscar módulos e aulas armazenados no MySQL.
      const modulos = await API.get(
        `/professor/cursos/${encodeURIComponent(idCursoEdicao)}/conteudos`
      );

      conteudosCurso = (modulos || []).flatMap((modulo) =>
        (modulo.aulas || []).map((aula) => {
          let metadados = aula.metadados || {};

          if (typeof metadados === "string") {
            try {
              metadados = JSON.parse(metadados);
            } catch {
              metadados = {};
            }
          }

          return {
            id_aula: aula.id_aula,
            tipo: aula.tipo,
            nome:
              aula.tipo === "link"
                ? aula.arquivo_url || aula.titulo
                : aula.titulo,
            texto: aula.conteudo || "",
            perguntas: metadados.perguntas || [],
            notaMinima: metadados.notaMinima || 70,
            arquivo_url: aula.arquivo_url || null,
            arquivoId: metadados.arquivoId || null,
            mime: metadados.mime || "",
            tamanho: metadados.tamanho || 0
          };
        })
      );

      renderizarConteudos();

    } catch (erro) {
      console.error("Erro ao carregar curso:", erro);

      alert(
        erro.message || "Não foi possível carregar o curso e seus conteúdos."
      );

      window.location.href = "professor-meus-cursos.html";
      return;
    }
  } else {
    try {
      const rascunho = JSON.parse(
        localStorage.getItem("rascunhoCurso")
      );

      if (rascunho) {
        nomeCurso.value = rascunho.nome || "";
        subtituloCurso.value = rascunho.subtitulo || "";
        descricaoCurso.value = rascunho.descricao || "";
        areaCurso.value = rascunho.area || "";
        publicoCurso.value = rascunho.publico || "";
        cargaHoraria.value =
          parseInt(rascunho.cargaHoraria, 10) || "";

        categoriaCurso.value = rascunho.categoria || "";

        precoCurso.value = rascunho.preco
          ? moeda(lerPrecoDe(rascunho.preco))
          : "";

        conteudosCurso = Array.isArray(rascunho.conteudos)
          ? rascunho.conteudos
          : [];

        renderNivel();
        renderizarConteudos();
      }
    } catch (erro) {
      console.error("Erro ao carregar rascunho:", erro);
    }
  }

  /* ---------- Imagem ---------- */
  function mostrarPreview(src) {
    if (!previewImagem) return;
    previewImagem.src = src;
    previewImagem.style.display = "block";
    [uploadBox.querySelector("i"), uploadBox.querySelector("p"), uploadBox.querySelector("small")].forEach(
      (el) => el && (el.style.display = "none"),
    );
  }

  function processarImagem(arquivo, aoConcluir) {
    if (!arquivo) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(arquivo.type)) {
      alert("Escolha uma imagem PNG, JPG ou WEBP.");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5 MB.");
      return;
    }

    const leitor = new FileReader();
    leitor.onerror = () => alert("Não foi possível ler a imagem escolhida.");
    leitor.onload = () => {
      const original = String(leitor.result || "");
      const img = new Image();
      img.onerror = () => aoConcluir(original);
      img.onload = () => {
        try {
          const MAX = 1200;
          const escala = Math.min(1, MAX / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round((img.width || 1) * escala));
          canvas.height = Math.max(1, Math.round((img.height || 1) * escala));
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const comprimida = canvas.toDataURL("image/jpeg", 0.82);
          aoConcluir(comprimida.length < original.length ? comprimida : original);
        } catch (e) {
          aoConcluir(original);
        }
      };
      img.src = original;
    };
    leitor.readAsDataURL(arquivo);
  }

  function carregarImagem(arquivo) {
    if (!arquivo) return;

    if (!/^image\/(png|jpe?g|webp)$/i.test(arquivo.type)) {
      alert("Escolha uma imagem PNG, JPG ou WEBP.");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5 MB.");
      return;
    }

    arquivoImagem = arquivo;

    processarImagem(arquivo, (src) => {
      imagemBase64 = src;
      mostrarPreview(src);
    });
  }

  uploadBox?.addEventListener("click", () => inputImagem?.click());
  uploadBox?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputImagem?.click();
    }
  });
  inputImagem?.addEventListener("change", (e) => {
    carregarImagem(e.target.files && e.target.files[0]);
    e.target.value = "";
  });

  uploadBox?.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragging");
  });
  uploadBox?.addEventListener("dragleave", () => uploadBox.classList.remove("dragging"));
  uploadBox?.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragging");
    carregarImagem(e.dataTransfer.files && e.dataTransfer.files[0]);
  });

  /* ---------- Rascunho ---------- */
  function dadosDoFormulario() {
    return {
      nome: nomeCurso.value.trim(),
      subtitulo: subtituloCurso.value.trim(),
      descricao: descricaoCurso.value.trim(),
      area: areaCurso.value,
      publico: publicoCurso.value.trim(),
      cargaHoraria: cargaHoraria.value,
      categoria: categoriaCurso.value,
      preco: precoCurso.value,
      conteudos: conteudosCurso,
    };
  }

  function salvarRascunho(silencioso) {
    try {
      localStorage.setItem("rascunhoCurso", JSON.stringify(dadosDoFormulario()));
      if (!silencioso) alert("Rascunho salvo!");
      return true;
    } catch (e) {
      if (!silencioso) alert("Não foi possível salvar o rascunho: o armazenamento do navegador está cheio.");
      return false;
    }
  }

  form.addEventListener("input", () => salvarRascunho(true));

  precoCurso.addEventListener("input", (e) => {
    const digitos = e.target.value.replace(/\D/g, "");
    e.target.value = digitos ? moeda(Number(digitos) / 100) : "";
  });

  /* ---------- Conteúdos ---------- */
  const ICONES_CONTEUDO = {
    video: "fa-video",
    pdf: "fa-file-pdf",
    ebook: "fa-book",
    slide: "fa-display",
    mapa: "fa-sitemap",
    quiz: "fa-circle-question",
    caso: "fa-stethoscope",
    material: "fa-folder-open",
    link: "fa-link",
    texto: "fa-file-lines",
  };
  const ROTULOS_CONTEUDO = {
    video: "Vídeo",
    pdf: "PDF",
    ebook: "E-book",
    slide: "Slides",
    mapa: "Mapa mental",
    quiz: "Quiz",
    caso: "Estudo de caso",
    material: "Material",
    link: "Link externo",
    texto: "Lição em texto",
  };

  function detalheConteudo(item) {
    let r = ROTULOS_CONTEUDO[item.tipo] || item.tipo || "Conteúdo";
    if (item.tipo === "quiz" && Array.isArray(item.perguntas)) {
      r += ` · ${item.perguntas.length} ${item.perguntas.length === 1 ? "pergunta" : "perguntas"} · nota mínima ${
        item.notaMinima || 70
      }%`;
    }
    return r;
  }

  function renderizarConteudos() {
    if (!listaConteudos) return;
    if (!conteudosCurso.length) {
      listaConteudos.innerHTML =
        '<p class="vazio" style="padding:12px 0;color:#718096">Nenhum conteúdo adicionado ainda.</p>';
      return;
    }

    listaConteudos.innerHTML = conteudosCurso
      .map((item, index) => {
        const icone = ICONES_CONTEUDO[item.tipo] || "fa-file";
        const editavel = item.tipo === "texto" || (item.tipo === "quiz" && Array.isArray(item.perguntas));
        const nome = String(item.nome || "Sem título");
        const titulo =
          item.tipo === "link" && urlExternaValida(nome)
            ? `<a href="${esc(nome)}" target="_blank" rel="noopener noreferrer">${esc(nome)}</a>`
            : `<strong>${esc(nome)}</strong>`;
        return `
        <div class="item-conteudo">
          <div class="info-conteudo">
            <i class="fa-solid ${icone}"></i>
            <div>
              ${titulo}
              <small>${esc(detalheConteudo(item))}</small>
            </div>
          </div>
          <div class="acoes-item-conteudo">
            ${
              editavel
                ? `<button type="button" data-editar="${index}" aria-label="Editar conteúdo"><i class="fa-solid fa-pen"></i></button>`
                : ""
            }
            <button type="button" data-remover="${index}" aria-label="Remover conteúdo"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
      })
      .join("");
  }

  function urlExternaValida(valor) {
    try {
      const url = new URL(valor);
      return /^https?:$/.test(url.protocol);
    } catch (e) {
      return false;
    }
  }

  document.querySelectorAll(".conteudo-item").forEach((card) => {
    card.addEventListener("click", () => {
      tipoAtual = card.dataset.tipo;
      if (!tipoAtual) return;

      if (tipoAtual === "link") {
        let url = (prompt("Digite a URL do link (http:// ou https://):") || "").trim();
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        if (!urlExternaValida(url)) {
          alert("Endereço inválido. Informe uma URL começando com http:// ou https://.");
          return;
        }
        conteudosCurso.push({ tipo: "link", nome: url });
        renderizarConteudos();
        salvarRascunho(true);
        return;
      }

      if (tipoAtual === "quiz" || tipoAtual === "texto") {
        if (!window.HSEditor) {
          alert("O editor de conteúdo não foi carregado. Recarregue a página e tente novamente.");
          return;
        }
        HSEditor.abrir(tipoAtual, null, (item) => {
          conteudosCurso.push(item);
          renderizarConteudos();
          salvarRascunho(true);
        });
        return;
      }

      inputConteudo?.click();
    });
  });

  listaConteudos?.addEventListener("click", (e) => {
    const remover = e.target.closest("[data-remover]");
    if (remover) {
      const index = Number(remover.dataset.remover);
      if (Number.isInteger(index) && conteudosCurso[index]) {
        conteudosCurso.splice(index, 1);
        renderizarConteudos();
        salvarRascunho(true);
      }
      return;
    }

    const editar = e.target.closest("[data-editar]");
    if (!editar) return;
    const index = Number(editar.dataset.editar);
    const item = conteudosCurso[index];
    if (!item || !window.HSEditor) return;
    HSEditor.abrir(item.tipo, item, (novo) => {
      conteudosCurso[index] = novo;
      renderizarConteudos();
      salvarRascunho(true);
    });
  });

  inputConteudo?.addEventListener("change", async () => {
    const arquivo = inputConteudo.files && inputConteudo.files[0];
    inputConteudo.value = "";
    if (!arquivo) return;
    if (tipoAtual === "video" && !String(arquivo.type || "").startsWith("video/")) {
      alert("Selecione um arquivo de vídeo (MP4 ou WebM).");
      return;
    }
    if (!window.HSVideo) {
      alert("O armazenamento de arquivos não está disponível neste navegador.");
      return;
    }
    try {
      const arquivoId = await HSVideo.salvar(arquivo);
      conteudosCurso.push({
        tipo: tipoAtual,
        nome: arquivo.name,
        arquivoId,
        mime: arquivo.type,
        tamanho: arquivo.size,
      });
      renderizarConteudos();
      salvarRascunho(true);
      HS.notificar(
        "Arquivo anexado",
        `"${arquivo.name}" (${(arquivo.size / 1048576).toFixed(1)} MB) foi adicionado ao curso.`,
        "curso",
        "professor",
      );
    } catch (e) {
      alert(
        "Não foi possível salvar o arquivo neste navegador. Use um link do YouTube/Vimeo para vídeos muito grandes.",
      );
    }
  });

  function montarCurso(status) {
    const certificado = document.querySelector(
      'input[name="certificado"]:checked'
    );

    return {
      nome: nomeCurso.value.trim(),
      subtitulo: subtituloCurso.value.trim(),
      categoria: areaCurso.value,
      publico: publicoCurso.value.trim(),
      cargaHoraria: `${Number(cargaHoraria.value)} horas`,
      nivel: categoriaCurso.value,
      descricao: descricaoCurso.value.trim(),
      conteudos: conteudosCurso,
      certificado: certificado ? certificado.value : "",
      checklist: [...document.querySelectorAll(".req-nivel")].map(
        (req) => req.checked
      ),
      preco: lerPreco(),
      professor: usuarioAtual.nome || "Professor(a)",
      imagem: imagemBase64 || IMG_PADRAO,
      status,
      dataCriacao: new Date().toISOString()
    };
  }

  /* ---------- Publicação integrada ao MySQL ---------- */

  async function salvarCursoAPI(status) {
    let imagemUrlAtual = cursoEditando?.imagem_url || null;

    const arquivoLocal = conteudosCurso.find(
      (item) => item.arquivoId && !item.arquivo_url
    );

    if (arquivoLocal) {
      throw new Error(
        `O arquivo "${arquivoLocal.nome}" ainda não está enviado ao servidor.`
      );
    }

    // Enviar imagem nova para o servidor.
    if (arquivoImagem) {
      const formularioImagem = new FormData();

      formularioImagem.append("imagem", arquivoImagem);

      const dadosImagem = await API.request(
        "/cursos/imagem",
        {
          method: "POST",
          body: formularioImagem
        }
      );

      imagemUrlAtual = dadosImagem.imagem_url;
    }

    const curso = montarCurso(status);

    const dadosAPI = {
      nome_curso: curso.nome,
      subtitulo: curso.subtitulo,
      descricao: curso.descricao,
      area_tematica: curso.categoria,
      publico_alvo: curso.publico,
      carga_horaria: Number(cargaHoraria.value),
      nivel: curso.nivel,
      certificado: curso.certificado,
      checklist: curso.checklist,
      imagem_url: imagemUrlAtual,
      preco: curso.preco,
      status
    };

    const idExistente = cursoEditando?.id_curso;

    let resposta;

    if (idExistente) {
      resposta = await API.put(
        `/cursos/${idExistente}`,
        dadosAPI
      );
    } else {
      resposta = await API.post(
        "/cursos",
        dadosAPI
      );
    }

    const idCurso = idExistente || resposta.id_curso;

    if (!idCurso) {
      throw new Error("A API não retornou o ID do curso.");
    }

    // Depois de salvar o curso, persistir seus conteúdos.
    await sincronizarConteudos(idCurso);

    return resposta;
  }


async function sincronizarConteudos(idCurso) {
  // Recupera os módulos que já existem.
  const modulos = await API.get(
    `/professor/cursos/${idCurso}/conteudos`
  );

  let modulo = modulos?.[0] || null;

  // O editor atual trabalha com uma lista única de conteúdos.
  // Por isso, vamos utilizar um módulo chamado Conteúdos do curso.
  if (!modulo) {
    const criado = await API.post(
      `/cursos/${idCurso}/modulos`,
      {
        titulo: "Conteúdos do curso",
        ordem: 1
      }
    );

    modulo = {
      id_modulo: criado.id_modulo,
      aulas: []
    };
  } else {
    await API.put(
      `/modulos/${modulo.id_modulo}`,
      {
        titulo: "Conteúdos do curso",
        ordem: 1
      }
    );
  }

  const aulasExistentes = modulo.aulas || [];

  // Arquivos guardados somente no navegador não podem
  // ser apresentados aos alunos por meio da API.
  const arquivoLocal = conteudosCurso.find(
    (item) =>
      item.arquivoId &&
      !item.arquivo_url
  );

  if (arquivoLocal) {
    throw new Error(
      `O arquivo "${arquivoLocal.nome}" ainda precisa ser enviado ao servidor. Remova-o ou aguarde a integração do upload de arquivos.`
    );
  }

  for (let i = 0; i < conteudosCurso.length; i++) {
    const item = conteudosCurso[i];

    const dadosAula = {
      titulo: String(item.nome || "Conteúdo").trim(),
      conteudo:
        item.tipo === "texto"
          ? item.texto || ""
          : null,
      tipo: item.tipo,
      arquivo_url:
        item.tipo === "link"
          ? item.nome
          : item.arquivo_url || null,
      metadados:
        item.tipo === "quiz"
          ? {
              perguntas: item.perguntas || [],
              notaMinima: item.notaMinima || 70
            }
          : {
              arquivoId: item.arquivoId || null,
              mime: item.mime || "",
              tamanho: item.tamanho || 0
            },
      ordem: i + 1
    };

    const aulaExistente = aulasExistentes[i];

    if (aulaExistente) {
      await API.put(
        `/aulas/${aulaExistente.id_aula}`,
        dadosAula
      );
    } else {
      await API.post(
        `/modulos/${modulo.id_modulo}/aulas`,
        dadosAula
      );
    }
  }

  // Excluir aulas que foram removidas pelo professor.
  for (
    let i = conteudosCurso.length;
    i < aulasExistentes.length;
    i++
  ) {
    await API.delete(
      `/aulas/${aulasExistentes[i].id_aula}`
    );
  }
}

  function validarPublicacao() {
    const nome = nomeCurso.value.trim();
    const subtitulo = subtituloCurso.value.trim();
    const descricao = descricaoCurso.value.trim();
    const publico = publicoCurso.value.trim();
    const ch = Number(cargaHoraria.value);
    const nv = NIVEIS[categoriaCurso.value];

    if (nome.length < 3) return "Informe o nome do curso (mínimo de 3 caracteres).";
    if (!subtitulo) return "Informe o subtítulo do curso.";
    if (descricao.length < 30) return "Descreva o curso e os pré-requisitos com pelo menos 30 caracteres.";
    if (!areaCurso.value) return "Selecione a área temática.";
    if (!publico) return "Informe o público-alvo.";
    if (!Number.isFinite(ch) || ch <= 0) return "Informe uma carga horária válida.";
    if (!nv) return "Selecione o nível de certificação pretendido.";

    if (ch < nv.chMin || ch > nv.chMax) {
      const sugestao = Object.values(NIVEIS).find(
        (x) => ch >= x.chMin && ch <= x.chMax
      );

      return (
        `A carga horária de ${ch}h não se enquadra no ${nv.nome} (` +
        `${nv.chMin}h${nv.chMax >= 9999 ? " ou mais" : " a " + nv.chMax + "h"}).` +
        (sugestao ? ` Sugestão: ${sugestao.nome}.` : "")
      );
    }

    const preco = lerPreco();

    if (preco < nv.precoMin || preco > nv.precoMax) {
      return `O preço deve estar entre ${moeda(nv.precoMin)} e ${moeda(nv.precoMax)} para o ${nv.nome}.`;
    }

    if (!document.querySelector('input[name="certificado"]:checked')) {
      return "Escolha a opção de certificado.";
    }

    const reqs = [...document.querySelectorAll(".req-nivel")];

    if (!reqs.length || !reqs.every((r) => r.checked)) {
      return "Marque todos os requisitos da autoavaliação para enviar à curadoria.";
    }

    return "";
  }

  /* ---------- Publicar curso ---------- */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const erro = validarPublicacao();

    if (erro) {
      alert(erro);
      return;
    }

    const btnPublicar = form.querySelector('button[type="submit"]');

    if (btnPublicar) btnPublicar.disabled = true;

    try {
      await salvarCursoAPI("publicado");

      localStorage.removeItem("cursoEditando");
      localStorage.removeItem("rascunhoCurso");

      sessionStorage.setItem("confete", "1");

      alert("Curso publicado com sucesso!");

      window.location.href = "professor-meus-cursos.html";

    } catch (erro) {
      console.error("Erro ao publicar curso:", erro);
      alert(erro.message || "Erro ao publicar curso.");
    } finally {
      if (btnPublicar) btnPublicar.disabled = false;
    }
  });

  /* ---------- Salvar rascunho ---------- */

  btnRascunho?.addEventListener("click", async () => {
    if (!nomeCurso.value.trim()) {
      alert("Informe pelo menos o nome do curso antes de salvar o rascunho.");
      nomeCurso.focus();
      return;
    }

    btnRascunho.disabled = true;

    try {
      await salvarCursoAPI("rascunho");

      localStorage.removeItem("cursoEditando");

      alert("Rascunho salvo no banco de dados!");

      window.location.href = "professor-meus-cursos.html";

    } catch (erro) {
      console.error("Erro ao salvar rascunho:", erro);
      alert(erro.message || "Erro ao salvar rascunho.");
    } finally {
      btnRascunho.disabled = false;
    }
  });

  renderizarConteudos();
})();
