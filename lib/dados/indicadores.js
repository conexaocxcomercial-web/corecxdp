import { lerBase } from '@/lib/dados/pessoas';
import { PERIODOS, central, detalhe, painel } from '@/lib/paineis';
import { encargosDaEmpresa, explicacaoDaEstimativa } from '@/lib/folha';

/**
 * Repositório dos indicadores em três camadas (fase 10 do redesenho): a
 * central, o painel do tema e o detalhe do indicador, sobre o recorte do
 * alcance. Na demonstração, os dados completos; fora dela, o que a planilha
 * tem (pessoas, ocorrências, atestados e movimentações).
 */

/** Período (3, 6 ou 12 meses; 12 por padrão) e departamento vindos do endereço. */
export function filtrosDoEndereco(parametros) {
  const meses = Number(parametros?.meses);
  return {
    meses: PERIODOS.includes(meses) ? meses : 12,
    departamento: typeof parametros?.departamento === 'string' ? parametros.departamento : '',
  };
}

function departamentosDe(recorte) {
  return [...new Set(recorte.pessoas.map((pessoa) => pessoa.departamento).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Custos são estimativa: o selo explica a conta e o percentual de encargos da empresa. */
function estimativaDo(tema, recorte) {
  return tema === 'custos' ? explicacaoDaEstimativa(encargosDaEmpresa(recorte.cliente)) : null;
}

export async function lerCentral(filtros) {
  const { recorte } = await lerBase();
  return { completo: recorte.completo, vazio: recorte.pessoas.length === 0, temas: central(recorte, filtros) };
}

export async function lerPainel(tema, filtros) {
  const { recorte } = await lerBase();
  const departamentos = departamentosDe(recorte);
  const departamento = departamentos.includes(filtros.departamento) ? filtros.departamento : '';
  const lido = painel(recorte, tema, { ...filtros, departamento });
  return lido ? { ...lido, departamentos, completo: recorte.completo, estimativa: estimativaDo(tema, recorte) } : null;
}

export async function lerDetalhe(tema, indicador, filtros) {
  const { recorte } = await lerBase();
  const departamentos = departamentosDe(recorte);
  const departamento = departamentos.includes(filtros.departamento) ? filtros.departamento : '';
  const lido = detalhe(recorte, tema, indicador, { ...filtros, departamento });
  return lido ? { ...lido, departamentos, completo: recorte.completo, estimativa: estimativaDo(tema, recorte) } : null;
}
