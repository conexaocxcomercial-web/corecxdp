/**
 * Indicadores em três camadas (lib/paineis.js): período, contas do quadro,
 * absenteísmo, a regra dos menos de 3 (LGPD) e do número à pessoa.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OCULTO, ativaEm, central, detalhe, formatarIndicador, painel, periodoDe } from '../lib/paineis.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import { recortar } from '../lib/prazos.js';

const HOJE = '2026-10-13';
const pessoa = (id, departamento, admissao, desligamento = null, extra = {}) => ({
  id, matricula: id.toUpperCase(), nome: `Pessoa ${id}`, departamento, cnpj_id: 'c1', admissao,
  desligamento: desligamento ? { data: desligamento, tipo: 'Pedido de demissão', motivo: 'x' } : null, contrato: 'indeterminado', ...extra,
});

function base() {
  return {
    hoje: HOJE,
    cliente: { id: 'x' },
    cnpjs: [{ id: 'c1', nome: 'Matriz' }],
    pessoas: [
      pessoa('a', 'Vendas', '2020-01-10'),
      pessoa('b', 'Vendas', '2021-05-03'),
      pessoa('c', 'Vendas', '2026-10-01', null, { contrato: 'experiência' }),
      pessoa('d', 'Vendas', '2019-03-01', '2026-10-05'),
      pessoa('e', 'TI', '2022-02-01'),
      pessoa('f', 'TI', '2023-07-01'),
    ],
    ocorrencias: [
      { id: 'o1', pessoa_id: 'a', tipo: 'Falta Injustificada', data: '2026-10-06' },
      { id: 'o2', pessoa_id: 'a', tipo: 'Falta Justificada', data: '2026-10-07' },
      { id: 'o3', pessoa_id: 'e', tipo: 'Atraso', data: '2026-10-07' },
    ],
    afastamentos: [
      { id: 'x1', pessoa_id: 'b', tipo: 'Doença', inicio: '2026-10-08', fim_previsto: '2026-10-14', retorno: null, atestado: { cid: 'J11' }, validacao: 'Aprovado' },
      { id: 'x2', pessoa_id: 'e', tipo: 'Doença', inicio: '2026-10-05', fim_previsto: '2026-10-06', retorno: null, atestado: { cid: 'J11' }, validacao: 'Rejeitado' },
    ],
    movimentacoes: [
      { id: 'm1', pessoa_id: 'a', tipo: 'Promoção', efetiva: '2026-09-01' },
      { id: 'm2', pessoa_id: 'd', tipo: 'Desligamento', efetiva: '2026-10-05' },
    ],
    ferias: [], documentos: [], adesoes: [], custos: [], beneficios: [],
  };
}

test('período: os últimos meses até hoje, com os dias úteis (12/10 é feriado)', () => {
  const periodo = periodoDe(HOJE, 3);
  assert.deepEqual(periodo.map((mes) => mes.rotulo), ['ago/26', 'set/26', 'out/26']);
  assert.equal(periodo[2].fim, HOJE, 'o mês corrente vai até hoje');
  assert.equal(periodo[2].diasUteis, 8, 'de 1 a 13/10/2026: 9 dias de semana, menos o feriado de 12/10');
});

test('quadro: ativas hoje, o último dia ainda conta, e o turnover sobre o quadro médio', () => {
  const dados = base();
  assert.equal(ativaEm(dados.pessoas[3], '2026-10-05'), true, 'o último dia de trabalho ainda é no quadro');
  assert.equal(ativaEm(dados.pessoas[3], '2026-10-06'), false);
  const quadro = painel(dados, 'quadro', { meses: 1 });
  const valor = (chave) => quadro.indicadores.find((item) => item.chave === chave).valor;
  assert.equal(valor('ativos'), 5);
  assert.equal(valor('admissoes'), 1);
  // Outubro: começo com 5 (a, b, d, e, f), fim com 5 (c entrou, d saiu): médio 5; (1 + 1) / 2 / 5 = 20%.
  assert.equal(formatarIndicador(valor('turnover'), 'percentual'), '20,0%');
  assert.equal(valor('experiencia'), 1);
});

test('absenteísmo: faltas e dias úteis de atestado válidos, sem o rejeitado', () => {
  const dados = base();
  const saude = painel(dados, 'saude', { meses: 1 });
  const valor = (chave) => saude.indicadores.find((item) => item.chave === chave).valor;
  // Faltas: 2. Atestado de b de 08 a 13/10 (até hoje): 8, 9 e 13 são úteis (10 e 11 fim de semana, 12 feriado) = 3.
  // Quadro médio 5 × 8 dias úteis = 40. (2 + 3) / 40 = 12,5%.
  assert.equal(formatarIndicador(valor('absenteismo'), 'percentual'), '12,5%');
  assert.equal(valor('dias-de-atestado'), 6, 'dias corridos de 08 a 13/10');
  assert.equal(valor('faltas'), 2);
  assert.equal(valor('afastadas'), 1);
});

test('LGPD: saúde num grupo de menos de 3 pessoas fica oculta, e saúde nunca lista pessoas', () => {
  const dados = base();
  const ti = painel(dados, 'saude', { meses: 1, departamento: 'TI' });
  assert.equal(ti.oculto, true, 'TI tem 2 pessoas');
  const absenteismo = ti.indicadores.find((item) => item.chave === 'absenteismo');
  assert.deepEqual([absenteismo.valor, absenteismo.apoio, absenteismo.serie], [null, OCULTO, null]);
  assert.equal(ti.indicadores.find((item) => item.chave === 'faltas').oculto, false, 'faltas não é dado de saúde');

  const recortes = detalhe(dados, 'saude', 'absenteismo', { meses: 1 }).recortes.departamento;
  assert.deepEqual(recortes.map((grupo) => [grupo.rotulo, grupo.oculto]), [['TI', true], ['Vendas', false]]);
  assert.equal(detalhe(dados, 'saude', 'absenteismo', { meses: 1 }).pessoas, null, 'saúde não lista pessoas');
  assert.ok(detalhe(dados, 'saude', 'faltas', { meses: 1 }).pessoas.length === 1);
});

test('do número à pessoa: o detalhe lista quem está por trás, com a aba certa da ficha', () => {
  const dados = base();
  const saidas = detalhe(dados, 'quadro', 'turnover', { meses: 1 }).pessoas;
  assert.deepEqual(saidas.map((item) => [item.pessoa.matricula, item.aba]), [['D', 'desligamento']]);
  const promocoes = detalhe(dados, 'movimentacoes', 'promocoes', { meses: 3 }).pessoas;
  assert.deepEqual(promocoes.map((item) => item.pessoa.matricula), ['A']);
  assert.equal(detalhe(dados, 'quadro', 'nao-existe'), null);
  assert.equal(painel(dados, 'nao-existe'), null);
});

test('demonstração: a central tem os temas e os números batem com os painéis', () => {
  const recorte = recortar(gerarDemonstracao(HOJE), { cliente: 'teste' });
  const temas = central(recorte, { meses: 12 });
  assert.deepEqual(temas.map((tema) => tema.chave), ['quadro', 'saude', 'ferias', 'movimentacoes']);
  const quadro = painel(recorte, 'quadro', { meses: 12 });
  assert.equal(temas[0].principal.valor, quadro.indicadores[0].valor);
  assert.equal(quadro.indicadores[0].serie.length, 12);
  assert.ok(quadro.tabela.unidade.length === 3, 'a Empresa Teste tem matriz e 2 filiais');
  const somaDasUnidades = quadro.tabela.unidade.reduce((soma, linha) => soma + linha.pessoas, 0);
  assert.equal(somaDasUnidades, quadro.indicadores[0].valor, 'as unidades somam o quadro');
});
