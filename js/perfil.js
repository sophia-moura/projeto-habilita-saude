const usuarioPerfil = JSON.parse(localStorage.getItem("usuario")) || {};

const preview = document.getElementById("previewFoto");
const inputFoto = document.getElementById("novaFoto");

document.getElementById("nomeUsuario").value = usuarioPerfil.nome || "";

document.getElementById("emailUsuario").value = usuarioPerfil.email || "";

preview.src = usuarioPerfil.foto || "./img/perfil.jpg";

// Preview da nova foto
inputFoto.addEventListener("change", (e) => {
  const arquivo = e.target.files[0];

  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = () => {
    preview.src = leitor.result;
  };

  leitor.readAsDataURL(arquivo);
});

document.getElementById("salvarPerfil").addEventListener("click", () => {
  usuarioPerfil.nome = document.getElementById("nomeUsuario").value;

  usuarioPerfil.email = document.getElementById("emailUsuario").value;

  const arquivo = inputFoto.files[0];

  // Se escolheu nova foto
  if (arquivo) {
    const leitor = new FileReader();

    leitor.onload = () => {
      usuarioPerfil.foto = leitor.result;

      localStorage.setItem("usuario", JSON.stringify(usuarioPerfil));

      alert("Perfil atualizado!");
      location.reload();
    };

    leitor.readAsDataURL(arquivo);
  } else {
    // Salva apenas nome e email
    localStorage.setItem("usuario", JSON.stringify(usuarioPerfil));

    alert("Perfil atualizado!");
    location.reload();
  }
});
