/**
 * Navegação de cada perfil num só lugar: menu lateral (computador),
 * barra inferior (celular), aba Menu e opções do Lançar.
 *
 * Itens com `disponivel: false` são de módulos que ainda não existem
 * (docs/redesenho.md › 5): ficam na lista para a ordem e os grupos já
 * estarem definidos, mas não aparecem. Ao entregar o módulo, troque para
 * `true` e acrescente o ícone em componentes/Icones.jsx. Itens com
 * `soNaDemonstracao` são de módulos novos, que fora da demonstração ficam
 * ocultos (lá o Início continua sendo o painel).
 *
 * Módulo puro: usado no servidor e nos componentes de cliente.
 */
import { PERFIS, pode } from './permissoes.js';

export const ITENS = {
  inicio: { href: '/inicio', nome: 'Início', icone: 'home' },
  pendencias: { href: '/pendencias', nome: 'Pendências', icone: 'pending_actions', soNaDemonstracao: true },

  colaboradores: { href: '/colaboradores', nome: 'Colaboradores', icone: 'group' },
  admissoes: { href: '/admissoes', nome: 'Admissões', icone: 'person_add', soNaDemonstracao: true },
  desligamentos: { href: '/desligamentos', nome: 'Desligamentos', icone: 'person_remove', soNaDemonstracao: true },

  ferias: { href: '/ferias', nome: 'Férias', icone: 'beach_access', soNaDemonstracao: true },
  afastamentos: { href: '/afastamentos', nome: 'Atestados e afastamentos', icone: 'clinical_notes' },
  ocorrencias: { href: '/ocorrencias', nome: 'Ocorrências', icone: 'event_busy' },
  movimentacoes: { href: '/movimentacoes', nome: 'Movimentações', icone: 'swap_horiz' },
  documentos: { href: '/documentos', nome: 'Documentos', icone: 'description', disponivel: false },

  folha: { href: '/folha', nome: 'Folha gerencial', icone: 'payments', disponivel: false },
  beneficios: { href: '/beneficios', nome: 'Benefícios', icone: 'redeem', disponivel: false },

  indicadores: { href: '/indicadores', nome: 'Indicadores', icone: 'monitoring' },

  empresa: { href: '/empresa', nome: 'Dados da empresa', icone: 'apartment', disponivel: false },
  usuarios: { href: '/empresa/usuarios', nome: 'Usuários', icone: 'manage_accounts', disponivel: false },
  importar: { href: '/empresa/importar', nome: 'Importar planilha', icone: 'upload_file', disponivel: false },
  historico: { href: '/empresa/historico', nome: 'Histórico', icone: 'history', disponivel: false },

  carteira: { href: '/carteira', nome: 'Carteira', icone: 'work' },
  exportacoes: { href: '/exportacoes', nome: 'Exportações', icone: 'download', disponivel: false },

  painelAdmin: { href: '/admin', nome: 'Início', icone: 'home' },
  parceiros: { href: '/admin/parceiros', nome: 'Parceiros', icone: 'handshake', disponivel: false },
  clientes: { href: '/admin/clientes', nome: 'Clientes', icone: 'domain', disponivel: false },
  usuariosDaPlataforma: { href: '/admin/usuarios', nome: 'Usuários', icone: 'manage_accounts', disponivel: false },
};

/** Telas que mostram os registros de um cliente: sem cliente no alcance, pedem para escolher um. */
const ROTAS_DO_CLIENTE = [
  '/inicio',
  '/pendencias',
  '/painel',
  '/colaboradores',
  '/admissoes',
  '/desligamentos',
  '/ocorrencias',
  '/afastamentos',
  '/ferias',
  '/atestados',
  '/movimentacoes',
  '/indicadores',
];

/** Fora da demonstração, a tela inicial da Gestão continua sendo o painel. */
const PAINEL = '/painel';

const GRUPOS_DO_CLIENTE = [
  { chave: 'pessoas', rotulo: 'Pessoas', itens: ['colaboradores', 'admissoes', 'desligamentos'] },
  {
    chave: 'rotina',
    rotulo: 'Rotina',
    itens: ['ferias', 'afastamentos', 'ocorrencias', 'movimentacoes', 'documentos'],
  },
  { chave: 'custos', rotulo: 'Custos', itens: ['folha', 'beneficios'] },
  { chave: 'acompanhar', rotulo: 'Acompanhar', itens: ['indicadores'] },
];

/**
 * Grupos do menu lateral e da aba Menu. Parceiro e Administração veem as
 * telas do cliente (em só consulta) quando há um cliente no alcance, sem
 * Importar planilha nem Usuários da empresa.
 */
function gruposDe(perfil, temCliente) {
  if (perfil === 'parceiro' || perfil === 'admin') {
    const proprios =
      perfil === 'parceiro'
        ? [{ chave: 'carteira', rotulo: null, itens: ['carteira', 'exportacoes'] }]
        : [{ chave: 'plataforma', rotulo: null, itens: ['painelAdmin', 'parceiros', 'clientes', 'usuariosDaPlataforma'] }];
    if (!temCliente) return proprios;
    return [
      ...proprios,
      { chave: 'cliente', rotulo: 'Cliente', itens: ['inicio', 'pendencias'] },
      ...GRUPOS_DO_CLIENTE,
      { chave: 'empresa', rotulo: 'Empresa', itens: ['empresa', 'historico'] },
    ];
  }

  return [
    { chave: 'visao', rotulo: null, itens: ['inicio', 'pendencias'] },
    ...GRUPOS_DO_CLIENTE,
    { chave: 'empresa', rotulo: 'Empresa', itens: ['empresa', 'usuarios', 'importar', 'historico'] },
  ];
}

/**
 * Barra inferior do celular: até cinco posições. `acao` abre uma folha em
 * vez de navegar ('lancar', 'menu', 'alcance'); `contador` liga um número.
 * Posições de módulos que ainda não existem ficam de fora.
 */
const BARRA = {
  gestao: [
    { chave: 'inicio', nome: 'Início', icone: 'home', href: '/inicio', contador: 'pendencias' },
    { chave: 'pessoas', nome: 'Pessoas', icone: 'group', href: '/colaboradores' },
    { chave: 'lancar', nome: 'Lançar', icone: 'add', acao: 'lancar' },
    { chave: 'indicadores', nome: 'Indicadores', icone: 'monitoring', href: '/indicadores' },
    { chave: 'menu', nome: 'Menu', icone: 'menu', acao: 'menu' },
  ],
  parceiro: [
    { chave: 'carteira', nome: 'Carteira', icone: 'work', href: '/carteira' },
    { chave: 'cliente', nome: 'Cliente', icone: 'domain', href: '/inicio', semCliente: 'alcance' },
    { chave: 'indicadores', nome: 'Indicadores', icone: 'monitoring', href: '/indicadores' },
    { chave: 'exportar', nome: 'Exportar', icone: 'download', acao: 'exportar', disponivel: false },
    { chave: 'menu', nome: 'Menu', icone: 'menu', acao: 'menu' },
  ],
  admin: [
    { chave: 'inicio', nome: 'Início', icone: 'home', href: '/admin' },
    { chave: 'parceiros', nome: 'Parceiros', icone: 'handshake', href: '/admin/parceiros', disponivel: false },
    { chave: 'clientes', nome: 'Clientes', icone: 'domain', href: '/admin/clientes', disponivel: false },
    { chave: 'usuarios', nome: 'Usuários', icone: 'manage_accounts', href: '/admin/usuarios', disponivel: false },
    { chave: 'menu', nome: 'Menu', icone: 'menu', acao: 'menu' },
  ],
};

/**
 * O que dá para lançar, na ordem do primeiro passo do Lançar ("O que
 * aconteceu?"). `comPessoa`: o segundo passo pergunta com quem (a admissão
 * vai direto ao formulário, porque a pessoa ainda não existe).
 */
const LANCAMENTOS = [
  {
    chave: 'afastamento',
    nome: 'Atestado ou afastamento',
    descricao: 'Doença, acidente, licença ou outro afastamento, com o atestado quando houver.',
    icone: 'clinical_notes',
    comPessoa: true,
  },
  {
    chave: 'ferias',
    nome: 'Férias',
    descricao: 'Programar um período: início, dias e os prazos de aviso e pagamento.',
    icone: 'beach_access',
    comPessoa: true,
    soNaDemonstracao: true,
  },
  {
    chave: 'ocorrencia',
    nome: 'Ocorrência',
    descricao: 'Falta, atraso, advertência ou suspensão.',
    icone: 'event_busy',
    comPessoa: true,
  },
  {
    chave: 'movimentacao',
    nome: 'Movimentação',
    descricao: 'Reajuste, promoção, mudança de cargo ou transferência.',
    icone: 'swap_horiz',
    comPessoa: true,
  },
  {
    chave: 'admissao',
    nome: 'Admissão',
    descricao: 'Pessoa nova no quadro, com contrato, salário e os custos da admissão.',
    icone: 'person_add',
  },
  {
    chave: 'desligamento',
    nome: 'Desligamento',
    descricao: 'Último dia, tipo, motivo e os custos informados; a rescisão fica para concluir.',
    icone: 'person_remove',
    comPessoa: true,
  },
];

const INICIOS = { gestao: '/inicio', parceiro: '/carteira', admin: '/admin' };

/** Fora da demonstração todo login é Gestão, e o início é o painel. */
export function inicioDoPerfil(perfil, { demonstracao = true } = {}) {
  if (!demonstracao) return PAINEL;
  return INICIOS[perfil] || INICIOS.gestao;
}

/** O que aparece: módulo pronto e, fora da demonstração, só os módulos de antes. */
function visivel(item, demonstracao) {
  return item.disponivel !== false && (demonstracao || !item.soNaDemonstracao);
}

/** Fora da demonstração, o Início aponta para o painel. */
function noModo(item, demonstracao) {
  return !demonstracao && item.href === '/inicio' ? { ...item, href: PAINEL } : item;
}

export function navegacaoDe(perfil, { temCliente = false, demonstracao = true } = {}) {
  const chave = BARRA[perfil] ? perfil : 'gestao';
  const grupos = gruposDe(chave, temCliente)
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens
        .map((id) => ({ id, ...ITENS[id] }))
        .filter((item) => visivel(item, demonstracao))
        .map((item) => noModo(item, demonstracao)),
    }))
    .filter((grupo) => grupo.itens.length > 0);
  const podeLancar = pode(chave, 'lancar');

  return {
    perfil: PERFIS[chave],
    inicio: inicioDoPerfil(chave, { demonstracao }),
    grupos,
    barra: BARRA[chave].filter((item) => visivel(item, demonstracao)).map((item) => noModo(item, demonstracao)),
    lancamentos: podeLancar ? LANCAMENTOS.filter((item) => demonstracao || !item.soNaDemonstracao) : [],
    podeLancar,
  };
}

/** A posição está ativa no caminho atual (a própria rota ou uma subrota). */
export function estaAtiva(caminho, href) {
  if (!href) return false;
  const base = href.split('?')[0];
  return caminho === base || caminho.startsWith(`${base}/`);
}

export function precisaDeCliente(caminho) {
  return ROTAS_DO_CLIENTE.some((rota) => estaAtiva(caminho, rota));
}
