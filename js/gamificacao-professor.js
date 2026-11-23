(async function () {
  await window.HS.ready;

  const u = window.HS.usuario;
  const el = document.getElementById("painelGamificacaoProf");

  if (!u || u.tipo !== "professor" || !el) return;

  const XP_NIVEL = 150;

  API.get("/professor/gamificacao")
    .then((dados) => {
      const publicados = Number(dados.publicados) || 0;
      const rascunhos = Number(dados.rascunhos) || 0;
      const matriculas = Number(dados.matriculas) || 0;
      const conclusoes = Number(dados.conclusoes) || 0;
      const conteudos = Number(dados.conteudos) || 0;
      const media = Number(dados.mediaAvaliacoes) || 0;
      const cursosExpert = Number(dados.cursosExpert) || 0;

      const totalCursos = Number(dados.totalCursos) || 0;

      const xp = Number(dados.xp) || 0;
      const nivel = Number(dados.nivel) || 1;
      const noNivel = xp % XP_NIVEL;

      const conquistasSalvas = new Set(
        (dados.conquistas || []).map(
          (c) => c.codigo_conquista
        )
      );

      const CONQUISTAS = [
        {
          id: "p1",
          icone: "📘",
          nome: "Autor",
          desc: "Publique 1 curso",
        },
        {
          id: "ref",
          icone: "🌟",
          nome: "Professor Referência",
          desc: "3 cursos ativos e nota média ≥ 4,5",
        },
        {
          id: "m100",
          icone: "🚀",
          nome: "100 matrículas",
          desc: "Ganhe crédito de tráfego pago",
        },
        {
          id: "exp",
          icone: "🔓",
          nome: "Expert aprovado",
          desc: "Desbloqueia ferramentas avançadas",
        },
        {
          id: "c1",
          icone: "🎓",
          nome: "Formador",
          desc: "1 aluno concluiu",
        },
        {
          id: "n3",
          icone: "⭐",
          nome: "Mestre",
          desc: "Chegue ao nível 3",
        },
      ];

      const novasConquistas = new Set(
        dados.novasConquistas || []
      );

      CONQUISTAS
        .filter((c) => novasConquistas.has(c.id))
        .forEach((c) => {
          HS.notificar(
            "Nova conquista",
            `${c.icone} Você desbloqueou "${c.nome}".`,
            "relatorio",
            "professor"
          );
        });

      el.innerHTML = `
        <style>
          .gam{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin:20px 0}
          .gam-card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
          .gam-card h2{margin:0 0 12px;font-size:15px;color:#0055c3}
          .gam-nivel{display:flex;align-items:center;gap:14px}
          .gam-nivel b{background:#0055c3;color:#fff;border-radius:50%;width:56px;height:56px;display:grid;place-items:center;font-size:22px}
          .gam-barra{height:10px;background:#e2e8f0;border-radius:8px;overflow:hidden;margin-top:6px}
          .gam-barra div{height:100%;background:linear-gradient(90deg,#4f7cff,#0055c3)}
          .gam-badges{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
          .gam-badge{text-align:center;padding:10px 6px;border-radius:12px;background:#f3f6fc;font-size:12px}
          .gam-badge span{display:block;font-size:26px}
          .gam-badge.off{opacity:1;filter:grayscale(1);background:#eef2f7;color:#475569}
          .gam-rank div{display:flex;justify-content:space-between;padding:8px 10px;font-size:14px}
          @media(max-width:900px){.gam{grid-template-columns:1fr}}
        </style>

        <div class="gam">
          <div class="gam-card">
            <h2>🎮 Sua jornada como professor</h2>

            <div class="gam-nivel">
              <b>${nivel}</b>
              <div style="flex:1">
                <strong>Nível ${nivel}</strong> · ${xp} XP

                <div class="gam-barra">
                  <div style="width:${(noNivel * 100) / XP_NIVEL}%"></div>
                </div>

                <small>${XP_NIVEL - noNivel} XP para o nível ${nivel + 1}</small>
              </div>
            </div>

            <div class="gam-badges">
              ${CONQUISTAS.map((c) => `
                <div class="gam-badge ${conquistasSalvas.has(c.id) ? "" : "off"}" title="${c.desc}">
                  <span>${c.icone}</span>
                  <strong>${c.nome}</strong>
                  <br>
                  <small>${c.desc}</small>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="gam-card gam-rank">
            <h2>🏆 Seu desempenho</h2>

            <div>
              <span>Cursos publicados</span>
              <span>${publicados}</span>
            </div>

            <div>
              <span>Matrículas</span>
              <span>${matriculas}</span>
            </div>

            <div>
              <span>Alunos concluintes</span>
              <span>${conclusoes}</span>
            </div>

            <div>
              <span>Conteúdos criados</span>
              <span>${conteudos}</span>
            </div>

            <div>
              <span>Média de avaliações</span>
              <span>${media.toFixed(1)} ⭐</span>
            </div>

            <small style="display:block;margin-top:10px;color:var(--hs-legenda,#5b6b80)">
              XP: curso publicado +50 · rascunho +10 · matrícula +10 · aluno concluiu +25 · conteúdo +5
            </small>
          </div>
        </div>
      `;
    })
    .catch((erro) => {
      console.error("Erro na gamificação:", erro);

      el.innerHTML = `
        <p>Não foi possível carregar a gamificação do professor.</p>
      `;
    });
})();