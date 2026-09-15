let conteudosCurso = [];

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

const cursoEditando = JSON.parse(localStorage.getItem("cursoEditando"));

if (cursoEditando?.conteudos) {
  conteudosCurso = [...cursoEditando.conteudos];
}

// ========================
// CARREGAR CURSO EM EDIÇÃO
// ========================

if (cursoEditando) {
  nomeCurso.value = cursoEditando.nome || "";

  subtituloCurso.value = cursoEditando.subtitulo || "";

  descricaoCurso.value = cursoEditando.descricao || "";

  areaCurso.value = cursoEditando.categoria || "";

  publicoCurso.value = cursoEditando.publico || "";

  cargaHoraria.value = cursoEditando.cargaHoraria || "";

  categoriaCurso.value = cursoEditando.nivel || "";

  precoCurso.value = cursoEditando.preco || "";

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

// ========================
// UPLOAD DE IMAGEM
// ========================

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

// ========================
// DRAG AND DROP
// ========================

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

// ========================
// AUTO RASCUNHO
// ========================

form.addEventListener("input", () => {
  const rascunho = {
    nome: nomeCurso.value,
    subtitulo: subtituloCurso.value,
    descricao: descricaoCurso.value,
    area: areaCurso.value,
    publico: publicoCurso.value,
    cargaHoraria: `${cargaHoraria.value} horas`,
    categoria: categoriaCurso.value,
    preco: precoCurso.value,
  };

  localStorage.setItem("rascunhoCurso", JSON.stringify(rascunho));
});

// ========================
// CARREGAR RASCUNHO
// ========================

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

// ========================
// PUBLICAR CURSO
// ========================

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (Number(precoCurso.value) < 0) {
    alert("O valor não pode ser negativo.");
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

    preco: Number(
      precoCurso.value
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim(),
    ),

    imagem: imagemBase64 || "img/curso-padrao.jpg",

    alunos: cursoEditando?.alunos || 0,

    vendas: cursoEditando?.vendas || 0,

    avaliacao: cursoEditando?.avaliacao || 5,

    status: "Publicado",

    dataCriacao: cursoEditando?.dataCriacao || new Date().toISOString(),
  };

  if (cursoEditando) {
    const index = cursos.findIndex((c) => c.id === cursoEditando.id);

    cursos[index] = novoCurso;
  } else {
    cursos.push(novoCurso);
  }

  localStorage.setItem("cursos", JSON.stringify(cursos));

  localStorage.removeItem("cursoEditando");

  localStorage.removeItem("rascunhoCurso");

  criarNotificacao(
    "Novo Curso Criado",
    `O curso "${nomeCurso.value}" foi publicado com sucesso.`,
    "curso",
  );
  window.location.href = "meus-cursos.html";
});

// ========================
// SALVAR RASCUNHO
// ========================

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

      preco: Number(precoCurso.value) || 0,

      imagem: imagemBase64 || "img/curso-padrao.jpg",

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
