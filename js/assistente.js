/* HabilitaSaúde • Assistente de navegação
   Respostas predefinidas + busca por palavras-chave. Nenhuma IA ou backend.
   NÃO recebe dados de pacientes, não avalia casos clínicos e não emite certificados. */
(() => {
  'use strict';
  if (window.__hsAssistenteIniciado) return;
  window.__hsAssistenteIniciado = true;
  const p = location.pathname.toLowerCase();
  const baseHref = document.currentScript?.src ? new URL('../', document.currentScript.src) : new URL('./', location.href);
  if (p.endsWith('/dashboard.html')) return; // página de redirecionamento

  const professor = [
    {id:'criar',title:'Como criar um curso?',emoji:'📚',keywords:['criar','curso novo','cadastrar curso','publicar','aula nova','adicionar curso'],answer:'Na área do professor, abra Criar curso. Preencha as informações, organize os conteúdos e confira o nível de certificação.',link:'criar-curso.html',linkTitle:'Ir para Criar curso'},
    {id:'cursos',title:'Onde vejo meus cursos?',emoji:'🗂️',keywords:['meus cursos','editar curso','gerenciar curso','lista de cursos','curso'],answer:'Você pode consultar os cursos cadastrados e abrir a edição no menu Meus cursos.',link:'professor-meus-cursos.html',linkTitle:'Ver meus cursos'},
    {id:'niveis',title:'Quais são os três níveis?',emoji:'🏅',keywords:['nivel','certificado','certificacao','operacional','estrategico','expert','preco','repasses'],answer:'A plataforma apresenta três modelos: Operacional (Qualificação e Capacitação), Estratégico (Atualização e Aperfeiçoamento) e Expert (Proficiência Avançada). As regras e valores reais precisam ser confirmados pela equipe.',link:'configuracoes-niveis.html',linkTitle:'Ver os níveis'},
    {id:'alunos',title:'Como vejo alunos?',emoji:'👥',keywords:['aluno','usuario','inscritos','matriculas','matriculados','turma'],answer:'A tela Usuários reúne as informações dos participantes dos cursos.',link:'usuarios.html',linkTitle:'Abrir Usuários'},
    {id:'relatorios',title:'Onde encontro relatórios?',emoji:'📈',keywords:['relatorio','estatistica','metricas','desempenho','indicador','grafico'],answer:'Consulte Relatórios para acompanhar os indicadores dos seus cursos.',link:'relatorios.html',linkTitle:'Abrir relatórios'},
    {id:'financeiro',title:'Como funcionam as finanças?',emoji:'💳',keywords:['financeiro','financa','receita','vendas','ganho','pagamento','repasse'],answer:'A página Finanças apresenta receitas e repasses. Atenção: os pagamentos da plataforma ainda são simulados em ambiente de desenvolvimento.',link:'financas.html',linkTitle:'Ver Finanças'},
    {id:'suporte',title:'Preciso de suporte',emoji:'💬',keywords:['suporte','ajuda','duvida','problema','erro','chamado','atendimento'],answer:'Você pode acessar a área de Suporte para ver os recursos disponíveis.',link:'professor-suporte.html',linkTitle:'Abrir Suporte'}
  ];
  const aluno = [
    {id:'estudar',title:'Como continuar estudando?',emoji:'📖',keywords:['continuar','estudar','aula','assistir','video','conteudo','aprender'],answer:'Entre em Meus cursos e abra o curso desejado para continuar o conteúdo.',link:'aluno-meus-cursos.html',linkTitle:'Abrir meus cursos'},
    {id:'progresso',title:'Onde vejo meu progresso?',emoji:'📊',keywords:['progresso','concluido','concluir','percentual','andamento','desempenho','minhas aulas'],answer:'Seu painel e a área Meus cursos mostram o andamento de cada formação.',link:'aluno-meus-cursos.html',linkTitle:'Consultar progresso'},
    {id:'certificado',title:'Como vejo certificados?',emoji:'🏆',keywords:['certificado','certificacao','baixar','pdf','imprimir','operacional','estrategico','expert','validar'],answer:'Abra Certificados para baixar em PDF os certificados dos cursos concluídos. Para conferir a autenticidade, use Validar certificado com o código impresso no documento.',link:'certificados.html',linkTitle:'Abrir Certificados'},
    {id:'cursos',title:'Onde estão meus cursos?',emoji:'🗂️',keywords:['meus cursos','matricula','matriculado','curso','cursos disponiveis','inscricao'],answer:'Na área Meus cursos, você encontra suas formações, o progresso e o acesso às aulas.',link:'aluno-meus-cursos.html',linkTitle:'Ver meus cursos'},
    {id:'suporte',title:'Preciso de suporte',emoji:'💬',keywords:['suporte','ajuda','duvida','erro','problema','chamado','atendimento'],answer:'Acesse Suporte para conhecer a central de ajuda.',link:'aluno-suporte.html',linkTitle:'Abrir Suporte'},
    {id:'perfil',title:'Como vejo meu perfil?',emoji:'👤',keywords:['perfil','minha conta','meus dados','senha','foto'],answer:'A área Perfil exibe os dados da sua conta.',link:'perfil.html',linkTitle:'Abrir Perfil'}
  ];
  const common = {
    saudacao: { answer:'Oi! Sou o assistente do HabilitaSaúde. Posso orientar você pelas telas e explicar funcionalidades usando respostas previamente cadastradas. Não sou uma IA conectada à internet.' },
    limite: { answer:'Sou um assistente de navegação. Não consigo consultar os dados da sua conta, confirmar matrícula, realizar pagamentos, emitir certificados oficiais nem responder questões clínicas.' },
    clinico: { answer:'Este assistente não fornece orientação clínica, diagnósticos nem condutas para pacientes. Para dúvidas do conteúdo, consulte o professor responsável pelo curso.' }
  };
  function normalizar(s) {return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
  const flags = {visivel:false, historico:false};
  const bodyReady = async () => {
    const path = p.split('/').pop();
    const user = await HS.carregarUsuario();
    const isProfessor = path.startsWith('professor-') || ['criar-curso.html','configuracoes-niveis.html','financas.html','relatorios.html','usuarios.html'].includes(path);
    const isAluno = path.startsWith('aluno-') || ['aula.html','certificados.html','pagamento.html'].includes(path);
    let modo = isProfessor ? 'professor' : isAluno ? 'aluno' : user?.tipo === 'professor' ? 'professor' : 'aluno';
    let data = modo === 'professor' ? professor : aluno;
    const dom = document.createElement('div'); dom.className = 'hsas';
    dom.innerHTML = `
      <button type="button" class="hsas-launch" aria-controls="hsas-dialog" aria-expanded="false" aria-label="Abrir assistente do HabilitaSaúde"><span class="hsas-launch-icon" aria-hidden="true">✦</span><span>Precisa de ajuda?</span></button>
      <section class="hsas-dialog" id="hsas-dialog" aria-label="Assistente virtual" hidden>
        <header class="hsas-head"><div class="hsas-logo" aria-hidden="true">✦</div><div class="hsas-head-title"><strong>Assistente Habilita</strong><small><span class="hsas-dot"></span>Ajuda interativa</small></div><button class="hsas-close" aria-label="Fechar assistente" type="button">×</button></header>
        <div class="hsas-mode" aria-label="Escolher tipo de ajuda"><span>Orientação para</span><div role="group" aria-label="Perfil"><button type="button" data-mode="aluno">Aluno</button><button type="button" data-mode="professor">Professor</button></div></div>
        <div class="hsas-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensagens do assistente"></div>
        <div class="hsas-suggestions"><p>Dúvidas frequentes</p><div class="hsas-chips"></div></div>
        <form class="hsas-form"><label class="hsas-sr" for="hsas-input">Sua pergunta</label><input id="hsas-input" type="text" placeholder="Digite sua dúvida..." maxlength="240" autocomplete="off"><button type="submit" aria-label="Enviar pergunta">➜</button></form>
        <div class="hsas-note">Respostas automáticas • Não é atendimento humano nem IA clínica</div>
      </section>`;
    document.body.append(dom);
    const launch = dom.querySelector('.hsas-launch'), dlg = dom.querySelector('.hsas-dialog'), msg = dom.querySelector('.hsas-messages'), chips = dom.querySelector('.hsas-chips'), form = dom.querySelector('.hsas-form'), input = dom.querySelector('#hsas-input'), close = dom.querySelector('.hsas-close');
    function addMessage(text, who='bot', action=null) {
      const item=document.createElement('div'); item.className=`hsas-message hsas-${who}`;
      const bubble=document.createElement('div'); bubble.className='hsas-bubble';bubble.textContent=text;item.appendChild(bubble);
      if (action) {
        const link=document.createElement('a');link.className='hsas-link';link.href=new URL(action.link,baseHref).href;link.textContent=action.linkTitle+' →';link.setAttribute('aria-label',action.linkTitle);item.appendChild(link);
      }
      msg.appendChild(item);msg.scrollTop=msg.scrollHeight;
    }
    function boasVindas() {
      msg.replaceChildren();
      addMessage(`Olá! 👋 Sou o assistente do HabilitaSaúde. Você está na orientação para ${modo}. Escolha uma dúvida ou escreva sua pergunta.`);
      flags.historico=true;
    }
    function renderChips() {
      data=modo === 'professor' ? professor : aluno;
      dom.querySelectorAll('[data-mode]').forEach(b=>{const sel=b.dataset.mode===modo;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',String(sel));});
      chips.replaceChildren();
      data.slice(0,6).forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.emoji+' '+x.title; b.addEventListener('click',()=>answer(x.title,x));chips.appendChild(b);});
    }
    function answer(question, forced=null){
      const q=normalizar(question);if(!q)return;
      addMessage(question,'me');
      let match=forced;
      if (!match) {
        if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|tudo bem)$/.test(q)) {addMessage(common.saudacao.answer);return;}
        if (/diagnostico|paciente real|remedio|medicamento|prescricao|dose|sintoma|tratamento|emergencia medica/.test(q)) {addMessage(common.clinico.answer);return;}
        const score = row => row.keywords.reduce((s,k)=>{const t=normalizar(k);return s+(q.includes(t) ? 1+Math.min(t.length/12,2):0);},0);
        const scored = data.map(item=>({item,points:score(item)})).sort((a,b)=>b.points-a.points);
        if(scored[0]?.points > 0)match=scored[0].item;
      }
      if(match) addMessage(match.answer,'bot',match);
      else addMessage('Ainda não tenho uma resposta cadastrada para isso. Posso ajudar com cursos, certificados, progresso, navegação e suporte. Escolha uma das dúvidas frequentes acima.');
    }
    function setModo(next){modo=next;renderChips();boasVindas();}
    function show(visible){flags.visivel=visible;dlg.hidden=!visible;launch.setAttribute('aria-expanded',String(visible)); launch.classList.toggle('open',visible); if(visible){if(!flags.historico)boasVindas();input.focus();}else launch.focus();}
    launch.addEventListener('click',()=>show(!flags.visivel));
    close.addEventListener('click',()=>show(false));
    dlg.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();show(false);}});
    dom.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setModo(b.dataset.mode)));
    form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q)return;input.value='';answer(q);input.focus();});
    renderChips();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bodyReady,{once:true});
  else bodyReady();
})();
