(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

  const ler = (chave, padrao) => {
    try {
      const valor = JSON.parse(localStorage.getItem(chave));
      return valor ?? padrao;
    } catch (e) {
      return padrao;
    }
  };

  let cursos = ler("cursos", []);
  if (!Array.isArray(cursos)) cursos = [];
  const NV = HS.niveis ? HS.niveis() : {};

  const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const formatarMoeda = (valor) =>
    numero(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtroMes = document.getElementById("filtroMes");
  const tabela = document.getElementById("tabelaRepasses");

  function cursosDoFiltro() {
    const mes = filtroMes?.value || "";
    const comVendas = cursos.filter((curso) => numero(curso.vendas) > 0);
    if (!mes) return comVendas;
    return comVendas.filter((curso) => String(curso.dataCriacao || "").slice(0, 7) === mes);
  }

  // Um único cálculo para resumo, tabela e PDF: taxa e impostos incidem sobre o bruto.
  function dadosDoCurso(curso) {
    const bruto = numero(curso.preco) * numero(curso.vendas);
    const docente = numero((NV[curso.nivel] || {}).docente) || 90;
    const taxaPercentual = 100 - docente;
    const taxa = bruto * (taxaPercentual / 100);
    const impostos = bruto * 0.15;
    return {
      bruto,
      docente,
      taxaPercentual,
      taxa,
      impostos,
      liquido: Math.max(0, bruto - taxa - impostos),
    };
  }

  function calcular(lista) {
    const totais = lista.reduce(
      (acc, curso) => {
        const dados = dadosDoCurso(curso);
        acc.bruto += dados.bruto;
        acc.taxa += dados.taxa;
        acc.impostos += dados.impostos;
        acc.liquida += dados.liquido;
        acc.vendas += numero(curso.vendas);
        return acc;
      },
      { bruto: 0, taxa: 0, impostos: 0, liquida: 0, vendas: 0 },
    );
    return { ...totais, saldo: totais.liquida };
  }

  function preencher(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  }

  function renderizarResumo(lista, dados) {
    preencher("faturamentoBruto", formatarMoeda(dados.bruto));
    preencher("receitaLiquida", formatarMoeda(dados.liquida));
    preencher("saldoDisponivel", formatarMoeda(dados.saldo));
    preencher("totalVendas", dados.vendas);
    preencher("resumoBruto", formatarMoeda(dados.bruto));
    preencher("resumoTaxa", "− " + formatarMoeda(dados.taxa));
    preencher("resumoImpostos", "− " + formatarMoeda(dados.impostos));
    preencher("resumoLiquida", formatarMoeda(dados.liquida));
  }

  function renderizarTabela(lista) {
    if (!tabela) return;
    if (!lista.length) {
      tabela.innerHTML = `<tr><td colspan="6" class="vazio">Nenhum repasse encontrado para o período.</td></tr>`;
      return;
    }

    tabela.innerHTML = lista
      .map((curso) => {
        const dados = dadosDoCurso(curso);
        const data = curso.dataCriacao
          ? new Date(curso.dataCriacao).toLocaleDateString("pt-BR")
          : "—";
        return `
      <tr>
        <td>${esc(data)}</td>
        <td>${esc(curso.nome || "Curso")}</td>
        <td>${formatarMoeda(dados.bruto)}</td>
        <td>${dados.taxaPercentual}%</td>
        <td>15%</td>
        <td>${formatarMoeda(dados.liquido)}</td>
      </tr>`;
      })
      .join("");
  }

  let grafico = null;

  function renderizarGrafico(lista) {
    const canvas = document.getElementById("graficoGanhos");
    if (!canvas) return;
    if (!window.Chart) {
      canvas.style.display = "none";
      if (!canvas.nextElementSibling || !canvas.nextElementSibling.classList.contains("vazio")) {
        const aviso = document.createElement("p");
        aviso.className = "vazio";
        aviso.textContent = "Não foi possível carregar o gráfico. Verifique sua conexão.";
        canvas.insertAdjacentElement("afterend", aviso);
      }
      return;
    }

    const labels = lista.length ? lista.map((c) => c.nome || "Curso") : ["Sem dados"];
    const valores = lista.length ? lista.map((c) => numero(c.preco) * numero(c.vendas)) : [0];

    if (grafico) {
      grafico.data.labels = labels;
      grafico.data.datasets[0].data = valores;
      grafico.update();
      return;
    }

    grafico = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Receita",
            data: valores,
            borderColor: "#0055c3",
            backgroundColor: "rgba(0,85,195,.12)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }

  function atualizar() {
    const lista = cursosDoFiltro();
    const dados = calcular(lista);
    renderizarResumo(lista, dados);
    renderizarTabela(lista);
    renderizarGrafico(lista);
  }

  filtroMes?.addEventListener("change", atualizar);
  atualizar();

  /* ---------- Saque ---------- */
  const btnSaque = document.getElementById("btnSaque");
  btnSaque?.addEventListener("click", () => {
    const dados = calcular(cursosDoFiltro());
    if (dados.saldo <= 0) {
      alert("Não há saldo disponível para saque no momento.");
      return;
    }
    const banco = ler("dadosBancarios", null);
    if (!banco || !banco.banco || !banco.agencia || !banco.conta) {
      alert("Cadastre seus dados bancários antes de solicitar o saque.");
      document.querySelector(".btn-editar-banco")?.click();
      return;
    }
    if (!confirm(`Solicitar o saque de ${formatarMoeda(dados.saldo)}?`)) return;
    if (window.HS && HS.notificar) {
      HS.notificar(
        "Saque solicitado",
        `Sua solicitação de saque de ${formatarMoeda(dados.saldo)} foi enviada.`,
        "alerta",
        "professor",
      );
    }
    alert("Solicitação enviada! O valor será transferido para a conta cadastrada.");
  });

  /* ---------- Dados bancários ---------- */
  const btnEditarBanco = document.querySelector(".btn-editar-banco");
  const modalBanco = document.getElementById("modalBanco");
  const bancoUsuario = document.getElementById("bancoUsuario");
  const agenciaUsuario = document.getElementById("agenciaUsuario");
  const contaUsuario = document.getElementById("contaUsuario");
  const inputBanco = document.getElementById("inputBanco");
  const inputAgencia = document.getElementById("inputAgencia");
  const inputConta = document.getElementById("inputConta");
  const salvarBanco = document.getElementById("salvarBanco");

  function carregarDadosBancarios() {
    const dados = ler("dadosBancarios", null);
    if (!dados) return;
    if (bancoUsuario) bancoUsuario.textContent = dados.banco || "—";
    if (agenciaUsuario) agenciaUsuario.textContent = dados.agencia || "—";
    if (contaUsuario) contaUsuario.textContent = dados.conta || "—";
  }
  carregarDadosBancarios();

  function fecharModalBanco() {
    if (!modalBanco) return;
    modalBanco.style.display = "none";
    modalBanco.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  btnEditarBanco?.addEventListener("click", () => {
    if (!modalBanco) return;
    if (inputBanco) inputBanco.value = bancoUsuario?.textContent === "—" ? "" : bancoUsuario?.textContent || "";
    if (inputAgencia) inputAgencia.value = agenciaUsuario?.textContent === "—" ? "" : agenciaUsuario?.textContent || "";
    if (inputConta) inputConta.value = contaUsuario?.textContent === "—" ? "" : contaUsuario?.textContent || "";
    modalBanco.style.display = "flex";
    modalBanco.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => inputBanco?.focus(), 30);
  });

  salvarBanco?.addEventListener("click", () => {
    const banco = inputBanco?.value.trim() || "";
    const agencia = inputAgencia?.value.trim() || "";
    const conta = inputConta?.value.trim() || "";
    if (!banco || !agencia || !conta) {
      alert("Preencha banco, agência e conta.");
      return;
    }
    try {
      localStorage.setItem("dadosBancarios", JSON.stringify({ banco, agencia, conta }));
    } catch (e) {
      alert("Não foi possível salvar os dados bancários.");
      return;
    }
    carregarDadosBancarios();
    fecharModalBanco();
    alert("Dados bancários atualizados!");
  });

  modalBanco?.addEventListener("click", (e) => {
    if (e.target === modalBanco) fecharModalBanco();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBanco && modalBanco.style.display === "flex") fecharModalBanco();
  });

  /* ---------- Relatório em PDF ---------- */
  document.getElementById("btnRelatorio")?.addEventListener("click", () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.");
      return;
    }
    try {
      const lista = cursosDoFiltro();
      const dados = calcular(lista);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Relatório financeiro", 20, 20);
      doc.setFontSize(12);
      doc.text("Faturamento bruto: " + formatarMoeda(dados.bruto), 20, 40);
      doc.text("Taxa da plataforma: " + formatarMoeda(dados.taxa), 20, 52);
      doc.text("Impostos: " + formatarMoeda(dados.impostos), 20, 64);
      doc.text("Receita líquida: " + formatarMoeda(dados.liquida), 20, 76);
      doc.text("Saldo disponível: " + formatarMoeda(dados.saldo), 20, 88);
      doc.text("Total de vendas: " + dados.vendas, 20, 100);
      if (filtroMes?.value) doc.text("Período: " + filtroMes.value, 20, 112);
      doc.save("relatorio-financeiro.pdf");
    } catch (e) {
      console.error(e);
      alert("Não foi possível gerar o relatório.");
    }
  });
})();
