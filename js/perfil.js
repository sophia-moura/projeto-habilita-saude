(function () {
  const ler = (chave, padrao) => {
    try {
      return JSON.parse(localStorage.getItem(chave)) ?? padrao;
    } catch (e) {
      return padrao;
    }
  };

  const salvar = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));

  const usuario = ler("usuario", {}) || {};
  const preview = document.getElementById("previewFoto");
  const inputFoto = document.getElementById("novaFoto");
  const campoNome = document.getElementById("nomeUsuario");
  const campoEmail = document.getElementById("emailUsuario");
  const botao = document.getElementById("salvarPerfil");

  if (!preview || !inputFoto || !campoNome || !campoEmail || !botao) return;

  const FOTO_PADRAO = "./img/perfil.svg";
  const avatar = (nome) =>
    typeof window.HSAvatar === "function" ? window.HSAvatar(nome) : FOTO_PADRAO;
  const fotoInicial = usuario.foto || avatar(usuario.nome);

  campoNome.value = usuario.nome || "";
  campoEmail.value = usuario.email || "";
  preview.src = fotoInicial;
  preview.onerror = () => {
    preview.onerror = null;
    preview.src = FOTO_PADRAO;
  };

  let fotoBase64 = "";

  function mostrarMensagem(texto, erro) {
    let aviso = document.getElementById("avisoPerfil");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.id = "avisoPerfil";
      aviso.setAttribute("role", "status");
      aviso.setAttribute("aria-live", "polite");
      botao.insertAdjacentElement("afterend", aviso);
    }
    aviso.textContent = texto;
    aviso.style.cssText =
      "margin-top:12px;font-size:14px;font-weight:600;color:" + (erro ? "#c53030" : "#3e9c2d");
  }

  inputFoto.addEventListener("change", (e) => {
    const arquivo = e.target.files && e.target.files[0];
    if (!arquivo) return;

    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(arquivo.type)) {
      mostrarMensagem("Escolha uma imagem PNG, JPG, WEBP ou GIF.", true);
      inputFoto.value = "";
      return;
    }
    if (arquivo.size > 3 * 1024 * 1024) {
      mostrarMensagem("A foto deve ter no máximo 3 MB.", true);
      inputFoto.value = "";
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      fotoBase64 = String(leitor.result || "");
      preview.src = fotoBase64;
      mostrarMensagem("Foto selecionada. Clique em “Salvar alterações”.", false);
    };
    leitor.onerror = () => mostrarMensagem("Não foi possível ler a imagem escolhida.", true);
    leitor.readAsDataURL(arquivo);
  });

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function sincronizarCadastro(emailAntigo, novoNome, novoEmail, novaFoto) {
    const lista = ler("usuarios", []);
    if (!Array.isArray(lista)) return;
    const registro = lista.find(
      (u) => String(u.email || "").toLowerCase() === emailAntigo && u.tipo === usuario.tipo,
    );
    if (registro) {
      registro.nome = novoNome;
      registro.email = novoEmail;
      if (novaFoto) registro.foto = novaFoto;
      salvar("usuarios", lista);
    }
  }

  function sincronizarDadosRelacionados(emailAntigo, novoNome, novoEmail, novaFoto) {
    const matriculas = ler("matriculas", []);
    if (Array.isArray(matriculas)) {
      let mudou = false;
      matriculas.forEach((m) => {
        if (String(m.email || "").toLowerCase() !== emailAntigo) return;
        m.email = novoEmail;
        m.nome = novoNome;
        if (novaFoto) m.foto = novaFoto;
        mudou = true;
      });
      if (mudou) salvar("matriculas", matriculas);
    }

    const certificados = ler("certificados", []);
    if (Array.isArray(certificados)) {
      let mudou = false;
      certificados.forEach((c) => {
        if (String(c.email || "").toLowerCase() !== emailAntigo) return;
        c.email = novoEmail;
        c.aluno = novoNome;
        mudou = true;
      });
      if (mudou) salvar("certificados", certificados);
    }

    if (emailAntigo && emailAntigo !== novoEmail) {
      ["boasVindas_", "gam_", "gamprof_"].forEach((prefixo) => {
        const chaveAntiga = `${prefixo}${emailAntigo}`;
        if (!localStorage.getItem(chaveAntiga)) return;
        localStorage.setItem(`${prefixo}${novoEmail}`, localStorage.getItem(chaveAntiga));
        localStorage.removeItem(chaveAntiga);
      });
    }
  }

  botao.addEventListener("click", () => {
    const nome = campoNome.value.trim().replace(/\s+/g, " ");
    const email = campoEmail.value.trim().toLowerCase();

    if (nome.length < 2) {
      mostrarMensagem("Informe seu nome completo.", true);
      campoNome.focus();
      return;
    }
    if (!emailValido(email)) {
      mostrarMensagem("Informe um e-mail válido.", true);
      campoEmail.focus();
      return;
    }

    const lista = ler("usuarios", []);
    const emailAntigo = String(usuario.email || "").toLowerCase();
    if (
      Array.isArray(lista) &&
      lista.some(
        (u) =>
          String(u.email || "").toLowerCase() === email &&
          String(u.email || "").toLowerCase() !== emailAntigo,
      )
    ) {
      mostrarMensagem("Este e-mail já está em uso por outra conta.", true);
      campoEmail.focus();
      return;
    }

    const finalizar = (foto) => {
      usuario.nome = nome;
      usuario.email = email;
      if (foto) usuario.foto = foto;
      salvar("usuario", usuario);

      try {
        sincronizarCadastro(emailAntigo, nome, email, foto);
        sincronizarDadosRelacionados(emailAntigo, nome, email, foto);
      } catch (e) {
        console.warn("Não foi possível sincronizar todos os dados do perfil.", e);
      }

      mostrarMensagem("Perfil atualizado com sucesso!", false);
      setTimeout(() => location.reload(), 650);
    };

    botao.disabled = true;
    botao.textContent = "Salvando...";

    if (fotoBase64) {
      finalizar(fotoBase64);
    } else {
      finalizar("");
    }
  });
})();
