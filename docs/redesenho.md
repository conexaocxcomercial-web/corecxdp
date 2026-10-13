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

Escolhida na fase 5, entre três estruturas, a **organizada por assunto**:

1. **Faixa de urgência**, fina e escura, no topo: só aparece quando há prazo vencido ou vencendo em até 2 dias, e leva direto a Pendências. Durante a revisão da implantação, dá lugar à faixa da revisão.
2. **Faixa violeta** com o quadro em Display ("41 pessoas no quadro"), uma frase do que espera a Gestão ("11 coisas esperando você, a maior parte em férias e afastamentos"), a data, o alcance e os números do negócio: custo estimado de pessoal do mês comparado ao anterior (hoje, a soma dos salários, até a folha gerencial da fase 12), turnover em 12 meses e absenteísmo do último mês fechado.
3. **Um quadro por assunto** (Pessoas e contratos, Férias e 13º, Saúde e afastamentos, Ocorrências, Documentos, Desligamentos), cada um com a situação ("3 esperando você", "esta semana" ou "Em dia"), três números e os três itens mais urgentes, levando à ficha ou a Pendências filtrada.
4. **Atividade recente**, com quem registrou cada coisa.

**Pendências** (`/pendencias`) é a fila única: a revisão da implantação, quando há; as aprovações (Aprovar e Rejeitar na linha, 44px, com "Desfazer" por alguns segundos, e o número baixa na hora); e os prazos em Vencido, Esta semana, Próximos 30 dias e Mais adiante, com filtros por assunto e por data no endereço.

Empresa sem colaboradores: a tela vira primeiro passo ("Cadastre a primeira pessoa").

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
- **Um único arquivo de tabelas** (INSS, FGTS, IRRF, salário mínimo etc.), com a fonte oficial de cada valor: `lib/tabelas.js`, conferido em [tabelas.md](tabelas.md). Pesquisar as tabelas vigentes de 2026 na fase 7 e mostrar para conferência antes de usar. Nunca valores inventados.
- **Regras de prazo** (45/90 dias, 30 dias, 2 dias, 10 dias, 15 dias, 30/11, 20/12) também num arquivo de configuração (`lib/regrasDePrazo.js`), conferidas pelo usuário em 13/10/2026, com dois acréscimos:
  - prazos de pagamento (férias, rescisão e 13º) que caem em fim de semana ou feriado antecipam para o dia útil anterior (em 2026, a 2ª parcela do 13º vence em 18/12, porque 20/12 é domingo);
  - afastamentos pela mesma doença (mesmo CID) com intervalo de até 60 dias somam os dias para contar os 15 dias da empresa e o encaminhamento ao INSS.

### Implantação em empresas que já existem

- **Planilha modelo**, com abas para:
  - **empresa:** CNPJs, filiais, departamentos, regime tributário e, no Simples Nacional, o anexo;
  - **colaboradores ativos**;
  - **ex-colaboradores dos últimos 12 meses**, com data, tipo e motivo do desligamento;
  - **férias:** períodos aquisitivos e férias já tiradas, desde o período aberto mais antigo;
  - **atestados dos últimos 12 meses**, com dias e CID;
  - **reajustes e mudanças de cargo** (opcional);
  - **benefícios atuais**.
- **A importação mostra os erros por linha**, para corrigir no Excel e subir de novo.
- **Cada empresa tem uma data de implantação.** Prazos vencidos antes dessa data aparecem como **"a conferir na implantação"**, e não como vencidos.
- **Revisão antes dos alertas:** depois da importação, a Gestão passa por uma revisão do que parece inconsistente (férias aparentemente vencidas, experiências abertas, documentos sem validade). Os alertas de prazo começam quando a revisão termina.
- **Regime tributário:** no Simples Nacional, o cadastro pede também o anexo, porque no Anexo IV o INSS patronal é pago à parte.
- A planilha modelo e a tela de importação são da fase 14; a data de implantação, os prazos "a conferir" e a revisão já valem desde a fase 5 (na demonstração, a Oficina Bom Motor foi implantada há 12 dias e começa com a revisão aberta).
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
| 3 | **Camada de dados, perfis e alcance** ✅ concluída em 12/10/2026 | `lib/dados/`, permissões, seletor de alcance, logins por perfil, "Ver como…"; navegação de cada perfil (incluindo a do Parceiro no celular) | Testes de isolamento; cada login vê só o que alcança |
| 4 | **Dados de demonstração ampliados** ✅ concluída em 12/10/2026 | Gerador com datas ancoradas em hoje, parceiros, clientes, CNPJs, 18 meses de histórico | Números das telas atuais mudam com coerência ao trocar o alcance |
| 5 | **Início da Gestão e Pendências** ✅ concluída em 13/10/2026 | **Primeiro: três estruturas da tela inicial lado a lado para escolha.** Depois: a escolhida, Pendências, regras de prazo em configuração | Aprovar e rejeitar no celular; prazos batem com os dados |
| 6 | **Ficha e lista de colaboradores** ✅ concluída em 13/10/2026 | Resumo, números, abas com endereço, linha do tempo, valores mascarados, situação calculada | Abrir pelo alerta e cair na aba certa; Parceiro vê o CID como restrito |
| 7 | **Tabelas e cálculos** ✅ concluída em 13/10/2026 (tabelas conferidas; revisão da contabilidade parceira antes de clientes reais, [tabelas.md](tabelas.md)) | Arquivo de tabelas com fontes, cálculos puros, testes com casos conferidos | `node --test` passando; tabelas conferidas pelo usuário |
| 8 | **Lançar, Ocorrências, Atestados e afastamentos, Movimentações** | Lançar em três passos, autoria, tipos de afastamento, validação com CID, INSS acima de 15 dias; PRODUCT.md com a terminologia nova | Lançar de qualquer tela; aparece no histórico com autor; afastamento muda a situação |
| 9 | **Admissões e Desligamentos** | Custos admissionais, passos, confirmação com rescisão estimada, custo de desligar hoje | Desligar alguém e ver custo, prazo e alerta |
| 10 | **Estrutura de indicadores** | Central, modelo de painel e de detalhe; Quadro, Absenteísmo e Saúde, Movimentações; regra dos menos de 3 | Do número à pessoa em 3 cliques; grupo pequeno oculto |
| 11 | **Férias** + painel Férias | Períodos, programação e aprovação, dobra, prazos | Vencidas, vencendo e programadas batem com a ficha |
| 12 | **Folha gerencial, encargos e 13º** + painel Custos | Competência, composição, fator de custo, provisões e parcelas | Totais batem com os cálculos testados; trocar o regime muda os encargos |
| 13 | **Benefícios** + painel Benefícios | Catálogo, empresa paga e desconto, quem não tem | Custo entra na folha gerencial |
| 14 | **Documentos e Empresa** | Validade, completude, CNPJs, departamentos (com o anexo do Simples Nacional), usuários, importação da planilha modelo (abas e erros por linha, ver § 9 › Implantação), histórico | Subir uma planilha com erros e ver o que corrigir |
| 15 | **Parceiro** | Carteira, consulta de um cliente, comparação, exportação (CSV e página para imprimir), white-label com checagem de contraste | Login de parceiro não vê nada de outro parceiro; marca troca |
| 16 | **Administração e fechamento** | Parceiros, clientes, usuários, suporte; prévia da entrada redesenhada; `/painel` redireciona para `/inicio`; revisão final | Revisão final em todas as telas |

---

## 11. Limites

**Não muda:** o visual da entrada (só os textos dos perfis e a prévia); as 8 cores da marca, a Helvetica, os ícones Material Symbols; nada de marca fixo nas telas; o que está fora do escopo (ponto, eSocial, integração com contabilidade, holerite, cálculo oficial de folha).

**Não coletado por enquanto:** gênero.

**Fora deste plano:** perfil Colaborador (fase 2 do produto) e gestor de área. A estrutura de perfis e permissões deixa espaço para os dois sem redesenho.

**Melhorias futuras registradas:**
- Cadastrar a cidade de cada CNPJ, para os prazos de pagamento considerarem os feriados municipais e estaduais (hoje, só os nacionais e a Sexta-feira da Paixão).
- Revisão das tabelas e dos cálculos pela contabilidade parceira antes do uso com clientes reais.

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

### Fase 3: camada de dados, perfis e alcance (12/10/2026)

- `lib/permissoes.js`: `pode(perfil, ação)` e `normalizarPerfil` (Cliente "*" é Administração; "administrador" e "Operador" antigos viram Gestão). Usado nas telas, nas ações e de novo em `lib/registros.js` antes de gravar (segunda barreira).
- `lib/dados/`: `regras.js` (puro: resolve o alcance e recorta as linhas; é o que os testes cobrem), `estrutura.js` (parceiros → clientes → CNPJs, no formato das tabelas do Supabase), `alcance.js` (sessão + cookie `core_cx_alcance`, sempre revalidado no servidor) e `usuarios.js`. Os domínios novos (eventos, férias, folha…) ganham repositório quando o módulo deles for feito.
- `lib/contexto.js › clienteAtual` agora vem do alcance. Telas de cliente sem cliente no alcance mostram "Escolha um cliente" (o layout sabe a rota pelo cabeçalho `x-caminho` que o middleware põe). Por enquanto toda tela atual mostra um cliente por vez: a visão consolidada de vários clientes chega com a carteira completa (fase 15) e os indicadores (fase 10), já com ids únicos (a matrícula se repete entre clientes).
- Demonstração: `lib/demo/dados/estrutura.json` com 2 parceiros (Conexão CX e Contabilidade Horizonte, fictícia) e 3 clientes, cada um com 1 CNPJ; só "Empresa Teste" tem registros (a fase 4 gera o resto). Logins: `teste@gmail.com` e `gestao@demo.test` (Gestão), `parceiro@demo.test`, `admin@demo.test`, todos com `demo123`. "Ver como…" no menu do usuário troca de perfil sem senha.
- O cache em memória da demonstração recomeça quando o conteúdo dos JSON muda (não precisa reiniciar o `next dev`).
- Telas novas, só na demonstração e em versão inicial: `/carteira` (Parceiro: clientes, pessoas ativas, atestados por validar e "Consultar") e `/admin` (Administração: parceiros, clientes, usuários e "Consultar").
- Fora da demonstração nada muda: todo login é Gestão do próprio cliente (Cliente "*" continua vendo tudo).
- CID: `listarAtestados` não entrega o CID a quem não pode vê-lo (`cidRestrito`); as telas mostram "Restrito".
- Filtro por CNPJ: o alcance já guarda o CNPJ, mas nenhum cliente da demonstração tem mais de um ainda; o recorte dos registros por CNPJ entra na fase 4, com os dados.
- Testes: `npm test` (`node --test`, sem dependência) roda `testes/isolamento.test.js`: 11 casos de alcance, recorte, permissões e navegação.

### Fase 4: dados de demonstração ampliados (12/10/2026)

- `lib/demo/gerador.js` (puro, determinístico): `gerarDemonstracao(hoje)` devolve parceiros, clientes, CNPJs, pessoas (contrato, salário, jornada, nascimento, gestor, desligamento com tipo e motivo), ocorrências, afastamentos (Doença, Acidente de trabalho, Licença-maternidade, Licença não remunerada, Outros; atestado com CID ou "não informado"; validação; INSS acima de 15 dias), movimentações (reajuste da data-base, promoção, mudança de cargo, transferência, desligamento, afastamento e retorno), férias (gozada, programada, aguardando aprovação, em andamento, a vencer, vencida, a programar), benefícios e adesões, documentos com validade, e autoria (`registrado_por`, `registrado_em`) em tudo. Valores e pessoas são fictícios; nada disso é tabela oficial.
- `paraTabelas` converte para as abas que as telas atuais leem (com a coluna CNPJ nas pessoas); `lib/demo/fonte.js` gera para o dia de hoje e refaz quando o dia muda. `dadosCompletos()` entrega o resto para os repositórios dos módulos novos. Os JSON antigos de registros e de estrutura saíram; ficou `usuarios.json` (logins).
- 2 parceiros (Conexão CX e Contabilidade Horizonte, fictícia, com cores próprias para a fase 15) e 6 clientes: Empresa Teste (42 pessoas, Simples, matriz e 2 filiais), Padaria Pão de Mel (12, Simples), Clínica Vida Plena (28, Presumido), Escola Saber Mais (18, Simples), Oficina Bom Motor (9, Presumido) e Transportes Rota Sul (60, Real). Login novo `horizonte@demo.test` (parceiro da Horizonte).
- Situação de hoje calculada pelos eventos (Inativo, Afastado, Férias, Ativo). Gênero não é gerado: o gerador só flexiona o cargo pelo nome e não guarda nada disso.
- `lib/registros.js`: recorte por CNPJ nas leituras (pessoas pela coluna CNPJ, eventos pelas matrículas delas, `filtrarPorCnpj` em `lib/dados/regras.js`); gravação e códigos continuam pelo cliente inteiro. O cadastro de colaborador pede o CNPJ quando o cliente tem mais de um.
- Testes: `testes/demonstracao.test.js` (estabilidade, âncora em hoje, estrutura, histórico, tipos, autoria, CPFs, recorte por CNPJ). `npm test`: 21 casos.
- Conferido no navegador (build de produção): as três unidades da Empresa Teste somam o todo (38 ativas = 23 + 10 + 5; 6 pendências = 3 + 3 + 0; 55 na lista = 32 + 14 + 9); cada parceiro vê só os próprios clientes.
- Para as próximas fases: as telas de lista não paginam (Movimentações tem cerca de 100 linhas por cliente grande); o tempo de casa de quem já saiu ainda conta até hoje (fase 6); "Pessoas ativas" do painel conta só a situação Ativo, sem afastados e em férias (definição a revisar na fase 10).

### Fase 5: Início da Gestão e Pendências (13/10/2026)

- Três estruturas comparadas lado a lado em `/opcoes-do-inicio` (A · Fila do dia, B · Agenda, C · Por assunto); escolhida a **C**, com a faixa de urgência no topo. A página de comparação saiu.
- `/inicio` (opção C) e `/pendencias` (fila única, filtros `?assunto=` e `?quando=`), só na demonstração; fora dela, o Início continua sendo o painel (`lib/navegacao.js`, `soNaDemonstracao`). Login, `/` e "Consultar" levam ao Início; a barra inferior mostra o mesmo "esperando você" do Início (aprovações e prazos vencidos).
- Decisões de verdade: Aprovar e Rejeitar atestado, Aprovar e Recusar férias (o período volta para "a programar"), Concluir desligamento, com autoria, e Desfazer, que volta ao estado anterior. O item sai da lista e a contagem baixa antes de o servidor responder; se o servidor recusar, o item volta com o aviso.
- **Fonte única na demonstração** (`lib/demo/memoria.js`): os dados completos são a fonte; as abas das telas atuais saem deles a cada leitura, com o número da linha estável (os dados só crescem pelo fim) e os códigos guardados no registro. O que as telas atuais gravam vira alteração nos dados (com autoria); o que Pendências decide aparece em Atestados e Movimentações.
- Regras: `lib/regrasDePrazo.js` (com feriados nacionais), `lib/calendario.js` (Páscoa, feriados, dia útil anterior), `lib/prazos.js` (aprovações, prazos, mesma doença em 60 dias, implantação, revisão, urgentes). Repositórios: `lib/dados/pendencias.js` (leitura, permissão, autoria e decisões) e `lib/dados/inicio.js` (números, assuntos, atividade).
- Implantação: todo cliente tem `implantacao` e `revisao`. Na demonstração, o que veio antes da implantação está em nome de "Importação da planilha"; a Oficina Bom Motor (login `oficina@demo.test`) foi implantada há 12 dias, só com o que a planilha traz, e tem 4 itens na revisão (férias aparentemente vencidas, experiência aberta, 2 ASO sem validade). Concluir a revisão exige tudo conferido; daí os vencidos de antes passam a vencido e a faixa de urgência aparece.
- Gerador: dois afastamentos pelo mesmo CID que somam 18 dias (INSS no 16º dia somado), códigos guardados, implantação por cliente.
- Testes: `testes/prazos.test.js` (dia útil, 13º de 2026, mesma doença, implantação e revisão, recorte por CNPJ, LGPD), `testes/calendario.test.js`, `testes/memoria.test.js`, navegação nos dois modos. `npm test`: 44 casos.
- Conferido no navegador: aprovar baixa a contagem na hora e a barra inferior depois do servidor, e o atestado aparece aprovado em Atestados; Rejeitar e Desfazer voltam ao pendente; a revisão da Oficina só conclui com tudo conferido; o Parceiro vê "esperando a Gestão", sem botões. 375px e 1440px, claro e escuro.
- Para as próximas fases: a ficha abre na aba pelo `?aba=` que os prazos já mandam (fase 6); o custo estimado de pessoal e o custo da dobra das férias vencidas entram com Férias (fase 11) e Folha gerencial (fase 12); feriados estaduais e municipais entram no cadastro da empresa (fase 14).

### Fase 6: ficha e lista de colaboradores (13/10/2026)

- `lib/pessoas.js` (puro): situação calculada pelos eventos (Inativo depois do desligamento, Afastado com afastamento em curso e atestado não rejeitado, Férias com gozo em curso, Ativo no resto), tempo de casa até a saída para quem saiu, saldo de férias (períodos completos não tirados mais os avos em aquisição), números da pessoa, situação da experiência, linha do tempo (sem CID) e CPF protegido. Testes em `testes/pessoas.test.js`.
- A situação calculada vale em toda a demonstração: as abas das telas atuais saem com ela (`lib/demo/memoria.js`), e o Início conta afastados e em férias por ela. O seletor manual de situação saiu da ficha, e o cadastro entra como Ativo.
- `lib/dados/pessoas.js`: lista e ficha a partir do recorte do alcance (`lib/dados/recorte.js`, dividido com Pendências e o Início). Fora da demonstração, adapta o que a planilha tem para o mesmo formato (contrato, salário, férias, benefícios e documentos ficam vazios e as abas dizem que o dado não está cadastrado); Inativo e Férias que só a planilha sabe continuam valendo.
- Lista: busca por nome, matrícula, cargo ou CPF; filtros por unidade (com mais de um CNPJ), departamento, contrato e situação no endereço; cargo e tempo de casa na segunda linha; salário mascarado, revelado por "Mostrar salários".
- Ficha: resumo à esquerda (fixo no computador; em cima no celular) com avatar, cargo, unidade, situação e tempo de casa, os alertas dela (prazos e aprovações, cada um levando à aba certa) e as ações rápidas (Atestado, Ocorrência, Movimentação, Desligar, abrindo o cadastro já com a pessoa). Abas com endereço (`?aba=`): Resumo (números, dados, últimos registros), Contrato (com as datas da experiência), Remuneração (salário com o olho, reajustes, benefícios), Férias (períodos, limite para tirar, gozo, situação), Saúde (CID "Restrito" para o Parceiro, sem sair do servidor), Ocorrências, Movimentações, Documentos (validade e prazo), Histórico (linha do tempo com autor) e Desligamento, só para quem saiu.
- Componentes novos: `Abas` (links, presas abaixo da barra do topo, rolando de lado no celular), `ValorProtegido`/`ProtecaoDeValores`/`BotaoDeMostrar`, `Ficha.jsx` (resumo, alertas, ações rápidas, números, dados, linha do tempo).
- Conferido no navegador: o alerta de Pendências abre a ficha na aba Saúde; o Parceiro vê o CID como restrito e ele não aparece no HTML; o olho revela salário e CPF; o filtro de inativos mostra o tempo de casa até a saída. 375px e 1440px. `npm test`: 51 casos.
- Para as próximas fases: o "custo estimado de desligar hoje" entra nos números da ficha com Desligamentos (fase 9), e o custo total estimado na Remuneração com a folha gerencial (fase 12); Férias no Lançar e a ação rápida de férias chegam com o módulo de Férias (fase 11).

### Fase 7: tabelas e cálculos (13/10/2026)

- `lib/tabelas.js`: arquivo único das tabelas de 2026, cada valor com fonte e confiança (oficial, calculado, jurisprudência, secundária). Inclui salário mínimo, INSS do empregado, IRRF com a redução da Lei 15.270/2025, salário-família, FGTS e multa por tipo de desligamento, INSS patronal, RAT e FAP, terceiros por FPAS, Simples Nacional por anexo, desoneração (só registro), verbas fixas, incidências de INSS, FGTS e IRRF por verba e as verbas da rescisão por tipo. Levantado em fonte oficial (Planalto, DOU, Receita, INSS); o documento de conferência é `docs/tabelas.md`.
- `lib/calculos/` (puro): `inss.js` (faixa a faixa, até o teto), `irrf.js` (dedução legal ou simplificada, redução pelo rendimento bruto), `encargos.js` (alíquotas por regime e anexo; recusa estimar sem anexo do Simples, FPAS ou RAT), `custo.js` (custo estimado do mês com provisões, encargos e benefícios), `rescisao.js` (aviso proporcional com projeção, avos de 13º e férias, dobro, art. 479, FGTS do mês, multa sobre o saldo estimado, encargos pelo que tem incidência, custo de desligar), `dinheiro.js` (centavos, meio para cima).
- Demonstração: cada cliente tem o anexo do Simples ou FPAS, RAT e FAP (fictícios), para a folha gerencial da fase 12.
- Testes: `testes/calculos.test.js` com os exemplos oficiais da Receita para o IRRF, as faixas do INSS e rescisões conferidas à mão. `npm test`: 63 casos.
- Nada disso vai para as telas antes da conferência do usuário (fases 9, 11 e 12).
- Conferência do usuário em 13/10/2026: as sete escolhas aprovadas, com dois acréscimos: o saldo real do FGTS informado na ficha substitui a estimativa (o campo entra na fase 9, com o custo de desligar), e a rescisão desconta a 1ª parcela do 13º quando ela já foi paga (pelo valor informado ou pelo prazo legal). O 13º sobre o aviso que passa do fim do ano agora leva os avos do ano seguinte. `npm test`: 66 casos.
- Antes do uso com clientes reais, a contabilidade parceira revisa as tabelas e os cálculos (`docs/tabelas.md`).

