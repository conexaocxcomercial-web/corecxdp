import { lerBase } from '@/lib/dados/pessoas';
import { competenciaDe, competencias, decimoTerceiro, explicacaoDaEstimativa, folhaDoMes, folhaPorGrupo, serieDaFolha } from '@/lib/folha';
import { provisoes } from '@/lib/calculos/custo';

/**
 * Repositório da folha gerencial (fase 12 do redesenho): a competência
 * escolhida, as pessoas com o custo estimado, a composição, os grupos, as
 * provisões e o 13º. Valores de cada pessoa saem para a tela, que os mascara.
 * Fora da demonstração, a planilha não tem salários nem benefícios.
 */
export async function lerFolha(valorDaCompetencia) {
  const { recorte } = await lerBase();
  const competencia = competenciaDe(recorte.hoje, valorDaCompetencia);
  const folha = folhaDoMes(recorte, competencia);
  const anterior = competencias(recorte.hoje, 13).find((item) => item.inicio < competencia.inicio);
  const totalAnterior = anterior ? folhaDoMes(recorte, anterior).totais.total : null;
  const nomeDoCnpj = new Map(recorte.cnpjs.map((cnpj) => [cnpj.id, cnpj.nome]));
  const resumo = (pessoa) => ({ nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo, departamento: pessoa.departamento });
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    competencia,
    competencias: competencias(recorte.hoje),
    encargos: folha.encargos,
    estimativa: explicacaoDaEstimativa(folha.encargos),
    totais: folha.totais,
    composicao: folha.composicao,
    anterior: anterior ? { rotulo: anterior.rotulo, total: totalAnterior } : null,
    semSalario: folha.semSalario,
    pessoas: folha.pessoas
      .map((item) => ({ pessoa: resumo(item.pessoa), salario: item.salario, beneficios: item.beneficios, custo: item.custo }))
      .sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome, 'pt-BR')),
    porDepartamento: folhaPorGrupo(folha, 'departamento'),
    porUnidade: recorte.cnpjs.length > 1 ? folhaPorGrupo(folha, 'cnpj_id', (chave) => nomeDoCnpj.get(chave) || chave) : [],
    serie: serieDaFolha(recorte, 12).map(({ competencia: item, totais }) => ({ rotulo: item.rotulo.slice(0, 3) + '/' + item.valor.slice(2, 4), valor: Math.round(totais.total) })),
    decimo: decimoTerceiro(recorte),
    provisoesDoMes: provisoes(folha.totais.salarios),
  };
}
