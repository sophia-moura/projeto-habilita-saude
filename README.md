# Habilita Saúde

Plataforma de cursos online voltada para profissionais e estudantes da área da saúde, desenvolvida durante a Residência Porto Digital.

## Tecnologias

- HTML5, CSS3 e JavaScript
- Node.js e Express
- MySQL
- bcrypt para hash de senhas
- express-session para gerenciamento de sessões
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
- Criação e gerenciamento de cursos
- Relatórios
- Gerenciamento de usuários
- Notificações
- Suporte

> **Status:** Em desenvolvimento. Algumas funcionalidades ainda utilizam dados locais ou demonstrativos e estão passando por integração com a API e o banco de dados MySQL.

## Estrutura do projeto

```text
projeto-habilita-saude/
├── app/                    # Backend Node.js/Express
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env                # Configurações locais (não versionado)
├── banco/
│   └── habilita_saude_bd.sql
├── css/                    # Arquivos de estilo
├── js/                     # Scripts JavaScript
├── img/                    # Imagens
├── media/                  # Vídeos e outros arquivos
├── *.html                  # Páginas da plataforma
├── .gitignore
└── README.md
```

## Pré-requisitos

Antes de começar, instale:

- [Node.js (LTS)](https://nodejs.org/) — inclui npm
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- [Git](https://git-scm.com/downloads)
- [Visual Studio Code](https://code.visualstudio.com/) ou outro editor de código

Para verificar as instalações, execute no terminal:

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

Substitua `URL_DO_REPOSITORIO` pelo endereço HTTPS ou SSH do repositório no GitHub.

## 2. Configurar o banco de dados

1. Inicie o serviço do MySQL.
2. Abra o MySQL Workbench ou o terminal MySQL.
3. Execute o script `banco/habilita_saude_bd.sql`.

O script cria o banco de dados `habilita_saude` e suas respectivas tabelas.

Exemplo de execução pelo terminal, na raiz do projeto:

```bash
mysql -u root -p < banco/habilita_saude_bd.sql
```

Digite a senha do MySQL quando solicitado.

> **Atenção:** o script também contém registros fictícios para testes. Execute-o apenas em um ambiente de desenvolvimento. Caso já exista um banco com informações importantes, faça um backup antes de executar o script.

## 3. Configurar o backend

Abra um terminal na pasta `app`:

```bash
cd app
npm install
```

Crie um arquivo `.env` dentro da pasta `app`, utilizando a seguinte estrutura:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=habilita_saude

SESSION_SECRET=coloque_uma_chave_aleatoria_grande_e_secreta
PORT=3000
```

Ajuste `DB_USER` e `DB_PASSWORD` de acordo com as credenciais configuradas no seu MySQL.

### Gerar uma chave de sessão

Para gerar uma chave aleatória, execute:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e coloque no campo `SESSION_SECRET` do arquivo `.env`.

> **Importante:** nunca compartilhe o arquivo `.env` ou envie suas credenciais ao GitHub. Certifique-se de que ele esteja incluído no `.gitignore`.

## 4. Executar o backend

Ainda dentro da pasta `app`, execute:

```bash
node server.js
```

Se estiver tudo configurado corretamente, o servidor ficará disponível em:

```text
http://localhost:3000
```

Para verificar o funcionamento da API, acesse:

```text
http://localhost:3000/api/status
```

Mantenha o terminal aberto enquanto utiliza a plataforma.

## 5. Executar o frontend

O frontend é composto por arquivos HTML, CSS e JavaScript.

Uma opção recomendada para desenvolvimento é utilizar a extensão **Live Server** no Visual Studio Code.

1. Abra a pasta do projeto no VS Code.
2. Instale a extensão Live Server, caso ainda não esteja instalada.
3. Clique com o botão direito no arquivo `index.html`.
4. Selecione **Open with Live Server**.
5. Acesse o endereço local fornecido pela extensão.

Preferencialmente, utilize:

```text
http://localhost:3000
```

Essa é a origem esperada na configuração de CORS do backend. Caso o Live Server utilize outra porta, será necessário ajustar a origem permitida no `app/server.js`.

## 6. Fluxo de execução resumido

Para utilizar a plataforma localmente, mantenha dois terminais abertos.

**Terminal 1 — Backend**

```bash
cd app
npm install
node server.js
```

**Terminal 2 — Frontend**

Abra o arquivo `index.html` com o Live Server no VS Code.

Depois, acesse a página inicial pelo endereço fornecido pela extensão.

## Autenticação

- O cadastro e o login são processados pelo backend.
- As senhas são armazenadas utilizando hash com bcrypt.
- A autenticação utiliza sessões gerenciadas pelo express-session.
- Os cookies são utilizados para manter a sessão do usuário.
- As requisições autenticadas do frontend devem utilizar `credentials: "include"`.

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