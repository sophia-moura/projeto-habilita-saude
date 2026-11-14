# Habilita Saúde

Plataforma de cursos online voltada para profissionais e estudantes da área da saúde, desenvolvida durante a Residência em TIC do Porto Digital.

## Tecnologias

- HTML5, CSS3 e JavaScript
- Node.js e Express
- MySQL
- bcrypt para hash de senhas
- express-session para gerenciamento de sessões
- Multer para upload de arquivos
- Git e GitHub
- Figma

## Funcionalidades

### Área do aluno

- Visualização de cursos disponíveis
- Visualização de cursos adquiridos e matrículas
- Acesso aos conteúdos dos cursos
- Visualização de aulas em diferentes formatos
- Realização de quizzes
- Acompanhamento do progresso das aulas e cursos
- Marcação de aulas como concluídas
- Certificados
- Notificações

### Área do professor

- Dashboard
- Criação e gerenciamento de cursos
- Edição e exclusão de cursos
- Publicação e gerenciamento de cursos
- Upload de imagens dos cursos
- Criação e organização de módulos e aulas
- Adição de conteúdos em diferentes formatos
- Upload de arquivos para as aulas
- Criação de quizzes com perguntas e alternativas
- Gerenciamento de usuários
- Relatórios
- Notificações
- Suporte

### Backend e integração

- API REST desenvolvida com Node.js e Express
- Integração com banco de dados MySQL
- Cadastro e autenticação de usuários
- Gerenciamento de sessões
- Controle de acesso por tipo de usuário
- Gerenciamento de cursos, módulos e aulas
- Registro de matrículas e progresso
- Simulação de pagamentos em ambiente de desenvolvimento

> **Status:** Em desenvolvimento. As principais integrações entre frontend, API e banco de dados já foram implementadas. Algumas funcionalidades ainda estão em desenvolvimento ou utilizam dados demonstrativos.

## Estrutura do projeto

```text
projeto-habilita-saude/
├── app/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
├── banco/
│   └── habilita_saude_bd.sql
├── css/
├── js/
├── img/
├── media/
├── uploads/
│   ├── cursos/
│   └── conteudos/
├── *.html
├── .gitignore
└── README.md
```

A pasta `.env` contém configurações locais e não deve ser enviada ao GitHub. A pasta `uploads/` armazena arquivos enviados durante a utilização da plataforma e também deve ser ignorada pelo Git.

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

PAGAMENTO_SIMULADO=true
```

Ajuste `DB_USER` e `DB_PASSWORD` de acordo com as credenciais configuradas no seu MySQL.

### Gerar uma chave de sessão

Para gerar uma chave aleatória, execute:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e coloque no campo `SESSION_SECRET` do arquivo `.env`.

> **Importante:** nunca compartilhe o arquivo `.env` ou envie suas credenciais ao GitHub. Certifique-se de que ele esteja incluído no `.gitignore`.

## 4. Executar o backend e o frontend

Na pasta `app`, execute:

```bash
node server.js
```

Se estiver tudo configurado corretamente, o servidor ficará disponível em:

```text
http://localhost:3000
```

O próprio backend disponibiliza os arquivos HTML, CSS, JavaScript e imagens do frontend. Portanto, não é necessário iniciar o Live Server separadamente.

Acesse a plataforma pelo navegador:

[http://localhost:3000](http://localhost:3000)

Para verificar o funcionamento da API, acesse:

[http://localhost:3000/api/status](http://localhost:3000/api/status)

Mantenha o terminal aberto enquanto utiliza a plataforma.

## 5. Autenticação

- O cadastro e o login são processados pelo backend.
- As senhas são armazenadas utilizando hash com bcrypt.
- A autenticação utiliza sessões gerenciadas pelo express-session.
- Os cookies são utilizados para manter a sessão do usuário.
- As requisições autenticadas do frontend devem utilizar `credentials: "include"`.
- O sistema possui controle de acesso de acordo com o tipo de usuário.

## 6. Gerenciamento de cursos e conteúdos

O sistema permite que professores criem e gerenciem cursos, organizando seus conteúdos em módulos e aulas.

Os conteúdos podem utilizar diferentes formatos, como:

- Vídeos
- PDFs
- E-books
- Slides
- Mapas
- Quizzes
- Estudos de caso
- Materiais
- Links externos
- Textos

Os conteúdos são armazenados no banco de dados e disponibilizados aos alunos conforme as regras de acesso da plataforma.

## 7. Upload de arquivos

O sistema utiliza Multer para receber arquivos enviados pelos professores.

- As imagens dos cursos são armazenadas na pasta de uploads correspondente.
- Os arquivos utilizados nas aulas são armazenados em `uploads/conteudos/`.
- Os caminhos dos arquivos são registrados no banco de dados.
- O backend disponibiliza os arquivos para acesso pela plataforma.

A pasta `uploads/` contém arquivos gerados durante a utilização do sistema e não deve ser versionada no Git.

## 8. Pagamentos

O projeto possui uma funcionalidade de simulação de pagamentos para testes em ambiente de desenvolvimento.

Para habilitar a simulação, configure no `.env`:

```env
PAGAMENTO_SIMULADO=true
```

Essa configuração não representa uma integração com um serviço real de pagamentos.

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