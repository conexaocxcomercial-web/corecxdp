---
name: core.cx · módulo dp
description: Departamento pessoal multiempresa da Conexão CX, em papel sobre mesa, com o violeta da marca como única voz de ação.
colors:
  violeta: "#7371ff"
  lilas: "#dbbfff"
  lima: "#bef533"
  rosa: "#ff43c0"
  grafite: "#1e1e1e"
  preto: "#000000"
  branco: "#ffffff"
  gelo: "#f4f4f4"
  linha: "color-mix(in srgb, #1e1e1e 11%, #ffffff)"
  linha-2: "color-mix(in srgb, #1e1e1e 20%, #ffffff)"
  linha-3: "color-mix(in srgb, #1e1e1e 52%, #ffffff)"
  tinta-2: "color-mix(in srgb, #1e1e1e 80%, #ffffff)"
  tinta-3: "color-mix(in srgb, #1e1e1e 68%, #ffffff)"
  acao-forte: "color-mix(in srgb, #7371ff 75%, #dbbfff)"
  acao-fraco: "color-mix(in srgb, #dbbfff 40%, #ffffff)"
  acao-texto: "color-mix(in srgb, #7371ff 70%, #000000)"
  sobre-violeta-2: "color-mix(in srgb, #000000 85%, #7371ff)"
typography:
  display:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(36px, 3.4vw, 56px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  display-compacto:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(32px, 3vw, 44px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  display-celular:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(26px, 7vw, 40px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline-celular:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  subtitulo:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  headline-janela:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  titulo-secao:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  titulo-secao-celular:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title-cartao:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  titulo-na-barra:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  numero:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  numero-celular:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  body:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  apoio:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  cabecalho-tabela:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  botao:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  campo:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 500
  icone-botao:
    fontFamily: "'Material Symbols Rounded'"
    fontSize: "20px"
    fontWeight: 400
rounded:
  mini: "6px"
  ctrl: "9px"
  card: "12px"
  previa: "14px"
  janela: "16px"
  folha: "24px"
  pill: "999px"
spacing:
  vao: "12px"
  vao-toque: "8px"
  pagina: "32px"
  pagina-toque: "16px"
  secao: "40px"
  secao-toque: "32px"
  cartao: "24px"
  cartao-toque: "16px"
  campos: "20px"
  campos-entrada: "18px"
components:
  button-acao:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.preto}"
    typography: "{typography.botao}"
    rounded: "{rounded.ctrl}"
    padding: "0 18px"
    height: "48px"
  button-acao-hover:
    backgroundColor: "{colors.acao-forte}"
    textColor: "{colors.preto}"
  button-acao-desabilitado:
    backgroundColor: "{colors.linha-2}"
    textColor: "{colors.tinta-2}"
  button-acao-entrada:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.preto}"
    rounded: "{rounded.ctrl}"
    height: "48px"
    width: "100%"
  button-fantasma:
    backgroundColor: "{colors.gelo}"
    textColor: "{colors.tinta-2}"
    typography: "{typography.botao}"
    rounded: "{rounded.ctrl}"
    padding: "0 18px"
    height: "48px"
  button-mini:
    backgroundColor: "{colors.gelo}"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.ctrl}"
    padding: "0 14px"
    height: "40px"
  button-fantasma-hover:
    backgroundColor: "{colors.linha}"
    textColor: "{colors.grafite}"
  campo:
    backgroundColor: "{colors.gelo}"
    textColor: "{colors.grafite}"
    borderColor: "{colors.linha-3}"
    typography: "{typography.campo}"
    rounded: "{rounded.ctrl}"
    padding: "0 14px"
    height: "48px"
  campo-foco:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
  campo-entrada:
    backgroundColor: "{colors.gelo}"
    textColor: "{colors.grafite}"
    borderColor: "{colors.linha-3}"
    typography: "{typography.campo}"
    rounded: "{rounded.ctrl}"
    padding: "0 14px"
    height: "48px"
  cartao:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.card}"
    padding: "24px"
  numero:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    typography: "{typography.numero}"
    rounded: "{rounded.card}"
    padding: "20px 20px 18px"
  numero-variacao-bom:
    backgroundColor: "{colors.lima}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.pill}"
  numero-variacao-ruim:
    backgroundColor: "{colors.rosa}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.pill}"
  pilula-ok:
    backgroundColor: "{colors.lima}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pilula-espera:
    backgroundColor: "{colors.grafite}"
    textColor: "{colors.branco}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pilula-recusa:
    backgroundColor: "{colors.rosa}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pilula-em-curso:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.preto}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pilula-ferias:
    backgroundColor: "{colors.lilas}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pilula-neutra:
    backgroundColor: "{colors.gelo}"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  segmentado:
    backgroundColor: "{colors.gelo}"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.ctrl}"
    padding: "3px"
    height: "48px"
  segmentado-escolhido:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.mini}"
  item-menu-ativo:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.preto}"
    rounded: "8px"
    height: "40px"
  barra-inferior:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta-3}"
    height: "64px"
  barra-inferior-ativa:
    backgroundColor: "{colors.acao-fraco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.pill}"
  barra-inferior-lancar:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.preto}"
    rounded: "12px"
  folha:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.janela}"
  folha-celular:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.grafite}"
    rounded: "{rounded.folha}"
  palco-violeta:
    backgroundColor: "{colors.violeta}"
    textColor: "{colors.preto}"
    typography: "{typography.display}"
---

# Design System: core.cx · módulo dp

## Overview

**Creative North Star: "Papel sobre a mesa"**

O sistema fala a língua dos próprios tokens: uma **mesa** cinza-gelo, folhas de **papel** branco apoiadas nela, **tinta** grafite para o texto e uma **linha** fina para separar. Sobre esse escritório quieto, o violeta da marca (#7371ff) é a única voz de ação: o botão que conclui, o item de menu em que você está, a coluna do último mês na evolução mês a mês, o anel de foco. Tudo o mais é tom de papel e de tinta. A densidade é de ferramenta de trabalho legível com uma mão: corpo em 14px, apoio em 13px, vãos de 12px, seções a 40px uma da outra e tabelas que viram listas no celular sem perder nenhum dado.

A paleta inteira são as oito cores obrigatórias da marca, e só elas. Todo tom intermediário sai de `color-mix()` entre essas oito; não existe outro hex no sistema. As situações (pílulas, marcas de gráfico) usam a paleta como código: lima resolve, escura espera, rosa recusa, violeta em curso, lilás férias, neutro encerrado. O tema escuro troca os valores dos tokens e nenhuma classe de componente muda: a mesa vira preto, o papel vira grafite, a tinta vira gelo.

A tela de entrada leva o mesmo mundo para fora do sistema. A coluna do formulário é papel com os mesmos campos e o mesmo botão, só mais altos e mais legíveis; ao lado, um palco violeta chapado, igual nos dois temas, com texto preto em Helvetica bold de tracking fechado, e uma prévia do Início montada com os componentes reais. O violeta, ali, deixa de ser acento e vira chão; isso só acontece em mais um lugar, o topo do Início, a entrada do dia a dia.

**A linguagem da entrada é a linguagem do sistema.** As telas internas usam a mesma régua da entrada: título de página em Helvetica 700 de tracking fechado (32px; 28px no celular) com subtítulo de 15px, corpo de 14px, títulos de seção e de cartão em frase (sem maiúsculas), campos e botões de 48px, e o que se abre por cima sobe de baixo como folha. O registro denso anterior (12,5px, rótulos maiúsculos, tarja lateral nos KPIs) foi substituído por inteiro; a prévia da entrada foi redesenhada na fase 16 e usa as peças atuais.

**Key Characteristics:**
- Oito cores de marca, nenhuma outra; tons intermediários só por `color-mix()`.
- Violeta é fundo e destaque, nunca texto sobre claro; sobre violeta o texto é preto.
- Papel sobre mesa: cartões brancos com sombra-contorno de 1px sobre fundo gelo.
- Helvetica em todos os papéis, peso 700 e tracking negativo nos títulos.
- Dois temas por troca de tokens, com transição suave por view-transition.
- Mobile-first de verdade: campos e botões de 48px com texto de 16px nos campos, ações na linha com 44px no toque, tabelas que viram listas, janelas que sobem de baixo.

## Colors

Oito cores de marca obrigatórias, organizadas em papéis semânticos (`--mesa`, `--papel`, `--tinta`, `--linha`, `--acao`) que mudam de valor entre os temas claro e escuro.

### Primary
- **Violeta de Marca** (violeta): a cor de ação. Fundo do botão principal, do item de menu ativo, da pílula "em curso", da coluna do último mês na evolução mês a mês e das barras horizontais, do quadro marcado da Caixa e do anel de foco (2px, afastado 2px). No palco da entrada é a superfície inteira. Como texto sobre claro dá só 3,8:1, por isso nunca é texto: o texto sobre ele é preto (5,5:1).
- **Violeta Claro de Hover** (acao-forte): violeta misturado 25% com lilás. O hover do botão principal clareia em vez de escurecer, porque escurecer com texto preto derrubaria o contraste para 3,9:1; assim fica em 6,9:1.
- **Violeta Tinta** (acao-texto): violeta escurecido com 30% de preto, para quando o violeta precisa ser texto ou ícone sobre papel claro (link "Perdeu o acesso?", ícones dos contatos, ícone da faixa informativa). No escuro, esse papel passa ao lilás.
- **Véu Violeta** (acao-fraco): lilás a 40% sobre branco. Halo de 3px do campo em foco e fundo da faixa informativa. No escuro, violeta a 22% sobre grafite.

### Secondary
- **Lilás** (lilas): férias e atestado (pílula "Férias", tom `--azul` nos gráficos), avatar com iniciais, seleção de texto na entrada. Sempre fundo, com texto grafite.
- **Lima** (lima): o que resolveu. Pílula "Ativo/Aprovado/Concluído", tom `--ok` dos gráficos (admissões, tempo de casa). Sempre fundo, com texto grafite.

### Tertiary
- **Rosa** (rosa): o que foi recusado ou deu errado. Pílula "Rejeitado", faixa de erro das telas internas, tom `--critico` (saídas), hover do botão de sair. Na entrada, o erro é rosa diluído a 12% com contorno a 45%, não o rosa chapado. Sempre fundo ou ícone, com texto grafite.

### Neutral
- **Grafite** (grafite): a tinta do tema claro e o papel do tema escuro. Também a pílula "Pendente" e a faixa de alerta, que invertem papel e tinta: o que espera ação é escuro.
- **Preto** (preto): a mesa do tema escuro, o texto sobre violeta e a base das sombras do escuro.
- **Branco** (branco): o papel do tema claro (cartões, barras, janelas, coluna da entrada).
- **Gelo** (gelo): a mesa do tema claro e o `--papel-2` (fundo de campo, botão fantasma, cabeçalho de tabela, trilho de barra, segmentado). No escuro, é a tinta.
- **Linha** (linha) e **Linha Forte** (linha-2): divisores e contorno das sombras; a forte serve de fundo do botão desabilitado e do polegar da rolagem.
- **Linha de Campo** (linha-3): o contorno de todo campo e seletor, grafite a 52% no claro e gelo a 38% no escuro. Dá pelo menos 3:1 contra o fundo em volta (branco, gelo ou grafite), o mínimo do WCAG 1.4.11 para limite de controle.
- **Tinta Secundária** (tinta-2) e **Tinta de Apoio** (tinta-3): texto de controles não escolhidos e texto de apoio (rótulos, notas, datas, placeholders). Ambas são grafite misturado com branco (80% e 68%); no escuro, gelo misturado com grafite (72% e 58%).
- **Preto Sobre Violeta** (sobre-violeta-2): preto a 85% no violeta, o texto secundário do palco (4,9:1).

### Named Rules
**The Oito Cores Rule.** As oito cores de `--marca-*` são os únicos hex do sistema. Qualquer tom novo é `color-mix()` entre elas; telas usam os tokens semânticos, nunca hex solto. A única exceção existente é o `themeColor` da página de entrada, que o metadado do navegador exige em hex e é o próprio violeta.

**The Violeta-Fundo Rule.** O violeta é fundo e destaque, não texto sobre claro. Sobre violeta, o texto é preto; quando o violeta precisa ser texto, usa-se a Violeta Tinta (`--acao-texto`).

**The Paleta-como-Situação Rule.** Situação usa só a paleta, sempre como fundo com texto grafite: lima resolve, escura espera, rosa recusa, violeta em curso, lilás férias, neutro encerrado. Lima, lilás e rosa nunca são cor de texto.

## Typography

**Display Font:** Helvetica Neue (com Helvetica, Arial, sans-serif)
**Body Font:** Helvetica Neue (com Helvetica, Arial, sans-serif)
**Label/Mono Font:** a mesma; números em coluna usam `font-variant-numeric: tabular-nums` (classe `.num`), sem fonte mono.

**Character:** uma família só, obrigatória pela marca. A hierarquia vem de peso (700 contra 500) e de tracking negativo crescente com o tamanho, não de troca de família.

### Hierarchy
- **Display** (700, clamp 36–56px, 1,04, −0,035em): a frase do palco violeta da entrada, com `text-wrap: balance` e no máximo 12em. No celular é o **Display celular** (clamp 26–40px, 1,08); em telas baixas, o **Display compacto** (clamp 32–44px).
- **Headline** (700, 32px, 1,1, −0,03em): o "Entrar" da entrada e o título de toda página interna (`h1` do `Cabecalho`); 28px no celular. Equilibrado com `text-wrap: balance`.
- **Subtítulo** (400, 15px, 1,5, Tinta de Apoio): a linha sob o título da página e sob o "Entrar"; também o texto do estado vazio e o subtítulo das janelas.
- **Headline de janela** (700, 22px, 1,2, −0,02em): título das janelas de cadastro.
- **Título de seção** (700, 20px, 1,25, −0,02em, em frase; 18px no celular): `h2` da `Secao`, com a nota ao lado em 14px, Tinta de Apoio. Sem maiúsculas e sem linha.
- **Title de cartão** (700, 16px, 1,3, −0,01em): `h3` do cartão; a descrição abaixo é 14px, linha 1,5, Tinta de Apoio.
- **Número** (700, 32px, 1, −0,03em, tabular): o valor do `Numero`; 26px no celular. O rótulo acima é 14px, 500, Tinta Secundária, em frase.
- **Título na barra** (700, 15px, −0,01em): o título da página, pequeno, na barra do topo depois que o título grande sai da tela.
- **Body** (400, 14px, 1,5): texto de tabela, faixa, lista e controle. Botões em 15px, 700 (16px no botão da entrada).
- **Apoio** (13px, 1,5–1,6, Tinta de Apoio): notas corridas, apoio dos números, dica de campo, cabeçalho de tabela (600) e rótulo das células quando a tabela vira lista. Pílulas também em 13px.
- **Label** (600, 14px, Tinta Secundária, em frase): rótulo de campo, igual nas telas internas e na entrada.
- **Campo** (500, 16px): todo campo e seletor, para o iOS não dar zoom.
- **Miúdo** (12px): só as marcas e os meses do eixo dos gráficos, a dica do trilho e o grupo do menu lateral.

### Named Rules
**The Doze-Pixels Rule.** Nenhum texto abaixo de 12px, em nenhuma tela. O menor tamanho do sistema é 12px, e campos em toque têm 16px.

**The Peso-Que-Não-Pula Rule.** Onde trocar a escolha mudaria a largura do controle (o seletor de tema da entrada), a opção escolhida mantém o peso 500 e se distingue só pela cor e pelo fundo.

## Layout

Telas internas: barra do topo fixa de 56px (52px em toque) e, abaixo dela, o `Cabecalho` da página, que não é fixo: título e subtítulo à esquerda, ações à direita (em largura total no celular) e a linha de filtros logo abaixo, a 24px. Quando o título grande passa por baixo da barra, ele aparece pequeno na própria barra (ao lado da marca no computador; no lugar dela no celular). Conteúdo num invólucro de no máximo 1280px com respiro lateral de 32px (16px em toque), o mesmo do cabeçalho, que começa 40px abaixo da barra (24px em toque). Seções separadas por 40px (32px em toque), com 16px entre o título e o conteúdo. Grades de números usam `auto-fit` com mínimo de 200px e vão de 12px; grades de duas e três colunas usam vão de 12px e viram uma coluna em toque, com vão de 8px. O cabeçalho fica direto na mesa: ali campo e botão fantasma viram papel e o trilho do segmentado vira linha, porque o `--papel-2` some contra a mesa. O menu lateral é um trilho de 60px que se abre a 248px sobrepondo no hover ou empurra o conteúdo quando fixado; em toque vira gaveta com véu.

Ponto de virada principal: 900px. Abaixo dele, números em duas colunas, tabelas viram listas dentro do cartão (cada linha um bloco com o primeiro campo no alto e os outros em fluxo, com o rótulo vindo de `data-r`), o eixo dos gráficos em colunas mostra um mês a cada dois (sempre o último) e nada rola de lado, janelas sobem de baixo e ações na linha e segmentados ganham 44px. Hover de linha só existe em quem tem mouse (`hover: hover`), para não ficar preso no toque.

Entrada: duas colunas no desktop (`minmax(440px, 5fr) 6fr`). A coluna do formulário tem marca no alto, o bloco do formulário com no máximo 380px centralizado na vertical e o rodapé com assinatura e seletor de tema, todos na mesma borda esquerda. O palco violeta fica fixo na altura da janela, com a prévia saindo pela borda inferior e direita. Abaixo de 1280px os perfis perdem o texto de apoio; em telas baixas (até 820px de altura) o palco se compacta. Abaixo de 1024px vale a folha: faixa violeta no alto com marca, frase e perfis numa linha, e o formulário numa folha de papel com cantos de 24px que sobe 20px por cima da faixa, com largura de conteúdo de até 440px.

## Elevation & Depth

Profundidade híbrida e discreta: cada sombra combina um difuso suave com um contorno de 1px na cor da linha, de modo que o papel tem borda mesmo onde a sombra some. No escuro, a base da sombra passa a preto em opacidade maior. Nada de sombra dura ou deslocada.

### Shadow Vocabulary
- **Papel apoiado** (`--e1`: `0 1px 2px` grafite 5% + `0 0 0 1px var(--linha)`): cartões, números, opção escolhida do segmentado, botão fantasma do cabeçalho, cartões da prévia.
- **Papel erguido** (`--e2`: `0 4px 14px` grafite 7% + contorno): o botão flutuante do menu em toque e o hover de número com link e do botão fantasma do cabeçalho.
- **Sobreposição** (`--e-pop`: `0 12px 34px` grafite 16% + contorno): janelas, gaveta aberta, menu lateral expandido por hover.
- **Véu** (`--veu`: grafite 45%, preto 60% no escuro): fundo atrás da gaveta e das janelas; nas janelas, com desfoque de 3px.
- **Prévia sobre o palco** (`0 28px 64px` preto 26% + contorno preto 14%): exclusiva da prévia do Início, que flutua sobre o violeta.

### Named Rules
**The Contorno-Junto Rule.** Toda sombra do sistema carrega o contorno de 1px em `--linha`. Profundidade sem limite visível não existe aqui.

## Shapes

Cantos suaves e consistentes em poucas medidas: 9px nos controles (botões, campos, segmentado), 12px nos cartões, números e faixas, 16px nas janelas, 24px (`--r-folha`) no topo de tudo que sobe de baixo (janela de cadastro e folha da entrada no celular), 14px na prévia, 6px nos miúdos (opção do segmentado, quadro da Caixa, dica do trilho) e pílula inteira (999px) para situação, contador e trilhos de barra. Avatares e o botão de sair são círculos. Bordas, quando existem, são de 1px em `--linha`; o quadro da Caixa usa 1,5px em Tinta de Apoio, e os perfis do palco têm um fio de 1,5px em preto no topo.

**The Folha-Que-Sobe Rule.** Em toque, o que se abre por cima sobe de baixo como folha com os cantos de cima arredondados em 24px: a janela de cadastro e a coluna da entrada sobre a faixa violeta.

## Components

### Buttons
Firmes, com a altura da entrada; peso 700 em todos.
- **Shape:** cantos de 9px, 48px de altura, padding 0 18px, texto de 15px e ícone de 20px, com vão de 8px. Encolhem levemente (0,985) ao pressionar.
- **Principal (ação):** fundo violeta, texto preto. Na entrada, largura total e 16px.
- **Hover / Focus:** hover clareia para a Violeta Claro de Hover; foco é o anel violeta de 2px afastado 2px. Transição de 0,14s.
- **Enviando:** desabilitado com cursor de espera, ícone de ampulheta e texto próprio ("Conferindo…", "Salvando…"); o principal vai a Linha Forte com Tinta Secundária, o fantasma a Tinta de Apoio. O `BotaoEnviar` aceita `variante` (`acao` ou `fant`).
- **Fantasma:** fundo `--papel-2`, texto Tinta Secundária; hover em `--linha` com tinta cheia. No cabeçalho da página, que fica sobre a mesa, vira papel com Papel apoiado.
- **Mini:** fantasma de 14px, 40px de altura (44px em toque), padding 0 14px, para ações na linha (aprovar, rejeitar, concluir).

### Chips
- **Pílula de situação:** 13px, 500, padding 4px 10px, pílula inteira, com ponto de 6px na cor do texto. Tons pela Paleta-como-Situação; sem tom, fundo `--papel-2` e Tinta Secundária ("Inativo").

### Cabeçalho da página
`Cabecalho` (`componentes/Estrutura.jsx`): `h1` de 32px, subtítulo de 15px (o que antes era o contador em pílula: "12 de 40", "3 pendentes", "últimos 6 meses"), `acoes` à direita e, como filhos, a linha de filtros. Com `voltar`, ganha acima do título um link "← Colaboradores" de 14px, 600, com alvo de 44px. Um marco logo abaixo do título (`TituloNaBarra`, com `IntersectionObserver`) põe o título pequeno na barra do topo quando ele sai da tela; ali ele é oculto para leitores de tela, porque o `h1` continua sendo o título.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** papel sobre mesa.
- **Shadow Strategy:** Papel apoiado (`--e1`).
- **Border:** só o contorno da sombra.
- **Internal Padding:** 24px (16px em toque); o título (`h3`) e a descrição ficam num bloco com 20px abaixo (16px em toque). A variante lisa zera o padding para tabelas e listas que encostam na borda, e o bloco do título leva o padding sozinho.
- **Número** (`Numero`, em `Numeros`): papel, 12px, padding 20px 20px 18px (16px em toque); rótulo em frase de 14px, valor de 32px (26px), apoio de 13px. Sem tarja: o tom (`tom`, uma cor de situação) é um ponto de 8px com contorno ao lado do rótulo. Com `href`, o cartão inteiro é o link e mostra uma seta no canto, que vai para a Violeta Tinta no hover. Com `variacao`, uma pílula de 13px com seta de tendência: lima quando melhorou, rosa quando piorou, neutra quando não há leitura.
- **Tabela:** encosta nas bordas do cartão liso. Cabeçalho de 48px em 13px, 600, Tinta de Apoio, em frase, sobre um fio; linhas de no mínimo 56px com fio entre elas e respiro lateral de 24px; o nome da pessoa em 600, sublinhado só no hover. No celular, cada linha vira um bloco de 16px de respiro: o primeiro campo no alto (o nome em 16px, 700) e os outros em fluxo, cada um com o rótulo de `data-r` em 13px acima do valor.
- **Faixa de aviso:** 12px de canto, 14px de texto com ícone de 20px. Informativa em Véu Violeta com ícone em Violeta Tinta; alerta em tinta cheia com texto papel; erro em rosa com texto grafite. Na entrada, o erro é rosa diluído com contorno, para o botão continuar sendo o único sólido da coluna, e mantém 13px de respiro e ícone de 18px.
- **Vazio:** ícone de 40px apagado, texto de 15px em Tinta Secundária com no máximo 44ch, e a ação logo abaixo quando há.

### Inputs / Fields
- **Style:** fundo `--papel-2` (papel no cabeçalho da página), borda de 1px em Linha de Campo (3:1), cantos de 9px, 48px de altura, 16px, padding 0 14px (12px 14px na caixa de texto), cursor de texto violeta. Rótulo acima com 8px de vão.
- **Hover / Focus:** no hover a borda vai a Tinta de Apoio; no foco o fundo vira papel, a borda vira violeta e aparece o halo de 3px em Véu Violeta.
- **Entrada:** os mesmos campos, e o preenchimento automático do navegador repintado nos tons do campo.
- **Senha:** o botão de olho ocupa os 44px da direita dentro do campo, em Tinta de Apoio (tinta cheia no hover); o aviso de Caps Lock aparece abaixo em 13px, 600, e não ocupa lugar quando vazio.
- **Caixa de marcar:** quadro desenhado de 22px com cantos de 6px e borda de 1,5px; marcado, vira violeta com o visto preto. Alvo de toque é a linha inteira (mín. 44px), com texto de 14px e dica de 13px. O input nativo fica invisível por cima, para teclado e leitor de tela.
- **Busca:** o mesmo campo, com 320px no computador e largura total no celular; os seletores de filtro dividem a linha ao meio no celular.
- **Error / Disabled:** o erro aparece como faixa abaixo dos campos, não como cor no campo.

### Navigation
A lista de telas de cada perfil fica num só lugar, `lib/navegacao.js`: grupos do menu lateral e da aba Menu, as cinco posições da barra inferior e as opções do Lançar. Módulos que ainda não existem estão lá com `disponivel: false` e não aparecem.
- **Menu lateral (a partir de 901px):** papel com fio de 1px à direita. Itens de 40px, 14px, 500, cantos de 8px, Tinta Secundária; hover em `--papel-2`; ativo em violeta com texto preto e peso 600. Grupos em frase, 13px, 600, Tinta de Apoio, que abrem e fecham. No trilho de 60px só restam os ícones, com dica escura ao lado; no rodapé, a assinatura em imagem. Some no celular.
- **Barra inferior (até 900px):** fixa embaixo, papel com fio e sombra suave para cima, 64px mais a área segura, cinco posições iguais com ícone de 24px e nome de 12px, 600. A posição ativa ganha uma pílula de Véu Violeta atrás do ícone e tinta cheia; as outras ficam em Tinta de Apoio. **Lançar**, ao centro, é o único sólido: placa violeta de 48×36px com cantos de 12px e ícone preto. O número de pendências do Início é uma pílula escura de 20px com contorno de papel, e entra no nome acessível ("Início, 8 pendências"). Menu abre uma folha com o bloco da pessoa no alto e a navegação completa.
- **Barra do topo:** marca à esquerda (com o título da página quando ele rola para fora); à direita, a etiqueta "Dados de demonstração" (Véu Violeta, 13px, 600, só na demonstração), a busca de pessoa, o botão Lançar (violeta, 40px) e o avatar. No celular ficam só a marca e o avatar: a busca vai para a aba Pessoas e o Lançar para a barra inferior.
- **Busca de pessoa:** campo de 40px e 280px com lupa à esquerda e a tecla `/` desenhada à direita (some com o foco). Lista em papel com Sobreposição, opções de 52px com nome em 14px, 600, matrícula e cargo em 13px e a pílula de situação; a escolhida em `--papel-2`. Combobox ARIA: setas escolhem, Enter abre a ficha, Esc limpa, `/` traz o foco de qualquer tela.
- **Seletor de alcance:** botão de 40px na barra do topo (44px no celular), papel com contorno Linha Forte, ícone de prédio e a trilha "Parceiro › Cliente › CNPJ" em 14px, 600, só com os níveis que o perfil escolhe; no celular fica só o último nível. Abre a folha "Alcance", com um grupo de opções de rádio por nível (círculo de 24px que vira violeta com o visto preto) e "Mostrar" no rodapé. Trocar o alcance dissolve a tela de um para o outro com a mesma view-transition da troca de tema. A Gestão com um CNPJ só não vê o seletor.
- **Só consulta:** quando Parceiro ou Administração veem um cliente, uma faixa de 40px em Véu Violeta fica presa logo abaixo da barra do topo, com ícone de olho em Violeta Tinta: "**Só consulta** · Cliente. Lançar e aprovar ficam com a Gestão da empresa." As telas escondem cadastrar, aprovar e concluir, e o CID aparece como "Restrito" para o Parceiro.
- **Escolha um cliente:** tela de cliente aberta sem cliente no alcance vira uma lista de opções (`EscolhaDeCliente`); escolher já troca o alcance.
- **Pular para o conteúdo:** o primeiro Tab de toda tela interna, uma placa escura de 44px no canto que desce quando recebe foco e leva ao `<main id="conteudo">`.

### Segmentado
Controle de escolha única em trilho `--papel-2` de 9px com 3px de respiro (Linha no cabeçalho da página); opções de 42px (44px em toque), 14px, para o conjunto ter a altura de um campo; a opção escolhida é uma placa de papel com `--e1`. Nas telas internas, a escolhida vai a 700; no celular, o segmentado do cabeçalho ocupa a largura e divide as opções por igual. O **seletor de tema** da entrada (Claro, Sistema, Escuro, cada um com ícone de 16px) é um grupo de rádio navegável por setas, 34px de altura (44px em toque), sem ícones abaixo de 480px, e mantém o peso 500 na escolhida.

### Folha
`Folha` (`componentes/Folha.jsx`) é tudo que se abre por cima: Lançar (com a admissão), informar custos, menu do usuário e aba Menu, e depois filtros, alcance e exportação. É um `<dialog>` aberto com `showModal()`: o navegador prende o foco dentro, fecha com Esc e devolve o foco a quem abriu; clicar fora fecha; a página por trás não rola. Papel com cantos de 16px e Sobreposição, até 520px de largura, sobre véu desfocado. Cabeçalho com título (`h2`) de 22px, subtítulo de 15px e fechar em quadrado de 40px; corpo (`.folha-corpo`) com 24px de respiro e 20px entre os campos; rodapé (`.folha-pe`) em `--papel-2` com ações de 48px à direita. Entra em 0,2s subindo 10px. Em toque, ocupa a largura e sobe de baixo (0,28s) com cantos de 24px no topo e uma alça de 36×4px, respiro lateral de 16px, fechar de 44px, e os botões do rodapé dividem a largura.
- **Popover** (`tipo="popover"`, menu do usuário): no computador, 360px ancorado sob o avatar, cantos de 12px, sem escurecer a tela; no celular, a mesma folha que sobe de baixo.
- **Opção em lista** (`.opcao`): linha de 56px com ícone num círculo de 40px em Véu Violeta e Violeta Tinta, nome em 16px, 600, descrição em 14px e seta; na navegação da aba Menu, círculo de 36px em `--papel-2`, e a tela atual em violeta.

### Menu do usuário
O avatar (círculo lilás de 36px com as iniciais, num alvo de 44px) abre a folha "Sua conta": avatar de 48px, nome e e-mail; perfil, vínculo (empresa ou parceiro) e alcance numa placa `--papel-2`; o aviso de demonstração, quando há; o seletor de tema (Claro, Sistema, Escuro) em largura total; ajuda com os contatos de suporte de `lib/marca.js`; "Ver como…" (só na demonstração: um botão mini por perfil, o atual em Véu Violeta); e Sair como botão fantasma de largura total.

### Palco violeta (entrada)
Superfície inteira em violeta chapado, igual nos dois temas, com texto preto e secundário em Preto Sobre Violeta. Frase em Display; três perfis em colunas com fio preto de 1,5px no topo; etiqueta "Dados ilustrativos" de 12px. A seleção de texto ali inverte (fundo preto, texto violeta). No celular, o palco vira a faixa do alto, com a marca em preto e o ".cx" em branco.

### Prévia do painel (entrada)
Retrato do Início da Gestão montado com as peças reais e dados inventados, marcado como inerte e oculto para leitores de tela: a faixa violeta do Início em escala menor (o quadro, a frase do que espera você e os três números do negócio, cada um com rótulo, valor e apoio empilhados, porque a prévia sai pela borda direita) e dois cartões com as pílulas de prazo (`.quando`) e de situação. Acompanha a cor do parceiro, como o resto do sistema. Segue o tema: é ela que mostra a troca de tema acontecendo enquanto o violeta em volta fica parado. Entra subindo 28px com desfoque em 0,9s, partindo de 40% de opacidade para nunca estar invisível.

### Início (tela inicial da Gestão)
Organizado por assunto (fase 5 do redesenho). De cima para baixo:
- **Faixa de urgência:** 44px, tinta cheia com texto papel (o que espera ação é escuro), ponto rosa quando há vencido, frase em 700 ("4 prazos vencidos e 4 que vencem até quinta") e "Ver pendências" com seta. Só aparece com algo vencido ou vencendo em até 2 dias. Na revisão da implantação, vira Véu Violeta com ícone em Violeta Tinta.
- **Faixa violeta:** o mesmo chão do palco da entrada, igual nos dois temas, texto preto. O quadro em Display ("41 pessoas no quadro", clamp 40–56px; 28–40px no celular) e, abaixo, a frase do que espera a Gestão em 22–30px (19–24px no celular), 700; data e alcance em 15px, Preto Sobre Violeta. À direita (embaixo no celular), três números do negócio com fio preto de 1,5px no topo, como os perfis da entrada: rótulo 14px 600, valor 26px 700 (22px, à direita, no celular), apoio 13px.
- **Folha de mesa** que sobe 32px por cima da faixa (24px no celular), cantos de 24px no topo; dentro, a grade de assuntos em 3 colunas (2 até 1199px, 1 no celular) com vão de 12px.
- **Quadro de assunto:** papel com Papel apoiado, 20px de respiro; título 17px 700; pílula de situação (escura "N esperando você", neutra "N esta semana", lima "Em dia"); três números de 26px com rótulo de 13px (um ponto rosa ao lado do número que pede cuidado, nunca o número em rosa); até três linhas de prazo; rodapé com "e mais N" e o link do assunto em Violeta Tinta.
- **Atividade recente:** linhas de 14px com autor em 600 e a pessoa sublinhada em Linha Forte; o quando à direita em 13px.

### Pendências e linhas de prazo
- **Linha de prazo** (`LinhaDePrazo`): mínimo 64px; o que é em 15px 600, de quem e o detalhe em 13px Tinta de Apoio; pílula de dias à direita e seta. A linha inteira leva à ficha, na aba do assunto.
- **Pílula de dias** (`Prazo`, `.quando`): 26px, 13px 600; rosa "venceu há N dias", escura esta semana ("hoje", "amanhã", "em 4 dias"), neutra depois, contornada em Linha de Campo para "a conferir" (antes da implantação).
- **Aprovação na linha:** nome em 16px 700, o que é em 14px 600, detalhe em 13px; Rejeitar (fantasma) e Aprovar (violeta) com ícone, mini de 40px (44px no toque, dividindo a largura no celular). Decidido, o item encolhe em 0,36s e o número da contagem desce do alto com desfoque em 0,5s; o aviso escuro "Desfazer" (56px, cantos de 14px, botão violeta de 44px) sobe de baixo e fica 6 segundos. Erro do servidor: o item volta e o aviso fica rosa.
- **Grupos de prazos:** título 14px 700 com ponto do tom (rosa, tinta, Linha Forte, papel-2) e contagem; "Mais N" em Violeta Tinta para o que passa do limite.
- **Revisão da implantação:** cartão liso com explicação de 14px, um item por linha com orientação de 13px e o botão "Conferir"/"Conferido" (fantasma vira violeta); rodapé em fio com o que falta e "Concluir revisão", desativado até tudo estar conferido.
- **Esqueleto** (`.esqueleto`): blocos em Linha sobre mesa (preto a 12% no violeta) pulsando a 1,4s; some com movimento reduzido.

### Lançar
Uma `Folha` só para o sistema inteiro, em três passos: **"O que aconteceu?"** (opções em lista com ícone em Véu Violeta), **"Com quem?"** (campo de busca de 48px e a lista de pessoas do quadro com a pílula de situação; "Voltar" num fio embaixo) e o **formulário** do tipo, com a pessoa numa etiqueta `--papel-2` de 48px e "Trocar" em Violeta Tinta (vindo da ficha, a pessoa vai para o subtítulo e o passo 2 some). O atestado fica num bloco com fio de Linha Forte e legenda em 14px 700; o CID diz em dica que é visível só para a Gestão e a Administração. Avisos que ajudam a decidir aparecem na hora, em faixa informativa ("Passa de 15 dias: do 16º dia em diante, o afastamento é com o INSS"). Depois de registrar, a confirmação mostra um círculo lima de 48px com o visto, a frase em 20px 700, a faixa escura do prazo quando há (INSS) e "Ver na ficha", "Lançar outro" e "Pronto" (violeta, com o foco). Erro do servidor fica em faixa rosa acima do rodapé, e os campos continuam preenchidos.

### Ficha do colaborador
- **Coluna do resumo** (300px, fixa a 76px do topo no computador; em cima no celular): papel com avatar lilás de 56px, matrícula em 13px 600 Tinta de Apoio, cargo e departamento em 15px 600, unidade em 14px, a pílula de situação e o tempo de casa em 13px. Abaixo, os alertas dela num cartão de linhas de 52px (pílula de dias, título 14px 600, seta) e as ações rápidas em duas colunas de botões mini sobre papel (no celular, uma linha que rola de lado).
- **Abas** (`Abas`): links de 48px, 14px 600 em Tinta Secundária; a aberta em tinta cheia com fio violeta de 2px embaixo, a voz de ação marcando onde você está. Contagem numa pílula de Linha. Presas logo abaixo da barra do topo, sobre a mesa com fio; no celular rolam de lado e a borda direita esmaece para mostrar que há mais.
- **Dados** (`Dados`): pares em duas colunas (uma no celular), rótulo de 13px Tinta de Apoio e valor de 15px; "não informado" em Tinta de Apoio.
- **Valor protegido** (`ValorProtegido`): mascarado ("R$ •••••", "•••.•••.247-25") até a ação explícita; na ficha, com o olho de 44px do campo de senha da entrada; na lista, "Mostrar salários" no cabeçalho revela a coluna.
- **Linha do tempo** (`LinhaDoTempo`): trilho de 1,5px em Linha Forte; ponto de 12px contornado em Tinta de Apoio (o mais recente em violeta cheio); data em 13px, o que foi em 15px 600 (leva à aba), detalhe em 14px e "registrado por" em 13px. Nunca mostra CID.
- **Segunda linha da tabela** (`.tb-sub`): 13px Tinta de Apoio, para cargo e tempo de casa.

### Troca de tema
A troca entre claro e escuro usa view-transition: a tela inteira se dissolve de um tema no outro em 0,32s (`cubic-bezier(0.16, 1, 0.3, 1)`). Com movimento reduzido, a troca é instantânea, como toda animação e transição do sistema.

## Do's and Don'ts

### Do:
- **Do** usar os tokens semânticos (`--papel`, `--mesa`, `--tinta`, `--linha`, `--acao` e variações) em toda tela nova; o tema escuro vem de graça.
- **Do** derivar qualquer tom novo por `color-mix()` entre as oito cores de `--marca-*`.
- **Do** pôr texto preto sobre violeta e usar `--acao-texto` quando o violeta precisar ser texto ou ícone sobre papel.
- **Do** marcar situação com a pílula e a paleta: lima resolve, escura espera, rosa recusa, violeta em curso, lilás férias, neutro encerrado.
- **Do** manter campos e botões em 48px com campos de 16px em qualquer tela, ações na linha em 44px no toque, e texto nunca abaixo de 12px.
- **Do** abrir toda tela interna com o `Cabecalho` e usar `Secao`, `Cartao` e `Numero` com títulos em frase; nada de rótulo maiúsculo.
- **Do** abrir por cima só com a `Folha`, e acrescentar tela nova em `lib/navegacao.js`, nunca direto no menu.
- **Do** contornar todo campo com Linha de Campo; o fundo gelo sozinho não chega a 3:1.
- **Do** acrescentar todo ícone novo à lista `ICONES` em `componentes/Icones.jsx`: a fonte baixa só os glifos listados.
- **Do** levar toda sombra com o contorno de 1px em `--linha` (`--e1`, `--e2`, `--e-pop`).
- **Do** usar `.num` (algarismos tabulares) em números que se comparam em coluna.
- **Do** fazer o que se abre por cima subir de baixo como folha em toque.

### Don't:
- **Don't** escrever hex solto nas telas nem criar cor fora das oito da marca.
- **Don't** usar violeta como texto sobre fundo claro (3,8:1), nem lima, lilás ou rosa como cor de texto.
- **Don't** escurecer o violeta no hover: com texto preto, o contraste cai para 3,9:1; o hover clareia.
- **Don't** trocar a Helvetica por outra família, nem para títulos nem para números.
- **Don't** usar sombra dura ou deslocada; a profundidade é difusa e sempre contornada.
- **Don't** marcar tom de cartão com tarja lateral colorida. O `Numero` marca o tom com um ponto ao lado do rótulo.
- **Don't** voltar a títulos de seção, rótulos de campo ou cabeçalhos de tabela em maiúsculas pequenas: o registro denso foi substituído.

### Gráficos

Regras de `componentes/Graficos.jsx`, que valem para todos os gráficos do sistema:

- **Evolução no tempo é coluna** (`Serie`), uma por mês (até 40px de largura, cantos de 4px em cima), no violeta (ou na cor de cada série, lado a lado no mesmo mês). A coluna do último mês é cheia; as anteriores ficam com a cor a 50% sobre o papel, para o destaque cair no valor mais importante. O eixo começa do zero, porque a altura da coluna é o valor, e vai até um valor redondo um pouco acima do maior, em dois passos iguais ("R$ 0 · R$ 150 mil · R$ 300 mil"); as marcas ficam numa margem própria à esquerda, que as colunas nunca cobrem. Quantidades (pessoas, dias) usam marcas inteiras. Nenhum valor escrito sobre as colunas. A grade é recessiva: três fios tracejados em `--linha-2` com as marcas em 12px Tinta Suave.
- **Só um valor em destaque:** o do último mês, em 24px, com a variação sobre o anterior na pílula de variação. Os outros meses aparecem numa dica escura (tinta sobre papel invertido) ao passar o mouse, tocar ou chegar pelo teclado: cada mês é uma área de toque com nome acessível, que ganha um fundo `--papel-2` atrás da coluna em foco ("out/26: R$ 256 mil").
- **Comparar categorias é barra horizontal** (`BarrasH`): o rótulo em cima, o trilho de 7px e o valor numa coluna própria à direita, nunca sobre a barra.
- **Formatação** de `lib/formato.js` › `formatarCurto`: reais curtos ("R$ 241 mil", "R$ 1,2 mi"), percentual com uma casa, fator com duas, quantidades inteiras. Nunca número cru.
- **Celular:** os meses do eixo saem de dois em dois (sempre o último), a dica não sai da tela e nada rola de lado.
