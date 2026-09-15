const cursos = JSON.parse(localStorage.getItem("cursos")) || [];

const faturamentoBruto = cursos.reduce(
  (acc, curso) => acc + curso.preco * curso.vendas,
  0,
);

const totalVendas = cursos.reduce((acc, curso) => acc + curso.vendas, 0);

const taxaPlataforma = faturamentoBruto * 0.1;

const impostos = faturamentoBruto * 0.15;

const receitaLiquida = faturamentoBruto - taxaPlataforma - impostos;

const saldoDisponivel = receitaLiquida * 0.45;

document.getElementById("faturamentoBruto").textContent =
  formatarMoeda(faturamentoBruto);

document.getElementById("receitaLiquida").textContent =
  formatarMoeda(receitaLiquida);

document.getElementById("saldoDisponivel").textContent =
  formatarMoeda(saldoDisponivel);

document.getElementById("totalVendas").textContent = totalVendas;

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

new Chart(document.getElementById("graficoGanhos"), {
  type: "line",

  data: {
    labels: cursos.map((c) => c.nome),

    datasets: [
      {
        label: "Receita",

        data: cursos.map((c) => c.preco),

        tension: 0.4,
      },
    ],
  },
});

document.getElementById("btnSaque").addEventListener("click", () => {
  alert("Solicitação enviada!");
});

const tabela = document.getElementById("tabelaRepasses");

cursos.forEach((curso) => {
  tabela.innerHTML += `
    <tr>
      <td>08/06/2026</td>
      <td>${curso.nome}</td>
      <td>${curso.preco}</td>
      <td>10%</td>
      <td>15%</td>
      <td>${(curso.preco * 0.75).toFixed(2)}</td>
    </tr>
  `;
});

function criarNotificacao(titulo, descricao, tipo) {
  const notificacoes = JSON.parse(localStorage.getItem("notificacoes")) || [];

  notificacoes.unshift({
    id: Date.now(),
    titulo,
    descricao,
    tipo,
    lida: false,
    data: new Date().toLocaleString("pt-BR"),
  });

  localStorage.setItem("notificacoes", JSON.stringify(notificacoes));
}

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
  const dados = JSON.parse(localStorage.getItem("dadosBancarios"));

  if (!dados) return;

  bancoUsuario.textContent = dados.banco;
  agenciaUsuario.textContent = dados.agencia;
  contaUsuario.textContent = dados.conta;
}

carregarDadosBancarios();

btnEditarBanco.addEventListener("click", () => {
  modalBanco.style.display = "flex";

  inputBanco.value = bancoUsuario.textContent;
  inputAgencia.value = agenciaUsuario.textContent;
  inputConta.value = contaUsuario.textContent;
});

salvarBanco.addEventListener("click", () => {
  const dados = {
    banco: inputBanco.value,
    agencia: inputAgencia.value,
    conta: inputConta.value,
  };

  localStorage.setItem("dadosBancarios", JSON.stringify(dados));

  carregarDadosBancarios();

  modalBanco.style.display = "none";

  alert("Dados bancários atualizados!");
});


document
  .getElementById("btnRelatorio")
  .addEventListener("click", () => {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.text("Relatório Financeiro", 20, 20);

    doc.text(
      "Faturamento: " +
      document.getElementById("faturamentoBruto").textContent,
      20,
      40
    );

    doc.text(
      "Receita Líquida: " +
      document.getElementById("receitaLiquida").textContent,
      20,
      60
    );

    doc.save("relatorio-financeiro.pdf");
  });
