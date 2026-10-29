/* Checkout de demonstração da Habilita Saúde.
   - Abas acessíveis (cartão, Pix e boleto) sem depender do "event" global.
   - Máscaras, validação de cartão/CPF/CEP e resumo recalculado.
   - Cupom aplicável/removível, parcelas dinâmicas e confirmação simulada. */
(function () {
  "use strict";

  const form = document.getElementById("checkoutForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);

  const PRECO = 397;
  const CUPOM = { codigo: "BEMVINDO20", percentual: 0.2 };
  const PARCELAS = [12, 10, 6, 3, 2, 1];
  const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  let cupomAtivo = true;
  let metodo = "card";
  let enviando = false;

  const el = {
    paytabs: document.querySelector(".paytabs"),
    payBtn: $("payBtn"),
    payBtnText: $("payBtnText"),
    payError: $("payError"),
    cardPane: $("card-pane"),
    pixPane: $("pix-pane"),
    boletoPane: $("boleto-pane"),
    cardNumber: $("cardNumber"),
    cardName: $("cardName"),
    cardExp: $("cardExp"),
    cardCvv: $("cardCvv"),
    cardCpf: $("cardCpf"),
    cardBrand: $("cardBrand"),
    cardBrandPreview: $("cardBrandPreview"),
    prevNum: $("prevNum"),
    prevName: $("prevName"),
    prevExp: $("prevExp"),
    installSelect: $("installSelect"),
    billingName: $("billingName"),
    billingEmail: $("billingEmail"),
    billingCpf: $("billingCpf"),
    billingCep: $("billingCep"),
    subtotalVal: $("subtotalVal"),
    couponLine: $("couponLine"),
    discountVal: $("discountVal"),
    couponApplied: $("couponApplied"),
    couponForm: $("couponForm"),
    couponInput: $("couponInput"),
    couponMsg: $("couponMsg"),
    removerCupom: $("removerCupom"),
    aplicarCupom: $("aplicarCupom"),
    totalVal: $("totalVal"),
    installmentText: $("installmentText"),
    confirmacao: $("confirmacao"),
    confirmTitulo: $("confirmTitulo"),
    confirmProtocolo: $("confirmProtocolo"),
    confirmMetodo: $("confirmMetodo"),
    confirmTotal: $("confirmTotal"),
    confirmEmail: $("confirmEmail"),
    backLink: $("backLink"),
    backLinkText: $("backLinkText"),
    supportLink: $("supportLink"),
    confirmCoursesLink: $("confirmCoursesLink"),
  };

  if (!el.payBtn || !el.installSelect || !el.confirmacao) return;

  const formatar = (valor) => moeda.format(valor);
  const somenteDigitos = (valor) => String(valor || "").replace(/\D/g, "");

  function totalAtual() {
    return cupomAtivo ? PRECO * (1 - CUPOM.percentual) : PRECO;
  }

  function parcelas() {
    const total = totalAtual();
    return PARCELAS.map((n) => ({
      n,
      valor: total / n,
      texto: n === 1 ? `1x de ${formatar(total)} à vista` : `${n}x de ${formatar(total / n)} sem juros`,
    }));
  }

  function atualizarTextoParcela() {
    if (!el.installmentText) return;
    const total = totalAtual();

    if (metodo === "pix") {
      el.installmentText.textContent = `À vista no Pix: ${formatar(total)}`;
      return;
    }
    if (metodo === "boleto") {
      el.installmentText.textContent = `Boleto à vista: ${formatar(total)}`;
      return;
    }

    const opcao = el.installSelect.selectedOptions && el.installSelect.selectedOptions[0];
    const n = Number(opcao && opcao.value) || 3;
    el.installmentText.innerHTML =
      n === 1
        ? `À vista: <b id="totalInstall">${formatar(total)}</b>`
        : `Parcela em até <b id="totalInstall">${n}x de ${formatar(total / n)}</b> sem juros`;
  }

  function atualizarParcelas() {
    const atual = Number(el.installSelect.value);
    const escolhida = PARCELAS.includes(atual) ? atual : 3;
    el.installSelect.innerHTML = parcelas()
      .map(
        (p) =>
          `<option value="${p.n}" data-label="${p.texto}"${p.n === escolhida ? " selected" : ""}>${p.texto}</option>`
      )
      .join("");
    atualizarTextoParcela();
  }

  function atualizarResumo() {
    if (el.subtotalVal) el.subtotalVal.textContent = formatar(PRECO);
    if (el.discountVal) el.discountVal.textContent = "− " + formatar(PRECO * CUPOM.percentual);
    if (el.couponLine) el.couponLine.hidden = !cupomAtivo;
    if (el.couponApplied) el.couponApplied.hidden = !cupomAtivo;
    if (el.couponForm) el.couponForm.hidden = cupomAtivo;
    if (el.totalVal) el.totalVal.textContent = formatar(totalAtual());
    atualizarParcelas();
    atualizarTextoParcela();
  }

  function atualizarBotao() {
    if (!el.payBtnText) return;
    el.payBtnText.textContent =
      metodo === "pix" ? "Gerar código Pix" : metodo === "boleto" ? "Gerar boleto" : "Confirmar pagamento";
  }

  function limparErro(id) {
    const input = $(id);
    const small = $("erro-" + id);
    if (input) input.removeAttribute("aria-invalid");
    if (small) small.textContent = "";
  }

  function marcarErro(id, mensagem) {
    const input = $(id);
    const small = $("erro-" + id);
    if (input) input.setAttribute("aria-invalid", "true");
    if (small) small.textContent = mensagem;
    return input;
  }

  function limparErros() {
    [
      "cardNumber",
      "cardName",
      "cardExp",
      "cardCvv",
      "cardCpf",
      "billingName",
      "billingEmail",
      "billingCpf",
      "billingCep",
    ].forEach(limparErro);
    if (el.payError) el.payError.textContent = "";
  }

  function selecionarMetodo(novo) {
    if (!novo || !["card", "pix", "boleto"].includes(novo)) return;
    metodo = novo;

    document.querySelectorAll(".paytab").forEach((tab) => {
      const ativo = tab.dataset.pay === metodo;
      tab.classList.toggle("active", ativo);
      tab.setAttribute("aria-selected", String(ativo));
      tab.tabIndex = ativo ? 0 : -1;
    });

    if (el.cardPane) el.cardPane.hidden = metodo !== "card";
    if (el.pixPane) el.pixPane.hidden = metodo !== "pix";
    if (el.boletoPane) el.boletoPane.hidden = metodo !== "boleto";

    limparErros();
    atualizarBotao();
    atualizarTextoParcela();
  }

  /* ---------- Máscaras ---------- */
  function bandeira(numero) {
    const d = somenteDigitos(numero);
    if (/^4/.test(d)) return { nome: "Visa", preview: "VISA" };
    if (/^(5[1-5]|2[2-7])/.test(d)) return { nome: "Mastercard", preview: "MASTERCARD" };
    if (/^3[47]/.test(d)) return { nome: "Amex", preview: "AMEX" };
    if (/^(4011|4312|4389|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return { nome: "Elo", preview: "ELO" };
    return { nome: "Cartão", preview: "CARTÃO" };
  }

  function atualizarCartaoPreview() {
    const d = somenteDigitos(el.cardNumber.value).slice(0, 16);
    const preenchido = d.padEnd(16, "•");
    if (el.prevNum) el.prevNum.textContent = preenchido.replace(/(.{4})(?=.)/g, "$1 ").slice(0, 19);
    const b = bandeira(d);
    if (el.cardBrand) el.cardBrand.textContent = b.nome;
    if (el.cardBrandPreview) el.cardBrandPreview.textContent = b.preview;
  }

  function mascaraCartao(valor) {
    return somenteDigitos(valor).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  function mascaraCpf(valor) {
    return somenteDigitos(valor)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function mascaraCep(valor) {
    return somenteDigitos(valor).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  }

  /* ---------- Validações ---------- */
  function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor || "").trim());
  }

  function cpfValido(valor) {
    const d = somenteDigitos(valor);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i += 1) soma += Number(d[i]) * (10 - i);
    let digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(d[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i += 1) soma += Number(d[i]) * (11 - i);
    digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    return digito === Number(d[10]);
  }

  function luhn(valor) {
    const d = somenteDigitos(valor);
    if (d.length !== 16) return false;
    let soma = 0;
    let dobrar = false;
    for (let i = d.length - 1; i >= 0; i -= 1) {
      let n = Number(d[i]);
      if (dobrar) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      soma += n;
      dobrar = !dobrar;
    }
    return soma % 10 === 0;
  }

  function validadeValida(valor) {
    const m = /^(\d{2})\/(\d{2})$/.exec(String(valor || "").trim());
    if (!m) return false;
    const mes = Number(m[1]);
    const ano = 2000 + Number(m[2]);
    if (mes < 1 || mes > 12) return false;
    const agora = new Date();
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimValidade = new Date(ano, mes, 1);
    return fimValidade > inicioMesAtual;
  }

  function validar() {
    limparErros();
    let ok = true;

    function campo(id, condicao, mensagem) {
      if (condicao) {
        limparErro(id);
        return true;
      }
      marcarErro(id, mensagem);
      return false;
    }

    if (!campo("billingName", el.billingName.value.trim().length >= 3, "Informe seu nome completo.")) ok = false;
    if (!campo("billingEmail", emailValido(el.billingEmail.value), "Informe um e-mail válido.")) ok = false;
    if (!campo("billingCpf", cpfValido(el.billingCpf.value), "Informe um CPF válido.")) ok = false;
    if (!campo("billingCep", somenteDigitos(el.billingCep.value).length === 8, "Informe um CEP com 8 dígitos.")) ok = false;

    if (metodo === "card") {
      const numero = somenteDigitos(el.cardNumber.value);
      if (
        !campo(
          "cardNumber",
          numero.length === 16 && luhn(numero),
          numero.length === 16 ? "Número de cartão inválido. Confira os dígitos." : "Informe os 16 dígitos do cartão."
        )
      ) {
        ok = false;
      }
      if (!campo("cardName", el.cardName.value.trim().length >= 3, "Informe o nome impresso no cartão.")) ok = false;
      if (!campo("cardExp", validadeValida(el.cardExp.value), "Informe uma validade futura no formato MM/AA.")) ok = false;
      if (!campo("cardCvv", /^\d{3,4}$/.test(el.cardCvv.value), "Informe o CVV com 3 ou 4 dígitos.")) ok = false;
      if (!campo("cardCpf", cpfValido(el.cardCpf.value), "Informe o CPF do titular.")) ok = false;
    }

    if (!ok) {
      const invalidos = Array.from(form.querySelectorAll('[aria-invalid="true"]'));
      if (el.payError) {
        el.payError.textContent =
          invalidos.length === 1
            ? "Revise o campo destacado antes de continuar."
            : "Revise os campos destacados antes de continuar.";
      }
      if (invalidos[0]) invalidos[0].focus();
      return false;
    }

    if (el.payError) el.payError.textContent = "";
    return true;
  }

  /* ---------- Cupom ---------- */
  function mensagemCupom(texto, ok) {
    if (!el.couponMsg) return;
    el.couponMsg.textContent = texto;
    el.couponMsg.className = "coupon-msg" + (ok ? " ok" : "");
  }

  function aplicarCupom() {
    if (!el.couponInput) return;
    const codigo = el.couponInput.value.trim().toUpperCase();
    if (!codigo) {
      mensagemCupom("Digite um código de cupom.", false);
      el.couponInput.focus();
      return;
    }
    if (codigo !== CUPOM.codigo) {
      mensagemCupom("Cupom inválido. Tente BEMVINDO20.", false);
      el.couponInput.select();
      return;
    }
    cupomAtivo = true;
    el.couponInput.value = "";
    mensagemCupom("Cupom aplicado: 20% de desconto.", true);
    atualizarResumo();
  }

  if (el.removerCupom) {
    el.removerCupom.addEventListener("click", () => {
      cupomAtivo = false;
      if (el.couponMsg) {
        el.couponMsg.textContent = "";
        el.couponMsg.className = "coupon-msg";
      }
      atualizarResumo();
      if (el.couponInput) {
        el.couponInput.value = "";
        el.couponInput.focus();
      }
    });
  }

  if (el.aplicarCupom) el.aplicarCupom.addEventListener("click", aplicarCupom);
  if (el.couponInput) {
    el.couponInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        aplicarCupom();
      }
    });
  }

  /* ---------- Abas ---------- */
  if (el.paytabs) {
    el.paytabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".paytab");
      if (tab) selecionarMetodo(tab.dataset.pay);
    });

    el.paytabs.addEventListener("keydown", (e) => {
      const tabs = Array.from(el.paytabs.querySelectorAll(".paytab"));
      const atual = tabs.indexOf(document.activeElement);
      if (atual < 0) return;

      let destino = null;
      if (e.key === "ArrowRight") destino = (atual + 1) % tabs.length;
      else if (e.key === "ArrowLeft") destino = (atual - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") destino = 0;
      else if (e.key === "End") destino = tabs.length - 1;

      if (destino === null) return;
      e.preventDefault();
      tabs[destino].focus();
      selecionarMetodo(tabs[destino].dataset.pay);
    });
  }

  /* ---------- Eventos dos campos ---------- */
  el.cardNumber.addEventListener("input", () => {
    el.cardNumber.value = mascaraCartao(el.cardNumber.value);
    atualizarCartaoPreview();
  });

  el.cardName.addEventListener("input", () => {
    if (el.prevName) el.prevName.textContent = el.cardName.value.trim().toUpperCase() || "NOME NO CARTÃO";
  });

  el.cardExp.addEventListener("input", () => {
    let d = somenteDigitos(el.cardExp.value).slice(0, 4);
    if (d.length > 2) d = d.slice(0, 2) + "/" + d.slice(2);
    el.cardExp.value = d;
    if (el.prevExp) el.prevExp.textContent = d || "••/••";
  });

  el.cardCvv.addEventListener("input", () => {
    el.cardCvv.value = somenteDigitos(el.cardCvv.value).slice(0, 4);
  });

  el.cardCpf.addEventListener("input", () => {
    el.cardCpf.value = mascaraCpf(el.cardCpf.value);
  });

  el.billingCpf.addEventListener("input", () => {
    el.billingCpf.value = mascaraCpf(el.billingCpf.value);
  });

  el.billingCep.addEventListener("input", () => {
    el.billingCep.value = mascaraCep(el.billingCep.value);
  });

  el.installSelect.addEventListener("change", atualizarTextoParcela);

  form.addEventListener("input", (e) => {
    if (e.target && e.target.id) limparErro(e.target.id);
    if (el.payError) el.payError.textContent = "";
  });

  /* ---------- Envio ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (enviando) return;
    if (!validar()) return;

    const metodoUsado = metodo;
    const totalUsado = totalAtual();
    const emailUsado = el.billingEmail.value.trim();
    enviando = true;
    el.payBtn.disabled = true;
    if (el.payBtnText) el.payBtnText.textContent = "Processando…";

    window.setTimeout(() => {
      enviando = false;
      el.payBtn.disabled = false;
      atualizarBotao();
      mostrarConfirmacao(metodoUsado, totalUsado, emailUsado);
    }, 900);
  });

  function mostrarConfirmacao(metodoUsado, totalUsado, emailUsado) {
    const titulos = {
      card: "Pagamento confirmado!",
      pix: "Código Pix gerado!",
      boleto: "Boleto gerado!",
    };
    const textos = {
      card: "Pagamento simulado com sucesso. Nesta demonstração, o acesso ao curso já está liberado.",
      pix: "Código Pix simulado gerado. Em um checkout real, o acesso seria liberado após a confirmação do banco.",
      boleto: "Boleto simulado gerado. Em um checkout real, o acesso seria liberado após a compensação bancária.",
    };
    const nomes = { card: "Cartão de crédito", pix: "Pix", boleto: "Boleto bancário" };

    if (el.confirmProtocolo) {
      el.confirmProtocolo.textContent = "HS-" + Date.now().toString(36).toUpperCase();
    }
    if (el.confirmTitulo) el.confirmTitulo.textContent = titulos[metodoUsado] || titulos.card;
    const texto = $("confirmTexto");
    if (texto) texto.textContent = textos[metodoUsado] || textos.card;
    if (el.confirmMetodo) el.confirmMetodo.textContent = nomes[metodoUsado] || nomes.card;
    if (el.confirmTotal) el.confirmTotal.textContent = formatar(totalUsado);
    if (el.confirmEmail) el.confirmEmail.textContent = emailUsado || "—";

    form.hidden = true;
    el.confirmacao.hidden = false;

    const passos = Array.from(document.querySelectorAll(".steps .step"));
    if (passos[1]) {
      passos[1].classList.remove("active");
      passos[1].classList.add("done");
      const n = passos[1].querySelector(".n");
      if (n) n.textContent = "✓";
      passos[1].removeAttribute("aria-current");
    }
    if (passos[2]) {
      passos[2].classList.add("active");
      passos[2].setAttribute("aria-current", "step");
    }

    document.title = "Pedido confirmado — Habilita Saúde";
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (el.confirmTitulo) el.confirmTitulo.focus({ preventScroll: true });
  }

  /* ---------- Copiar códigos ---------- */
  function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = texto;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      try {
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        ok ? resolve() : reject(new Error("copy"));
      } catch (erro) {
        document.body.removeChild(area);
        reject(erro);
      }
    });
  }

  document.querySelectorAll("[data-copy-target]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const alvo = $(botao.dataset.copyTarget);
      if (!alvo) return;
      const original = botao.textContent;
      copiarTexto(alvo.textContent.trim())
        .then(() => {
          botao.textContent = "Copiado!";
        })
        .catch(() => {
          botao.textContent = "Não foi possível copiar";
        })
        .finally(() => {
          window.setTimeout(() => {
            botao.textContent = original;
          }, 1800);
        });
    });
  });

  /* ---------- QR Code ilustrativo ---------- */
  function gerarQrDemo() {
    const alvo = $("qrCode");
    if (!alvo) return;

    const tamanho = 25;
    const modulos = Array.from({ length: tamanho }, () => Array(tamanho).fill(false));
    let semente = 20261028;
    const aleatorio = () => {
      semente = (semente * 1664525 + 1013904223) >>> 0;
      return semente / 4294967296;
    };

    function reservar(x, y) {
      for (let i = 0; i < 8; i += 1) {
        for (let j = 0; j < 8; j += 1) {
          if (modulos[y + j] && modulos[y + j][x + i] !== undefined) modulos[y + j][x + i] = false;
        }
      }
    }

    function desenharMarcador(x, y) {
      for (let i = 0; i < 7; i += 1) {
        for (let j = 0; j < 7; j += 1) {
          const borda = i === 0 || i === 6 || j === 0 || j === 6;
          const centro = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          if (borda || centro) modulos[y + j][x + i] = true;
        }
      }
    }

    reservar(0, 0);
    reservar(tamanho - 8, 0);
    reservar(0, tamanho - 8);
    desenharMarcador(1, 1);
    desenharMarcador(tamanho - 7, 1);
    desenharMarcador(1, tamanho - 7);

    for (let y = 0; y < tamanho; y += 1) {
      for (let x = 0; x < tamanho; x += 1) {
        const pertoDeMarcador =
          (x < 9 && y < 9) || (x >= tamanho - 9 && y < 9) || (x < 9 && y >= tamanho - 9);
        if (!pertoDeMarcador) modulos[y][x] = aleatorio() > 0.52;
      }
    }

    let retangulos = "";
    modulos.forEach((linha, y) => {
      linha.forEach((ativo, x) => {
        if (ativo) retangulos += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      });
    });

    alvo.innerHTML =
      `<svg viewBox="-2 -2 ${tamanho + 4} ${tamanho + 4}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" focusable="false" aria-hidden="true">` +
      `<rect x="-2" y="-2" width="${tamanho + 4}" height="${tamanho + 4}" fill="#fff"/>` +
      `<g fill="#0b1220">${retangulos}</g></svg>`;
  }

  function gerarBarcodeDemo() {
    const alvo = $("barcode");
    if (!alvo) return;
    let semente = 34191;
    let barras = "";
    for (let i = 0; i < 72; i += 1) {
      semente = (semente * 1103515245 + 12345) >>> 0;
      const largura = 1 + (semente % 4);
      barras += `<span style="width:${largura}px"></span>`;
    }
    alvo.innerHTML = barras;
  }

  /* ---------- Preenchimento inicial e links por perfil ---------- */
  function lerUsuario() {
    try {
      if (localStorage.getItem("usuarioLogado") !== "true") return null;
      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      return usuario && ["aluno", "professor"].includes(usuario.tipo) ? usuario : null;
    } catch (e) {
      return null;
    }
  }

  function configurarLinks(usuario) {
    const professor = usuario && usuario.tipo === "professor";
    const cursos = professor ? "./professor-meus-cursos.html" : "./aluno-meus-cursos.html";

    if (el.backLink) el.backLink.href = usuario ? cursos : "./index.html";
    if (el.backLinkText) {
      el.backLinkText.textContent = usuario ? "Voltar aos meus cursos" : "Voltar ao início";
    }
    if (el.supportLink) {
      el.supportLink.href = usuario ? (professor ? "./professor-suporte.html" : "./aluno-suporte.html") : "./login.html";
    }
    if (el.confirmCoursesLink) {
      el.confirmCoursesLink.href = usuario ? cursos : "./login.html?perfil=aluno";
      el.confirmCoursesLink.textContent = usuario ? "Ir para meus cursos" : "Entrar para acessar meus cursos";
    }
  }

  const usuario = lerUsuario();
  if (usuario) {
    if (el.billingName && !el.billingName.value) el.billingName.value = usuario.nome || "";
    if (el.billingEmail && !el.billingEmail.value) el.billingEmail.value = usuario.email || "";
  }
  configurarLinks(usuario);

  atualizarCartaoPreview();
  atualizarResumo();
  selecionarMetodo("card");
  gerarQrDemo();
  gerarBarcodeDemo();
})();
