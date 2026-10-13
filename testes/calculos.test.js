/**
 * Cálculos de lib/calculos com casos conferidos: os exemplos oficiais da
 * Receita para o IRRF de 2026, as faixas do INSS de 2026 e rescisões feitas
 * à mão (a conta de cada uma está no comentário). Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centavos } from '../lib/calculos/dinheiro.js';
import { inssDoEmpregado } from '../lib/calculos/inss.js';
import { irrfMensal } from '../lib/calculos/irrf.js';
import { FaltaDadoDaEmpresa, aliquotasDaEmpresa, encargosSobre } from '../lib/calculos/encargos.js';
import { custoDoBeneficio, custoMensal, provisoesDoMes } from '../lib/calculos/custo.js';
import {
  anosCompletos,
  avosDeFerias,
  avosDoDecimoTerceiro,
  diasDeAvisoPrevio,
  rescisaoEstimada,
  somarMeses,
} from '../lib/calculos/rescisao.js';
import { INSS_EMPREGADO, IRRF, TERCEIROS_POR_FPAS, VERBAS_DA_RESCISAO, MULTA_DO_FGTS } from '../lib/tabelas.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';

const PRESUMIDO = aliquotasDaEmpresa({ regime: 'Lucro Presumido', fpas: 515, rat: 0.02, fap: 1 });

test('centavos: meio para cima, sem o erro do ponto flutuante', () => {
  assert.equal(centavos(121.575), 121.58);
  assert.equal(centavos(1621 * 0.075), 121.58);
  assert.equal(centavos(368.5998), 368.6);
  assert.equal(centavos(2.004), 2);
});

test('INSS do empregado 2026, faixa a faixa, até o teto', () => {
  const casos = [
    [1621.0, 121.58],
    [3036.0, 252.92],
    [4000.0, 368.6],
    [5000.0, 501.51],
    [6000.0, 641.51],
    [8475.55, 988.09],
    [12000.0, 988.09],
    [0, 0],
  ];
  for (const [salario, esperado] of casos) assert.equal(inssDoEmpregado(salario), esperado, `salário ${salario}`);
  assert.equal(inssDoEmpregado(INSS_EMPREGADO.teto), INSS_EMPREGADO.maxima);
});

test('IRRF 2026: os exemplos oficiais da Receita (Lei 15.270/2025)', () => {
  // Salário 3.036,00, desconto simplificado: base 2.428,80, isento.
  assert.equal(irrfMensal({ rendimento: 3036 }).imposto, 0);
  // 4.000,00: base 3.392,80; tabela 114,76; redução 114,76; imposto zero.
  const quatroMil = irrfMensal({ rendimento: 4000, inss: inssDoEmpregado(4000) });
  assert.deepEqual([quatroMil.simplificado, quatroMil.base, quatroMil.impostoDaTabela, quatroMil.reducao, quatroMil.imposto], [true, 3392.8, 114.76, 114.76, 0]);
  // 5.000,00: base 4.392,80; tabela 312,89; zera.
  const cincoMil = irrfMensal({ rendimento: 5000, inss: inssDoEmpregado(5000) });
  assert.deepEqual([cincoMil.base, cincoMil.impostoDaTabela, cincoMil.imposto], [4392.8, 312.89, 0]);
  // 6.000,00 com o INSS do exemplo (649,60): base 5.350,40; tabela 562,63; redução 179,75; imposto 382,88.
  const seisMil = irrfMensal({ rendimento: 6000, inss: 649.6 });
  assert.deepEqual([seisMil.simplificado, seisMil.base, seisMil.impostoDaTabela, seisMil.reducao, seisMil.imposto], [false, 5350.4, 562.63, 179.75, 382.88]);
  // 7.607,20, simplificado: base 7.000,00; tabela 1.016,27; acima de 7.350, sem redução.
  const acima = irrfMensal({ rendimento: 7607.2 });
  assert.deepEqual([acima.base, acima.impostoDaTabela, acima.reducao, acima.imposto], [7000, 1016.27, 0, 1016.27]);
  // A faixa da redução é pelo rendimento bruto, não pela base.
  assert.equal(irrfMensal({ rendimento: 7350.01 }).reducao, 0);
  assert.equal(irrfMensal({ rendimento: 4000, dependentes: 2, inss: 368.6 }).deducoes, centavos(368.6 + 2 * IRRF.dependente));
});

test('encargos por regime: Simples no DAS, Anexo IV à parte, Presumido e Real com terceiros', () => {
  assert.deepEqual(aliquotasDaEmpresa({ regime: 'Simples Nacional', anexoSimples: 'III' }), { cota: 0, rat: 0, terceiros: 0, patronalNoDas: true });
  const anexoIV = aliquotasDaEmpresa({ regime: 'Simples Nacional', anexoSimples: 'IV', rat: 0.03, fap: 1.5 });
  assert.deepEqual([anexoIV.cota, centavos(anexoIV.rat * 100) / 100, anexoIV.terceiros], [0.2, 0.045, 0]);
  assert.throws(() => aliquotasDaEmpresa({ regime: 'Simples Nacional' }), FaltaDadoDaEmpresa, 'sem o anexo não dá para estimar');
  assert.throws(() => aliquotasDaEmpresa({ regime: 'Lucro Real', fpas: 612 }), FaltaDadoDaEmpresa, 'sem o RAT não dá para estimar');
  assert.throws(() => aliquotasDaEmpresa({ regime: 'Lucro Real', fpas: 612, rat: 0.02, fap: 3 }), FaltaDadoDaEmpresa);
  const escola = aliquotasDaEmpresa({ regime: 'Lucro Presumido', fpas: 574, rat: 0.01 });
  assert.equal(escola.terceiros, TERCEIROS_POR_FPAS[574].total);
  assert.equal(aliquotasDaEmpresa({ regime: 'Lucro Real', fpas: 515, rat: 0.02, desonerada: true }).cota, 0.1);
  assert.equal(aliquotasDaEmpresa({ regime: 'Lucro Real', fpas: 736, rat: 0.01 }).cota, 0.225);
  const sobreMil = encargosSobre({ inss: 1000, fgts: 1000 }, PRESUMIDO, 'indeterminado');
  assert.deepEqual(sobreMil, { cota: 200, rat: 20, terceiros: 58, fgts: 80, total: 358 });
  assert.equal(encargosSobre({ inss: 0, fgts: 1000 }, PRESUMIDO, 'aprendiz').fgts, 20, 'aprendiz: FGTS de 2%');
});

test('custo mensal: salário, provisões, encargos e benefícios', () => {
  assert.deepEqual(provisoesDoMes(3000), { ferias: 333.33, decimoTerceiro: 250, total: 583.33 });
  // VT de 220 com salário de 3.000: a empresa paga o que passa de 6% (180), ou seja, 40.
  assert.equal(custoDoBeneficio({ tipo: 'VT', valor_empresa: 220, desconto_percentual: 0.06 }, 3000), 40);
  assert.equal(custoDoBeneficio({ tipo: 'VR', valor_empresa: 660, desconto_percentual: 0.1 }, 3000), 594);
  // Base 3.583,33 → 716,67 + 71,67 + 207,83 + 286,67 = 1.282,84; total 3.000 + 583,33 + 1.282,84 + 634 = 5.500,17.
  const custo = custoMensal({ salario: 3000, contrato: 'indeterminado' }, PRESUMIDO, [
    { tipo: 'VT', valor_empresa: 220, desconto_percentual: 0.06 },
    { tipo: 'VR', valor_empresa: 660, desconto_percentual: 0.1 },
  ]);
  assert.deepEqual([custo.encargos.total, custo.beneficios, custo.total], [1282.84, 634, 5500.17]);
  // No Simples (Anexo III), só o FGTS entra nos encargos.
  const simples = custoMensal({ salario: 3000 }, aliquotasDaEmpresa({ regime: 'Simples Nacional', anexoSimples: 'III' }));
  assert.deepEqual([simples.encargos.cota, simples.encargos.fgts], [0, 286.67]);
});

test('datas da rescisão: meses, anos completos, aviso prévio e avos', () => {
  assert.equal(somarMeses('2024-01-31', 1), '2024-02-29');
  assert.equal(somarMeses('2026-11-30', 3), '2027-02-28');
  assert.equal(anosCompletos('2023-03-01', '2026-02-28'), 2);
  assert.equal(anosCompletos('2023-03-01', '2026-03-01'), 3);
  assert.equal(diasDeAvisoPrevio('2023-03-01', '2026-10-13'), 39);
  assert.equal(diasDeAvisoPrevio('2026-01-10', '2026-10-13'), 30);
  assert.equal(diasDeAvisoPrevio('2000-01-01', '2026-10-13'), 90, 'até 90 dias');
  // 13º: mês com 15 dias ou mais conta.
  assert.equal(avosDoDecimoTerceiro('2020-01-01', '2026-10-13'), 9, 'outubro com 13 dias não conta');
  assert.equal(avosDoDecimoTerceiro('2020-01-01', '2026-10-15'), 10);
  assert.equal(avosDoDecimoTerceiro('2026-03-20', '2026-10-13'), 6, 'março com 12 dias não conta; abril a setembro');
  assert.equal(avosDeFerias('2026-03-01', '2026-11-21'), 9, '8 meses completos e 21 dias');
  assert.equal(avosDeFerias('2026-03-01', '2026-11-10'), 8);
  assert.equal(avosDeFerias('2025-03-01', '2026-02-28'), 12);
});

test('rescisão: dispensa sem justa causa com aviso projetado (caso conferido à mão)', () => {
  // Salário 3.000; admissão 01/03/2023; saída 13/10/2026; 3 anos completos → aviso de 39 dias, projeção até 21/11.
  // Saldo 13 dias = 1.300; aviso 39 dias = 3.900; 13º 9/12 = 2.250 e mais 2/12 do aviso = 500;
  // férias do período até 28/02/2026, simples, com 1/3 = 4.000; proporcionais 9/12 com 1/3 = 3.000.
  const r = rescisaoEstimada({
    salario: 3000,
    contrato: 'indeterminado',
    admissao: '2023-03-01',
    saida: '2026-10-13',
    tipo: 'Dispensa sem justa causa',
    periodosPendentes: [{ aquisitivo_fim: '2026-02-28', concessivo_fim: '2027-02-28', dias: 30 }],
    aliquotas: PRESUMIDO,
  });
  const valor = (chave) => r.verbas.find((item) => item.chave === chave)?.valor;
  assert.deepEqual([r.diasDeAviso, r.projecao, r.avos.decimoTerceiro, r.avos.ferias], [39, '2026-11-21', 11, 9]);
  assert.deepEqual(
    [valor('saldo'), valor('aviso'), valor('decimoTerceiro'), valor('decimoTerceiroDoAviso'), valor('ferias-2026-02-28'), valor('feriasProporcionais')],
    [1300, 3900, 2250, 500, 4000, 3000]
  );
  assert.equal(r.totais.verbas, 14950);
  // INSS sobre saldo e 13º (4.050): 810 + 81 + 234,90; FGTS sobre isso e o aviso (7.950): 636.
  assert.deepEqual([r.encargos.cota, r.encargos.rat, r.encargos.terceiros, r.fgts.doMes], [810, 81, 234.9, 636]);
  // Multa de 40% sobre o saldo estimado e o FGTS do mês sem o do aviso (4.050 × 8% = 324).
  assert.equal(r.fgts.multa, centavos((r.fgts.saldoEstimado + 324) * 0.4));
  assert.ok(Math.abs(r.fgts.saldoEstimado - 11591) < 2, `saldo estimado ${r.fgts.saldoEstimado}`);
  assert.equal(r.totais.custo, centavos(14950 + 636 + r.fgts.multa + 1125.9));
});

test('rescisão: férias vencidas em dobro depois do período concessivo', () => {
  const r = rescisaoEstimada({
    salario: 3000, contrato: 'indeterminado', admissao: '2022-03-01', saida: '2026-10-13', tipo: 'Dispensa com justa causa',
    periodosPendentes: [{ aquisitivo_fim: '2025-02-28', concessivo_fim: '2026-02-28', dias: 30 }],
    aliquotas: PRESUMIDO,
  });
  // Justa causa: só saldo e férias vencidas (aqui em dobro: 4.000 × 2).
  assert.deepEqual(r.verbas.map((item) => [item.chave, item.valor]), [['saldo', 1300], ['ferias-2025-02-28', 8000]]);
  assert.equal(r.fgts.multa, 0);
});

test('rescisão: término antecipado da experiência paga o art. 479 e a multa, sem aviso', () => {
  // Salário 2.000; admissão 01/09/2026; experiência até 29/11; dispensa em 13/10.
  // Saldo 13 dias = 866,67; 13º 1/12 = 166,67; férias 1/12 com 1/3 = 222,22; art. 479: 47 dias × 66,67 × 1/2 = 1.566,67.
  const r = rescisaoEstimada({
    salario: 2000, contrato: 'experiência', admissao: '2026-09-01', saida: '2026-10-13', tipo: 'Dispensa sem justa causa',
    fimDaExperiencia: '2026-11-29', aliquotas: PRESUMIDO,
  });
  assert.equal(r.tipo, 'Término antecipado da experiência');
  assert.deepEqual(r.verbas.map((item) => [item.chave, item.valor]), [
    ['saldo', 866.67], ['decimoTerceiro', 166.67], ['feriasProporcionais', 222.22], ['art479', 1566.67],
  ]);
  assert.equal(r.diasDeAvisoPagos, 0);
  assert.equal(r.fgts.taxaDaMulta, 0.4);
});

test('rescisão: pedido de demissão e acordo', () => {
  const base = { salario: 3000, contrato: 'indeterminado', admissao: '2023-03-01', saida: '2026-10-13', aliquotas: PRESUMIDO };
  const pedido = rescisaoEstimada({ ...base, tipo: 'Pedido de demissão' });
  assert.ok(!pedido.verbas.some((item) => item.chave === 'aviso'));
  assert.equal(pedido.fgts.multa, 0);
  assert.equal(pedido.avos.decimoTerceiro, 9, 'sem aviso, não há projeção');
  const acordo = rescisaoEstimada({ ...base, tipo: 'Acordo entre as partes' });
  assert.equal(acordo.diasDeAvisoPagos, 20, 'metade de 39, arredondada para cima');
  assert.equal(acordo.verbas.find((item) => item.chave === 'aviso').valor, 2000);
  assert.equal(acordo.fgts.taxaDaMulta, 0.2);
});

test('toda regra de rescisão tem multa do FGTS definida', () => {
  for (const tipo of Object.keys(VERBAS_DA_RESCISAO).filter((chave) => !['fonte', 'confianca', 'observacao'].includes(chave))) {
    assert.ok(tipo in MULTA_DO_FGTS, tipo);
  }
});

test('todo cliente da demonstração tem o que os encargos pedem', () => {
  for (const cliente of gerarDemonstracao('2026-10-13').clientes) {
    const aliquotas = aliquotasDaEmpresa({
      regime: cliente.regime_tributario,
      anexoSimples: cliente.anexo_simples,
      fpas: cliente.fpas,
      rat: cliente.rat,
      fap: cliente.fap ?? undefined,
      desonerada: cliente.desonerada,
    });
    assert.ok(aliquotas.cota >= 0, cliente.nome);
  }
});

