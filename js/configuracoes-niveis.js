/* Configurações dos níveis de certificação.
   - Valida cada parâmetro antes de salvar (faixas e coerência mín./máx.).
   - Mostra os erros no próprio campo, com foco no primeiro problema.
   - Mantém trilha e nome dos níveis ao gravar. */
(function () {
  "use strict";

  const CAMPOS = [
    { chave: "chMin", rotulo: "Carga horária mínima", unidade: "h", min: 1, max: 9999, step: 1, dica: "Horas de conteúdo" },
    { chave: "chMax", rotulo: "Carga horária máxima", unidade: "h", min: 1, max: 9999, step: 1, dica: "Limite para o nível" },
    { chave: "precoMin", rotulo: "Preço mínimo", unidade: "R$", min: 0, max: 100000, step: 0.01, dica: "Valor de venda" },
    { chave: "precoMax", rotulo: "Preço máximo", unidade: "R$", min: 0, max: 100000, step: 0.01, dica: "Valor de venda" },
    { chave: "docente", rotulo: "Repasse ao professor", unidade: "%", min: 0, max: 100, step: 1, dica: "Percentual do valor" },
    { chave: "aprovacao", rotulo: "Aprovação do aluno", unidade: "%", min: 0, max: 100, step: 1, dica: "Mínimo para concluir" },
    { chave: "notaMin", rotulo: "Nota mínima da curadoria", unidade: "/10", min: 0, max: 10, step: 0.1, dica: "De 0 a 10" },
    { chave: "prazo", rotulo: "Prazo da curadoria", unidade: "dias", min: 1, max: 365, step: 1, dica: "Dias úteis" },
  ];

  const form = document.getElementById("formNiveis");
  const status = document.getElementById("statusNiveis");
  const btnSalvar = document.getElementById("salvarNiveis");
  const btnRestaurar = document.getElementById("restaurarNiveis");
  if (!form || !status || !btnSalvar || !btnRestaurar) return;

  const esc = (t) => (window.HS && HS.esc ? HS.esc(t) : String(t ?? ""));

  function niveisAtuais() {
    if (window.HS && typeof HS.niveis === "function") return HS.niveis();
    return {};
  }

  function limparStatus() {
    status.textContent = "";
    status.className = "config-status";
  }

  function mostrarStatus(texto, tipo) {
    status.textContent = texto;
    status.className = "config-status " + (tipo || "");
  }

  function idErro(nivel, campo) {
    return `erro-${nivel}-${campo}`;
  }

  function montar() {
    const cfg = niveisAtuais();
    const niveis = Object.keys(cfg);
    if (!niveis.length) {
      form.innerHTML = '<p class="config-vazio">Não foi possível carregar os níveis de certificação.</p>';
      return;
    }

    const cabecalho = niveis
      .map((k) => `<th scope="col">${esc(cfg[k].nome || k)}</th>`)
      .join("");

    const linhas = CAMPOS.map((c) => {
      const celulas = niveis
        .map((k) => {
          const valor = cfg[k][c.chave];
          const numero = Number.isFinite(Number(valor)) ? Number(valor) : "";
          const erroId = idErro(k, c.chave);
          return `<td>
            <div class="campo-nivel">
              <input
                type="number"
                inputmode="decimal"
                data-k="${esc(k)}"
                data-c="${esc(c.chave)}"
                id="campo-${esc(k)}-${esc(c.chave)}"
                value="${numero}"
                min="${c.min}"
                max="${c.max}"
                step="${c.step}"
                aria-label="${esc(c.rotulo)} — ${esc(cfg[k].nome || k)}"
                aria-describedby="${erroId}"
              />
              <span class="unidade" aria-hidden="true">${esc(c.unidade)}</span>
            </div>
            <small class="erro-campo" id="${erroId}" aria-live="polite"></small>
          </td>`;
        })
        .join("");

      return `<tr>
        <th scope="row">
          <span class="rotulo-campo">${esc(c.rotulo)}</span>
          <small class="dica-campo">${esc(c.dica)}</small>
        </th>
        ${celulas}
      </tr>`;
    }).join("");

    form.innerHTML = `<table class="tabela-niveis">
      <caption class="sr-only">Parâmetros de carga horária, preço, repasse e curadoria por nível de certificação</caption>
      <thead><tr><th scope="col">Parâmetro</th>${cabecalho}</tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
  }

  function coletar() {
    const cfg = {};
    const base = niveisAtuais();

    form.querySelectorAll("input[data-k][data-c]").forEach((input) => {
      const nivel = input.dataset.k;
      const campo = input.dataset.c;
      if (!cfg[nivel]) cfg[nivel] = { ...(base[nivel] || {}) };
      cfg[nivel][campo] = input.value.trim();
    });

    return cfg;
  }

  function limparErro(input) {
    input.removeAttribute("aria-invalid");
    input.classList.remove("campo-invalido");
    const alvo = document.getElementById(input.getAttribute("aria-describedby") || "");
    if (alvo) alvo.textContent = "";
  }

  function marcarErro(input, mensagem) {
    input.setAttribute("aria-invalid", "true");
    input.classList.add("campo-invalido");
    const alvo = document.getElementById(input.getAttribute("aria-describedby") || "");
    if (alvo) alvo.textContent = mensagem;
  }

  function limparErros() {
    form.querySelectorAll("input[data-k][data-c]").forEach(limparErro);
  }

  function validar(cfg) {
    limparErros();
    const erros = [];
    const niveis = Object.keys(cfg);

    niveis.forEach((nivel) => {
      CAMPOS.forEach((c) => {
        const input = document.getElementById(`campo-${nivel}-${c.chave}`);
        if (!input) return;
        const bruto = cfg[nivel][c.chave];
        const valor = Number(bruto);

        if (bruto === "" || !Number.isFinite(valor)) {
          erros.push({ input, mensagem: "Informe um número válido." });
          return;
        }
        if (valor < c.min || valor > c.max) {
          erros.push({
            input,
            mensagem: `Use um valor entre ${c.min} e ${c.max}.`,
          });
        }
      });

      const chMin = Number(cfg[nivel].chMin);
      const chMax = Number(cfg[nivel].chMax);
      if (Number.isFinite(chMin) && Number.isFinite(chMax) && chMax < chMin) {
        const input = document.getElementById(`campo-${nivel}-chMax`);
        erros.push({ input, mensagem: "A carga máxima deve ser maior ou igual à mínima." });
      }

      const precoMin = Number(cfg[nivel].precoMin);
      const precoMax = Number(cfg[nivel].precoMax);
      if (Number.isFinite(precoMin) && Number.isFinite(precoMax) && precoMax < precoMin) {
        const input = document.getElementById(`campo-${nivel}-precoMax`);
        erros.push({ input, mensagem: "O preço máximo deve ser maior ou igual ao mínimo." });
      }
    });

    // Evita repetir o mesmo campo quando há mais de um problema.
    const vistos = new Set();
    erros.forEach((erro) => {
      if (!erro.input || vistos.has(erro.input)) return;
      vistos.add(erro.input);
      marcarErro(erro.input, erro.mensagem);
    });

    return erros;
  }

  form.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-k][data-c]");
    if (!input) return;
    limparErro(input);
    if (status.classList.contains("erro")) limparStatus();
  });

  btnSalvar.addEventListener("click", () => {
    const cfg = coletar();
    const erros = validar(cfg);

    if (erros.length) {
      const invalidos = new Set(erros.map((erro) => erro.input).filter(Boolean));
      mostrarStatus(`Revise ${invalidos.size === 1 ? "o campo destacado" : "os campos destacados"} antes de salvar.`, "erro");
      const primeiro = form.querySelector('[aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      return;
    }

    const numerico = {};
    Object.keys(cfg).forEach((nivel) => {
      numerico[nivel] = { ...cfg[nivel] };
      CAMPOS.forEach((c) => {
        numerico[nivel][c.chave] = Number(cfg[nivel][c.chave]);
      });
    });

    if (window.HS && typeof HS.salvarNiveis === "function") {
      HS.salvarNiveis(numerico);
      mostrarStatus("Parâmetros atualizados com sucesso.", "sucesso");
      montar();
    } else {
      mostrarStatus("Não foi possível salvar. Recarregue a página e tente novamente.", "erro");
    }
  });

  btnRestaurar.addEventListener("click", () => {
    if (!confirm("Restaurar os valores originais do documento? As alterações salvas serão perdidas.")) return;
    if (window.HS && typeof HS.restaurarNiveis === "function") HS.restaurarNiveis();
    montar();
    mostrarStatus("Valores padrão restaurados.", "sucesso");
  });

  montar();
})();
