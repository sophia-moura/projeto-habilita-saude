require("dotenv").config();

const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 2
    }
}));

const banco = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Testar a conexão
app.get("/api/status", async (req, res) => {
    try {
        await banco.query("SELECT 1");

        res.json({
            sucesso: true,
            mensagem: "API conectada ao MySQL!"
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao conectar ao banco."
        });
    }
});

// Função compartilhada pelas duas rotas de cadastro
async function cadastrarUsuario(req, res, tipo) {
    try {
        const { nome, email, senha } = req.body;

        if (
            typeof nome !== "string" ||
            typeof email !== "string" ||
            typeof senha !== "string"
        ) {
            return res.status(400).json({
                erro: "Informe nome, e-mail e senha."
            });
        }

        const nomeLimpo = nome.trim();
        const emailLimpo = email.trim().toLowerCase();

        if (
            !nomeLimpo ||
            nomeLimpo.length > 150 ||
            emailLimpo.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo) ||
            senha.length < 6
        ) {
            return res.status(400).json({
                erro: "Confira o nome, o e-mail e a senha. Use pelo menos 6 caracteres na senha."
            });
        }

        const tabela = tipo === "aluno" ? "aluno" : "professor";

        // A tabela vem apenas dos dois tipos definidos pelo servidor.
        const [existentes] = await banco.execute(
            `SELECT email FROM ${tabela} WHERE email = ?`,
            [emailLimpo]
        );

        if (existentes.length > 0) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado neste perfil."
            });
        }

        // A senha original nunca é gravada no banco.
        const senhaHash = await bcrypt.hash(senha, 12);

        const [resultado] = await banco.execute(
            `INSERT INTO ${tabela} (nome, email, senha_hash)
             VALUES (?, ?, ?)`,
            [nomeLimpo, emailLimpo, senhaHash]
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado com sucesso!",
            usuario: {
                id: resultado.insertId,
                nome: nomeLimpo,
                email: emailLimpo,
                tipo
            }
        });
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }

        console.error("Erro no cadastro:", erro);

        return res.status(500).json({
            erro: "Não foi possível realizar o cadastro."
        });
    }
}

// Cadastro de aluno
app.post("/api/alunos", (req, res) => {
    return cadastrarUsuario(req, res, "aluno");
});

// Cadastro de professor
app.post("/api/professores", (req, res) => {
    return cadastrarUsuario(req, res, "professor");
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, senha, tipo } = req.body;

        if (!email || !senha || !tipo) {
            return res.status(400).json({
                erro: "Informe email, senha e tipo de usuário."
            });
        }

        if (!["aluno", "professor"].includes(tipo)) {
            return res.status(400).json({
                erro: "Tipo de usuário inválido."
            });
        }

        const tabela = tipo === "aluno" ? "aluno" : "professor";
        const colunaId = tipo === "aluno" ? "id_aluno" : "id_professor";

        const [usuarios] = await banco.execute(
            `SELECT ${colunaId} AS id, nome, email, senha_hash
             FROM ${tabela}
             WHERE email = ?
             LIMIT 1`,
            [email.toLowerCase()]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                erro: "Email ou senha incorretos."
            });
        }

        const usuario = usuarios[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                erro: "Email ou senha incorretos."
            });
        }

        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: tipo
        };

        res.json({
            sucesso: true,
            mensagem: "Login realizado!",
            usuario: req.session.usuario
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao realizar login."
        });
    }
});

app.get("/api/usuario-logado", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            autenticado: false
        });
    }

    res.json({
        autenticado: true,
        usuario: req.session.usuario
    });
});

// Verificar se o usuário está autenticado
function exigirLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar autenticado."
        });
    }

    next();
}

// Verificar se o usuário autenticado é professor
function exigirProfessor(req, res, next) {
    if (!req.session.usuario || req.session.usuario.tipo !== "professor") {
        return res.status(403).json({
            erro: "Acesso permitido somente para professores."
        });
    }

    next();
}

app.post("/api/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao encerrar sessão."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            sucesso: true,
            mensagem: "Logout realizado."
        });
    });
});


/* =========================================
   CURSOS
========================================= */

// Listar cursos publicados
app.get("/api/cursos", async (req, res) => {
    try {
        const [cursos] = await banco.execute(`
            SELECT
                c.id_curso,
                c.nome_curso,
                c.descricao,
                c.preco,
                c.status,
                p.nome AS nome_professor
            FROM curso c
            JOIN professor p ON p.id_professor = c.id_professor
            WHERE c.status = 'publicado'
            ORDER BY c.id_curso DESC
        `);

        res.json(cursos);

    } catch (erro) {
        console.error("Erro ao listar cursos:", erro);

        res.status(500).json({
            erro: "Não foi possível listar os cursos."
        });
    }
});


// Consultar um curso específico
app.get("/api/cursos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do curso inválido."
            });
        }

        const [cursos] = await banco.execute(`
            SELECT
                c.id_curso,
                c.nome_curso,
                c.descricao,
                c.preco,
                c.status,
                p.nome AS nome_professor
            FROM curso c
            JOIN professor p ON p.id_professor = c.id_professor
            WHERE c.id_curso = ?
              AND c.status = 'publicado'
        `, [id]);

        if (cursos.length === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado."
            });
        }

        res.json(cursos[0]);

    } catch (erro) {
        console.error("Erro ao consultar curso:", erro);

        res.status(500).json({
            erro: "Não foi possível consultar o curso."
        });
    }
});

// Listar cursos do professor autenticado
app.get("/api/professor/cursos", exigirProfessor, async (req, res) => {
    try {
        const idProfessor = req.session.usuario.id;

        const [cursos] = await banco.execute(`
            SELECT
                id_curso,
                nome_curso,
                subtitulo,
                descricao,
                area_tematica,
                publico_alvo,
                carga_horaria,
                nivel,
                certificado,
                checklist,
                imagem_url,
                preco,
                status,
                data_criacao
            FROM curso
            WHERE id_professor = ?
            ORDER BY id_curso DESC
        `, [idProfessor]);

        res.json(cursos);

    } catch (erro) {
        console.error("Erro ao listar cursos do professor:", erro);

        res.status(500).json({
            erro: "Não foi possível listar seus cursos."
        });
    }
});

// Consultar um curso específico do professor autenticado
app.get("/api/professor/cursos/:id", exigirProfessor, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do curso inválido."
            });
        }

        const [cursos] = await banco.execute(`
            SELECT
                id_curso,
                nome_curso,
                subtitulo,
                descricao,
                area_tematica,
                publico_alvo,
                carga_horaria,
                nivel,
                certificado,
                checklist,
                imagem_url,
                preco,
                status,
                data_criacao
            FROM curso
            WHERE id_curso = ?
              AND id_professor = ?
        `, [
            id,
            req.session.usuario.id
        ]);

        if (cursos.length === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado ou não pertence a você."
            });
        }

        res.json(cursos[0]);

    } catch (erro) {
        console.error("Erro ao consultar curso:", erro);

        res.status(500).json({
            erro: "Não foi possível consultar o curso."
        });
    }
});

// Criar curso
app.post("/api/cursos", exigirProfessor, async (req, res) => {
    try {
        const {
            nome_curso,
            subtitulo,
            descricao,
            area_tematica,
            publico_alvo,
            carga_horaria,
            nivel,
            certificado,
            checklist,
            imagem_url,
            preco,
            status
        } = req.body;

        const nome = typeof nome_curso === "string"
            ? nome_curso.trim()
            : "";

        const valor = Number(preco);
        const situacao = status || "rascunho";
        const carga = carga_horaria === "" || carga_horaria == null
            ? null
            : Number(carga_horaria);

        if (!nome || nome.length > 150) {
            return res.status(400).json({
                erro: "O nome do curso é obrigatório e deve ter até 150 caracteres."
            });
        }

        if (!Number.isFinite(valor) || valor < 0) {
            return res.status(400).json({
                erro: "O preço do curso é inválido."
            });
        }

        if (!["rascunho", "publicado"].includes(situacao)) {
            return res.status(400).json({
                erro: "Status do curso inválido."
            });
        }

        if (
            carga !== null &&
            (!Number.isInteger(carga) || carga < 0 || carga > 65535)
        ) {
            return res.status(400).json({
                erro: "Carga horária inválida."
            });
        }

        if (subtitulo && subtitulo.length > 200) {
            return res.status(400).json({
                erro: "O subtítulo deve ter até 200 caracteres."
            });
        }

        if (area_tematica && area_tematica.length > 80) {
            return res.status(400).json({
                erro: "A área temática deve ter até 80 caracteres."
            });
        }

        if (publico_alvo && publico_alvo.length > 200) {
            return res.status(400).json({
                erro: "O público-alvo deve ter até 200 caracteres."
            });
        }

        if (imagem_url && imagem_url.length > 500) {
            return res.status(400).json({
                erro: "O endereço da imagem é muito longo."
            });
        }

        const checklistJSON = checklist == null
            ? null
            : JSON.stringify(checklist);

        const [resultado] = await banco.execute(`
            INSERT INTO curso (
                id_professor,
                nome_curso,
                subtitulo,
                descricao,
                area_tematica,
                publico_alvo,
                carga_horaria,
                nivel,
                certificado,
                checklist,
                imagem_url,
                preco,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.session.usuario.id,
            nome,
            subtitulo || null,
            descricao || null,
            area_tematica || null,
            publico_alvo || null,
            carga,
            nivel || null,
            certificado || null,
            checklistJSON,
            imagem_url || null,
            valor,
            situacao
        ]);

        res.status(201).json({
            sucesso: true,
            mensagem: "Curso criado com sucesso.",
            id_curso: resultado.insertId
        });

    } catch (erro) {
        console.error("Erro ao criar curso:", erro);

        res.status(500).json({
            erro: "Não foi possível criar o curso."
        });
    }
});

// Editar curso próprio
app.put("/api/cursos/:id", exigirProfessor, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do curso inválido."
            });
        }

        const {
            nome_curso,
            subtitulo,
            descricao,
            area_tematica,
            publico_alvo,
            carga_horaria,
            nivel,
            certificado,
            checklist,
            imagem_url,
            preco,
            status
        } = req.body;

        const nome = typeof nome_curso === "string"
            ? nome_curso.trim()
            : "";

        const valor = Number(preco);

        const carga = carga_horaria === "" || carga_horaria == null
            ? null
            : Number(carga_horaria);

        if (!nome || nome.length > 150) {
            return res.status(400).json({
                erro: "Nome do curso inválido."
            });
        }

        if (!Number.isFinite(valor) || valor < 0) {
            return res.status(400).json({
                erro: "Preço inválido."
            });
        }

        if (!["rascunho", "publicado"].includes(status)) {
            return res.status(400).json({
                erro: "Status inválido."
            });
        }

        if (
            carga !== null &&
            (!Number.isInteger(carga) || carga < 0 || carga > 65535)
        ) {
            return res.status(400).json({
                erro: "Carga horária inválida."
            });
        }

        if (subtitulo && subtitulo.length > 200) {
            return res.status(400).json({
                erro: "O subtítulo deve ter até 200 caracteres."
            });
        }

        if (area_tematica && area_tematica.length > 80) {
            return res.status(400).json({
                erro: "Área temática inválida."
            });
        }

        if (publico_alvo && publico_alvo.length > 200) {
            return res.status(400).json({
                erro: "Público-alvo inválido."
            });
        }

        if (imagem_url && imagem_url.length > 500) {
            return res.status(400).json({
                erro: "O endereço da imagem é muito longo."
            });
        }

        const checklistJSON = checklist == null
            ? null
            : JSON.stringify(checklist);

        const [resultado] = await banco.execute(`
            UPDATE curso
            SET
                nome_curso = ?,
                subtitulo = ?,
                descricao = ?,
                area_tematica = ?,
                publico_alvo = ?,
                carga_horaria = ?,
                nivel = ?,
                certificado = ?,
                checklist = ?,
                imagem_url = ?,
                preco = ?,
                status = ?
            WHERE id_curso = ?
              AND id_professor = ?
        `, [
            nome,
            subtitulo || null,
            descricao || null,
            area_tematica || null,
            publico_alvo || null,
            carga,
            nivel || null,
            certificado || null,
            checklistJSON,
            imagem_url || null,
            valor,
            status,
            id,
            req.session.usuario.id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado ou não pertence a você."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Curso atualizado com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao editar curso:", erro);

        res.status(500).json({
            erro: "Não foi possível editar o curso."
        });
    }
});

// Excluir curso próprio
app.delete("/api/cursos/:id", exigirProfessor, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do curso inválido."
            });
        }

        const [resultado] = await banco.execute(`
            DELETE FROM curso
            WHERE id_curso = ?
              AND id_professor = ?
        `, [
            id,
            req.session.usuario.id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado ou não pertence a você."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Curso excluído."
        });

    } catch (erro) {
        if (erro.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                erro: "Este curso possui matrículas ou compras vinculadas e não pode ser excluído."
            });
        }

        console.error("Erro ao excluir curso:", erro);

        res.status(500).json({
            erro: "Não foi possível excluir o curso."
        });
    }
});

// Bloquear acesso às pastas internas
app.use((req, res, next) => {
    const caminho = req.path;

    if (
        caminho === "/app" ||
        caminho.startsWith("/app/") ||
        caminho === "/.git" ||
        caminho.startsWith("/.git/") ||
        caminho === "/banco" ||
        caminho.startsWith("/banco/")
    ) {
        return res.sendStatus(404);
    }

    next();
});

// Servir o frontend (HTML, CSS, JavaScript e imagens)
app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
