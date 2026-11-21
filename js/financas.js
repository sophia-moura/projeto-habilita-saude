
(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]));

  const ler = (chave, padrao) => {
    try {
      const valor = JSON.parse(localStorage.getItem(chave));
      return valor ?? padrao;
    } catch (e) {
      return padrao;
    }
  };

  function obterNiveis() {
    return window.HS && typeof HS.niveis === "function"
      ? HS.niveis()
      : {};
  }

  const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formatarMoeda = (valor) =>
    numero(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const filtroMes = document.getElementById("filtroMes");
  const tabela = document.getElementById("tabelaRepasses");

  let cursos = [];
  let saldoGeral = 0;
  let grafico = null;
  let carregando = false;
  let niveisCarregados = false;

  // Converte os dados da API para o formato usado pela página.
  function normalizarCurso(curso) {
    return {
      id: curso.cursoId,
      nome: curso.cursoNome || "Curso",
      nivel: curso.nivel,
      dataCriacao: curso.ultimaVenda,
      vendas: numero(curso.vendas),
      faturamentoBruto: numero(curso.faturamentoBruto)
    };
  }

  // Calcula taxa e impostos sobre o faturamento bruto real.
  function dadosDoCurso(curso) {
    const bruto = numero(curso.faturamentoBruto);

    const niveis = obterNiveis();

    const docente =
      numero((niveis[curso.nivel] || {}).docente) || 90;

    const taxaPercentual = 100 - docente;
    const taxa = bruto * (taxaPercentual / 100);
    const impostos = bruto * 0.15;

    return {
      bruto,
      docente,
      taxaPercentual,
      taxa,
      impostos,
      liquido: Math.max(0, bruto - taxa - impostos)
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
      {
        bruto: 0,
        taxa: 0,
        impostos: 0,
        liquida: 0,
        vendas: 0
      }
    );

    return {
      ...totais,
      saldo: totais.liquida
    };
  }

  function preencher(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  }

  function renderizarResumo(dados) {
    preencher("faturamentoBruto", formatarMoeda(dados.bruto));
    preencher("receitaLiquida", formatarMoeda(dados.liquida));
    preencher("saldoDisponivel", formatarMoeda(dados.saldo));
    preencher("totalVendas", dados.vendas);

    preencher("resumoBruto", formatarMoeda(dados.bruto));
    preencher("resumoTaxa", "− " + formatarMoeda(dados.taxa));
    preencher("resumoImpostos", "− " + formatarMoeda(dados.impostos));
    preencher("resumoLiquida", formatarMoeda(dados.liquida));
  }

  
  function renderizarTabela(lista, saques = []) {
    if (!tabela) return;

    const movimentacoes = [
      ...lista.map((curso) => ({
        tipo: "venda",
        data: curso.dataCriacao,
        curso
      })),

      ...saques.map((saque) => ({
        tipo: "saque",
        data: saque.dataSolicitacao,
        saque
      }))
    ];

    movimentacoes.sort((a, b) => {
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    if (!movimentacoes.length) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="vazio">
            Nenhuma movimentação encontrada para o período.
          </td>
        </tr>
      `;
      return;
    }

    tabela.innerHTML = movimentacoes.map((mov) => {
      const data = mov.data
        ? new Date(mov.data).toLocaleDateString("pt-BR")
        : "—";

      if (mov.tipo === "saque") {
        return `
          <tr>
            <td>${esc(data)}</td>
            <td>Solicitação de saque (${esc(mov.saque.status)})</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
            <td>${formatarMoeda(mov.saque.valor)}</td>
          </tr>
        `;
      }

      const curso = mov.curso;
      const dados = dadosDoCurso(curso);

      return `
        <tr>
          <td>${esc(data)}</td>
          <td>${esc(curso.nome || "Curso")}</td>
          <td>${formatarMoeda(dados.bruto)}</td>
          <td>${dados.taxaPercentual}%</td>
          <td>15%</td>
          <td>${formatarMoeda(dados.liquido)}</td>
        </tr>
      `;
    }).join("");
  }

  function renderizarGrafico(lista) {
    const canvas = document.getElementById("graficoGanhos");
    if (!canvas) return;

    if (!window.Chart) {
      canvas.style.display = "none";

      if (
        !canvas.nextElementSibling ||
        !canvas.nextElementSibling.classList.contains("vazio")
      ) {
        const aviso = document.createElement("p");
        aviso.className = "vazio";
        aviso.textContent =
          "Não foi possível carregar o gráfico. Verifique sua conexão.";

        canvas.insertAdjacentElement("afterend", aviso);
      }

      return;
    }

    canvas.style.display = "";

    const labels = lista.length
      ? lista.map((c) => c.nome || "Curso")
      : ["Sem dados"];

    const valores = lista.length
      ? lista.map((c) => numero(c.faturamentoBruto))
      : [0];

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
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  function atualizarTela(saques = []) {
    const lista = cursos.filter(
      (curso) => numero(curso.vendas) > 0
    );

    const dados = calcular(lista);

    // O saldo sacável é independente do filtro mensal.
    dados.saldo = saldoGeral;

    renderizarResumo(dados);
    renderizarTabela(lista, saques);
    renderizarGrafico(lista);
  }

  // Busca os dados financeiros reais no servidor.
  async function carregarFinancas() {
    if (carregando) return;

    carregando = true;

    if (tabela) {
      tabela.innerHTML = `
        <tr>
          <td colspan="6" class="vazio">
            Carregando dados financeiros...
          </td>
        </tr>
      `;
    }

    try {
      if (!niveisCarregados && window.HS && typeof HS.carregarNiveis === "function") {
        await HS.carregarNiveis();
        niveisCarregados = true;
      }
      
      const mes = filtroMes?.value || "";

      const url = mes
        ? `/api/professor/financas?mes=${encodeURIComponent(mes)}`
        : "/api/professor/financas";

      const resposta = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro || "Não foi possível consultar as finanças."
        );
      }

      const urlSaques = mes
        ? `/api/professor/saques?mes=${encodeURIComponent(mes)}`
        : "/api/professor/saques";

      const respostaSaques = await fetch(urlSaques, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        }
      });

      const dadosSaques = await respostaSaques.json();

      if (!respostaSaques.ok || !dadosSaques.sucesso) {
        throw new Error(
          dadosSaques.erro || "Não foi possível consultar os saques."
        );
      }

      const saques = Array.isArray(dadosSaques.saques)
        ? dadosSaques.saques
        : [];

      console.log("Saldo recebido da API:", {
        mes: mes,
        saldoDisponivel: dados.saldoDisponivel
      });

      // Saldo geral, independente do mês selecionado.
      saldoGeral = Number(dados.saldoDisponivel) || 0;

      cursos = Array.isArray(dados.cursos)
        ? dados.cursos.map(normalizarCurso)
        : [];

      atualizarTela(saques);

    } catch (erro) {
      console.error("Erro ao carregar finanças:", erro);

      alert(
        erro.message ||
        "Não foi possível carregar os dados financeiros."
      );
    } finally {
      carregando = false;
    }
  }

  filtroMes?.addEventListener("change", carregarFinancas);

  // Carrega os dados ao abrir a página.
  carregarFinancas();

  /* ---------- Saque ---------- */

  const btnSaque = document.getElementById("btnSaque");

  btnSaque?.addEventListener("click", async () => {
    if (!confirm("Deseja solicitar o saque de todo o seu saldo disponível?")) {
      return;
    }

    btnSaque.disabled = true;

    try {
      const resposta = await fetch("/api/professor/solicitar-saque", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        }
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(
          resultado.erro || "Não foi possível solicitar o saque."
        );
      }

      const valor = formatarMoeda(resultado.valor);

      if (window.HS && HS.notificar) {
        HS.notificar(
          "Saque solicitado",
          `Sua solicitação de ${valor} foi enviada com sucesso.`,
          "alerta",
          "professor"
        );
      }

      alert(`Solicitação de saque de ${valor} registrada com sucesso!`);

      // Atualiza os dados financeiros após a solicitação.
      await carregarFinancas();

    } catch (erro) {
      console.error("Erro ao solicitar saque:", erro);
      alert(erro.message || "Não foi possível processar sua solicitação.");
    } finally {
      btnSaque.disabled = false;
    }
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

  async function carregarDadosBancarios() {
    try {
        const resposta = await fetch("/api/professor/dados-bancarios", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                Accept: "application/json"
            }
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(resultado.erro || "Erro ao consultar dados bancários.");
        }

        const dados = resultado.dados;

        if (bancoUsuario) bancoUsuario.textContent = dados?.banco || "—";
        if (agenciaUsuario) agenciaUsuario.textContent = dados?.agencia || "—";
        if (contaUsuario) contaUsuario.textContent = dados?.conta || "—";

    } catch (erro) {
        console.error("Erro ao carregar dados bancários:", erro);
        alert("Não foi possível carregar os dados bancários.");
    }
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

    if (inputBanco) {
      inputBanco.value =
        bancoUsuario?.textContent === "—"
          ? ""
          : bancoUsuario?.textContent || "";
    }

    if (inputAgencia) {
      inputAgencia.value =
        agenciaUsuario?.textContent === "—"
          ? ""
          : agenciaUsuario?.textContent || "";
    }

    if (inputConta) {
      inputConta.value =
        contaUsuario?.textContent === "—"
          ? ""
          : contaUsuario?.textContent || "";
    }

    modalBanco.style.display = "flex";
    modalBanco.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(() => inputBanco?.focus(), 30);
  });

  salvarBanco?.addEventListener("click", async () => {
    const bancoNome = inputBanco?.value.trim() || "";
    const agencia = inputAgencia?.value.trim() || "";
    const conta = inputConta?.value.trim() || "";

    if (!bancoNome || !agencia || !conta) {
        alert("Preencha banco, agência e conta.");
        return;
    }

    salvarBanco.disabled = true;

    try {
        const resposta = await fetch("/api/professor/dados-bancarios", {
            method: "PUT",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                banco: bancoNome,
                agencia,
                conta
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(resultado.erro || "Não foi possível salvar os dados.");
        }

        await carregarDadosBancarios();
        fecharModalBanco();

        alert("Dados bancários salvos com sucesso!");

    } catch (erro) {
        console.error("Erro ao salvar dados bancários:", erro);
        alert(erro.message || "Não foi possível salvar os dados bancários.");
    } finally {
        salvarBanco.disabled = false;
    }
  });

  /* ---------- Relatório em PDF ---------- */

  document.getElementById("btnRelatorio")?.addEventListener("click", () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(
        "Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente."
      );
      return;
    }

    try {
      const lista = cursos.filter(
        (curso) => numero(curso.vendas) > 0
      );

      const dados = calcular(lista);
      dados.saldo = saldoGeral;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Relatório financeiro", 20, 20);

      doc.setFontSize(12);
      doc.text(
        "Faturamento bruto: " + formatarMoeda(dados.bruto),
        20,
        40
      );
      doc.text(
        "Taxa da plataforma: " + formatarMoeda(dados.taxa),
        20,
        52
      );
      doc.text(
        "Impostos: " + formatarMoeda(dados.impostos),
        20,
        64
      );
      doc.text(
        "Receita líquida: " + formatarMoeda(dados.liquida),
        20,
        76
      );
      doc.text(
        "Saldo disponível: " + formatarMoeda(dados.saldo),
        20,
        88
      );
      doc.text("Total de vendas: " + dados.vendas, 20, 100);

      if (filtroMes?.value) {
        doc.text("Período: " + filtroMes.value, 20, 112);
      }

      doc.save("relatorio-financeiro.pdf");

    } catch (e) {
      console.error(e);
      alert("Não foi possível gerar o relatório.");
    }
  });
})();
