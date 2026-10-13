/**
 * Admissões e desligamentos (fase 9): a admissão completa, os custos
 * informados (somados, não calculados), os passos e os resumos das telas,
 * e os dados de demonstração. Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroDeLancamento, montarAdmissao, montarCustos, nomeDoCusto } from '../lib/lancamentos.js';
import { passosDaAdmissao, passosDoDesligamento, resumoDasAdmissoes, resumoDosDesligamentos } from '../lib/entradasESaidas.js';
import { prazoDaRescisao, recortar } from '../lib/prazos.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import { criarMemoria } from '../lib/demo/memoria.js';

const HOJE = '2026-10-13';
const CNPJS = [{ id: 'c-matriz' }, { id: 'c-filial' }];
const BASE = {
  nome: 'Ana Beatriz Moreira',
  cpf: '529.982.247-25',
  nascimento: '1995-04-10',
  unidade: 'c-matriz',
  departamento: 'Financeiro',
  cargo: 'Analista Financeira',
  contrato: 'experiência',
  admissao: '2026-10-20',
  salario: '3.200,00',
};

test('custos informados: soma o que foi preenchido, vazio é zero, valor estranho é recusado', () => {
  assert.equal(montarCustos({}, 'admissao'), null);
  assert.deepEqual(montarCustos({ custo_exames: '120,00', custo_uniforme: '', custo_outros: '0' }, 'admissao'), {
    itens: [{ item: 'exames', valor: 120 }],
    total: 120,
  });
  assert.equal(montarCustos({ custo_rescisao: '5.431,17', custo_exame: '95,50' }, 'desligamento').total, 5526.67);
  assert.throws(() => montarCustos({ custo_exames: 'cem' }, 'admissao'), /Exames admissionais/);
  assert.throws(() => montarCustos({ custo_rescisao: '-10' }, 'desligamento'), ErroDeLancamento);
  assert.equal(nomeDoCusto('desligamento', 'rescisao'), 'Rescisão paga');
});

test('admissão: nome, CPF, idade mínima, unidade, salário e até 60 dias à frente', () => {
  const { pessoa, custos } = montarAdmissao({ ...BASE, custo_exames: '150' }, { cnpjs: CNPJS, hoje: HOJE });
  assert.deepEqual(
    [pessoa.cpf, pessoa.salario, pessoa.cnpj_id, pessoa.jornada, pessoa.contrato, custos.total],
    ['529.982.247-25', 3200, 'c-matriz', '44h semanais', 'experiência', 150]
  );
  assert.throws(() => montarAdmissao({ ...BASE, nome: 'Ana' }, { cnpjs: CNPJS, hoje: HOJE }), /nome completo/);
  assert.throws(() => montarAdmissao({ ...BASE, cpf: '111.111.111-11' }, { cnpjs: CNPJS, hoje: HOJE }), /CPF/);
  assert.throws(() => montarAdmissao({ ...BASE, nascimento: '2011-01-01' }, { cnpjs: CNPJS, hoje: HOJE }), /16 anos/);
  assert.ok(montarAdmissao({ ...BASE, nascimento: '2011-01-01', contrato: 'aprendiz' }, { cnpjs: CNPJS, hoje: HOJE }), 'aprendiz a partir de 14');
  assert.throws(() => montarAdmissao({ ...BASE, unidade: 'outra' }, { cnpjs: CNPJS, hoje: HOJE }), /unidade/);
  assert.equal(montarAdmissao({ ...BASE, unidade: '' }, { cnpjs: [{ id: 'só' }], hoje: HOJE }).pessoa.cnpj_id, 'só', 'uma unidade só: vai nela');
  assert.throws(() => montarAdmissao({ ...BASE, admissao: '2027-01-20' }, { cnpjs: CNPJS, hoje: HOJE }), /60 dias/);
  assert.throws(() => montarAdmissao({ ...BASE, salario: '' }, { cnpjs: CNPJS, hoje: HOJE }), /salário/);
  assert.throws(() => montarAdmissao({ ...BASE, contrato: 'freela' }, { cnpjs: CNPJS, hoje: HOJE }), /contrato/);
});

test('admissão: o CPF de quem está no quadro não entra de novo; o de quem saiu, sim (readmissão)', () => {
  const noQuadro = [{ matricula: 'MAT007', cpf: '52998224725', desligamento: null }];
  assert.throws(() => montarAdmissao(BASE, { pessoas: noQuadro, cnpjs: CNPJS, hoje: HOJE }), /MAT007/);
  const saiu = [{ ...noQuadro[0], desligamento: { data: '2025-01-10' } }];
  assert.ok(montarAdmissao(BASE, { pessoas: saiu, cnpjs: CNPJS, hoje: HOJE }));
});

test('passos da admissão: registro até a véspera, ASO e contrato pelos documentos, custos', () => {
  const pessoa = { id: 'p1', admissao: '2026-10-20', registrado_em: '2026-10-13' };
  const futura = passosDaAdmissao(pessoa, { documentos: [], custo: null, hoje: HOJE });
  assert.deepEqual(futura.map((passo) => [passo.chave, passo.feito]), [['registro', false], ['aso', false], ['contrato', false], ['custos', false]]);
  assert.equal(futura[0].detalhe, 'até 19/10');
  const documentos = [{ pessoa_id: 'p1', tipo: 'ASO admissional' }, { pessoa_id: 'p1', tipo: 'Contrato de trabalho' }];
  const completa = passosDaAdmissao(pessoa, { documentos, custo: { total: 150 }, hoje: '2026-10-25' });
  assert.ok(completa.every((passo) => passo.feito));
  const tarde = passosDaAdmissao({ ...pessoa, registrado_em: '2026-10-21' }, { documentos, custo: null, hoje: '2026-10-25' });
  assert.equal(tarde[0].atraso, true, 'cadastrada depois da véspera');
  assert.equal(passosDaAdmissao({ ...pessoa, admissao: '2024-01-10' }, { hoje: HOJE, implantacao: '2025-03-01' }), null, 'veio da implantação');
});

test('passos do desligamento: prazo da rescisão em dia útil, concluído e custos', () => {
  // 18/12/2026 + 10 = 28/12 (segunda): dia útil. 10/12 + 10 = 20/12 (domingo): vale 18/12.
  assert.deepEqual(prazoDaRescisao('2026-12-18'), { data: '2026-12-28', nota: '' });
  assert.equal(prazoDaRescisao('2026-12-10').data, '2026-12-18');
  const aberto = passosDoDesligamento({ efetiva: '2026-10-01', checklist: 'Pendente' }, { custo: null, hoje: HOJE });
  assert.equal(aberto.prazo.data, '2026-10-09');
  assert.equal(aberto.prazo.dias, -4);
  assert.deepEqual(aberto.passos.map((passo) => [passo.chave, passo.feito, Boolean(passo.atraso)]), [
    ['registro', true, false],
    ['rescisao', false, true],
    ['custos', false, false],
  ]);
  const concluido = passosDoDesligamento({ efetiva: '2026-10-01', checklist: 'Concluído' }, { custo: { total: 4200 }, hoje: HOJE });
  assert.ok(concluido.passos.every((passo) => passo.feito && !passo.atraso));
});

test('demonstração: admissões e desligamentos com passos, custos informados e um desligamento sem custos', () => {
  const dados = gerarDemonstracao(HOJE);
  const recorte = recortar(dados, { cliente: 'teste' });
  const admissoes = resumoDasAdmissoes(recorte);
  assert.equal(admissoes.futuras.length, 1, 'uma admissão marcada para a semana que vem');
  assert.ok(admissoes.emExperiencia.length >= 2);
  assert.ok(admissoes.numeros.custoInformado > 0 && admissoes.numeros.comCusto > 0);
  assert.ok(
    admissoes.itens.some((item) => item.passos?.some((passo) => passo.chave === 'aso' && !passo.feito)),
    'quem chegou há pouco ainda não tem o ASO anexado'
  );

  const desligamentos = resumoDosDesligamentos(recorte);
  assert.equal(desligamentos.abertos.length, 1, 'o desligamento desta semana está para concluir');
  assert.equal(desligamentos.abertos[0].custo, null, 'e ainda sem os custos');
  assert.ok(desligamentos.numeros.comCusto > 0 && desligamentos.numeros.custoInformado > 0);
  assert.ok(dados.custos.every((item) => item.total > 0 && item.itens.length > 0));
});

test('memória: admissão nova aparece com o registro na véspera e os custos informados', () => {
  const memoria = criarMemoria(gerarDemonstracao(HOJE), { cabecalho: [], registros: [] });
  const { pessoa, custos } = montarAdmissao({ ...BASE, unidade: '', custo_exames: '150', custo_uniforme: '220' }, {
    pessoas: memoria.dados.pessoas.filter((item) => item.cliente_id === 'teste'),
    cnpjs: memoria.dados.cnpjs.filter((item) => item.cliente_id === 'teste').slice(0, 1),
    hoje: HOJE,
  });
  const nova = memoria.inserir('pessoas', { ...pessoa, cliente_id: 'teste', matricula: 'MAT999', registrado_por: 'Gabriela Souza', registrado_em: HOJE });
  memoria.inserir('custos', { cliente_id: 'teste', pessoa_id: nova.id, momento: 'admissao', ...custos, registrado_por: 'Gabriela Souza', registrado_em: HOJE });
  const resumo = resumoDasAdmissoes(recortar(memoria.dados, { cliente: 'teste' }));
  const item = resumo.futuras.find((futura) => futura.pessoa.matricula === 'MAT999');
  assert.ok(item, 'a admissão marcada aparece em "Começam em breve"');
  assert.equal(item.custo.total, 370);
  assert.equal(item.passos.find((passo) => passo.chave === 'custos').feito, true);
});
