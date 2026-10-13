/**
 * Indicadores em três camadas (fase 10 do redesenho): a central com os
 * temas, o painel de cada tema e o detalhe de cada indicador, do número à
 * pessoa. Calculados sobre o recorte do alcance (lib/prazos.js › recortar),
 * com as datas em ISO; funcionam também com o recorte que adapta a planilha.
 *
 * Saúde (LGPD): sempre agregada. Grupo com menos de 3 pessoas fica oculto
 * ("Oculto por privacidade: menos de 3 pessoas") e os indicadores de saúde
 * não listam pessoas.
 *
 * Puro; testado em testes/paineis.test.js.
 */
import { diaDe, ehDiaUtil, isoDe } from './calendario.js';
import { experienciaDe } from './pessoas.js';
import { fimDoGozo } from './ferias.js';
import { competencias, folhaDoMes } from './folha.js';
import { emVigor } from './beneficios.js';

export const MINIMO_PARA_SAUDE = 3;
export const OCULTO = 'Oculto por privacidade: menos de 3 pessoas';
export const PERIODOS = [3, 6, 12];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MOVIMENTACOES_DO_CONTRATO = ['Alteração Salarial', 'Promoção', 'Mudança de Cargo', 'Transferência'];
const COM_ATESTADO = ['Doença', 'Acidente de trabalho'];

const arredondar = (valor, casas = 1) => Math.round(valor * 10 ** casas) / 10 ** casas;
const taxa = (parte, todo) => (todo ? (parte / todo) * 100 : 0);

/* ------------------------------------------------------------- período */

/** Os últimos `meses` meses até hoje; o mês corrente vai só até hoje. */
export function periodoDe(hojeIso, meses) {
  const [ano, mes] = hojeIso.split('-').map(Number);
  const lista = [];
  for (let recuo = meses - 1; recuo >= 0; recuo -= 1) {
    const inicio = new Date(Date.UTC(ano, mes - 1 - recuo, 1));
    const fimDoMes = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0));
    const fim = isoDe(Math.min(diaDe(fimDoMes.toISOString().slice(0, 10)), diaDe(hojeIso)));
    let uteis = 0;
    for (let dia = diaDe(inicio.toISOString().slice(0, 10)); dia <= diaDe(fim); dia += 1) if (ehDiaUtil(dia)) uteis += 1;
    lista.push({
      inicio: inicio.toISOString().slice(0, 10),
      fim,
      diasUteis: uteis,
      rotulo: `${MESES[inicio.getUTCMonth()]}/${String(inicio.getUTCFullYear()).slice(2)}`,
    });
  }
  return lista;
}

/* ------------------------------------------------------------ recortes */

/** O recorte só com as pessoas de um departamento (e os eventos delas). */
export function porDepartamento(recorte, departamento) {
  if (!departamento) return recorte;
  return restringir(recorte, (pessoa) => pessoa.departamento === departamento);
}

function restringir(recorte, filtro) {
  const pessoas = recorte.pessoas.filter(filtro);
  const ids = new Set(pessoas.map((pessoa) => pessoa.id));
  const delas = (lista) => (lista || []).filter((item) => ids.has(item.pessoa_id));
  return {
    ...recorte,
    pessoas,
    ocorrencias: delas(recorte.ocorrencias),
    afastamentos: delas(recorte.afastamentos),
    movimentacoes: delas(recorte.movimentacoes),
    ferias: delas(recorte.ferias),
    documentos: delas(recorte.documentos),
    adesoes: delas(recorte.adesoes),
    custos: delas(recorte.custos),
  };
}

/* -------------------------------------------------------------- contas */

/** Ativa no dia: já admitida e ainda não saiu (o último dia de trabalho conta). */
export function ativaEm(pessoa, diaIso) {
  if (!pessoa.admissao || pessoa.admissao > diaIso) return false;
  return !pessoa.desligamento?.data || pessoa.desligamento.data >= diaIso;
}

const fimDoAfastamento = (item) => (item.retorno ? isoDe(diaDe(item.retorno) - 1) : item.fim_previsto);
const comAtestadoValido = (item) => COM_ATESTADO.includes(item.tipo) && item.atestado && item.validacao !== 'Rejeitado';

function diasEntre(item, inicio, fim, { uteis }) {
  const de = Math.max(diaDe(item.inicio), diaDe(inicio));
  const ate = Math.min(diaDe(fimDoAfastamento(item)), diaDe(fim));
  let total = 0;
  for (let dia = de; dia <= ate; dia += 1) if (!uteis || ehDiaUtil(dia)) total += 1;
  return total;
}

/** Os números de um mês (ou de qualquer intervalo) para um conjunto de pessoas. */
function numerosDoMes(recorte, mes) {
  const vespera = isoDe(diaDe(mes.inicio) - 1);
  const quadroInicio = recorte.pessoas.filter((pessoa) => ativaEm(pessoa, vespera)).length;
  const quadroFim = recorte.pessoas.filter((pessoa) => ativaEm(pessoa, mes.fim)).length;
  const quadroMedio = (quadroInicio + quadroFim) / 2 || quadroFim;
  const no = (data) => data && data >= mes.inicio && data <= mes.fim;
  const admissoes = recorte.pessoas.filter((pessoa) => no(pessoa.admissao)).length;
  const saidas = recorte.pessoas.filter((pessoa) => no(pessoa.desligamento?.data)).length;
  const faltas = recorte.ocorrencias.filter((item) => item.tipo.startsWith('Falta') && no(item.data)).length;
  const atestados = recorte.afastamentos.filter(comAtestadoValido);
  const diasPerdidos = atestados.reduce((soma, item) => soma + diasEntre(item, mes.inicio, mes.fim, { uteis: true }), 0);
  const diasDeAtestado = atestados.reduce((soma, item) => soma + diasEntre(item, mes.inicio, mes.fim, { uteis: false }), 0);
  const afastadas = new Set(
    recorte.afastamentos.filter((item) => item.inicio <= mes.fim && fimDoAfastamento(item) >= mes.fim).map((item) => item.pessoa_id)
  ).size;
  const movimentacoes = recorte.movimentacoes.filter((item) => MOVIMENTACOES_DO_CONTRATO.includes(item.tipo) && no(item.efetiva));
  const noQuadroNoFim = new Set(recorte.pessoas.filter((pessoa) => ativaEm(pessoa, mes.fim)).map((pessoa) => pessoa.id));
  const ferias = (recorte.ferias || []).filter((item) => noQuadroNoFim.has(item.pessoa_id));
  return {
    quadroInicio,
    quadroFim,
    quadroMedio,
    admissoes,
    saidas,
    faltas,
    diasPerdidos: faltas + diasPerdidos,
    diasDeAtestado,
    afastadas,
    turnover: taxa((admissoes + saidas) / 2, quadroMedio),
    absenteismo: taxa(faltas + diasPerdidos, quadroMedio * mes.diasUteis),
    movimentacoes: movimentacoes.length,
    promocoes: movimentacoes.filter((item) => item.tipo === 'Promoção').length,
    reajustes: movimentacoes.filter((item) => item.tipo === 'Alteração Salarial').length,
    // Férias: quem tirou algum dia no mês e quem tinha período vencido no último dia do mês.
    deFerias: new Set(
      ferias.filter((item) => item.inicio && aprovadas(item) && item.inicio <= mes.fim && fimDoGozo(item) >= mes.inicio).map((item) => item.pessoa_id)
    ).size,
    comVencidas: new Set(
      ferias.filter((item) => item.concessivo_fim < mes.fim && (!item.inicio || item.inicio > mes.fim || !aprovadas(item))).map((item) => item.pessoa_id)
    ).size,
  };
}

const aprovadas = (item) => ['programada', 'em andamento', 'gozada'].includes(item.situacao);

/** O período inteiro: soma dos meses, com as taxas sobre o quadro médio do período. */
function numerosDoPeriodo(recorte, periodo) {
  const meses = periodo.map((mes) => ({ ...mes, ...numerosDoMes(recorte, mes) }));
  const soma = (campo) => meses.reduce((total, mes) => total + mes[campo], 0);
  const quadroMedio = meses.reduce((total, mes) => total + mes.quadroMedio, 0) / (meses.length || 1);
  const diasUteis = meses.reduce((total, mes) => total + mes.diasUteis, 0);
  return {
    meses,
    quadroMedio,
    admissoes: soma('admissoes'),
    saidas: soma('saidas'),
    faltas: soma('faltas'),
    diasPerdidos: soma('diasPerdidos'),
    diasDeAtestado: soma('diasDeAtestado'),
    movimentacoes: soma('movimentacoes'),
    promocoes: soma('promocoes'),
    reajustes: soma('reajustes'),
    // Turnover do período: média de entradas e saídas sobre o quadro médio, no período inteiro.
    turnover: taxa((soma('admissoes') + soma('saidas')) / 2, quadroMedio),
    absenteismo: taxa(soma('diasPerdidos'), quadroMedio * diasUteis),
  };
}

function anosDeCasa(pessoa, hoje) {
  return (diaDe(hoje) - diaDe(pessoa.admissao)) / 365.25;
}

const FAIXAS_DE_CASA = [
  { rotulo: 'até 1 ano', ate: 1 },
  { rotulo: '1 a 3 anos', ate: 3 },
  { rotulo: '3 a 5 anos', ate: 5 },
  { rotulo: '5 a 10 anos', ate: 10 },
  { rotulo: 'mais de 10 anos', ate: Infinity },
];

/* ------------------------------------------------------------- catálogo */

/*
 * Cada indicador: como se lê (formato), o número do período, a série mês a
 * mês, a explicação, como fica num recorte e quem está por trás (pessoas).
 * Os de saúde não listam pessoas.
 */
const INDICADORES = {
  quadro: [
    {
      chave: 'ativos',
      nome: 'Pessoas no quadro',
      formato: 'numero',
      explicacao: 'Pessoas admitidas e ainda não desligadas hoje. O último dia de trabalho ainda conta como no quadro.',
      valor: (ctx) => ctx.ativas.length,
      apoio: (ctx) => `quadro médio de ${arredondar(ctx.periodo.quadroMedio, 0)} no período`,
      serie: (mes) => mes.quadroFim,
      nomeDaSerie: 'Quadro no fim de cada mês',
      noGrupo: (ctx) => ctx.ativas.length,
      pessoas: (ctx) =>
        ctx.ativas
          .map((pessoa) => ({ pessoa, valor: tempoDeCasaCurto(anosDeCasa(pessoa, ctx.hoje)), ordem: -diaDe(pessoa.admissao), aba: 'contrato' }))
          .sort((a, b) => b.ordem - a.ordem),
      rotuloDoValor: 'Tempo de casa',
    },
    {
      chave: 'turnover',
      nome: 'Turnover',
      formato: 'percentual',
      explicacao:
        'A média entre admissões e desligamentos do período, dividida pelo quadro médio (a média entre o começo e o fim de cada mês). Mês a mês, a mesma conta com o quadro do mês.',
      valor: (ctx) => ctx.periodo.turnover,
      apoio: (ctx) => `${ctx.periodo.admissoes} ${ctx.periodo.admissoes === 1 ? 'admissão' : 'admissões'} e ${ctx.periodo.saidas} ${ctx.periodo.saidas === 1 ? 'saída' : 'saídas'}`,
      serie: (mes) => mes.turnover,
      noGrupo: (ctx) => ctx.periodo.turnover,
      pessoas: (ctx) =>
        ctx.recorte.pessoas
          .filter((pessoa) => noPeriodo(ctx, pessoa.desligamento?.data))
          .map((pessoa) => ({ pessoa, valor: `saiu em ${br(pessoa.desligamento.data)}`, detalhe: pessoa.desligamento.tipo, ordem: diaDe(pessoa.desligamento.data), aba: 'desligamento' }))
          .sort((a, b) => b.ordem - a.ordem),
      rotuloDoValor: 'Saída',
      notaDasPessoas: 'quem saiu no período',
    },
    {
      chave: 'admissoes',
      nome: 'Admissões',
      formato: 'numero',
      explicacao: 'Pessoas com o primeiro dia de trabalho dentro do período.',
      valor: (ctx) => ctx.periodo.admissoes,
      apoio: (ctx) => `${ctx.recorte.pessoas.filter((pessoa) => noPeriodo(ctx, pessoa.admissao) && ativaEm(pessoa, ctx.hoje)).length} seguem no quadro`,
      serie: (mes) => mes.admissoes,
      noGrupo: (ctx) => ctx.periodo.admissoes,
      pessoas: (ctx) =>
        ctx.recorte.pessoas
          .filter((pessoa) => noPeriodo(ctx, pessoa.admissao))
          .map((pessoa) => ({ pessoa, valor: `entrou em ${br(pessoa.admissao)}`, ordem: diaDe(pessoa.admissao), aba: 'contrato' }))
          .sort((a, b) => b.ordem - a.ordem),
      rotuloDoValor: 'Admissão',
    },
    {
      chave: 'tempo-de-casa',
      nome: 'Tempo médio de casa',
      formato: 'anos',
      explicacao: 'A média do tempo desde a admissão de quem está no quadro hoje.',
      valor: (ctx) => (ctx.ativas.length ? ctx.ativas.reduce((soma, pessoa) => soma + anosDeCasa(pessoa, ctx.hoje), 0) / ctx.ativas.length : 0),
      apoio: (ctx) => {
        const novas = ctx.ativas.filter((pessoa) => anosDeCasa(pessoa, ctx.hoje) < 1).length;
        return `${novas} com menos de 1 ano`;
      },
      noGrupo: (ctx) => (ctx.ativas.length ? ctx.ativas.reduce((soma, pessoa) => soma + anosDeCasa(pessoa, ctx.hoje), 0) / ctx.ativas.length : 0),
      distribuicao: (ctx) =>
        FAIXAS_DE_CASA.map((faixa, indice) => ({
          rotulo: faixa.rotulo,
          valor: ctx.ativas.filter((pessoa) => {
            const anos = anosDeCasa(pessoa, ctx.hoje);
            return anos < faixa.ate && anos >= (FAIXAS_DE_CASA[indice - 1]?.ate ?? 0);
          }).length,
        })),
      pessoas: (ctx) =>
        ctx.ativas
          .map((pessoa) => ({ pessoa, valor: tempoDeCasaCurto(anosDeCasa(pessoa, ctx.hoje)), ordem: -diaDe(pessoa.admissao), aba: 'contrato' }))
          .sort((a, b) => a.ordem - b.ordem),
      rotuloDoValor: 'Tempo de casa',
    },
    {
      chave: 'experiencia',
      nome: 'Em experiência',
      formato: 'numero',
      explicacao: 'Pessoas no contrato de experiência hoje (até 90 dias, com os prazos de 45 e de 90 dias).',
      valor: (ctx) => ctx.emExperiencia.length,
      apoio: () => 'prazos em Admissões',
      noGrupo: (ctx) => ctx.emExperiencia.length,
      pessoas: (ctx) =>
        ctx.emExperiencia.map(({ pessoa, experiencia }) => ({
          pessoa,
          valor: `${experiencia.fase === 'primeiro' ? '45 dias em' : '90 dias em'} ${br(experiencia.fase === 'primeiro' ? experiencia.primeiroPeriodo : experiencia.fim)}`,
          ordem: diaDe(experiencia.fase === 'primeiro' ? experiencia.primeiroPeriodo : experiencia.fim),
          aba: 'contrato',
        })).sort((a, b) => a.ordem - b.ordem),
      rotuloDoValor: 'Próximo prazo',
    },
  ],
  saude: [
    {
      chave: 'absenteismo',
      nome: 'Absenteísmo',
      formato: 'percentual',
      saude: true,
      explicacao:
        'Dias perdidos (faltas e dias úteis de atestado por doença ou acidente, menos os rejeitados) sobre o quadro médio vezes os dias úteis do período. Atestado que atravessa a virada do mês tem os dias divididos entre os meses.',
      valor: (ctx) => ctx.periodo.absenteismo,
      apoio: (ctx) => `${ctx.periodo.diasPerdidos} ${ctx.periodo.diasPerdidos === 1 ? 'dia perdido' : 'dias perdidos'}`,
      serie: (mes) => mes.absenteismo,
      noGrupo: (ctx) => ctx.periodo.absenteismo,
    },
    {
      chave: 'dias-de-atestado',
      nome: 'Dias de atestado',
      formato: 'dias',
      saude: true,
      explicacao: 'Dias corridos de afastamento com atestado por doença ou acidente de trabalho dentro do período, menos os atestados rejeitados.',
      valor: (ctx) => ctx.periodo.diasDeAtestado,
      apoio: (ctx) => {
        const atestados = ctx.recorte.afastamentos.filter((item) => comAtestadoValido(item) && item.inicio <= ctx.fim && fimDoAfastamento(item) >= ctx.inicio).length;
        return `${atestados} ${atestados === 1 ? 'atestado' : 'atestados'}`;
      },
      serie: (mes) => mes.diasDeAtestado,
      noGrupo: (ctx) => ctx.periodo.diasDeAtestado,
    },
    {
      chave: 'afastadas',
      nome: 'Pessoas afastadas hoje',
      formato: 'numero',
      saude: true,
      explicacao: 'Pessoas com um afastamento em curso hoje, de qualquer tipo (doença, acidente, licenças e outros). Mês a mês, as afastadas no último dia do mês.',
      valor: (ctx) => new Set(ctx.recorte.afastamentos.filter((item) => item.inicio <= ctx.hoje && fimDoAfastamento(item) >= ctx.hoje).map((item) => item.pessoa_id)).size,
      apoio: () => 'todos os tipos de afastamento',
      serie: (mes) => mes.afastadas,
      nomeDaSerie: 'Afastadas no último dia de cada mês',
      noGrupo: (ctx) => new Set(ctx.recorte.afastamentos.filter((item) => item.inicio <= ctx.hoje && fimDoAfastamento(item) >= ctx.hoje).map((item) => item.pessoa_id)).size,
    },
    {
      chave: 'faltas',
      nome: 'Faltas',
      formato: 'numero',
      explicacao: 'Faltas justificadas e injustificadas registradas em Ocorrências dentro do período. Não é dado de saúde: a lista mostra quem faltou.',
      valor: (ctx) => ctx.periodo.faltas,
      apoio: (ctx) => {
        const injustificadas = ctx.recorte.ocorrencias.filter((item) => item.tipo === 'Falta Injustificada' && noPeriodo(ctx, item.data)).length;
        return `${injustificadas} ${injustificadas === 1 ? 'injustificada' : 'injustificadas'}`;
      },
      serie: (mes) => mes.faltas,
      noGrupo: (ctx) => ctx.periodo.faltas,
      pessoas: (ctx) => {
        const porPessoa = new Map();
        for (const item of ctx.recorte.ocorrencias) {
          if (!item.tipo.startsWith('Falta') || !noPeriodo(ctx, item.data)) continue;
          porPessoa.set(item.pessoa_id, (porPessoa.get(item.pessoa_id) || 0) + 1);
        }
        const pessoaPorId = new Map(ctx.recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
        return [...porPessoa]
          .map(([id, total]) => ({ pessoa: pessoaPorId.get(id), valor: `${total} ${total === 1 ? 'falta' : 'faltas'}`, ordem: total, aba: 'ocorrencias' }))
          .filter((item) => item.pessoa)
          .sort((a, b) => b.ordem - a.ordem);
      },
      rotuloDoValor: 'No período',
      notaDasPessoas: 'quem faltou, de quem faltou mais para quem faltou menos',
    },
  ],
  movimentacoes: [
    {
      chave: 'movimentacoes',
      nome: 'Movimentações',
      formato: 'numero',
      explicacao: 'Reajustes, promoções, mudanças de cargo e transferências que passaram a valer dentro do período. Desligamentos e afastamentos têm indicadores próprios.',
      valor: (ctx) => ctx.periodo.movimentacoes,
      apoio: (ctx) => `${ctx.periodo.promocoes} ${ctx.periodo.promocoes === 1 ? 'promoção' : 'promoções'}`,
      serie: (mes) => mes.movimentacoes,
      noGrupo: (ctx) => ctx.periodo.movimentacoes,
      distribuicao: (ctx) =>
        MOVIMENTACOES_DO_CONTRATO.map((tipo) => ({
          rotulo: tipo,
          valor: ctx.recorte.movimentacoes.filter((item) => item.tipo === tipo && noPeriodo(ctx, item.efetiva)).length,
        })).filter((item) => item.valor > 0),
      pessoas: (ctx) => movimentacoesDoPeriodo(ctx, MOVIMENTACOES_DO_CONTRATO),
      rotuloDoValor: 'Movimentação',
    },
    {
      chave: 'promocoes',
      nome: 'Promoções',
      formato: 'numero',
      explicacao: 'Promoções que passaram a valer dentro do período.',
      valor: (ctx) => ctx.periodo.promocoes,
      apoio: (ctx) => `${arredondar(taxa(ctx.periodo.promocoes, ctx.periodo.quadroMedio), 1).toString().replace('.', ',')}% do quadro médio`,
      serie: (mes) => mes.promocoes,
      noGrupo: (ctx) => ctx.periodo.promocoes,
      pessoas: (ctx) => movimentacoesDoPeriodo(ctx, ['Promoção']),
      rotuloDoValor: 'Passou a valer',
    },
    {
      chave: 'reajustes',
      nome: 'Reajustes salariais',
      formato: 'numero',
      explicacao: 'Alterações salariais (convenção coletiva, mérito ou outras) que passaram a valer dentro do período. Os valores ficam na ficha, mascarados.',
      valor: (ctx) => ctx.periodo.reajustes,
      apoio: () => 'alteração salarial',
      serie: (mes) => mes.reajustes,
      noGrupo: (ctx) => ctx.periodo.reajustes,
      pessoas: (ctx) => movimentacoesDoPeriodo(ctx, ['Alteração Salarial']),
      rotuloDoValor: 'Passou a valer',
    },
  ],
};

const ATE_90 = 90;

function feriasDeHoje(ctx) {
  const ativas = new Set(ctx.ativas.map((pessoa) => pessoa.id));
  return (ctx.recorte.ferias || []).filter((item) => ativas.has(item.pessoa_id));
}

function listaDeFerias(ctx, filtro, valor, ordem) {
  const pessoaPorId = new Map(ctx.ativas.map((pessoa) => [pessoa.id, pessoa]));
  return feriasDeHoje(ctx)
    .filter(filtro)
    .map((item) => ({ pessoa: pessoaPorId.get(item.pessoa_id), valor: valor(item), ordem: ordem(item), aba: 'ferias' }))
    .filter((item) => item.pessoa)
    .sort((a, b) => a.ordem - b.ordem);
}

const vencidasHoje = (ctx) => feriasDeHoje(ctx).filter((item) => item.situacao === 'vencida');
const vencendoEm90 = (ctx) => {
  const ate = isoDe(diaDe(ctx.hoje) + ATE_90);
  return feriasDeHoje(ctx).filter((item) => ['a vencer', 'a programar'].includes(item.situacao) && item.concessivo_fim <= ate);
};
const programadasEm90 = (ctx) => {
  const ate = isoDe(diaDe(ctx.hoje) + ATE_90);
  return feriasDeHoje(ctx).filter((item) => item.situacao === 'programada' && item.inicio <= ate);
};
const pessoasDe = (lista) => new Set(lista.map((item) => item.pessoa_id)).size;

INDICADORES.ferias = [
  {
    chave: 'vencidas',
    nome: 'Pessoas com férias vencidas',
    formato: 'numero',
    explicacao: 'Pessoas do quadro com um período aquisitivo cujo prazo para tirar (o período concessivo de 12 meses) já acabou sem as férias. Essas férias saem com pagamento em dobro; o valor fica com a contabilidade.',
    valor: (ctx) => pessoasDe(vencidasHoje(ctx)),
    apoio: (ctx) => `${vencidasHoje(ctx).reduce((soma, item) => soma + item.dias, 0)} dias por tirar em dobro`,
    serie: (mes) => mes.comVencidas,
    nomeDaSerie: 'Com férias vencidas no fim de cada mês',
    noGrupo: (ctx) => pessoasDe(vencidasHoje(ctx)),
    pessoas: (ctx) =>
      listaDeFerias(ctx, (item) => item.situacao === 'vencida', (item) => `venceu em ${br(item.concessivo_fim)}`, (item) => diaDe(item.concessivo_fim)),
    rotuloDoValor: 'Período',
  },
  {
    chave: 'em-dia',
    nome: 'Quadro com férias em dia',
    formato: 'percentual',
    explicacao: 'A parte do quadro de hoje sem nenhum período de férias vencido.',
    valor: (ctx) => (ctx.ativas.length ? taxa(ctx.ativas.length - pessoasDe(vencidasHoje(ctx)), ctx.ativas.length) : 100),
    apoio: (ctx) => `${ctx.ativas.length - pessoasDe(vencidasHoje(ctx))} de ${ctx.ativas.length} pessoas`,
    noGrupo: (ctx) => (ctx.ativas.length ? taxa(ctx.ativas.length - pessoasDe(vencidasHoje(ctx)), ctx.ativas.length) : 100),
  },
  {
    chave: 'vencendo',
    nome: 'Vencendo em 90 dias',
    formato: 'numero',
    explicacao: 'Pessoas com dias de férias por tirar cujo prazo acaba nos próximos 90 dias, ainda sem programação. Programar evita o pagamento em dobro.',
    valor: (ctx) => pessoasDe(vencendoEm90(ctx)),
    apoio: () => 'programar para não vencer',
    noGrupo: (ctx) => pessoasDe(vencendoEm90(ctx)),
    pessoas: (ctx) => {
      const ate = isoDe(diaDe(ctx.hoje) + ATE_90);
      return listaDeFerias(
        ctx,
        (item) => ['a vencer', 'a programar'].includes(item.situacao) && item.concessivo_fim <= ate,
        (item) => `tirar até ${br(item.concessivo_fim)}`,
        (item) => diaDe(item.concessivo_fim)
      );
    },
    rotuloDoValor: 'Prazo',
  },
  {
    chave: 'programadas',
    nome: 'Programadas',
    formato: 'numero',
    explicacao: 'Férias aprovadas que começam nos próximos 90 dias.',
    valor: (ctx) => programadasEm90(ctx).length,
    apoio: (ctx) => `${programadasEm90(ctx).reduce((soma, item) => soma + item.dias, 0)} dias no total`,
    noGrupo: (ctx) => programadasEm90(ctx).length,
    pessoas: (ctx) => {
      const ate = isoDe(diaDe(ctx.hoje) + ATE_90);
      return listaDeFerias(
        ctx,
        (item) => item.situacao === 'programada' && item.inicio <= ate,
        (item) => `${br(item.inicio)}, ${item.dias} dias`,
        (item) => diaDe(item.inicio)
      );
    },
    rotuloDoValor: 'Começa',
  },
  {
    chave: 'de-ferias',
    nome: 'De férias hoje',
    formato: 'numero',
    explicacao: 'Pessoas em férias hoje. Mês a mês, quem tirou ao menos um dia de férias no mês.',
    valor: (ctx) => pessoasDe(feriasDeHoje(ctx).filter((item) => item.situacao === 'em andamento')),
    apoio: () => 'férias em andamento',
    serie: (mes) => mes.deFerias,
    nomeDaSerie: 'De férias em algum dia do mês',
    noGrupo: (ctx) => pessoasDe(feriasDeHoje(ctx).filter((item) => item.situacao === 'em andamento')),
    pessoas: (ctx) =>
      listaDeFerias(ctx, (item) => item.situacao === 'em andamento', (item) => `volta em ${br(isoDe(diaDe(fimDoGozo(item)) + 1))}`, (item) => diaDe(item.inicio)),
    rotuloDoValor: 'Retorno',
  },
];

/* Custos: a folha gerencial de cada mês (estimativa). Sem lista de pessoas:
   o custo de cada uma revela o salário, que fica mascarado na folha. */
function folhaDoContexto(ctx, mes) {
  const competencia = mes
    ? { valor: mes.inicio.slice(0, 7), inicio: mes.inicio, fim: mes.fim, referencia: mes.fim }
    : competencias(ctx.hoje, 1)[0];
  // Os indicadores do tema usam a mesma folha de cada mês: calcula uma vez.
  if (!ctx.folhas) ctx.folhas = new Map();
  if (!ctx.folhas.has(competencia.referencia)) ctx.folhas.set(competencia.referencia, folhaDoMes(ctx.recorte, competencia).totais);
  return ctx.folhas.get(competencia.referencia);
}
const folhaDeHoje = (ctx) => {
  if (!ctx.folha) ctx.folha = folhaDoContexto(ctx);
  return ctx.folha;
};
const reais = (valor) => `R$ ${Math.round(valor).toLocaleString('pt-BR')}`;

INDICADORES.custos = [
  {
    chave: 'custo-total',
    nome: 'Custo estimado de pessoal',
    formato: 'reais',
    estimativa: true,
    explicacao: 'Salários, provisões de férias e 13º, encargos (o percentual da empresa) e benefícios de quem está no quadro no fim do mês. No mês atual, o quadro de hoje.',
    valor: (ctx) => folhaDeHoje(ctx).total,
    apoio: (ctx) => `fator de custo ${String(folhaDeHoje(ctx).fatorDeCusto ?? '—').replace('.', ',')}`,
    serie: (mes, ctx) => folhaDoContexto(ctx, mes).total,
    noGrupo: (ctx) => folhaDeHoje(ctx).total,
  },
  {
    chave: 'fator',
    nome: 'Fator de custo',
    formato: 'fator',
    estimativa: true,
    explicacao: 'Quanto cada R$ 1 de salário custa para a empresa: o custo estimado de pessoal dividido pela soma dos salários.',
    valor: (ctx) => folhaDeHoje(ctx).fatorDeCusto,
    apoio: () => 'por R$ 1 de salário',
    serie: (mes, ctx) => folhaDoContexto(ctx, mes).fatorDeCusto || 0,
    noGrupo: (ctx) => folhaDeHoje(ctx).fatorDeCusto,
  },
  {
    chave: 'salarios',
    nome: 'Salários',
    formato: 'reais',
    estimativa: true,
    explicacao: 'A soma dos salários cadastrados de quem está no quadro, com os reajustes já em vigor.',
    valor: (ctx) => folhaDeHoje(ctx).salarios,
    apoio: (ctx) => `${ctx.ativas.length} pessoas no quadro`,
    serie: (mes, ctx) => folhaDoContexto(ctx, mes).salarios,
    noGrupo: (ctx) => folhaDeHoje(ctx).salarios,
  },
  {
    chave: 'encargos',
    nome: 'Encargos',
    formato: 'reais',
    estimativa: true,
    explicacao: 'Um percentual único sobre salários e provisões: o padrão do regime tributário ou o percentual configurado para a empresa.',
    valor: (ctx) => folhaDeHoje(ctx).encargos,
    apoio: (ctx) => `${String(Math.round(folhaDeHoje(ctx).percentualDeEncargos * 1000) / 10).replace('.', ',')}% sobre salários e provisões`,
    serie: (mes, ctx) => folhaDoContexto(ctx, mes).encargos,
    noGrupo: (ctx) => folhaDeHoje(ctx).encargos,
  },
  {
    chave: 'provisoes',
    nome: 'Provisões de férias e 13º',
    formato: 'reais',
    estimativa: true,
    explicacao: 'Férias: salário ÷ 12, mais 1/3. 13º: salário ÷ 12. É o que a empresa reserva por mês para pagar férias e 13º.',
    valor: (ctx) => folhaDeHoje(ctx).provisoes.total,
    apoio: (ctx) => `${reais(folhaDeHoje(ctx).provisoes.ferias)} de férias`,
    serie: (mes, ctx) => folhaDoContexto(ctx, mes).provisoes.total,
    noGrupo: (ctx) => folhaDeHoje(ctx).provisoes.total,
  },
  {
    chave: 'beneficios',
    nome: 'Benefícios',
    formato: 'reais',
    estimativa: true,
    explicacao: 'A soma do que a empresa paga por mês nos benefícios de quem está no quadro.',
    valor: (ctx) => folhaDeHoje(ctx).beneficios,
    apoio: () => 'parte da empresa',
    serie: (mes, ctx) => folhaDoContexto(ctx, mes).beneficios,
    noGrupo: (ctx) => folhaDeHoje(ctx).beneficios,
  },
];

/* Benefícios: valores cadastrados (o que a empresa paga nas adesões em vigor). */
function adesoesEm(ctx, dataIso) {
  const ativas = new Set(ctx.recorte.pessoas.filter((pessoa) => ativaEm(pessoa, dataIso)).map((pessoa) => pessoa.id));
  return (ctx.recorte.adesoes || []).filter((adesao) => ativas.has(adesao.pessoa_id) && emVigor(adesao, dataIso));
}
function custoDosBeneficios(ctx, dataIso) {
  const porId = new Map((ctx.recorte.beneficios || []).map((item) => [item.id, item]));
  return Math.round(adesoesEm(ctx, dataIso).reduce((soma, adesao) => soma + (porId.get(adesao.beneficio_id)?.valor_empresa || 0) * 100, 0)) / 100;
}
const comBeneficio = (ctx) => new Set(adesoesEm(ctx, ctx.hoje).map((adesao) => adesao.pessoa_id));

INDICADORES.beneficios = [
  {
    chave: 'custo-mensal',
    nome: 'Custo mensal dos benefícios',
    formato: 'reais',
    explicacao: 'A soma do que a empresa paga por mês nos benefícios de quem está no quadro, com os valores cadastrados no catálogo. Mês a mês, as adesões em vigor no fim do mês.',
    valor: (ctx) => custoDosBeneficios(ctx, ctx.hoje),
    apoio: (ctx) => `${comBeneficio(ctx).size} pessoas com algum benefício`,
    serie: (mes, ctx) => custoDosBeneficios(ctx, mes.fim),
    noGrupo: (ctx) => custoDosBeneficios(ctx, ctx.hoje),
    distribuicao: (ctx) => {
      const vigentes = adesoesEm(ctx, ctx.hoje);
      return (ctx.recorte.beneficios || [])
        .map((beneficio) => ({ rotulo: beneficio.nome, valor: Math.round(vigentes.filter((adesao) => adesao.beneficio_id === beneficio.id).length * beneficio.valor_empresa) }))
        .filter((item) => item.valor > 0)
        .sort((a, b) => b.valor - a.valor);
    },
  },
  {
    chave: 'por-pessoa',
    nome: 'Benefícios por pessoa',
    formato: 'reais',
    explicacao: 'O custo mensal dos benefícios dividido pelas pessoas no quadro.',
    valor: (ctx) => (ctx.ativas.length ? custoDosBeneficios(ctx, ctx.hoje) / ctx.ativas.length : 0),
    apoio: () => 'média por mês',
    noGrupo: (ctx) => (ctx.ativas.length ? custoDosBeneficios(ctx, ctx.hoje) / ctx.ativas.length : 0),
  },
  {
    chave: 'cobertura',
    nome: 'Quadro com algum benefício',
    formato: 'percentual',
    explicacao: 'A parte das pessoas no quadro com ao menos um benefício em vigor.',
    valor: (ctx) => taxa(comBeneficio(ctx).size, ctx.ativas.length),
    apoio: (ctx) => `${comBeneficio(ctx).size} de ${ctx.ativas.length}`,
    noGrupo: (ctx) => taxa(comBeneficio(ctx).size, ctx.ativas.length),
  },
  {
    chave: 'sem-beneficio',
    nome: 'Sem nenhum benefício',
    formato: 'numero',
    explicacao: 'Pessoas no quadro sem nenhum benefício em vigor.',
    valor: (ctx) => ctx.ativas.length - comBeneficio(ctx).size,
    apoio: () => 'no quadro de hoje',
    noGrupo: (ctx) => ctx.ativas.length - comBeneficio(ctx).size,
    pessoas: (ctx) => {
      const tem = comBeneficio(ctx);
      return ctx.ativas
        .filter((pessoa) => !tem.has(pessoa.id))
        .map((pessoa) => ({ pessoa, valor: pessoa.contrato || '—', ordem: diaDe(pessoa.admissao), aba: 'remuneracao' }))
        .sort((a, b) => a.ordem - b.ordem);
    },
    rotuloDoValor: 'Contrato',
  },
];

export const TEMAS = [
  { chave: 'custos', nome: 'Custos', descricao: 'Custo estimado de pessoal, fator de custo e a composição.', icone: 'payments', principal: 'custo-total' },
  { chave: 'quadro', nome: 'Quadro', descricao: 'Quem está no quadro, quem entrou e quem saiu.', icone: 'group', principal: 'ativos' },
  { chave: 'saude', nome: 'Absenteísmo e saúde', descricao: 'Faltas, atestados e afastamentos, sempre em grupo.', icone: 'healing', principal: 'absenteismo' },
  { chave: 'ferias', nome: 'Férias', descricao: 'Vencidas, vencendo, programadas e quem está de férias.', icone: 'beach_access', principal: 'vencidas' },
  { chave: 'beneficios', nome: 'Benefícios', descricao: 'O que a empresa paga, por pessoa, e quem não tem.', icone: 'redeem', principal: 'custo-mensal' },
  { chave: 'movimentacoes', nome: 'Movimentações', descricao: 'Reajustes, promoções, mudanças de cargo e transferências.', icone: 'swap_horiz', principal: 'movimentacoes' },
];

function br(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function tempoDeCasaCurto(anos) {
  if (anos < 1) {
    const meses = Math.max(0, Math.floor(anos * 12));
    return meses <= 1 ? 'menos de 2 meses' : `${meses} meses`;
  }
  const inteiros = Math.floor(anos);
  return `${inteiros} ${inteiros === 1 ? 'ano' : 'anos'}`;
}

function noPeriodo(ctx, data) {
  return Boolean(data) && data >= ctx.inicio && data <= ctx.fim;
}

function movimentacoesDoPeriodo(ctx, tipos) {
  const pessoaPorId = new Map(ctx.recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  return ctx.recorte.movimentacoes
    .filter((item) => tipos.includes(item.tipo) && noPeriodo(ctx, item.efetiva))
    .map((item) => ({ pessoa: pessoaPorId.get(item.pessoa_id), valor: br(item.efetiva), detalhe: item.tipo, ordem: diaDe(item.efetiva), aba: 'movimentacoes' }))
    .filter((item) => item.pessoa)
    .sort((a, b) => b.ordem - a.ordem);
}

/* --------------------------------------------------------------- leitura */

function contexto(recorte, meses) {
  const periodo = periodoDe(recorte.hoje, meses);
  const ativas = recorte.pessoas.filter((pessoa) => ativaEm(pessoa, recorte.hoje));
  return {
    recorte,
    hoje: recorte.hoje,
    inicio: periodo[0].inicio,
    fim: recorte.hoje,
    meses,
    ativas,
    emExperiencia: ativas
      .map((pessoa) => ({ pessoa, experiencia: experienciaDe(pessoa, recorte.hoje) }))
      .filter(({ experiencia }) => experiencia && experiencia.fase !== 'encerrado'),
    periodo: numerosDoPeriodo(recorte, periodo),
  };
}

/** Menos de 3 pessoas no grupo: os números de saúde não aparecem. */
function pequenoDemais(ctx) {
  return Math.max(ctx.ativas.length, Math.round(ctx.periodo.quadroMedio)) < MINIMO_PARA_SAUDE;
}

/* Saúde e custos (que revelam salário) ficam ocultos em grupos com menos de 3 pessoas. */
const protegido = (definicao) => Boolean(definicao.saude || definicao.estimativa);

function resumoDoIndicador(definicao, ctx) {
  const oculto = protegido(definicao) && pequenoDemais(ctx);
  return {
    chave: definicao.chave,
    nome: definicao.nome,
    formato: definicao.formato,
    saude: Boolean(definicao.saude),
    estimativa: Boolean(definicao.estimativa),
    oculto,
    valor: oculto ? null : definicao.valor(ctx),
    apoio: oculto ? OCULTO : definicao.apoio(ctx),
    nomeDaSerie: definicao.nomeDaSerie || definicao.nome,
  };
}

export function temaDe(chave) {
  return TEMAS.find((tema) => tema.chave === chave) || null;
}

export function indicadorDe(tema, chave) {
  return (INDICADORES[tema] || []).find((item) => item.chave === chave) || null;
}

/** Central: cada tema com o número principal e dois de apoio. */
export function central(recorte, { meses = 12 } = {}) {
  const ctx = contexto(recorte, meses);
  return TEMAS.map((tema) => {
    const indicadores = INDICADORES[tema.chave].map((definicao) => resumoDoIndicador(definicao, ctx));
    const principal = indicadores.find((item) => item.chave === tema.principal);
    return { ...tema, principal, apoio: indicadores.filter((item) => item !== principal).slice(0, 2) };
  });
}

/** Os grupos do recorte: por unidade (quando há mais de uma) e por departamento, cada um com o próprio contexto. */
function gruposDe(recorte, meses) {
  const departamentos = [...new Set(recorte.pessoas.map((pessoa) => pessoa.departamento).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((nome) => ({ chave: nome, rotulo: nome, filtro: (pessoa) => pessoa.departamento === nome }));
  const cnpjs = recorte.cnpjs || [];
  const unidades = cnpjs.length > 1 ? cnpjs.map((cnpj) => ({ chave: cnpj.id, rotulo: cnpj.nome, filtro: (pessoa) => pessoa.cnpj_id === cnpj.id })) : [];
  const comContexto = (lista) =>
    lista
      .map((grupo) => ({ chave: grupo.chave, rotulo: grupo.rotulo, ctx: contexto(restringir(recorte, grupo.filtro), meses) }))
      .filter((grupo) => grupo.ctx.recorte.pessoas.length > 0);
  return { unidade: comContexto(unidades), departamento: comContexto(departamentos) };
}

function valorNoGrupo(definicao, ctx) {
  const oculto = protegido(definicao) && pequenoDemais(ctx);
  return { chave: definicao.chave, formato: definicao.formato, oculto, valor: oculto ? null : definicao.noGrupo(ctx) };
}

/** Um indicador em cada grupo, com o tamanho do grupo (pessoas no quadro hoje). */
function recortesDe(recorte, definicao, meses) {
  const grupos = gruposDe(recorte, meses);
  const linha = (grupo) => ({ ...valorNoGrupo(definicao, grupo.ctx), chave: grupo.chave, rotulo: grupo.rotulo, pessoas: grupo.ctx.ativas.length });
  return { unidade: grupos.unidade.map(linha), departamento: grupos.departamento.map(linha) };
}

/** Painel de um tema: os números, a série de cada um e a tabela por departamento e por unidade. */
export function painel(recorte, chaveDoTema, { meses = 12, departamento = '' } = {}) {
  const tema = temaDe(chaveDoTema);
  if (!tema) return null;
  const filtrado = porDepartamento(recorte, departamento);
  const ctx = contexto(filtrado, meses);
  const definicoes = INDICADORES[tema.chave];
  const oculto = definicoes.some(protegido) && pequenoDemais(ctx);
  return {
    tema,
    meses,
    departamento,
    oculto,
    indicadores: definicoes.map((definicao) => ({
      ...resumoDoIndicador(definicao, ctx),
      serie: definicao.serie && !(protegido(definicao) && oculto) ? ctx.periodo.meses.map((mes) => ({ rotulo: mes.rotulo, valor: definicao.serie(mes, ctx) })) : null,
    })),
    // Uma linha por grupo, com os indicadores do tema lado a lado.
    tabela: tabelaDoTema(filtrado, definicoes, meses),
  };
}

function tabelaDoTema(recorte, definicoes, meses) {
  const grupos = gruposDe(recorte, meses);
  const linha = (grupo) => ({
    chave: grupo.chave,
    rotulo: grupo.rotulo,
    pessoas: grupo.ctx.ativas.length,
    valores: definicoes.map((definicao) => valorNoGrupo(definicao, grupo.ctx)),
  });
  return { unidade: grupos.unidade.map(linha), departamento: grupos.departamento.map(linha) };
}

/** Detalhe de um indicador: o número explicado, a série, os recortes e as pessoas. */
export function detalhe(recorte, chaveDoTema, chaveDoIndicador, { meses = 12, departamento = '' } = {}) {
  const tema = temaDe(chaveDoTema);
  const definicao = tema ? indicadorDe(tema.chave, chaveDoIndicador) : null;
  if (!definicao) return null;
  const filtrado = porDepartamento(recorte, departamento);
  const ctx = contexto(filtrado, meses);
  const resumo = resumoDoIndicador(definicao, ctx);
  const resumir = (pessoa) => ({ nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo, departamento: pessoa.departamento });
  return {
    tema,
    meses,
    departamento,
    ...resumo,
    explicacao: definicao.explicacao,
    serie: definicao.serie && !resumo.oculto ? ctx.periodo.meses.map((mes) => ({ rotulo: mes.rotulo, valor: definicao.serie(mes, ctx) })) : null,
    distribuicao: definicao.distribuicao && !resumo.oculto ? definicao.distribuicao(ctx) : null,
    recortes: recortesDe(filtrado, definicao, meses),
    // Saúde: nunca a lista de pessoas.
    pessoas: definicao.pessoas && !definicao.saude ? definicao.pessoas(ctx).map((item) => ({ ...item, pessoa: resumir(item.pessoa) })) : null,
    rotuloDoValor: definicao.rotuloDoValor || 'Valor',
    notaDasPessoas: definicao.notaDasPessoas || null,
  };
}

/** Para a tela: número no formato do indicador. */
export function formatarIndicador(valor, formato) {
  if (valor === null || valor === undefined) return '—';
  if (formato === 'percentual') return `${arredondar(valor, 1).toFixed(1).replace('.', ',')}%`;
  if (formato === 'anos') return `${arredondar(valor, 1).toFixed(1).replace('.', ',')} ${arredondar(valor, 1) === 1 ? 'ano' : 'anos'}`;
  if (formato === 'reais') return `R$ ${Math.round(valor).toLocaleString('pt-BR')}`;
  if (formato === 'fator') return String(arredondar(valor, 2).toFixed(2)).replace('.', ',');
  if (formato === 'dias') return `${Math.round(valor)} ${Math.round(valor) === 1 ? 'dia' : 'dias'}`;
  return String(Math.round(valor));
}

/** Casas da série (para o gráfico). */
export function casasDoFormato(formato) {
  if (formato === 'fator') return 2;
  return formato === 'percentual' || formato === 'anos' ? 1 : 0;
}
