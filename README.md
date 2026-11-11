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

- Visualização de cursos
- Acompanhamento de progresso
- Certificados
- Notificações

### Área do professor

- Dashboard
- Criação e gerenciamento de cursos
- Edição e exclusão de cursos
- Upload de imagens para os cursos
- Relatórios
- Gerenciamento de usuários
- Notificações
- Suporte

> **Status:** Em desenvolvimento. O projeto está passando por etapas de integração entre o frontend, a API e o banco de dados MySQL. Algumas funcionalidades ainda utilizam dados locais ou demonstrativos.

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
├── img/                    # Imagens do projeto
├── media/                  # Vídeos e outros arquivos
├── uploads/
│   └── cursos/             # Imagens enviadas pelos professores
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

## 6. Upload de imagens dos cursos

O sistema permite que professores enviem imagens para os cursos.

- As imagens são recebidas pelo backend utilizando Multer.
- Os arquivos são armazenados na pasta `uploads/cursos/`.
- O caminho da imagem é registrado no banco de dados.
- Ao substituir a imagem de um curso, a imagem anterior é removida do armazenamento.
- Ao excluir um curso, sua imagem também é removida.

A pasta `uploads/cursos/` é utilizada para armazenar os arquivos enviados durante a utilização da plataforma.

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