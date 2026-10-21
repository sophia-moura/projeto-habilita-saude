CREATE DATABASE IF NOT EXISTS habilita_saude
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE habilita_saude;

-- usuário
CREATE TABLE aluno (
    id_aluno    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    CONSTRAINT pk_aluno PRIMARY KEY (id_aluno),
    CONSTRAINT uk_aluno_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE professor (
    id_professor INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome         VARCHAR(150) NOT NULL,
    email        VARCHAR(150) NOT NULL,
    senha_hash   VARCHAR(255) NOT NULL,
    curriculo    TEXT NULL,
    CONSTRAINT pk_professor PRIMARY KEY (id_professor),
    CONSTRAINT uk_professor_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE curso (
    id_curso      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_professor  INT UNSIGNED NOT NULL,
    nome_curso    VARCHAR(150) NOT NULL,
    descricao     TEXT NULL,
    preco         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status        ENUM('rascunho','publicado') NOT NULL DEFAULT 'rascunho',
    CONSTRAINT pk_curso PRIMARY KEY (id_curso),
    CONSTRAINT fk_curso_professor FOREIGN KEY (id_professor)
        REFERENCES professor (id_professor),
    CONSTRAINT chk_curso_preco CHECK (preco >= 0)
) ENGINE=InnoDB;

CREATE TABLE modulo (
    id_modulo  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_curso   INT UNSIGNED NOT NULL,
    titulo     VARCHAR(150) NOT NULL,
    ordem      INT UNSIGNED NOT NULL,
    CONSTRAINT pk_modulo PRIMARY KEY (id_modulo),
    CONSTRAINT fk_modulo_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE aula (
    id_aula    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_modulo  INT UNSIGNED NOT NULL,
    titulo     VARCHAR(150) NOT NULL,
    conteudo   TEXT NULL,
    ordem      INT UNSIGNED NOT NULL,
    CONSTRAINT pk_aula PRIMARY KEY (id_aula),
    CONSTRAINT fk_aula_modulo FOREIGN KEY (id_modulo)
        REFERENCES modulo (id_modulo) ON DELETE CASCADE
) ENGINE=InnoDB;

-- vendas e aprendizagem
CREATE TABLE compra (
    id_compra    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_aluno     INT UNSIGNED NOT NULL,
    data_compra  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total  DECIMAL(10,2) NOT NULL,
    status       ENUM('pendente','paga','cancelada') NOT NULL DEFAULT 'pendente',
    CONSTRAINT pk_compra PRIMARY KEY (id_compra),
    CONSTRAINT fk_compra_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno),
    CONSTRAINT chk_compra_valor CHECK (valor_total >= 0)
) ENGINE=InnoDB;

CREATE TABLE item_compra (
    id_compra       INT UNSIGNED NOT NULL,
    id_curso        INT UNSIGNED NOT NULL,
    valor_unitario  DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_item_compra PRIMARY KEY (id_compra, id_curso),
    CONSTRAINT fk_item_compra_compra FOREIGN KEY (id_compra)
        REFERENCES compra (id_compra) ON DELETE CASCADE,
    CONSTRAINT fk_item_compra_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso),
    CONSTRAINT chk_item_valor CHECK (valor_unitario >= 0)
) ENGINE=InnoDB;

CREATE TABLE matricula (
    id_matricula    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_aluno        INT UNSIGNED NOT NULL,
    id_curso        INT UNSIGNED NOT NULL,
    data_matricula  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    progresso       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    nota_final      DECIMAL(5,2) NULL,
    situacao        ENUM('em_andamento','aprovado','reprovado') NOT NULL DEFAULT 'em_andamento',
    CONSTRAINT pk_matricula PRIMARY KEY (id_matricula),
    CONSTRAINT uk_matricula_aluno_curso UNIQUE (id_aluno, id_curso),
    CONSTRAINT fk_matricula_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno),
    CONSTRAINT fk_matricula_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso),
    CONSTRAINT chk_matricula_progresso CHECK (progresso BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE certificado (
    id_certificado    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_matricula      INT UNSIGNED NOT NULL,
    codigo_validacao  VARCHAR(50) NOT NULL,
    data_emissao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_certificado PRIMARY KEY (id_certificado),
    CONSTRAINT uk_certificado_matricula UNIQUE (id_matricula),
    CONSTRAINT uk_certificado_codigo UNIQUE (codigo_validacao),
    CONSTRAINT fk_certificado_matricula FOREIGN KEY (id_matricula)
        REFERENCES matricula (id_matricula)
) ENGINE=InnoDB;

CREATE TABLE avaliacao (
    id_avaliacao     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_matricula     INT UNSIGNED NOT NULL,
    nota             TINYINT UNSIGNED NOT NULL,
    comentario       TEXT NULL,
    data_avaliacao   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_avaliacao PRIMARY KEY (id_avaliacao),
    CONSTRAINT uk_avaliacao_matricula UNIQUE (id_matricula),
    CONSTRAINT fk_avaliacao_matricula FOREIGN KEY (id_matricula)
        REFERENCES matricula (id_matricula),
    CONSTRAINT chk_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- relatórios, notificações e suporte
CREATE TABLE relatorio (
    id_relatorio    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_professor    INT UNSIGNED NOT NULL,
    id_curso        INT UNSIGNED NULL,
    tipo            ENUM('vendas','matriculas','avaliacoes','desempenho') NOT NULL,
    periodo_inicio  DATE NOT NULL,
    periodo_fim     DATE NOT NULL,
    data_geracao    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conteudo        LONGTEXT NULL,
    CONSTRAINT pk_relatorio PRIMARY KEY (id_relatorio),
    CONSTRAINT fk_relatorio_professor FOREIGN KEY (id_professor)
        REFERENCES professor (id_professor),
    CONSTRAINT fk_relatorio_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso),
    CONSTRAINT chk_relatorio_periodo CHECK (periodo_fim >= periodo_inicio)
) ENGINE=InnoDB;

CREATE TABLE notificacao (
    id_notificacao  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_aluno        INT UNSIGNED NULL,
    id_professor    INT UNSIGNED NULL,
    titulo          VARCHAR(150) NOT NULL,
    mensagem        TEXT NOT NULL,
    data_envio      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lida            BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_notificacao PRIMARY KEY (id_notificacao),
    CONSTRAINT fk_notificacao_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno),
    CONSTRAINT fk_notificacao_professor FOREIGN KEY (id_professor)
        REFERENCES professor (id_professor),
    CONSTRAINT chk_notificacao_destinatario CHECK
        ((id_aluno IS NOT NULL AND id_professor IS NULL)
      OR (id_aluno IS NULL AND id_professor IS NOT NULL))
) ENGINE=InnoDB;

CREATE TABLE chamado_suporte (
    id_chamado      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_aluno        INT UNSIGNED NULL,
    id_professor    INT UNSIGNED NULL,
    assunto         VARCHAR(150) NOT NULL,
    descricao       TEXT NOT NULL,
    status          ENUM('aberto','em_atendimento','resolvido') NOT NULL DEFAULT 'aberto',
    data_abertura   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_chamado PRIMARY KEY (id_chamado),
    CONSTRAINT fk_chamado_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno),
    CONSTRAINT fk_chamado_professor FOREIGN KEY (id_professor)
        REFERENCES professor (id_professor),
    CONSTRAINT chk_chamado_solicitante CHECK
        ((id_aluno IS NOT NULL AND id_professor IS NULL)
      OR (id_aluno IS NULL AND id_professor IS NOT NULL))
) ENGINE=InnoDB;

-- ações
SHOW TABLES;            
DESCRIBE matricula;     
SHOW CREATE TABLE notificacao;

-- testes fictícios
INSERT INTO professor (nome, email, senha_hash) VALUES ('Professor Teste', 'prof@teste.com', 'hash_teste');
INSERT INTO aluno (nome, email, senha_hash) VALUES ('Aluno Teste', 'aluno@teste.com', 'hash_teste');
INSERT INTO curso (id_professor, nome_curso, preco, status) VALUES (1, 'Curso de Teste', 100.00, 'publicado');

INSERT INTO compra (id_aluno, valor_total, status) VALUES (1, 100.00, 'paga');
INSERT INTO item_compra (id_compra, id_curso, valor_unitario) VALUES (1, 1, 100.00);
INSERT INTO matricula (id_aluno, id_curso) VALUES (1, 1);

-- aluno aprovado:
UPDATE matricula SET situacao = 'aprovado', nota_final = 8.00, progresso = 100 WHERE id_matricula = 1;
INSERT INTO certificado (id_matricula, codigo_validacao) VALUES (1, 'COD-TESTE-001');

-- notificação sem destinatário:  
INSERT INTO notificacao (titulo, mensagem) VALUES ('Teste', 'Sem destinatário');

-- vendas por professor, calculadas sem tabela de finanças:
SELECT p.nome, SUM(ic.valor_unitario) AS total_vendas
FROM item_compra ic
JOIN compra c    ON c.id_compra = ic.id_compra AND c.status = 'paga'
JOIN curso cs    ON cs.id_curso = ic.id_curso
JOIN professor p ON p.id_professor = cs.id_professor
GROUP BY p.id_professor, p.nome;
