/**
 * Perfis e permissões (docs/conceito.md › 3). Módulo puro, sem import:
 * usado nas ações de servidor, nas telas e nos testes (`npm test`).
 *
 * - Gestão da empresa: cadastra, lança, aprova e gerencia os usuários da empresa.
 * - Parceiro: consulta, acompanha indicadores e exporta. Não lança nem aprova.
 * - Administração da plataforma: vê tudo, mas só administra e dá suporte.
 */

export const PERFIS = {
  gestao: 'Gestão da empresa',
  parceiro: 'Parceiro',
  admin: 'Administração da plataforma',
};

const PERMISSOES = {
  lancar: ['gestao'],
  aprovar: ['gestao'],
  'gerenciar-usuarios': ['gestao'],
  'ver-cid': ['gestao', 'admin'],
  exportar: ['gestao', 'parceiro', 'admin'],
  'escolher-cliente': ['parceiro', 'admin'],
  'escolher-parceiro': ['admin'],
  'ver-carteira': ['parceiro'],
  administrar: ['admin'],
};

export function pode(perfil, acao) {
  return Boolean(PERMISSOES[acao]?.includes(perfil));
}

function semAcento(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Valor da coluna Perfil (ou da sessão) → chave do perfil. "*" na coluna
 * Cliente é a Administração da plataforma. Qualquer outro valor, inclusive
 * os nomes antigos ("administrador", "Operador"), é a Gestão da empresa.
 */
export function normalizarPerfil(perfil, cliente) {
  const valor = semAcento(perfil);
  if (valor === 'parceiro' || valor === 'contabilidade') return 'parceiro';
  if (
    cliente === '*' ||
    ['admin', 'administracao', 'administracao da plataforma', 'plataforma'].includes(valor)
  ) {
    return 'admin';
  }
  return 'gestao';
}
