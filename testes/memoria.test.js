/**
 * A cópia em memória da demonstração (lib/demo/memoria.js): as abas das
 * telas atuais saem dos dados completos, e o que elas gravam muda os dados.
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import { ErroDaMemoria, criarMemoria } from '../lib/demo/memoria.js';

const HOJE = '2026-10-13';
const novaMemoria = () => criarMemoria(gerarDemonstracao(HOJE), { cabecalho: ['Email'], registros: [{ Email: 'a@b.c' }] });
const linhaDe = (memoria, aba, campo, valor) => memoria.lerAba(aba).registros.find((linha) => linha[campo] === valor);

test('os códigos ficam guardados e as linhas têm número estável', () => {
  const memoria = novaMemoria();
  const antes = memoria.lerAba('Ocorrencias_Faltas').registros;
  const codigos = new Set(antes.filter((linha) => linha.Cliente === 'teste').map((linha) => linha.ID_Ocorrencia));
  assert.equal(codigos.size, antes.filter((linha) => linha.Cliente === 'teste').length, 'código único por cliente');
  const { cabecalho } = memoria.lerAba('Ocorrencias_Faltas');
  const valores = cabecalho.map((coluna) => ({
    Cliente: 'teste', ID_Ocorrencia: 'OCO999', Data_Registro: HOJE, Matricula: 'MAT010', Data_Falta: '2026-10-10',
    Tipo_Ocorrencia: 'Atraso', Justificada: 'Não', Motivo: 'Atraso de 30 minutos.',
  })[coluna] ?? '');
  memoria.anexarLinha('Ocorrencias_Faltas', valores, 'Gabriela Souza');
  const depois = memoria.lerAba('Ocorrencias_Faltas').registros;
  assert.equal(depois.length, antes.length + 1);
  antes.forEach((linha, indice) => assert.equal(depois[indice].ID_Ocorrencia, linha.ID_Ocorrencia, 'nada muda de linha'));
  const nova = depois[depois.length - 1];
  assert.equal(nova.ID_Ocorrencia, 'OCO999');
  assert.equal(nova._linha, depois.length + 1);
  const noDado = memoria.dados.ocorrencias.find((item) => item.codigo === 'OCO999');
  assert.equal(noDado.registrado_por, 'Gabriela Souza');
  assert.equal(noDado.pessoa_id, memoria.dados.pessoas.find((p) => p.cliente_id === 'teste' && p.matricula === 'MAT010').id);
});

test('validar um atestado na tela atual muda o afastamento nos dados, com autoria', () => {
  const memoria = novaMemoria();
  const pendente = memoria.lerAba('Atestados').registros.find((linha) => linha.Status_Validacao === 'Pendente');
  memoria.atualizarCampo('Atestados', pendente._linha, 'Status_Validacao', 'Aprovado', 'Renato Alves');
  const afastamento = memoria.dados.afastamentos.find((item) => item.codigo === pendente.ID_Atestado && item.cliente_id === pendente.Cliente);
  assert.equal(afastamento.validacao, 'Aprovado');
  assert.equal(afastamento.validado_por, 'Renato Alves');
  assert.equal(linhaDe(memoria, 'Atestados', 'ID_Atestado', pendente.ID_Atestado).Status_Validacao, 'Aprovado');
});

test('aprovar pelo repositório novo aparece na aba das telas atuais', () => {
  const memoria = novaMemoria();
  const afastamento = memoria.dados.afastamentos.find((item) => item.atestado && item.validacao === 'Pendente');
  memoria.alterar('afastamentos', afastamento.id, { validacao: 'Rejeitado' });
  const linha = memoria.lerAba('Atestados').registros.find((item) => item.ID_Atestado === afastamento.codigo && item.Cliente === afastamento.cliente_id);
  assert.equal(linha.Status_Validacao, 'Rejeitado');
});

test('cadastro, atestado e desligamento pelas telas atuais entram nos dados', () => {
  const memoria = novaMemoria();
  const colunas = memoria.lerAba('Colaboradores').cabecalho;
  memoria.anexarLinha('Colaboradores', colunas.map((coluna) => ({
    Cliente: 'teste', CNPJ: '', Matricula: 'MAT900', Nome_Completo: 'Pessoa Nova Teste', CPF: '529.982.247-25',
    Departamento: 'Tecnologia', Cargo: 'Analista', Data_Admissao: '2026-10-20', Status: 'Ativo',
  })[coluna] ?? ''), 'Gabriela Souza');
  const pessoa = memoria.dados.pessoas.find((item) => item.matricula === 'MAT900');
  assert.equal(pessoa.cnpj_id, 'teste-matriz', 'sem CNPJ informado, vai para a matriz');

  const atestados = memoria.lerAba('Atestados').cabecalho;
  memoria.anexarLinha('Atestados', atestados.map((coluna) => ({
    Cliente: 'teste', ID_Atestado: 'ATE900', Data_Registro: HOJE, Matricula: 'MAT900', Data_Inicio: '2026-10-21',
    Dias_Afastamento: 3, CID: 'j11', Anexo_URL: '', Status_Validacao: 'Pendente',
  })[coluna] ?? ''), 'Gabriela Souza');
  const afastamento = memoria.dados.afastamentos.find((item) => item.codigo === 'ATE900');
  assert.deepEqual([afastamento.fim_previsto, afastamento.atestado.cid, afastamento.validacao], ['2026-10-23', 'J11', 'Pendente']);

  const ativa = memoria.dados.pessoas.find((item) => item.cliente_id === 'teste' && !item.desligamento && item.admissao < '2026-01-01');
  const movimentacoes = memoria.lerAba('Movimentacoes_DP').cabecalho;
  memoria.anexarLinha('Movimentacoes_DP', movimentacoes.map((coluna) => ({
    Cliente: 'teste', ID_Movimentacao: 'MOV900', Data_Registro: HOJE, Matricula: ativa.matricula, Tipo_Movimentacao: 'Desligamento',
    Data_Efetiva: '2026-10-10', Motivo: 'Pedido de demissão.', Status_Checklist: 'Pendente',
  })[coluna] ?? ''), 'Gabriela Souza');
  assert.deepEqual([ativa.desligamento?.data, ativa.situacao], ['2026-10-10', 'Inativo'], 'o desligamento tira a pessoa do quadro');
});

test('o que não existe vira erro claro', () => {
  const memoria = novaMemoria();
  assert.throws(() => memoria.lerAba('Folha'), ErroDaMemoria);
  assert.throws(() => memoria.atualizarCampo('Atestados', 99999, 'Status_Validacao', 'Aprovado', 'x'), ErroDaMemoria);
  assert.throws(() => memoria.atualizarCampo('Atestados', 2, 'CID', 'A00', 'x'), ErroDaMemoria);
});
