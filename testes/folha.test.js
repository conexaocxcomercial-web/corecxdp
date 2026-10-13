/**
 * Folha gerencial (lib/folha.js): competência, salário vigente, benefícios,
 * totais batendo com o custo estimado, o percentual da empresa mudando os
 * encargos, 13º com avos e vencimentos, e o painel Custos.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { custoEstimado } from '../lib/calculos/custo.js';
import { avosDoAno, competenciaDe, competencias, decimoTerceiro, encargosDaEmpresa, folhaDoMes, salarioEm } from '../lib/folha.js';
import { painel } from '../lib/paineis.js';
import { recortar } from '../lib/prazos.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';

const HOJE = '2026-10-13';
const pessoa = (id, salario, admissao = '2024-01-10', extra = {}) => ({ id, matricula: id, nome: id, departamento: 'Vendas', cnpj_id: 'c1', admissao, salario, desligamento: null, contrato: 'indeterminado', ...extra });

function base(cliente = { id: 'x', regime_tributario: 'Lucro Presumido' }) {
  return {
    hoje: HOJE,
    cliente,
    cnpjs: [{ id: 'c1', nome: 'Matriz' }],
    pessoas: [pessoa('a', 3000), pessoa('b', 2000), pessoa('c', 4000, '2026-11-02')],
    movimentacoes: [{ pessoa_id: 'b', tipo: 'Alteração Salarial', efetiva: '2026-09-01', novo: { salario: 2500 } }],
    beneficios: [{ id: 'vr', nome: 'Vale-refeição', tipo: 'VR', valor_empresa: 500 }],
    adesoes: [{ pessoa_id: 'a', beneficio_id: 'vr', desde: '2024-01-10' }],
    ocorrencias: [], afastamentos: [], ferias: [], documentos: [], custos: [],
  };
}

test('competência: o mês atual vai até hoje e os anteriores até o fim do mês', () => {
  const [atual, setembro] = competencias(HOJE, 2);
  assert.deepEqual([atual.valor, atual.referencia, atual.rotulo], ['2026-10', HOJE, 'outubro de 2026']);
  assert.deepEqual([setembro.valor, setembro.referencia], ['2026-09', '2026-09-30']);
  assert.equal(competenciaDe(HOJE, '1999-01').valor, '2026-10', 'competência fora da lista vira a atual');
});

test('salário vigente: o do cadastro mais as alterações já em vigor na data', () => {
  const b = pessoa('b', 2500, '2024-01-10', { salario_cadastro: 2000 });
  const movimentacoes = base().movimentacoes;
  assert.equal(salarioEm(b, movimentacoes, '2026-08-31'), 2000);
  assert.equal(salarioEm(b, movimentacoes, '2026-09-01'), 2500);
});

test('folha do mês: só quem está no quadro, e o total bate com o custo estimado', () => {
  const dados = base();
  const folha = folhaDoMes(dados, competenciaDe(HOJE, '2026-10'));
  assert.equal(folha.pessoas.length, 2, 'c começa em novembro');
  assert.deepEqual(folha.totais, custoEstimado({ salarios: [3000, 2500], beneficios: [500] }, 0.36));
  assert.equal(Math.round(folha.composicao.reduce((soma, parte) => soma + parte.fracao, 0) * 1000) / 1000, 1, 'a composição soma 100%');
  const agosto = folhaDoMes(dados, competenciaDe(HOJE, '2026-08'));
  assert.equal(agosto.totais.salarios, 5000, 'em agosto, o salário de b ainda era 2.000');
});

test('encargos: trocar o regime ou o percentual da empresa muda os encargos', () => {
  const competencia = competenciaDe(HOJE, '2026-10');
  const presumido = folhaDoMes(base(), competencia).totais;
  const simples = folhaDoMes(base({ id: 'x', regime_tributario: 'Simples Nacional', anexo_simples: 'III' }), competencia).totais;
  const proprio = folhaDoMes(base({ id: 'x', regime_tributario: 'Lucro Presumido', percentual_encargos: 0.3 }), competencia).totais;
  assert.deepEqual([presumido.percentualDeEncargos, simples.percentualDeEncargos, proprio.percentualDeEncargos], [0.36, 0.08, 0.3]);
  assert.ok(simples.encargos < proprio.encargos && proprio.encargos < presumido.encargos);
  assert.equal(presumido.salarios, simples.salarios, 'os salários não mudam');
  assert.equal(encargosDaEmpresa({ regime_tributario: 'Simples Nacional' }).aviso, 'anexo a conferir');
  assert.equal(encargosDaEmpresa({ regime_tributario: 'Lucro Real', percentual_encargos: 4 }).aviso, 'percentual a conferir');
});

test('13º: avos pelos meses com 15 dias ou mais, metade em cada parcela, no dia útil anterior', () => {
  assert.equal(avosDoAno(pessoa('x', 1, '2026-03-17'), 2026), 10, 'março tem 15 dias (17 a 31): conta; abril a dezembro: 9');
  assert.equal(avosDoAno(pessoa('x', 1, '2026-03-18'), 2026), 9);
  const decimo = decimoTerceiro(base());
  const a = decimo.pessoas.find((item) => item.pessoa.id === 'a');
  assert.deepEqual([a.avos, a.estimado, a.primeira, a.segunda], [12, 3000, 1500, 1500]);
  assert.deepEqual(decimo.parcelas.map((parcela) => parcela.data), ['2026-11-30', '2026-12-18'], '20/12/2026 é domingo');
  assert.equal(decimo.total, 5500);
});

test('painel Custos: o custo do mês bate com a folha, e sem lista de pessoas', () => {
  const recorte = recortar(gerarDemonstracao(HOJE), { cliente: 'teste' });
  const custos = painel(recorte, 'custos', { meses: 3 });
  const total = custos.indicadores.find((item) => item.chave === 'custo-total');
  assert.equal(total.valor, folhaDoMes(recorte, competenciaDe(HOJE, '2026-10')).totais.total);
  assert.equal(total.estimativa, true);
  assert.equal(total.serie.length, 3);
  const somaDasUnidades = custos.tabela.unidade.reduce((soma, linha) => soma + linha.valores[0].valor, 0);
  assert.ok(Math.abs(somaDasUnidades - total.valor) < 1, 'as unidades somam o total');
});
