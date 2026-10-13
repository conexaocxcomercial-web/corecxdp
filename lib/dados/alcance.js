import { cache } from 'react';
import { cookies } from 'next/headers';
import { usuarioDaSessao } from '@/lib/sessao';
import { emDemonstracao, lerEstrutura } from '@/lib/dados/estrutura';
import { escopoDe, escreverPedido, lerPedido, resolverAlcance } from '@/lib/dados/regras';
import { pode } from '@/lib/permissoes';

export const COOKIE_DO_ALCANCE = 'core_cx_alcance';

/**
 * Alcance de quem está logado: a sessão diz o que a pessoa pode alcançar;
 * o cookie só guarda a escolha dela (cliente, CNPJ) e é sempre conferido
 * aqui, no servidor. Um cookie mexido à mão cai no nível de cima, nunca
 * em dado de outro parceiro ou cliente.
 *
 * Fora da demonstração não há perfis nem estrutura guardada: todo login
 * é Gestão do próprio cliente, como antes ("*" continua vendo tudo).
 */
export const alcanceAtual = cache(async () => {
  const sessao = await usuarioDaSessao();
  if (!sessao) return null;

  const estrutura = await lerEstrutura();
  const demonstracao = emDemonstracao();
  const usuario = demonstracao
    ? { perfil: sessao.perfil, parceiro: sessao.parceiro, cliente: sessao.cliente }
    : { perfil: 'gestao', cliente: sessao.cliente };

  const pote = await cookies();
  const pedido = lerPedido(pote.get(COOKIE_DO_ALCANCE)?.value);
  return { ...resolverAlcance(usuario, estrutura, pedido), sessao, demonstracao };
});

/**
 * O que os componentes de cliente recebem: o alcance atual e só a parte da
 * estrutura que o perfil alcança (nunca a lista inteira de parceiros e
 * clientes para quem não pode escolhê-los).
 */
export async function resumoDoAlcance() {
  const alcance = await alcanceAtual();
  if (!alcance) return null;

  const estrutura = await lerEstrutura();
  const clientes =
    alcance.perfil === 'admin' ? estrutura.clientes : alcance.opcoes.clientes;
  const idsDosClientes = new Set(clientes.map((cliente) => cliente.id));

  return {
    perfil: alcance.perfil,
    parceiro: alcance.parceiro,
    cliente: alcance.cliente,
    cnpj: alcance.cnpj,
    fixo: alcance.fixo,
    opcoes: { cnpjs: alcance.opcoes.cnpjs },
    chave: alcance.chave,
    estrutura: {
      parceiros: alcance.opcoes.parceiros,
      clientes,
      cnpjs: estrutura.cnpjs.filter((cnpj) => idsDosClientes.has(cnpj.cliente_id)),
    },
  };
}

/** O que o perfil do alcance pode fazer, para as telas esconderem o que não cabe. */
export async function permissoesAtuais() {
  const alcance = await alcanceAtual();
  const perfil = alcance?.perfil;
  return {
    perfil,
    lancar: pode(perfil, 'lancar'),
    aprovar: pode(perfil, 'aprovar'),
    verCid: pode(perfil, 'ver-cid'),
  };
}

/** Recorte para lib/registros: { cliente, cnpj } ou null sem cliente no alcance. */
export async function escopoAtual() {
  return escopoDe(await alcanceAtual());
}

/**
 * Grava a escolha. Só ids que o perfil alcança ficam: o pedido passa pelas
 * mesmas regras da leitura antes de virar cookie.
 */
export async function gravarAlcance(pedido) {
  const sessao = await usuarioDaSessao();
  if (!sessao) return null;

  const estrutura = await lerEstrutura();
  const alcance = resolverAlcance(
    { perfil: sessao.perfil, parceiro: sessao.parceiro, cliente: sessao.cliente },
    estrutura,
    pedido
  );
  const valor = escreverPedido({
    parceiro: alcance.fixo.parceiro ? null : alcance.parceiro?.id,
    cliente: alcance.fixo.cliente ? null : alcance.cliente?.id,
    cnpj: alcance.cnpj?.id,
  });

  const pote = await cookies();
  if (valor) {
    pote.set(COOKIE_DO_ALCANCE, valor, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    pote.delete(COOKIE_DO_ALCANCE);
  }
  return alcance;
}

export async function limparAlcance() {
  const pote = await cookies();
  pote.delete(COOKIE_DO_ALCANCE);
}
