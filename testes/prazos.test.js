/**
 * Aprovações, prazos e revisão da implantação (lib/prazos.js) batem com os
 * dados de demonstração e com as regras de lib/regrasDePrazo.js. Rodar com
 * `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarDemonstracao } from '../lib/demo/gerador.js';
import {
  contarEsperando,
  diaDe,
  grupoDoPrazo,
  isoDe,
  listarAprovacoes,
  listarPrazos,
  listarRevisao,
  listarUrgentes,
  recortar,
  sequenciasDaMesmaDoenca,
} from '../lib/prazos.js';
import { diaUtilAnterior, ehDiaUtil } from '../lib/calendario.js';
import { JANELAS, REGRAS_DE_PRAZO as R } from '../lib/regrasDePrazo.js';

const HOJE = '2026-10-13';
const dados = gerarDemonstracao(HOJE);
const teste = recortar(dados, { cliente: 'teste' });
const aprovacoes = listarAprovacoes(teste);
const prazos = listarPrazos(teste);
const hoje = diaDe(HOJE);

test('recorte por CNPJ: as unidades somam o cliente, sem repetir ninguém', () => {
  const unidades = dados.cnpjs.filter((item) => item.cliente_id === 'teste');
  const ids = { aprovacoes: [], prazos: [] };
  for (const unidade of unidades) {
    const recorte = recortar(dados, { cliente: 'teste', cnpj: unidade.id });
    assert.ok(recorte.pessoas.every((pessoa) => pessoa.cnpj_id === unidade.id));
    ids.aprovacoes.push(...listarAprovacoes(recorte).map((item) => item.id));
    // O 13º é um prazo de cada recorte, não de uma pessoa.
    ids.prazos.push(...listarPrazos(recorte).filter((item) => item.pessoa).map((item) => item.id));
  }
  assert.deepEqual(ids.aprovacoes.sort(), aprovacoes.map((item) => item.id).sort());
  assert.deepEqual(ids.prazos.sort(), prazos.filter((item) => item.pessoa).map((item) => item.id).sort());
  assert.equal(new Set(ids.prazos).size, ids.prazos.length);
});

test('aprovações: todo atestado pendente, todo pedido de férias e todo desligamento em aberto', () => {
  const pendentes = teste.afastamentos.filter((item) => item.atestado && item.validacao === 'Pendente');
  const pedidos = teste.ferias.filter((item) => item.situacao === 'aguardando aprovação');
  const abertos = teste.movimentacoes.filter((item) => item.tipo === 'Desligamento' && item.checklist !== 'Concluído');
  assert.equal(aprovacoes.filter((item) => item.tipo === 'atestado').length, pendentes.length);
  assert.equal(aprovacoes.filter((item) => item.tipo === 'ferias').length, pedidos.length);
  assert.equal(aprovacoes.filter((item) => item.tipo === 'desligamento').length, abertos.length);
  assert.ok(pendentes.length > 0 && pedidos.length > 0 && abertos.length > 0, 'a demonstração tem um de cada');
});

test('rescisão: 10 dias depois da saída, antecipada para o dia útil anterior', () => {
  for (const item of aprovacoes.filter((aprovacao) => aprovacao.tipo === 'desligamento')) {
    const saida = teste.movimentacoes.find((mov) => mov.id === item.id);
    const esperado = diaUtilAnterior(diaDe(saida.efetiva) + R.rescisao.dias);
    assert.equal(item.prazo.data, isoDe(esperado));
    assert.ok(ehDiaUtil(diaDe(item.prazo.data)));
  }
});

test('a tela inicial não carrega CID (LGPD)', () => {
  const cids = new Set(teste.afastamentos.map((item) => item.atestado?.cid).filter((cid) => cid && cid !== 'não informado'));
  const texto = JSON.stringify([aprovacoes, prazos]);
  for (const cid of cids) assert.ok(!texto.includes(cid), cid);
});

test('grupos e janelas: vencido, esta semana, 30 dias e até 60', () => {
  assert.ok(prazos.length > 0);
  for (const item of prazos) {
    assert.equal(item.dias, diaDe(item.data) - hoje);
    assert.equal(item.grupo, grupoDoPrazo(item.dias));
    assert.ok(item.dias <= JANELAS.adiante);
  }
  assert.deepEqual([...new Set(prazos.map((item) => item.grupo))].sort(), ['adiante', 'mes', 'semana', 'vencido']);
  assert.deepEqual(prazos.map((item) => item.dias), [...prazos.map((item) => item.dias)].sort((a, b) => a - b));
});

test('experiência: 45 dias contando a admissão, depois os 90', () => {
  const emExperiencia = teste.pessoas.filter(
    (pessoa) => pessoa.contrato === 'experiência' && !pessoa.desligamento && diaDe(pessoa.admissao) <= hoje
  );
  assert.ok(emExperiencia.length > 0);
  for (const pessoa of emExperiencia) {
    const admissao = diaDe(pessoa.admissao);
    const fim45 = admissao + R.experiencia.primeiroPeriodo - 1;
    const fim90 = admissao + R.experiencia.total - 1;
    const esperado = fim45 >= hoje ? fim45 : fim90 >= hoje ? fim90 : null;
    const achado = prazos.filter((item) => item.regra === 'experiencia' && item.pessoa.matricula === pessoa.matricula);
    if (esperado === null || grupoDoPrazo(esperado - hoje) === null) assert.equal(achado.length, 0);
    else assert.deepEqual(achado.map((item) => item.data), [isoDe(esperado)]);
  }
});

test('férias: vencidas sempre aparecem; aviso 30 dias antes e pagamento 2 dias antes, em dia útil', () => {
  const ativos = new Set(teste.pessoas.filter((pessoa) => !pessoa.desligamento).map((pessoa) => pessoa.id));
  const vencidas = teste.ferias.filter((item) => item.situacao === 'vencida' && ativos.has(item.pessoa_id));
  assert.equal(prazos.filter((item) => item.titulo === 'Férias vencidas').length, vencidas.length);
  let antecipados = 0;
  for (const ferias of teste.ferias.filter((item) => item.situacao === 'programada')) {
    const inicio = diaDe(ferias.inicio);
    const aviso = prazos.find((item) => item.id === `${ferias.id}-aviso`);
    const pagamento = prazos.find((item) => item.id === `${ferias.id}-pagamento`);
    if (aviso) assert.equal(aviso.data, isoDe(inicio - R.avisoDeFerias.antecedencia));
    if (pagamento) {
      const bruto = inicio - R.pagamentoDeFerias.antecedencia;
      assert.equal(pagamento.data, isoDe(diaUtilAnterior(bruto)));
      if (diaUtilAnterior(bruto) !== bruto) {
        antecipados += 1;
        assert.match(pagamento.detalhe, /vence no dia útil anterior/);
      }
    }
  }
  assert.ok(antecipados > 0, 'a demonstração tem um pagamento que cai em fim de semana');
});

test('13º: 30/11 e 20/12, antecipados para o dia útil anterior (em 2026, 20/12 é domingo)', () => {
  const novembro = gerarDemonstracao('2026-11-25');
  const decimo = listarPrazos(recortar(novembro, { cliente: 'teste' })).filter((item) => item.regra === 'decimoTerceiro');
  assert.deepEqual(decimo.map((item) => item.data), ['2026-11-30', '2026-12-18']);
  assert.match(decimo[1].detalhe, /20\/12 é domingo/);
  assert.ok(decimo.every((item) => item.pessoa === null));
});

test('INSS: afastamentos pela mesma doença em até 60 dias somam para os 15 dias', () => {
  const sequencias = sequenciasDaMesmaDoenca(teste.afastamentos);
  const somada = sequencias.find((sequencia) => sequencia.length > 1 && sequencia.reduce((s, item) => s + item.dias, 0) > 15
    && diaDe(sequencia[sequencia.length - 1].fim_previsto) >= hoje);
  assert.ok(somada, 'a demonstração tem dois afastamentos pela mesma doença que passam de 15 dias');
  const [primeiro, segundo] = somada;
  assert.equal(primeiro.atestado.cid, segundo.atestado.cid);
  assert.ok(diaDe(segundo.inicio) - diaDe(primeiro.fim_previsto) - 1 <= R.inss.mesmaDoencaEmDias);
  const prazo = prazos.find((item) => item.id === `${segundo.id}-inss`);
  // 16º dia somado: o segundo afastamento entra com os dias que faltam para 15.
  assert.equal(prazo.data, isoDe(diaDe(segundo.inicio) + (R.inss.diasPagosPelaEmpresa - primeiro.dias)));
  assert.match(prazo.detalhe, /somam 18 dias/);

  // Mais de 60 dias entre um e outro: não somam.
  const separados = sequenciasDaMesmaDoenca([
    { id: 'a', pessoa_id: 'p', tipo: 'Doença', inicio: '2026-01-01', fim_previsto: '2026-01-10', dias: 10, atestado: { cid: 'J11' } },
    { id: 'b', pessoa_id: 'p', tipo: 'Doença', inicio: '2026-03-15', fim_previsto: '2026-03-22', dias: 8, atestado: { cid: 'J11' } },
    { id: 'c', pessoa_id: 'p', tipo: 'Doença', inicio: '2026-03-25', fim_previsto: '2026-03-26', dias: 2, atestado: { cid: 'A09' } },
  ]);
  assert.deepEqual(separados.map((sequencia) => sequencia.map((item) => item.id)).sort(), [['a'], ['b'], ['c']]);
});

test('admissão marcada: registrar até a véspera', () => {
  const futura = teste.pessoas.find((pessoa) => diaDe(pessoa.admissao) > hoje);
  const registro = prazos.find((item) => item.regra === 'registroDeAdmissao');
  assert.equal(registro.pessoa.matricula, futura.matricula);
  assert.equal(registro.data, isoDe(diaDe(futura.admissao) - 1));
});

test('quem já saiu não tem prazo', () => {
  const saiu = new Set(teste.pessoas.filter((pessoa) => pessoa.desligamento).map((pessoa) => pessoa.matricula));
  assert.ok(prazos.every((item) => !item.pessoa || !saiu.has(item.pessoa.matricula)));
});

test('esperando você e urgentes', () => {
  assert.equal(contarEsperando(aprovacoes, prazos), aprovacoes.length + prazos.filter((item) => item.grupo === 'vencido').length);
  const urgentes = listarUrgentes(aprovacoes, prazos);
  assert.ok(urgentes.length > 0);
  assert.ok(urgentes.every((item) => (item.prazo ? item.prazo.dias : item.dias) <= JANELAS.urgente));
});

test('implantação: o que venceu antes dela fica "a conferir" até a revisão terminar', () => {
  const oficina = recortar(dados, { cliente: 'oficina-bom-motor' });
  assert.equal(oficina.cliente.revisao.concluida_em, null);
  const prazosDaOficina = listarPrazos(oficina);
  const aConferir = prazosDaOficina.filter((item) => item.grupo === 'conferir');
  assert.ok(aConferir.length > 0);
  assert.ok(aConferir.every((item) => item.data < oficina.cliente.implantacao));
  assert.ok(prazosDaOficina.filter((item) => item.grupo === 'vencido').every((item) => item.data >= oficina.cliente.implantacao));

  const revisao = listarRevisao(oficina, prazosDaOficina);
  assert.deepEqual([...new Set(revisao.map((item) => item.tipo))].sort(), ['documento', 'experiencia', 'prazo']);
  assert.ok(revisao.every((item) => item.conferido === false));

  // Revisão concluída: os alertas começam, e o que venceu antes passa a vencido.
  const concluida = { ...oficina, cliente: { ...oficina.cliente, revisao: { concluida_em: HOJE, conferidos: [] } } };
  const depois = listarPrazos(concluida);
  assert.equal(depois.filter((item) => item.grupo === 'conferir').length, 0);
  assert.equal(depois.filter((item) => item.grupo === 'vencido').length, aConferir.length + prazosDaOficina.filter((item) => item.grupo === 'vencido').length);
  assert.deepEqual(listarRevisao(concluida, depois), []);
});

test('implantação recente: só o que a planilha modelo traz', () => {
  const oficina = recortar(dados, { cliente: 'oficina-bom-motor' });
  const implantacao = oficina.cliente.implantacao;
  const umAnoAntes = isoDe(diaDe(implantacao) - 365);
  assert.ok(oficina.ocorrencias.every((item) => item.data >= implantacao), 'ocorrências antigas não vêm na planilha');
  assert.ok(oficina.pessoas.every((pessoa) => !pessoa.desligamento || pessoa.desligamento.data >= umAnoAntes));
  assert.ok(oficina.afastamentos.filter((item) => item.inicio < implantacao).every((item) => item.atestado && item.validacao === 'Aprovado'));
  const importados = [...oficina.pessoas, ...oficina.afastamentos].filter((item) => item.registrado_em < implantacao);
  assert.equal(importados.length, 0, 'o que veio antes entra com a data da implantação');
  assert.ok(oficina.pessoas.some((pessoa) => pessoa.registrado_por === 'Importação da planilha'));
});
