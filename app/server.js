require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
