/**
 * Parceiro (fase 15): white-label com checagem de contraste, a carteira só
 * com os clientes do parceiro e a exportação em CSV no formato do Excel.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contraste, coresDoParceiro, misturar } from '../lib/contraste.js';
import { resumoDaCarteira } from '../lib/carteira.js';
import { COLUNAS_DA_CARTEIRA, paraCsv } from '../lib/exportacao.js';
import { resolverAlcance } from '../lib/dados/regras.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';

const HOJE = '2026-10-13';

test('contraste: as contas da WCAG e a mistura como o color-mix do CSS', () => {
  assert.equal(contraste('#000000', '#ffffff'), 21);
  assert.equal(contraste('#ffffff', '#ffffff'), 1);
  assert.equal(misturar('#ffffff', '#000000', 0.5), '#808080');
});

test('white-label: a marca padrão e o parceiro fictício passam; cor ilegível fica de fora', () => {
  assert.deepEqual(coresDoParceiro({ violeta: '#7371ff', lilas: '#dbbfff' }).aplicar, { violeta: '#7371ff', lilas: '#dbbfff' });
  const horizonte = coresDoParceiro({ violeta: '#1f9d8b', lilas: '#c4ece4' });
  assert.ok(horizonte.aplicar && horizonte.checagens.every((item) => item.passa));
  const amarelo = coresDoParceiro({ violeta: '#ffee00', lilas: '#fffbcc' });
  assert.equal(amarelo.aplicar, null);
  assert.match(amarelo.motivo, /marca sobre o papel claro/);
  const escuro = coresDoParceiro({ violeta: '#202060', lilas: '#dbbfff' });
  assert.equal(escuro.aplicar, null, 'preto sobre azul-marinho não se lê no botão');
  assert.equal(coresDoParceiro(null).aplicar, null);
  assert.match(coresDoParceiro({ violeta: 'azul' }).motivo, /formato/);
});

test('carteira: só os clientes do parceiro, com o que pede atenção primeiro', () => {
  const dados = gerarDemonstracao(HOJE);
  const alcance = resolverAlcance({ perfil: 'parceiro', parceiro: 'contabilidade-horizonte' }, dados, {});
  const carteira = resumoDaCarteira(dados, alcance.opcoes.clientes);
  assert.deepEqual(carteira.clientes.map((cliente) => cliente.id).sort(), ['oficina-bom-motor', 'transportes-rota-sul']);
  assert.ok(!carteira.clientes.some((cliente) => cliente.id === 'teste'), 'nada da Conexão CX');
  assert.equal(carteira.numeros.pessoas, carteira.clientes.reduce((soma, cliente) => soma + cliente.pessoas, 0));
  assert.ok(carteira.clientes.every((cliente) => cliente.custo > 0 && cliente.fator > 1));
  const porAtencao = carteira.clientes.map((cliente) => cliente.atencao);
  assert.deepEqual(porAtencao, [...porAtencao].sort((a, b) => b - a));
  const porNome = resumoDaCarteira(dados, alcance.opcoes.clientes, 'nome').clientes.map((cliente) => cliente.nome);
  assert.deepEqual(porNome, [...porNome].sort((a, b) => a.localeCompare(b, 'pt-BR')));
});

test('CSV: BOM, ponto e vírgula, vírgula decimal e aspas quando precisa', () => {
  const csv = paraCsv(
    [{ rotulo: 'Nome', valor: (linha) => linha.nome }, { rotulo: 'Valor', valor: (linha) => linha.valor }],
    [{ nome: 'Ana; Lima', valor: 3200.5 }, { nome: 'Diz "oi"', valor: null }]
  );
  assert.equal(csv, '﻿Nome;Valor\r\n"Ana; Lima";3200,5\r\n"Diz ""oi""";\r\n');
  const dados = gerarDemonstracao(HOJE);
  const carteira = resumoDaCarteira(dados, dados.clientes);
  const linhas = paraCsv(COLUNAS_DA_CARTEIRA, carteira.clientes).trim().split('\r\n');
  assert.equal(linhas.length, dados.clientes.length + 1);
  assert.ok(!/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(linhas.join('')), 'nenhum CPF na exportação');
});
