import { ErroDePlanilha } from '@/lib/planilha';

export const COLUNA_CLIENTE = 'Cliente';

/** Sem recorte: enxerga a planilha inteira. */
export const TODOS_OS_CLIENTES = '*';

/**
 * De qual empresa são os dados desta instalação.
 *
 * CLIENTE_PADRAO=conexao  → só as linhas com Cliente igual a "conexao"
 * CLIENTE_PADRAO vazio    → a planilha inteira, e a coluna Cliente nem
 *                           precisa existir
 */
export function clienteAtual() {
  return String(process.env.CLIENTE_PADRAO || '').trim() || TODOS_OS_CLIENTES;
}

export function empresaAtual() {
  const cliente = clienteAtual();
  if (process.env.EMPRESA_PADRAO) return process.env.EMPRESA_PADRAO;
  return cliente === TODOS_OS_CLIENTES ? 'Registro de pessoal' : cliente;
}

export function semRecorte(cliente) {
  return cliente === TODOS_OS_CLIENTES;
}

export function mesmoCliente(valor, cliente) {
  if (semRecorte(cliente)) return true;
  return String(valor ?? '').trim().toLowerCase() === String(cliente).toLowerCase();
}

export function exigirColunaCliente(cabecalho, aba, cliente) {
  if (semRecorte(cliente)) return;

  if (!cabecalho.includes(COLUNA_CLIENTE)) {
    throw new ErroDePlanilha(
      `A aba ${aba} ainda não tem a coluna Cliente. Acrescente uma coluna com esse nome exato no cabeçalho e preencha o código da empresa em cada linha.`
    );
  }
}
