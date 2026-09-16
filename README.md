# core.cx — módulo DP

Registro de pessoal em SaaS: ficha dos colaboradores, ocorrências e faltas, atestados e movimentações.
A base de dados é uma planilha do Google Sheets.

Feito em Next.js 15 (App Router), Tailwind CSS e API do Google Sheets. Publica no Vercel.

---

## O que a plataforma faz

| Tela | Endereço | Para que serve |
| --- | --- | --- |
| Painel | `/painel` | Quadro de pessoas ativas por área, pendências do dia e últimos lançamentos |
| Indicadores | `/indicadores` | Turnover, absenteísmo, evolução do quadro, reincidência e tempo de casa |
| Colaboradores | `/colaboradores` | Lista com busca e filtros, e cadastro de novas pessoas |
| Ficha | `/colaboradores/MAT001` | Dados cadastrais e todo o histórico da pessoa |
| Ocorrências | `/ocorrencias` | Faltas, atrasos e medidas disciplinares |
| Atestados | `/atestados` | Afastamentos médicos, com aprovar e rejeitar na própria linha |
| Movimentações | `/movimentacoes` | Promoções, transferências e desligamentos, com checklist |

A matrícula e os códigos de registro (`MAT004`, `OCO004`, `ATE004`, `MOV004`) são gerados
automaticamente, seguindo a sequência que já existe na planilha — e a sequência é por empresa:
cada cliente tem o próprio `MAT001`.

## Uma planilha, vários clientes

Esta versão está **sem tela de login**, para você testar. A plataforma abre direto no painel.

O recorte por cliente continua no código, só que agora vem de variável de ambiente em vez de
sessão. Cada aba da planilha pode ter uma coluna `Cliente`, e o `CLIENTE_PADRAO` diz de quem são
os dados desta instalação:

```ini
CLIENTE_PADRAO=          # vazio: mostra a planilha inteira
CLIENTE_PADRAO=conexao   # mostra só as linhas com Cliente igual a "conexao"
```

Para testar agora, deixe vazio: a coluna `Cliente` nem precisa existir e a planilha original
funciona como está.

Para atender vários clientes em produção, há dois caminhos. Um deploy por cliente no Vercel, cada
um com seu `CLIENTE_PADRAO` apontando para a mesma planilha — funciona hoje, sem código novo. Ou
devolver o login, com cada usuário carregando seu código de cliente, e um só deploy atende todos.
Me peça o login de volta quando terminar de testar.

Quando o `CLIENTE_PADRAO` está preenchido, toda linha gravada recebe o código da empresa
automaticamente, e a sequência de matrícula é por empresa: cada cliente tem o próprio `MAT001`.

---

## Passo 1 — Preparar a planilha

Crie uma planilha no Google Sheets com quatro abas, com estes nomes exatos e estes cabeçalhos
na primeira linha:

**Colaboradores**

```
Cliente | Matricula | Nome_Completo | CPF | Departamento | Cargo | Gestor_Imediato | Data_Admissao | Status
```

**Ocorrencias_Faltas**

```
Cliente | ID_Ocorrencia | Data_Registro | Matricula | Data_Falta | Tipo_Ocorrencia | Justificada | Motivo
```

**Atestados**

```
Cliente | ID_Atestado | Data_Registro | Matricula | Data_Inicio | Dias_Afastamento | CID | Anexo_URL | Status_Validacao
```

**Movimentacoes_DP**

```
Cliente | ID_Movimentacao | Data_Registro | Matricula | Tipo_Movimentacao | Data_Efetiva | Motivo | Status_Checklist
```

A coluna `Cliente` guarda um código curto, sem espaço nem acento: `conexao`, `super-show`. É esse
código que liga a linha ao `CLIENTE_PADRAO`. Se você já tem dados na planilha, acrescente a coluna e preencha
todas as linhas antes de subir — com `CLIENTE_PADRAO` preenchido, linha sem `Cliente` não aparece.
Para testar agora, nada disso é necessário: deixe `CLIENTE_PADRAO` vazio e a coluna de fora.

O jeito mais rápido é abrir o `Core_CX_DP.xlsx` no Drive e converter para Google Sheets
(Arquivo → Salvar como Planilha Google).

Guarde o **ID da planilha**: é o trecho entre `/d/` e `/edit` no endereço.

```
https://docs.google.com/spreadsheets/d/AQUI_ESTA_O_ID/edit
```

As colunas são localizadas pelo nome do cabeçalho, não pela posição. Você pode reordenar
colunas na planilha sem quebrar o sistema. Só não mude os nomes.

---

## Passo 2 — Criar o acesso do sistema à planilha

1. Entre no [Google Cloud Console](https://console.cloud.google.com) e crie um projeto.
2. Em **APIs e serviços → Biblioteca**, procure **Google Sheets API** e ative.
3. Em **APIs e serviços → Credenciais**, clique em **Criar credenciais → Conta de serviço**.
   Dê um nome (por exemplo `core-cx-dp`) e conclua.
4. Abra a conta de serviço criada, vá em **Chaves → Adicionar chave → Criar nova chave → JSON**.
   O arquivo baixa automaticamente. Dentro dele estão dois valores que você vai usar:
   `client_email` e `private_key`.
5. Volte à planilha, clique em **Compartilhar** e adicione o `client_email` da conta de serviço
   como **Editor**.

Sem o passo 5 o sistema não enxerga a planilha, mesmo com as credenciais certas.

---

---

## Passo 3 — Rodar na sua máquina

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha o `.env.local`:

```ini
GOOGLE_SHEET_ID=id_da_sua_planilha
GOOGLE_CLIENT_EMAIL=core-cx-dp@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"

CLIENTE_PADRAO=
EMPRESA_PADRAO=Conexão
```

Sobre a chave privada: copie o valor de `private_key` do JSON exatamente como está, entre aspas
duplas, com os `\n` literais. O sistema converte para quebras de linha sozinho.

O `EMPRESA_PADRAO` é só o nome que aparece na navegação.

Abra `http://localhost:3000`.

---

## Passo 4 — Subir para o GitHub

```bash
git init
git add .
git commit -m "core.cx modulo DP"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/core-cx-dp.git
git push -u origin main
```

O `.gitignore` já bloqueia `.env`, `.env.local` e `node_modules`. Nunca suba a chave privada
para o repositório.

Como não há login, quem tiver o endereço do deploy vê os dados. Para testar, use uma planilha
fictícia; antes de entregar a um cliente, peça o login de volta.

---

## Passo 5 — Publicar no Vercel

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
2. O Vercel detecta Next.js sozinho. Não mexa em build command nem output directory.
3. Antes de clicar em **Deploy**, abra **Environment Variables** e cadastre as variáveis do
   `.env.local`, uma a uma, marcando Production, Preview e Development.
4. Deploy.

Ao colar a `GOOGLE_PRIVATE_KEY` no Vercel, cole o valor entre aspas duplas, igual ao do arquivo
local. Se alterar qualquer variável depois, é preciso fazer um novo deploy para valer.

---

## Estrutura do código

```
app/
  acoes.js                      ações de servidor: gravar e atualizar registros
  layout.js                     tipografia e metadados
  (sistema)/
    layout.js                   navegação das telas internas
    painel/                     quadro de pessoal, pendências e lançamentos
    indicadores/                turnover, absenteísmo, quadro e distribuições
    colaboradores/              lista, cadastro e ficha individual
    ocorrencias/
    atestados/
    movimentacoes/
componentes/                    marca, carimbo, tabelas, campos, filtros, painel lateral
lib/
  planilha.js                   conversa com a API do Google Sheets
  contexto.js                   de qual cliente são os dados desta instalação
  registros.js                  leitura e escrita dos quatro livros, já filtrados
  indicadores.js                cálculo de turnover, absenteísmo e séries mensais
  formato.js                    datas, CPF, tempo de casa
```

---

## Identidade e interface

O módulo segue o sistema visual do core.cx, os mesmos tokens das telas de Quadros e do painel
Comercial:

| | Valor |
| --- | --- |
| Mesa | `#EFEFF3` |
| Papel | `#FFFFFF` / `#F7F7F9` |
| Linhas | `#E4E4EA` / `#D3D3DC` |
| Tinta | `#17171A` / `#56565F` / `#7C7C88` |
| Ação | `#6C5CE7`, fraco `#F1EFFE` |
| Estados | ok `#0E9F6E`, atenção `#C2660B`, crítico `#D42F2F`, azul `#1A5FA0` |
| Raios | card 12px, controle 9px, pílula 999px |
| Elevação | `e1`, `e2`, `e-pop`, sempre com anel de borda |

Tipografia Inter, com IBM Plex Mono em tudo que é número (classe `.num`, com algarismos de largura
fixa). Ícones em Material Symbols Rounded.

**Estrutura de tela.** Barra do topo de 56px com a marca, barra de comando de 56px com o título da
página, contador e ações à direita, e o conteúdo num `wrap` de 1280px. Seções levam rótulo em caixa
alta com fio ao lado, como nas outras telas.

**Sidebar.** Rail de 60px que expande sobrepondo no hover e fixa no botão, empurrando o conteúdo
via `--cx-sb-w`. O que some no estreito usa `display:none`, nunca `opacity:0`. No toque vira gaveta
com hambúrguer e véu.

**No celular.** As tabelas viram cartões pelo mesmo mecanismo do core.cx: cada célula carrega
`data-r` com o rótulo da coluna, que reaparece acima do valor. Os KPIs ficam dois por linha, o
gráfico de série rola na horizontal e o valor vem impresso acima da barra, porque num toque não
existe passar o mouse.

**Claro e escuro.** As cores são variáveis CSS. O tema claro é exatamente o do core.cx; o escuro
reescreve os mesmos tokens. Nenhuma classe de componente muda entre os dois. A escolha é guardada
no navegador e aplicada antes da primeira pintura.

## Decisões que valem conhecer

**Datas.** A leitura pede número de série ao Google e converte aqui. Assim as datas não quebram
se o idioma da planilha mudar. A gravação usa formato ISO (`2026-09-14`), que o Sheets reconhece
em qualquer configuração regional. Se quiser ver `14/09/2026` na planilha, formate a coluna como
data — o sistema continua lendo certo.

**Colunas.** São encontradas pelo nome no cabeçalho. Reordenar não quebra; renomear sim.

**Acesso.** Esta versão não tem login: serve para testar. Antes de qualquer uso real, é preciso
devolver a autenticação.

**Dados sensíveis.** CPF e CID ficam na planilha, sob as permissões que você definir no Drive.
Quem tem acesso à planilha vê tudo, independentemente do que a plataforma mostra.

---

## Quando algo não funciona

| O que aparece | O que resolve |
| --- | --- |
| "A conta de serviço não tem acesso à planilha" | Compartilhe a planilha com o `client_email` como Editor |
| "Uma das abas não foi encontrada" | Confira os nomes das abas, sem acento e com underline |
| "A conexão com a planilha não está configurada" | Falta `GOOGLE_CLIENT_EMAIL` ou `GOOGLE_PRIVATE_KEY` |
| "A aba X ainda não tem a coluna Cliente" | Acrescente a coluna, ou deixe `CLIENTE_PADRAO` vazio |
| Abre e não mostra nada | O código em `CLIENTE_PADRAO` não bate com o da coluna `Cliente` |
| Erro de chave inválida no deploy | A `GOOGLE_PRIVATE_KEY` perdeu os `\n`. Cole de novo entre aspas |
