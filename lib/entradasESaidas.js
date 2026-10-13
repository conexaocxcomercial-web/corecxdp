/**
 * Admissões e desligamentos (fase 9 do redesenho): os passos de cada um, os
 * números da tela e os custos informados pela empresa. Os custos são
 * valores que a empresa registrou (exames, uniforme, rescisão paga), não
 * cálculos: cálculos trabalhistas são da contabilidade.
 *
 * Puro, sobre o recorte do alcance (lib/prazos.js › recortar); testado em
 * testes/entradas.test.js.
 */
import { diaDe, isoDe } from './calendario.js';
import { dataCurta } from './formato.js';
import { experienciaDe } from './pessoas.js';
import { prazoDaRescisao } from './prazos.js';
import { REGRAS_DE_PRAZO as R } from './regrasDePrazo.js';

const DOZE_MESES = 365;
const somarCentavos = (valores) => Math.round(valores.reduce((soma, valor) => soma + valor * 100, 0)) / 100;
const media = (total, quantidade) => (quantidade ? Math.round((total / quantidade) * 100) / 100 : null);

function custosPorPessoa(custos, momento) {
  const mapa = new Map();
  for (const item of custos || []) if (item.momento === momento) mapa.set(item.pessoa_id, item);
  return mapa;
}

function resumo(pessoa) {
  return { nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo, departamento: pessoa.departamento };
}

/**
 * Os passos da admissão: cadastro antes do primeiro dia, ASO admissional e
 * contrato (pelos documentos) e custos informados. Admissões anteriores à
 * implantação vieram da planilha modelo e não têm passos.
 */
export function passosDaAdmissao(pessoa, { documentos = [], custo = null, hoje, implantacao = null }) {
  if (implantacao && pessoa.admissao < implantacao) return null;
  const tem = (tipo) => documentos.some((item) => item.pessoa_id === pessoa.id && item.tipo === tipo);
  // O registro vence na véspera; como nos prazos (lib/prazos.js), o que já
  // passou conta como feito. Cadastrada depois da véspera fica marcada.
  const vespera = isoDe(diaDe(pessoa.admissao) - R.registroDeAdmissao.antecedencia);
  const passou = pessoa.admissao <= hoje;
  const tarde = Boolean(pessoa.registrado_em) && pessoa.registrado_em > vespera;
  return [
    {
      chave: 'registro',
      nome: 'Registro até a véspera',
      curto: 'registro',
      feito: passou,
      detalhe: !passou ? `até ${dataCurta(vespera)}` : tarde ? `cadastrada em ${dataCurta(pessoa.registrado_em)}, depois da véspera` : null,
      atraso: passou && tarde,
    },
    { chave: 'aso', nome: 'ASO admissional', curto: 'ASO admissional', feito: tem('ASO admissional'), detalhe: tem('ASO admissional') ? 'em Documentos' : 'falta anexar' },
    { chave: 'contrato', nome: 'Contrato de trabalho', curto: 'contrato', feito: tem('Contrato de trabalho'), detalhe: tem('Contrato de trabalho') ? 'em Documentos' : 'falta anexar' },
    { chave: 'custos', nome: 'Custos admissionais', curto: 'custos', feito: Boolean(custo), detalhe: custo ? null : 'falta informar', valor: custo?.total ?? null },
  ];
}

/**
 * Admissões do alcance: as marcadas (começam depois de hoje), as em
 * experiência e as dos últimos 12 meses, com os passos e os custos.
 */
export function resumoDasAdmissoes(recorte) {
  const hoje = recorte.hoje;
  const desde = isoDe(diaDe(hoje) - DOZE_MESES);
  const custos = custosPorPessoa(recorte.custos, 'admissao');
  const implantacao = recorte.cliente?.implantacao || null;

  const itens = recorte.pessoas
    .filter((pessoa) => pessoa.admissao && pessoa.admissao >= desde)
    .map((pessoa) => {
      const custo = custos.get(pessoa.id) || null;
      const passos = passosDaAdmissao(pessoa, { documentos: recorte.documentos, custo, hoje, implantacao });
      return {
        id: pessoa.id,
        pessoa: resumo(pessoa),
        admissao: pessoa.admissao,
        contrato: pessoa.contrato,
        salario: pessoa.salario ?? null,
        registrado_por: pessoa.registrado_por,
        desligamento: pessoa.desligamento ? pessoa.desligamento.data : null,
        experiencia: pessoa.desligamento || pessoa.admissao > hoje ? null : experienciaDe(pessoa, hoje),
        futura: pessoa.admissao > hoje,
        custo,
        passos,
        faltam: passos ? passos.filter((passo) => !passo.feito).length : 0,
      };
    })
    .sort((a, b) => (a.admissao < b.admissao ? 1 : a.admissao > b.admissao ? -1 : 0));

  const passadas = itens.filter((item) => !item.futura);
  const comCusto = passadas.filter((item) => item.custo);
  const total = somarCentavos(comCusto.map((item) => item.custo.total));
  return {
    futuras: itens.filter((item) => item.futura).sort((a, b) => (a.admissao < b.admissao ? -1 : 1)),
    emExperiencia: itens.filter((item) => item.experiencia && item.experiencia.fase !== 'encerrado'),
    itens,
    numeros: {
      admissoes: passadas.length,
      futuras: itens.length - passadas.length,
      custoInformado: total,
      custoMedio: media(total, comCusto.length),
      comCusto: comCusto.length,
      retidas: passadas.filter((item) => !item.desligamento).length,
    },
  };
}

/**
 * Os passos do desligamento: registro (último dia, tipo e motivo), rescisão
 * paga até o prazo (10 dias, no dia útil anterior) e custos informados.
 */
export function passosDoDesligamento(movimentacao, { custo = null, hoje }) {
  const prazo = prazoDaRescisao(movimentacao.efetiva);
  const concluido = movimentacao.checklist === 'Concluído';
  const faltam = diaDe(prazo.data) - diaDe(hoje);
  return {
    prazo: { ...prazo, dias: faltam },
    passos: [
      { chave: 'registro', nome: 'Último dia, tipo e motivo', feito: true, detalhe: `último dia em ${dataCurta(movimentacao.efetiva)}` },
      {
        chave: 'rescisao',
        nome: 'Rescisão paga',
        feito: concluido,
        detalhe: concluido ? 'concluído' : `até ${dataCurta(prazo.data)}${prazo.nota ? ` (${prazo.nota})` : ''}`,
        atraso: !concluido && faltam < 0,
      },
      { chave: 'custos', nome: 'Custos demissionais', feito: Boolean(custo), detalhe: custo ? null : 'falta informar', valor: custo?.total ?? null },
    ],
  };
}

/**
 * Desligamentos do alcance: os que faltam concluir (do prazo mais perto
 * para o mais distante) e os dos últimos 12 meses, mais os marcados para
 * depois de hoje (aviso trabalhado), com os custos informados. Os números
 * contam só os que já aconteceram.
 */
export function resumoDosDesligamentos(recorte) {
  const hoje = recorte.hoje;
  const desde = isoDe(diaDe(hoje) - DOZE_MESES);
  const custos = custosPorPessoa(recorte.custos, 'desligamento');
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));

  const itens = recorte.movimentacoes
    .filter((item) => item.tipo === 'Desligamento')
    .map((movimentacao) => {
      const pessoa = pessoaPorId.get(movimentacao.pessoa_id);
      if (!pessoa) return null;
      const custo = custos.get(pessoa.id) || null;
      const { prazo, passos } = passosDoDesligamento(movimentacao, { custo, hoje });
      const concluido = movimentacao.checklist === 'Concluído';
      return {
        id: movimentacao.id,
        pessoa: resumo(pessoa),
        data: movimentacao.efetiva,
        tipo: pessoa.desligamento?.tipo || null,
        motivo: pessoa.desligamento?.motivo || movimentacao.motivo,
        admissao: pessoa.admissao,
        futuro: movimentacao.efetiva > hoje,
        concluido,
        prazo,
        passos,
        custo,
        registrado_por: movimentacao.registrado_por,
      };
    })
    .filter(Boolean);

  const abertos = itens.filter((item) => !item.concluido).sort((a, b) => (a.prazo.data < b.prazo.data ? -1 : 1));
  const recentes = itens
    .filter((item) => item.data >= desde)
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  const doAno = recentes.filter((item) => !item.futuro);
  const comCusto = doAno.filter((item) => item.custo);
  const total = somarCentavos(comCusto.map((item) => item.custo.total));
  return {
    abertos,
    itens: recentes,
    numeros: {
      desligamentos: doAno.length,
      marcados: recentes.length - doAno.length,
      abertos: abertos.length,
      custoInformado: total,
      custoMedio: media(total, comCusto.length),
      comCusto: comCusto.length,
      semCusto: doAno.length - comCusto.length,
    },
  };
}
