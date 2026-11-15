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

// ==========================================
// UPLOAD DE ARQUIVOS DOS CONTEÚDOS DO CURSO
// ==========================================

const pastaConteudos = path.join(
    __dirname,
    "..",
    "uploads",
    "conteudos"
);

fs.mkdirSync(pastaConteudos, { recursive: true });

const armazenamentoConteudos = multer.diskStorage({
    destination: (req, arquivo, callback) => {
        callback(null, pastaConteudos);
    },

    filename: (req, arquivo, callback) => {
        const extensao = path.extname(arquivo.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${extensao}`);
    }
});

const uploadConteudo = multer({
    storage: armazenamentoConteudos,
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

app.post(
    "/api/cursos/:id/conteudos/arquivo",
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
                return res.status(403).json({
                    erro: "Você não tem permissão para enviar arquivos para este curso."
                });
            }

            uploadConteudo.single("arquivo")(req, res, (erro) => {
                if (erro) {
                    return res.status(400).json({
                        erro: erro.message || "Falha no envio do arquivo."
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        erro: "Selecione um arquivo."
                    });
                }

                return res.status(201).json({
                    sucesso: true,
                    arquivo_url: `/uploads/conteudos/${req.file.filename}`,
                    nome: req.file.originalname,
                    tamanho: req.file.size,
                    mime: req.file.mimetype
                });
            });
        } catch (erro) {
            console.error("Erro no upload do conteúdo:", erro);

            return res.status(500).json({
                erro: "Não foi possível enviar o arquivo."
            });
        }
    }
);

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
                c.imagem_url,
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

/* =========================================
   PAGAMENTO SIMULADO — AMBIENTE DE TESTES
========================================= */

app.post(
    "/api/pagamentos/simular",
    exigirLogin,
    exigirAluno,
    async (req, res) => {
        // A simulação precisa estar explicitamente habilitada.
        if (
            process.env.NODE_ENV === "production" ||
            process.env.PAGAMENTO_SIMULADO !== "true"
        ) {
            return res.status(403).json({
                erro: "Pagamento simulado desabilitado."
            });
        }

        const conexao = await banco.getConnection();

        try {
            const idAluno = req.session.usuario.id;
            const idCurso = Number(req.body.id_curso);

            if (!Number.isInteger(idCurso) || idCurso <= 0) {
                return res.status(400).json({
                    erro: "ID do curso inválido."
                });
            }

            await conexao.beginTransaction();

            const [cursos] = await conexao.execute(`
                SELECT id_curso, nome_curso, preco
                FROM curso
                WHERE id_curso = ?
                  AND status = 'publicado'
            `, [idCurso]);

            if (!cursos.length) {
                await conexao.rollback();

                return res.status(404).json({
                    erro: "Curso não encontrado ou indisponível."
                });
            }

            const curso = cursos[0];
            const valor = Number(curso.preco);

            if (valor <= 0) {
                await conexao.rollback();

                return res.status(400).json({
                    erro: "Este curso não precisa de pagamento."
                });
            }

            const [matriculas] = await conexao.execute(`
                SELECT id_matricula
                FROM matricula
                WHERE id_aluno = ?
                  AND id_curso = ?
            `, [idAluno, idCurso]);

            if (matriculas.length) {
                await conexao.rollback();

                return res.status(409).json({
                    erro: "Você já está matriculado neste curso."
                });
            }

            const [comprasExistentes] = await conexao.execute(`
                SELECT c.id_compra
                FROM compra c
                INNER JOIN item_compra i
                    ON i.id_compra = c.id_compra
                WHERE c.id_aluno = ?
                  AND i.id_curso = ?
                  AND c.status = 'paga'
                LIMIT 1
            `, [idAluno, idCurso]);

            if (comprasExistentes.length) {
                await conexao.rollback();

                return res.json({
                    sucesso: true,
                    pagamento: "aprovado",
                    mensagem: "Este curso já possui pagamento confirmado."
                });
            }

            const [compra] = await conexao.execute(`
                INSERT INTO compra (
                    id_aluno,
                    valor_total,
                    status
                )
                VALUES (?, ?, 'paga')
            `, [idAluno, valor]);

            await conexao.execute(`
                INSERT INTO item_compra (
                    id_compra,
                    id_curso,
                    valor_unitario
                )
                VALUES (?, ?, ?)
            `, [compra.insertId, idCurso, valor]);

            await conexao.commit();

            return res.json({
                sucesso: true,
                pagamento: "aprovado",
                simulado: true,
                id_compra: compra.insertId,
                curso: curso.nome_curso,
                valor
            });

        } catch (erro) {
            await conexao.rollback();

            console.error("Erro no pagamento simulado:", erro);

            return res.status(500).json({
                erro: "Não foi possível simular o pagamento."
            });

        } finally {
            conexao.release();
        }
    }
);

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

            // Garantir que o aluno tenha um registro de gamificação.
            await banco.execute(`
                INSERT IGNORE INTO gamificacao_aluno (id_aluno)
                VALUES (?)
            `, [idAluno]);

            // Registrar 20 XP pela matrícula, sem duplicar.
            const [xpMatricula] = await banco.execute(`
                INSERT IGNORE INTO historico_xp (
                    id_aluno,
                    quantidade,
                    motivo,
                    chave_evento
                )
                VALUES (?, 20, 'Matrícula em curso', ?)
            `, [idAluno, `matricula-${resultado.insertId}`]);

            // Verificar conquistas de matrícula.
            const [totalMatriculas] = await banco.execute(`
                SELECT COUNT(*) AS total
                FROM matricula
                WHERE id_aluno = ?
            `, [idAluno]);

            const total = Number(totalMatriculas[0].total);

            const conquistasMatricula = [];

            if (total >= 1) {
                conquistasMatricula.push("matricula");
            }

            if (total >= 3) {
                conquistasMatricula.push("tres");
            }

            for (const codigo of conquistasMatricula) {
                const [existente] = await banco.execute(`
                    SELECT codigo_conquista
                    FROM conquista_aluno
                    WHERE id_aluno = ? AND codigo_conquista = ?
                    LIMIT 1
                `, [idAluno, codigo]);

                if (existente.length === 0) {
                    await banco.execute(`
                        INSERT INTO conquista_aluno (
                            id_aluno,
                            codigo_conquista
                        )
                        VALUES (?, ?)
                    `, [idAluno, codigo]);
                }
            }

            if (xpMatricula.affectedRows > 0) {
                await banco.execute(`
                    UPDATE gamificacao_aluno
                    SET xp = xp + 20
                    WHERE id_aluno = ?
                `, [idAluno]);
            }

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
                SELECT
                    m.id_matricula,
                    c.certificado AS tipoCertificado
                FROM matricula m
                INNER JOIN curso c ON c.id_curso = m.id_curso
                WHERE m.id_aluno = ?
                AND m.id_curso = ?
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

            // Garantir que o aluno tenha um registro de gamificação.
            await conexao.execute(`
                INSERT IGNORE INTO gamificacao_aluno (id_aluno)
                VALUES (?)
            `, [idAluno]);

            // Conceder 30 XP pela conclusão desta aula, sem duplicar.
            const [xpAula] = await conexao.execute(`
                INSERT IGNORE INTO historico_xp (
                    id_aluno,
                    quantidade,
                    motivo,
                    chave_evento
                )
                VALUES (?, 30, 'Aula concluída', ?)
            `, [idAluno, `aula-${idAula}`]);

            if (xpAula.affectedRows > 0) {
                await conexao.execute(`
                    UPDATE gamificacao_aluno
                    SET xp = xp + 30
                    WHERE id_aluno = ?
                `, [idAluno]);
            }

            // Conceder 100 XP ao concluir o curso, apenas uma vez.
            if (progresso >= 100) {
                const [xpCurso] = await conexao.execute(`
                    INSERT IGNORE INTO historico_xp (
                        id_aluno,
                        quantidade,
                        motivo,
                        chave_evento
                    )
                    VALUES (?, 100, 'Curso concluído', ?)
                `, [idAluno, `curso-concluido-${idCurso}`]);

                if (xpCurso.affectedRows > 0) {
                    await conexao.execute(`
                        UPDATE gamificacao_aluno
                        SET xp = xp + 100
                        WHERE id_aluno = ?
                    `, [idAluno]);
                }
            }

            // Atualizar o progresso e o último acesso da matrícula.
            await conexao.execute(`
                UPDATE matricula
                SET progresso = ?,
                    ultimo_acesso = NOW()
                WHERE id_aluno = ?
                  AND id_curso = ?
            `, [progresso, idAluno, idCurso]);

            // Emitir certificado automaticamente quando o curso for concluído.
            let certificadoEmitido = false;

            if (
                progresso >= 100 &&
                matriculas[0].tipoCertificado !== "Sem Certificado"
            ) {
                const codigoValidacao = crypto.randomUUID()
                    .replace(/-/g, "")
                    .toUpperCase();

                const [resultadoCertificado] = await conexao.execute(`
                    INSERT IGNORE INTO certificado (
                        id_matricula,
                        codigo_validacao
                    )
                    VALUES (?, ?)
                `, [
                    matriculas[0].id_matricula,
                    codigoValidacao
                ]);

                certificadoEmitido = resultadoCertificado.affectedRows > 0;
            }

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

// ==========================================
// VALIDAÇÃO PÚBLICA DE CERTIFICADOS
// ==========================================

app.get("/api/certificados/validar/:codigo", async (req, res) => {
    try {
        const codigo = String(req.params.codigo || "")
            .trim()
            .toUpperCase();

        // O código gerado possui 32 caracteres hexadecimais.
        if (!/^[A-F0-9]{32}$/.test(codigo)) {
            return res.status(404).json({
                valido: false,
                mensagem: "Certificado não encontrado."
            });
        }

        const [certificados] = await banco.execute(`
            SELECT
                cert.codigo_validacao AS codigo,
                cert.data_emissao AS dataEmissao,
                a.nome AS aluno,
                c.nome_curso AS curso,
                c.carga_horaria AS cargaHoraria
            FROM certificado cert
            INNER JOIN matricula m
                ON m.id_matricula = cert.id_matricula
            INNER JOIN aluno a
                ON a.id_aluno = m.id_aluno
            INNER JOIN curso c
                ON c.id_curso = m.id_curso
            WHERE cert.codigo_validacao = ?
            LIMIT 1
        `, [codigo]);

        if (!certificados.length) {
            return res.status(404).json({
                valido: false,
                mensagem: "Certificado não encontrado."
            });
        }

        const certificado = certificados[0];

        return res.json({
            valido: true,
            mensagem: "Certificado autêntico.",
            certificado: {
                codigo: certificado.codigo,
                aluno: certificado.aluno,
                curso: certificado.curso,
                cargaHoraria: Number(certificado.cargaHoraria) || 0,
                data: certificado.dataEmissao
            }
        });

    } catch (erro) {
        console.error("Erro ao validar certificado:", erro);

        return res.status(500).json({
            valido: false,
            mensagem: "Não foi possível validar o certificado."
        });
    }
});

// ==========================================
// NOTIFICAÇÕES
// ==========================================

 // Criar uma notificação para um usuário
app.post("/api/notificacoes", exigirLogin, async (req, res) => {
    try {
        const { titulo, mensagem, destinatarioTipo, destinatarioId } = req.body;

        if (!titulo || !mensagem || !destinatarioTipo || !destinatarioId) {
            return res.status(400).json({
                erro: "Informe título, mensagem e destinatário."
            });
        }

        if (!["aluno", "professor"].includes(destinatarioTipo)) {
            return res.status(400).json({
                erro: "Tipo de destinatário inválido."
            });
        }

        const id = Number(destinatarioId);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "Destinatário inválido."
            });
        }

        const coluna = destinatarioTipo === "aluno"
            ? "id_aluno"
            : "id_professor";

        const [resultado] = await banco.execute(
            `INSERT INTO notificacao (${coluna}, titulo, mensagem)
             VALUES (?, ?, ?)`,
            [id, String(titulo).trim(), String(mensagem).trim()]
        );

        return res.status(201).json({
            mensagem: "Notificação criada.",
            id: resultado.insertId
        });

    } catch (erro) {
        console.error("Erro ao criar notificação:", erro);

        return res.status(500).json({
            erro: "Não foi possível criar a notificação."
        });
    }
});

// Listar notificações do usuário autenticado
app.get("/api/notificacoes", exigirLogin, async (req, res) => {
    try {
        const usuario = req.session.usuario;

        const coluna = usuario.tipo === "aluno"
            ? "id_aluno"
            : usuario.tipo === "professor"
                ? "id_professor"
                : null;

        if (!coluna) {
            return res.status(403).json({
                erro: "Tipo de usuário não permitido."
            });
        }

        const [notificacoes] = await banco.execute(`
            SELECT
                id_notificacao AS id,
                titulo,
                mensagem,
                data_envio AS data,
                lida
            FROM notificacao
            WHERE ${coluna} = ?
            ORDER BY data_envio DESC, id_notificacao DESC
        `, [usuario.id]);

        return res.json(notificacoes);

    } catch (erro) {
        console.error("Erro ao listar notificações:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar as notificações."
        });
    }
});

// Marcar uma notificação como lida
app.patch("/api/notificacoes/:id/lida", exigirLogin, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const coluna = usuario.tipo === "aluno"
            ? "id_aluno"
            : usuario.tipo === "professor"
                ? "id_professor"
                : null;

        if (!coluna) {
            return res.status(403).json({
                erro: "Tipo de usuário não permitido."
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "Notificação inválida."
            });
        }

        const [resultado] = await banco.execute(`
            UPDATE notificacao
            SET lida = TRUE
            WHERE id_notificacao = ? AND ${coluna} = ?
        `, [id, usuario.id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Notificação não encontrada."
            });
        }

        return res.json({
            mensagem: "Notificação marcada como lida."
        });

    } catch (erro) {
        console.error("Erro ao marcar notificação:", erro);

        return res.status(500).json({
            erro: "Não foi possível atualizar a notificação."
        });
    }
});

// Excluir uma notificação
app.delete("/api/notificacoes/:id", exigirLogin, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const coluna = usuario.tipo === "aluno"
            ? "id_aluno"
            : usuario.tipo === "professor"
                ? "id_professor"
                : null;

        if (!coluna) {
            return res.status(403).json({
                erro: "Tipo de usuário não permitido."
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "Notificação inválida."
            });
        }

        const [resultado] = await banco.execute(`
            DELETE FROM notificacao
            WHERE id_notificacao = ? AND ${coluna} = ?
        `, [id, usuario.id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Notificação não encontrada."
            });
        }

        return res.json({
            mensagem: "Notificação excluída."
        });

    } catch (erro) {
        console.error("Erro ao excluir notificação:", erro);

        return res.status(500).json({
            erro: "Não foi possível excluir a notificação."
        });
    }
});

// Excluir todas as notificações do usuário
app.delete("/api/notificacoes", exigirLogin, async (req, res) => {
    try {
        const usuario = req.session.usuario;
        const coluna = usuario.tipo === "aluno"
            ? "id_aluno"
            : usuario.tipo === "professor"
                ? "id_professor"
                : null;

        if (!coluna) {
            return res.status(403).json({
                erro: "Tipo de usuário não permitido."
            });
        }

        await banco.execute(`
            DELETE FROM notificacao
            WHERE ${coluna} = ?
        `, [usuario.id]);

        return res.json({
            mensagem: "Todas as notificações foram excluídas."
        });

    } catch (erro) {
        console.error("Erro ao excluir notificações:", erro);

        return res.status(500).json({
            erro: "Não foi possível excluir as notificações."
        });
    }
});

/* ==========================================
   GAMIFICAÇÃO DO ALUNO
========================================== */

// Consultar gamificação, histórico e ranking
app.get("/api/aluno/gamificacao", exigirLogin, exigirAluno, async (req, res) => {
    try {
        const idAluno = req.session.usuario.id;

        await banco.execute(`
            INSERT IGNORE INTO gamificacao_aluno (id_aluno)
            VALUES (?)
        `, [idAluno]);

        const [dados] = await banco.execute(`
            SELECT
                xp,
                sequencia,
                DATE_FORMAT(ultimo_dia, '%Y-%m-%d') AS ultimoDia
            FROM gamificacao_aluno
            WHERE id_aluno = ?
        `, [idAluno]);

        const [historico] = await banco.execute(`
            SELECT
                quantidade AS qtd,
                motivo,
                data_registro AS data
            FROM historico_xp
            WHERE id_aluno = ?
            ORDER BY data_registro DESC
            LIMIT 20
        `, [idAluno]);

        // Verificar conquistas de sequência e XP.
        const conquistasPossiveis = [];

        if (Number(dados[0].sequencia) >= 3) {
            conquistasPossiveis.push("seq3");
        }

        if (Number(dados[0].xp) >= 200) {
            conquistasPossiveis.push("nivel3");
        }

        // Registrar conquistas ainda não desbloqueadas.
        for (const codigo of conquistasPossiveis) {
            const [existente] = await banco.execute(`
                SELECT codigo_conquista
                FROM conquista_aluno
                WHERE id_aluno = ? AND codigo_conquista = ?
                LIMIT 1
            `, [idAluno, codigo]);

            if (existente.length === 0) {
                await banco.execute(`
                    INSERT INTO conquista_aluno (
                        id_aluno,
                        codigo_conquista
                    )
                    VALUES (?, ?)
                `, [idAluno, codigo]);
            }
        }

        // Verificar conquistas de conclusão de cursos.
        const [cursosConcluidos] = await banco.execute(`
            SELECT COUNT(*) AS total
            FROM matricula
            WHERE id_aluno = ?
            AND progresso >= 100
        `, [idAluno]);

        const totalConcluidos = Number(cursosConcluidos[0].total);

        const conquistasConclusao = [];

        if (totalConcluidos >= 1) {
            conquistasConclusao.push("concluido");
        }

        if (totalConcluidos >= 3) {
            conquistasConclusao.push("tresconcl");
        }

        for (const codigo of conquistasConclusao) {
            const [existente] = await banco.execute(`
                SELECT codigo_conquista
                FROM conquista_aluno
                WHERE id_aluno = ? AND codigo_conquista = ?
                LIMIT 1
            `, [idAluno, codigo]);

            if (existente.length === 0) {
                await banco.execute(`
                    INSERT INTO conquista_aluno (
                        id_aluno,
                        codigo_conquista
                    )
                    VALUES (?, ?)
                `, [idAluno, codigo]);
            }
        }

        // Buscar conquistas atualizadas.
        const [conquistas] = await banco.execute(`
            SELECT
                codigo_conquista AS codigo,
                data_desbloqueio AS data
            FROM conquista_aluno
            WHERE id_aluno = ?
            ORDER BY data_desbloqueio DESC
        `, [idAluno]);

        const [ranking] = await banco.execute(`
            SELECT
                a.id_aluno AS id,
                a.nome,
                COALESCE(g.xp, 0) AS xp
            FROM aluno a
            LEFT JOIN gamificacao_aluno g
                ON g.id_aluno = a.id_aluno
            ORDER BY xp DESC, a.nome ASC
            LIMIT 10
        `);

        return res.json({
            sucesso: true,
            xp: Number(dados[0].xp),
            sequencia: Number(dados[0].sequencia),
            ultimoDia: dados[0].ultimoDia,
            conquistas,
            historico,
            ranking
        });

    } catch (erro) {
        console.error("Erro ao consultar gamificação:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar a gamificação."
        });
    }
});

// Bônus de 10 XP por acertar todas as perguntas de um quiz
app.post("/api/aluno/aulas/:id/quiz-perfeito", exigirLogin, exigirAluno, async (req, res) => {
    const conexao = await banco.getConnection();

    try {
        const idAluno = req.session.usuario.id;
        const idAula = Number(req.params.id);
        const respostas = req.body.respostas;

        if (
            !Number.isInteger(idAula) ||
            idAula <= 0 ||
            !Array.isArray(respostas)
        ) {
            return res.status(400).json({
                erro: "Dados do quiz inválidos."
            });
        }

        await conexao.beginTransaction();

        // Buscar o quiz diretamente no banco.
        const [aulas] = await conexao.execute(`
            SELECT
                a.tipo,
                a.metadados,
                m.id_curso
            FROM aula a
            INNER JOIN modulo m ON m.id_modulo = a.id_modulo
            WHERE a.id_aula = ?
            LIMIT 1
        `, [idAula]);

        if (!aulas.length || aulas[0].tipo !== "quiz") {
            await conexao.rollback();

            return res.status(404).json({
                erro: "Quiz não encontrado."
            });
        }

        // Conferir a matrícula do aluno.
        const [matriculas] = await conexao.execute(`
            SELECT id_matricula
            FROM matricula
            WHERE id_aluno = ?
            AND id_curso = ?
            LIMIT 1
        `, [idAluno, aulas[0].id_curso]);

        if (!matriculas.length) {
            await conexao.rollback();

            return res.status(403).json({
                erro: "Você não está matriculado neste curso."
            });
        }

        // Interpretar os dados cadastrados do quiz.
        const metadados = typeof aulas[0].metadados === "string"
            ? JSON.parse(aulas[0].metadados)
            : aulas[0].metadados;

        const perguntas = metadados?.perguntas;

        if (
            !Array.isArray(perguntas) ||
            perguntas.length === 0 ||
            respostas.length !== perguntas.length
        ) {
            await conexao.rollback();

            return res.status(400).json({
                erro: "Respostas incompletas ou quiz inválido."
            });
        }

        // Conferir todas as respostas usando o gabarito do banco.
        const acertouTudo = perguntas.every((pergunta, indice) =>
            Number(respostas[indice]) === Number(pergunta.correta)
        );

        if (!acertouTudo) {
            await conexao.rollback();

            return res.json({
                sucesso: true,
                xpRecebido: 0,
                mensagem: "O quiz não foi respondido totalmente sem erros."
            });
        }

        // Garantir que exista o registro de gamificação.
        await conexao.execute(`
            INSERT IGNORE INTO gamificacao_aluno (id_aluno)
            VALUES (?)
        `, [idAluno]);

        // Registrar o bônus sem permitir recebimento duplicado.
        const [registro] = await conexao.execute(`
            INSERT IGNORE INTO historico_xp (
                id_aluno,
                quantidade,
                motivo,
                chave_evento
            )
            VALUES (?, 10, 'Quiz sem erros', ?)
        `, [idAluno, `quiz-perfeito-${idAluno}-${idAula}`]);

        if (registro.affectedRows > 0) {
            await conexao.execute(`
                UPDATE gamificacao_aluno
                SET xp = xp + 10
                WHERE id_aluno = ?
            `, [idAluno]);
        }

        await conexao.commit();

        return res.json({
            sucesso: true,
            xpRecebido: registro.affectedRows > 0 ? 10 : 0,
            jaRecebido: registro.affectedRows === 0
        });

    } catch (erro) {
        await conexao.rollback();

        console.error("Erro ao conceder XP do quiz:", erro);

        return res.status(500).json({
            erro: "Não foi possível registrar o bônus do quiz."
        });

    } finally {
        conexao.release();
    }
});

// Check-in diário: concede 10 XP uma única vez por dia
app.post("/api/aluno/gamificacao/checkin", exigirLogin, exigirAluno, async (req, res) => {
    const conexao = await banco.getConnection();

    try {
        const idAluno = req.session.usuario.id;

        await conexao.beginTransaction();

        await conexao.execute(`
            INSERT IGNORE INTO gamificacao_aluno (id_aluno)
            VALUES (?)
        `, [idAluno]);

        const [dados] = await conexao.execute(`
            SELECT
                xp,
                sequencia,
                DATE_FORMAT(ultimo_dia, '%Y-%m-%d') AS ultimoDia
            FROM gamificacao_aluno
            WHERE id_aluno = ?
            FOR UPDATE
        `, [idAluno]);

        const [datas] = await conexao.execute(`
            SELECT
                DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoje,
                DATE_FORMAT(
                    DATE_SUB(CURDATE(), INTERVAL 1 DAY),
                    '%Y-%m-%d'
                ) AS ontem
        `);

        const hoje = datas[0].hoje;
        const ontem = datas[0].ontem;

        // Já recebeu o XP do check-in de hoje.
        if (dados[0].ultimoDia === hoje) {
            await conexao.commit();

            return res.json({
                sucesso: true,
                jaRealizado: true,
                xp: Number(dados[0].xp),
                sequencia: Number(dados[0].sequencia)
            });
        }

        const sequencia = dados[0].ultimoDia === ontem
            ? Number(dados[0].sequencia) + 1
            : 1;

        const [registro] = await conexao.execute(`
            INSERT IGNORE INTO historico_xp (
                id_aluno,
                quantidade,
                motivo,
                chave_evento
            )
            VALUES (?, 10, 'Login diário', ?)
        `, [idAluno, `checkin-${hoje}`]);

        if (registro.affectedRows > 0) {
            await conexao.execute(`
                UPDATE gamificacao_aluno
                SET xp = xp + 10,
                    sequencia = ?,
                    ultimo_dia = ?
                WHERE id_aluno = ?
            `, [sequencia, hoje, idAluno]);
        }

        const [atualizado] = await conexao.execute(`
            SELECT xp, sequencia
            FROM gamificacao_aluno
            WHERE id_aluno = ?
        `, [idAluno]);

        await conexao.commit();

        return res.json({
            sucesso: true,
            jaRealizado: false,
            xp: Number(atualizado[0].xp),
            sequencia: Number(atualizado[0].sequencia),
            xpRecebido: registro.affectedRows > 0 ? 10 : 0
        });

    } catch (erro) {
        await conexao.rollback();

        console.error("Erro no check-in diário:", erro);

        return res.status(500).json({
            erro: "Não foi possível registrar o check-in."
        });

    } finally {
        conexao.release();
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
