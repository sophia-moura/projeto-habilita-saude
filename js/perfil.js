(async function () {
  let usuario = {};

  try {
      const dados = await API.get("/usuario-logado");

      if (!dados || !dados.autenticado || !dados.usuario) {
          window.location.href = "login.html";
          return;
      }

      usuario = dados.usuario;
  } catch (erro) {
      window.location.href = "login.html";
      return;
  }
  
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

  let arquivoFoto = null;

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

    arquivoFoto = arquivo;
    preview.src = URL.createObjectURL(arquivo);
    mostrarMensagem("Foto selecionada. Clique em “Salvar alterações”.", false);
  });

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function sincronizarDadosRelacionados(emailAntigo, novoNome, novoEmail, novaFoto) {
    const lerLocal = (chave) => {
        try {
            return JSON.parse(localStorage.getItem(chave)) || [];
        } catch {
            return [];
        }
    };

    const salvarLocal = (chave, dados) => {
        localStorage.setItem(chave, JSON.stringify(dados));
    };

    const matriculas = lerLocal("matriculas");

    if (Array.isArray(matriculas)) {
        let mudou = false;

        matriculas.forEach((m) => {
            if (String(m.email || "").toLowerCase() !== emailAntigo) return;

            m.email = novoEmail;
            m.nome = novoNome;

            if (novaFoto) m.foto = novaFoto;

            mudou = true;
        });

        if (mudou) salvarLocal("matriculas", matriculas);
    }

    const certificados = lerLocal("certificados");

    if (Array.isArray(certificados)) {
        let mudou = false;

        certificados.forEach((c) => {
            if (String(c.email || "").toLowerCase() !== emailAntigo) return;

            c.email = novoEmail;
            c.aluno = novoNome;

            mudou = true;
        });

        if (mudou) salvarLocal("certificados", certificados);
    }

    if (emailAntigo && emailAntigo !== novoEmail) {
        ["boasVindas_", "gam_", "gamprof_"].forEach((prefixo) => {
            const chaveAntiga = `${prefixo}${emailAntigo}`;
            const valor = localStorage.getItem(chaveAntiga);

            if (valor === null) return;

            localStorage.setItem(`${prefixo}${novoEmail}`, valor);
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

    const emailAntigo = String(usuario.email || "").toLowerCase();

    botao.disabled = true;
    botao.textContent = "Salvando...";

    (async () => {
        try {
            // Atualiza nome e e-mail no banco de dados
            const dadosPerfil = await API.put("/perfil", {
                nome,
                email
            });

            usuario = dadosPerfil.usuario;

            // Se uma nova foto foi selecionada, envia para o servidor
            if (arquivoFoto) {
                const formulario = new FormData();
                formulario.append("foto", arquivoFoto);

                try {
                    const dadosFoto = await API.request("/perfil/foto", {
                        method: "POST",
                        body: formulario
                    });

                    usuario.foto = dadosFoto.foto;
                } catch (erroFoto) {
                    mostrarMensagem(
                        "Nome e e-mail atualizados, mas houve um erro ao salvar a foto: " + erroFoto.message,
                        true
                    );

                    botao.disabled = false;
                    botao.textContent = "Salvar alterações";
                    return;
                }
            }

            // Mantém os dados locais relacionados sincronizados
            sincronizarDadosRelacionados(
                emailAntigo,
                nome,
                email,
                usuario.foto || ""
            );

            mostrarMensagem("Perfil atualizado com sucesso!", false);

            setTimeout(() => location.reload(), 650);

        } catch (erro) {
            mostrarMensagem(
                erro.message || "Não foi possível atualizar o perfil.",
                true
            );

            botao.disabled = false;
            botao.textContent = "Salvar alterações";
        }
    })();
  });
})();
