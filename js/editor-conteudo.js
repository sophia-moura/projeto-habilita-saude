/*
  Editor de conteúdos criados dentro da plataforma (sem arquivo):
  - quiz: perguntas de múltipla escolha com nota mínima
  - texto: lição escrita
  Uso: HSEditor.abrir("quiz" | "texto", itemExistenteOuNull, (item) => { ... })
*/
window.HSEditor = (function () {
  const MAX_OPCOES = 4;
  let contadorNomes = 0;
  let raiz = null;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function fechar() {
    if (raiz) raiz.remove();
    raiz = null;
    document.removeEventListener("keydown", aoTeclar);
  }

  function aoTeclar(e) {
    if (e.key === "Escape") fechar();
  }

  function base(titulo) {
    fechar();
    raiz = el(`
      <div class="editor-overlay">
        <div class="editor-modal" role="dialog" aria-modal="true" aria-label="${titulo}">
          <header class="editor-topo">
            <h2>${titulo}</h2>
            <button type="button" class="editor-fechar" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
          </header>
          <div class="editor-corpo"></div>
          <p class="editor-erro" role="alert" hidden></p>
          <footer class="editor-rodape">
            <button type="button" class="btn btn-secondary" data-cancelar>Cancelar</button>
            <button type="button" class="btn btn-primary" data-salvar>Salvar conteúdo</button>
          </footer>
        </div>
      </div>`);
    raiz.querySelector(".editor-fechar").addEventListener("click", fechar);
    raiz.querySelector("[data-cancelar]").addEventListener("click", fechar);
    raiz.addEventListener("mousedown", (e) => {
      if (e.target === raiz) fechar();
    });
    document.addEventListener("keydown", aoTeclar);
    document.body.appendChild(raiz);
    return {
      corpo: raiz.querySelector(".editor-corpo"),
      erro(msg) {
        const p = raiz.querySelector(".editor-erro");
        p.hidden = !msg;
        p.textContent = msg || "";
      },
      aoSalvar(fn) {
        raiz.querySelector("[data-salvar]").addEventListener("click", fn);
      },
    };
  }

  /* ---------- Lição em texto ---------- */
  function abrirTexto(item, salvar) {
    const ed = base(item ? "Editar lição em texto" : "Nova lição em texto");
    ed.corpo.innerHTML = `
      <label class="editor-campo">Título da lição
        <input type="text" data-titulo maxlength="120" placeholder="Ex.: Avaliação inicial do paciente" />
      </label>
      <label class="editor-campo">Texto
        <textarea data-texto rows="12" placeholder="Escreva o conteúdo da lição"></textarea>
      </label>
      <p class="editor-dica">Formatação: deixe uma linha em branco entre parágrafos, use <code>## Subtítulo</code>, listas com <code>- item</code> e <code>**negrito**</code>.</p>`;
    ed.corpo.querySelector("[data-titulo]").value = item?.nome || "";
    ed.corpo.querySelector("[data-texto]").value = item?.texto || "";
    ed.corpo.querySelector("[data-titulo]").focus();

    ed.aoSalvar(() => {
      const nome = ed.corpo.querySelector("[data-titulo]").value.trim();
      const texto = ed.corpo.querySelector("[data-texto]").value.trim();
      if (!nome) return ed.erro("Informe o título da lição.");
      if (!texto) return ed.erro("Escreva o texto da lição.");
      salvar({ tipo: "texto", nome, texto });
      fechar();
    });
  }

  /* ---------- Quiz ---------- */
  function blocoPergunta(numero, dados) {
    const nome = "correta-" + ++contadorNomes;
    const b = el(`
      <fieldset class="editor-pergunta">
        <div class="editor-pergunta-topo">
          <strong data-numero></strong>
          <button type="button" class="btn btn-tertiary" data-remover>Remover</button>
        </div>
        <label class="editor-campo">Enunciado
          <textarea data-enunciado rows="2" placeholder="Digite a pergunta"></textarea>
        </label>
        <p class="editor-dica">Preencha as alternativas e marque a correta. Alternativas em branco são ignoradas.</p>
        ${Array.from({ length: MAX_OPCOES }, (_, k) => `
          <div class="editor-opcao">
            <input type="radio" name="${nome}" value="${k}" aria-label="Marcar alternativa ${k + 1} como correta" />
            <input type="text" data-opcao maxlength="200" placeholder="Alternativa ${String.fromCharCode(65 + k)}" />
          </div>`).join("")}
        <label class="editor-campo">Explicação da resposta (opcional)
          <input type="text" data-explicacao maxlength="300" placeholder="Aparece para o aluno após a aprovação" />
        </label>
      </fieldset>`);
    b.querySelector("[data-numero]").textContent = "Pergunta " + numero;
    if (dados) {
      b.querySelector("[data-enunciado]").value = dados.enunciado || "";
      b.querySelectorAll("[data-opcao]").forEach((inp, k) => (inp.value = dados.opcoes?.[k] || ""));
      const radio = b.querySelector(`input[type="radio"][value="${dados.correta}"]`);
      if (radio) radio.checked = true;
      b.querySelector("[data-explicacao]").value = dados.explicacao || "";
    }
    return b;
  }

  function abrirQuiz(item, salvar) {
    const ed = base(item ? "Editar quiz" : "Novo quiz");
    ed.corpo.innerHTML = `
      <div class="editor-linha">
        <label class="editor-campo editor-grande">Título do quiz
          <input type="text" data-titulo maxlength="120" placeholder="Ex.: Quiz: avaliação inicial" />
        </label>
        <label class="editor-campo editor-pequeno">Nota mínima (%)
          <input type="number" data-nota min="1" max="100" value="70" />
        </label>
      </div>
      <div data-perguntas></div>
      <button type="button" class="btn btn-secondary" data-adicionar><i class="fa-solid fa-plus"></i> Adicionar pergunta</button>`;
    const lista = ed.corpo.querySelector("[data-perguntas]");

    const renumerar = () => {
      lista.querySelectorAll(".editor-pergunta").forEach((b, n) => {
        b.querySelector("[data-numero]").textContent = "Pergunta " + (n + 1);
        b.querySelector("[data-remover]").hidden = lista.children.length === 1;
      });
    };
    const adicionar = (dados) => {
      const b = blocoPergunta(lista.children.length + 1, dados);
      b.querySelector("[data-remover]").addEventListener("click", () => {
        b.remove();
        renumerar();
      });
      lista.appendChild(b);
      renumerar();
      return b;
    };

    ed.corpo.querySelector("[data-titulo]").value = item?.nome || "";
    ed.corpo.querySelector("[data-nota]").value = item?.notaMinima || 70;
    if (item?.perguntas?.length) item.perguntas.forEach(adicionar);
    else adicionar();
    ed.corpo.querySelector("[data-adicionar]").addEventListener("click", () => {
      const b = adicionar();
      b.scrollIntoView({ block: "nearest", behavior: "smooth" });
      b.querySelector("[data-enunciado]").focus();
    });

    ed.aoSalvar(() => {
      const nome = ed.corpo.querySelector("[data-titulo]").value.trim();
      const nota = Number(ed.corpo.querySelector("[data-nota]").value);
      if (!nome) return ed.erro("Informe o título do quiz.");
      if (!Number.isFinite(nota) || nota < 1 || nota > 100) return ed.erro("A nota mínima deve estar entre 1 e 100.");

      const perguntas = [];
      const blocos = [...lista.querySelectorAll(".editor-pergunta")];
      for (let n = 0; n < blocos.length; n++) {
        const b = blocos[n];
        const enunciado = b.querySelector("[data-enunciado]").value.trim();
        const marcada = b.querySelector('input[type="radio"]:checked');
        const preenchidas = [...b.querySelectorAll("[data-opcao]")]
          .map((inp, k) => ({ texto: inp.value.trim(), k }))
          .filter((o) => o.texto);

        if (!enunciado) return ed.erro(`Pergunta ${n + 1}: digite o enunciado.`);
        if (preenchidas.length < 2) return ed.erro(`Pergunta ${n + 1}: informe pelo menos duas alternativas.`);
        if (!marcada) return ed.erro(`Pergunta ${n + 1}: marque a alternativa correta.`);
        const correta = preenchidas.findIndex((o) => o.k === Number(marcada.value));
        if (correta < 0) return ed.erro(`Pergunta ${n + 1}: a alternativa marcada como correta está em branco.`);

        perguntas.push({
          enunciado,
          opcoes: preenchidas.map((o) => o.texto),
          correta,
          explicacao: b.querySelector("[data-explicacao]").value.trim(),
        });
      }
      salvar({ tipo: "quiz", nome, notaMinima: nota, perguntas });
      fechar();
    });
    ed.corpo.querySelector("[data-titulo]").focus();
  }

  return {
    abrir(tipo, item, salvar) {
      if (tipo === "quiz") abrirQuiz(item, salvar);
      else if (tipo === "texto") abrirTexto(item, salvar);
    },
  };
})();
