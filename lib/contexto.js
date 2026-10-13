import { ErroDePlanilha } from '@/lib/planilha';
import { AvisoAoUsuario } from '@/lib/avisos';
import { escopoAtual } from '@/lib/dados/alcance';

export { emDemonstracao } from '@/lib/dados/estrutura';

export const COLUNA_CLIENTE = 'Cliente';
export const TODOS_OS_CLIENTES = '*';

/**
 * Toda leitura e toda gravação passam por aqui. O recorte por cliente não é
 * um parâmetro que alguma tela possa esquecer de passar: vem do alcance,
 * que vem da sessão (lib/dados/alcance.js).
 */
export async function clienteAtual() {
  const escopo = await escopoAtual();

  if (!escopo?.cliente) {
    throw new AvisoAoUsuario(
      'Escolha um cliente no alcance, no alto da tela, para ver os registros dele.'
    );
  }

  return escopo.cliente;
}

export function semRecorte(cliente) {
  return cliente === TODOS_OS_CLIENTES;
}

export function exigirColunaCliente(cabecalho, aba, cliente) {
  if (semRecorte(cliente)) return;

  if (!cabecalho.includes(COLUNA_CLIENTE)) {
    throw new ErroDePlanilha(
      `A aba ${aba} ainda não tem a coluna Cliente. Acrescente uma coluna com esse nome exato no cabeçalho e preencha o código da empresa em cada linha.`
    );
  }
}
