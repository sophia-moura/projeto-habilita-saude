
(function () {
  const esc =
    (window.HS && HS.esc) ||
    ((t) =>
      String(t ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]));

  const filtroCurso = document.getElementById("filtroCurso");
  const filtroPeriodo = document.getElementById("filtroPeriodo");

  const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const formatarMoeda = (valor) =>
    numero(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  let dadosRelatorio = null;
  let graficoCursos = null;
  let graficoStatus = null;
  let requisicaoAtual = 0;
  let cursosFiltroCarregado = false;

  function preencher(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  }

  function atualizarRotulos() {
    const rotuloPendentes = document
      .getElementById("atividadesPendentes")
      ?.parentElement?.querySelector("span");

    if (rotuloPendentes) {
      rotuloPendentes.textContent = "ALUNOS EM ANDAMENTO";
    }

    const rotuloAndamento = document
      .getElementById("statusAtrasadas")
      ?.previousElementSibling;

    if (rotuloAndamento) {
      rotuloAndamento.textContent = "Em andamento";
    }

    const rotuloRanking = document.querySelector(".ranking-header h2");

    if (rotuloRanking) {
      rotuloRanking.textContent = "Cursos com mais inscrições";
    }
  }

  function carregarCursosFiltro(lista) {
    if (!filtroCurso) return;

    const selecionado = filtroCurso.value;

    filtroCurso.innerHTML =
      '<option value="">Todos os cursos</option>' +
      lista
        .map(
          (curso) =>
            `<option value="${esc(String(curso.cursoId))}">${esc(
              curso.cursoNome || "Curso"
            )}</option>`
        )
        .join("");

    if (
      selecionado &&
      lista.some((curso) => String(curso.cursoId) === selecionado)
    ) {
      filtroCurso.value = selecionado;
    }
  }

  function dadosFiltrados() {
    if (!dadosRelatorio) return [];

    return dadosRelatorio.cursos.map((curso) => ({
      id: curso.cursoId,
      nome: curso.cursoNome,
      _inscricoes: numero(curso.inscricoes),
      _concluidos: numero(curso.concluidos),
      _pendentes: Math.max(
        0,
        numero(curso.inscricoes) - numero(curso.concluidos)
      ),
    }));
  }

  function semChart(canvas) {
    if (!canvas) return;

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
  }

  function criarGraficoCursos(lista) {
    const canvas = document.getElementById("graficoCursos");
    if (!canvas) return;

    if (!window.Chart) return semChart(canvas);

    canvas.style.display = "";

    const aviso = canvas.nextElementSibling;
    if (aviso?.classList.contains("vazio")) aviso.remove();

    const labels = lista.length
      ? lista.map((c) => c.nome || "Curso")
      : ["Sem dados"];

    const data = lista.length
      ? lista.map((c) => c._inscricoes)
      : [0];

    if (graficoCursos) {
      graficoCursos.data.labels = labels;
      graficoCursos.data.datasets[0].data = data;
      graficoCursos.update();
      return;
    }

    graficoCursos = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Inscrições",
            data,
            borderColor: "#0055c3",
            backgroundColor: "#0055c3",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  function criarGraficoStatus() {
    const canvas = document.getElementById("graficoStatus");
    if (!canvas) return;

    if (!window.Chart) return semChart(canvas);

    canvas.style.display = "";

    const aviso = canvas.nextElementSibling;
    if (aviso?.classList.contains("vazio")) aviso.remove();

    const metricas = dadosRelatorio?.metricas || {};

    const concluidas = numero(metricas.totalConcluidos);
    const andamento = numero(metricas.alunosEmAndamento);

    const data = [concluidas, andamento];

    if (graficoStatus) {
      graficoStatus.data.datasets[0].data = data;
      graficoStatus.update();
      return;
    }

    graficoStatus = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Concluídas", "Em andamento"],
        datasets: [
          {
            data,
            backgroundColor: ["#3e9c2d", "#0055c3"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  function atualizarMetricas() {
    const metricas = dadosRelatorio?.metricas || {};

    preencher("totalInscricoes", numero(metricas.totalInscricoes));
    preencher("totalConcluidos", numero(metricas.totalConcluidos));
    preencher(
      "atividadesPendentes",
      numero(metricas.alunosEmAndamento)
    );
    preencher(
      "receitaTotal",
      formatarMoeda(metricas.receitaTotal)
    );
  }

  function atualizarStatus() {
    const metricas = dadosRelatorio?.metricas || {};

    preencher("statusConcluidas", numero(metricas.totalConcluidos));
    preencher("statusPendentes", numero(metricas.alunosEmAndamento));

    // Não existe registro de atividades atrasadas no banco.
    preencher("statusAtrasadas", "—");
  }

  function ranking(lista) {
    return lista
      .slice()
      .sort((a, b) => b._inscricoes - a._inscricoes)
      .slice(0, 5);
  }

  function renderRanking(lista) {
    const container = document.getElementById("rankingCursos");
    if (!container) return;

    if (!lista.length) {
      container.innerHTML =
        '<p class="vazio">Nenhum curso encontrado com os filtros selecionados.</p>';
      return;
    }

    const top = ranking(lista);
    const maior = Math.max(1, ...top.map((c) => c._inscricoes));

    container.innerHTML = top
      .map((curso) => {
        const porcentagem = Math.min(
          100,
          (curso._inscricoes * 100) / maior
        );

        return `
          <div class="ranking-item">
            <div class="ranking-item-header">
              <span>${esc(curso.nome || "Curso")}</span>
              <strong>${curso._inscricoes}</strong>
            </div>
            <div class="barra">
              <div style="width:${porcentagem}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function atualizarTela() {
    const lista = dadosFiltrados();

    atualizarMetricas();
    atualizarStatus();
    criarGraficoCursos(lista);
    criarGraficoStatus();
    renderRanking(lista);

    return lista;
  }

  async function atualizar() {
    const numeroRequisicao = ++requisicaoAtual;

    const periodo = Number(filtroPeriodo?.value) || 30;
    const curso = filtroCurso?.value || "";

    const parametros = new URLSearchParams();
    parametros.set("periodo", String(periodo));

    if (curso) {
      parametros.set("curso", curso);
    }

    try {
      const resposta = await fetch(
        `/api/professor/relatorios?${parametros.toString()}`,
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível carregar os relatórios."
        );
      }

      if (!dados.sucesso) {
        throw new Error("A API não retornou os dados do relatório.");
      }

      // Ignora respostas antigas se o usuário mudar os filtros rapidamente.
      if (numeroRequisicao !== requisicaoAtual) return [];

      dadosRelatorio = dados;

      if (!cursosFiltroCarregado) {
        carregarCursosFiltro(dados.cursos);
        cursosFiltroCarregado = true;
      }

      atualizarRotulos();

      return atualizarTela();
    } catch (erro) {
      if (numeroRequisicao !== requisicaoAtual) return [];

      console.error("Erro ao carregar relatórios:", erro);

      dadosRelatorio = null;

      preencher("totalInscricoes", "—");
      preencher("totalConcluidos", "—");
      preencher("atividadesPendentes", "—");
      preencher("receitaTotal", "—");
      preencher("statusConcluidas", "—");
      preencher("statusAtrasadas", "—");
      preencher("statusPendentes", "—");

      const rankingContainer = document.getElementById("rankingCursos");

      if (rankingContainer) {
        rankingContainer.innerHTML =
          '<p class="vazio">Não foi possível carregar os relatórios. Tente novamente.</p>';
      }

      if (window.HS?.notificar) {
        HS.notificar(
          "Erro nos relatórios",
          erro.message,
          "erro",
          "professor"
        );
      }

      return [];
    }
  }

  function obterPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(
        "Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente."
      );
      return null;
    }

    return window.jspdf.jsPDF;
  }

  carregarCursosFiltro([]);
  atualizarRotulos();

  filtroCurso?.addEventListener("change", atualizar);
  filtroPeriodo?.addEventListener("change", atualizar);

  document.getElementById("btnRelatorio")?.addEventListener("click", async () => {
    await atualizar();

    if (!dadosRelatorio) return;

    if (window.HS?.notificar) {
      HS.notificar(
        "Relatório gerado",
        "Relatório atualizado com sucesso.",
        "relatorio",
        "professor"
      );
    }

    alert("Relatório atualizado com os filtros selecionados.");
  });

  document.getElementById("btnDownload")?.addEventListener("click", async () => {
    const jsPDF = obterPDF();
    if (!jsPDF) return;

    if (!dadosRelatorio) {
      await atualizar();
    }

    if (!dadosRelatorio) return;

    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Relatório Geral da Plataforma", 20, 20);

      doc.setFontSize(12);
      doc.text(
        `Total de Inscrições: ${numero(dadosRelatorio.metricas.totalInscricoes)}`,
        20,
        40
      );

      doc.text(
        `Conclusões de Curso: ${numero(dadosRelatorio.metricas.totalConcluidos)}`,
        20,
        55
      );

      doc.text(
        `Alunos em andamento: ${numero(dadosRelatorio.metricas.alunosEmAndamento)}`,
        20,
        70
      );

      doc.text(
        `Receita Gerada: ${formatarMoeda(dadosRelatorio.metricas.receitaTotal)}`,
        20,
        85
      );

      if (filtroCurso?.value) {
        const curso = dadosRelatorio.cursos.find(
          (c) => String(c.cursoId) === filtroCurso.value
        );

        if (curso) {
          doc.text(`Curso: ${curso.cursoNome}`, 20, 100);
        }
      }

      doc.text(
        `Período analisado: últimos ${dadosRelatorio.periodo} dias`,
        20,
        115
      );

      doc.text(
        `Cursos analisados: ${dadosRelatorio.cursos.length}`,
        20,
        130
      );

      doc.save("relatorio-geral.pdf");
    } catch (erro) {
      console.error("Erro ao gerar PDF:", erro);
      alert("Não foi possível gerar o relatório.");
    }
  });

  document.getElementById("btnBaixarRanking")?.addEventListener("click", async () => {
    const jsPDF = obterPDF();
    if (!jsPDF) return;

    if (!dadosRelatorio) {
      await atualizar();
    }

    if (!dadosRelatorio) return;

    try {
      const doc = new jsPDF();
      const top = ranking(dadosFiltrados());

      doc.setFontSize(18);
      doc.text("Ranking de Cursos com Mais Inscrições", 20, 20);

      doc.setFontSize(12);

      if (!top.length) {
        doc.text(
          "Nenhum curso encontrado com os filtros selecionados.",
          20,
          40
        );
      } else {
        let y = 40;

        top.forEach((curso, index) => {
          const texto = `${index + 1}º - ${curso.nome} (${curso._inscricoes} inscrições)`;

          doc.text(texto, 20, y);
          y += 15;

          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
      }

      doc.save("ranking-cursos.pdf");
    } catch (erro) {
      console.error("Erro ao gerar ranking:", erro);
      alert("Não foi possível gerar o ranking.");
    }
  });

  atualizar();
})();
