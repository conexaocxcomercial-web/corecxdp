import { lerBase } from '@/lib/dados/pessoas';
import { resumoDasAdmissoes, resumoDosDesligamentos } from '@/lib/entradasESaidas';

/**
 * Repositório de Admissões e Desligamentos (fase 9 do redesenho): os passos,
 * os prazos e os custos informados, sobre o recorte do alcance. Fora da
 * demonstração, a planilha não tem contrato, documentos nem custos: as
 * telas dizem que o dado não está cadastrado.
 */

export async function listarAdmissoes() {
  const { recorte } = await lerBase();
  return { completo: recorte.completo, hoje: recorte.hoje, ...resumoDasAdmissoes(recorte) };
}

export async function listarDesligamentos() {
  const { recorte } = await lerBase();
  return { completo: recorte.completo, hoje: recorte.hoje, ...resumoDosDesligamentos(recorte) };
}

/** Os custos informados de uma pessoa (admissão e desligamento), para a ficha. */
export async function custosDaPessoa(matricula) {
  const { recorte } = await lerBase();
  const pessoa = recorte.pessoas.find((item) => item.matricula === matricula);
  if (!pessoa) return { admissao: null, desligamento: null };
  const dela = (recorte.custos || []).filter((item) => item.pessoa_id === pessoa.id);
  return {
    admissao: dela.find((item) => item.momento === 'admissao') || null,
    desligamento: dela.find((item) => item.momento === 'desligamento') || null,
  };
}
