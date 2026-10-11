# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Web responsiva, mobile-first. Sem PWA nem app nativo hoje.

## Users

SaaS de departamento pessoal usado por empresas clientes. Cada empresa opera os próprios dados; a Conexão CX dá suporte e não opera pelos clientes.

Permissões por perfil (proposta inicial):

- **RH/DP da empresa cliente** — usuário principal. Cria, edita e lança tudo da própria empresa: colaboradores, ocorrências, atestados, movimentações, folha, férias, 13º e benefícios. Trabalha no computador e no celular.
- **Gestor** — vê a própria equipe e aprova ou recusa solicitações, como férias, muitas vezes pelo celular, entre uma tarefa e outra.
- **Contador** — só consulta, sem editar. Confere movimentações, afastamentos, folha, encargos e provisões.
- **Colaborador** — *Planejado; ainda não existe no produto.*

## Product Purpose

Concentrar todas as informações de departamento pessoal de cada empresa em um só lugar:

- Colaboradores, admissões, desligamentos, ocorrências, atestados e movimentações.
- Folha de pagamento: salários, proventos e descontos.
- Férias: programação, pagamento e provisão mensal.
- 13º salário: pagamento e provisão mensal.
- Benefícios: vale-alimentação, vale-refeição e outros.
- Encargos e impostos sobre a folha, como FGTS e INSS.
- Custos admissionais e demissionais, incluindo estimativa de rescisão.

A partir desses lançamentos, o produto gera indicadores de RH (turnover, absenteísmo, evolução do quadro, reincidência, tempo de casa) e estimativas de custo de pessoal para gestão. Sucesso: o RH lança rápido e sem erro, o gestor decide sem abrir o computador, e o contador recebe informação confiável.

## Positioning

*Em aberto.* Hoje o produto se apresenta como "core.cx — módulo DP", "uma solução cx de RH Estratégico" da Conexão CX. O diferencial competitivo frente a outros sistemas de DP ainda não foi definido; não inventar.

## Operating Context

- Uso multi-empresa: cada empresa cliente vê só os próprios dados; o recorte vem da sessão. Um usuário com `Cliente = '*'` enxerga todos (uso interno).
- Lançamentos acontecem no fluxo de trabalho do RH, muitas vezes no celular; aprovações do gestor acontecem fora da mesa.
- Os valores calculados pelo produto são estimativas para gestão. O valor oficial de folha, encargos e rescisão continua sendo o da contabilidade.

## Capabilities and Constraints

**Existe hoje:**
- Login por e-mail e senha, sessão JWT de 10 h.
- Painel (pessoas ativas por área, pendências, últimos lançamentos), Indicadores, Colaboradores (lista, busca, filtros, cadastro e ficha por matrícula), Ocorrências, Atestados (aprovar/rejeitar na linha) e Movimentações (com checklist).
- Códigos sequenciais por cliente: `MAT001`, `OCO001`, `ATE001`, `MOV001`.
- Tema claro e escuro; tabelas viram cartões no celular; navegação lateral vira gaveta.
- Dados em Google Sheets (API v4, conta de serviço). Stack: Next.js 15 (App Router), React 19, JavaScript, Tailwind 3.4. Deploy na Vercel.

**Roteiro confirmado:** folha de pagamento, férias (programação, pagamento e provisão), 13º (pagamento e provisão), benefícios, encargos e impostos sobre a folha, e custos admissionais e demissionais com estimativa de rescisão.

**Cálculos:**
- Todo valor calculado é estimativa para gestão e aparece identificado como estimativa na interface. O valor oficial é o da contabilidade.
- Alíquotas e tabelas (INSS, FGTS, IRRF etc.) ficam em um único arquivo de configuração, fácil de atualizar quando mudarem. Nunca escrever valores de alíquota soltos no código nem inventar valores: usar as tabelas vigentes e informar a fonte.
- Os encargos dependem do regime tributário da empresa (Simples Nacional, Lucro Presumido ou Lucro Real), que precisa estar cadastrado por empresa.

**Fora do escopo:** controle de ponto e eSocial. Não criar telas, rotas, menus nem modelos de dados para eles.

**Banco de dados:** o Google Sheets é provisório. Antes do lançamento, os dados migram para o Supabase.

**Em aberto:**
- Permissões por perfil: a proposta inicial está em Users, mas a coluna `Perfil` existe e nenhuma tela a usa ainda.
- Acesso do colaborador.

**Terminologia em uso:** registro de pessoal, quadro hoje, pessoas ativas, matrícula, gestor imediato, situação, validação, passa a valer em, tempo de casa. Status do colaborador: Ativo, Afastado, Férias, Inativo. Tipos de ocorrência: Falta Injustificada, Falta Justificada, Atraso, Saída Antecipada, Advertência, Suspensão. Tipos de movimentação: Promoção, Alteração Salarial, Transferência, Mudança de Cargo, Afastamento, Retorno de Afastamento, Desligamento.

## Brand Commitments

- **Nome:** core.cx, com o subtítulo "módulo dp". Assinatura: "Uma solução cx de RH Estratégico". Empresa: Conexão CX.
- **Tom:** premium, sóbrio e confiável.
- **Cores obrigatórias da marca:** `#7371ff` (primária), `#dbbfff`, `#bef533`, `#ff43c0`, `#1e1e1e`, `#000000`, `#ffffff`, `#f4f4f4`.
- **Fonte obrigatória:** Helvetica — stack `"Helvetica Neue", Helvetica, Arial, sans-serif`.
- Cores e fonte da marca são vinculantes e têm prioridade sobre qualquer recomendação genérica de design. Na interface, as 8 cores ficam em `--marca-*` no `app/globals.css`; tons intermediários saem de `color-mix()` entre elas. Situações usam só a paleta: lima resolve, escura espera, rosa recusa, violeta em curso, lilás férias.
- **Assets:** `public/marca/` (logos Conexão CX e CX RH Estratégico, versões branca e preta — usados via `Assinatura` em `componentes/Marca.jsx`) e `app/icon.svg` ("cx" em `#7371FF` sobre `#1E1E1E`).
- Idioma: português do Brasil.

## Evidence on Hand

- `dados-demo/Core_CX_DP.xlsx`: dados fictícios (15 pessoas, 18 ocorrências, 11 atestados, 10 movimentações, mar–set/2026, um único cliente com dados: `teste`). Fora do git.
- `lib/demo/dados/*.json`: os mesmos dados convertidos para o modo de demonstração (`MODO_DEMO=1`), com um único usuário, do cliente `teste`, e senha `demo123`.
- Não há depoimentos, clientes citáveis, cases, métricas de resultado, preços nem landing page. Não fabricar nenhum desses.

## Product Principles

1. **Cada perfil vê o que precisa decidir.** RH lança, gestor aprova, contador confere — a interface serve a tarefa de cada um, não um painel genérico.
2. **Celular é o lugar de trabalho, não a versão reduzida.** Lançar e aprovar precisam ser completos e rápidos no celular.
3. **Confiança antes de tudo.** Dado de pessoal impacta folha e pessoas: estados, autoria e datas de vigência ficam sempre claros; nada se perde em silêncio. Estimativa nunca se passa por valor oficial.
4. **Isolamento entre empresas é inegociável.** Nenhuma tela mistura dados de clientes diferentes.
5. **Crescer para DP completo sem perder a leveza.** Novos módulos (folha, férias, 13º, benefícios, encargos) entram no mesmo vocabulário e ritmo dos atuais.

## Accessibility & Inclusion

Sem norma específica definida. Base atual: `lang="pt-BR"`, foco visível, `prefers-reduced-motion`, diálogos com `aria-modal`. Usuários não técnicos e uso em celular, muitas vezes com uma mão, exigem alvos de toque generosos e contraste firme em ambos os temas.
