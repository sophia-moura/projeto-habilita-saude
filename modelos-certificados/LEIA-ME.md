# Habilita Saúde - Certificados, versão 2.0.0

Pacote para a Squad, preparado em 04/11/2026. Três modelos editáveis, frente e verso, com preenchimento por JSON, QR real e geração de PDF por Chromium. Os PDFs incluídos são demonstrações, sem emissão acadêmica real.

## Abra primeiro

Abra **HabilitaSaude_Certificados_Completo.html** com Chrome ou Edge. É um arquivo autossuficiente: contém estilos, arte, fontes, QR e os três exemplos. Não precisa de servidor nem internet para visualizar. Use **Editar dados** para carregar um JSON e **Imprimir / Salvar PDF** para exportar. A impressão manual deve usar orientação paisagem, sem cabeçalho/rodapé e com gráficos de fundo. Para emissão com tamanho determinístico, use o gerador abaixo.

`index.html` é a versão modular. Mantenha ao lado dele `styles.css`, `app.js`, `validacao.js`, `dados-exemplo.js` e a pasta `assets`. A troca de nível preserva os dados que estão sendo editados; os três conjuntos de exemplo estão em `exemplos/`.

## Gerar os PDFs na máquina da Squad

Requisitos: Node.js 20 ou superior e npm. Execute dentro desta pasta:

```bash
npm ci
npx playwright install chromium
npm run exemplos
```

Em Linux, se faltarem bibliotecas do navegador, use o instalador de dependências do Playwright conforme as permissões da infraestrutura. No Windows e macOS, a instalação usual acima é suficiente quando o navegador pode ser baixado.

Para um certificado:

```bash
node scripts/gerar-pdf.cjs exemplos/operacional.json pdfs/meu-certificado.pdf
```

Para A4 paisagem, sem deformar o desenho:

```bash
node scripts/gerar-pdf.cjs exemplos/operacional.json pdfs/meu-certificado-A4.pdf --a4
```

O padrão é **320 x 180 mm, proporção 16:9**, acompanhando os originais de 1536 x 864 pixels. A opção A4 posiciona o mesmo desenho proporcionalmente no centro da página; haverá margens acima e abaixo. Frente e verso saem no mesmo arquivo, nessa ordem. Para impressão duplex, faça uma folha de prova; a inversão por borda curta costuma ser a adequada para paisagem, mas depende do equipamento.

## O que é editável e o que foi preservado

- `index.html`: estrutura dos campos, frente e verso.
- `styles.css`: fontes, tamanhos, posições e variações por nível.
- `assets/arte-*.svg`: fundos e geometria vetorial editáveis. Logotipos e medalhão usam os pixels dos PNGs originais, preservados em janelas de recorte SVG; não são vetores redesenhados nem novas assinaturas.
- `originais/original_*.png`: cópias byte a byte dos três desenhos recuperados do pacote anterior. Permanecem intactas, inclusive seus textos antigos, apenas como referência. Não são os certificados de saída.
- Os desenhos mantêm paletas, composição, faixas diagonais, logotipos e medalhão. A geometria foi reconstituída em SVG e a tipografia adaptada aos campos automáticos; não se promete equivalência pixel a pixel ao mockup raster.
- `dados-exemplo.js` e `exemplos/*.json`: dados fictícios. Nenhum nome de aluno, professor, CNPJ ou critério de exemplo é cadastro real.

**Assinatura institucional fixa:** Isaac Caixeta, Fundador e Diretor Pedagógico, Habilita Saúde. A declaração jurídica está apenas no verso, idêntica nos três níveis. As linhas e nomes de assinatura não constituem assinatura criptográfica. Há campos opcionais para imagens autorizadas das assinaturas; nenhuma rubrica foi inventada.

## Componentes

| Arquivo / pasta | Finalidade |
|---|---|
| `HabilitaSaude_Certificados_Completo.html` | Alternativa autossuficiente ao ZIP |
| `index.html`, `styles.css`, `app.js`, `validacao.js` | Template e lógica modular |
| `assets/` | Artes SVG, fontes locais e gerador QR, com licenças |
| `exemplos/`, `dados-exemplo.js` | Três dados de exemplo reutilizáveis |
| `scripts/gerar-pdf.cjs` | API Node e CLI para gerar PDF |
| `scripts/empacotar-html.cjs` | Recria o HTML autossuficiente após edições |
| `scripts/verificar-integridade.cjs` | Confere tamanhos e hashes do pacote |
| `docs/INTEGRACAO-SQUAD.md` | Contrato de dados, emissão, reemissão e integração |
| `pdfs/` | PDFs demonstrativos testados |
| `tests/` | Validação, renderização, leitura de QR e auditoria de PDFs |
| `RELATORIO-DE-TESTES.md` | Resultados desta entrega |
| `MANIFESTO-SHA256.json` | Inventário e hashes de todos os componentes finais |

## Testar e reconstruir

```bash
npm test
python -m pip install -r requirements-qa.txt
python tests/verificar-pdfs.py
npm run integridade
```

Depois de alterar HTML, CSS, JS ou arte, execute `npm run standalone` e `npm run exemplos` e repita os testes. O manifesto registra a entrega: modificações intencionais fazem a verificação de integridade apontar diferenças. Atualize o manifesto somente após revisar e testar uma nova versão.

## Limite da entrega

O preenchimento, os PDFs e o QR funcionam localmente. A emissão no portal ainda depende de a Squad conectar dados acadêmicos aprovados, cadastro institucional real, armazenamento e página pública de validação. O QR dos exemplos codifica `example.invalid`, um endereço demonstrativo sem serviço ativo. Veja o contrato de integração antes de emitir documentos reais.
