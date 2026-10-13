/**
 * Custo estimado de pessoal de uma pessoa no mês (base da folha gerencial):
 * salário, provisões de férias (+ 1/3) e 13º, encargos sobre tudo isso e a
 * parte da empresa nos benefícios. É estimativa: o valor oficial é o da
 * contabilidade. Puro; tabelas em lib/tabelas.js.
 */
import { VERBAS } from '../tabelas.js';
import { centavos, somar } from './dinheiro.js';
import { encargosSobre } from './encargos.js';

/** Provisões do mês: 1/12 de férias com o terço e 1/12 de 13º. */
export function provisoesDoMes(salario) {
  const ferias = centavos((salario / 12) * (1 + VERBAS.tercoDeFerias.fator));
  const decimoTerceiro = centavos(salario / 12);
  return { ferias, decimoTerceiro, total: centavos(ferias + decimoTerceiro) };
}

/**
 * A parte da empresa num benefício. Vale-transporte: o que passa de 6% do
 * salário. Os demais: o valor menos a coparticipação (`desconto_percentual`
 * sobre o valor do benefício).
 */
export function custoDoBeneficio(beneficio, salario) {
  const valor = Number(beneficio.valor_empresa) || 0;
  if (beneficio.tipo === 'VT') {
    return centavos(Math.max(valor - Math.min(valor, salario * VERBAS.valeTransporte.descontoMaximo), 0));
  }
  return centavos(valor * (1 - (Number(beneficio.desconto_percentual) || 0)));
}

/**
 * pessoa: { salario, contrato }; aliquotas: de aliquotasDaEmpresa;
 * beneficios: os da pessoa ({ tipo, valor_empresa, desconto_percentual }).
 * Férias gozadas (com o terço) e 13º entram na base do INSS e do FGTS
 * (lib/tabelas.js › INCIDENCIAS), então as provisões levam os encargos.
 */
export function custoMensal(pessoa, aliquotas, beneficios = []) {
  const salario = Number(pessoa.salario) || 0;
  const provisoes = provisoesDoMes(salario);
  const base = salario + provisoes.total;
  const encargos = encargosSobre({ inss: base, fgts: base }, aliquotas, pessoa.contrato);
  const beneficiosDaEmpresa = somar(beneficios.map((beneficio) => custoDoBeneficio(beneficio, salario)));
  return {
    salario: centavos(salario),
    provisoes,
    encargos,
    beneficios: beneficiosDaEmpresa,
    total: somar([salario, provisoes.total, encargos.total, beneficiosDaEmpresa]),
  };
}
