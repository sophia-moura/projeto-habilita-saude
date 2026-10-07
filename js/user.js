(function () {
  const u = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!u) return;
  const avatar = "https://ui-avatars.com/api/?background=163b97&color=fff&name=" + encodeURIComponent(u.nome || "U");
  const curto = (u.nome || "").split(" ").slice(0, 2).join(" ");
  ["nomeUsuarioSidebar", "nomeUsuarioTop", "nomeUsuario"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.tagName !== "INPUT") el.textContent = curto;
  });
  ["fotoUsuarioSidebar", "fotoUsuarioTop"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.onerror = () => { el.onerror = null; el.src = avatar; };
    el.src = u.foto || avatar;
  });
})();
