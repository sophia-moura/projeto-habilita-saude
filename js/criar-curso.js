let conteudosCurso = [];

const IMG_PADRAO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="#163b97"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="22" text-anchor="middle">Habilita Saúde</text></svg>');
const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "{}");

function lerPreco() {
  return Number(precoCurso.value.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
}

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

let imagemBase64 = "";

const NIVEIS = HS.niveis();
categoriaCurso.innerHTML = '<option value="">Selecione o nível</option>' +
  Object.entries(NIVEIS).map(([k, n], i) => `<option value="${k}">Nível ${i + 1} — ${n.trilha} (${n.nome.replace("Nível ", "")})</option>`).join("");

function moeda(v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function renderNivel() {
  const k = categoriaCurso.value;
  const info = document.getElementById("infoNivel");
  const lista = document.getElementById("checklistNivel");
  if (!k) { info.innerHTML = ""; lista.innerHTML = ""; return; }
  const n = NIVEIS[k];
  const ch = n.chMax >= 9999 ? `${n.chMin}h ou mais` : `${n.chMin} a ${n.chMax}h`;
  info.innerHTML = `<b>${n.nome}</b><br>Carga horária: ${ch} · Preço: ${moeda(n.precoMin)} a ${moeda(n.precoMax)}<br>Repasse: ${n.docente}% professor / ${100 - n.docente}% portal · Curadoria em até ${n.prazo} dias úteis`;
  lista.innerHTML = "<b>Autoavaliação — marque o que seu curso cumpre:</b>" +
    HS.requisitos(k).map((r, i) => `<label style="display:block;margin-top:6px"><input type="checkbox" class="req-nivel" data-i="${i}"> ${r}</label>`).join("");
}
categoriaCurso.addEventListener("change", renderNivel);

const cursoEditando = JSON.parse(localStorage.getItem("cursoEditando"));

if (cursoEditando?.conteudos) {
  conteudosCurso = [...cursoEditando.conteudos];
}

if (cursoEditando) {
  nomeCurso.value = cursoEditando.nome || "";

  subtituloCurso.value = cursoEditando.subtitulo || "";

  descricaoCurso.value = cursoEditando.descricao || "";

  areaCurso.value = cursoEditando.categoria || "";

  publicoCurso.value = cursoEditando.publico || "";

  cargaHoraria.value = parseInt(cursoEditando.cargaHoraria) || "";

  categoriaCurso.value = cursoEditando.nivel || "";
  renderNivel();

  precoCurso.value = Number(cursoEditando.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  imagemBase64 = cursoEditando.imagem || "";

  if (imagemBase64) {
    previewImagem.src = imagemBase64;

    previewImagem.style.display = "block";

    const icone = uploadBox.querySelector("i");

    const texto = uploadBox.querySelector("p");

    const descricao = uploadBox.querySelector("small");

    if (icone) icone.style.display = "none";
    if (texto) texto.style.display = "none";
    if (descricao) descricao.style.display = "none";
  }
}

uploadBox.addEventListener("click", () => {
  inputImagem.click();
});

inputImagem.addEventListener("change", carregarImagem);

function carregarImagem(e) {
  const arquivo = e.target.files[0];

  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = () => {
    imagemBase64 = leitor.result;

    previewImagem.src = imagemBase64;

    previewImagem.style.display = "block";

    const icone = uploadBox.querySelector("i");

    const texto = uploadBox.querySelector("p");

    const descricao = uploadBox.querySelector("small");

    if (icone) icone.style.display = "none";
    if (texto) texto.style.display = "none";
    if (descricao) descricao.style.display = "none";
  };

  leitor.readAsDataURL(arquivo);
}

uploadBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadBox.classList.add("dragging");
});

uploadBox.addEventListener("dragleave", () => {
  uploadBox.classList.remove("dragging");
});

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault();

  uploadBox.classList.remove("dragging");

  const arquivo = e.dataTransfer.files[0];

  if (!arquivo) return;

  inputImagem.files = e.dataTransfer.files;

  carregarImagem({
    target: {
      files: [arquivo],
    },
  });
});

function criarNotificacao(titulo, descricao, tipo) {
  const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

  notificacoes.unshift({
    id: Date.now(),
    titulo,
    descricao,
    tipo,
    lida: false,
    data: new Date().toLocaleString("pt-BR"),
  });

  localStorage.setItem("notificacoes", JSON.stringify(notificacoes));
}

form.addEventListener("input", () => {
  const rascunho = {
    nome: nomeCurso.value,
    subtitulo: subtituloCurso.value,
    descricao: descricaoCurso.value,
    area: areaCurso.value,
    publico: publicoCurso.value,
    cargaHoraria: cargaHoraria.value,
    categoria: categoriaCurso.value,
    preco: precoCurso.value,
  };

  localStorage.setItem("rascunhoCurso", JSON.stringify(rascunho));
});

if (!cursoEditando) {
  const rascunho = JSON.parse(localStorage.getItem("rascunhoCurso"));

  if (rascunho) {
    nomeCurso.value = rascunho.nome || "";

    subtituloCurso.value = rascunho.subtitulo || "";

    descricaoCurso.value = rascunho.descricao || "";

    areaCurso.value = rascunho.area || "";

    publicoCurso.value = rascunho.publico || "";

    cargaHoraria.value = rascunho.cargaHoraria || "";

    categoriaCurso.value = rascunho.categoria || "";

    precoCurso.value = rascunho.preco || "";
  }
}

precoCurso.addEventListener("input", (e) => {
  let valor = e.target.value.replace(/\D/g, "");

  valor = (Number(valor) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  e.target.value = valor;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nv = NIVEIS[categoriaCurso.value];
  const ch = Number(cargaHoraria.value);
  const reqs = [...document.querySelectorAll(".req-nivel")];
  if (ch < nv.chMin || ch > nv.chMax) {
    const sug = Object.entries(NIVEIS).find(([, x]) => ch >= x.chMin && ch <= x.chMax);
    alert(`A carga horária de ${ch}h não se enquadra no ${nv.nome} (${nv.chMin}h${nv.chMax >= 9999 ? " ou mais" : " a " + nv.chMax + "h"}).` + (sug ? ` Sugestão: ${sug[1].nome}.` : ""));
    return;
  }
  const preco = lerPreco();
  if (preco < nv.precoMin || preco > nv.precoMax) {
    alert(`O preço deve estar entre ${moeda(nv.precoMin)} e ${moeda(nv.precoMax)} para o ${nv.nome}.`);
    return;
  }
  if (!reqs.length || !reqs.every((r) => r.checked)) {
    alert("Marque todos os requisitos da autoavaliação para enviar à curadoria.");
    return;
  }

  const cursos = JSON.parse(localStorage.getItem("cursos")) || [];

  const certificado = document.querySelector(
    'input[name="certificado"]:checked',
  );

  const novoCurso = {
    id: cursoEditando ? cursoEditando.id : Date.now(),

    nome: nomeCurso.value,

    subtitulo: subtituloCurso.value,

    categoria: areaCurso.value,

    publico: publicoCurso.value,

    cargaHoraria: `${cargaHoraria.value} horas`,

    nivel: categoriaCurso.value,

    descricao: descricaoCurso.value,

    conteudos: conteudosCurso,

    certificado: certificado ? certificado.value : "",

    preco: lerPreco(),

    professor: usuarioAtual.nome || "Professor(a)",

    imagem: imagemBase64 || IMG_PADRAO,

    alunos: cursoEditando?.alunos || 0,

    vendas: cursoEditando?.vendas || 0,

    avaliacao: cursoEditando?.avaliacao || 5,

    status: "Publicado",

    dataCriacao: cursoEditando?.dataCriacao || new Date().toISOString(),
  };

  novoCurso.curadoria = HS.curar(novoCurso, 1);
  novoCurso.status = novoCurso.curadoria.aprovado ? "Publicado" : "Em ajuste";
  novoCurso.publicadoEm = novoCurso.curadoria.aprovado ? (cursoEditando?.publicadoEm || new Date().toISOString()) : null;

  if (cursoEditando) {
    const index = cursos.findIndex((c) => c.id === cursoEditando.id);

    cursos[index] = novoCurso;
  } else {
    cursos.push(novoCurso);
  }

  localStorage.setItem("cursos", JSON.stringify(cursos));

  localStorage.removeItem("cursoEditando");

  localStorage.removeItem("rascunhoCurso");

  const cur = novoCurso.curadoria;
  if (cur.aprovado) {
    sessionStorage.setItem("confete", "1");
    HS.notificar("Curso aprovado e publicado", `"${nomeCurso.value}": ${cur.parecer}`, "curso", "professor");
    if (!cursoEditando) HS.notificar("Novo curso disponível", `"${nomeCurso.value}" já pode ser feito. Veja na página inicial.`, "curso", "aluno");
  } else {
    HS.notificar("Curadoria: ajustes necessários", `"${nomeCurso.value}": ${cur.parecer}`, "alerta", "professor");
    alert("Relatório de curadoria:\n\n" + cur.parecer + "\n\n" + cur.linhas.join("\n"));
  }
  window.location.href = "meus-cursos.html";
});

const btnRascunho = document.getElementById("btnRascunho");

if (btnRascunho) {
  btnRascunho.addEventListener("click", () => {
    const cursos = JSON.parse(localStorage.getItem("cursos")) || [];

    const cursoPrivado = {
      id: cursoEditando ? cursoEditando.id : Date.now(),

      nome: nomeCurso.value,

      subtitulo: subtituloCurso.value,

      categoria: areaCurso.value,

      publico: publicoCurso.value,

      cargaHoraria: `${cargaHoraria.value} horas`,

      nivel: categoriaCurso.value,

      descricao: descricaoCurso.value,

      conteudos: conteudosCurso,

      preco: lerPreco(),

      professor: usuarioAtual.nome || "Professor(a)",

      certificado: document.querySelector('input[name="certificado"]:checked')?.value || "",

      imagem: imagemBase64 || IMG_PADRAO,

      alunos: cursoEditando?.alunos || 0,

      vendas: cursoEditando?.vendas || 0,

      avaliacao: cursoEditando?.avaliacao || 5,

      status: "Privado",

      dataCriacao: cursoEditando?.dataCriacao || new Date().toISOString(),
    };

    if (cursoEditando) {
      const index = cursos.findIndex((c) => c.id === cursoEditando.id);

      cursos[index] = cursoPrivado;
    } else {
      cursos.push(cursoPrivado);
    }

    localStorage.setItem("cursos", JSON.stringify(cursos));

    localStorage.removeItem("cursoEditando");
    localStorage.removeItem("rascunhoCurso");

    alert("Rascunho salvo!");

    window.location.href = "meus-cursos.html";
  });
}

const cardsConteudo = document.querySelectorAll(".conteudo-item");

const inputConteudo = document.getElementById("arquivoConteudo");

let tipoAtual = "";

cardsConteudo.forEach((card) => {
  card.addEventListener("click", () => {
    tipoAtual = card.dataset.tipo;

    if (tipoAtual === "link") {
      const url = prompt("Digite a URL do link:");

      if (!url) return;

      conteudosCurso.push({
        tipo: "link",
        nome: url,
      });

      renderizarConteudos();

      return;
    }

    inputConteudo.click();
  });
});

function renderizarConteudos() {
  const lista = document.getElementById("listaConteudos");

  lista.innerHTML = "";

  conteudosCurso.forEach((item, index) => {
    let icone = "fa-file";

    if (item.tipo === "video") icone = "fa-video";

    if (item.tipo === "pdf") icone = "fa-file-pdf";

    if (item.tipo === "ebook") icone = "fa-book";

    if (item.tipo === "slide") icone = "fa-display";

    if (item.tipo === "mapa") icone = "fa-sitemap";

    if (item.tipo === "quiz") icone = "fa-circle-question";

    if (item.tipo === "caso") icone = "fa-stethoscope";

    if (item.tipo === "material") icone = "fa-folder-open";

    if (item.tipo === "link") icone = "fa-link";

    lista.innerHTML += `
      <div class="item-conteudo">

        <div class="info-conteudo">
          <i class="fa-solid ${icone}"></i>

          <div>
            ${
              item.tipo === "link"
                ? `<a href="${item.nome}" target="_blank">${item.nome}</a>`
                : `<strong>${item.nome}</strong>`
            }
            <small>${item.tipo}</small>
          </div>
        </div>

        <button
          type="button"
          onclick="removerConteudo(${index})"
        >
          <i class="fa-solid fa-trash"></i>
        </button>

      </div>
    `;
  });
}

function removerConteudo(index) {
  conteudosCurso.splice(index, 1);

  renderizarConteudos();
}

inputConteudo.addEventListener("change", async () => {
  const arq = inputConteudo.files[0];
  inputConteudo.value = "";
  if (!arq) return;
  if (tipoAtual === "video" && !arq.type.startsWith("video/")) {
    alert("Selecione um arquivo de vídeo (MP4 ou WebM).");
    return;
  }
  try {
    const arquivoId = await HSVideo.salvar(arq);
    conteudosCurso.push({ tipo: tipoAtual, nome: arq.name, arquivoId, mime: arq.type, tamanho: arq.size });
    renderizarConteudos();
    HS.notificar("Arquivo anexado", `"${arq.name}" (${(arq.size / 1048576).toFixed(1)} MB) foi adicionado ao curso.`, "curso", "professor");
  } catch (e) {
    alert("Não foi possível salvar o arquivo neste navegador. Use um link do YouTube/Vimeo para vídeos muito grandes.");
  }
});
renderizarConteudos();
