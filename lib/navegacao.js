/**
 * Navegação de cada perfil num só lugar: menu lateral (computador),
 * barra inferior (celular), aba Menu e opções do Lançar.
 *
 * Itens com `disponivel: false` são de módulos que ainda não existem
 * (docs/redesenho.md › 5): ficam na lista para a ordem e os grupos já
 * estarem definidos, mas não aparecem. Ao entregar o módulo, troque para
 * `true` e acrescente o ícone em componentes/Icones.jsx.
 */

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
};

/** Grupos do menu lateral e da aba Menu, por perfil. */
const GRUPOS = {
  gestao: [
    { chave: 'visao', rotulo: null, itens: ['inicio', 'pendencias'] },
    { chave: 'pessoas', rotulo: 'Pessoas', itens: ['colaboradores', 'admissoes', 'desligamentos'] },
    {
      chave: 'rotina',
      rotulo: 'Rotina',
      itens: ['ferias', 'atestados', 'ocorrencias', 'movimentacoes', 'documentos'],
    },
    { chave: 'custos', rotulo: 'Custos', itens: ['folha', 'beneficios'] },
    { chave: 'acompanhar', rotulo: 'Acompanhar', itens: ['indicadores'] },
    { chave: 'empresa', rotulo: 'Empresa', itens: ['empresa', 'usuarios', 'importar', 'historico'] },
  ],
};

/**
 * Barra inferior do celular: cinco posições. `acao` abre uma folha em vez
 * de navegar; `ativaEm` são os caminhos que acendem a posição.
 */
const BARRA = {
  gestao: [
    { chave: 'inicio', nome: 'Início', icone: 'home', href: '/painel', contador: 'pendencias' },
    { chave: 'pessoas', nome: 'Pessoas', icone: 'group', href: '/colaboradores' },
    { chave: 'lancar', nome: 'Lançar', icone: 'add', acao: 'lancar' },
    { chave: 'indicadores', nome: 'Indicadores', icone: 'monitoring', href: '/indicadores' },
    { chave: 'menu', nome: 'Menu', icone: 'menu', acao: 'menu' },
  ],
};

/**
 * O que dá para lançar hoje, cada um abrindo o cadastro da própria tela
 * (?lancar=1). O Lançar em três passos chega na fase 8 do redesenho.
 */
const LANCAMENTOS = {
  gestao: [
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
  ],
};

const NOMES_DOS_PERFIS = { gestao: 'Gestão da empresa' };

/** Perfil da sessão → chave de navegação. Só a Gestão existe por enquanto. */
function chaveDoPerfil() {
  return 'gestao';
}

export function navegacaoDe(perfil) {
  const chave = chaveDoPerfil(perfil);
  const grupos = GRUPOS[chave]
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens
        .map((id) => ({ id, ...ITENS[id] }))
        .filter((item) => item.disponivel !== false),
    }))
    .filter((grupo) => grupo.itens.length > 0);

  return {
    perfil: NOMES_DOS_PERFIS[chave],
    grupos,
    barra: BARRA[chave],
    lancamentos: LANCAMENTOS[chave],
    podeLancar: LANCAMENTOS[chave].length > 0,
  };
}

/** A posição está ativa no caminho atual (a própria rota ou uma subrota). */
export function estaAtiva(caminho, href) {
  if (!href) return false;
  const base = href.split('?')[0];
  return caminho === base || caminho.startsWith(`${base}/`);
}
