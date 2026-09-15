// ======================================
// NOTIFICAÇÕES
// ======================================

function atualizarSino() {
  const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const badge = document.getElementById("badgeNotificacao");

  if (badge) {
    badge.textContent = naoLidas;

    badge.style.display = naoLidas > 0 ? "flex" : "none";
  }
}

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

  atualizarSino();
}

atualizarSino();

// ======================================
// LOGOUT
// ======================================

const btnLogout = document.getElementById("btnLogout");

if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    const confirmar = confirm("Deseja realmente sair da plataforma?");

    if (!confirmar) return;

    localStorage.removeItem("usuarioLogado");

    window.location.href = "index.html";
  });
}

// ======================================
// VERIFICAÇÃO DE LOGIN
// ======================================

const paginasPublicas = ["index.html", "login.html"];

const paginaAtual = window.location.pathname.split("/").pop();

const logado = localStorage.getItem("usuarioLogado");

if (!paginasPublicas.includes(paginaAtual) && logado !== "true") {
  window.location.href = "index.html";
}

const menuMobile = document.getElementById("menuMobile");

const sidebar = document.querySelector(".sidebar");

const overlay = document.getElementById("overlay");

if (menuMobile) {
  menuMobile.addEventListener("click", () => {
    sidebar.classList.toggle("ativa");

    overlay.classList.toggle("ativo");
  });
}

if (overlay) {
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("ativa");

    overlay.classList.remove("ativo");
  });
}
