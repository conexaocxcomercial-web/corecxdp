import * as demo from '@/lib/demo/fonte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerEstrutura } from '@/lib/dados/estrutura';
import { AvisoAoUsuario } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import { ORDENS, resumoDaCarteira } from '@/lib/carteira';

/**
 * Repositório da carteira (fase 15 do redesenho): os clientes que o alcance
 * permite (o parceiro, só os dele; a Administração, os do parceiro escolhido
 * ou todos), com os números para comparar. Só na demonstração.
 */
export async function lerCarteira(ordem = 'atencao') {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao) throw new AvisoAoUsuario('A carteira ainda não está disponível nesta conta.');
  if (!['parceiro', 'admin'].includes(alcance.perfil)) throw new AvisoAoUsuario('A carteira é do parceiro.');
  const clientes = alcance.perfil === 'admin' && !alcance.parceiro ? (await lerEstrutura()).clientes : alcance.opcoes.clientes || [];
  const valida = ORDENS.some((item) => item.valor === ordem) ? ordem : 'atencao';
  const dados = demo.dadosCompletos();
  return {
    parceiro: alcance.parceiro,
    ordem: valida,
    hoje: dados.hoje,
    ...resumoDaCarteira(dados, clientes.map((cliente) => dados.clientes.find((item) => item.id === cliente.id) || cliente), valida),
  };
}

/** Quem pode exportar o quê: a carteira só o parceiro e a Administração; o cliente, quem o alcança. */
export async function quemExporta() {
  const alcance = await alcanceAtual();
  if (!alcance || !pode(alcance.perfil, 'exportar')) throw new AvisoAoUsuario('Este acesso não exporta.');
  return alcance;
}
