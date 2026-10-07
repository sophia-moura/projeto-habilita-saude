(function () {
  const u = JSON.parse(localStorage.getItem("usuario") || "null");
  const el = document.getElementById("painelGamificacaoProf");
  if (!u || u.tipo !== "professor" || !el) return;

  const XP_NIVEL = 150;
  const cursos = JSON.parse(localStorage.getItem("cursos") || "[]");
  const mats = HS.matriculas();
  const publicados = cursos.filter((c) => c.status === "Publicado").length;
  const conclusoes = mats.filter((m) => m.status === "concluido").length;
  const conteudos = cursos.reduce((t, c) => t + (c.conteudos || []).length, 0);

  const xp = publicados * 50 + (cursos.length - publicados) * 10 + mats.length * 10 + conclusoes * 25 + conteudos * 5;
  const nivel = Math.floor(xp / XP_NIVEL) + 1;
  const noNivel = xp % XP_NIVEL;

  const ativos = cursos.filter((c) => c.status === "Publicado");
  const media = ativos.length ? ativos.reduce((t, c) => t + (c.avaliacao || 0), 0) / ativos.length : 0;
  const expert = ativos.some((c) => c.nivel === "expert");
  const CONQUISTAS = [
    { id: "p1", icone: "📘", nome: "Autor", desc: "Publique 1 curso", ok: publicados >= 1 },
    { id: "ref", icone: "🌟", nome: "Professor Referência", desc: "3 cursos ativos e nota média ≥ 4,5", ok: ativos.length >= 3 && media >= 4.5 },
    { id: "m100", icone: "🚀", nome: "100 matrículas", desc: "Ganhe crédito de tráfego pago", ok: mats.length >= 100 },
    { id: "exp", icone: "🔓", nome: "Expert aprovado", desc: "Desbloqueia ferramentas avançadas", ok: expert },
    { id: "c1", icone: "🎓", nome: "Formador", desc: "1 aluno concluiu", ok: conclusoes >= 1 },
    { id: "n3", icone: "⭐", nome: "Mestre", desc: "Chegue ao nível 3", ok: nivel >= 3 },
  ];

  const chave = "gamprof_" + u.email;
  const antigas = JSON.parse(localStorage.getItem(chave) || "[]");
  const atuais = CONQUISTAS.filter((c) => c.ok).map((c) => c.id);
  CONQUISTAS.filter((c) => c.ok && !antigas.includes(c.id)).forEach((c) => {
    HS.notificar("Nova conquista", `${c.icone} Você desbloqueou "${c.nome}".`, "relatorio", "professor");
  });
  localStorage.setItem(chave, JSON.stringify(atuais));

  const alunos = Object.keys(localStorage).filter((k) => k.startsWith("gam_")).map((k) => {
    const m = mats.find((x) => "gam_" + x.email === k);
    return m ? { nome: m.nome, xp: JSON.parse(localStorage.getItem(k)).xp } : null;
  }).filter(Boolean).sort((a, b) => b.xp - a.xp).slice(0, 5);
  const medalhas = ["🥇", "🥈", "🥉"];

  el.innerHTML = `
    <style>
      .gam{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin:20px 0}
      .gam-card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
      .gam-card h3{margin:0 0 12px;font-size:15px;color:#163b97}
      .gam-nivel{display:flex;align-items:center;gap:14px}
      .gam-nivel b{background:#163b97;color:#fff;border-radius:50%;width:56px;height:56px;display:grid;place-items:center;font-size:22px}
      .gam-barra{height:10px;background:#e8edf7;border-radius:8px;overflow:hidden;margin-top:6px}
      .gam-barra div{height:100%;background:linear-gradient(90deg,#4f7cff,#163b97)}
      .gam-badges{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
      .gam-badge{text-align:center;padding:10px 6px;border-radius:12px;background:#f3f6fc;font-size:12px}
      .gam-badge span{display:block;font-size:26px}
      .gam-badge.off{opacity:.35;filter:grayscale(1)}
      .gam-rank div{display:flex;justify-content:space-between;padding:8px 10px;font-size:14px}
      @media(max-width:900px){.gam{grid-template-columns:1fr}}
    </style>
    <div class="gam">
      <div class="gam-card">
        <h3>🎮 Sua jornada como professor</h3>
        <div class="gam-nivel"><b>${nivel}</b>
          <div style="flex:1"><strong>Nível ${nivel}</strong> · ${xp} XP
            <div class="gam-barra"><div style="width:${(noNivel * 100) / XP_NIVEL}%"></div></div>
            <small>${XP_NIVEL - noNivel} XP para o nível ${nivel + 1}</small></div></div>
        <div class="gam-badges">${CONQUISTAS.map((c) => `<div class="gam-badge ${c.ok ? "" : "off"}" title="${c.desc}"><span>${c.icone}</span><strong>${c.nome}</strong><br><small>${c.desc}</small></div>`).join("")}</div>
      </div>
      <div class="gam-card gam-rank">
        <h3>🏆 Alunos mais engajados</h3>
        ${alunos.length ? alunos.map((a, i) => `<div><span>${medalhas[i] || i + 1 + "º"} ${a.nome}</span><span>${a.xp} XP</span></div>`).join("") : "<small>Ainda não há alunos com XP.</small>"}
        <small style="display:block;margin-top:10px;color:#6b7a99">Ganhe XP: curso publicado +50 · rascunho +10 · matrícula +10 · aluno concluiu +25 · conteúdo +5</small>
      </div>
    </div>`;
})();
