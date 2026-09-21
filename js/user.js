const usuario = JSON.parse(localStorage.getItem("usuario"));

if (usuario) {
  const nomeSidebar = document.getElementById("nomeUsuarioSidebar");
  const nomeTop = document.getElementById("nomeUsuarioTop");
  const fotoSidebar = document.getElementById("fotoUsuarioSidebar");
  const fotoTop = document.getElementById("fotoUsuarioTop");

  const nomeCompleto = usuario.nome || "";

  const nomeCurto = nomeCompleto.split(" ").slice(0, 2).join(" ");

  if (nomeSidebar) nomeSidebar.textContent = nomeCurto;

  if (nomeTop) nomeTop.textContent = nomeCurto;

  if (fotoSidebar) fotoSidebar.src = usuario.foto;
  if (fotoTop) fotoTop.src = usuario.foto;
}

