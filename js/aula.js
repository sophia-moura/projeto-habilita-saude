(function () {
  const ls = (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch (e) {
      return d;
    }
  };
  const $ = (id) => document.getElementById(id);
  const esc = (t) =>
    String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const id = Number(new URLSearchParams(location.search).get("id"));
  const u = ls("usuario", {}) || {};
  const meus = ls("cursosAluno_v2", []);
  const meu = meus.find((c) => c.id === id);
  const prof = ls("cursos", []).find((c) => c.id === id);

  // Curso inexistente ou sem matrícula: volta para a lista.
  if (!meu) return void location.replace("aluno-meus-cursos.html");

  $("tituloCurso").textContent = meu.nome;
  $("subtituloCurso").textContent = [meu.professor, meu.cargaHoraria ? meu.cargaHoraria + "h" : ""].filter(Boolean).join(" · ");

  const itens = (prof && prof.conteudos) || [];

  // Matriculado, mas o professor ainda não publicou conteúdos.
  if (!itens.length) {
    $("aulaConteudo").hidden = true;
    $("aulaVazio").hidden = false;
    return;
  }

  const TIPOS = {
    video: ["Vídeo", "fa-circle-play"],
    pdf: ["PDF", "fa-file-pdf"],
    ebook: ["E-book", "fa-book"],
    slide: ["Slides", "fa-display"],
    mapa: ["Mapa mental", "fa-sitemap"],
    quiz: ["Quiz", "fa-circle-question"],
    caso: ["Estudo de caso", "fa-stethoscope"],
    material: ["Material complementar", "fa-folder-open"],
    link: ["Link externo", "fa-link"],
  };
  const tipoDe = (it) => TIPOS[it.tipo] || ["Conteúdo", "fa-file"];

  const chave = `aulas_${u.email}_${id}`;
  const feitas = new Set(ls(chave, []).filter((i) => Number.isInteger(i) && i >= 0 && i < itens.length));
  let atual = Math.max(0, itens.findIndex((_, i) => !feitas.has(i)));
  let urlObj = null;
  let versao = 0; // descarta aberturas antigas quando o aluno troca de conteúdo rápido

  /* ---------- Utilidades ---------- */
  const urlSegura = (url) => {
    try {
      const p = new URL(url);
      return /^https?:$/.test(p.protocol) ? p.href : null;
    } catch (e) {
      return null;
    }
  };

  function incorporar(url) {
    const yt = String(url).match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  }

  function nomeExibido(it) {
    if (it.tipo !== "link") return it.nome;
    const url = urlSegura(it.nome);
    if (!url) return "Link inválido";
    return incorporar(url) ? "Vídeo online" : new URL(url).hostname.replace(/^www\./, "");
  }

  const chavePos = (i) => `aulaPos_${u.email}_${id}_${i}`;

  function salvarCurso() {
    localStorage.setItem("cursosAluno_v2", JSON.stringify(meus));
  }

  /* ---------- Progresso e lista ---------- */
  function progresso() {
    const p = Math.round((feitas.size / itens.length) * 100);
    $("barraAula").style.width = p + "%";
    $("textoProgresso").textContent = `${feitas.size} de ${itens.length} conteúdos concluídos · ${p}%`;
    $("aulaFim").hidden = p < 100;
    if (p >= 100) {
      const cert = meu.certificado !== "Sem Certificado";
      $("aulaFimLink").hidden = !cert;
      $("aulaFimLink").href = "./certificados.html?curso=" + id;
      $("aulaFimTexto").textContent = cert ? "Seu certificado já está disponível." : "Revise os conteúdos quando quiser.";
    }
    return p;
  }

  function lista() {
    $("listaAulas").innerHTML = itens
      .map((it, i) => {
        const [, icone] = tipoDe(it);
        return `<button type="button" class="item-aula ${i === atual ? "ativa" : ""} ${feitas.has(i) ? "feita" : ""}" data-i="${i}">
          <span class="ck">${feitas.has(i) ? '<i class="fa-solid fa-check"></i>' : ""}</span>
          <i class="tp fa-solid ${icone}"></i>
          <span class="nm">${esc(nomeExibido(it))}</span>
        </button>`;
      })
      .join("");
  }

  function botoes() {
    const feita = feitas.has(atual);
    const b = $("btnConcluir");
    b.disabled = feita;
    b.classList.toggle("feita", feita);
    b.querySelector("span").textContent = feita ? "Concluída" : "Marcar como concluída";
    b.querySelector("i").className = "fa-solid fa-check";
    $("btnAnterior").disabled = atual === 0;
    $("btnProxima").disabled = atual === itens.length - 1;
  }

  /* ---------- Palco ---------- */
  function mensagem(palco, icone, texto, link) {
    palco.innerHTML = `<div class="palco-msg"><i class="fa-solid ${icone}"></i><p>${esc(texto)}</p>${link || ""}</div>`;
  }

  async function abrir(i) {
    atual = i;
    const minha = ++versao;
    const it = itens[i];
    const palco = $("palco");

    if (urlObj) {
      URL.revokeObjectURL(urlObj);
      urlObj = null;
    }
    $("tituloAula").textContent = `${i + 1}. ${nomeExibido(it)}`;
    $("tipoAula").textContent = tipoDe(it)[0];
    palco.innerHTML = "";
    lista();
    botoes();

    // Marca o curso como iniciado e atualiza o "último acesso".
    meu.ultimoAcesso = new Date().toISOString();
    if (meu.status === "nao-iniciado") meu.status = "andamento";
    salvarCurso();

    if (it.arquivoId) {
      let blob = null;
      try {
        blob = await HSVideo.obter(it.arquivoId);
      } catch (e) {
        blob = null;
      }
      if (minha !== versao) return;
      if (!blob) return mensagem(palco, "fa-triangle-exclamation", "Arquivo não encontrado neste navegador. Ele foi enviado de outro computador ou navegador.");

      urlObj = URL.createObjectURL(blob);
      const mime = it.mime || blob.type || "";
      if (mime.startsWith("video/")) {
        const v = document.createElement("video");
        v.src = urlObj;
        v.controls = true;
        v.controlsList = "nodownload";
        v.preload = "metadata";
        const pos = Number(localStorage.getItem(chavePos(i))) || 0;
        v.addEventListener("loadedmetadata", () => {
          if (pos > 3 && pos < v.duration - 3) v.currentTime = pos;
        });
        let ultimo = 0;
        v.addEventListener("timeupdate", () => {
          if (v.currentTime - ultimo > 5 || v.currentTime < ultimo) {
            ultimo = v.currentTime;
            localStorage.setItem(chavePos(i), String(Math.floor(v.currentTime)));
          }
        });
        v.addEventListener("ended", () => {
          localStorage.removeItem(chavePos(i));
          concluir(i, true);
        });
        palco.appendChild(v);
      } else if (mime === "application/pdf") {
        const f = document.createElement("iframe");
        f.src = urlObj;
        f.title = it.nome;
        palco.appendChild(f);
      } else if (mime.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = urlObj;
        img.alt = it.nome;
        palco.appendChild(img);
      } else {
        mensagem(palco, tipoDe(it)[1], "Este conteúdo é um arquivo para download.");
        const a = document.createElement("a");
        a.href = urlObj;
        a.download = it.nome;
        a.textContent = "Baixar " + it.nome;
        palco.querySelector(".palco-msg").appendChild(a);
      }
    } else if (it.tipo === "link") {
      const url = urlSegura(it.nome);
      const emb = url && incorporar(url);
      if (emb) {
        const f = document.createElement("iframe");
        f.src = emb;
        f.title = "Vídeo da aula";
        f.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture";
        f.allowFullscreen = true;
        palco.appendChild(f);
      } else if (url) {
        mensagem(palco, "fa-link", "Este material está em um site externo.", `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir material externo</a>`);
      } else {
        mensagem(palco, "fa-triangle-exclamation", "O endereço deste link não é válido.");
      }
    } else {
      mensagem(
        palco,
        tipoDe(it)[1],
        it.tipo === "quiz" || it.tipo === "caso" ? "Atividade avaliativa: ao finalizar, marque como concluída." : "Conteúdo complementar.",
      );
    }
  }

  /* ---------- Conclusão ---------- */
  function concluir(i, auto) {
    if (!feitas.has(i)) {
      feitas.add(i);
      localStorage.setItem(chave, JSON.stringify([...feitas]));
      const p = progresso();
      meu.progresso = p;
      meu.ultimoAcesso = new Date().toISOString();
      meu.status = p >= 100 ? "concluido" : "andamento";
      salvarCurso();
      HS.gam.xp(15, "Conteúdo concluído");
      if (p >= 100) {
        HS.gam.xp(100, "Curso concluído");
        HS.confete && HS.confete();
        HS.notificar("Certificado emitido", `Seu certificado de ${meu.nome} já está disponível.`, "certificado", "aluno");
        HS.notificar("Curso concluído", `${u.nome} concluiu "${meu.nome}".`, "curso", "professor");
      }
    }
    lista();
    botoes();
    // Segue para o próximo conteúdo, a menos que o aluno já tenha trocado de aula.
    if (auto && atual === i && i + 1 < itens.length) {
      setTimeout(() => {
        if (atual === i) abrir(i + 1);
      }, 1200);
    }
  }

  /* ---------- Eventos ---------- */
  $("listaAulas").addEventListener("click", (e) => {
    const el = e.target.closest(".item-aula");
    if (el) abrir(Number(el.dataset.i));
  });
  $("btnConcluir").addEventListener("click", () => concluir(atual, true));
  $("btnAnterior").addEventListener("click", () => atual > 0 && abrir(atual - 1));
  $("btnProxima").addEventListener("click", () => atual < itens.length - 1 && abrir(atual + 1));

  progresso();
  abrir(atual);
})();
