(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let current = null,
    serial = 0;
  const names = HabilitaValidacao.nomes;
  function hours(n) {
    return (
      new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n) +
      " h"
    );
  }
  function date(v) {
    return v.slice(8, 10) + "/" + v.slice(5, 7) + "/" + v.slice(0, 4);
  }
  function resize() {
    document.documentElement.style.setProperty(
      "--screen-zoom",
      Math.min(1, (innerWidth - 30) / 1536),
    );
  }
  function fail(e) {
    window.__CERT_READY = false;
    document.body.classList.add("render-error");
    $("print").disabled = true;
    $("status").textContent = e.message;
    $("error").textContent = e.message;
  }
  function fit() {
    for (const el of document.querySelectorAll("[data-fit]")) {
      el.style.fontSize = "";
      const min = Number(el.dataset.fit);
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (
        size > min &&
        (el.scrollWidth > el.clientWidth + 1 ||
          el.scrollHeight > el.clientHeight + 1)
      ) {
        size -= 1;
        el.style.fontSize = size + "px";
      }
      if (
        el.scrollWidth > el.clientWidth + 2 ||
        el.scrollHeight > el.clientHeight + 2
      )
        throw Error(
          "Texto excede o espaço do layout: " +
            el.textContent.trim().slice(0, 70) +
            ". Revise a extensão ou ajuste o CSS.",
        );
    }
    const back = $("back");
    for (const el of back.querySelectorAll(".program,.completion-panel"))
      if (
        el.getBoundingClientRect().bottom >
        document.querySelector(".back-footer").getBoundingClientRect().top - 7
      )
        throw Error(
          "Conteúdo programático ou critérios excedem o verso. Reduza a síntese ou ajuste o CSS; o sistema não corta conteúdo.",
        );
  }
  async function render(d) {
    const token = ++serial;
    window.__CERT_READY = false;
    $("print").disabled = true;
    try {
      // A emissão oficial só pode ser renderizada pelo processo iniciado no backend.
      if (!window.__CERT_BACKEND_RENDER && d.demo !== true)
        throw Error("A emissão oficial deve ser autorizada pelo backend. Este visualizador gera apenas prévias demonstrativas.");
      HabilitaValidacao.assert(d);
      const qr = await QRCode.toDataURL(d.verificationUrl, {
        errorCorrectionLevel: "M",
        margin: 4,
        width: 440,
        color: { dark: "#000000", light: "#ffffff" },
      });
      if (token !== serial) return;
      document.body.classList.remove("render-error");
      $("error").textContent = "";
      $("pages").className = d.nivel + (d.modulos.length > 6 ? " compact" : "");
      $("artwork").src =
        window.HS_ASSETS?.[d.nivel] || "assets/arte-" + d.nivel + ".svg";
      $("heading").textContent =
        d.nivel === "expert"
          ? "CERTIFICADO DE PROFICIÊNCIA AVANÇADA"
          : "CERTIFICADO";
      $("level").textContent =
        d.nivel === "expert" ? "Nível Expert" : names[d.nivel];
      $("full-level").textContent = names[d.nivel];
      $("back-level").textContent =
        "Nível " +
        {
          operacional: "Operacional",
          estrategico: "Estratégico",
          expert: "Expert",
        }[d.nivel];
      const values = {
        ...d,
        horas: hours(d.cargaHoraria),
        inicio: date(d.dataInicio),
        conclusao: date(d.dataConclusao),
        emissao: date(d.dataEmissao),
      };
      for (const el of document.querySelectorAll("[data-field]"))
        el.textContent = String(values[el.dataset.field] ?? "");
      $("modules").replaceChildren(
        ...d.modulos.map((m) => {
          const tr = document.createElement("tr");
          for (const v of [m.titulo, hours(m.horas)]) {
            const td = document.createElement("td");
            td.textContent = v;
            tr.append(td);
          }
          return tr;
        }),
      );
      $("qr").src = qr;
      $("qr-back").src = qr;
      $("verification-link").href = d.verificationUrl;
      $("verification-link").textContent = d.verificationUrl;
      $("verify-hint").textContent = d.demo
        ? "QR demonstrativo · consulta não publicada"
        : "Escaneie o QR Code para consultar o registro.";
      for (const el of document.querySelectorAll("[data-demo]"))
        el.hidden = !d.demo;
      for (const [id, key] of [
        ["signature-teacher", "assinaturaProfessor"],
        ["signature-institution", "assinaturaInstitucional"],
      ]) {
        $(id).hidden = !d[key];
        if (d[key]) $(id).src = d[key];
        else $(id).removeAttribute("src");
      }
      await document.fonts.ready;
      await Promise.all(
        [...document.querySelectorAll(".page img")]
          .filter((el) => !el.hidden)
          .map((el) => el.decode()),
      );
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      if (token !== serial) return;
      fit();
      current = structuredClone(d);
      $("nivel").value = d.nivel;
      $("json-editor").value = JSON.stringify(d, null, 2);
      $("print").disabled = false;
      $("status").textContent = d.demo
        ? "Prévia pronta · dados fictícios · duas páginas, frente e verso."
        : "Documento renderizado. A autorização da emissão pertence ao backend.";
      window.__CERT_READY = true;
      window.__CERT_ERROR = null;
      return { ok: true, pages: 2, templateVersion: "2.0.0" };
    } catch (e) {
      if (token === serial) {
        window.__CERT_ERROR = e.message;
        fail(e);
      }
      throw e;
    }
  }
  window.HabilitaCertificados = {
    render,
    nomes: names,
    version: "2.0.0",
    getDados: () => (current ? structuredClone(current) : null),
  };
  $("nivel").addEventListener("change", (e) => {
    const d = current
      ? { ...current, nivel: e.target.value }
      : CERTIFICADOS_EXEMPLO[e.target.value];
    render(d).catch(() => {});
  });
  $("print").addEventListener("click", () => {
    if (window.__CERT_READY) window.print();
  });
  $("toggle-editor").addEventListener("click", () => {
    $("editor").hidden = !$("editor").hidden;
    $("toggle-editor").setAttribute(
      "aria-expanded",
      String(!$("editor").hidden),
    );
  });
  $("apply").addEventListener("click", () => {
    try {
      render(JSON.parse($("json-editor").value)).catch(() => {});
    } catch (e) {
      fail(e);
    }
  });
  $("json-file").addEventListener("change", async (e) => {
    try {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 6000000) throw Error("JSON maior que 6 MB.");
      const d = JSON.parse(await f.text());
      await render(d);
    } catch (e) {
      fail(e);
    }
  });
  $("download-json").addEventListener("click", () => {
    if (!current) return;
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(current, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "certificado-" + current.nivel + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  });
  window.addEventListener("resize", resize);
  resize();
  if (new URLSearchParams(location.search).has("headless"))
    document.body.classList.add("headless");
  if (new URLSearchParams(location.search).has("embedded"))
    document.body.classList.add("embedded");
  else {
    const nivelInicial = location.hash.replace(/^#/, "").toLowerCase();
    const exemplo = CERTIFICADOS_EXEMPLO[nivelInicial] || CERTIFICADOS_EXEMPLO.operacional;
    render(exemplo).catch(() => {});
  }
})();
