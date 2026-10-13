/**
 * Navegação de cada perfil num só lugar: menu lateral (computador),
 * barra inferior (celular), aba Menu e opções do Lançar.
 *
 * Itens com `disponivel: false` são de módulos que ainda não existem
 * (docs/redesenho.md › 5): ficam na lista para a ordem e os grupos já
 * estarem definidos, mas não aparecem. Ao entregar o módulo, troque para
 * `true` e acrescente o ícone em componentes/Icones.jsx.
 *
 * Módulo puro: usado no servidor e nos componentes de cliente.
 */
import { PERFIS, pode } from './permissoes.js';

export const ITENS = {
  inicio: { href: '/painel', nome: 'Início', icone: 'home' },
  pendencias: { href: '/pendencias', nome: 'Pendências', icone: 'pending_actions', disponivel: false },

  colaboradores: { href: '/colaboradores', nome: 'Colaboradores', icone: 'group' },
  admissoes: { href: '/admissoes', nome: 'Admissões', icone: 'person_add', disponivel: false },
  desligamentos: { href: '/desligamentos', nome: 'Desligamentos', icone: 'person_remove', disponivel: false },

  ferias: { href: '/ferias', nome: 'Férias', icone: 'beach_access', disponivel: false },
  atestados: { href: '/atestados', nome: 'Atestados', icone: 'clinical_notes' },
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
const ROTAS_DO_CLIENTE = ['/painel', '/colaboradores', '/ocorrencias', '/atestados', '/movimentacoes', '/indicadores'];

const GRUPOS_DO_CLIENTE = [
  { chave: 'pessoas', rotulo: 'Pessoas', itens: ['colaboradores', 'admissoes', 'desligamentos'] },
  {
    chave: 'rotina',
    rotulo: 'Rotina',
    itens: ['ferias', 'atestados', 'ocorrencias', 'movimentacoes', 'documentos'],
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
    { chave: 'inicio', nome: 'Início', icone: 'home', href: '/painel', contador: 'pendencias' },
    { chave: 'pessoas', nome: 'Pessoas', icone: 'group', href: '/colaboradores' },
    { chave: 'lancar', nome: 'Lançar', icone: 'add', acao: 'lancar' },
    { chave: 'indicadores', nome: 'Indicadores', icone: 'monitoring', href: '/indicadores' },
    { chave: 'menu', nome: 'Menu', icone: 'menu', acao: 'menu' },
  ],
  parceiro: [
    { chave: 'carteira', nome: 'Carteira', icone: 'work', href: '/carteira' },
    { chave: 'cliente', nome: 'Cliente', icone: 'domain', href: '/painel', semCliente: 'alcance' },
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
 * O que dá para lançar hoje, cada um abrindo o cadastro da própria tela
 * (?lancar=1). O Lançar em três passos chega na fase 8 do redesenho.
 */
const LANCAMENTOS = [
  {
    chave: 'atestado',
    nome: 'Atestado',
    descricao: 'Afastamento médico, com o link do documento.',
    icone: 'clinical_notes',
    href: '/atestados?lancar=1',
  },
  {
    chave: 'ocorrencia',
    nome: 'Ocorrência',
    descricao: 'Falta, atraso, advertência ou suspensão.',
    icone: 'event_busy',
    href: '/ocorrencias?lancar=1',
  },
  {
    chave: 'movimentacao',
    nome: 'Movimentação',
    descricao: 'Promoção, reajuste, transferência ou desligamento.',
    icone: 'swap_horiz',
    href: '/movimentacoes?lancar=1',
  },
  {
    chave: 'admissao',
    nome: 'Admissão',
    descricao: 'Cadastro de uma pessoa nova no quadro.',
    icone: 'person_add',
    href: '/colaboradores?lancar=1',
  },
];

const INICIOS = { gestao: '/painel', parceiro: '/carteira', admin: '/admin' };

export function inicioDoPerfil(perfil) {
  return INICIOS[perfil] || INICIOS.gestao;
}

const disponivel = (item) => item.disponivel !== false;

export function navegacaoDe(perfil, { temCliente = false } = {}) {
  const chave = BARRA[perfil] ? perfil : 'gestao';
  const grupos = gruposDe(chave, temCliente)
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.map((id) => ({ id, ...ITENS[id] })).filter(disponivel),
    }))
    .filter((grupo) => grupo.itens.length > 0);
  const podeLancar = pode(chave, 'lancar');

  return {
    perfil: PERFIS[chave],
    inicio: inicioDoPerfil(chave),
    grupos,
    barra: BARRA[chave].filter(disponivel),
    lancamentos: podeLancar ? LANCAMENTOS : [],
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
