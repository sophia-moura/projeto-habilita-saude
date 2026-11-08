# Habilita Saúde

Plataforma de cursos online voltada para profissionais e estudantes da área da saúde, desenvolvida durante a Residência Porto Digital.

## Tecnologias

- HTML5, CSS3 e JavaScript
- Node.js e Express
- MySQL
- bcrypt para hash de senhas
- express-session para sessões de autenticação
- Git e GitHub
- Figma

## Funcionalidades

### Área do aluno
- Visualização de cursos
- Acompanhamento de progresso
- Certificados
- Notificações

### Área do professor
- Dashboard
- Gerenciamento e criação de cursos
- Relatórios
- Usuários
- Notificações
- Suporte

> **Status:** Em desenvolvimento. Algumas funcionalidades ainda utilizam dados locais/demonstrativos e estão sendo integradas ao backend e ao MySQL.

## Estrutura do projeto

```text
projeto-habilita-saude/
├── app/                    # Backend Node.js/Express
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env                # Criado localmente (não versionado)
├── banco/
│   └── habilita_saude_bd.sql
├── css/                    # Estilos
├── js/                     # Scripts do frontend
├── img/                    # Imagens
├── media/                  # Vídeos e outros arquivos
├── *.html                  # Páginas da plataforma
└── README.md
```

## Pré-requisitos

Instale antes de começar:

- [Node.js (LTS)](https://nodejs.org/) — inclui npm
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- [Git](https://git-scm.com/downloads)
- Um editor, como [Visual Studio Code](https://code.visualstudio.com/)

Confira as instalações no terminal:

```bash
node -v
npm -v
mysql --version
git --version
```

## 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
cd projeto-habilita-saude
```

Substitua `URL_DO_REPOSITORIO` pela URL HTTPS ou SSH do repositório GitHub.

## 2. Configurar o banco de dados

1. Inicie o serviço do MySQL.
2. Abra o MySQL Workbench ou o terminal MySQL.
3. Execute o script `banco/habilita_saude_bd.sql`.

O script cria o banco `habilita_saude` e suas tabelas.

Exemplo pelo terminal, na raiz do projeto:

```bash
mysql -u root -p < banco/habilita_saude_bd.sql
```

Digite a senha do MySQL quando solicitado.

> O script também contém registros fictícios de teste. Execute-o apenas em um ambiente de desenvolvimento. Caso já exista um banco com dados importantes, faça backup antes de executar scripts que recriem ou alterem estruturas.

## 3. Configurar o backend

Abra um terminal na pasta `app`:

```bash
cd app
npm install
```

Crie um arquivo `.env` dentro de `app/`, baseado neste exemplo:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=habilita_saude

SESSION_SECRET=coloque_uma_chave_aleatoria_grande_e_secreta
PORT=3000
```

Ajuste `DB_USER` e `DB_PASSWORD` para as credenciais do seu MySQL.

### Gerar uma chave de sessão

No terminal, execute:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado para `SESSION_SECRET` no `.env`.

> **Importante:** não compartilhe o `.env` e não o envie ao GitHub. Ele contém credenciais e segredos. O arquivo deve estar incluído no `.gitignore`.

## 4. Executar o backend

Ainda dentro da pasta `app`:

```bash
node server.js
```

Se estiver tudo configurado corretamente, o servidor ficará disponível em:

```text
http://localhost:3000
```

Para testar o status da API, abra:

```text
http://localhost:3000/api/status
```

Mantenha esse terminal aberto enquanto utiliza a plataforma.

## 5. Executar o frontend

O frontend é composto por arquivos HTML, CSS e JavaScript.

Uma opção recomendada para desenvolvimento é usar a extensão **Live Server** no Visual Studio Code:

1. Abra a pasta do projeto no VS Code.
2. Instale a extensão Live Server, caso ainda não tenha.
3. Clique com o botão direito em `index.html`.
4. Selecione **Open with Live Server**.
5. Acesse a URL local exibida pela extensão.

Use preferencialmente `http://localhost:5500` para manter a origem configurada no CORS do backend. Se o Live Server usar outra porta, ajuste a origem permitida no `app/server.js`.

## 6. Fluxo de execução resumido

Abra **dois terminais**:

**Terminal 1 — Backend**
```bash
cd app
npm install
node server.js
```

**Terminal 2 — Frontend**
- Abra `index.html` com Live Server no VS Code.

Depois, acesse a página inicial pelo endereço fornecido pelo Live Server.

## Autenticação

- O cadastro e login são processados pelo backend.
- As senhas são armazenadas com hash usando bcrypt.
- A autenticação utiliza sessões (`express-session`) e cookies.
- O frontend deve enviar requisições autenticadas com `credentials: "include"`.

## Equipe

- Paulo Vitor
- Sophia
- Rafael
- Jayme
- Maria Eduarda
- Arthur
- Sarah
- Anna Luisa
- Jhony
- Vinicius

## Residência Porto Digital

Projeto desenvolvido como atividade da Residência em TIC do Porto Digital.
