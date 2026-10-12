# Redesenho completo do core.cx · módulo dp

Plano aprovado em 11/10/2026. Base: [conceito.md](conceito.md), [PRODUCT.md](../PRODUCT.md) e [DESIGN.md](../DESIGN.md). Cada fase é pequena, testável sozinha e começa numa conversa nova a partir deste documento.

Decisões tomadas na aprovação:
- Módulos novos funcionam **só no modo de demonstração** até a migração para o Supabase; fora dela, ficam ocultos.
- Demonstração com **um login por perfil** e, só na demo, **"Ver como…"** no menu de usuário.
- **Gestão da empresa primeiro**; Parceiro e Administração depois, sobre dados completos.
- Afastamento e Retorno saem de Movimentações: o módulo vira **Atestados e afastamentos**, com tipo de afastamento.
- **Situação do colaborador calculada pelos eventos**, não escolhida à mão.
- **Gênero não é coletado** por enquanto.
- Exportação em **CSV e página para imprimir**.
- **Checagem de contraste** da cor de cada parceiro no cadastro.
- Na fase 5, **três opções da tela inicial lado a lado** antes de implementar.

---

## 1. Tese

**O sistema deixa de ser organizado por livro de registro e passa a ser organizado pelo que a pessoa precisa decidir.** Toda tela responde a uma de três perguntas: *o que precisa de mim?* (pendências e prazos), *quem é essa pessoa?* (a ficha), *como está o negócio?* (indicadores em camadas). As listas por tipo continuam existindo, mas como apoio; a entrada principal é a fila, a ficha e o botão **Lançar**.

**Visual: a linguagem da entrada vira a linguagem do sistema.** O registro denso atual (12,5px, rótulos maiúsculos minúsculos, tarja lateral nos KPIs) é tratado como evidência e substituído pelo da entrada:
- títulos de página em Helvetica 700 de tracking fechado, 28px no celular e 32px no computador (como o "Entrar"), com subtítulo de 15px;
- corpo em 14px; títulos de seção em frase, 700, sem maiúsculas;
- campos e botões de 48px; o que se abre por cima sobe de baixo como folha.

O violeta chapado deixa de ser exclusivo da entrada em um único lugar: **o topo da tela inicial**, que é a entrada do dia a dia. Em todas as outras telas o violeta segue como voz de ação.

**Interações assinatura:**
- **Aprovar no celular em dois toques:** o item sai da fila e o número da faixa violeta baixa na hora.
- **Trocar o alcance** (cliente ou CNPJ): a tela se dissolve de um para o outro, com a mesma view-transition da troca de tema da entrada.

---

## 2. Navegação e casca

### Celular

Barra inferior fixa de 5 posições (64px + área segura), por perfil:

| Perfil | Posições |
|---|---|
| Gestão da empresa | Início (com o número de pendências) · Pessoas · **Lançar** (violeta, ao centro, o único sólido da barra) · Indicadores · Menu |
| Parceiro | Carteira · Cliente · Indicadores · Exportar · Menu |
| Administração | Início · Parceiros · Clientes · Usuários · Menu |

Por quê: hoje o menu fica atrás de um botão flutuante. A barra inferior fica no alcance do polegar, e a Gestão usa o sistema com uma mão.

**Parceiro no celular** (uso secundário, consulta rápida):
- **Carteira:** lista de clientes em cartões, ordenável por um segmentado (Alertas · Custo · Turnover). Os "clientes que pedem atenção" ficam no topo.
- **Cliente:** abre o Início do cliente do alcance atual, em só consulta. Sem cliente escolhido, abre a folha de escolha de cliente.
- **Indicadores:** os painéis no alcance atual (um cliente ou todos).
- **Exportar:** folha que sobe de baixo com o que dá para exportar no alcance atual (CSV de colaboradores, de lançamentos e dos indicadores; página para imprimir do cliente).
- **Menu:** menu de usuário e tema.
- Não existe Lançar nem Aprovar. A faixa "Só consulta" fica fixa no topo do conteúdo quando o alcance é um cliente.

### Computador

Menu lateral (trilho de 60px que abre a 248px), em grupos.

Gestão da empresa:

| Grupo | Itens |
|---|---|
| — | Início, Pendências |
| Pessoas | Colaboradores, Admissões, Desligamentos |
| Rotina | Férias, Atestados e afastamentos, Ocorrências, Movimentações, Documentos |
| Custos | Folha gerencial, Benefícios |
| Acompanhar | Indicadores |
| Empresa | Dados da empresa, Usuários, Importar planilha, Histórico |

Parceiro: Carteira, Indicadores, Exportações e, quando há cliente no alcance, os mesmos grupos da Gestão em só consulta (sem Importar planilha nem Usuários). Administração: Início, Parceiros, Clientes, Usuários.

A lista de itens por perfil fica num único arquivo de configuração.

### Barra do topo

- Marca do parceiro (white-label).
- **Seletor de alcance** `Parceiro › Cliente › Todos os CNPJs`: cada perfil vê só os níveis que alcança. No celular, abre numa folha que sobe de baixo.
- **Busca de pessoa** (nome ou matrícula), porque a ficha é a tela central. No celular, fica no alto da aba Pessoas.
- Botão **Lançar** (só Gestão, no computador).
- Avatar, que abre o menu de usuário.
- Na demonstração, a etiqueta **"Dados de demonstração"**, como o "Dados ilustrativos" da entrada.

---

## 3. Tela inicial por perfil

### Gestão da empresa — `/inicio` (substitui `/painel`), celular primeiro

1. **Faixa violeta** com a data, o alcance e uma frase em preto grande: *"3 coisas precisam de você hoje"*. O conteúdo vem numa folha de papel que sobe por cima da faixa, como na entrada.
2. **Precisa de você:** atestados e afastamentos para validar, férias para aprovar, desligamentos para confirmar. Aprovar e Rejeitar na linha (44px), com "Desfazer" por alguns segundos.
3. **Prazos**, em três grupos: *Vencido* (rosa), *Esta semana* (escuro) e *Próximos 30 dias* (neutro). Cada item mostra a pessoa, os dias que faltam e a ação. Entram: experiência de 45 e 90 dias, férias vencendo e vencidas, aviso de 30 dias e pagamento de férias, prazo de rescisão, registro antes do primeiro dia, afastamento acima de 15 dias (INSS), 13º e documentos vencendo.
4. **Como está o negócio:** custo estimado de pessoal do mês comparado ao anterior, quadro hoje, turnover em 12 meses, absenteísmo do mês e custo estimado da dobra das férias vencidas. Cada número leva ao painel do tema.
5. **Atividade recente**, com quem registrou cada coisa.

Empresa sem colaboradores: a tela vira primeiro passo ("Importe a planilha modelo ou cadastre a primeira pessoa").

**Antes de implementar (fase 5):** montar três estruturas diferentes desta tela e mostrá-las lado a lado para escolha. A estrutura acima é o ponto de partida de uma delas, não a decisão final.

### Parceiro — `/carteira`, computador primeiro

- Números consolidados no topo: clientes, pessoas ativas, custo estimado total, alertas críticos.
- **Clientes que pedem atenção:** mais turnover, maior custo, alertas críticos.
- Tabela ordenável de clientes: CNPJs, pessoas, custo do mês e variação, turnover, absenteísmo, alertas.
- Clicar num cliente muda o alcance e mostra as telas dele em **só consulta**, com "Exportar".

### Administração — `/admin`

- Números de parceiros, clientes e usuários.
- Clientes que pedem configuração (sem usuário, sem CNPJ, importação parada).
- Suporte: consultar um cliente como ele vê e redefinir a senha de um usuário.

---

## 4. Ficha do colaborador — `/colaboradores/[matricula]`

**Topo (resumo em 5 segundos):** avatar lilás, nome em 28px, cargo · departamento · CNPJ, situação, tempo de casa; **os alertas dela** em faixas; **ações rápidas** numa linha que rola de lado (Atestado ou afastamento, Férias, Ocorrência, Movimentação, Desligar), cada uma abrindo o Lançar já com a pessoa.

**Números dela:** tempo de casa, dias de atestado no ano, faltas no ano, saldo de férias, custo estimado de desligar hoje.

**Abas com endereço próprio** (`?aba=ferias`): Resumo · Contrato · Remuneração · Férias · Saúde · Ocorrências · Movimentações · Documentos · Histórico. A aba Desligamento só aparece para quem foi desligado.
- Por quê abas e não blocos sanfonados: um alerta leva direto à aba certa, o voltar funciona e nove blocos abertos viram uma rolagem longa demais.
- Celular: abas que rolam de lado, fixas logo abaixo do resumo.
- Computador: resumo fixo numa coluna à esquerda, abas à direita.

**Privacidade:** salário, CPF e dados bancários mascarados, com o mesmo **botão de olho** do campo de senha da entrada. Para o Parceiro, o CID aparece como "Restrito".

**Situação calculada:** Férias quando há férias em andamento, Afastado quando há afastamento em curso, Inativo depois do desligamento, Ativo no resto. O seletor manual de situação sai da ficha.

---

## 5. Módulos

| Módulo | Rota | Conteúdo |
|---|---|---|
| Pendências | `/pendencias` | Fila única de aprovações e prazos, com filtro por tipo |
| Colaboradores | `/colaboradores` | Filtros por CNPJ, departamento, contrato e situação; salário mascarado |
| Admissões | `/admissoes` | Custos admissionais (exames, uniforme, outros), passos (registro antes do primeiro dia, exame admissional), acompanhamento da experiência |
| Desligamentos | `/desligamentos` | Data, tipo e motivo → **confirmação com a rescisão estimada** e o prazo de 10 dias → concluir. Simulação "custo de desligar hoje" |
| Férias | `/ferias` | Períodos aquisitivos e saldo, programação com aprovação, vencidas com o custo da dobra, aviso de 30 dias, pagamento 2 dias antes |
| **Atestados e afastamentos** | `/afastamentos` (`/atestados` redireciona) | Ver abaixo |
| Ocorrências | `/ocorrencias` | Faltas, atrasos, advertências e suspensões, com autoria |
| Movimentações | `/movimentacoes` | Só reajuste (alteração salarial), promoção, mudança de cargo e transferência, com "passa a valer em". Sem desligamento, sem afastamento e sem checklist |
| Folha gerencial | `/folha` | Abas Resumo do mês · Por colaborador · Encargos (pelo regime tributário) · Provisões e 13º (parcelas e prazos). Sempre identificada como **estimativa** |
| Benefícios | `/beneficios` | VA, VR, VT, plano de saúde e outros: quanto a empresa paga, quanto é descontado, quem tem e quem não tem |
| Documentos | `/documentos` | Validade, vencendo, percentual de cadastros completos |
| Empresa | `/empresa` | CNPJs, filiais, departamentos, regime tributário, usuários, **importação da planilha modelo** (baixar, subir, conferir erros, aceitar ex-colaboradores dos últimos 12 meses com data, tipo e motivo do desligamento), histórico de ações com autor |

### Atestados e afastamentos

Nem todo afastamento é atestado. O registro é um **afastamento**, com:
- **Tipo:** Doença, Acidente de trabalho, Licença-maternidade, Licença não remunerada, Outros.
- Período (início e fim previsto), dias, retorno (data efetiva, quando houver).
- **Atestado** (anexo e CID com a opção "não informado") quando o tipo pede: obrigatório para Doença e Acidente de trabalho, opcional nos demais.
- Validação pela Gestão (Pendente, Aprovado, Rejeitado) quando há atestado.
- Alerta de **encaminhamento ao INSS** acima de 15 dias para Doença e Acidente de trabalho.
- O afastamento em curso muda a situação da pessoa para Afastado; o retorno a devolve para Ativo.
- Regras de LGPD do CID e dos indicadores de saúde valem para todos os tipos com atestado.

A terminologia do PRODUCT.md (tipos de movimentação) é atualizada na fase 8.

### Lançar

Janela única (folha que sobe de baixo no celular) em três passos: *O que aconteceu?* → *Com quem?* → formulário. Aberta pela ficha, pula o passo da pessoa. Tipos: Atestado ou afastamento, Ocorrência, Férias, Movimentação, Admissão, Desligamento, Documento.

---

## 6. Indicadores em três camadas

1. **Tela inicial:** os 4 ou 5 números da seção 3.
2. **`/indicadores` e `/indicadores/[tema]`:** central com 6 temas (Custos, Quadro, Absenteísmo e Saúde, Férias e 13º, Benefícios, Movimentações), cada um com o número principal e uma mini-série. O painel do tema traz números principais, evolução de 12 meses, recortes por CNPJ, filial e departamento, e filtros (período, CNPJ, departamento) no endereço da página.
3. **`/indicadores/[tema]/[indicador]`:** o número explicado (como é calculado, com o selo de estimativa), a tabela de recortes e a lista das pessoas, cada uma levando à ficha.

- **Saúde (LGPD):** sempre agregada; grupos com menos de 3 pessoas aparecem como *"Oculto por privacidade: menos de 3 pessoas"*.
- **Parceiro:** com o alcance em "Todos os clientes", cada painel ganha a comparação entre clientes.
- **Entrega:** a estrutura sai com os temas que já têm dados (Quadro, Absenteísmo e Saúde, Movimentações); cada módulo novo entrega o próprio painel junto.
- Carregar a skill `dataviz` antes de escrever qualquer gráfico.

---

## 7. Componentes

Reaproveitar e estender antes de criar (regra do CLAUDE.md).

| Hoje | Passa a ser |
|---|---|
| `Comando` | `Cabecalho`: título grande, subtítulo e ações; encolhe para a barra do topo ao rolar |
| `PainelDeRegistro` | `Folha`: genérica, usada no Lançar, nos filtros, no alcance, no menu e na exportação |
| `Kpi` | `Numero`: sem a tarja lateral, com variação e link para o detalhe |
| `Status` | ganha `Prazo` (dias restantes, com o tom da situação) |
| `Graficos` | ganha `Composicao` (barra empilhada do custo), `MiniSerie` e `Variacao`; a rosca sai, trocada por barras horizontais |
| `Filtros` | ganha `SeletorDeAlcance` |

Novos: `BarraInferior`, `MenuDoUsuario`, `BuscaDePessoa`, `Abas` (com endereço), `ValorProtegido` (olho), `Estimativa` (selo com a explicação do cálculo), `ItemPendente` (aprovar e rejeitar na linha), `LinhaDoTempo`, `Passos`, `Lancar`.

Estados obrigatórios em toda tela: esqueleto ao carregar (`loading.js` por rota), vazio que ensina o próximo passo, faixa de erro via `mensagemParaTela`, faixa "Só consulta" para o Parceiro.

---

## 8. Menu de usuário

O avatar abre um popover no computador e uma folha no celular (no celular, o mesmo bloco fica no topo da aba Menu):
- nome, e-mail, perfil, empresa ou parceiro;
- alcance atual;
- **tema** (Claro, Sistema, Escuro), com o mesmo seletor do rodapé da entrada;
- Usuários da empresa (só Gestão);
- ajuda e contato do suporte, de `lib/marca.js`;
- **Ver como…** (só na demonstração);
- Sair.

---

## 9. Dados, permissões e demonstração

- **`lib/dados/`:** um repositório por domínio (pessoas, eventos, afastamentos, férias, folha, benefícios, documentos, empresas, parceiros, usuários, histórico), já no formato pensado para o Supabase. É a porta de entrada das telas para os domínios novos; `lib/registros.js` continua valendo para os atuais até serem migrados.
- **Fora da demonstração:** as áreas atuais continuam lendo do Sheets por um adaptador; os módulos novos ficam ocultos.
- **`lib/permissoes.js`:** `pode(perfil, ação)`, usado nas ações de servidor e nas telas.
- **Alcance:** vem da sessão mais um cookie de escolha, sempre validado no servidor.
- **`lib/calculos/`:** funções puras de folha gerencial, encargos por regime, provisões, rescisão e custo de desligar.
- **Um único arquivo de tabelas** (INSS, FGTS, IRRF, salário mínimo etc.), com a fonte oficial de cada valor. Pesquisar as tabelas vigentes de 2026 na fase 7 e mostrar para conferência antes de usar. Nunca valores inventados.
- **Regras de prazo** (45/90 dias, 30 dias, 2 dias, 10 dias, 15 dias, 30/11, 20/12) também num arquivo de configuração.
- **Gerador de dados fictícios:** resultado estável, com **datas ancoradas no dia de hoje** para os alertas não envelhecerem. 2 parceiros (um fictício, identificado como tal, com cores próprias para provar o white-label); cerca de 6 clientes de 8 a 60 pessoas nos três regimes tributários; um cliente com matriz e 2 filiais; 18 meses de histórico com admissões, desligamentos (tipo e motivo), férias em todas as situações, afastamentos de todos os tipos, atestados com CID (alguns "não informado"), reajustes, benefícios, documentos vencendo e autoria em tudo.
- **Logins da demo:** `gestao@`, `parceiro@`, `admin@`, além de `teste@gmail.com` (Gestão).
- **Testes:** `node --test` (nativo, sem dependência) para cálculos, prazos e **isolamento** (nenhum parceiro ou cliente vê dado de outro).
- **White-label:** a cor do parceiro sobrescreve os tokens `--marca-*`; o cadastro recusa cor que não dê contraste com o texto sobre ela.

---

## 10. Fases

Toda fase é testada em 375px e 1440px, nos temas claro e escuro, e termina com `npm run build` sem erros. Fases que mudam a camada de dados ou o CSS global mostram o plano detalhado antes de começar (regra do CLAUDE.md).

| # | Fase | Entrega | Como testar |
|---|---|---|---|
| 1 | **Fundação visual** ✅ concluída em 12/10/2026 | Tipografia e medidas da entrada nas telas internas; `Cabecalho`, seções, `Numero`, tabelas e cartões, campos de 48px; aplicada às 7 telas atuais **sem mudar o conteúdo**; DESIGN.md atualizado | As 7 telas atuais funcionando com o visual novo |
| 2 | **Navegação e casca** ✅ concluída em 12/10/2026 | Barra inferior, menu lateral reorganizado, menu de usuário, busca de pessoa, `Folha` genérica; textos novos dos perfis na entrada (`lib/marca.js`) | Navegar tudo com uma mão em 375px; teclado e leitor de tela |
| 3 | **Camada de dados, perfis e alcance** | `lib/dados/`, permissões, seletor de alcance, logins por perfil, "Ver como…"; navegação de cada perfil (incluindo a do Parceiro no celular) | Testes de isolamento; cada login vê só o que alcança |
| 4 | **Dados de demonstração ampliados** | Gerador com datas ancoradas em hoje, parceiros, clientes, CNPJs, 18 meses de histórico | Números das telas atuais mudam com coerência ao trocar o alcance |
| 5 | **Início da Gestão e Pendências** | **Primeiro: três estruturas da tela inicial lado a lado para escolha.** Depois: a escolhida, Pendências, regras de prazo em configuração | Aprovar e rejeitar no celular; prazos batem com os dados |
| 6 | **Ficha e lista de colaboradores** | Resumo, números, abas com endereço, linha do tempo, valores mascarados, situação calculada | Abrir pelo alerta e cair na aba certa; Parceiro vê o CID como restrito |
| 7 | **Tabelas e cálculos** | Arquivo de tabelas com fontes, cálculos puros, testes com casos conferidos | `node --test` passando; tabelas conferidas pelo usuário |
| 8 | **Lançar, Ocorrências, Atestados e afastamentos, Movimentações** | Lançar em três passos, autoria, tipos de afastamento, validação com CID, INSS acima de 15 dias; PRODUCT.md com a terminologia nova | Lançar de qualquer tela; aparece no histórico com autor; afastamento muda a situação |
| 9 | **Admissões e Desligamentos** | Custos admissionais, passos, confirmação com rescisão estimada, custo de desligar hoje | Desligar alguém e ver custo, prazo e alerta |
| 10 | **Estrutura de indicadores** | Central, modelo de painel e de detalhe; Quadro, Absenteísmo e Saúde, Movimentações; regra dos menos de 3 | Do número à pessoa em 3 cliques; grupo pequeno oculto |
| 11 | **Férias** + painel Férias | Períodos, programação e aprovação, dobra, prazos | Vencidas, vencendo e programadas batem com a ficha |
| 12 | **Folha gerencial, encargos e 13º** + painel Custos | Competência, composição, fator de custo, provisões e parcelas | Totais batem com os cálculos testados; trocar o regime muda os encargos |
| 13 | **Benefícios** + painel Benefícios | Catálogo, empresa paga e desconto, quem não tem | Custo entra na folha gerencial |
| 14 | **Documentos e Empresa** | Validade, completude, CNPJs, departamentos, usuários, importação da planilha modelo, histórico | Subir uma planilha com erros e ver o que corrigir |
| 15 | **Parceiro** | Carteira, consulta de um cliente, comparação, exportação (CSV e página para imprimir), white-label com checagem de contraste | Login de parceiro não vê nada de outro parceiro; marca troca |
| 16 | **Administração e fechamento** | Parceiros, clientes, usuários, suporte; prévia da entrada redesenhada; `/painel` redireciona para `/inicio`; revisão final | Revisão final em todas as telas |

---

## 11. Limites

**Não muda:** o visual da entrada (só os textos dos perfis e a prévia); as 8 cores da marca, a Helvetica, os ícones Material Symbols; nada de marca fixo nas telas; o que está fora do escopo (ponto, eSocial, integração com contabilidade, holerite, cálculo oficial de folha).

**Não coletado por enquanto:** gênero.

**Fora deste plano:** perfil Colaborador (fase 2 do produto) e gestor de área. A estrutura de perfis e permissões deixa espaço para os dois sem redesenho.

---

## 12. Registro das fases

O que cada fase entregou e o que ficou decidido no caminho, para a fase seguinte começar daqui.

### Fase 1: fundação visual (12/10/2026)

- `Comando` saiu; toda tela abre com `Cabecalho` (`componentes/Estrutura.jsx`): `titulo`, `subtitulo` (o antigo contador), `acoes`, `voltar` e os filtros como filhos. O título vai para a barra do topo ao rolar (`componentes/TituloNaBarra.jsx`, no lugar `#titulo-na-barra` do layout).
- `Numero`/`Numeros` substituem `Kpi`/`Kpis` nas telas; aceitam `tom`, `href` e `variacao` (pronta, ainda sem uso). `Kpi` continua só para a prévia da entrada.
- A prévia da entrada está congelada até a fase 16: um bloco `.previa …` no `globals.css` segura as medidas antigas de cartão e pílula. A entrada foi conferida pixel a pixel contra a versão anterior (sem diferença).
- Tabelas sem o invólucro `p-[10px]`: encostam nas bordas do cartão liso e viram lista no celular.
- `BotaoEnviar` ganhou `variante`. Tokens novos: `--alt-ctrl` (48px), `--respiro` (32px; 16px no celular), `--r-folha` (24px).
- Menu lateral e menu do usuário não mudaram (fase 2).

### Fase 2: navegação e casca (12/10/2026)

- `lib/navegacao.js` é o arquivo único de navegação por perfil: grupos do menu lateral, barra inferior, opções do Lançar. Só a Gestão está definida; itens de módulos futuros ficam com `disponivel: false`. Parceiro e Administração entram na fase 3.
- Celular: `BarraInferior` (Início com o número de pendências, Pessoas, Lançar, Indicadores, Menu) no lugar do botão flutuante e da gaveta; a aba Menu é uma folha com o bloco da pessoa e a navegação completa. O menu lateral só existe a partir de 901px.
- `Folha` (`componentes/Folha.jsx`, `<dialog>` com `showModal()`) é a base de tudo que abre por cima; `PainelDeRegistro` usa ela. Classes `.md-*` viraram `.folha-*` (`md-duas` → `folha-duas`).
- Lançar provisório: a folha "O que aconteceu?" leva ao cadastro da própria tela com `?lancar=1` (`PainelDeRegistro abrirAoCarregar`). O Lançar em três passos continua na fase 8.
- Menu do usuário (`MenuDoUsuario.jsx`): popover no computador, folha no celular; tema, ajuda (contatos de `MARCA.suporte`, os mesmos canais da Conexão CX que a entrada já indica) e Sair. "Ver como…" e o alcance entram na fase 3.
- `BuscaDePessoa` na barra do topo (computador) com a ação de servidor `buscarPessoas`; no celular a busca é a da tela Colaboradores.
- `contarPendencias()` em `lib/registros.js` serve o painel e o número da barra inferior. `emDemonstracao()` em `lib/contexto.js` mostra a etiqueta "Dados de demonstração".
- Textos novos dos perfis na entrada (`MARCA.perfis`): Gestão lança, Gestão aprova, Parceiro acompanha.
- Acessibilidade da casca: "Pular para o conteúdo", `<header>` na barra do topo, `<main id="conteudo">`, hover do Tailwind só em quem tem mouse (`hoverOnlyWhenSupported`).

