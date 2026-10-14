/**
 * Formatação curta dos gráficos (lib/formato.js): reais curtos, percentual
 * com uma casa, quantidades inteiras e a variação no mesmo formato.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emReaisCurto, formatarCurto, variacaoCurta } from '../lib/formato.js';

test('reais curtos: "R$ 241 mil", "R$ 1,2 mi", uma casa só abaixo de 10', () => {
  assert.equal(emReaisCurto(240948.8), 'R$ 241 mil');
  assert.equal(emReaisCurto(4400), 'R$ 4,4 mil');
  assert.equal(emReaisCurto(45460), 'R$ 45 mil');
  assert.equal(emReaisCurto(950.4), 'R$ 950');
  assert.equal(emReaisCurto(1234567), 'R$ 1,2 mi');
  assert.equal(emReaisCurto(999700), 'R$ 1 mi', 'não vira "1000 mil"');
  assert.equal(emReaisCurto(-2400), '−R$ 2,4 mil');
});

test('formato por tipo: nunca número cru', () => {
  assert.equal(formatarCurto(18.43, 'percentual'), '18,4%');
  assert.equal(formatarCurto(0, 'percentual'), '0,0%');
  assert.equal(formatarCurto(1.574, 'fator'), '1,57');
  assert.equal(formatarCurto(1234.6), '1.235');
  assert.equal(formatarCurto(1, 'dias'), '1 dia');
  assert.equal(formatarCurto(3.25, 'anos'), '3,3 anos');
  assert.equal(formatarCurto(null), '—');
});

test('variação: no formato do valor, e nada quando não mudou', () => {
  assert.equal(variacaoCurta(4.3, 1.5, 'percentual'), '+2,8 p.p.');
  assert.equal(variacaoCurta(1.2, 1.5, 'percentual'), '−0,3 p.p.');
  assert.equal(variacaoCurta(256259, 253900, 'reais'), '+R$ 2,4 mil');
  assert.equal(variacaoCurta(41, 38), '+3');
  assert.equal(variacaoCurta(3, 3), null);
  assert.equal(variacaoCurta(5, null), null);
});
