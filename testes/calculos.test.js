/**
 * Custo estimado de pessoal (lib/calculos/custo.js): a ordem de grandeza dos
 * custos, com provisões, um percentual de encargos por regime, benefícios,
 * total e fator de custo. Cálculos trabalhistas são da contabilidade.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centavos } from '../lib/calculos/dinheiro.js';
import { FaltaDadoDaEmpresa, custoEstimado, percentualDeEncargos, provisoes } from '../lib/calculos/custo.js';
import { ENCARGOS_PADRAO } from '../lib/tabelas.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';

test('centavos: meio para cima, sem o erro do ponto flutuante', () => {
  assert.equal(centavos(121.575), 121.58);
  assert.equal(centavos(1621 * 0.075), 121.58);
  assert.equal(centavos(2.004), 2);
});

test('provisões: férias é salário ÷ 12 mais 1/3; 13º é salário ÷ 12', () => {
  assert.deepEqual(provisoes(3000), { ferias: 333.33, decimoTerceiro: 250, total: 583.33 });
  assert.deepEqual(provisoes(0), { ferias: 0, decimoTerceiro: 0, total: 0 });
});

test('encargos: percentual único por regime, configurável pela empresa', () => {
  assert.deepEqual(
    [
      percentualDeEncargos({ regime: 'Simples Nacional', anexoSimples: 'III' }).percentual,
      percentualDeEncargos({ regime: 'Simples Nacional', anexoSimples: 'IV' }).percentual,
      percentualDeEncargos({ regime: 'Lucro Presumido' }).percentual,
      percentualDeEncargos({ regime: 'Lucro Real' }).percentual,
    ],
    [0.08, 0.36, 0.36, 0.36]
  );
  const proprio = percentualDeEncargos({ regime: 'Lucro Real', percentualEncargos: 0.38 });
  assert.deepEqual([proprio.percentual, proprio.origem], [0.38, 'empresa']);
  assert.equal(percentualDeEncargos({ regime: 'Lucro Presumido' }).origem, 'padrao');
  const semAnexo = percentualDeEncargos({ regime: 'Simples Nacional' });
  assert.deepEqual([semAnexo.percentual, semAnexo.aviso], [0.08, 'anexo a conferir'], 'sem o anexo: 8%, sem erro');
  const semRegime = percentualDeEncargos({});
  assert.deepEqual([semRegime.percentual, semRegime.aviso], [0.08, 'regime a conferir'], 'sem o regime: 8%, sem erro');
  assert.equal(percentualDeEncargos({ regime: 'Lucro Real' }).aviso, null);
  assert.equal(percentualDeEncargos({ percentualEncargos: 0.3 }).aviso, null, 'o percentual próprio não depende do regime');
  assert.throws(() => percentualDeEncargos({ regime: 'Lucro Real', percentualEncargos: 3.6 }), FaltaDadoDaEmpresa, '360% é erro de digitação');
});

test('custo estimado: salários, provisões, encargos, benefícios, total e fator', () => {
  // Salários 3.000 + 2.000 = 5.000; provisões 972,23 (férias 555,56 + 13º 416,67);
  // encargos 36% sobre 5.972,23 = 2.150,00; benefícios 700; total 8.822,23; fator 1,76.
  const custo = custoEstimado({ salarios: [3000, 2000], beneficios: [500, 200] }, 0.36);
  assert.deepEqual(custo.provisoes, { ferias: 555.56, decimoTerceiro: 416.67, total: 972.23 });
  assert.deepEqual([custo.salarios, custo.encargos, custo.beneficios, custo.total, custo.fatorDeCusto], [5000, 2150, 700, 8822.23, 1.76]);
  // No Simples (só FGTS, 8%), o fator fica bem mais baixo: 3.000 + 583,33 + 286,67.
  const simples = custoEstimado({ salarios: [3000] }, 0.08);
  assert.deepEqual([simples.encargos, simples.total, simples.fatorDeCusto], [286.67, 3870, 1.29]);
  assert.equal(custoEstimado({ salarios: [] }, 0.36).fatorDeCusto, null, 'sem salários, sem fator');
});

test('todo cliente da demonstração tem um percentual de encargos', () => {
  const clientes = gerarDemonstracao('2026-10-13').clientes;
  for (const cliente of clientes) {
    const { percentual } = percentualDeEncargos({
      regime: cliente.regime_tributario,
      anexoSimples: cliente.anexo_simples,
      percentualEncargos: cliente.percentual_encargos,
    });
    assert.ok(percentual >= 0 && percentual <= 0.8, cliente.nome);
  }
  assert.ok(clientes.some((cliente) => cliente.percentual_encargos !== null), 'um cliente mostra o percentual configurado');
  assert.equal(Object.keys(ENCARGOS_PADRAO).length, 4);
});
