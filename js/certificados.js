const CERTS = {
    'cert-psocorros': null,
    'cert-fisio': null
  };
  document.querySelectorAll('.cert-card').forEach(el=>{
    CERTS[el.id] = {
      course: el.dataset.course, student: el.dataset.student,
      date: el.dataset.date, hours: el.dataset.hours, code: el.dataset.code
    };
  });

  function copyCode(el, code){
    navigator.clipboard.writeText(code).catch(()=>{});
    const txt = el.querySelector('.copy-txt');
    const prev = txt.textContent;
    el.classList.add('copied');
    txt.textContent = 'Copiado!';
    setTimeout(()=>{ el.classList.remove('copied'); txt.textContent = prev; }, 1600);
  }

  function goToCert(id){
    const el = document.getElementById(id);
    el.scrollIntoView({behavior:'smooth', block:'center'});
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  function viewCert(id){
    const c = CERTS[id];
    document.getElementById('modalCourse').textContent = c.course;
    document.getElementById('modalStudent').textContent = c.student;
    document.getElementById('modalMeta').textContent = `Concluído em ${c.date} · ${c.hours}`;
    document.getElementById('modalCode').textContent = c.code;
    document.getElementById('certModal').classList.add('show');
  }
  function closeModal(){ document.getElementById('certModal').classList.remove('show'); }

  function downloadCert(id){
    const c = CERTS[id];
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Certificado - ${c.course}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Playfair+Display:ital,wght@0,700;1,500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body{font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#F2F5FB;}
        .box{
          position:relative;overflow:hidden;text-align:center;padding:60px 70px;max-width:600px;border-radius:16px;
          background:linear-gradient(160deg,#F8FAFF,#EEF3FF);
          box-shadow:inset 0 0 0 1px #DCE5F7, inset 0 0 0 7px #fff, inset 0 0 0 8px #C9D6F2;
        }
        .box::before,.box::after{content:"";position:absolute;width:34px;height:34px;border-top:2px solid #B8860B;border-left:2px solid #B8860B;}
        .box::before{top:14px;left:14px;}
        .box::after{bottom:14px;right:14px;border-top:none;border-left:none;border-bottom:2px solid #B8860B;border-right:2px solid #B8860B;}
        .brandline{font-family:'Sora',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;color:#163B97;opacity:.7;margin-bottom:18px;}
        .seal{width:60px;height:60px;border-radius:50%;margin:0 auto 16px;background:radial-gradient(circle at 32% 28%,#E8C878,#B8860B 70%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 10px rgba(184,134,11,.35);}
        .kicker{font-size:11px;letter-spacing:3px;color:#68738F;font-weight:700;}
        .grants{font-family:'Playfair Display',serif;font-style:italic;font-size:13px;color:#68738F;margin:16px 0 6px;}
        h3{font-size:16px;margin:0 0 10px;color:#151C33;}
        h2{font-family:'Playfair Display',serif;font-style:italic;font-size:28px;margin:0 0 14px;color:#12307F;}
        p{color:#68738F;margin:4px 0;font-size:13px;}
        .code{margin-top:18px;padding-top:14px;border-top:1px solid #D4DEF3;font-weight:700;color:#163B97;letter-spacing:1px;font-family:'Sora',sans-serif;font-size:13px;}
      </style></head>
      <body onload="window.print()">
        <div class="box">
          <div class="brandline">HABILITA · SAÚDE</div>
          <div class="seal">✓</div>
          <div class="kicker">CERTIFICADO DE CONCLUSÃO</div>
          <div class="grants">é concedido a</div>
          <h3>${c.student}</h3>
          <h2>${c.course}</h2>
          <p>Carga horária: ${c.hours} · Concluído em ${c.date}</p>
          <p class="code">Código de validação: ${c.code}</p>
        </div>
      </body></html>
    `);
    w.document.close();
  }

  function shareLinkedin(id){
    const c = CERTS[id];
    const text = encodeURIComponent(`Concluí o curso "${c.course}" pela Habilita.Saúde — código de validação ${c.code}.`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://habilitasaude.com.br/validar/${c.code}&summary=${text}`, '_blank');
  }

  function verifyCode(){
    const input = document.getElementById('verifyInput').value.trim().toUpperCase();
    const result = document.getElementById('verifyResult');
    const found = Object.values(CERTS).find(c => c.code === input);
    if(found){
      result.className = 'verify-result show ok';
      result.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg><span><b>Certificado válido.</b> ${found.course} — ${found.student}, concluído em ${found.date} (${found.hours}).</span>`;
    } else {
      result.className = 'verify-result show fail';
      result.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg><span><b>Código não encontrado.</b> Confira se digitou corretamente.</span>`;
    }
  }
