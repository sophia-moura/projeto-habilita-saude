require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// UPLOAD DE IMAGENS DOS CURSOS
// ==========================================

const pastaImagensCursos = path.join(
    __dirname,
    "..",
    "uploads",
    "cursos"
);

// Criar a pasta automaticamente, caso ainda não exista.
fs.mkdirSync(pastaImagensCursos, { recursive: true });

const armazenamentoImagens = multer.diskStorage({
    destination: (req, arquivo, callback) => {
        callback(null, pastaImagensCursos);
    },

    filename: (req, arquivo, callback) => {
        const extensoesPermitidas = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };

        const extensao = extensoesPermitidas[arquivo.mimetype];

        callback(
            null,
            `${crypto.randomUUID()}${extensao}`
        );
    }
});

const uploadImagemCurso = multer({
    storage: armazenamentoImagens,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, arquivo, callback) => {
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(arquivo.mimetype)) {
            return callback(
                new Error("Envie uma imagem PNG, JPG ou WEBP.")
            );
        }

        callback(null, true);
    }
});

// Excluir a imagem de um curso, se ela estiver na pasta de uploads.
async function excluirImagemCurso(imagemUrl) {
    if (
        typeof imagemUrl !== "string" ||
        !imagemUrl.startsWith("/uploads/cursos/")
    ) {
        return;
    }

    const nomeArquivo = path.basename(imagemUrl);

    // Aceitar somente nomes gerados pelo upload de imagens dos cursos.
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/i.test(nomeArquivo)) {
        return;
    }

    const caminhoArquivo = path.join(
        pastaImagensCursos,
        nomeArquivo
    );

    try {
        await fs.promises.unlink(caminhoArquivo);
    } catch (erro) {
        if (erro.code !== "ENOENT") {
            console.error("Erro ao excluir imagem do curso:", erro);
        }
    }
}

app.use(express.json());

app.use(session({
    name: "habilitasaude.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
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

        // Salva a sessão antes de confirmar o login.
        req.session.save((erro) => {
            if (erro) {
                console.error("Erro ao salvar sessão:", erro);

                return res.status(500).json({
                    erro: "Não foi possível salvar sua sessão."
                });
            }

            return res.json({
                sucesso: true,
                mensagem: "Login realizado!",
                usuario: req.session.usuario
            });
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao realizar login."
        });
    }
});

app.get("/api/usuario-logado", (req, res) => {
    res.set("Cache-Control", "no-store");

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

// Verificar se o usuário autenticado é aluno
function exigirAluno(req, res, next) {
    if (!req.session.usuario || req.session.usuario.tipo !== "aluno") {
        return res.status(403).json({
            erro: "Acesso permitido somente para alunos."
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

// Enviar imagem de um curso
app.post(
    "/api/cursos/imagem",
    exigirProfessor,

    (req, res, next) => {
        uploadImagemCurso.single("imagem")(req, res, (erro) => {
            if (erro) {
                return res.status(400).json({
                    erro: erro.message || "Não foi possível enviar a imagem."
                });
            }

            next();
        });
    },

    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                erro: "Selecione uma imagem para enviar."
            });
        }

        const imagemUrl = `/uploads/cursos/${req.file.filename}`;

        return res.status(201).json({
            sucesso: true,
            imagem_url: imagemUrl
        });
    }
);

// Verificar se o curso pertence ao professor autenticado
async function professorEhDonoDoCurso(idCurso, idProfessor) {
    const [resultado] = await banco.execute(
        `SELECT id_curso
         FROM curso
         WHERE id_curso = ?
           AND id_professor = ?`,
        [idCurso, idProfessor]
    );

    return resultado.length > 0;
}

app.post("/api/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({
                erro: "Erro ao encerrar sessão."
            });
        }

        res.clearCookie("habilitasaude.sid", {
            path: "/"
        });

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

/* =========================================
   ÁREA DO ALUNO — MATRÍCULAS
========================================= */

app.get("/api/aluno/matriculas", exigirLogin, exigirAluno, async (req, res) => {
    try {
        const idAluno = req.session.usuario.id;

        const [matriculas] = await banco.execute(`
            SELECT
                m.id_matricula AS idMatricula,
                m.id_curso AS id,
                c.nome_curso AS nome,
                c.area_tematica AS area,
                c.area_tematica AS categoria,
                c.imagem_url AS imagem,
                c.carga_horaria AS cargaHoraria,
                c.nivel,
                c.certificado AS tipoCertificado,
                p.nome AS professor,
                m.data_matricula AS dataMatricula,
                m.ultimo_acesso AS ultimoAcesso,
                m.progresso,
                m.nota_final AS notaFinal,
                m.situacao,
                cert.id_certificado AS idCertificado,
                cert.codigo_validacao AS codigoCertificado,
                cert.data_emissao AS dataEmissaoCertificado
            FROM matricula m
            INNER JOIN curso c ON c.id_curso = m.id_curso
            INNER JOIN professor p ON p.id_professor = c.id_professor
            LEFT JOIN certificado cert ON cert.id_matricula = m.id_matricula
            WHERE m.id_aluno = ?
            ORDER BY m.data_matricula DESC, m.id_matricula DESC
        `, [idAluno]);

        const cursos = matriculas.map((matricula) => {
            const progresso = Number(matricula.progresso) || 0;
            let status = "andamento";

            if (matricula.situacao === "aprovado" || progresso >= 100) {
                status = "concluido";
            } else if (progresso <= 0) {
                status = "nao-iniciado";
            }

            return {
                ...matricula,
                progresso,
                cargaHoraria: Number(matricula.cargaHoraria) || 0,
                ultimoAcesso: matricula.ultimoAcesso || null,
                status,
                certificado: matricula.codigoCertificado || null
            };
        });

        res.set("Cache-Control", "no-store");

        return res.json({
            sucesso: true,
            total: cursos.length,
            cursos
        });
    } catch (erro) {
        console.error("Erro ao consultar matrículas do aluno:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar suas matrículas."
        });
    }
});

// Matricular aluno em um curso
app.post(
    "/api/aluno/matriculas",
    exigirLogin,
    exigirAluno,
    async (req, res) => {
        try {
            const idAluno = req.session.usuario.id;
            const idCurso = Number(req.body.id_curso);

            if (!Number.isInteger(idCurso) || idCurso <= 0) {
                return res.status(400).json({
                    erro: "ID do curso inválido."
                });
            }

            const [cursos] = await banco.execute(`
                SELECT id_curso, preco
                FROM curso
                WHERE id_curso = ?
                  AND status = 'publicado'
            `, [idCurso]);

            if (!cursos.length) {
                return res.status(404).json({
                    erro: "Curso não encontrado ou indisponível."
                });
            }

            const preco = Number(cursos[0].preco);

            // Cursos pagos exigem uma compra confirmada.
            if (preco > 0) {
                const [compras] = await banco.execute(`
                    SELECT c.id_compra
                    FROM compra c
                    INNER JOIN item_compra i
                        ON i.id_compra = c.id_compra
                    WHERE c.id_aluno = ?
                      AND i.id_curso = ?
                      AND c.status = 'paga'
                    LIMIT 1
                `, [idAluno, idCurso]);

                if (!compras.length) {
                    return res.status(402).json({
                        erro: "É necessário confirmar o pagamento antes da matrícula."
                    });
                }
            }

            const [existentes] = await banco.execute(`
                SELECT id_matricula
                FROM matricula
                WHERE id_aluno = ?
                  AND id_curso = ?
                LIMIT 1
            `, [idAluno, idCurso]);

            if (existentes.length) {
                return res.status(409).json({
                    erro: "Você já está matriculado neste curso.",
                    id_matricula: existentes[0].id_matricula
                });
            }

            const [resultado] = await banco.execute(`
                INSERT INTO matricula (
                    id_aluno,
                    id_curso,
                    progresso,
                    situacao
                )
                VALUES (?, ?, 0, 'em_andamento')
            `, [idAluno, idCurso]);

            return res.status(201).json({
                sucesso: true,
                mensagem: "Matrícula realizada com sucesso!",
                id_matricula: resultado.insertId
            });

        } catch (erro) {
            if (erro.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    erro: "Você já está matriculado neste curso."
                });
            }

            console.error("Erro ao matricular aluno:", erro);

            return res.status(500).json({
                erro: "Não foi possível realizar a matrícula."
            });
        }
    }
);

// Marcar uma aula como concluída e atualizar o progresso do curso
app.post(
    "/api/aluno/aulas/:id/concluir",
    exigirLogin,
    exigirAluno,
    async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            const idAluno = req.session.usuario.id;
            const idAula = Number(req.params.id);

            if (!Number.isInteger(idAula) || idAula <= 0) {
                return res.status(400).json({
                    erro: "ID da aula inválido."
                });
            }

            await conexao.beginTransaction();

            // Descobrir a qual curso a aula pertence.
            const [aulas] = await conexao.execute(`
                SELECT
                    a.id_aula,
                    m.id_curso
                FROM aula a
                INNER JOIN modulo m ON m.id_modulo = a.id_modulo
                WHERE a.id_aula = ?
            `, [idAula]);

            if (!aulas.length) {
                await conexao.rollback();

                return res.status(404).json({
                    erro: "Aula não encontrada."
                });
            }

            const idCurso = aulas[0].id_curso;

            // Verificar se o aluno está matriculado nesse curso.
            const [matriculas] = await conexao.execute(`
                SELECT id_matricula
                FROM matricula
                WHERE id_aluno = ?
                  AND id_curso = ?
            `, [idAluno, idCurso]);

            if (!matriculas.length) {
                await conexao.rollback();

                return res.status(403).json({
                    erro: "Você não está matriculado neste curso."
                });
            }

            // Registrar a conclusão sem duplicar a mesma aula.
            await conexao.execute(`
                INSERT IGNORE INTO aula_concluida (
                    id_aluno,
                    id_aula
                )
                VALUES (?, ?)
            `, [idAluno, idAula]);

            // Contar todas as aulas do curso.
            const [totais] = await conexao.execute(`
                SELECT COUNT(*) AS total
                FROM modulo m
                INNER JOIN aula a ON a.id_modulo = m.id_modulo
                WHERE m.id_curso = ?
            `, [idCurso]);

            // Contar as aulas concluídas pelo aluno nesse curso.
            const [concluidas] = await conexao.execute(`
                SELECT COUNT(*) AS total
                FROM aula_concluida ac
                INNER JOIN aula a ON a.id_aula = ac.id_aula
                INNER JOIN modulo m ON m.id_modulo = a.id_modulo
                WHERE ac.id_aluno = ?
                  AND m.id_curso = ?
            `, [idAluno, idCurso]);

            const totalAulas = Number(totais[0].total);
            const totalConcluidas = Number(concluidas[0].total);

            const progresso = totalAulas > 0
                ? Math.round((totalConcluidas / totalAulas) * 100)
                : 0;

            // Atualizar o progresso e o último acesso da matrícula.
            await conexao.execute(`
                UPDATE matricula
                SET progresso = ?,
                    ultimo_acesso = NOW()
                WHERE id_aluno = ?
                  AND id_curso = ?
            `, [progresso, idAluno, idCurso]);

            await conexao.commit();

            return res.json({
                sucesso: true,
                mensagem: "Aula concluída com sucesso.",
                progresso,
                aulasConcluidas: totalConcluidas,
                totalAulas
            });

        } catch (erro) {
            await conexao.rollback();

            console.error("Erro ao concluir aula:", erro);

            return res.status(500).json({
                erro: "Não foi possível registrar a conclusão da aula."
            });

        } finally {
            conexao.release();
        }
    }
);

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

// Listar módulos e aulas de um curso
app.get(
    "/api/professor/cursos/:id/conteudos",
    exigirProfessor,
    async (req, res) => {
        try {
            const idCurso = Number(req.params.id);
            const idProfessor = req.session.usuario.id;

            if (!Number.isInteger(idCurso) || idCurso <= 0) {
                return res.status(400).json({
                    erro: "ID do curso inválido."
                });
            }

            const pertence = await professorEhDonoDoCurso(
                idCurso,
                idProfessor
            );

            if (!pertence) {
                return res.status(404).json({
                    erro: "Curso não encontrado."
                });
            }

            const [modulos] = await banco.execute(`
                SELECT
                    id_modulo,
                    titulo,
                    ordem
                FROM modulo
                WHERE id_curso = ?
                ORDER BY ordem ASC
            `, [idCurso]);

            const [aulas] = await banco.execute(`
                SELECT
                    a.id_aula,
                    a.id_modulo,
                    a.titulo,
                    a.conteudo,
                    a.tipo,
                    a.arquivo_url,
                    a.metadados,
                    a.ordem
                FROM aula a
                INNER JOIN modulo m
                    ON m.id_modulo = a.id_modulo
                WHERE m.id_curso = ?
                ORDER BY a.ordem ASC
            `, [idCurso]);

            const resultado = modulos.map(modulo => ({
                ...modulo,
                aulas: aulas
                    .filter(aula =>
                        aula.id_modulo === modulo.id_modulo
                    )
                    .map(aula => {
                        if (typeof aula.metadados === "string") {
                            try {
                                aula.metadados = JSON.parse(aula.metadados);
                            } catch {
                                aula.metadados = null;
                            }
                        }

                        return aula;
                    })
            }));

            res.json(resultado);

        } catch (erro) {
            console.error("Erro ao listar conteúdos:", erro);

            res.status(500).json({
                erro: "Não foi possível listar os conteúdos."
            });
        }
    }
);

/* =========================================
   ÁREA DO ALUNO — CONTEÚDOS DO CURSO
========================================= */

app.get(
    "/api/aluno/cursos/:id/conteudos",
    exigirLogin,
    exigirAluno,
    async (req, res) => {
        try {
            const idCurso = Number(req.params.id);
            const idAluno = req.session.usuario.id;

            if (!Number.isInteger(idCurso) || idCurso <= 0) {
                return res.status(400).json({
                    erro: "ID do curso inválido."
                });
            }

            // Verificar se o aluno está matriculado.
            const [matriculas] = await banco.execute(`
                SELECT id_matricula
                FROM matricula
                WHERE id_aluno = ?
                  AND id_curso = ?
            `, [idAluno, idCurso]);

            if (!matriculas.length) {
                return res.status(403).json({
                    erro: "Você não está matriculado neste curso."
                });
            }

            // Buscar os módulos do curso.
            const [modulos] = await banco.execute(`
                SELECT
                    id_modulo,
                    titulo,
                    ordem
                FROM modulo
                WHERE id_curso = ?
                ORDER BY ordem ASC
            `, [idCurso]);

            // Buscar as aulas e identificar as concluídas pelo aluno.
            const [aulas] = await banco.execute(`
                SELECT
                    a.id_aula,
                    a.id_modulo,
                    a.titulo,
                    a.conteudo,
                    a.tipo,
                    a.arquivo_url,
                    a.metadados,
                    a.ordem,
                    CASE
                        WHEN ac.id_aula IS NOT NULL THEN TRUE
                        ELSE FALSE
                    END AS concluida
                FROM aula a
                INNER JOIN modulo m
                    ON m.id_modulo = a.id_modulo
                LEFT JOIN aula_concluida ac
                    ON ac.id_aula = a.id_aula
                   AND ac.id_aluno = ?
                WHERE m.id_curso = ?
                ORDER BY m.ordem ASC, a.ordem ASC
            `, [idAluno, idCurso]);

            const resultado = modulos.map(modulo => ({
                ...modulo,
                aulas: aulas
                    .filter(aula =>
                        Number(aula.id_modulo) === Number(modulo.id_modulo)
                    )
                    .map(aula => {
                        if (typeof aula.metadados === "string") {
                            try {
                                aula.metadados = JSON.parse(aula.metadados);
                            } catch {
                                aula.metadados = null;
                            }
                        }

                        return {
                            ...aula,
                            concluida: Boolean(aula.concluida)
                        };
                    })
            }));

            res.set("Cache-Control", "no-store");

            return res.json({
                sucesso: true,
                modulos: resultado
            });

        } catch (erro) {
            console.error("Erro ao consultar conteúdos do aluno:", erro);

            return res.status(500).json({
                erro: "Não foi possível carregar os conteúdos do curso."
            });
        }
    }
);

// Criar módulo
app.post(
    "/api/cursos/:id/modulos",
    exigirProfessor,
    async (req, res) => {
        try {
            const idCurso = Number(req.params.id);
            const { titulo, ordem } = req.body;

            if (!Number.isInteger(idCurso) || idCurso <= 0) {
                return res.status(400).json({
                    erro: "ID do curso inválido."
                });
            }

            if (
                typeof titulo !== "string" ||
                !titulo.trim() ||
                titulo.trim().length > 150
            ) {
                return res.status(400).json({
                    erro: "Informe um título válido para o módulo."
                });
            }

            const pertence = await professorEhDonoDoCurso(
                idCurso,
                req.session.usuario.id
            );

            if (!pertence) {
                return res.status(404).json({
                    erro: "Curso não encontrado."
                });
            }

            let ordemFinal = ordem;

            if (ordemFinal == null) {
                const [resultado] = await banco.execute(
                    `SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima
                     FROM modulo
                     WHERE id_curso = ?`,
                    [idCurso]
                );

                ordemFinal = resultado[0].proxima;
            }

            const [resultado] = await banco.execute(`
                INSERT INTO modulo (id_curso, titulo, ordem)
                VALUES (?, ?, ?)
            `, [
                idCurso,
                titulo.trim(),
                ordemFinal
            ]);

            res.status(201).json({
                sucesso: true,
                id_modulo: resultado.insertId,
                mensagem: "Módulo criado com sucesso."
            });

        } catch (erro) {
            console.error("Erro ao criar módulo:", erro);

            res.status(500).json({
                erro: "Não foi possível criar o módulo."
            });
        }
    }
);

// Editar módulo
app.put("/api/modulos/:id", exigirProfessor, async (req, res) => {
    try {
        const idModulo = Number(req.params.id);
        const { titulo, ordem } = req.body;

        if (
            !Number.isInteger(idModulo) ||
            idModulo <= 0 ||
            typeof titulo !== "string" ||
            !titulo.trim() ||
            titulo.trim().length > 150
        ) {
            return res.status(400).json({
                erro: "Dados do módulo inválidos."
            });
        }

        const [resultado] = await banco.execute(`
            UPDATE modulo m
            INNER JOIN curso c ON c.id_curso = m.id_curso
            SET m.titulo = ?, m.ordem = ?
            WHERE m.id_modulo = ?
              AND c.id_professor = ?
        `, [
            titulo.trim(),
            Number.isInteger(ordem) && ordem > 0 ? ordem : 1,
            idModulo,
            req.session.usuario.id
        ]);

        if (!resultado.affectedRows) {
            return res.status(404).json({
                erro: "Módulo não encontrado."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Módulo atualizado."
        });

    } catch (erro) {
        console.error("Erro ao editar módulo:", erro);

        res.status(500).json({
            erro: "Não foi possível editar o módulo."
        });
    }
});

// Excluir módulo
app.delete("/api/modulos/:id", exigirProfessor, async (req, res) => {
    try {
        const idModulo = Number(req.params.id);

        const [resultado] = await banco.execute(`
            DELETE m FROM modulo m
            INNER JOIN curso c ON c.id_curso = m.id_curso
            WHERE m.id_modulo = ?
              AND c.id_professor = ?
        `, [
            idModulo,
            req.session.usuario.id
        ]);

        if (!resultado.affectedRows) {
            return res.status(404).json({
                erro: "Módulo não encontrado."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Módulo e suas aulas foram excluídos."
        });

    } catch (erro) {
        console.error("Erro ao excluir módulo:", erro);

        res.status(500).json({
            erro: "Não foi possível excluir o módulo."
        });
    }
});

// Adicionar aula a um módulo
app.post("/api/modulos/:id/aulas", exigirProfessor, async (req, res) => {
    try {
        const idModulo = Number(req.params.id);

        const {
            titulo,
            conteudo,
            tipo,
            arquivo_url,
            metadados,
            ordem
        } = req.body;

        const tiposPermitidos = [
            "video", "pdf", "ebook", "slide", "mapa",
            "quiz", "caso", "material", "link", "texto"
        ];

        if (
            !Number.isInteger(idModulo) ||
            idModulo <= 0 ||
            typeof titulo !== "string" ||
            !titulo.trim() ||
            titulo.trim().length > 150 ||
            !tiposPermitidos.includes(tipo)
        ) {
            return res.status(400).json({
                erro: "Dados da aula inválidos."
            });
        }

        const [modulos] = await banco.execute(`
            SELECT m.id_modulo
            FROM modulo m
            INNER JOIN curso c ON c.id_curso = m.id_curso
            WHERE m.id_modulo = ?
              AND c.id_professor = ?
        `, [
            idModulo,
            req.session.usuario.id
        ]);

        if (!modulos.length) {
            return res.status(404).json({
                erro: "Módulo não encontrado."
            });
        }

        const [resultado] = await banco.execute(`
            INSERT INTO aula (
                id_modulo,
                titulo,
                conteudo,
                tipo,
                arquivo_url,
                metadados,
                ordem
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            idModulo,
            titulo.trim(),
            conteudo || null,
            tipo,
            arquivo_url || null,
            metadados == null ? null : JSON.stringify(metadados),
            Number.isInteger(ordem) && ordem > 0 ? ordem : 1
        ]);

        res.status(201).json({
            sucesso: true,
            id_aula: resultado.insertId,
            mensagem: "Aula adicionada com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao adicionar aula:", erro);

        res.status(500).json({
            erro: "Não foi possível adicionar a aula."
        });
    }
});

// Editar aula
app.put("/api/aulas/:id", exigirProfessor, async (req, res) => {
    try {
        const idAula = Number(req.params.id);

        const {
            titulo,
            conteudo,
            tipo,
            arquivo_url,
            metadados,
            ordem
        } = req.body;

        const tiposPermitidos = [
            "video", "pdf", "ebook", "slide", "mapa",
            "quiz", "caso", "material", "link", "texto"
        ];

        if (
            !Number.isInteger(idAula) ||
            idAula <= 0 ||
            typeof titulo !== "string" ||
            !titulo.trim() ||
            titulo.trim().length > 150 ||
            !tiposPermitidos.includes(tipo)
        ) {
            return res.status(400).json({
                erro: "Dados da aula inválidos."
            });
        }

        const [resultado] = await banco.execute(`
            UPDATE aula a
            INNER JOIN modulo m ON m.id_modulo = a.id_modulo
            INNER JOIN curso c ON c.id_curso = m.id_curso
            SET
                a.titulo = ?,
                a.conteudo = ?,
                a.tipo = ?,
                a.arquivo_url = ?,
                a.metadados = ?,
                a.ordem = ?
            WHERE a.id_aula = ?
              AND c.id_professor = ?
        `, [
            titulo.trim(),
            conteudo || null,
            tipo,
            arquivo_url || null,
            metadados == null ? null : JSON.stringify(metadados),
            Number.isInteger(ordem) && ordem > 0 ? ordem : 1,
            idAula,
            req.session.usuario.id
        ]);

        if (!resultado.affectedRows) {
            return res.status(404).json({
                erro: "Aula não encontrada."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Aula atualizada com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao editar aula:", erro);

        res.status(500).json({
            erro: "Não foi possível editar a aula."
        });
    }
});

// Excluir aula
app.delete("/api/aulas/:id", exigirProfessor, async (req, res) => {
    try {
        const idAula = Number(req.params.id);

        const [resultado] = await banco.execute(`
            DELETE a FROM aula a
            INNER JOIN modulo m ON m.id_modulo = a.id_modulo
            INNER JOIN curso c ON c.id_curso = m.id_curso
            WHERE a.id_aula = ?
              AND c.id_professor = ?
        `, [
            idAula,
            req.session.usuario.id
        ]);

        if (!resultado.affectedRows) {
            return res.status(404).json({
                erro: "Aula não encontrada."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Aula excluída com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao excluir aula:", erro);

        res.status(500).json({
            erro: "Não foi possível excluir a aula."
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

        const [cursosAtuais] = await banco.execute(
            `SELECT imagem_url
            FROM curso
            WHERE id_curso = ?
            AND id_professor = ?`,
            [id, req.session.usuario.id]
        );

        if (cursosAtuais.length === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado ou não pertence a você."
            });
        }

        const imagemAntiga = cursosAtuais[0].imagem_url;

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

        if (imagemAntiga && imagemAntiga !== imagem_url) {
            await excluirImagemCurso(imagemAntiga);
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

        const [cursosAtuais] = await banco.execute(
            `SELECT imagem_url
            FROM curso
            WHERE id_curso = ?
            AND id_professor = ?`,
            [id, req.session.usuario.id]
        );

        if (cursosAtuais.length === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado ou não pertence a você."
            });
        }

        const imagemAntiga = cursosAtuais[0].imagem_url;

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

        await excluirImagemCurso(imagemAntiga);

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
