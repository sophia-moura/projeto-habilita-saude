(function () {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const u = JSON.parse(localStorage.getItem("usuario") || "{}");
  const meus = JSON.parse(localStorage.getItem("cursosAluno_v2") || "[]");
  const meu = meus.find((c) => c.id === id);
  const prof = JSON.parse(localStorage.getItem("cursos") || "[]").find((c) => c.id === id);
  if (!meu || !prof || !(prof.conteudos || []).length) return void location.replace("aluno-meus-cursos.html");

  const itens = prof.conteudos;
  const chave = `aulas_${u.email}_${id}`;
  const feitas = new Set(JSON.parse(localStorage.getItem(chave) || "[]"));
  const ICONES = { video: "🎬", pdf: "📄", ebook: "📘", slide: "📊", mapa: "🗺️", quiz: "📝", caso: "🩺", material: "📎", link: "🔗" };
  let atual = Math.max(0, itens.findIndex((_, i) => !feitas.has(i)));
  let urlObj = null;

  document.getElementById("tituloCurso").textContent = meu.nome;

  const youtube = (url) => { const m = String(url).match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); return m && m[1]; };

  function progresso() {
    const p = Math.round((feitas.size / itens.length) * 100);
    document.getElementById("barraAula").style.width = p + "%";
    document.getElementById("textoProgresso").textContent = `${feitas.size} de ${itens.length} conteúdos concluídos · ${p}%`;
    return p;
  }

  function lista() {
    document.getElementById("listaAulas").innerHTML = itens.map((it, i) =>
      `<div class="item-aula ${i === atual ? "ativa" : ""} ${feitas.has(i) ? "feita" : ""}" data-i="${i}"><span class="ck">${feitas.has(i) ? "✓" : ""}</span>${ICONES[it.tipo] || "📎"} ${it.nome}</div>`).join("");
  }

  async function abrir(i) {
    atual = i;
    const it = itens[i], palco = document.getElementById("palco");
    if (urlObj) { URL.revokeObjectURL(urlObj); urlObj = null; }
    document.getElementById("tituloAula").textContent = `${i + 1}. ${it.nome}`;
    palco.innerHTML = "";
    if (it.arquivoId) {
      const blob = await HSVideo.obter(it.arquivoId);
      if (!blob) { palco.textContent = "Arquivo não encontrado neste navegador."; }
      else {
        urlObj = URL.createObjectURL(blob);
        if ((it.mime || "").startsWith("video/")) {
          const v = document.createElement("video");
          v.src = urlObj; v.controls = true; v.controlsList = "nodownload";
          v.addEventListener("ended", () => concluir(i, true));
          palco.appendChild(v);
        } else if (it.mime === "application/pdf") {
          palco.innerHTML = `<iframe src="${urlObj}"></iframe>`;
        } else {
          palco.innerHTML = `<a href="${urlObj}" download="${it.nome}">Baixar ${it.nome}</a>`;
        }
      }
    } else if (it.tipo === "link") {
      const yt = youtube(it.nome);
      palco.innerHTML = yt
        ? `<iframe src="https://www.youtube.com/embed/${yt}" allowfullscreen></iframe>`
        : `<a href="${it.nome}" target="_blank" rel="noopener">Abrir material externo</a>`;
    } else {
      palco.innerHTML = `<div style="padding:30px">${ICONES[it.tipo] || ""} ${it.tipo === "quiz" || it.tipo === "caso" ? "Atividade avaliativa: ao finalizar, marque como concluída." : "Conteúdo complementar."}</div>`;
    }
    lista();
  }

  function concluir(i, auto) {
    if (!feitas.has(i)) {
      feitas.add(i);
      localStorage.setItem(chave, JSON.stringify([...feitas]));
      const p = progresso();
      meu.progresso = p;
      meu.ultimoAcesso = new Date().toISOString();
      meu.status = p >= 100 ? "concluido" : "andamento";
      localStorage.setItem("cursosAluno_v2", JSON.stringify(meus));
      HS.gam.xp(15, "Conteúdo concluído");
      if (p >= 100) {
        HS.gam.xp(100, "Curso concluído");
        HS.confete && HS.confete();
        HS.notificar("Certificado emitido", `Seu certificado de ${meu.nome} já está disponível.`, "certificado", "aluno");
        HS.notificar("Curso concluído", `${u.nome} concluiu "${meu.nome}".`, "curso", "professor");
      }
    }
    lista();
    if (auto && i + 1 < itens.length) setTimeout(() => abrir(i + 1), 1500);
  }

  document.getElementById("listaAulas").addEventListener("click", (e) => {
    const el = e.target.closest(".item-aula");
    if (el) abrir(Number(el.dataset.i));
  });
  document.getElementById("btnConcluir").addEventListener("click", () => concluir(atual, true));
  progresso();
  abrir(atual);
})();
