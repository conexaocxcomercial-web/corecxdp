/**
 * INSS do empregado (estimativa da folha gerencial): alíquotas progressivas,
 * cada uma sobre a parte do salário dentro da faixa, até o teto. Puro;
 * tabela em lib/tabelas.js.
 */
import { INSS_EMPREGADO } from '../tabelas.js';
import { centavos } from './dinheiro.js';

export function inssDoEmpregado(salarioDeContribuicao, tabela = INSS_EMPREGADO) {
  const base = Math.min(Math.max(Number(salarioDeContribuicao) || 0, 0), tabela.teto);
  let anterior = 0;
  let total = 0;
  for (const faixa of tabela.faixas) {
    if (base <= anterior) break;
    total += (Math.min(base, faixa.ate) - anterior) * faixa.aliquota;
    anterior = faixa.ate;
  }
  return centavos(total);
}
