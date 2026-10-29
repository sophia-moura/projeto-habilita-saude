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

  const cursos = (() => {
    const lista = ler("cursos", []);
    return Array.isArray(lista) ? lista : [];
  })();

  const filtroCurso = document.getElementById("filtroCurso");
  const filtroPeriodo = document.getElementById("filtroPeriodo");

  const numero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const formatarMoeda = (valor) =>
    numero(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const matriculas = HS.matriculas();

  function carregarCursosFiltro() {
    if (!filtroCurso) return;
    filtroCurso.innerHTML =
      '<option value="">Todos os cursos</option>' +
      cursos
        .map((curso) => `<option value="${esc(String(curso.id))}">${esc(curso.nome || "Curso")}</option>`)
        .join("");
  }

  function dadosFiltrados() {
    const cursoId = filtroCurso?.value || "";
    const dias = Number(filtroPeriodo?.value) || 0;
    const corte = dias ? Date.now() - dias * 864e5 : 0;

    const mats = matriculas.filter((m) => {
      if (!dias) return true;
      const data = new Date(m.data);
      return !isNaN(data) && data.getTime() >= corte;
    });

    return cursos
      .filter((curso) => !cursoId || String(curso.id) === cursoId)
      .map((curso) => {
        const minhas = mats.filter((m) => String(m.cursoId) === String(curso.id));
        const inscricoes = dias ? minhas.length : numero(curso.alunos) || minhas.length;
        const concluidos = minhas.filter((m) => m.status === "concluido").length;
        return {
          ...curso,
          _inscricoes: inscricoes,
          _concluidos: concluidos,
          _pendentes: Math.max(0, inscricoes - concluidos),
        };
      });
  }

  function preencher(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  }

  function atualizarMetricas(lista) {
    const inscricoes = lista.reduce((t, c) => t + c._inscricoes, 0);
    const concluidos = lista.reduce((t, c) => t + c._concluidos, 0);
    const pendentes = lista.reduce((t, c) => t + c._pendentes, 0);
    const receita = lista.reduce((t, c) => t + c._inscricoes * numero(c.preco), 0);
    preencher("totalInscricoes", inscricoes);
    preencher("totalConcluidos", concluidos);
    preencher("atividadesPendentes", pendentes);
    preencher("receitaTotal", formatarMoeda(receita));
  }

  let graficoCursos = null;
  let graficoStatus = null;

  function semChart(canvas) {
    if (!canvas) return;
    canvas.style.display = "none";
    if (!canvas.nextElementSibling || !canvas.nextElementSibling.classList.contains("vazio")) {
      const aviso = document.createElement("p");
      aviso.className = "vazio";
      aviso.textContent = "Não foi possível carregar o gráfico. Verifique sua conexão.";
      canvas.insertAdjacentElement("afterend", aviso);
    }
  }

  function criarGraficoCursos(lista) {
    const canvas = document.getElementById("graficoCursos");
    if (!canvas) return;
    if (!window.Chart) return semChart(canvas);

    const labels = lista.length ? lista.map((c) => c.nome || "Curso") : ["Sem dados"];
    const data = lista.length ? lista.map((c) => c._inscricoes) : [0];

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
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  function criarGraficoStatus(lista) {
    const canvas = document.getElementById("graficoStatus");
    if (!canvas) return;
    if (!window.Chart) return semChart(canvas);

    const concluidas = lista.reduce((t, c) => t + c._concluidos, 0);
    const pendentes = lista.reduce((t, c) => t + c._pendentes, 0);
    const atrasadas = Math.floor(pendentes * 0.3);
    const data = [concluidas, atrasadas, pendentes];

    if (graficoStatus) {
      graficoStatus.data.datasets[0].data = data;
      graficoStatus.update();
      return;
    }

    graficoStatus = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Concluídas", "Atrasadas", "Pendentes"],
        datasets: [
          {
            data,
            backgroundColor: ["#3e9c2d", "#b7791f", "#0055c3"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  function atualizarStatus(lista) {
    const concluidas = lista.reduce((t, c) => t + c._concluidos, 0);
    const pendentes = lista.reduce((t, c) => t + c._pendentes, 0);
    preencher("statusConcluidas", concluidas);
    preencher("statusPendentes", pendentes);
    preencher("statusAtrasadas", Math.floor(pendentes * 0.3));
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
      container.innerHTML = `<p class="vazio">Nenhum curso encontrado com os filtros selecionados.</p>`;
      return;
    }

    const top = ranking(lista);
    const maior = Math.max(1, ...top.map((c) => c._inscricoes));

    container.innerHTML = top
      .map((curso) => {
        const porcentagem = Math.min(100, (curso._inscricoes * 100) / maior);
        return `
      <div class="ranking-item">
        <div class="ranking-item-header">
          <span>${esc(curso.nome || "Curso")}</span>
          <strong>${curso._inscricoes}</strong>
        </div>
        <div class="barra"><div style="width:${porcentagem}%"></div></div>
      </div>`;
      })
      .join("");
  }

  function atualizar() {
    const lista = dadosFiltrados();
    atualizarMetricas(lista);
    atualizarStatus(lista);
    criarGraficoCursos(lista);
    criarGraficoStatus(lista);
    renderRanking(lista);
    return lista;
  }

  carregarCursosFiltro();
  filtroCurso?.addEventListener("change", atualizar);
  filtroPeriodo?.addEventListener("change", atualizar);
  atualizar();

  document.getElementById("btnRelatorio")?.addEventListener("click", () => {
    atualizar();
    if (window.HS && HS.notificar) {
      HS.notificar("Relatório gerado", "Relatório criado com sucesso", "relatorio", "professor");
    }
    alert("Relatório atualizado com os filtros selecionados.");
  });

  document.getElementById("btnDownload")?.addEventListener("click", () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.");
      return;
    }
    try {
      const lista = atualizar();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Relatório Geral da Plataforma", 20, 20);
      doc.setFontSize(12);
      doc.text(`Total de Inscrições: ${document.getElementById("totalInscricoes")?.textContent || 0}`, 20, 40);
      doc.text(`Conclusões de Curso: ${document.getElementById("totalConcluidos")?.textContent || 0}`, 20, 55);
      doc.text(`Atividades Pendentes: ${document.getElementById("atividadesPendentes")?.textContent || 0}`, 20, 70);
      doc.text(`Receita Gerada: ${document.getElementById("receitaTotal")?.textContent || "R$ 0,00"}`, 20, 85);
      if (filtroCurso?.value) {
        const curso = cursos.find((c) => String(c.id) === filtroCurso.value);
        if (curso) doc.text(`Curso: ${curso.nome}`, 20, 100);
      }
      if (lista.length) doc.text(`Cursos analisados: ${lista.length}`, 20, 115);
      doc.save("relatorio-geral.pdf");
    } catch (e) {
      console.error(e);
      alert("Não foi possível gerar o relatório.");
    }
  });

  document.getElementById("btnBaixarRanking")?.addEventListener("click", () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.");
      return;
    }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const top = ranking(dadosFiltrados());
      doc.setFontSize(18);
      doc.text("Ranking de Cursos Mais Acessados", 20, 20);
      doc.setFontSize(12);
      if (!top.length) {
        doc.text("Nenhum curso encontrado com os filtros selecionados.", 20, 40);
      } else {
        let y = 40;
        top.forEach((curso, index) => {
          doc.text(`${index + 1}º - ${curso.nome || "Curso"} (${curso._inscricoes} alunos)`, 20, y);
          y += 15;
        });
      }
      doc.save("ranking-cursos.pdf");
    } catch (e) {
      console.error(e);
      alert("Não foi possível gerar o ranking.");
    }
  });
})();
