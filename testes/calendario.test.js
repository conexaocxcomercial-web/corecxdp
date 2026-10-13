/** Feriados nacionais e dia útil (lib/calendario.js). Rodar com `npm test`. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diaDe, diaUtilAnterior, ehDiaUtil, feriadoEm, isoDe, motivoDeNaoSerUtil, pascoa } from '../lib/calendario.js';

test('Páscoa e Sexta-feira da Paixão', () => {
  assert.equal(isoDe(pascoa(2026)), '2026-04-05');
  assert.equal(isoDe(pascoa(2027)), '2027-03-28');
  assert.equal(feriadoEm(diaDe('2026-04-03')), 'Sexta-feira da Paixão');
});

test('feriados nacionais de data fixa, inclusive 20 de novembro', () => {
  for (const data of ['2026-01-01', '2026-04-21', '2026-05-01', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25']) {
    assert.ok(feriadoEm(diaDe(data)), data);
  }
  assert.equal(feriadoEm(diaDe('2026-02-17')), null, 'Carnaval é ponto facultativo, não feriado nacional');
});

test('dia útil anterior: fim de semana e feriado antecipam', () => {
  assert.equal(isoDe(diaUtilAnterior(diaDe('2026-12-20'))), '2026-12-18'); // domingo
  assert.equal(isoDe(diaUtilAnterior(diaDe('2026-12-19'))), '2026-12-18'); // sábado
  assert.equal(isoDe(diaUtilAnterior(diaDe('2026-11-20'))), '2026-11-19'); // feriado numa sexta
  assert.equal(isoDe(diaUtilAnterior(diaDe('2026-04-05'))), '2026-04-02'); // Páscoa, com a Sexta da Paixão antes
  assert.equal(isoDe(diaUtilAnterior(diaDe('2026-11-30'))), '2026-11-30'); // segunda comum fica
  assert.ok(!ehDiaUtil(diaDe('2026-12-25')));
  assert.equal(motivoDeNaoSerUtil(diaDe('2026-12-20')), 'domingo');
  assert.equal(motivoDeNaoSerUtil(diaDe('2026-11-20')), 'Dia Nacional de Zumbi e da Consciência Negra');
});
