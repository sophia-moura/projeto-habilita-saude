# Habilita Saúde

Plataforma de cursos online voltada para profissionais e estudantes da área da saúde, desenvolvida durante a Residência em TIC do Porto Digital.

## Tecnologias

- HTML5, CSS3 e JavaScript
- Node.js e Express
- MySQL
- mysql2 para conexão com o banco de dados
- bcrypt para hash de senhas
- express-session para gerenciamento de sessões
- Multer para upload de arquivos
- Playwright e Chromium para geração de certificados em PDF
- Chart.js para gráficos e visualização de dados
- jsPDF para geração de documentos PDF
- Git e GitHub
- Figma

## Funcionalidades

### Área do aluno

- Visualização de cursos disponíveis
- Visualização de cursos adquiridos e matrículas
- Acesso aos conteúdos dos cursos
- Aulas em diferentes formatos
- Realização de quizzes
- Histórico de tentativas de quizzes
- Acompanhamento do progresso das aulas e cursos
- Registro e retomada do progresso dos vídeos
- Marcação de aulas como concluídas
- Emissão, visualização e download de certificados
- Validação de certificados
- Sistema de gamificação com XP, níveis e conquistas
- Check-in para participação na gamificação
- Notificações
- Preferências de tema e boas-vindas

### Área do professor

- Dashboard com informações gerais
- Criação e gerenciamento de cursos
- Edição, exclusão e publicação de cursos
- Upload de imagens dos cursos
- Criação e organização de módulos e aulas
- Definição e gerenciamento da carga horária dos módulos
- Adição de conteúdos em diferentes formatos
- Upload de arquivos para as aulas
- Criação e gerenciamento de quizzes com perguntas e alternativas
- Gerenciamento de usuários
- Relatórios com visualização de dados
- Gamificação e acompanhamento de informações dos alunos
- Gerenciamento financeiro
- Cadastro e atualização de dados bancários
- Solicitação e acompanhamento de saques
- Notificações
- Suporte

### Backend e integração

- API REST desenvolvida com Node.js e Express
- Integração com banco de dados MySQL
- Cadastro e autenticação de usuários
- Hash de senhas com bcrypt
- Gerenciamento de sessões
- Controle de acesso por tipo de usuário
- Gerenciamento de cursos, módulos e aulas
- Registro e gerenciamento de matrículas
- Registro do progresso das aulas e cursos
- Armazenamento do histórico de quizzes
- Gerenciamento de preferências dos usuários por meio da API
- Registro da conclusão das aulas
- Sistema de gamificação integrado ao banco de dados
- Gerenciamento de notificações
- Emissão e validação de certificados
- Geração de certificados em PDF com Playwright e Chromium
- Simulação de pagamentos em ambiente de desenvolvimento

> **Status:** Em desenvolvimento. As principais integrações entre frontend, API e banco de dados já foram implementadas. Os pagamentos permanecem simulados. A emissão de certificados em ambiente local utiliza URLs demonstrativas; para disponibilização em produção, é necessário configurar um endereço público HTTPS.

## Estrutura do projeto

```text
projeto-habilita-saude/
├── app/
│   ├── certificados/
│   │   ├── gerar-pdf.cjs
│   │   └── templates/
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
├── modelos-certificados/
├── uploads/
│   ├── cursos/
│   ├── conteudos/
│   ├── perfis/
│   └── storage-privado/
├── *.html
├── .gitignore
└── README.md
```

A pasta `app/.env` contém configurações locais e não deve ser enviada ao GitHub. A pasta `uploads/` armazena arquivos enviados durante a utilização da plataforma e também deve ser ignorada pelo Git. A pasta `app/node_modules/` contém as dependências instaladas pelo npm e não deve ser versionada.

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

NODE_ENV=development
CERTIFICADO_PUBLIC_URL=http://localhost:3000
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

## 4. Instalar o Chromium para geração de certificados

O projeto utiliza o Playwright para gerar certificados em PDF. A biblioteca Playwright é instalada junto com as dependências pelo `npm install`.

Após a instalação das dependências, execute na pasta `app`:

```bash
npx playwright install chromium
```

Esse comando instala o navegador Chromium utilizado pelo Playwright. Ele não instala o Google Chrome nem o Microsoft Edge.

A instalação do navegador precisa ser realizada no ambiente em que o projeto será executado.

## 5. Executar o backend e o frontend

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

## 6. Autenticação

- O cadastro e o login são processados pelo backend.
- As senhas são armazenadas utilizando hash com bcrypt.
- A autenticação utiliza sessões gerenciadas pelo express-session.
- Os cookies são utilizados para manter a sessão do usuário.
- As requisições autenticadas do frontend utilizam `credentials: "include"`.
- O sistema possui controle de acesso de acordo com o tipo de usuário.

## 7. Gerenciamento de cursos e conteúdos

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

Os módulos possuem carga horária própria, utilizada no gerenciamento e na validação da carga horária total do curso.

Os conteúdos são armazenados no banco de dados e disponibilizados aos alunos conforme as regras de acesso da plataforma.

## 8. Upload de arquivos

O sistema utiliza Multer para receber arquivos enviados pelos professores e usuários.

- As imagens dos cursos são armazenadas na pasta de uploads correspondente.
- Os arquivos utilizados nas aulas são armazenados em `uploads/conteudos/`.
- As imagens de perfil são armazenadas na estrutura de uploads correspondente.
- Os caminhos dos arquivos são registrados no banco de dados.
- O backend disponibiliza os arquivos conforme as regras de acesso da plataforma.

A pasta `uploads/` contém arquivos gerados durante a utilização do sistema e não deve ser versionada no Git.

## 9. Certificados

A plataforma permite emitir certificados em PDF após o cumprimento dos critérios de conclusão do curso.

- A geração dos PDFs utiliza Playwright e Chromium.
- Os certificados possuem código de identificação.
- A plataforma disponibiliza uma página para validação de certificados.
- A validação consulta os dados registrados no sistema.

Em ambiente de desenvolvimento, os certificados podem utilizar endereço local demonstrativo. Para emissão em produção, configure a variável `CERTIFICADO_PUBLIC_URL` no `.env` com o endereço público HTTPS da plataforma.

Exemplo:

```env
CERTIFICADO_PUBLIC_URL=http://localhost:3000
```

Não utilize `localhost` como endereço público de validação em produção.

## 10. Pagamentos

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