const CAMPOS = [
  ["chMin", "Carga horária mínima (h)"], ["chMax", "Carga horária máxima (h)"],
  ["precoMin", "Preço mínimo (R$)"], ["precoMax", "Preço máximo (R$)"],
  ["docente", "Repasse ao professor (%)"], ["aprovacao", "Aprovação do aluno (%)"],
  ["notaMin", "Nota mínima da curadoria (0-10)"], ["prazo", "Prazo da curadoria (dias úteis)"],
];
function montar() {
  const cfg = HS.niveis();
  document.getElementById("formNiveis").innerHTML =
    `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Parâmetro</th>` +
    Object.values(cfg).map((n) => `<th style="padding:8px">${n.nome}</th>`).join("") + `</tr></thead><tbody>` +
    CAMPOS.map(([c, rot]) => `<tr><td style="padding:8px">${rot}</td>` +
      Object.keys(cfg).map((k) => `<td style="padding:6px"><input type="number" step="any" data-k="${k}" data-c="${c}" value="${cfg[k][c]}" style="width:110px;padding:6px"></td>`).join("") + `</tr>`).join("") +
    `</tbody></table>`;
}
document.getElementById("salvarNiveis").addEventListener("click", () => {
  const cfg = {};
  document.querySelectorAll("#formNiveis input").forEach((i) => {
    (cfg[i.dataset.k] ||= {})[i.dataset.c] = Number(i.value);
  });
  HS.salvarNiveis(cfg);
  alert("Parâmetros atualizados!");
});
document.getElementById("restaurarNiveis").addEventListener("click", () => {
  if (!confirm("Restaurar os valores originais do documento?")) return;
  HS.restaurarNiveis();
  montar();
});
montar();
