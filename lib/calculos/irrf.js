/**
 * IRRF mensal (estimativa da folha gerencial), como a Receita aplica nos
 * exemplos oficiais de 2026:
 *   1. deduções = o maior entre (INSS + dependentes + pensão) e o desconto simplificado;
 *   2. base = rendimento − deduções; imposto da tabela = base × alíquota − parcela a deduzir;
 *   3. redução da Lei 15.270/2025, medida pelo rendimento BRUTO e limitada ao imposto.
 * Puro; tabela em lib/tabelas.js.
 */
import { IRRF } from '../tabelas.js';
import { centavos } from './dinheiro.js';

export function impostoDaTabela(base, tabela = IRRF) {
  const faixa = tabela.faixas.find((item) => base <= item.ate);
  return centavos(Math.max(base * faixa.aliquota - faixa.deduzir, 0));
}

export function reducaoDoIrrf(rendimento, imposto, tabela = IRRF) {
  const { zeraAte, maxima, parcialAte, constante, fator } = tabela.reducao;
  if (rendimento <= zeraAte) return centavos(Math.min(maxima, imposto));
  if (rendimento <= parcialAte) return centavos(Math.max(Math.min(constante - fator * rendimento, imposto), 0));
  return 0;
}

export function irrfMensal({ rendimento, inss = 0, dependentes = 0, pensao = 0 }, tabela = IRRF) {
  const legais = inss + dependentes * tabela.dependente + pensao;
  const simplificado = tabela.descontoSimplificado > legais;
  const deducoes = centavos(simplificado ? tabela.descontoSimplificado : legais);
  const base = centavos(Math.max(rendimento - deducoes, 0));
  const daTabela = impostoDaTabela(base, tabela);
  const reducao = reducaoDoIrrf(rendimento, daTabela, tabela);
  return {
    deducoes,
    simplificado,
    base,
    impostoDaTabela: daTabela,
    reducao,
    imposto: centavos(daTabela - reducao),
  };
}
