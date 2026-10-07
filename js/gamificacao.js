(function () {
  const u = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!u || u.tipo !== "aluno") return;

  const CHAVE = "gam_" + u.email;
  const XP_NIVEL = 100;
  const hoje = () => new Date().toISOString().slice(0, 10);
  const ler = () => JSON.parse(localStorage.getItem(CHAVE) || "null") || { xp: 0, conquistas: [], sequencia: 0, ultimoDia: "", historico: [] };
  const salvar = (g) => localStorage.setItem(CHAVE, JSON.stringify(g));
  const meusCursos = () => JSON.parse(localStorage.getItem("cursosAluno_v2") || "[]");

  const CONQUISTAS = [
    { id: "matricula", icone: "🎓", nome: "Primeiro passo", desc: "Matricule-se em um curso", ok: () => meusCursos().length >= 1 },
    { id: "tres", icone: "📚", nome: "Curioso", desc: "Esteja em 3 cursos", ok: () => meusCursos().length >= 3 },
    { id: "concluido", icone: "🏅", nome: "Formado", desc: "Conclua 1 curso", ok: () => meusCursos().filter((c) => c.status === "concluido").length >= 1 },
    { id: "tresconcl", icone: "🏆", nome: "Dedicado", desc: "Conclua 3 cursos", ok: () => meusCursos().filter((c) => c.status === "concluido").length >= 3 },
    { id: "seq3", icone: "🔥", nome: "Em chamas", desc: "3 dias seguidos", ok: (g) => g.sequencia >= 3 },
    { id: "nivel3", icone: "⭐", nome: "Veterano", desc: "Chegue ao nível 3", ok: (g) => g.xp >= XP_NIVEL * 2 },
  ];

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:9999;background:#163b97;color:#fff;padding:14px 18px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.25);font:600 14px Inter,sans-serif;animation:toastIn .45s cubic-bezier(.2,1.4,.4,1) both";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function conferirConquistas(g) {
    CONQUISTAS.forEach((c) => {
      if (!g.conquistas.includes(c.id) && c.ok(g)) {
        g.conquistas.push(c.id);
        toast(`${c.icone} Conquista desbloqueada: ${c.nome}!`);
        HS.confete && HS.confete();
        HS.notificar("Nova conquista", `${c.icone} Você desbloqueou "${c.nome}".`, "certificado", "aluno");
      }
    });
  }

  function xp(qtd, motivo) {
    const g = ler();
    const nivelAntes = Math.floor(g.xp / XP_NIVEL) + 1;
    g.xp += qtd;
    g.historico.unshift({ qtd, motivo, data: new Date().toLocaleString("pt-BR") });
    g.historico = g.historico.slice(0, 20);
    toast(`+${qtd} XP · ${motivo}`);
    const nivel = Math.floor(g.xp / XP_NIVEL) + 1;
    if (nivel > nivelAntes) { toast(`🎉 Você subiu para o nível ${nivel}!`); HS.confete && HS.confete(); }
    conferirConquistas(g);
    salvar(g);
  }

  function checkin() {
    const g = ler();
    if (g.ultimoDia === hoje()) return;
    const ontem = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    g.sequencia = g.ultimoDia === ontem ? g.sequencia + 1 : 1;
    g.ultimoDia = hoje();
    g.xp += 10;
    salvar(g);
    toast(`🔥 Sequência de ${g.sequencia} dia(s)! +10 XP`);
    const g2 = ler();
    conferirConquistas(g2);
    salvar(g2);
  }

  function ranking() {
    const demo = [{ nome: "Mariana S.", xp: 420 }, { nome: "Carlos P.", xp: 260 }, { nome: "Beatriz L.", xp: 150 }];
    const reais = Object.keys(localStorage).filter((k) => k.startsWith("gam_") && k !== CHAVE).map((k) => {
      const outro = JSON.parse(localStorage.getItem("matriculas") || "[]").find((m) => "gam_" + m.email === k);
      return { nome: outro ? outro.nome : k.slice(4), xp: JSON.parse(localStorage.getItem(k)).xp };
    });
    return [...demo, ...reais, { nome: u.nome + " (você)", xp: ler().xp, eu: true }].sort((a, b) => b.xp - a.xp);
  }

  function renderizar(idContainer) {
    const el = document.getElementById(idContainer);
    if (!el) return;
    const g = ler();
    const nivel = Math.floor(g.xp / XP_NIVEL) + 1;
    const noNivel = g.xp % XP_NIVEL;
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
        .gam-rank div{display:flex;justify-content:space-between;padding:8px 10px;border-radius:8px;font-size:14px}
        .gam-rank .eu{background:#e8edf7;font-weight:700}
        @media(max-width:900px){.gam{grid-template-columns:1fr}}
      </style>
      <div class="gam">
        <div class="gam-card">
          <h3>🎮 Seu progresso</h3>
          <div class="gam-nivel"><b>${nivel}</b>
            <div style="flex:1"><strong>Nível ${nivel}</strong> · ${g.xp} XP · 🔥 ${g.sequencia} dia(s) seguidos
              <div class="gam-barra"><div style="width:${noNivel}%"></div></div>
              <small>${XP_NIVEL - noNivel} XP para o nível ${nivel + 1}</small></div></div>
          <div class="gam-badges">${CONQUISTAS.map((c) => `<div class="gam-badge ${g.conquistas.includes(c.id) ? "" : "off"}" title="${c.desc}"><span>${c.icone}</span><strong>${c.nome}</strong><br><small>${c.desc}</small></div>`).join("")}</div>
        </div>
        <div class="gam-card gam-rank">
          <h3>🏆 Ranking de alunos</h3>
          ${ranking().map((r, i) => `<div class="${r.eu ? "eu" : ""}"><span>${medalhas[i] || i + 1 + "º"} ${r.nome}</span><span>${r.xp} XP</span></div>`).join("")}
          <small style="display:block;margin-top:10px;color:#6b7a99">Ganhe XP: matrícula +20 · avançar no curso +30 · concluir +100 · login diário +10</small>
        </div>
      </div>`;
  }

  window.HS.gam = { xp, checkin, renderizar };
  checkin();
})();
