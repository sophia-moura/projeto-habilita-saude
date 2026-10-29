(function () {
  // Avatar local com iniciais (SVG em data URI): funciona offline e sem serviços externos.
  window.HSAvatar = function (nome) {
    const iniciais = String(nome || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => (parte.match(/[\p{L}\p{N}]/u) || ["U"])[0])
      .join("")
      .toUpperCase();
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">' +
      '<rect width="128" height="128" rx="64" fill="#0055c3"/>' +
      '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" ' +
      'font-size="52" font-weight="700" fill="#ffffff">' +
      (iniciais || "U") +
      "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };

  const u = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!u) return;
  const avatar = window.HSAvatar(u.nome);
  const curto = (u.nome || "").split(" ").slice(0, 2).join(" ");
  ["nomeUsuarioSidebar", "nomeUsuarioTop", "nomeUsuario"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.tagName !== "INPUT") el.textContent = curto;
  });
  const linkPerfil = document.querySelector("a.user-top");
  if (linkPerfil) {
    linkPerfil.setAttribute("aria-label", curto ? `Meu perfil de ${curto}` : "Meu perfil");
  }
  ["fotoUsuarioSidebar", "fotoUsuarioTop"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.onerror = () => { el.onerror = null; el.src = "./img/perfil.svg"; };
    el.src = u.foto || avatar;
  });
})();
