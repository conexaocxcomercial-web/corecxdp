# core.cx — módulo DP

SaaS de departamento pessoal multiempresa da Conexão CX. Usuários: RH/DP da empresa cliente (lança tudo), gestor (aprova, muitas vezes pelo celular) e contador (só consulta). Produto, perfis, marca, terminologia e roteiro estão no [PRODUCT.md](PRODUCT.md) — leia antes de criar telas ou textos.

## Regras

- **Responder sempre em português do Brasil**, inclusive planos, resumos, textos de interface e mensagens de commit.
- **Nunca fazer commit nem push sem pedido explícito.**
- **Mostrar um plano antes de mudanças grandes** (várias telas, novo módulo, mudança na camada de dados ou no CSS global) e esperar o ok.
- **Mobile-first.** Pensar primeiro em 375px: campos com fonte ≥ 16px (abaixo disso o iOS dá zoom), alvos de toque ≥ 44px, texto ≥ 12px, nada de rolagem horizontal da página.
- Cores e fonte da marca são obrigatórias (PRODUCT.md › Brand Commitments). Usar os tokens de [app/globals.css](app/globals.css); não escrever hex solto nas telas.
- Valor calculado aparece como estimativa; alíquotas e tabelas ficam num único arquivo de configuração, nunca soltas no código.
- Fora do escopo: controle de ponto e eSocial.

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

Login de teste: `teste@gmail.com` / `demo123` (cliente `teste`). Na demonstração, cadastros e aprovações ficam só na memória e voltam ao original quando o servidor reinicia.

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

As telas internas ficam em `app/(sistema)/` (layout com barra do topo e menu lateral). Ações de servidor em [app/acoes.js](app/acoes.js). Acesso protegido por [middleware.js](middleware.js).

## Componentes (`componentes/`)

**Reutilize antes de criar.** Se precisar de algo parecido com um componente existente, estenda-o em vez de criar outro.

- `Estrutura.jsx` — `Comando` (barra do título com ações), `Wrap`, `Secao`, `Cartao`, `Kpis`/`Kpi`, `Tabela`/`LinhaTabela`/`Celula`/`Nome` (viram cartões no celular via `data-r`), `Vazio`, `Faixa` (avisos).
- `Campos.jsx` — `Texto`, `Data`, `Selecao`, `Paragrafo`.
- `Botao.jsx` — `Botao`, `BotaoLink`, `BotaoEnviar` (estado de envio), `BotaoMini`.
- `PainelDeRegistro.jsx` — janela de cadastro (modal no desktop, sobe de baixo no celular).
- `Filtros.jsx` — `Busca` e `Seletor`, ligados aos parâmetros da URL.
- `Graficos.jsx` — `Serie`, `SerieDupla`, `BarrasH`, `Rosca`.
- `Sinais.jsx` — `Status` (pílula de situação).
- `Navegacao.jsx` — menu lateral / gaveta no celular. `Tema.jsx` — tema claro/escuro.
- `Icones.jsx` — `Icone` (Material Symbols Rounded).
- `Marca.jsx` — `Marca` (nome "core.cx · módulo dp" em texto) e `Assinatura` (logos de `public/marca/`, preto ou branco conforme o tema).

## Dados (`lib/`)

- `registros.js` — **única porta de entrada das telas**: `listar*`, `buscarColaborador`, `registrar*`, `mudar*`, `OPCOES`. Já devolve tudo filtrado pela empresa da sessão.
- `indicadores.js` — cálculos puros sobre os dados (sobrevivem à migração).
- `avisos.js` — `AvisoAoUsuario` (erro com texto para a tela) e `mensagemParaTela(erro, padrao)`: qualquer outro erro vai para o log do servidor e a tela mostra o texto neutro. Telas usam isso, nunca `erro.message` direto.
- `formato.js` — datas, CPF, tempo de casa. `contexto.js` — empresa da sessão. `sessao.js` / `usuarios.js` — login e cookie.
- `planilha.js` — Google Sheets. `demo/` — modo de demonstração.

**O Google Sheets é provisório e será substituído pelo Supabase.** Nada novo deve depender dele:
- telas e componentes só importam de `lib/registros.js` (ou do módulo equivalente do novo domínio), nunca de `lib/planilha.js`;
- identificar registros pelo código/id, não pelo número da linha da planilha (hoje `linha` ainda vai em campos ocultos de atestados, movimentações e ficha — corrigir ao mexer nelas);
- textos de interface não mencionam "planilha", "aba" ou "conta de serviço";
- telas recebem datas já normalizadas, sem lidar com número de série do Sheets.

## Pendências antes do deploy

- [ ] Migrar os dados para o Supabase, com código único por registro garantido no banco (sequência/restrição `unique` por empresa, não "maior + 1" em memória), isolamento por empresa via RLS e login pelo Supabase Auth.
- [ ] Remover o modo de demonstração: apagar `lib/demo/` e as linhas que o chamam em `lib/planilha.js` (o `import * as demo` e os três `if (demo.modoDemo())`).
- [ ] Revisar o `.gitignore`: `.env*` também ignora um futuro `.env.example`; `.claude/`, `.codex/` e `.impeccable/` não estão ignorados; confirmar que `dados-demo/` (tem senhas) continua fora do git.
