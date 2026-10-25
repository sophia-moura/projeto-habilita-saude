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

  const u = ls("usuario", {}) || {};
  const meus = ls("cursosAluno_v2", []);

  // Sem ?id= na URL: retoma o curso com conteúdo acessado por último.
  let id = Number(new URLSearchParams(location.search).get("id"));
  if (!id) {
    const retomar = meus
      .filter((c) => HS.conteudosDoCurso(c.id).length)
      .sort((a, b) => String(b.ultimoAcesso || "").localeCompare(String(a.ultimoAcesso || "")))[0];
    if (!retomar) return void location.replace("aluno-meus-cursos.html");
    return void location.replace("aula.html?id=" + retomar.id);
  }
  const meu = meus.find((c) => c.id === id);

  // Curso inexistente ou sem matrícula: volta para a lista.
  if (!meu) return void location.replace("aluno-meus-cursos.html");

  $("tituloCurso").textContent = meu.nome;
  const migalhaAtual = document.querySelector(".breadcrumb .atual");
  if (migalhaAtual) migalhaAtual.textContent = meu.nome;
  document.title = meu.nome + " — Habilita Saúde";
  $("subtituloCurso").textContent = [meu.professor, meu.cargaHoraria ? meu.cargaHoraria + "h" : ""].filter(Boolean).join(" · ");

  const itens = HS.conteudosDoCurso(id);

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
    texto: ["Lição", "fa-file-lines"],
  };
  const tipoDe = (it) => TIPOS[it.tipo] || ["Conteúdo", "fa-file"];

  const chave = `aulas_${u.email}_${id}`;
  const salvas = localStorage.getItem(chave);
  const feitas = new Set(ls(chave, []).filter((i) => Number.isInteger(i) && i >= 0 && i < itens.length));
  // Curso de exemplo que já vem com progresso: marca os primeiros conteúdos como concluídos.
  if (salvas === null && meu.progresso > 0) {
    const n = meu.progresso >= 100 ? itens.length : Math.floor((meu.progresso / 100) * itens.length);
    for (let k = 0; k < n; k++) feitas.add(k);
  }
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
    const exigeQuiz = ehQuiz(itens[atual]) && !feita;
    const b = $("btnConcluir");
    b.disabled = feita || exigeQuiz;
    b.classList.toggle("feita", feita);
    b.querySelector("span").textContent = feita ? "Concluída" : exigeQuiz ? "Responda o quiz para concluir" : "Marcar como concluída";
    b.querySelector("i").className = "fa-solid fa-check";
    $("btnAnterior").disabled = atual === 0;
    $("btnProxima").disabled = atual === itens.length - 1;
  }

  /* ---------- Palco ---------- */
  function mensagem(palco, icone, texto, link) {
    palco.innerHTML = `<div class="palco-msg"><i class="fa-solid ${icone}"></i><p>${esc(texto)}</p>${link || ""}</div>`;
  }

  /* ---------- Lição em texto e quiz ---------- */
  const ehQuiz = (it) => it.tipo === "quiz" && Array.isArray(it.perguntas) && it.perguntas.length > 0;
  const ehLeitura = (it) => it.tipo === "texto" || ehQuiz(it);

  // Texto simples: parágrafos, "## subtítulo", listas com "- " e **negrito**.
  function formatarTexto(t) {
    const inline = (l) => esc(l).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return String(t ?? "")
      .split(/\n{2,}/)
      .map((bloco) => {
        const linhas = bloco.split("\n").filter((l) => l.trim());
        if (!linhas.length) return "";
        if (linhas.every((l) => /^-\s+/.test(l))) return "<ul>" + linhas.map((l) => `<li>${inline(l.replace(/^-\s+/, ""))}</li>`).join("") + "</ul>";
        return linhas
          .map((l) => (/^##\s+/.test(l) ? `<h3>${inline(l.replace(/^##\s+/, ""))}</h3>` : `<p>${inline(l)}</p>`))
          .join("");
      })
      .join("");
  }

  function renderTexto(it, palco) {
    const d = document.createElement("article");
    d.className = "licao";
    d.innerHTML = formatarTexto(it.texto) || "<p>Esta lição ainda não tem conteúdo.</p>";
    palco.appendChild(d);
  }

  function renderQuiz(it, i, palco) {
    const perguntas = it.perguntas;
    const nota = Math.min(100, Math.max(1, Number(it.notaMinima) || 70));
    const chaveQ = `quiz_${u.email}_${id}_${i}`;
    const estado = ls(chaveQ, { tentativas: 0, melhor: null });
    const raiz = document.createElement("div");
    raiz.className = "quiz";
    palco.appendChild(raiz);

    function formulario() {
      const melhor = estado.melhor === null ? "" : ` · Melhor resultado: ${estado.melhor}%`;
      raiz.innerHTML = `
        <p class="quiz-resumo">${perguntas.length} ${perguntas.length === 1 ? "pergunta" : "perguntas"} · Nota mínima: ${nota}%${melhor}</p>
        <form class="quiz-form" novalidate>
          ${perguntas
            .map(
              (p, n) => `<fieldset class="quiz-pergunta">
                <legend>${n + 1}. ${esc(p.enunciado)}</legend>
                ${p.opcoes
                  .map((o, k) => `<label class="quiz-opcao"><input type="radio" name="q${n}" value="${k}" /><span>${esc(o)}</span></label>`)
                  .join("")}
              </fieldset>`,
            )
            .join("")}
          <p class="quiz-erro" role="alert" hidden></p>
          <button type="submit" class="btn btn-primary">Enviar respostas</button>
        </form>`;
      raiz.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const respostas = perguntas.map((_, n) => {
          const el = raiz.querySelector(`input[name="q${n}"]:checked`);
          return el ? Number(el.value) : null;
        });
        if (respostas.includes(null)) {
          const erro = raiz.querySelector(".quiz-erro");
          erro.hidden = false;
          erro.textContent = "Responda todas as perguntas antes de enviar.";
          return;
        }
        resultado(respostas);
      });
    }

    function resultado(respostas) {
      const acertos = respostas.filter((r, n) => r === perguntas[n].correta).length;
      const pct = Math.round((acertos / perguntas.length) * 100);
      const aprovado = pct >= nota;
      estado.tentativas++;
      estado.melhor = Math.max(estado.melhor ?? 0, pct);
      localStorage.setItem(chaveQ, JSON.stringify(estado));

      raiz.innerHTML = `
        <div class="quiz-resultado ${aprovado ? "aprovado" : "reprovado"}" role="status">
          <strong>${aprovado ? "Aprovado" : "Ainda não foi desta vez"}</strong>
          <span>Você acertou ${acertos} de ${perguntas.length} (${pct}%). Nota mínima: ${nota}%.</span>
        </div>
        <ol class="quiz-revisao">
          ${perguntas
            .map((p, n) => {
              const certa = respostas[n] === p.correta;
              // Só mostra o gabarito e a explicação a quem foi aprovado.
              const detalhe = aprovado
                ? `<small>Resposta correta: ${esc(p.opcoes[p.correta])}${p.explicacao ? ". " + esc(p.explicacao) : ""}</small>`
                : "";
              return `<li class="${certa ? "certa" : "errada"}"><span>${esc(p.enunciado)}</span><b>${certa ? "Correta" : "Revisar"}</b>${detalhe}</li>`;
            })
            .join("")}
        </ol>
        <div class="quiz-acoes">
          <button type="button" class="btn btn-secondary" data-refazer>${aprovado ? "Refazer quiz" : "Tentar novamente"}</button>
        </div>`;
      raiz.querySelector("[data-refazer]").addEventListener("click", formulario);

      if (aprovado) {
        const jaFeita = feitas.has(i);
        concluir(i, false);
        if (!jaFeita && pct === 100) HS.gam.xp(10, "Quiz sem erros");
      }
    }

    formulario();
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
    palco.classList.toggle("palco--leitura", ehLeitura(it));
    lista();
    botoes();

    // Marca o curso como iniciado e atualiza o "último acesso".
    meu.ultimoAcesso = new Date().toISOString();
    if (meu.status === "nao-iniciado") meu.status = "andamento";
    salvarCurso();

    if (it.tipo === "texto") {
      renderTexto(it, palco);
    } else if (ehQuiz(it)) {
      renderQuiz(it, i, palco);
    } else if (it.arquivoId) {
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
