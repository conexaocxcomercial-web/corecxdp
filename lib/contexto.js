import { cache } from 'react';
import { ErroDePlanilha } from '@/lib/planilha';
import { usuarioDaSessao } from '@/lib/sessao';

export const COLUNA_CLIENTE = 'Cliente';
export const TODOS_OS_CLIENTES = '*';

/**
 * Toda leitura e toda gravação passam por aqui. O recorte por cliente não é
 * um parâmetro que alguma tela possa esquecer de passar: vem da sessão.
 */
export const clienteAtual = cache(async () => {
  const usuario = await usuarioDaSessao();

  if (!usuario?.cliente) {
    throw new ErroDePlanilha(
      'Sua sessão expirou ou este acesso não está ligado a nenhuma empresa. Entre de novo.'
    );
  }

  return usuario.cliente;
});

export const empresaAtual = cache(async () => {
  const usuario = await usuarioDaSessao();
  return usuario?.empresa || usuario?.cliente || 'Registro de pessoal';
});

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
