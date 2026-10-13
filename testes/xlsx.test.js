/**
 * Planilha .xlsx sem dependência (lib/xlsx.js): gravar e ler de volta, com
 * acentos, números, várias abas e o número da linha do Excel.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escreverXlsx, lerXlsx } from '../lib/xlsx.js';

test('grava e lê de volta, comprimido ou não, com acentos, números e várias abas', () => {
  for (const comprimir of [true, false]) {
    const bytes = escreverXlsx(
      [
        { nome: 'Colaboradores ativos', linhas: [['Nome', 'Salário', 'Admissão'], ['Ana Conceição', 3500.5, '2024-03-01'], [], ['João & Cia <ltda>', 1621, '']] },
        { nome: 'Férias', linhas: [['Matrícula'], ['MAT001']] },
      ],
      { comprimir }
    );
    assert.equal(String.fromCharCode(bytes[0], bytes[1]), 'PK', 'é um zip');
    const lido = lerXlsx(bytes);
    assert.deepEqual(Object.keys(lido), ['Colaboradores ativos', 'Férias']);
    assert.deepEqual(lido['Colaboradores ativos'].map((linha) => [linha.numero, linha.celulas]), [
      [1, ['Nome', 'Salário', 'Admissão']],
      [2, ['Ana Conceição', '3500.5', '2024-03-01']],
      [4, ['João & Cia <ltda>', '1621']],
    ], 'a linha vazia sai, e a numeração é a do Excel');
    assert.deepEqual(lido['Férias'][1].celulas, ['MAT001']);
  }
});

test('arquivo que não é planilha é recusado', () => {
  assert.throws(() => lerXlsx(new TextEncoder().encode('nome;cpf\nAna;123')), /não é uma planilha/);
});
