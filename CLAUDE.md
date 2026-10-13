# core.cx — módulo DP

Plataforma de departamento pessoal para pequenas e médias empresas, vendida por parceiros (Conexão CX e contabilidades, em white-label). Perfis: Gestão da empresa (lança e aprova), Parceiro (só consulta e exporta), Administração da plataforma (suporte) e, na fase 2, Colaborador. A definição oficial é [docs/conceito.md](docs/conceito.md); o resumo para telas e textos, com marca e terminologia, está no [PRODUCT.md](PRODUCT.md) — leia antes de criar telas ou textos.

## Regras

- **Responder sempre em português do Brasil**, inclusive planos, resumos, textos de interface e mensagens de commit.
- **Nunca fazer commit nem push sem pedido explícito.**
- **Mostrar um plano antes de mudanças grandes** (várias telas, novo módulo, mudança na camada de dados ou no CSS global) e esperar o ok.
- **Mobile-first.** Pensar primeiro em 375px: campos com fonte ≥ 16px (abaixo disso o iOS dá zoom), alvos de toque ≥ 44px, texto ≥ 12px, nada de rolagem horizontal da página.
- Cores e fonte da marca são obrigatórias (PRODUCT.md › Brand Commitments). Usar os tokens de [app/globals.css](app/globals.css); não escrever hex solto nas telas.
- Nada de marca fixo nas telas (white-label): textos e contatos de [lib/marca.js](lib/marca.js), cores dos tokens `--marca-*`, logos de `public/marca/`.
- Valor calculado aparece como estimativa ("custo estimado de pessoal" ou "folha gerencial", nunca só "folha"); alíquotas e tabelas ficam num único arquivo de configuração, nunca soltas no código.
- Privacidade (LGPD): CID individual só para Gestão da empresa e Administração; indicadores de saúde sempre agregados e ocultos em grupos com menos de 3 pessoas; salário, CPF e dados bancários mascarados nas listas. Detalhes em [docs/conceito.md › 9](docs/conceito.md#9-regras-de-privacidade-lgpd).
- Fora do escopo: controle de ponto, eSocial, integração com sistemas de contabilidade, holerite e cálculo oficial de folha.

## Stack e como rodar

Next.js 15 (App Router), React 19, JavaScript (sem TypeScript), Tailwind 3.4 + classes globais em `app/globals.css`. Deploy na Vercel.

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` para o **modo de demonstração** (dados fictícios em memória, sem Google Sheets):

```ini
MODO_DEMO=1
AUTH_SECRET=qualquer_texto_longo_aleatorio
```

Logins de teste, todos com a senha `demo123`: `teste@gmail.com` e `gestao@demo.test` (Gestão da Empresa Teste, que tem matriz e 2 filiais), `parceiro@demo.test` (Conexão CX), `horizonte@demo.test` (Contabilidade Horizonte, fictícia) e `admin@demo.test` (Administração). Na demonstração, "Ver como…" no menu do usuário troca de perfil sem senha. Os dados são gerados por `lib/demo/gerador.js` para o dia de hoje; cadastros e aprovações ficam só na memória e voltam ao original quando o servidor reinicia ou o dia muda.

## Telas e rotas

| Rota | Tela |
|---|---|
| `/entrar` | Login por e-mail e senha |
| `/painel` | Quadro de ativos, pendências do DP, séries de 6 meses e últimos lançamentos |
| `/indicadores` | Turnover, absenteísmo, quadro, reincidência e tempo de casa (3, 6 ou 12 meses) |
| `/colaboradores` | Lista com busca e filtros, cadastro de pessoa |
| `/colaboradores/[matricula]` | Ficha: dados, situação e histórico da pessoa |
| `/ocorrencias` | Faltas, atrasos e medidas disciplinares |
| `/atestados` | Afastamentos médicos, com aprovar e rejeitar na linha |
| `/movimentacoes` | Promoções, transferências, desligamentos, com checklist |
| `/carteira` | Parceiro: clientes do parceiro e "Consultar" (só na demonstração, versão inicial) |
| `/admin` | Administração: parceiros, clientes, usuários e "Consultar" (só na demonstração, versão inicial) |

As telas internas ficam em `app/(sistema)/` (layout com barra do topo, menu lateral no computador e barra inferior no celular). Ações de servidor em [app/acoes.js](app/acoes.js). Acesso protegido por [middleware.js](middleware.js), que também passa a rota ao layout (`x-caminho`). O andamento do redesenho e as decisões de cada fase ficam em [docs/redesenho.md](docs/redesenho.md).

## Componentes (`componentes/`)

**Reutilize antes de criar.** Se precisar de algo parecido com um componente existente, estenda-o em vez de criar outro.

- `Estrutura.jsx` — `Cabecalho` (título da página com subtítulo, ações, `voltar` e filtros como filhos; o título vai para a barra do topo ao rolar), `Wrap`, `Secao`, `Cartao`, `Numeros`/`Numero` (tom, link e variação), `Tabela`/`LinhaTabela`/`Celula`/`Nome` (viram lista no celular via `data-r`), `Vazio`, `Faixa` (avisos). `Kpis`/`Kpi` só existem para a prévia da entrada (até a fase 16).
- `Campos.jsx` — `Texto`, `Senha`, `Caixa`, `Data`, `Selecao`, `Paragrafo`.
- `Botao.jsx` — `Botao`, `BotaoLink`, `BotaoEnviar` (estado de envio, `variante`), `BotaoMini`.
- `Folha.jsx` — tudo o que abre por cima (`<dialog>`): janela no computador, folha que sobe de baixo no celular, `tipo="popover"` para o menu do usuário.
- `PainelDeRegistro.jsx` — cadastro numa `Folha`; `abrirAoCarregar` abre pelo `?lancar=1`.
- `Filtros.jsx` — `Busca` e `Seletor` (parâmetros da URL) e o alcance: `SeletorDeAlcance`, `FolhaDoAlcance`, `useAplicarAlcance`.
- `Graficos.jsx` — `Serie`, `SerieDupla`, `BarrasH`, `Rosca`.
- `Sinais.jsx` — `Status` (pílula de situação).
- `Navegacao.jsx` — menu lateral (computador). `BarraInferior.jsx` — navegação do celular. `Lancar.jsx` — folha "O que aconteceu?". `MenuDoUsuario.jsx` — menu do avatar e aba Menu. `BuscaDePessoa.jsx` — busca da barra do topo. `EscolhaDeCliente.jsx` — escolha de cliente e `TabelaDeClientes`. `TituloNaBarra.jsx` — título na barra do topo. `Tema.jsx` — tema claro/escuro.
- `Icones.jsx` — `Icone` (Material Symbols Rounded).
- `Marca.jsx` — `Marca` (nome "core.cx · módulo dp" em texto) e `Assinatura` (logos de `public/marca/`, preto ou branco conforme o tema).

## Dados (`lib/`)

- `registros.js` — **porta de entrada das telas atuais**: `listar*`, `buscarColaborador`, `registrar*`, `mudar*`, `contarPendencias`, `resumirClientes`, `OPCOES`. Já devolve tudo recortado pelo alcance (cliente e CNPJ) e confere a permissão antes de gravar.
- `dados/` — camada nova, no formato pensado para o Supabase: `regras.js` (alcance e recorte, puros e testados), `estrutura.js` (parceiros → clientes → CNPJs), `alcance.js` (`alcanceAtual`, `resumoDoAlcance`, `permissoesAtuais`; cookie de escolha sempre revalidado no servidor), `usuarios.js`. Os módulos novos ganham repositório aqui.
- `permissoes.js` — `pode(perfil, ação)` e os perfis. `navegacao.js` — o que cada perfil vê no menu, na barra inferior e no Lançar (arquivo único).
- `indicadores.js` — cálculos puros sobre os dados (sobrevivem à migração).
- `avisos.js` — `AvisoAoUsuario` (erro com texto para a tela) e `mensagemParaTela(erro, padrao)`: qualquer outro erro vai para o log do servidor e a tela mostra o texto neutro. Telas usam isso, nunca `erro.message` direto.
- `formato.js` — datas, CPF, tempo de casa. `contexto.js` — empresa da sessão. `sessao.js` / `usuarios.js` — login e cookie.
- `planilha.js` — Google Sheets. `demo/` — modo de demonstração (`gerador.js` gera os dados fictícios; `fonte.js` os serve no lugar do Sheets).
- Testes: `npm test` (`node --test`, sem dependência) roda `testes/` (isolamento, alcance, permissões e dados de demonstração). Módulos testados só usam import relativo com `.js`.

**O Google Sheets é provisório e será substituído pelo Supabase.** Nada novo deve depender dele:
- telas e componentes só importam de `lib/registros.js` (ou do módulo equivalente do novo domínio), nunca de `lib/planilha.js`;
- identificar registros pelo código/id, não pelo número da linha da planilha (hoje `linha` ainda vai em campos ocultos de atestados, movimentações e ficha — corrigir ao mexer nelas);
- textos de interface não mencionam "aba" nem "conta de serviço", nem "planilha" como lugar onde os dados ficam (a única planilha que aparece para o usuário é a planilha modelo de importação);
- telas recebem datas já normalizadas, sem lidar com número de série do Sheets.

## Pendências antes do deploy

- [ ] Migrar os dados para o Supabase, com código único por registro garantido no banco (sequência/restrição `unique` por empresa, não "maior + 1" em memória), login pelo Supabase Auth e isolamento via RLS na hierarquia parceiro → cliente → CNPJ, com os quatro perfis de [docs/conceito.md › 3](docs/conceito.md#3-perfis-e-permissões) e registro de autor e data nas ações.
- [x] Trocar os textos de perfil da tela de entrada ([lib/marca.js](lib/marca.js) › `perfis`), feito na fase 2 do redesenho.
- [ ] Remover o modo de demonstração: apagar `lib/demo/` e as linhas que o chamam em `lib/planilha.js` (o `import * as demo` e os três `if (demo.modoDemo())`) e em `lib/dados/estrutura.js`; os logins de teste e "Ver como…" saem junto, e `/carteira` e `/admin` passam a ler do Supabase.
- [ ] Revisar o `.gitignore`: `.env*` também ignora um futuro `.env.example`; `.claude/` e `.impeccable/` não estão ignorados (`.codex/` já está); confirmar que `dados-demo/` (tem senhas) continua fora do git.
