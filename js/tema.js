/* ==========================================================================
   Habilita Saúde — Tema claro / escuro

   Como funciona
   - Carregue este arquivo no <head> (sem defer), DEPOIS do css/dark.css.
     Assim o tema é aplicado antes da primeira pintura e a página não "pisca".
   - O tema fica no atributo  <html data-theme="dark|light">  e o css/dark.css
     reage a ele.
   - A escolha da pessoa é salva no banco de dados pela API.
     Se ela nunca escolheu, seguimos a preferência do sistema.
   - O botão é criado aqui mesmo: não precisa escrever HTML em cada página.
   ========================================================================== */
(function () {
  "use strict";

  // true  = quem nunca clicou no botão vê o tema do sistema operacional.
  // false = quem nunca clicou no botão sempre começa no tema claro.
  const SEGUIR_SISTEMA = true;

  const raiz = document.documentElement;
  const consultaSistema = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  
  /* ---------- Leitura / gravação ---------- */

  let temaSalvo = null;

  function lerSalvo() {
    return temaSalvo;
  }

  function temaAtual() {
    return raiz.getAttribute("data-theme") || temaInicial();
  }

  async function gravar(tema) {
    try {
      await window.HS.ready;

      if (!window.API || !window.HS.usuario) {
        return;
      }

      await API.put("/preferencias/tema", { tema });

      temaSalvo = tema;

    } catch (erro) {
      console.error("Não foi possível salvar o tema:", erro);
    }
  }

  function temaInicial() {
    return SEGUIR_SISTEMA && consultaSistema && consultaSistema.matches
      ? "dark"
      : "light";
  }

  /* ---------- Logo: suporte global a todas as páginas ---------- */
  const LOGO_ESCURO = "/img/logo-claro.png";

  function trocarLogo(elemento, tema) {
    if (!elemento) return;

    // Não altera logos impressas em certificados.
    if (elemento.closest(".papel, .papel-logo")) return;

    // Caso 1: logo utilizada como imagem de fundo em .logo-wrap
    if (elemento.classList.contains("logo-wrap")) {
      const original = elemento.getAttribute("data-logo-original-m");

      if (tema === "dark") {
        if (!original) {
          const valorOriginal = elemento.style.getPropertyValue("--m");

          if (!valorOriginal) return;

          elemento.setAttribute("data-logo-original-m", valorOriginal);
        }

        elemento.style.setProperty(
          "--m",
          `url("${LOGO_ESCURO}")`
        );

      } else if (original !== null) {
        elemento.style.setProperty("--m", original);
        elemento.removeAttribute("data-logo-original-m");
      }

      return;
    }

    // Caso 2: logo utilizada diretamente em uma tag <img>
    if (elemento.tagName === "IMG") {
      const original = elemento.getAttribute("data-logo-original");

      if (tema === "dark") {
        const src = elemento.getAttribute("src") || "";

        if (!original && /logo-habilita\.png(?:\?.*)?$/i.test(src)) {
          elemento.setAttribute("data-logo-original", src);
          elemento.setAttribute("src", LOGO_ESCURO);
        }

      } else if (original !== null) {
        elemento.setAttribute("src", original);
        elemento.removeAttribute("data-logo-original");
      }
    }
  }

  function trocarTodosLogos(tema) {
    document.querySelectorAll(".logo-wrap, img").forEach((elemento) => {
      trocarLogo(elemento, tema);
    });
  }

  /* ---------- Gráficos (Chart.js) ----------
     O Chart.js desenha em <canvas>, então o CSS não alcança. Ajustamos as cores
     de textos e linhas de grade de cada gráfico já criado. */

  // Guarda as cores originais de cada gráfico. Usamos um WeakMap em vez de
  // propriedades no próprio gráfico para não interferir no Chart.js.
  const originaisGraficos = new WeakMap();

  function atualizarGraficos() {
    const Chart = window.Chart;
    if (!Chart) return;
    const escuro = temaAtual() === "dark";
    const texto = "#94a3b8";
    const grade = "rgba(148, 163, 184, 0.16)";
    try {
      // Padrões do Chart.js (valem também para gráficos criados depois)
      if (!Chart.$hsPadrao) {
        Chart.$hsPadrao = {
          color: Chart.defaults.color,
          borderColor: Chart.defaults.borderColor,
        };
      }
      Chart.defaults.color = escuro ? texto : Chart.$hsPadrao.color;
      Chart.defaults.borderColor = escuro ? grade : Chart.$hsPadrao.borderColor;

      const instancias = Chart.instances ? Object.values(Chart.instances) : [];
      instancias.forEach((g) => {
        // IMPORTANTE: g.options é um Proxy do Chart.js. Ler uma propriedade e
        // gravar o próprio Proxy de volta (ex.: o.scales = o.scales || {})
        // cria uma referência circular e o Chart.js lança
        // "Recursion detected: _scriptable->_scriptable".
        // Por isso alteramos apenas chart.config.options, que é o objeto
        // simples passado na criação do gráfico.
        const cfg = g.config && g.config.options;
        if (!cfg || typeof cfg !== "object") return;

        if (!originaisGraficos.has(g)) originaisGraficos.set(g, { escalas: {} });
        const orig = originaisGraficos.get(g);

        if (cfg.scales && typeof cfg.scales === "object") {
          Object.keys(cfg.scales).forEach((chave) => {
            const escala = cfg.scales[chave];
            if (!escala || typeof escala !== "object") return;

            if (!orig.escalas[chave]) {
              orig.escalas[chave] = {
                tick: escala.ticks && escala.ticks.color,
                grade: escala.grid && escala.grid.color,
                titulo: escala.title && escala.title.color,
              };
            }
            const original = orig.escalas[chave];

            // Só mexe em propriedades que o gráfico realmente declarou.
            // O que não foi declarado continua usando Chart.defaults.
            if (escala.ticks && "color" in escala.ticks) {
              escala.ticks.color = escuro ? texto : original.tick;
            }
            if (escala.grid && "color" in escala.grid) {
              escala.grid.color = escuro ? grade : original.grade;
            }
            if (escala.title && "color" in escala.title) {
              escala.title.color = escuro ? texto : original.titulo;
            }
          });
        }

        const labels =
          cfg.plugins && cfg.plugins.legend && cfg.plugins.legend.labels;
        if (labels && typeof labels === "object" && "color" in labels) {
          if (!("legenda" in orig)) orig.legenda = labels.color;
          labels.color = escuro ? texto : orig.legenda;
        }

        g.update("none");
      });
    } catch (e) { /* um gráfico problemático não pode quebrar o tema */ }
  }

  /* ---------- Aplicar o tema ---------- */

  let temporizadorTransicao;

  function aplicar(tema, opcoes) {
    const o = opcoes || {};
    if (o.animar) {
      // Só anima quando a pessoa clica (na carga da página não há transição).
      raiz.classList.add("tema-transicao");
      clearTimeout(temporizadorTransicao);
      temporizadorTransicao = setTimeout(() => raiz.classList.remove("tema-transicao"), 400);
    }

    raiz.setAttribute("data-theme", tema);
    raiz.style.colorScheme = tema;
    trocarTodosLogos(tema);

    if (o.persistir) gravar(tema);

    // Cor da barra do navegador no celular
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta && document.head) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    if (meta) meta.content = tema === "dark" ? "#0b1220" : "#ffffff";

    if (document.body) {
      trocarTodosLogos(tema);
      atualizarBotoes(tema);
      atualizarGraficos();
    }

    document.dispatchEvent(new CustomEvent("hs:tema", { detail: { tema } }));
  }

  // Aplica já, antes de qualquer pintura.
  aplicar(temaInicial());

  async function carregarTemaSalvo() {
    try {
      await window.HS.ready;

      if (!window.HS.usuario) return;

      const dados = await API.get("/preferencias/tema");

      if (dados.tema === "dark" || dados.tema === "light") {
        temaSalvo = dados.tema;
        aplicar(temaSalvo);
      }

    } catch (erro) {
      console.error("Não foi possível carregar o tema:", erro);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", carregarTemaSalvo);
  } else {
    carregarTemaSalvo();
  }

  /* ---------- Botão ---------- */

  const ICONE_LUA =
    '<svg class="tema-icone tema-icone-lua" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg>';
  const ICONE_SOL =
    '<svg class="tema-icone tema-icone-sol" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  function criarBotao(flutuante) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tema-toggle" + (flutuante ? " tema-toggle--flutuante" : "");
    b.setAttribute("aria-label", "Modo escuro");
    b.innerHTML = ICONE_LUA + ICONE_SOL;
    b.addEventListener("click", () => {
      aplicar(temaAtual() === "dark" ? "light" : "dark", { persistir: true, animar: true });
    });
    return b;
  }

  function atualizarBotoes(tema) {
    const escuro = tema === "dark";
    document.querySelectorAll(".tema-toggle").forEach((b) => {
      b.setAttribute("aria-pressed", escuro ? "true" : "false");
      b.title = escuro ? "Mudar para o modo claro" : "Mudar para o modo escuro";
    });
  }

  function inserirBotao() {
    if (document.querySelector(".tema-toggle")) return;
    const botao = criarBotao(false);

    const iconesTopbar = document.querySelector(".topbar .icons");
    const acoesLanding = document.querySelector(".navbar .acoes");

    if (iconesTopbar) {
      // Telas internas: antes do ícone de suporte
      iconesTopbar.insertBefore(botao, iconesTopbar.querySelector("a") || null);
    } else if (acoesLanding) {
      // Landing (desktop): antes de "Entrar"
      acoesLanding.insertBefore(botao, acoesLanding.firstChild);
      // Landing (celular): o bloco .acoes some e as ações vão para o menu ☰,
      // então há um segundo botão, ao lado do ☰, visível só em telas estreitas.
      const hamburguer = document.querySelector(".navbar .menu-mobile");
      if (hamburguer) {
        const mobile = criarBotao(false);
        mobile.classList.add("tema-toggle--mobile");
        hamburguer.parentNode.insertBefore(mobile, hamburguer);
      }
    } else {
      // Login, validação etc.: botão flutuante no canto
      document.body.appendChild(criarBotao(true));
      return;
    }
  }

  function iniciar() {
    inserirBotao();
    aplicar(temaAtual());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();

  // Gráficos criados por scripts que rodam depois do DOMContentLoaded
  window.addEventListener("load", atualizarGraficos);

  /* ---------- Sincronização ---------- */

  // O sistema mudou e a pessoa nunca escolheu manualmente
  if (consultaSistema) {
    const aoMudarSistema = (e) => {
      if (SEGUIR_SISTEMA && !lerSalvo()) aplicar(e.matches ? "dark" : "light");
    };
    if (consultaSistema.addEventListener) consultaSistema.addEventListener("change", aoMudarSistema);
    else if (consultaSistema.addListener) consultaSistema.addListener(aoMudarSistema); // Safari antigo
  }

  // API pública, caso outros scripts precisem (ex.: HSTema.atual())
  window.HSTema = {
    atual: temaAtual,
    escuro: () => temaAtual() === "dark",
    definir: (t) => aplicar(t === "dark" ? "dark" : "light", { persistir: true, animar: true }),
    alternar: () => aplicar(temaAtual() === "dark" ? "light" : "dark", { persistir: true, animar: true }),
  };
})();
