/*
  Conteúdos de exemplo para os cursos de demonstração do aluno (ids 1 a 6).
  Cursos criados por professores usam os próprios conteúdos; estes servem de
  fallback para que a aula funcione logo após o primeiro acesso.
  Material introdutório, sem substituir protocolos oficiais nem treinamento prático.
*/
(function () {
  const texto = (nome, corpo) => ({ tipo: "texto", nome, texto: corpo.trim() });
  const quiz = (nome, perguntas, notaMinima = 70) => ({ tipo: "quiz", nome, notaMinima, perguntas });
  const q = (enunciado, opcoes, correta, explicacao) => ({ enunciado, opcoes, correta, explicacao });

  window.HS_CONTEUDOS_DEMO = {
    // Cardiologia na prática
    1: [
      texto(
        "Anatomia e função do coração",
        `
O coração é um órgão muscular com **quatro câmaras**: dois átrios (superiores) e dois ventrículos (inferiores).

## Circulação
- O lado direito recebe o sangue pouco oxigenado do corpo e o envia aos pulmões.
- O lado esquerdo recebe o sangue oxigenado dos pulmões e o distribui para o corpo.

As **valvas** garantem que o sangue siga sempre em um único sentido.`,
      ),
      texto(
        "Eletrocardiograma: noções básicas",
        `
O eletrocardiograma (ECG) registra a atividade elétrica do coração.

## Principais ondas
- **Onda P:** despolarização dos átrios.
- **Complexo QRS:** despolarização dos ventrículos.
- **Onda T:** repolarização dos ventrículos.

Alterações no traçado precisam sempre ser interpretadas junto com o quadro clínico do paciente.`,
      ),
      texto(
        "Fatores de risco cardiovascular",
        `
Alguns fatores de risco **não podem ser modificados**, como idade e histórico familiar. Outros podem ser controlados:

- Hipertensão arterial
- Tabagismo
- Diabetes e dislipidemia
- Sedentarismo e obesidade

A prevenção passa por acompanhamento regular, alimentação equilibrada e atividade física orientada.`,
      ),
      quiz("Quiz: fundamentos de cardiologia", [
        q("Qual parte do ECG representa a despolarização dos ventrículos?", ["Onda P", "Complexo QRS", "Onda T", "Segmento PR"], 1, "O complexo QRS corresponde à despolarização ventricular."),
        q("Qual destes é um fator de risco modificável?", ["Idade", "Histórico familiar", "Tabagismo", "Sexo biológico"], 2, "O tabagismo pode ser interrompido; os demais não podem ser alterados."),
        q("Quantas câmaras tem o coração humano?", ["Duas", "Três", "Quatro", "Seis"], 2, "São dois átrios e dois ventrículos."),
      ]),
    ],

    // Primeiros socorros essenciais
    2: [
      texto(
        "Avaliação inicial da cena",
        `
Antes de ajudar, **garanta a sua segurança** e a de quem está por perto. Só então avalie a vítima.

## Passos
- Verifique se há riscos: trânsito, fogo, eletricidade, instabilidade.
- Chame a vítima e observe se ela responde.
- Peça ajuda e ligue para o **SAMU (192)** quando houver risco à vida.

Nunca coloque a própria vida em risco para prestar socorro.`,
      ),
      texto(
        "Reanimação cardiopulmonar (RCP)",
        `
Quando a pessoa não responde e não respira normalmente, ligue **192** e inicie as compressões.

## Compressões em adultos
- Posicione as mãos no centro do tórax.
- Comprima em ritmo de **100 a 120 por minuto**.
- Profundidade de cerca de 5 cm, permitindo que o tórax retorne totalmente.
- Se houver um desfibrilador externo automático (DEA), use-o assim que disponível.

Faça o treinamento prático com instrutor habilitado antes de aplicar a técnica.`,
      ),
      texto(
        "Engasgo em adultos",
        `
Se a pessoa **tosse com força**, incentive a tosse e acompanhe.

Se ela não consegue falar, respirar ou tossir, trata-se de obstrução grave:

- Peça ajuda e acione o 192.
- Aplique as manobras de desobstrução conforme o treinamento recebido.
- Se a pessoa ficar inconsciente, inicie a RCP.`,
      ),
      quiz("Quiz: primeiros socorros", [
        q("Qual é o número do SAMU?", ["190", "192", "193", "197"], 1, "O SAMU atende pelo 192."),
        q("Qual é a primeira atitude ao chegar em uma cena de emergência?", ["Mover a vítima imediatamente", "Garantir a segurança da cena", "Oferecer água", "Aguardar a ambulância sem agir"], 1, "A segurança de quem socorre e da vítima vem primeiro."),
        q("Qual é a frequência recomendada das compressões torácicas em adultos?", ["60 a 80 por minuto", "80 a 100 por minuto", "100 a 120 por minuto", "140 a 160 por minuto"], 2, "O ritmo recomendado é de 100 a 120 compressões por minuto."),
      ]),
    ],

    // Nutrição clínica aplicada
    3: [
      texto(
        "Macronutrientes e micronutrientes",
        `
**Macronutrientes** fornecem energia e estrutura: carboidratos, proteínas e lipídios.

**Micronutrientes** são vitaminas e minerais, necessários em quantidades menores, mas essenciais ao funcionamento do organismo.

## Funções gerais
- Carboidratos: fonte de energia imediata.
- Proteínas: construção e reparo de tecidos.
- Lipídios: reserva de energia e absorção de vitaminas lipossolúveis.`,
      ),
      texto(
        "Avaliação do estado nutricional",
        `
O **IMC** é calculado dividindo o peso (kg) pela altura (m) elevada ao quadrado.

## Classificação para adultos (OMS)
- Abaixo de 18,5: baixo peso
- 18,5 a 24,9: eutrofia
- 25,0 a 29,9: sobrepeso
- 30,0 ou mais: obesidade

O IMC não distingue massa magra de gordura. Use-o junto de outros indicadores, como circunferência da cintura e avaliação clínica.`,
      ),
      quiz("Quiz: avaliação nutricional", [
        q("Como o IMC é calculado?", ["Altura dividida pelo peso", "Peso dividido pela altura ao quadrado", "Peso multiplicado pela altura", "Peso dividido pela idade"], 1, "IMC = peso (kg) ÷ altura² (m)."),
        q("Um adulto com IMC de 27 é classificado como:", ["Eutrofia", "Baixo peso", "Sobrepeso", "Obesidade"], 2, "Valores de 25,0 a 29,9 indicam sobrepeso."),
        q("Qual macronutriente é a principal fonte de energia imediata?", ["Carboidratos", "Vitaminas", "Minerais", "Fibras"], 0, "Os carboidratos são a fonte de energia mais rapidamente utilizada."),
      ]),
    ],

    // Fisioterapia ortopédica
    4: [
      texto(
        "Fases da reparação tecidual",
        `
A cicatrização dos tecidos ocorre em três fases que se sobrepõem:

- **Inflamatória:** resposta inicial à lesão, com dor, calor e edema.
- **Proliferativa:** formação de novo tecido.
- **Remodelação:** reorganização e fortalecimento do tecido.

Conhecer a fase ajuda a escolher recursos e a intensidade dos exercícios.`,
      ),
      texto(
        "Mobilização precoce e avaliação",
        `
A mobilização precoce reduz rigidez e perda de força, quando indicada.

## Cuidados
- Respeitar a dor e os limites definidos pelo protocolo.
- Progredir de forma gradual.
- Reavaliar amplitude de movimento e força a cada etapa.

A **goniometria** mede a amplitude de movimento articular.`,
      ),
      quiz("Quiz: reabilitação ortopédica", [
        q("Qual é a ordem correta das fases da reparação tecidual?", ["Remodelação, inflamatória, proliferativa", "Proliferativa, remodelação, inflamatória", "Inflamatória, proliferativa, remodelação", "Inflamatória, remodelação, proliferativa"], 2, "Inflamatória, proliferativa e, por fim, remodelação."),
        q("A mobilização precoce deve respeitar:", ["Apenas a vontade do paciente", "Os limites de dor e o protocolo definido", "Somente o tempo de afastamento", "Nenhum critério específico"], 1, "A progressão deve seguir o protocolo e a resposta do paciente."),
        q("O que a goniometria mede?", ["Força muscular", "Amplitude de movimento articular", "Densidade óssea", "Frequência cardíaca"], 1, "O goniômetro mede ângulos articulares."),
      ]),
    ],

    // Farmacologia para enfermagem
    5: [
      texto(
        "Os nove certos da administração",
        `
A administração segura de medicamentos segue os **nove certos**:

- Paciente certo
- Medicamento certo
- Via certa
- Hora certa
- Dose certa
- Registro certo
- Orientação certa
- Forma certa
- Resposta certa

Confira cada item antes de administrar e registre imediatamente após.`,
      ),
      texto(
        "Vias de administração",
        `
## Principais vias
- **Oral:** prática e comum, com absorção mais lenta.
- **Sublingual:** absorção rápida pela mucosa.
- **Intramuscular e subcutânea:** absorção intermediária.
- **Intravenosa:** o fármaco cai direto na circulação, com início de ação mais rápido.
- **Tópica:** ação local na pele.

A escolha da via depende do medicamento, da urgência e das condições do paciente.`,
      ),
      quiz("Quiz: administração segura", [
        q("Quantos são os “certos” da administração de medicamentos?", ["Cinco", "Sete", "Nove", "Doze"], 2, "Os nove certos orientam a prática segura."),
        q("Qual via tem início de ação mais rápido?", ["Oral", "Intravenosa", "Tópica", "Subcutânea"], 1, "Na via intravenosa o fármaco entra direto na circulação."),
        q("Antes de administrar, é necessário conferir:", ["Apenas o nome do medicamento", "Somente o horário", "Paciente, medicamento, dose, via e horário", "Apenas a dose"], 2, "A conferência completa evita erros de medicação."),
      ]),
    ],

    // Saúde mental e acolhimento
    6: [
      texto(
        "Escuta qualificada",
        `
Acolher é oferecer atenção, sem julgamento.

## Boas práticas
- Mantenha contato visual e uma postura aberta.
- Respeite os silêncios.
- Valide o que a pessoa sente, sem minimizar.
- Evite conselhos apressados e comparações.

A escuta qualificada fortalece o vínculo e favorece o cuidado.`,
      ),
      texto(
        "Sinais de alerta e encaminhamento",
        `
Fique atento a mudanças bruscas de comportamento, isolamento, falas de desesperança e prejuízo nas atividades diárias.

## Para onde encaminhar
- **UBS** e equipes de saúde da família.
- **CAPS:** Centros de Atenção Psicossocial.
- **CVV: 188**, apoio emocional gratuito, 24 horas.
- **SAMU: 192**, em situações de emergência.

Nunca deixe sozinha uma pessoa em risco imediato.`,
      ),
      quiz("Quiz: acolhimento", [
        q("Qual é a melhor postura em uma escuta qualificada?", ["Interromper para dar conselhos", "Ouvir sem julgamento", "Minimizar o problema", "Mudar de assunto"], 1, "Ouvir com respeito e sem julgamento é a base do acolhimento."),
        q("Qual é o número do CVV?", ["180", "188", "190", "192"], 1, "O CVV atende pelo 188, 24 horas."),
        q("Qual serviço público faz parte da rede de atenção psicossocial?", ["CAPS", "Receita Federal", "Correios", "Cartório"], 0, "Os CAPS atendem pessoas com sofrimento psíquico."),
      ]),
    ],
  };
})();
