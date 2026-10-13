/**
 * Regras da pessoa (lib/pessoas.js): situação calculada pelos eventos, tempo
 * de casa, saldo de férias, linha do tempo e CPF protegido. Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import { criarMemoria } from '../lib/demo/memoria.js';
import { recortar } from '../lib/prazos.js';
import {
  cpfProtegido,
  linhaDoTempo,
  numerosDaPessoa,
  saldoDeFerias,
  situacaoDe,
  situacoes,
  tempoDeCasa,
} from '../lib/pessoas.js';

const HOJE = '2026-10-13';
const dados = gerarDemonstracao(HOJE);
const teste = recortar(dados, { cliente: 'teste' });
const calculadas = situacoes(teste, HOJE);

test('situação: Inativo depois do desligamento, Afastado e Férias pelos eventos, Ativo no resto', () => {
  const pessoa = { id: 'p', admissao: '2024-01-10', desligamento: null };
  const afastamento = { pessoa_id: 'p', inicio: '2026-10-10', fim_previsto: '2026-10-20', retorno: null, validacao: 'Aprovado' };
  const ferias = { pessoa_id: 'p', situacao: 'programada', inicio: '2026-10-12', dias: 15 };
  assert.equal(situacaoDe(pessoa, {}, HOJE), 'Ativo');
  assert.equal(situacaoDe(pessoa, { afastamentos: [afastamento] }, HOJE), 'Afastado');
  assert.equal(situacaoDe(pessoa, { afastamentos: [{ ...afastamento, validacao: 'Rejeitado' }] }, HOJE), 'Ativo', 'atestado rejeitado não afasta');
  assert.equal(situacaoDe(pessoa, { afastamentos: [{ ...afastamento, retorno: '2026-10-12' }] }, HOJE), 'Ativo', 'voltou antes do previsto');
  assert.equal(situacaoDe(pessoa, { ferias: [ferias] }, HOJE), 'Férias', 'programada que já começou');
  assert.equal(situacaoDe(pessoa, { ferias: [{ ...ferias, situacao: 'aguardando aprovação' }] }, HOJE), 'Ativo');
  assert.equal(situacaoDe({ ...pessoa, desligamento: { data: '2026-10-01' } }, { ferias: [ferias] }, HOJE), 'Inativo');
  assert.equal(situacaoDe({ ...pessoa, desligamento: { data: '2026-10-20' } }, {}, HOJE), 'Ativo', 'desligamento marcado para depois');
});

test('situação calculada bate com os eventos da demonstração', () => {
  for (const pessoa of teste.pessoas) {
    const situacao = calculadas.get(pessoa.id);
    if (pessoa.desligamento) assert.equal(situacao, 'Inativo', pessoa.nome);
    if (situacao === 'Afastado') {
      assert.ok(teste.afastamentos.some((item) => item.pessoa_id === pessoa.id && item.inicio <= HOJE && item.fim_previsto >= HOJE));
    }
  }
  const contagem = [...calculadas.values()].reduce((mapa, s) => mapa.set(s, (mapa.get(s) || 0) + 1), new Map());
  assert.ok(contagem.get('Afastado') > 0 && contagem.get('Férias') > 0 && contagem.get('Inativo') > 0);
});

test('as abas das telas atuais mostram a mesma situação', () => {
  const memoria = criarMemoria(gerarDemonstracao(HOJE), { cabecalho: [], registros: [] });
  const todas = situacoes(memoria.dados, HOJE);
  const porMatricula = new Map(memoria.dados.pessoas.map((pessoa) => [`${pessoa.cliente_id}|${pessoa.matricula}`, todas.get(pessoa.id)]));
  for (const linha of memoria.lerAba('Colaboradores').registros) {
    assert.equal(linha.Status, porMatricula.get(`${linha.Cliente}|${linha.Matricula}`));
  }
});

test('tempo de casa conta até a saída de quem já saiu', () => {
  assert.equal(tempoDeCasa('2023-10-13', { hoje: HOJE }), '3 anos');
  assert.equal(tempoDeCasa('2023-10-13', { hoje: HOJE, saida: '2025-04-13' }), '1 ano e 6 meses');
  assert.equal(tempoDeCasa('2026-10-20', { hoje: HOJE }), 'ainda não começou');
  assert.equal(tempoDeCasa('2026-10-12', { hoje: HOJE }), '1 dia');
});

test('saldo de férias: períodos completos não tirados e os avos em aquisição', () => {
  const pessoa = { id: 'p', admissao: '2024-03-01', contrato: 'indeterminado', desligamento: null };
  const ferias = [
    { pessoa_id: 'p', aquisitivo_inicio: '2024-03-01', aquisitivo_fim: '2025-02-28', situacao: 'vencida', dias: 30 },
    { pessoa_id: 'p', aquisitivo_inicio: '2025-03-01', aquisitivo_fim: '2026-02-28', situacao: 'programada', inicio: '2026-11-03', dias: 30 },
  ];
  const saldo = saldoDeFerias(pessoa, ferias, HOJE);
  assert.equal(saldo.dias, 60);
  assert.equal(saldo.vencidos, 30);
  assert.equal(saldo.emAquisicao, 7 * 2.5, 'de março a outubro: 7 meses completos');
  const gozou = saldoDeFerias(pessoa, [{ ...ferias[1], situacao: 'gozada', inicio: '2026-04-01' }], HOJE);
  assert.equal(gozou.dias, 0);
});

test('linha do tempo: tudo da pessoa, do mais novo ao mais antigo, com autor e sem CID', () => {
  const pessoa = teste.pessoas.find((item) => teste.afastamentos.some((a) => a.pessoa_id === item.id && a.atestado && a.atestado.cid !== 'não informado'));
  const eventos = {
    ocorrencias: teste.ocorrencias.filter((item) => item.pessoa_id === pessoa.id),
    afastamentos: teste.afastamentos.filter((item) => item.pessoa_id === pessoa.id),
    movimentacoes: teste.movimentacoes.filter((item) => item.pessoa_id === pessoa.id),
    ferias: teste.ferias.filter((item) => item.pessoa_id === pessoa.id),
    documentos: teste.documentos.filter((item) => item.pessoa_id === pessoa.id),
  };
  const linha = linhaDoTempo(pessoa, eventos);
  assert.ok(linha.length >= 1 + eventos.ocorrencias.length + eventos.afastamentos.length);
  assert.deepEqual(linha.map((item) => item.data), [...linha.map((item) => item.data)].sort().reverse());
  assert.ok(linha.some((item) => item.tipo === 'Admissão'));
  const cids = eventos.afastamentos.map((item) => item.atestado?.cid).filter((cid) => cid && cid !== 'não informado');
  const texto = JSON.stringify(linha);
  for (const cid of cids) assert.ok(!texto.includes(cid), `a linha do tempo não mostra o CID ${cid}`);
  assert.ok(linha.every((item) => ['contrato', 'ocorrencias', 'saude', 'movimentacoes', 'ferias', 'documentos', 'desligamento'].includes(item.aba)));

  const numeros = numerosDaPessoa(pessoa, eventos, HOJE);
  assert.ok(numeros.diasDeAtestado >= 0 && typeof numeros.tempoDeCasa === 'string');
});

test('CPF protegido deixa só o fim à mostra', () => {
  assert.equal(cpfProtegido('529.982.247-25'), '•••.•••.247-25');
  assert.equal(cpfProtegido(''), '•••');
});
