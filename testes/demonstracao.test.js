/**
 * Dados de demonstração (docs/redesenho.md › 9): estáveis, ancorados em hoje
 * e com tudo o que os módulos vão precisar. Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarDemonstracao, paraTabelas } from '../lib/demo/gerador.js';
import { filtrarPorCnpj, filtrarPorEscopo } from '../lib/dados/regras.js';
import { cpfValido } from '../lib/formato.js';

const HOJE = '2026-10-12';
const dados = gerarDemonstracao(HOJE);
const abas = paraTabelas(dados);

const deCliente = (lista, id) => lista.filter((item) => item.cliente_id === id);
const naoDesligados = (id) => deCliente(dados.pessoas, id).filter((pessoa) => !pessoa.desligamento);

test('mesmo dia, mesmos dados', () => {
  assert.deepEqual(gerarDemonstracao(HOJE), dados);
});

test('as datas andam com o dia de hoje', () => {
  const outroDia = gerarDemonstracao('2027-03-01');
  for (const cliente of dados.clientes) {
    assert.equal(deCliente(outroDia.pessoas, cliente.id).length, deCliente(dados.pessoas, cliente.id).length);
  }
  for (const [base, hoje] of [[dados, HOJE], [outroDia, '2027-03-01']]) {
    assert.ok(base.ocorrencias.every((item) => item.data <= hoje), 'nenhuma ocorrência no futuro');
    assert.ok(base.afastamentos.every((item) => item.registrado_em <= hoje));
  }
});

test('2 parceiros, um fictício e com cores próprias', () => {
  assert.equal(dados.parceiros.length, 2);
  const ficticio = dados.parceiros.find((parceiro) => parceiro.ficticio);
  assert.match(ficticio.nome, /fictícia/);
  assert.ok(ficticio.cores?.violeta);
});

test('6 clientes de 8 a 60 pessoas, nos três regimes, um com matriz e 2 filiais', () => {
  assert.equal(dados.clientes.length, 6);
  for (const cliente of dados.clientes) {
    const ativos = naoDesligados(cliente.id).length;
    assert.ok(ativos >= 8 && ativos <= 60, `${cliente.nome}: ${ativos} pessoas`);
  }
  assert.deepEqual(
    [...new Set(dados.clientes.map((cliente) => cliente.regime_tributario))].sort(),
    ['Lucro Presumido', 'Lucro Real', 'Simples Nacional']
  );
  const comFiliais = dados.clientes.filter((cliente) => deCliente(dados.cnpjs, cliente.id).length === 3);
  assert.equal(comFiliais.length, 1);
  const tipos = deCliente(dados.cnpjs, comFiliais[0].id).map((item) => item.tipo);
  assert.deepEqual(tipos, ['matriz', 'filial', 'filial']);
});

test('18 meses de histórico, com admissões e desligamentos com tipo e motivo', () => {
  const inicio = '2025-04-12';
  assert.ok(dados.ocorrencias.some((item) => item.data < '2025-06-01' && item.data >= inicio));
  assert.ok(dados.ocorrencias.every((item) => item.data >= '2025-04-01'));
  assert.ok(dados.pessoas.some((pessoa) => pessoa.admissao >= inicio), 'admissões na janela');
  const desligados = dados.pessoas.filter((pessoa) => pessoa.desligamento);
  assert.ok(desligados.length > 20);
  assert.ok(desligados.every((pessoa) => pessoa.desligamento.tipo && pessoa.desligamento.motivo && pessoa.desligamento.data >= inicio));
  const comMovimentacao = new Set(
    dados.movimentacoes.filter((item) => item.tipo === 'Desligamento').map((item) => item.pessoa_id)
  );
  assert.ok(desligados.every((pessoa) => comMovimentacao.has(pessoa.id)), 'todo desligado tem a movimentação de desligamento');
  assert.ok(dados.pessoas.some((pessoa) => pessoa.contrato === 'experiência'), 'gente em experiência');
  assert.ok(dados.pessoas.some((pessoa) => pessoa.admissao > HOJE), 'admissão marcada para os próximos dias');
});

test('afastamentos de todos os tipos, atestados com CID e alguns "não informado"', () => {
  const tipos = new Set(dados.afastamentos.map((item) => item.tipo));
  for (const tipo of ['Doença', 'Acidente de trabalho', 'Licença-maternidade', 'Licença não remunerada', 'Outros']) {
    assert.ok(tipos.has(tipo), tipo);
  }
  const atestados = dados.afastamentos.filter((item) => item.atestado);
  assert.ok(atestados.some((item) => item.atestado.cid === 'não informado'));
  assert.ok(atestados.some((item) => /^[A-Z]\d/.test(item.atestado.cid)));
  assert.ok(atestados.some((item) => item.validacao === 'Pendente'));
  assert.ok(dados.afastamentos.some((item) => item.inss), 'afastamento acima de 15 dias');
  assert.ok(dados.pessoas.some((pessoa) => pessoa.situacao === 'Afastado'));
});

test('férias em todas as situações, reajustes, benefícios e documentos vencendo', () => {
  const situacoes = new Set(dados.ferias.map((item) => item.situacao));
  for (const situacao of ['gozada', 'programada', 'aguardando aprovação', 'em andamento', 'a vencer', 'vencida', 'a programar']) {
    assert.ok(situacoes.has(situacao), situacao);
  }
  assert.ok(dados.ferias.filter((item) => item.situacao === 'programada').every((item) => item.inicio > HOJE));
  assert.ok(dados.movimentacoes.some((item) => item.tipo === 'Alteração Salarial'));
  assert.ok(dados.beneficios.length > 0 && dados.adesoes.length > 0);
  const vencendo = dados.documentos.filter((item) => item.validade && item.validade > HOJE && item.validade <= '2026-11-11');
  assert.ok(vencendo.length > 0, 'documentos vencendo em 30 dias');
});

test('autoria em tudo e CPFs válidos; gênero não sai do gerador', () => {
  for (const lista of [dados.pessoas, dados.ocorrencias, dados.afastamentos, dados.movimentacoes, dados.documentos]) {
    assert.ok(lista.every((item) => item.registrado_por && item.registrado_em && item.registrado_em <= HOJE));
  }
  assert.ok(dados.pessoas.every((pessoa) => cpfValido(pessoa.cpf)));
  assert.ok(dados.pessoas.every((pessoa) => !Object.keys(pessoa).some((chave) => /genero|sexo/i.test(chave))));
});

test('abas das telas atuais: matrícula única por cliente e eventos de pessoas do próprio cliente', () => {
  const codigos = new Set(dados.clientes.map((cliente) => cliente.codigo));
  for (const { registros } of Object.values(abas)) {
    assert.ok(registros.every((linha) => codigos.has(linha.Cliente)));
  }
  for (const cliente of dados.clientes) {
    const pessoas = filtrarPorEscopo(abas.Colaboradores.registros, { cliente: cliente.codigo });
    const matriculas = new Set(pessoas.map((linha) => linha.Matricula));
    assert.equal(matriculas.size, pessoas.length, `${cliente.nome}: matrícula repetida`);
    for (const aba of ['Ocorrencias_Faltas', 'Atestados', 'Movimentacoes_DP']) {
      const eventos = filtrarPorEscopo(abas[aba].registros, { cliente: cliente.codigo });
      assert.ok(eventos.every((linha) => matriculas.has(linha.Matricula)), `${aba} de ${cliente.nome}`);
    }
  }
});

test('recorte por CNPJ separa as unidades sem perder nem repetir ninguém', () => {
  const pessoas = filtrarPorEscopo(abas.Colaboradores.registros, { cliente: 'teste' });
  const eventos = filtrarPorEscopo(abas.Ocorrencias_Faltas.registros, { cliente: 'teste' });
  const unidades = deCliente(dados.cnpjs, 'teste');
  let somaPessoas = 0;
  let somaEventos = 0;
  for (const unidade of unidades) {
    const recorte = filtrarPorCnpj(pessoas, eventos, { cliente: 'teste', cnpj: unidade.cnpj });
    assert.ok(recorte.pessoas.length > 0, unidade.nome);
    assert.ok(recorte.pessoas.every((linha) => linha.CNPJ === unidade.cnpj));
    somaPessoas += recorte.pessoas.length;
    somaEventos += recorte.eventos.length;
  }
  assert.equal(somaPessoas, pessoas.length);
  assert.equal(somaEventos, eventos.length);
  assert.deepEqual(filtrarPorCnpj(pessoas, eventos, { cliente: 'teste', cnpj: null }), { pessoas, eventos });
});
