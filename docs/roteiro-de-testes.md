# Roteiro de testes do core.cx · módulo dp

Passo a passo para conferir o sistema inteiro na demonstração, perfil por perfil. Cada item diz o que fazer, o que deve acontecer e, quando muda, onde olhar no celular. Marque `[x]` no que passou e anote embaixo o que precisa de ajuste.

## Antes de começar

1. No `.env.local`:
   ```ini
   MODO_DEMO=1
   AUTH_SECRET=qualquer_texto_longo_aleatorio
   ```
2. Rode `npm run dev` e abra `http://localhost:3000`.
3. Para o celular:
   - no computador, use as ferramentas do navegador (F12 › modo dispositivo, 375 × 812);
   - num celular de verdade, abra pelo endereço de rede que o `npm run dev` mostra (o celular precisa estar no mesmo Wi-Fi).
4. Todos os logins usam a senha **`demo123`**:

   | Login | Perfil | O que vê |
   |---|---|---|
   | `gestao@demo.test` | Gestão da empresa | Empresa Teste (matriz e 2 filiais, 41 pessoas) |
   | `teste@gmail.com` | Gestão da empresa | a mesma Empresa Teste |
   | `oficina@demo.test` | Gestão da empresa | Oficina Bom Motor, implantada há 12 dias, com a revisão da implantação aberta |
   | `parceiro@demo.test` | Parceiro | os 4 clientes da Conexão CX |
   | `horizonte@demo.test` | Parceiro | os 2 clientes da Contabilidade Horizonte (fictícia), com a cor própria |
   | `admin@demo.test` | Administração da plataforma | toda a plataforma |

5. **Bom saber:**
   - os dados são gerados para o dia de hoje;
   - o que você cadastra ou aprova fica só na memória e volta ao original quando o servidor reinicia ou o dia muda;
   - na demonstração, o menu do usuário tem "Ver como…", para trocar de perfil sem senha;
   - o tema claro e escuro fica no menu do usuário (e na entrada, embaixo).

---

## 1. Entrada (sem login)

- [ ] **Tela de entrada.** Abra `/entrar`. À esquerda o formulário; à direita o palco violeta com a frase, os três perfis e a prévia do Início ("Dados ilustrativos").
  - No celular: faixa violeta no alto e o formulário numa folha que sobe por cima.
- [ ] **Tema.** Troque entre Claro, Sistema e Escuro, embaixo. A prévia acompanha o tema; o violeta em volta fica igual.
- [ ] **Erro de login.** Entre com uma senha errada. Aparece "E-mail ou senha não conferem", e o e-mail continua preenchido.
- [ ] **Perdeu o acesso.** Abra "Perdeu o acesso?": o texto explica a quem pedir e mostra os contatos da Conexão CX.

Anotações:

&nbsp;

---

## 2. Gestão da empresa (`gestao@demo.test`)

### 2.1 Início e Pendências

- [ ] **Início.** Aparece a faixa violeta com:
  - "41 pessoas no quadro" e a frase do que espera você;
  - os números do negócio: custo estimado de pessoal (com a variação sobre o mês anterior), turnover em 12 meses e absenteísmo do último mês.
  - Abaixo, um quadro por assunto (Pessoas e contratos, Férias e 13º, Saúde e afastamentos, Ocorrências, Documentos, Desligamentos) e a atividade recente.
- [ ] **Faixa de urgência.** Se houver prazo vencido ou vencendo em até 2 dias, aparece uma faixa fina no topo que leva a Pendências.
- [ ] **Números levam ao detalhe.**
  - Toque em "Custo estimado de pessoal": abre a folha gerencial.
  - Toque em "Turnover": abre o indicador.
- [ ] **Pendências** (`/pendencias`):
  - aprove e rejeite um atestado na linha;
  - o item sai com a mensagem e o "Desfazer"; use o Desfazer e confira que o item volta.
- [ ] **Filtros de Pendências.** Filtre por assunto e por data, e confira que só aparece o que corresponde.
- **No celular:**
  - a barra inferior tem Início (com o número do que espera você), Pessoas, Lançar, Indicadores e Menu;
  - as aprovações têm botões grandes.

Anotações:

&nbsp;

### 2.2 Lançar (de qualquer tela)

- [ ] **Abrir.** Toque em "Lançar" (barra do topo no computador, botão do meio da barra inferior no celular). Abre "O que aconteceu?" com os tipos: Atestado ou afastamento, Férias, Ocorrência, Movimentação, Admissão, Documento, Desligamento.
- [ ] **Atestado.** Lance um atestado de 18 dias por Doença com o CID J11.
  - O formulário avisa que passa de 15 dias.
  - A confirmação diz a data do encaminhamento ao INSS.
  - "Ver na ficha" leva ao histórico da pessoa, e a situação dela vira "Afastado".
- [ ] **Erro sem perder o que foi digitado.** Numa movimentação, apague o novo salário e envie: aparece o erro na folha e os outros campos continuam preenchidos.
- [ ] **Admissão.** Preencha uma pessoa nova (o CPF precisa ser válido; o primeiro dia pode ser daqui a alguns dias).
  - A confirmação diz quando começa, o registro na véspera, as datas de 45 e 90 dias e os custos informados.
  - A pessoa aparece em Admissões, em "Começam em breve".
- [ ] **Férias.** Programe férias para alguém com dias por tirar.
  - Tente uma sexta-feira ou a véspera de um feriado: o formulário avisa que não pode começar ali.
  - Escolha uma segunda-feira e 20 dias: a prévia mostra o fim, o aviso (30 dias antes) e o pagamento (2 dias antes, no dia útil anterior), e diz que sobram 10 dias.
- [ ] **Documento.** Registre um ASO periódico: a validade é obrigatória.
- [ ] **Desligamento.** Desligue alguém e informe o exame demissional.
  - Ao escolher o último dia, o campo mostra a data da rescisão (10 dias depois, no dia útil anterior).
  - O desligamento vai para "Para concluir" em Desligamentos e em Pendências.
- **No celular:**
  - o Lançar sobe de baixo, como uma folha;
  - os campos não dão zoom ao tocar.

Anotações:

&nbsp;

### 2.3 Colaboradores e ficha

- [ ] **Lista** (`/colaboradores`):
  - busque por nome, matrícula ou CPF;
  - filtre por unidade, departamento, contrato e situação;
  - os salários aparecem mascarados; "Mostrar salários" revela a coluna.
- [ ] **Ficha.** Abra uma pessoa:
  - o resumo à esquerda (no celular, em cima), com os alertas dela e as ações rápidas (Atestado, Ocorrência, Férias, Movimentação, Desligar);
  - as abas Resumo, Contrato, Remuneração, Férias, Saúde, Ocorrências, Movimentações, Documentos e Histórico.
- [ ] **Remuneração.** O salário vem mascarado, com o olho para mostrar. "Custo estimado do mês" tem o selo "Estimativa"; toque nele para ver como a conta é feita.
- [ ] **CPF.** Na aba Resumo, o CPF vem mascarado e o olho revela.
- [ ] **Desligamento marcado.** Numa pessoa com desligamento marcado para o futuro: o resumo diz "sai em", e a ação "Desligar" não aparece.

Anotações:

&nbsp;

### 2.4 Admissões e Desligamentos

- [ ] **Admissões** (`/admissoes`):
  - "Começam em breve" mostra os passos: registro até a véspera, ASO admissional, contrato, custos;
  - "Em experiência" mostra os 45 e os 90 dias com a pílula de prazo;
  - "Últimos 12 meses" mostra o resumo dos passos e o custo informado, com "Corrigir".
- [ ] **Desligamentos** (`/desligamentos`):
  - "Para concluir": informe os custos (rescisão paga e exame) e toque em "Rescisão paga: concluir";
  - o item vai para a lista de 12 meses como "Concluído".

Anotações:

&nbsp;

### 2.5 Rotina

- [ ] **Férias** (`/ferias`):
  - os números (vencidas, vencendo em 90 dias, programadas, quadro em dia);
  - os pedidos para aprovar (aprovar e recusar na linha);
  - "Por tirar", com o dia limite e "Programar";
  - "Programadas", com aviso e pagamento;
  - "Saldo por pessoa".
- [ ] **Atestados e afastamentos** (`/afastamentos`):
  - filtre por tipo, situação e validação;
  - valide na linha;
  - "Registrar retorno" para quem está afastado.
- [ ] **Ocorrências e Movimentações:** cada registro mostra quem registrou; a movimentação mostra "passa a valer em" e o que muda.
- [ ] **Documentos** (`/documentos`):
  - os cadastros incompletos, com "Registrar";
  - sem filtro, só os documentos que vencem;
  - filtre pelo tipo "Contrato de trabalho" para ver os que não vencem.

Anotações:

&nbsp;

### 2.6 Custos

- [ ] **Folha gerencial** (`/folha`), sempre com o selo "Estimativa":
  - **Resumo do mês:** custo, fator, salários, encargos com o percentual, composição, mês a mês, por unidade e por departamento. A Diretoria, com 1 pessoa, aparece "oculto";
  - **Por colaborador:** valores mascarados, com "Mostrar valores";
  - **Provisões e 13º:** as duas parcelas, com o vencimento no dia útil anterior (em 2026, 30/11 e 18/12).
- [ ] **Competência.** Troque para um mês anterior: o subtítulo diz "no fim do mês", e os números mudam.
- [ ] **Benefícios** (`/beneficios`):
  - abra o Vale-refeição e use "Mudar valores", de 660 para 760;
  - volte à folha: os benefícios sobem 100 por pessoa com VR.
- [ ] **Benefícios › Incluir e Encerrar.** No plano de saúde, inclua alguém em "Quem não tem" e encerre alguém em "Quem tem".

Anotações:

&nbsp;

### 2.7 Indicadores

- [ ] **Central** (`/indicadores`): um cartão por tema (Custos, Quadro, Absenteísmo e saúde, Férias, Benefícios, Movimentações), com o número principal e dois de apoio. Troque o período entre 3, 6 e 12 meses.
- [ ] **Do número à pessoa.** Toque em Turnover:
  - o detalhe mostra como é calculado, o mês a mês, por unidade e por departamento e "Quem está por trás do número";
  - toque numa pessoa e caia na aba certa da ficha.
- [ ] **Privacidade (LGPD).**
  - No painel de Absenteísmo e saúde, filtre o departamento Diretoria: aparece "oculto" e a faixa de privacidade.
  - Os indicadores de saúde nunca listam pessoas.
- [ ] **Custos sem pessoas.** No painel de Custos, o detalhe não lista pessoas e explica que os valores individuais ficam na folha, mascarados.

Anotações:

&nbsp;

### 2.8 Empresa

- [ ] **Dados** (`/empresa`):
  - regime, anexo e percentual de encargos com o selo;
  - unidades e departamentos.
- [ ] **Mudar regime e encargos.** Toque em "Mudar regime e encargos", troque o anexo para IV e salve.
  - O percentual vira 36%.
  - Na folha, os encargos sobem.
  - No Histórico, aparece a mudança com o seu nome.
- [ ] **Importar planilha** (`/empresa/importar`):
  1. baixe a planilha modelo e confira as abas (Instruções, Empresa, Colaboradores ativos, Ex-colaboradores, Férias, Atestados, Reajustes, Benefícios);
  2. preencha uma linha com erros de propósito (CPF inválido, data 31/02, contrato "CLT"), suba e toque em "Conferir a planilha";
  3. a lista mostra cada erro com aba, linha, coluna e o que corrigir;
  4. corrija, suba de novo e toque em "Importar agora";
  5. a pessoa aparece em Colaboradores.
- [ ] **Usuários e Histórico.**
  - Usuários lista quem acessa como Gestão.
  - O Histórico tem busca, filtro por tipo e "de quem" leva à ficha.
- [ ] **Exportações** (`/exportacoes`): baixe os indicadores e os colaboradores em CSV e abra no Excel. As colunas ficam separadas certinhas, e não há CPF nem salário.

Anotações:

&nbsp;

### 2.9 Implantação recente (`oficina@demo.test`)

- [ ] **Revisão da implantação.** O Início mostra a faixa "Revisão da implantação". Em Pendências, os prazos de antes da implantação aparecem como "a conferir".
- [ ] **Concluir a revisão.** Confira os itens um a um e conclua: os prazos vencidos de antes passam a aparecer como vencidos, e a faixa de urgência aparece.
- [ ] **Marca do parceiro.** A Oficina é cliente da Horizonte: a cor do sistema é o verde-azulado do parceiro, não o violeta.

Anotações:

&nbsp;

---

## 3. Parceiro

### 3.1 Conexão CX (`parceiro@demo.test`)

- [ ] **Carteira** (`/carteira`):
  - os 4 clientes da Conexão CX lado a lado, com pessoas, custo estimado, fator, turnover, absenteísmo e o que pede atenção;
  - nada da Horizonte aparece.
- [ ] **Ordenar.** Use o seletor e ordene por custo, por turnover ou por nome.
- [ ] **Exportar.**
  - "Exportar CSV" baixa a carteira (abra no Excel);
  - "Para imprimir" abre a página limpa, e "Imprimir ou salvar em PDF" tira a casca.
- [ ] **Consultar um cliente.** Toque em "Consultar" na Empresa Teste.
  - O sistema mostra a faixa "Só consulta".
  - Não há Lançar, e os botões de aprovar somem.
  - O CID aparece como "Restrito" nos afastamentos.
- **No celular:**
  - a barra inferior tem Carteira, Cliente, Indicadores, Exportar e Menu;
  - a carteira vira uma lista de cartões.

Anotações:

&nbsp;

### 3.2 Contabilidade Horizonte (`horizonte@demo.test`)

- [ ] **White-label.**
  - O violeta vira verde-azulado no sistema inteiro (botões, menu, faixa do Início);
  - o pé do menu mostra o nome do parceiro no lugar da logo.
- [ ] **Isolamento.** A carteira tem só Transportes Rota Sul e Oficina Bom Motor. Nada dos clientes da Conexão CX aparece em nenhuma tela.

Anotações:

&nbsp;

---

## 4. Administração da plataforma (`admin@demo.test`)

- [ ] **Suporte** (`/admin`):
  - os números da plataforma;
  - "Pede suporte", com o que conferir em cada cliente (implantação em revisão, sem usuário da Gestão, prazos vencidos, anexo ou regime a conferir) e "Consultar".
- [ ] **Parceiros:** a marca de cada um com as amostras de cor e o resultado da checagem de contraste.
- [ ] **Clientes:** filtre por parceiro e confira regime e encargos (padrão ou configurado), implantação e suporte.
- [ ] **Usuários:** busque e filtre por perfil.
- [ ] **Consultar.** Consulte um cliente da Horizonte: a cor troca para a do parceiro. Volte ao início pelo menu.
- [ ] **Painel antigo.** Abra `/painel`: redireciona para o início do perfil.

Anotações:

&nbsp;

---

## 5. Em todas as telas

- [ ] **Celular (375px):**
  - nada rola de lado;
  - os campos não dão zoom ao tocar;
  - os botões e os nomes que levam à ficha são fáceis de tocar.
- [ ] **Tema escuro:** todas as telas ficam legíveis, e as pílulas de situação (lima, rosa, violeta, lilás) continuam claras.
- [ ] **Teclado (computador):**
  - Tab passa por tudo com o anel de foco visível;
  - Esc fecha as folhas e devolve o foco a quem abriu.
- [ ] **Estimativas:** todo valor calculado tem "estimativa" no texto ou o selo, e nada fala só em "folha".
- [ ] **Privacidade:**
  - CID só para a Gestão e a Administração;
  - salário e CPF mascarados nas listas;
  - saúde e custos ocultos em grupos com menos de 3 pessoas.

Anotações:

&nbsp;

---

## Problemas e ajustes

| # | Tela | O que fiz | O que aconteceu | O que eu esperava | Prioridade |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |
| 8 | | | | | |

Ideias e ajustes de texto:

&nbsp;
