# Backend — Habilita Saúde

## Sobre

Backend do projeto Habilita Saúde, desenvolvido com Node.js, Express e MySQL. Responsável por receber as requisições do frontend, validar os dados e realizar operações no banco de dados.

## Tecnologias

- Node.js
- Express
- MySQL
- mysql2
- dotenv
- bcrypt

## Requisitos

- Node.js instalado
- MySQL Server instalado e em execução
- Banco de dados `habilita_saude` criado a partir do script SQL do projeto

## Instalação

No terminal, acesse a pasta `app`:

```bash
cd app
```

Instale as dependências:

```bash
npm install
```

## Configuração do ambiente

Crie um arquivo `.env` dentro da pasta `app`, utilizando o seguinte modelo:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=habilita_saude
PORT=3000
```

Substitua `sua_senha` pela senha configurada no MySQL.

**Importante:** o arquivo `.env` contém informações privadas e não deve ser enviado ao GitHub.

## Executar o servidor

Dentro da pasta `app`, execute:

```bash
node server.js
```

O servidor ficará disponível em:

`http://localhost:3000`

## Rotas disponíveis

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/status` | Testar a conexão com o MySQL |
| POST | `/api/alunos` | Cadastrar um aluno |
| POST | `/api/professores` | Cadastrar um professor |

## Testes

Acesse `http://localhost:3000/api/status` no navegador para verificar a conexão com o banco.

As rotas de cadastro recebem dados em formato JSON.

## Segurança

- Senhas armazenadas utilizando hash com bcrypt.
- Consultas SQL parametrizadas.
- Credenciais mantidas em variáveis de ambiente.
- Arquivos sensíveis excluídos do controle de versão por meio do `.gitignore`.

## Observação

O backend está em desenvolvimento. As rotas e funcionalidades serão ampliadas conforme a integração com o frontend do Habilita Saúde.