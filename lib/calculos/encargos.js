/**
 * Encargos da empresa sobre a folha, pelo regime tributário (estimativa).
 *   Lucro Presumido e Real: 20% + RAT × FAP + terceiros do FPAS (a cota cai
 *   para 10% nos setores desonerados em 2026).
 *   Simples Nacional, Anexos I, II, III e V: a contribuição patronal está no
 *   DAS, que é sobre a receita; não entra no custo da folha.
 *   Simples Nacional, Anexo IV: 20% + RAT × FAP à parte, sem terceiros.
 * O FGTS é devido em todos os regimes. Puro; tabelas em lib/tabelas.js.
 */
import { DESONERACAO, FGTS, PATRONAL, SIMPLES_NACIONAL, TERCEIROS_POR_FPAS, VIGENCIA } from '../tabelas.js';
import { centavos } from './dinheiro.js';

export class FaltaDadoDaEmpresa extends Error {}

/**
 * As alíquotas sobre a folha de uma empresa. `empresa`:
 * { regime, anexoSimples, fpas, rat, fap, desonerada }.
 */
export function aliquotasDaEmpresa(empresa) {
  const regime = empresa?.regime;
  const fap = empresa?.fap ?? PATRONAL.fap.padrao;
  if (fap < PATRONAL.fap.minimo || fap > PATRONAL.fap.maximo) {
    throw new FaltaDadoDaEmpresa(`FAP fora do intervalo de ${PATRONAL.fap.minimo} a ${PATRONAL.fap.maximo}.`);
  }
  const rat = () => {
    if (!PATRONAL.rat.includes(empresa?.rat)) throw new FaltaDadoDaEmpresa('Informe o RAT da empresa (1%, 2% ou 3%).');
    return empresa.rat * fap;
  };

  if (regime === 'Simples Nacional') {
    const anexo = empresa?.anexoSimples;
    if (!SIMPLES_NACIONAL.anexos.includes(anexo)) {
      throw new FaltaDadoDaEmpresa('Informe o anexo do Simples Nacional: no Anexo IV, o INSS patronal é pago à parte.');
    }
    if (SIMPLES_NACIONAL.patronalNoDas.includes(anexo)) {
      return { cota: 0, rat: 0, terceiros: 0, patronalNoDas: true };
    }
    return { cota: PATRONAL.cota, rat: rat(), terceiros: 0, patronalNoDas: false };
  }

  if (regime === 'Lucro Presumido' || regime === 'Lucro Real') {
    const terceiros = TERCEIROS_POR_FPAS[empresa?.fpas];
    if (!terceiros || typeof terceiros !== 'object') throw new FaltaDadoDaEmpresa('Informe o FPAS da empresa.');
    const cotaCheia = terceiros.cota ?? PATRONAL.cota;
    const cota = empresa?.desonerada ? DESONERACAO[VIGENCIA]?.sobreAFolha ?? cotaCheia : cotaCheia;
    return { cota, rat: rat(), terceiros: terceiros.total, patronalNoDas: false, desonerada: Boolean(empresa?.desonerada) };
  }

  throw new FaltaDadoDaEmpresa('Informe o regime tributário da empresa.');
}

export function aliquotaDoFgts(contrato) {
  return contrato === 'aprendiz' ? FGTS.aprendiz : FGTS.mensal;
}

/**
 * Encargos sobre uma verba. `base` diz o que entra em cada um (lib/tabelas.js
 * › INCIDENCIAS): { inss, fgts } com o valor de cada base.
 */
export function encargosSobre({ inss: baseInss = 0, fgts: baseFgts = 0 }, aliquotas, contrato) {
  const cota = centavos(baseInss * aliquotas.cota);
  const rat = centavos(baseInss * aliquotas.rat);
  const terceiros = centavos(baseInss * aliquotas.terceiros);
  const fgts = centavos(baseFgts * aliquotaDoFgts(contrato));
  return { cota, rat, terceiros, fgts, total: centavos(cota + rat + terceiros + fgts) };
}
