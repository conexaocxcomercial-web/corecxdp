/**
 * Férias (lib/ferias.js): situação pelas datas, períodos e saldo, regras da
 * programação (parcelas, início antes do descanso), prazos de aviso e
 * pagamento, e o resumo batendo com a ficha e os indicadores.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroDeFerias, montarFerias, motivoParaNaoComecar, periodosDaPessoa, prazosDaProgramacao, resumoDasFerias, situacaoAtual,
} from '../lib/ferias.js';
import { painel } from '../lib/paineis.js';
import { saldoDeFerias } from '../lib/pessoas.js';
import { recortar } from '../lib/prazos.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';

const HOJE = '2026-10-13';
const pessoa = { id: 'p1', matricula: 'MAT001', admissao: '2023-03-01', desligamento: null, contrato: 'indeterminado' };
const periodo = (extra) => ({
  id: 'f1', pessoa_id: 'p1', aquisitivo_inicio: '2025-03-01', aquisitivo_fim: '2026-02-28', concessivo_fim: '2027-02-28',
  situacao: 'a programar', inicio: null, dias: 30, ...extra,
});

test('situação pelas datas: o gozo anda sozinho e os dias por tirar vencem', () => {
  const gozo = { ...periodo(), situacao: 'programada', inicio: '2026-10-05', dias: 10 };
  assert.equal(situacaoAtual(gozo, '2026-10-04').situacao, 'programada');
  assert.equal(situacaoAtual(gozo, '2026-10-14').situacao, 'em andamento', 'o último dia (14/10) ainda é férias');
  assert.equal(situacaoAtual(gozo, '2026-10-15').situacao, 'gozada');
  assert.equal(situacaoAtual(periodo({ concessivo_fim: '2026-11-30' }), HOJE).situacao, 'a vencer');
  assert.equal(situacaoAtual(periodo({ concessivo_fim: '2026-10-12' }), HOJE).situacao, 'vencida');
  const pedido = { ...periodo(), situacao: 'aguardando aprovação', inicio: '2026-11-03' };
  assert.equal(situacaoAtual(pedido, '2026-12-01').situacao, 'aguardando aprovação', 'o pedido espera a Gestão');
});

test('início: nunca em dia de descanso nem nos 2 dias antes do domingo ou de feriado', () => {
  assert.equal(motivoParaNaoComecar('2026-10-19'), null, 'segunda-feira');
  assert.match(motivoParaNaoComecar('2026-10-23'), /domingo/, 'sexta: domingo em 2 dias');
  assert.match(motivoParaNaoComecar('2026-10-24'), /domingo/, 'sábado');
  assert.match(motivoParaNaoComecar('2026-10-25'), /descanso/, 'domingo');
  assert.match(motivoParaNaoComecar('2026-11-18'), /Consciência Negra/, 'quarta: 20/11 é feriado');
});

test('prazos: aviso 30 dias antes, pagamento 2 dias antes no dia útil anterior', () => {
  assert.deepEqual(prazosDaProgramacao('2026-11-03'), { aviso: '2026-10-04', pagamento: '2026-10-30', notaDoPagamento: '01/11 é domingo' });
  assert.equal(prazosDaProgramacao('2026-11-05').pagamento, '2026-11-03');
});

test('programar: parcelas de 5 ou mais, uma de 14 ou mais, até 3, e o resto fica por tirar', () => {
  const ferias = [periodo()];
  const base = { periodo: '2025-03-01', inicio: '2026-11-03', aprovadas: true };
  const vinte = montarFerias({ ...base, dias: 20 }, { pessoa, ferias, hoje: HOJE });
  assert.deepEqual([vinte.alvo, vinte.campos.situacao, vinte.campos.dias, vinte.resto.dias, vinte.fim], ['f1', 'programada', 20, 10, '2026-11-22']);
  assert.equal(montarFerias({ ...base, dias: 30, aprovadas: false }, { pessoa, ferias, hoje: HOJE }).campos.situacao, 'aguardando aprovação');
  assert.throws(() => montarFerias({ ...base, dias: 27 }, { pessoa, ferias, hoje: HOJE }), /Sobrariam 3 dias/);
  assert.throws(() => montarFerias({ ...base, dias: 4 }, { pessoa, ferias, hoje: HOJE }), /de 5 a 30/);
  assert.throws(() => montarFerias({ ...base, dias: 31 }, { pessoa, ferias, hoje: HOJE }), ErroDeFerias);
  // Já há uma parcela de 10: programar 10 de 20 deixaria 10, e nenhuma teria 14.
  const comParcela = [periodo({ dias: 20 }), { ...periodo(), id: 'f2', situacao: 'gozada', inicio: '2026-06-01', dias: 10 }];
  assert.throws(() => montarFerias({ ...base, dias: 10 }, { pessoa, ferias: comParcela, hoje: HOJE }), /14 dias/);
  assert.ok(montarFerias({ ...base, dias: 14 }, { pessoa, ferias: comParcela, hoje: HOJE }));
  // Duas parcelas já tiradas: a terceira leva tudo o que falta.
  const duas = [periodo({ dias: 10 }), { ...periodo(), id: 'f2', situacao: 'gozada', inicio: '2026-04-01', dias: 14 }, { ...periodo(), id: 'f3', situacao: 'gozada', inicio: '2026-06-01', dias: 6 }];
  assert.throws(() => montarFerias({ ...base, dias: 5 }, { pessoa, ferias: duas, hoje: HOJE }), /até 3 parcelas/);
  assert.ok(montarFerias({ ...base, dias: 10 }, { pessoa, ferias: duas, hoje: HOJE }));
});

test('programar: não sobrepõe outras férias nem afastamento, e avisa dobro e aviso fora do prazo', () => {
  const ferias = [periodo(), { ...periodo(), id: 'g', aquisitivo_inicio: '2024-03-01', situacao: 'programada', inicio: '2026-11-09', dias: 10 }];
  const base = { periodo: '2025-03-01', aprovadas: true, dias: 15 };
  assert.throws(() => montarFerias({ ...base, inicio: '2026-11-03' }, { pessoa, ferias, hoje: HOJE }), /Já há férias/);
  const afastamentos = [{ inicio: '2026-11-30', fim_previsto: '2026-12-10', retorno: null, validacao: 'Aprovado' }];
  assert.throws(() => montarFerias({ ...base, inicio: '2026-11-24' }, { pessoa, ferias: [periodo()], afastamentos, hoje: HOJE }), /afastada/);
  const perto = montarFerias({ ...base, inicio: '2026-10-19' }, { pessoa, ferias: [periodo()], hoje: HOJE });
  assert.equal(perto.avisoFora, true, 'menos de 30 dias de antecedência');
  const vencida = montarFerias({ ...base, dias: 30, inicio: '2026-10-19' }, { pessoa, ferias: [periodo({ concessivo_fim: '2026-10-01', situacao: 'vencida' })], hoje: HOJE });
  assert.equal(vencida.emDobro, true);
  assert.throws(() => montarFerias({ ...base, inicio: '2026-10-05' }, { pessoa, ferias: [periodo()], hoje: HOJE }), /já passou/);
  assert.throws(() => montarFerias(base, { pessoa: { ...pessoa, desligamento: { data: '2026-11-01' } }, ferias: [periodo()], hoje: HOJE }), /rescisão/);
});

test('períodos: o saldo do período junta as partes por tirar', () => {
  const ferias = [periodo({ dias: 10 }), { ...periodo(), id: 'f2', situacao: 'programada', inicio: '2026-11-03', dias: 20 }];
  const [unico] = periodosDaPessoa(pessoa, ferias);
  assert.deepEqual([unico.saldo, unico.parcelas.length, unico.vencido], [10, 1, false]);
});

test('demonstração: vencidas e programadas batem com a ficha e com o painel de Férias', () => {
  const recorte = recortar(gerarDemonstracao(HOJE), { cliente: 'teste' });
  const resumo = resumoDasFerias(recorte);
  assert.ok(resumo.vencidas.length >= 1 && resumo.programadas.length >= 1 && resumo.paraAprovar >= 1);
  const comVencida = resumo.vencidas[0];
  const pessoaDela = recorte.pessoas.find((item) => item.matricula === comVencida.pessoa.matricula);
  assert.ok(saldoDeFerias(pessoaDela, recorte.ferias, HOJE).vencidos > 0, 'a ficha mostra os dias vencidos');
  const ferias = painel(recorte, 'ferias', { meses: 12 });
  const valor = (chave) => ferias.indicadores.find((item) => item.chave === chave).valor;
  assert.equal(valor('vencidas'), resumo.numeros.vencidas);
  assert.equal(valor('programadas'), resumo.numeros.programadas);
  assert.equal(valor('de-ferias'), resumo.numeros.deFerias);
  assert.equal(valor('de-ferias'), recorte.pessoas.filter((item) => recorte.ferias.some((f) => f.pessoa_id === item.id && f.situacao === 'em andamento')).length);
});
