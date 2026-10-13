/**
 * Planilha modelo (lib/planilhaModelo.js): o modelo em branco passa, cada erro
 * aponta aba, linha e coluna, e o que está certo vira registro. Também a ida
 * e volta pelo .xlsx (lib/xlsx.js). Rodar com `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abasDoModelo, cnpjValido, conferirPlanilha, lerData, lerValor } from '../lib/planilhaModelo.js';
import { escreverXlsx, lerXlsx } from '../lib/xlsx.js';

const HOJE = '2026-10-13';
const CNPJ = '11.222.333/0001-81';
const aba = (cabecalho, ...linhas) => [{ numero: 1, celulas: cabecalho }, ...linhas.map((celulas, i) => ({ numero: i + 2, celulas }))];
const ATIVOS = ['Nome completo *', 'CPF *', 'Nascimento *', 'CNPJ da unidade', 'Departamento *', 'Cargo *', 'Contrato *', 'Admissão *', 'Salário *'];

test('leituras: datas em três formatos, valores em reais e CNPJ', () => {
  assert.equal(lerData('2026-03-01'), '2026-03-01');
  assert.equal(lerData('1/3/2026'), '2026-03-01');
  assert.equal(lerData('46082'), '2026-03-01', 'número de série do Excel');
  assert.equal(lerData('31/02/2026'), null);
  assert.equal(lerValor('3.200,50'), 3200.5);
  assert.equal(lerValor('3200.5'), 3200.5);
  assert.ok(Number.isNaN(lerValor('três mil')));
  assert.equal(cnpjValido(CNPJ), true);
  assert.equal(cnpjValido('11.222.333/0001-82'), false);
});

test('o modelo em branco (só com os cabeçalhos) não tem erro nem registro', () => {
  const lida = lerXlsx(escreverXlsx(abasDoModelo()));
  assert.ok(lida['Instruções'] && lida['Colaboradores ativos'] && lida['Férias']);
  const conferida = conferirPlanilha(lida, { hoje: HOJE });
  assert.deepEqual(conferida.erros, []);
  assert.equal(conferida.resumo.ativos, 0);
});

test('erros por aba, linha e coluna, para corrigir e subir de novo', () => {
  const lida = {
    Empresa: aba(['CNPJ *', 'Nome da unidade *', 'Tipo *', 'Regime tributário', 'Anexo do Simples'], [CNPJ, 'Matriz', 'Matriz', 'Lucro Real', 'III']),
    'Colaboradores ativos': aba(
      ATIVOS,
      ['Ana Beatriz Moreira', '529.982.247-25', '10/04/1995', CNPJ, 'Financeiro', 'Analista', 'indeterminado', '01/03/2024', '3.200,00'],
      ['Bruno Lima', '123.456.789-00', '10/04/1990', CNPJ, 'TI', 'Dev', 'indeterminado', '01/03/2024', '4000'],
      ['Carla Dias', '111.444.777-35', 'ontem', '99.999.999/0001-99', 'TI', 'Dev', 'CLT', '01/03/2024', 'quatro mil'],
      ['Ana de novo', '529.982.247-25', '10/04/1995', '', 'TI', 'Dev', 'indeterminado', '01/03/2024', '4000'],
      ['Duda Rocha', '', '10/04/1995', '', '', 'Dev', 'indeterminado', '01/03/2024', '4000']
    ),
    Atestados: aba(['CPF *', 'Tipo', 'Início *', 'Dias *', 'CID'], ['529.982.247-25', 'Doença', '05/08/2026', '2', 'gripe'], ['390.533.447-05', 'Doença', '05/08/2026', '2', 'J11']),
    Férias: aba(['CPF *', 'Início do período aquisitivo *', 'Início das férias', 'Dias *'], ['529.982.247-25', '01/03/2025', '', '40']),
  };
  const { erros } = conferirPlanilha(lida, { hoje: HOJE });
  const achar = (abaNome, linha, coluna) => erros.find((item) => item.aba === abaNome && item.linha === linha && item.coluna === coluna);
  assert.match(achar('Empresa', 2, 'Anexo do Simples').mensagem, /só vale para o Simples/);
  assert.match(achar('Colaboradores ativos', 3, 'CPF').mensagem, /não é válido/);
  assert.match(achar('Colaboradores ativos', 4, 'Nascimento').mensagem, /não é uma data/);
  assert.match(achar('Colaboradores ativos', 4, 'CNPJ da unidade').mensagem, /não é válido/);
  assert.match(achar('Colaboradores ativos', 4, 'Contrato').mensagem, /não é uma opção/);
  assert.match(achar('Colaboradores ativos', 4, 'Salário').mensagem, /não é um valor/);
  assert.match(achar('Colaboradores ativos', 5, 'CPF').mensagem, /repetido.*linha 2/);
  assert.match(achar('Colaboradores ativos', 6, 'CPF').mensagem, /Preencha/);
  assert.match(achar('Colaboradores ativos', 6, 'Departamento').mensagem, /Preencha/);
  assert.match(achar('Atestados', 2, 'CID').mensagem, /não é um CID/);
  assert.match(achar('Atestados', 3, 'CPF').mensagem, /não está em Colaboradores/);
  assert.equal(achar('Atestados', 2, 'CPF'), undefined, 'a pessoa está na planilha (com erro em outra linha): o atestado não acusa o CPF');
  assert.match(achar('Férias', 2, 'Dias').mensagem, /até 30 dias/);
  assert.ok(erros.every((item, i) => i === 0 || item.aba !== erros[i - 1].aba || (item.linha || 0) >= (erros[i - 1].linha || 0)), 'em ordem de aba e linha');
});

test('falta aba ou coluna obrigatória', () => {
  assert.match(conferirPlanilha({}, { hoje: HOJE }).erros[0].mensagem, /Falta a aba "Colaboradores ativos"/);
  const semCpf = conferirPlanilha({ 'Colaboradores ativos': aba(['Nome completo', 'Departamento']) }, { hoje: HOJE });
  assert.ok(semCpf.erros.some((item) => item.coluna === 'CPF' && /Falta a coluna/.test(item.mensagem)));
});

test('planilha certa: pessoas novas, ex-colaboradores, férias, atestados e benefícios; CPF já no quadro é pulado', () => {
  const lida = {
    'colaboradores ativos': aba(
      ATIVOS,
      ['Ana Beatriz Moreira', '529.982.247-25', '10/04/1995', '', 'Financeiro', 'Analista', 'Indeterminado', '01/03/2024', '3.200,00'],
      ['Quem já está', '390.533.447-05', '10/04/1990', '', 'TI', 'Dev', 'indeterminado', '01/03/2020', '4000']
    ),
    'Ex-colaboradores': aba(
      ['Nome completo *', 'CPF *', 'Departamento *', 'Cargo *', 'Admissão *', 'Último dia *', 'Tipo de desligamento *', 'Motivo *'],
      ['Carlos Lima', '111.444.777-35', 'Comercial', 'Vendedor', '10/02/2022', '30/06/2026', 'Pedido de demissão', 'Outra proposta.']
    ),
    Benefícios: aba(
      ['CPF *', 'Benefício *', 'Tipo *', 'Empresa paga por pessoa *', 'Desconto no salário (%)'],
      ['529.982.247-25', 'Vale-refeição', 'VR', '660,00', '10'],
      ['111.444.777-35', 'Vale-refeição', 'VR', '700,00', '10']
    ),
  };
  const conferida = conferirPlanilha(lida, { hoje: HOJE, pessoas: [{ cpf: '390.533.447-05' }] });
  assert.equal(conferida.erros.length, 1, 'o valor diferente do mesmo benefício');
  assert.match(conferida.erros[0].mensagem, /outro valor/);
  assert.deepEqual([conferida.resumo.ativos, conferida.resumo.exColaboradores, conferida.resumo.jaCadastradas], [1, 1, 1]);
  assert.equal(conferida.dados.pessoas[0].contrato, 'indeterminado', 'a opção vale sem diferença de maiúscula');
  assert.equal(conferida.dados.pessoas[0].cpf, '529.982.247-25');
});
