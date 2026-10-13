import * as demo from '@/lib/demo/fonte';
import { lerRecorte } from '@/lib/dados/recorte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerBase } from '@/lib/dados/pessoas';
import { AvisoAoUsuario } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import { ErroDeBeneficio, montarAdesao, montarBeneficio, montarEncerramento, resumoDosBeneficios } from '@/lib/beneficios';
import { folhaDoMes, competencias } from '@/lib/folha';

/**
 * Repositório de Benefícios (fase 13 do redesenho): o catálogo, quem tem e
 * quem não tem, e as mudanças (benefício novo, valores, incluir e encerrar
 * adesão), com permissão e autoria. Só na demonstração: a planilha não tem
 * benefícios.
 */

const SO_NA_DEMONSTRACAO = 'Os benefícios ainda não estão disponíveis nesta conta.';

async function quemMuda() {
  const alcance = await alcanceAtual();
  if (!pode(alcance?.perfil, 'lancar')) throw new AvisoAoUsuario('Este acesso é só de consulta: os benefícios ficam com a Gestão da empresa.');
  const lido = await lerRecorte();
  if (!lido) throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
  return { recorte: lido.recorte, autor: alcance.sessao.nome || 'Gestão da empresa' };
}

function comAviso(funcao) {
  try {
    return funcao();
  } catch (erro) {
    if (erro instanceof ErroDeBeneficio) throw new AvisoAoUsuario(erro.message);
    throw erro;
  }
}

export async function listarBeneficios() {
  const { recorte } = await lerBase();
  const resumo = resumoDosBeneficios(recorte);
  const folha = recorte.completo ? folhaDoMes(recorte, competencias(recorte.hoje, 1)[0]).totais : null;
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    ...resumo,
    // O peso dos benefícios no custo estimado de pessoal do mês.
    peso: folha?.total ? Math.round((folha.beneficios / folha.total) * 1000) / 10 : null,
  };
}

export async function lerBeneficio(id) {
  const lido = await listarBeneficios();
  const beneficio = lido.catalogo.find((item) => item.id === id);
  return beneficio ? { ...lido, beneficio } : null;
}

/** Benefício novo ou os valores de um que já existe. */
export async function salvarBeneficio(id, entrada) {
  const { recorte, autor } = await quemMuda();
  const existente = id ? recorte.beneficios.find((item) => item.id === id) : null;
  if (id && !existente) throw new AvisoAoUsuario('Este benefício não está mais no catálogo. Recarregue a página.');
  const campos = comAviso(() => montarBeneficio(entrada, { existentes: recorte.beneficios, id }));
  if (existente) {
    demo.alterar('beneficios', id, { ...campos, alterado_por: autor, alterado_em: recorte.hoje });
    return { id };
  }
  const novo = demo.inserir('beneficios', { ...campos, cliente_id: recorte.cliente.id, registrado_por: autor, registrado_em: recorte.hoje });
  return { id: novo.id };
}

export async function incluirNoBeneficio(beneficioId, matricula, entrada) {
  const { recorte, autor } = await quemMuda();
  const beneficio = recorte.beneficios.find((item) => item.id === beneficioId);
  const pessoa = recorte.pessoas.find((item) => item.matricula === matricula);
  if (!beneficio || !pessoa) throw new AvisoAoUsuario('Esta pessoa ou este benefício não está mais no seu alcance. Recarregue a página.');
  const adesao = comAviso(() => montarAdesao(entrada, { pessoa, beneficio, adesoes: recorte.adesoes, hoje: recorte.hoje }));
  demo.inserir('adesoes', { ...adesao, cliente_id: recorte.cliente.id, registrado_por: autor, registrado_em: recorte.hoje });
}

export async function encerrarAdesao(adesaoId, entrada) {
  const { recorte, autor } = await quemMuda();
  const adesao = recorte.adesoes.find((item) => item.id === adesaoId);
  if (!adesao) throw new AvisoAoUsuario('Esta adesão não está mais no seu alcance. Recarregue a página.');
  const campos = comAviso(() => montarEncerramento(adesao, entrada, { hoje: recorte.hoje }));
  demo.alterar('adesoes', adesaoId, { ...campos, encerrado_por: autor, encerrado_em: recorte.hoje });
}
