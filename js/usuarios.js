const tabela = document.getElementById("tabelaUsuarios");

if(alunos.length === 0){
  tabela.innerHTML = `
    <tr>
      <td colspan="5" class="vazio">
        Nenhum aluno cadastrado.
      </td>
    </tr>
  `;
}