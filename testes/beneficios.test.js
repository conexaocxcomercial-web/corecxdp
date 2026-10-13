/**
 * Benefícios (lib/beneficios.js): cadastro do catálogo, adesão e
 * encerramento, quem tem e quem não tem, e o custo entrando na folha
 * gerencial e no painel Benefícios. Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroDeBeneficio, emVigor, montarAdesao, montarBeneficio, montarEncerramento, resumoDosBeneficios } from '../lib/beneficios.js';
import { competenciaDe, folhaDoMes } from '../lib/folha.js';
import { painel } from '../lib/paineis.js';
import { recortar } from '../lib/prazos.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import { criarMemoria } from '../lib/demo/memoria.js';

const HOJE = '2026-10-13';

test('catálogo: tipo, nome sem repetir, valor em reais e desconto em percentual', () => {
  assert.deepEqual(montarBeneficio({ tipo: 'VR', nome: 'Vale-refeição', valor: '660,00', desconto: '10' }), {
    tipo: 'VR', nome: 'Vale-refeição', valor_empresa: 660, desconto_percentual: 0.1,
  });
  assert.equal(montarBeneficio({ tipo: 'Outros', nome: '', valor: '18' }).nome, 'Outros');
  assert.throws(() => montarBeneficio({ tipo: 'VT', valor: '220', desconto: '8' }), /até 6%/);
  assert.throws(() => montarBeneficio({ tipo: 'VR', valor: '' }), ErroDeBeneficio);
  assert.throws(() => montarBeneficio({ tipo: 'Bônus', valor: '10' }), /tipo/);
  const existentes = [{ id: 'b1', nome: 'Vale-refeição' }];
  assert.throws(() => montarBeneficio({ tipo: 'VR', nome: 'vale-refeição', valor: '1' }, { existentes }), /Já existe/);
  assert.ok(montarBeneficio({ tipo: 'VR', nome: 'Vale-refeição', valor: '700' }, { existentes, id: 'b1' }), 'o próprio benefício pode manter o nome');
});

test('adesão: sem repetir a que está em vigor, dentro do contrato, e o encerramento', () => {
  const pessoa = { id: 'p1', nome: 'Ana', admissao: '2024-01-10', desligamento: null };
  const beneficio = { id: 'b1', nome: 'Vale-refeição' };
  assert.deepEqual(montarAdesao({}, { pessoa, beneficio, hoje: HOJE }), { pessoa_id: 'p1', beneficio_id: 'b1', desde: HOJE, ate: null });
  const adesoes = [{ pessoa_id: 'p1', beneficio_id: 'b1', desde: '2024-01-10', ate: null }];
  assert.throws(() => montarAdesao({}, { pessoa, beneficio, adesoes, hoje: HOJE }), /já tem/);
  assert.ok(montarAdesao({}, { pessoa, beneficio, adesoes: [{ ...adesoes[0], ate: '2026-01-31' }], hoje: HOJE }), 'a anterior foi encerrada');
  assert.throws(() => montarAdesao({ desde: '2023-01-01' }, { pessoa, beneficio, hoje: HOJE }), /admissão/);
  assert.deepEqual(montarEncerramento(adesoes[0], { ate: '2026-10-31' }, { hoje: HOJE }), { ate: '2026-10-31' });
  assert.throws(() => montarEncerramento(adesoes[0], { ate: '2023-12-31' }, { hoje: HOJE }), /antes do começo/);
  assert.equal(emVigor({ desde: '2024-01-10', ate: '2026-10-31' }, '2026-11-01'), false);
});

test('demonstração: quem tem e quem não tem somam o quadro, e o custo é o da folha', () => {
  const recorte = recortar(gerarDemonstracao(HOJE), { cliente: 'teste' });
  const resumo = resumoDosBeneficios(recorte);
  for (const beneficio of resumo.catalogo) {
    assert.equal(beneficio.aderentes.length + beneficio.semEle.length, resumo.numeros.pessoas, beneficio.nome);
  }
  const folha = folhaDoMes(recorte, competenciaDe(HOJE, '2026-10')).totais;
  assert.equal(resumo.numeros.custoMensal, folha.beneficios, 'o custo dos benefícios é o mesmo da folha gerencial');
  const indicador = painel(recorte, 'beneficios', { meses: 3 }).indicadores.find((item) => item.chave === 'custo-mensal');
  assert.equal(indicador.valor, resumo.numeros.custoMensal);
});

test('o custo entra na folha gerencial: mudar o valor, incluir e encerrar mudam o total', () => {
  const memoria = criarMemoria(gerarDemonstracao(HOJE), { cabecalho: [], registros: [] });
  const total = () => folhaDoMes(recortar(memoria.dados, { cliente: 'teste' }), competenciaDe(HOJE, '2026-10')).totais;
  const antes = total();
  const vr = memoria.dados.beneficios.find((item) => item.cliente_id === 'teste' && item.tipo === 'VR');
  // Quem tem VR em vigor hoje (a admissão marcada ainda não conta).
  const comVr = resumoDosBeneficios(recortar(memoria.dados, { cliente: 'teste' })).catalogo.find((item) => item.id === vr.id).aderentes.length;
  memoria.alterar('beneficios', vr.id, { valor_empresa: vr.valor_empresa + 100 });
  const depois = total();
  assert.equal(Math.round((depois.beneficios - antes.beneficios) * 100) / 100, comVr * 100, '+R$ 100 por pessoa com VR');
  assert.ok(depois.total > antes.total);
  const adesao = memoria.dados.adesoes.find((item) => item.beneficio_id === vr.id && item.desde <= HOJE);
  memoria.alterar('adesoes', adesao.id, { ate: '2026-09-30' });
  assert.equal(Math.round((depois.beneficios - total().beneficios) * 100) / 100, vr.valor_empresa, 'a adesão encerrada sai do custo');
});
