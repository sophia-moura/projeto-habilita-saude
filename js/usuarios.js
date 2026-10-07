const tabelaAlunos = document.getElementById("tabelaUsuarios");
const selCurso = document.getElementById("filtroCurso");
const selStatus = document.getElementById("filtroStatus");
const campoBuscaAluno = document.getElementById("buscarAluno");

const cursosProf = JSON.parse(localStorage.getItem("cursos") || "[]");
cursosProf.forEach((c) => selCurso.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nome}</option>`));

const matriculas = HS.matriculas();

function metricas() {
  const emails = new Set(matriculas.map((m) => m.email));
  const ativos = new Set(matriculas.filter((m) => m.status !== "concluido").map((m) => m.email));
  const semana = Date.now() - 7 * 864e5;
  document.getElementById("totalAlunos").textContent = emails.size;
  document.getElementById("alunosAtivos").textContent = ativos.size;
  document.getElementById("concluintes").textContent = matriculas.filter((m) => m.status === "concluido").length;
  document.getElementById("novosSemana").textContent = new Set(matriculas.filter((m) => new Date(m.data) > semana).map((m) => m.email)).size;
}

function render() {
  const texto = campoBuscaAluno.value.toLowerCase();
  const lista = matriculas.filter((m) =>
    (!texto || m.nome.toLowerCase().includes(texto) || m.email.toLowerCase().includes(texto)) &&
    (!selCurso.value || String(m.cursoId) === selCurso.value) &&
    (selStatus.value === "Todos os Status" || (selStatus.value === "Concluído") === (m.status === "concluido")));

  if (!lista.length) {
    tabelaAlunos.innerHTML = `<tr><td colspan="5" class="vazio">Nenhum aluno cadastrado.</td></tr>`;
    return;
  }
  tabelaAlunos.innerHTML = lista.map((m) => {
    const curso = cursosProf.find((c) => c.id === m.cursoId);
    const cert = m.status === "concluido" && curso?.certificado !== "Sem Certificado" ? "Emitido" : "—";
    return `<tr><td>${m.nome}<br><small>${m.email}</small></td><td>${m.cursoNome}</td><td>${m.progresso}%</td><td>${cert}</td><td>—</td></tr>`;
  }).join("");
}

[campoBuscaAluno].forEach((e) => e.addEventListener("input", render));
[selCurso, selStatus].forEach((e) => e.addEventListener("change", render));
metricas();
render();
