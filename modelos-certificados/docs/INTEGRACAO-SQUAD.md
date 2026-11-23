# Integração dos certificados - Habilita Saúde

Versão 2.0.0 · 04/11/2026

## Decisões preservadas

| Valor de `nivel` | Nomenclatura de certificação |
|---|---|
| `operacional` | Qualificação e Capacitação — Nível Operacional |
| `estrategico` | Atualização e Aperfeiçoamento — Nível Estratégico |
| `expert` | Proficiência Avançada — Nível Expert |

A identidade é monocromática por modelo: azul acinzentado, azul e dourado sobre azul escuro, respectivamente. Preservam-se os desenhos como referência e a arte original de logotipos e medalhão. O nome institucional é **Isaac Caixeta**, com o cargo **Fundador e Diretor Pedagógico**, pela **Habilita Saúde**.

Declaração exclusiva do verso, sem abreviação:

> Este certificado comprova a conclusão de curso livre de educação continuada. Não constitui diploma de graduação ou pós-graduação, título de especialista ou habilitação para o exercício de atividades profissionais regulamentadas.

Esse texto foi fornecido e confirmado no projeto; o pacote não acrescenta parecer jurídico nem selo de reconhecimento externo. A classificação do nível vem da curadoria cadastrada para o curso. A carga horária dos exemplos não impõe faixas, títulos profissionais ou regras de aprovação.

## Contrato do objeto JSON

O validador executável `validacao.js` é a referência deste contrato. Campos desconhecidos são rejeitados. Todos os campos abaixo são obrigatórios, salvo as duas imagens de assinatura.

| Campo | Tipo e regra |
|---|---|
| `schemaVersion` | Texto fixo `2.0` |
| `nivel` | Um dos três identificadores da tabela |
| `demo` | Booleano explícito; `true` exibe marca de demonstração |
| `alunoNome` | Texto até 96 caracteres; sem título honorífico automático |
| `cpfMascarado` | `***.***.***-00` ou `***.***.***-**`; CPF completo é rejeitado |
| `cursoTitulo` | Texto até 150 caracteres |
| `area` | Texto até 65 caracteres |
| `professorNome` | Texto até 96 caracteres; exibido no corpo e assinatura |
| `cargaHoraria` | Número positivo, até 9999, no máximo duas casas decimais |
| `dataInicio`, `dataConclusao`, `dataEmissao` | Datas reais ISO `AAAA-MM-DD`, nessa ordem temporal |
| `codigo` | UUID v4, fornecido pelo backend |
| `verificationUrl` | HTTPS, até 220 caracteres, termina em `/` + UUID; sem query, fragmento ou credenciais |
| `razaoSocial` | Texto até 130 caracteres, do cadastro institucional |
| `cnpj` | Texto até 40 caracteres; em produção, formato cadastral obrigatório |
| `criterios` | Texto até 420 caracteres; deve descrever o critério de conclusão efetivamente aplicado |
| `modulos` | Array de 1 a 10 objetos `{ "titulo": "...", "horas": 2 }`; título até 100 caracteres |
| `assinaturaProfessor`, `assinaturaInstitucional` | Opcionais: PNG/JPEG base64, até cerca de 2 MB cada; utilizar apenas imagens autorizadas |

A soma das horas dos módulos deve ser igual à carga horária. A checagem cadastral do CNPJ, inclusive dígitos verificadores e existência, pertence ao backend. Os limites de caracteres não garantem que todo texto caiba: a renderização mede o espaço efetivo, ajusta fonte dentro de limites legíveis e bloqueia conteúdo excedente. Não trunca a ementa nem cria terceira página silenciosamente. Para cursos extensos, fornecer síntese fiel de até 10 módulos; se necessário, ampliar o projeto explicitamente para anexos numerados, fora desta versão de duas páginas.

## APIs já implementadas

No navegador, após carregar os componentes:

```javascript
await window.HabilitaCertificados.render(dados);
// Resolve após fontes, imagens, QR e validação visual do espaço.
// Rejeita com mensagem legível se houver problema.
```

No Node:

```javascript
const { generate } = require('./scripts/gerar-pdf.cjs');
await generate(dadosAutorizados, '/caminho/privado/certificado.pdf');
// ou: { a4: true }
```

Esse módulo é um renderizador interno. Não deve ser publicado como endpoint que aceita JSON arbitrário do aluno. Não há autenticação, banco de dados ou serviço público de consulta neste pacote. O navegador de renderização bloqueia solicitações HTTP/HTTPS e usa apenas recursos locais e dados embutidos. Todos os textos de entrada entram no DOM por `textContent`, sem avaliação de HTML.

## Fluxo de emissão que a Squad deve conectar

1. O backend autentica a pessoa e verifica o direito ao curso e ao certificado. Consulta conclusão e aprovação no registro acadêmico, não em dados enviados pelo navegador.
2. Carrega o nível aprovado pela curadoria, versão da ementa, professor e critérios aplicados. Faz snapshot desses valores para não alterar certificados antigos quando o curso mudar.
3. Resolve a instituição emissora e as assinaturas autorizadas. Preenche `demo: false` com razão social e CNPJ oficiais.
4. Gera UUID v4 criptograficamente aleatório. Reserva registro único por matrícula + versão de conclusão, com controle transacional/idempotência, para requisições simultâneas não duplicarem emissão.
5. Define a URL canônica da página pública e passa o objeto ao renderizador. Recebe exatamente duas páginas. Registra versão do template, hash SHA-256 do PDF, horário, autor da emissão e arquivo.
6. Libera o download autenticado e a consulta pública mínima. Reimpressão entrega o mesmo PDF; alteração acadêmica exige revisão controlada e histórico.

O registro deve distinguir pelo menos emitido, revogado e substituído, conservar a cadeia de versões e nunca reutilizar um código para outro aluno. Correções de dados precisam de registro de motivo; uma nova versão não apaga o histórico anterior. Falha na geração deve interromper a conclusão da emissão e manter estado recuperável para reprocessamento.

## Consulta pública e QR

O QR é gerado localmente com correção de erros M, fundo branco e zona de silêncio de quatro módulos. Os seis QRs dos PDFs foram decodificados durante a conferência. O QR contém somente a URL de consulta; não contém CPF, chave privada ou assinatura.

A página pública ainda será implementada no portal. Ela deve consultar o UUID no banco e informar a situação atual do registro, nome conforme a política do portal, curso, carga horária, conclusão, instituição e versão. Nunca retornar CPF completo, e-mail, endereço ou dados de outros alunos. Um UUID existente não equivale a assinatura digital; o backend verifica o registro, seu estado e seu vínculo com o documento. O SHA-256 também é controle de integridade, não assinatura criptográfica.

Os exemplos usam domínio reservado `example.invalid` para não levar o leitor a uma página indevida. Em produção, o validador rejeita domínios reservados, localhost e IPs literais. A Squad deve configurar o domínio real e testar a consulta pelo QR depois da integração.

## Assinaturas e proteção dos dados

Os nomes e linhas de assinatura são elementos gráficos. As imagens opcionais não criam, por si, assinatura criptográfica do PDF. Caso o projeto adote um provedor de assinatura eletrônica, a integração deve ocorrer após a geração e antes do registro do hash final. Usar material e autorização fornecidos pelos signatários; o pacote não contém assinatura manuscrita inventada.

O JSON e o PDF devem ser construídos em ambiente autorizado. Manter arquivos temporários em local privado e eliminá-los após transferência. Não registrar o JSON integral em logs. O download final precisa validar a propriedade do certificado; um nome de arquivo previsível não é controle de acesso.

## Fidelidade e manutenção visual

Os PNGs de referência não trazem camadas tipográficas nem vetores separados. Por isso, os campos foram reconstruídos como texto real, as faixas em SVG editável e os logotipos/medalhão preservados por recorte SVG dos originais. No Expert, um filtro SVG torna o fundo escuro do recorte transparente; o arquivo PNG original não é alterado. O original contém nomes e textos antigos, mas eles não são exibidos nos templates.

As fontes locais Nimbus Sans, Nimbus Roman e Z003 acompanham sua licença. Elas tornam a saída independente das fontes instaladas na máquina do usuário. As fontes e a geometria são uma adaptação técnica fiel à composição; não há alegação de vetorização integral ou reprodução exata de cada pixel.

Depois de alterar um componente, recriar o HTML autossuficiente, gerar os três PDFs, executar testes e inspecionar as seis páginas. Uma mudança do texto jurídico deve ser deliberada e aplicada somente ao verso. A nomenclatura e o signatário são controlados pelo template, não por campos arbitrários do usuário.
