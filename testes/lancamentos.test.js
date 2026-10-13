/**
 * Regras do Lançar (lib/lancamentos.js), a memória da demonstração recebendo
 * registros novos e os valores vigentes pelas movimentações. Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroDeLancamento,
  montarAfastamento,
  montarDesligamento,
  montarMovimentacao,
  montarOcorrencia,
  montarRetorno,
  paraValor,
} from '../lib/lancamentos.js';
import { aplicarMovimentacoes, situacoes } from '../lib/pessoas.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import { criarMemoria } from '../lib/demo/memoria.js';
import { listarPrazos, recortar } from '../lib/prazos.js';

const HOJE = '2026-10-13';
const pessoa = { id: 'p1', matricula: 'MAT001', admissao: '2024-02-01', desligamento: null, departamento: 'Tecnologia', cnpj_id: 'c-matriz', salario: 3000, contrato: 'indeterminado' };

test('afastamento: tipo, período, atestado obrigatório na doença e CID', () => {
  const doenca = montarAfastamento({ tipo: 'Doença', inicio: '2026-10-10', dias: '3', cid: 'j11' }, { pessoa });
  assert.deepEqual([doenca.fim_previsto, doenca.atestado.cid, doenca.validacao, doenca.inss], ['2026-10-12', 'J11', 'Pendente', false]);
  assert.throws(() => montarAfastamento({ tipo: 'Doença', inicio: '2026-10-10', dias: 3 }, { pessoa }), ErroDeLancamento, 'doença pede o CID');
  const semCid = montarAfastamento({ tipo: 'Acidente de trabalho', inicio: '2026-10-10', dias: 20, cidNaoInformado: true }, { pessoa });
  assert.deepEqual([semCid.atestado.cid, semCid.inss], ['não informado', true]);
  const licenca = montarAfastamento({ tipo: 'Licença não remunerada', inicio: '2026-10-10', dias: 30 }, { pessoa });
  assert.deepEqual([licenca.atestado, licenca.validacao], [null, null], 'licença sem atestado');
  const comAtestado = montarAfastamento({ tipo: 'Outros', inicio: '2026-10-10', dias: 2, comAtestado: true, cid: 'R51', validacao: 'Aprovado' }, { pessoa });
  assert.equal(comAtestado.validacao, 'Aprovado');
  assert.throws(() => montarAfastamento({ tipo: 'Férias', inicio: '2026-10-10', dias: 2 }, { pessoa }), ErroDeLancamento);
  assert.throws(() => montarAfastamento({ tipo: 'Doença', inicio: '2023-01-10', dias: 2, cid: 'J11' }, { pessoa }), /antes da admissão/);
  assert.throws(() => montarAfastamento({ tipo: 'Doença', inicio: '2026-10-10', dias: 0, cid: 'J11' }, { pessoa }), ErroDeLancamento);
  assert.throws(() => montarAfastamento({ tipo: 'Doença', inicio: '2026-10-10', dias: 2, cid: 'gripe' }, { pessoa }), /CID/);
});

test('afastamento: não sobrepõe outro no mesmo período (rejeitado não conta)', () => {
  const existentes = [{ inicio: '2026-10-05', fim_previsto: '2026-10-11', retorno: null, validacao: 'Aprovado' }];
  assert.throws(() => montarAfastamento({ tipo: 'Doença', inicio: '2026-10-10', dias: 2, cid: 'J11' }, { pessoa, existentes }), /Já há um afastamento/);
  assert.ok(montarAfastamento({ tipo: 'Doença', inicio: '2026-10-12', dias: 2, cid: 'J11' }, { pessoa, existentes }));
  const voltou = [{ ...existentes[0], retorno: '2026-10-08' }];
  assert.ok(montarAfastamento({ tipo: 'Doença', inicio: '2026-10-09', dias: 2, cid: 'J11' }, { pessoa, existentes: voltou }), 'voltou antes do previsto');
  const rejeitado = [{ ...existentes[0], validacao: 'Rejeitado' }];
  assert.ok(montarAfastamento({ tipo: 'Doença', inicio: '2026-10-10', dias: 2, cid: 'J11' }, { pessoa, existentes: rejeitado }));
});

test('retorno: depois do início, até hoje e até o dia seguinte ao fim previsto', () => {
  const afastamento = { inicio: '2026-10-01', fim_previsto: '2026-10-20', retorno: null };
  assert.deepEqual(montarRetorno(afastamento, { data: '2026-10-12' }, { hoje: HOJE }), { retorno: '2026-10-12' });
  assert.throws(() => montarRetorno(afastamento, { data: '2026-10-14' }, { hoje: HOJE }), /ainda não chegou/);
  assert.throws(() => montarRetorno(afastamento, { data: '2026-10-01' }, { hoje: HOJE }), ErroDeLancamento);
  assert.throws(() => montarRetorno({ ...afastamento, retorno: '2026-10-05' }, { data: '2026-10-12' }, { hoje: HOJE }), /já foi registrado/);
});

test('ocorrência: justificativa pelo tipo de falta, sem data futura', () => {
  assert.equal(montarOcorrencia({ tipo: 'Falta Injustificada', data: '2026-10-09', justificada: 'Sim', motivo: 'Não veio.' }, { pessoa, hoje: HOJE }).justificada, 'Não');
  assert.equal(montarOcorrencia({ tipo: 'Atraso', data: '2026-10-09', justificada: 'Sim', motivo: 'Trânsito.' }, { pessoa, hoje: HOJE }).justificada, 'Sim');
  assert.throws(() => montarOcorrencia({ tipo: 'Atraso', data: '2026-10-20', motivo: 'Trânsito.' }, { pessoa, hoje: HOJE }), /ainda não chegou/);
  assert.throws(() => montarOcorrencia({ tipo: 'Atraso', data: '2026-10-09', motivo: '' }, { pessoa, hoje: HOJE }), /motivo/);
});

test('movimentação: o que muda por tipo, e valores em reais', () => {
  assert.equal(paraValor('3.500,00'), 3500);
  assert.equal(paraValor('R$ 4.250,5'), 4250.5);
  assert.equal(paraValor('3500.75'), 3500.75);
  assert.equal(paraValor(''), null);
  assert.ok(Number.isNaN(paraValor('três mil')));
  const cnpjs = [{ id: 'c-matriz' }, { id: 'c-filial' }];
  const reajuste = montarMovimentacao({ tipo: 'Alteração Salarial', efetiva: '2026-11-01', novoSalario: '3.300,00', motivo: 'Mérito.' }, { pessoa, cnpjs });
  assert.deepEqual([reajuste.novo, reajuste.checklist], [{ salario: 3300 }, 'Concluído']);
  assert.throws(() => montarMovimentacao({ tipo: 'Alteração Salarial', efetiva: '2026-11-01', motivo: 'Mérito.' }, { pessoa, cnpjs }), /novo salário/);
  assert.throws(() => montarMovimentacao({ tipo: 'Promoção', efetiva: '2026-11-01', motivo: 'Mérito.' }, { pessoa, cnpjs }), /novo cargo/);
  const transferencia = montarMovimentacao({ tipo: 'Transferência', efetiva: '2026-11-01', novaUnidade: 'c-filial', motivo: 'Nova loja.' }, { pessoa, cnpjs });
  assert.deepEqual(transferencia.novo, { cnpj_id: 'c-filial' });
  assert.throws(() => montarMovimentacao({ tipo: 'Transferência', efetiva: '2026-11-01', novaUnidade: 'outra', motivo: 'x y z' }, { pessoa, cnpjs }), /não é deste cliente/);
  assert.throws(() => montarMovimentacao({ tipo: 'Desligamento', efetiva: '2026-11-01', motivo: 'x y z' }, { pessoa, cnpjs }), ErroDeLancamento, 'desligamento tem fluxo próprio');
});

test('desligamento: uma vez só, até 60 dias à frente, experiência só para quem está nela', () => {
  const item = montarDesligamento({ tipo: 'Pedido de demissão', data: '2026-10-30', motivo: 'Outra proposta.' }, { pessoa, hoje: HOJE });
  assert.deepEqual(item, { data: '2026-10-30', tipo: 'Pedido de demissão', motivo: 'Outra proposta.' });
  assert.throws(() => montarDesligamento({ tipo: 'Pedido de demissão', data: '2027-01-30', motivo: 'x y z' }, { pessoa, hoje: HOJE }), /60 dias/);
  assert.throws(() => montarDesligamento({ tipo: 'Término de contrato de experiência', data: '2026-10-30', motivo: 'x y z' }, { pessoa, hoje: HOJE }), /experiência/);
  assert.throws(
    () => montarDesligamento({ tipo: 'Pedido de demissão', data: '2026-10-30', motivo: 'x y z' }, { pessoa: { ...pessoa, desligamento: { data: '2026-09-01' } }, hoje: HOJE }),
    /já tem desligamento/
  );
});

test('valores vigentes: só as movimentações já em vigor mudam salário, cargo e unidade', () => {
  const movimentacoes = [
    { pessoa_id: 'p1', efetiva: '2026-09-01', novo: { salario: 3300 } },
    { pessoa_id: 'p1', efetiva: '2026-10-01', novo: { cargo: 'Analista Pleno', cnpj_id: 'c-filial' } },
    { pessoa_id: 'p1', efetiva: '2026-11-01', novo: { salario: 4000 } },
    { pessoa_id: 'p1', efetiva: '2026-08-01', motivo: 'sem novo' },
  ];
  const [vigente] = aplicarMovimentacoes([pessoa], movimentacoes, HOJE);
  assert.deepEqual([vigente.salario, vigente.cargo, vigente.cnpj_id], [3300, 'Analista Pleno', 'c-filial']);
  assert.equal(pessoa.salario, 3000, 'o cadastro original não muda');
});

test('memória: registro novo com o próximo código, situação e prazos na hora', () => {
  const memoria = criarMemoria(gerarDemonstracao(HOJE), { cabecalho: [], registros: [] });
  const alguem = memoria.dados.pessoas.find((item) => item.cliente_id === 'teste' && !item.desligamento && item.admissao < '2025-01-01');
  const codigo = memoria.proximoCodigo('afastamentos', 'ATE', 'teste');
  const maior = Math.max(...memoria.dados.afastamentos.filter((item) => item.cliente_id === 'teste' && item.codigo).map((item) => Number(item.codigo.slice(3))));
  assert.equal(codigo, `ATE${String(maior + 1).padStart(3, '0')}`);

  const item = montarAfastamento({ tipo: 'Doença', inicio: '2026-10-05', dias: 20, cid: 'J11' }, { pessoa: alguem, existentes: [] });
  memoria.inserir('afastamentos', { ...item, cliente_id: 'teste', pessoa_id: alguem.id, matricula: alguem.matricula, codigo, registrado_por: 'Gabriela Souza', registrado_em: HOJE });
  assert.equal(situacoes(memoria.dados, HOJE).get(alguem.id), 'Afastado', 'o afastamento muda a situação');
  const linha = memoria.lerAba('Atestados').registros.find((registro) => registro.ID_Atestado === codigo && registro.Cliente === 'teste');
  assert.equal(linha.Status_Validacao, 'Pendente', 'aparece também na tela atual');
  const inss = listarPrazos(recortar(memoria.dados, { cliente: 'teste' })).find((prazo) => prazo.regra === 'inss' && prazo.pessoa.matricula === alguem.matricula);
  assert.equal(inss.data, '2026-10-20', 'do 16º dia em diante, com o INSS');
});
