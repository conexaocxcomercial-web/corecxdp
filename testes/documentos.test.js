/**
 * Documentos (lib/documentos.js), dados da empresa (lib/empresa.js), histórico
 * (lib/historico.js) e a gravação da importação (lib/importacao.js).
 * Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroDeDocumento, montarDocumento, pendenciasDaPessoa, resumoDosDocumentos, situacaoDoDocumento } from '../lib/documentos.js';
import { ErroDaEmpresa, montarDadosDaEmpresa } from '../lib/empresa.js';
import { historicoDaEmpresa } from '../lib/historico.js';
import { IMPORTACAO, registrosDaImportacao } from '../lib/importacao.js';
import { conferirPlanilha } from '../lib/planilhaModelo.js';
import { encargosDaEmpresa } from '../lib/folha.js';
import { recortar } from '../lib/prazos.js';
import { gerarDemonstracao } from '../lib/demo/gerador.js';

const HOJE = '2026-10-13';
const pessoa = { id: 'p1', nome: 'Ana', matricula: 'MAT001', admissao: '2024-01-10', desligamento: null };

test('documentos: situação pela validade e o que falta no cadastro', () => {
  assert.equal(situacaoDoDocumento({ tipo: 'ASO periódico', validade: '2026-10-01' }, HOJE), 'vencido');
  assert.equal(situacaoDoDocumento({ tipo: 'ASO periódico', validade: '2026-11-10' }, HOJE), 'vencendo');
  assert.equal(situacaoDoDocumento({ tipo: 'CNH', validade: null }, HOJE), 'sem validade');
  assert.equal(situacaoDoDocumento({ tipo: 'Contrato de trabalho', validade: null }, HOJE), 'válido');
  assert.deepEqual(pendenciasDaPessoa(pessoa, [], HOJE), ['contrato de trabalho', 'ASO admissional', 'ASO periódico']);
  const documentos = [
    { pessoa_id: 'p1', tipo: 'Contrato de trabalho' },
    { pessoa_id: 'p1', tipo: 'ASO admissional' },
    { pessoa_id: 'p1', tipo: 'ASO periódico', validade: '2026-01-10' },
  ];
  assert.deepEqual(pendenciasDaPessoa(pessoa, documentos, HOJE), ['ASO periódico vencido']);
  assert.deepEqual(pendenciasDaPessoa({ ...pessoa, admissao: '2026-06-01' }, documentos.slice(0, 2), HOJE), [], 'menos de um ano: sem periódico');
});

test('documento novo: validade obrigatória no que vence e depois da emissão', () => {
  assert.deepEqual(montarDocumento({ tipo: 'ASO periódico', emissao: '2026-10-01', validade: '2027-10-01' }, { pessoa, hoje: HOJE }), {
    tipo: 'ASO periódico', emissao: '2026-10-01', validade: '2027-10-01', anexo: '', descricao: null,
  });
  assert.throws(() => montarDocumento({ tipo: 'CNH', emissao: '2026-10-01' }, { pessoa, hoje: HOJE }), /validade/);
  assert.throws(() => montarDocumento({ tipo: 'CNH', emissao: '2026-10-01', validade: '2026-09-01' }, { pessoa, hoje: HOJE }), /depois da emissão/);
  assert.throws(() => montarDocumento({ tipo: 'ASO admissional', emissao: '2026-12-01' }, { pessoa, hoje: HOJE }), /ainda não chegou/);
  assert.throws(() => montarDocumento({ tipo: 'Outros', emissao: '2026-10-01' }, { pessoa, hoje: HOJE }), ErroDeDocumento);
});

test('dados da empresa: regime, anexo só no Simples e percentual de 0% a 80% (vazio é o padrão)', () => {
  assert.deepEqual(montarDadosDaEmpresa({ regime: 'Simples Nacional', anexo: 'IV', percentual: '' }), { regime_tributario: 'Simples Nacional', anexo_simples: 'IV', percentual_encargos: null });
  assert.deepEqual(montarDadosDaEmpresa({ regime: 'Lucro Real', anexo: 'IV', percentual: '38,5' }), { regime_tributario: 'Lucro Real', anexo_simples: null, percentual_encargos: 0.385 });
  assert.throws(() => montarDadosDaEmpresa({ regime: 'Lucro Real', percentual: '120' }), /de 0% a 80%/);
  assert.throws(() => montarDadosDaEmpresa({ regime: 'MEI' }), ErroDaEmpresa);
  // Trocar o anexo do Simples para o IV muda o percentual de encargos.
  assert.equal(encargosDaEmpresa(montarDadosDaEmpresa({ regime: 'Simples Nacional', anexo: 'III' })).percentual, 0.08);
  assert.equal(encargosDaEmpresa(montarDadosDaEmpresa({ regime: 'Simples Nacional', anexo: 'IV' })).percentual, 0.36);
});

test('demonstração: completude dos documentos e histórico com autor, do mais novo ao mais antigo', () => {
  const recorte = recortar(gerarDemonstracao(HOJE), { cliente: 'teste' });
  const resumo = resumoDosDocumentos(recorte);
  assert.ok(resumo.numeros.vencidos >= 1 && resumo.incompletos.length >= 1, 'há ASO vencido e quem chegou há pouco sem ASO');
  const historico = historicoDaEmpresa(recorte);
  assert.ok(historico.length > 100);
  assert.ok(historico.every((item) => item.autor && item.em));
  assert.ok(historico.every((item, i) => i === 0 || historico[i - 1].em >= item.em), 'do mais novo ao mais antigo');
  assert.ok(!JSON.stringify(historico).includes('"cid"'), 'sem CID no histórico');
});

test('importação: matrícula na sequência, ex-colaborador com desligamento concluído e atestado validado', () => {
  const aba = (cabecalho, ...linhas) => [{ numero: 1, celulas: cabecalho }, ...linhas.map((celulas, i) => ({ numero: i + 2, celulas }))];
  const lida = {
    'Colaboradores ativos': aba(
      ['Nome completo', 'CPF', 'Nascimento', 'Departamento', 'Cargo', 'Contrato', 'Admissão', 'Salário'],
      ['Ana Beatriz Moreira', '529.982.247-25', '10/04/1995', 'Financeiro', 'Analista', 'indeterminado', '01/03/2024', '3.200,00']
    ),
    'Ex-colaboradores': aba(
      ['Nome completo', 'CPF', 'Departamento', 'Cargo', 'Admissão', 'Último dia', 'Tipo de desligamento', 'Motivo'],
      ['Carlos Lima', '111.444.777-35', 'Comercial', 'Vendedor', '10/02/2022', '30/06/2026', 'Pedido de demissão', 'Outra proposta.']
    ),
    Atestados: aba(['CPF', 'Início', 'Dias', 'CID'], ['529.982.247-25', '05/08/2026', '20', 'não informado']),
    Férias: aba(['CPF', 'Início do período aquisitivo', 'Dias'], ['529.982.247-25', '01/03/2025', '30']),
  };
  const conferida = conferirPlanilha(lida, { hoje: HOJE });
  assert.deepEqual(conferida.erros, []);
  const registros = registrosDaImportacao(conferida.dados, {
    cliente: 'x', cnpjs: [{ id: 'm', cnpj: '11.222.333/0001-81', tipo: 'matriz' }], pessoas: [{ matricula: 'MAT041' }], hoje: HOJE,
  });
  assert.deepEqual(registros.pessoas.map((item) => [item.matricula, item.cnpj_id, Boolean(item.desligamento)]), [['MAT042', 'm', false], ['MAT043', 'm', true]]);
  assert.equal(registros.pessoas[0].registrado_por, IMPORTACAO);
  assert.deepEqual(registros.movimentacoes.map((item) => [item.tipo, item.checklist]), [['Desligamento', 'Concluído']]);
  assert.deepEqual([registros.afastamentos[0].validacao, registros.afastamentos[0].inss, registros.afastamentos[0].fim_previsto], ['Aprovado', true, '2026-08-24']);
  assert.deepEqual([registros.ferias[0].aquisitivo_fim, registros.ferias[0].concessivo_fim, registros.ferias[0].situacao], ['2026-02-28', '2027-02-28', 'a programar']);
});
