
(function () {
  // Avatar padrão com as iniciais do usuário.
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

  async function carregarDadosUsuario() {
    try {
      // Aguarda a inicialização da API central.
      if (!window.API) return;

      const resposta = await window.API.get("/usuario-logado");
      const usuario = resposta?.usuario;

      if (!usuario) return;

      const avatar = usuario.tipo === "professor"
        ? "./img/professor.png"
        : window.HSAvatar(usuario.nome);

      const nomeCurto = (usuario.nome || "")
        .split(" ")
        .slice(0, 2)
        .join(" ");

      [
        "nomeUsuarioSidebar",
        "nomeUsuarioTop",
        "nomeUsuario"
      ].forEach((id) => {
        const elemento = document.getElementById(id);

        if (elemento && elemento.tagName !== "INPUT") {
          elemento.textContent = nomeCurto;
        }
      });

      const linkPerfil = document.querySelector("a.user-top");

      if (linkPerfil) {
        linkPerfil.setAttribute(
          "aria-label",
          nomeCurto
            ? `Meu perfil de ${nomeCurto}`
            : "Meu perfil"
        );
      }

      [
        "fotoUsuarioSidebar",
        "fotoUsuarioTop"
      ].forEach((id) => {
        const elemento = document.getElementById(id);

        if (!elemento) return;

        elemento.onerror = () => {
          elemento.onerror = null;
          elemento.src = avatar;
        };

        elemento.src = usuario.foto || avatar;
      });

    } catch (erro) {
      console.error("Erro ao carregar dados do usuário:", erro);
    }
  }

  // O global.js deve ser carregado antes deste arquivo.
  carregarDadosUsuario();
})();
