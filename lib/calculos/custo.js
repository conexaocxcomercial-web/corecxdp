/**
 * Custo estimado de pessoal: a ordem de grandeza dos custos, para a gestão
 * entender os números (cálculos trabalhistas são da contabilidade).
 *
 *   salários       soma dos salários cadastrados
 *   provisões      férias: salário ÷ 12, mais 1/3; 13º: salário ÷ 12
 *   encargos       um percentual único do regime sobre salários e provisões
 *   benefícios     soma dos valores cadastrados
 *   total          a soma de tudo
 *   fator de custo quanto cada R$ 1 de salário custa (total ÷ salários)
 *
 * Tudo é estimativa e aparece identificado como tal. Puro; parâmetros em
 * lib/tabelas.js; testado em testes/calculos.test.js.
 */
import { AVISOS_DOS_ENCARGOS, ENCARGOS_PADRAO, LIMITES_DO_PERCENTUAL, PROVISOES } from '../tabelas.js';
import { centavos, somar } from './dinheiro.js';

export class FaltaDadoDaEmpresa extends Error {}

/**
 * A chave de ENCARGOS_PADRAO para a empresa (o Anexo IV do Simples tem a sua)
 * e o aviso, quando falta um dado: sem o anexo do Simples ou sem o regime,
 * vale o padrão do Simples (8%) com "anexo a conferir" ou "regime a conferir",
 * para a estimativa nunca deixar de aparecer.
 */
export function regimeDosEncargos(empresa) {
  const regime = empresa?.regime;
  if (regime === 'Simples Nacional') {
    if (!empresa?.anexoSimples) return { chave: 'Simples Nacional', aviso: AVISOS_DOS_ENCARGOS.anexo };
    return { chave: empresa.anexoSimples === 'IV' ? 'Simples Nacional, Anexo IV' : 'Simples Nacional', aviso: null };
  }
  if (ENCARGOS_PADRAO[regime]) return { chave: regime, aviso: null };
  return { chave: 'Simples Nacional', aviso: AVISOS_DOS_ENCARGOS.regime };
}

/**
 * O percentual de encargos da empresa: o configurado, quando há (entre os
 * limites), ou o padrão do regime. Devolve também de onde ele veio e o aviso
 * de dado a conferir (o percentual configurado não depende do regime).
 */
export function percentualDeEncargos(empresa) {
  const proprio = empresa?.percentualEncargos;
  if (proprio !== null && proprio !== undefined && proprio !== '') {
    const valor = Number(proprio);
    if (!Number.isFinite(valor) || valor < LIMITES_DO_PERCENTUAL.minimo || valor > LIMITES_DO_PERCENTUAL.maximo) {
      throw new FaltaDadoDaEmpresa('O percentual de encargos da empresa precisa ficar entre 0% e 80%.');
    }
    return { percentual: valor, origem: 'empresa', regime: empresa?.regime ?? null, aviso: null };
  }
  const { chave, aviso } = regimeDosEncargos(empresa);
  return { percentual: ENCARGOS_PADRAO[chave].percentual, origem: 'padrao', regime: chave, explicacao: ENCARGOS_PADRAO[chave].explicacao, aviso };
}

/** Provisões do mês sobre um total de salários. */
export function provisoes(salarios) {
  const ferias = centavos(salarios * PROVISOES.ferias.fracao * (1 + PROVISOES.ferias.terco));
  const decimoTerceiro = centavos(salarios * PROVISOES.decimoTerceiro.fracao);
  return { ferias, decimoTerceiro, total: centavos(ferias + decimoTerceiro) };
}

/**
 * O custo estimado do mês. `salarios` e `beneficios` são listas de valores
 * mensais (de uma pessoa ou de várias); `percentual` vem de percentualDeEncargos.
 */
export function custoEstimado({ salarios = [], beneficios = [] }, percentual) {
  const totalDeSalarios = somar(salarios);
  const provisoesDoMes = provisoes(totalDeSalarios);
  const encargos = centavos((totalDeSalarios + provisoesDoMes.total) * percentual);
  const totalDeBeneficios = somar(beneficios);
  const total = somar([totalDeSalarios, provisoesDoMes.total, encargos, totalDeBeneficios]);
  return {
    salarios: totalDeSalarios,
    provisoes: provisoesDoMes,
    encargos,
    percentualDeEncargos: percentual,
    beneficios: totalDeBeneficios,
    total,
    // Quanto cada R$ 1 de salário custa para a empresa (duas casas).
    fatorDeCusto: totalDeSalarios ? Math.round((total / totalDeSalarios) * 100) / 100 : null,
  };
}
