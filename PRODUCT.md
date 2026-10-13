# Product

<!-- impeccable:product-schema 1 -->

> A definição oficial do produto está em [docs/conceito.md](docs/conceito.md). Este arquivo resume o que orienta telas e textos e aponta para lá nos detalhes; em caso de conflito, vale o conceito.

## Platform

web

Web responsiva, mobile-first: todos os perfis usam pelo celular, exceto o Parceiro, que usa principalmente no computador. Sem PWA nem app nativo hoje.

## Users

Plataforma de DP para pequenas e médias empresas, de qualquer segmento, com ou sem RH interno, vendida por **parceiros** (Conexão CX, para os clientes do RH Estratégico, e contabilidades, em white-label). Hierarquia: plataforma → parceiro → cliente → CNPJs (matriz, filiais, grupo econômico).

Quatro perfis — tabela completa e regras em [docs/conceito.md › 3](docs/conceito.md#3-perfis-e-permissões):

- **Gestão da empresa** (dono e RH interno, mesmo acesso) — usuário principal. Cadastra, lança, aprova e gerencia os usuários da empresa, em todos os CNPJs do cliente. Uso pontual para aprovar e mensal para acompanhar, quase sempre no celular.
- **Parceiro** (contabilidade ou Conexão CX como consultoria) — consulta, acompanha indicadores e exporta relatórios dos próprios clientes, um a um ou consolidado. Não lança nem aprova. Usa mais no computador.
- **Administração da plataforma** (Conexão CX) — vê tudo, mas só administra e dá suporte: cria parceiros, empresas e usuários.
- **Colaborador** — *fase 2; ainda não existe.* Só os próprios dados: envia atestado, pede férias, consulta o cadastro. Sem holerite.

Não existem os perfis "gestor" nem "contador" separados: quem aprova é a Gestão da empresa, e a contabilidade entra como Parceiro. Um gestor de área (só a própria equipe) pode surgir no futuro, sem redesenho.

## Product Purpose

Todas as informações de departamento pessoal num lugar só, **fáceis de encontrar e de entender**, com foco em custos, indicadores e alertas de prazo. Módulos em [docs/conceito.md › 5](docs/conceito.md#5-escopo).

A plataforma é autossuficiente: tudo é cadastrado nela (formulário a formulário ou por upload da planilha modelo), e a folha gerencial nasce do cadastro. Todo dado coletado vira indicador, com prioridade para o que envolve custo ([docs/conceito.md › 8](docs/conceito.md#8-indicadores)). A Gestão da empresa recebe alertas automáticos de prazo legal ([docs/conceito.md › 6](docs/conceito.md#6-aprovações-e-alertas)).

Sucesso: a Gestão da empresa lança e aprova rápido, sem erro e pelo celular, e não perde prazo; o parceiro acompanha os clientes sem precisar pedir informação.

## Positioning

Uma plataforma só, vendida por parceiros, cada um com a própria identidade (white-label). Foco declarado: DP simples de encontrar e entender, com custos, indicadores e alertas de prazo. Além disso, o diferencial competitivo frente a outros sistemas de DP não foi definido; não inventar.

## Operating Context

- Isolamento em dois níveis: um parceiro nunca vê os clientes de outro parceiro; uma empresa só vê os próprios CNPJs. Os dados podem ser vistos por CNPJ ou consolidados, dentro do que o perfil alcança. O recorte vem da sessão; hoje, um usuário com `Cliente = '*'` enxerga todos (equivale à Administração da plataforma).
- Aprovações acontecem só dentro da empresa. A contabilidade não recebe avisos nem solicitações.
- Toda ação relevante fica registrada com autor e data.
- Valores calculados são estimativas para gestão. O cálculo oficial de folha, encargos e rescisão é da contabilidade.
- Dados de saúde e pessoais seguem as regras de LGPD de [docs/conceito.md › 9](docs/conceito.md#9-regras-de-privacidade-lgpd): CID individual só para Gestão da empresa e Administração, indicadores de saúde sempre agregados e ocultos em grupos com menos de 3 pessoas, salário/CPF/dados bancários mascarados nas listas.
- Escala esperada: de dezenas a cerca de 500 clientes em 12 meses. Suporte aos clientes finais pela Conexão CX.

## Capabilities and Constraints

**Existe hoje:**
- Login por e-mail e senha, sessão JWT de 10 h.
- Painel (pessoas ativas por área, pendências, últimos lançamentos), Indicadores, Colaboradores (lista, busca, filtros, cadastro e ficha por matrícula), Ocorrências, Atestados (aprovar/rejeitar na linha) e Movimentações (com checklist).
- Códigos sequenciais por cliente: `MAT001`, `OCO001`, `ATE001`, `MOV001`.
- Tema claro e escuro; tabelas viram lista no celular; navegação por barra inferior no celular e menu lateral no computador.
- Perfis Gestão da empresa, Parceiro e Administração com permissões, alcance parceiro → cliente → CNPJ e CID restrito ao Parceiro (no modo de demonstração; fora dela, todo login é Gestão da empresa).
- Dados em Google Sheets (API v4, conta de serviço). Stack: Next.js 15 (App Router), React 19, JavaScript, Tailwind 3.4. Deploy na Vercel.

**Ainda não existe e o conceito exige:** perfis, parceiros e vários CNPJs fora do modo de demonstração, white-label (cores e logo do parceiro), upload da planilha modelo (aceitando ex-colaboradores dos últimos 12 meses), documentos com validade, alertas de prazo, registro de autoria, e os módulos de folha gerencial, férias, 13º, benefícios, encargos e custos admissionais e demissionais. Dados obrigatórios de cada cadastro em [docs/conceito.md › 4](docs/conceito.md#4-como-os-dados-funcionam); ficha do colaborador em [› 7](docs/conceito.md#7-ficha-do-colaborador); tela inicial por perfil em [› 10](docs/conceito.md#10-tela-inicial-por-perfil).

**Cálculos:**
- Todo valor calculado é estimativa e aparece identificado como tal. Chamar de **"custo estimado de pessoal"** ou **"folha gerencial"**, nunca só "folha".
- Alíquotas e tabelas (INSS, FGTS, IRRF etc.) ficam em um único arquivo de configuração, fácil de atualizar. Nunca valores soltos no código nem inventados: usar as tabelas vigentes e informar a fonte.
- Os encargos dependem do regime tributário (Simples Nacional, Lucro Presumido ou Lucro Real), cadastrado por empresa.

**Fora do escopo:** controle de ponto, eSocial, integração com sistemas de contabilidade, holerite e cálculo oficial de folha. Não criar telas, rotas, menus nem modelos de dados para eles.

**Banco de dados:** o Google Sheets é provisório. Antes do lançamento, os dados migram para o Supabase, já com a hierarquia parceiro → cliente → CNPJ.

**Em aberto:**
- Marca final (core.cx é nome provisório; decisão depois da apresentação à contabilidade parceira).
- Diferencial competitivo.

**Terminologia:**
- Perfis: Administração da plataforma, Parceiro, Gestão da empresa, Colaborador.
- Em uso: registro de pessoal, quadro hoje, pessoas ativas, matrícula, gestor imediato (campo do colaborador, não perfil), situação, validação, passa a valer em, tempo de casa, custo estimado de pessoal, folha gerencial.
- Status do colaborador: Ativo, Afastado, Férias, Inativo. Tipos de ocorrência: Falta Injustificada, Falta Justificada, Atraso, Saída Antecipada, Advertência, Suspensão. Tipos de movimentação: Promoção, Alteração Salarial, Transferência, Mudança de Cargo, Afastamento, Retorno de Afastamento, Desligamento. Tipos de contrato: indeterminado, experiência, estágio, aprendiz, temporário.

## Brand Commitments

- **Nome:** core.cx (provisório), com o subtítulo "módulo dp". Assinatura: "Uma solução cx de RH Estratégico". Empresa: Conexão CX.
- **White-label:** cada parceiro pode ter logo e cores próprios. A marca core.cx é a padrão do primeiro lançamento, mas nada de marca pode ficar fixo nas telas: textos e contatos saem de `lib/marca.js`, cores dos tokens `--marca-*` e logos de `public/marca/`.
- **Tom:** premium, sóbrio e confiável.
- **Cores obrigatórias da marca core.cx:** `#7371ff` (primária), `#dbbfff`, `#bef533`, `#ff43c0`, `#1e1e1e`, `#000000`, `#ffffff`, `#f4f4f4`.
- **Fonte obrigatória:** Helvetica — stack `"Helvetica Neue", Helvetica, Arial, sans-serif`.
- Cores e fonte da marca são vinculantes e têm prioridade sobre qualquer recomendação genérica de design. Na interface, as 8 cores ficam em `--marca-*` no `app/globals.css`; tons intermediários saem de `color-mix()` entre elas. Situações usam só a paleta: lima resolve, escura espera, rosa recusa, violeta em curso, lilás férias.
- **Assets:** `public/marca/` (logos Conexão CX e CX RH Estratégico, versões branca e preta — usados via `Assinatura` em `componentes/Marca.jsx`) e `app/icon.svg` ("cx" em `#7371FF` sobre `#1E1E1E`).
- Idioma: português do Brasil.

## Evidence on Hand

- `docs/conceito.md`: definição oficial do produto.
- `dados-demo/Core_CX_DP.xlsx`: dados fictícios (15 pessoas, 18 ocorrências, 11 atestados, 10 movimentações, mar–set/2026, um único cliente com dados: `teste`). Fora do git.
- `lib/demo/gerador.js`: dados fictícios do modo de demonstração (`MODO_DEMO=1`), gerados para o dia de hoje: 2 parceiros (um fictício), 6 clientes, um com matriz e 2 filiais, 18 meses de histórico. Logins de teste em `lib/demo/dados/usuarios.json`, senha `demo123`.
- Não há depoimentos, clientes citáveis, cases, métricas de resultado, preços nem landing page. Não fabricar nenhum desses.

## Product Principles

1. **Cada perfil vê o que precisa decidir.** A Gestão da empresa lança, aprova e acompanha; o parceiro acompanha e exporta; a administração dá suporte. Tela inicial começa pelo que pede ação, depois prazos, depois como está o negócio.
2. **Fácil de encontrar e de entender.** Indicadores em camadas — essencial na tela inicial, painel por tema, detalhe até o colaborador — e a ficha reúne tudo sobre uma pessoa num lugar só.
3. **Celular é o lugar de trabalho, não a versão reduzida.** Lançar e aprovar precisam ser completos e rápidos no celular.
4. **Confiança antes de tudo.** Dado de pessoal impacta folha e pessoas: estados, autoria e datas de vigência ficam sempre claros; nada se perde em silêncio; prazo legal não passa sem alerta. Estimativa nunca se passa por valor oficial.
5. **Isolamento e privacidade são inegociáveis.** Ninguém vê dados fora do próprio alcance (parceiro só os próprios clientes, empresa só os próprios CNPJs), e dado de saúde segue as regras de LGPD.
6. **Crescer para DP completo sem perder a leveza.** Novos módulos entram no mesmo vocabulário e ritmo dos atuais.

## Accessibility & Inclusion

Sem norma específica definida. Base atual: `lang="pt-BR"`, foco visível, `prefers-reduced-motion`, diálogos com `aria-modal`. Usuários não técnicos e uso em celular, muitas vezes com uma mão, exigem alvos de toque generosos e contraste firme em ambos os temas.
