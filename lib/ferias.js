/**
 * Férias (fase 11 do redesenho): a situação de cada registro pelas datas, os
 * períodos aquisitivos com o saldo, a programação com as regras da CLT
 * (até 3 parcelas, uma de 14 dias ou mais, nenhuma abaixo de 5, sem começar
 * nos 2 dias antes do descanso ou de feriado) e o resumo da tela de Férias.
 *
 * Cada registro é um período aquisitivo (ou uma parcela dele): com início,
 * é gozo (programada, em andamento, gozada) ou pedido (aguardando
 * aprovação); sem início, são dias por tirar (a programar, a vencer,
 * vencida). Nada aqui calcula valor: a dobra das vencidas é um alerta.
 *
 * Puro; testado em testes/ferias.test.js.
 */
import { diaDaSemanaDe, diaDe, diaUtilAnterior, feriadoEm, isoDe, motivoDeNaoSerUtil } from './calendario.js';
import { saldoDeFerias } from './pessoas.js';
import { REGRAS_DE_PRAZO as R } from './regrasDePrazo.js';

const F = R.fracionamentoDeFerias;
export const SEM_GOZO = ['a programar', 'a vencer', 'vencida'];
/** Dias por tirar viram "a vencer" quando o fim do período para tirar está a menos disso. */
export const JANELA_A_VENCER = 60;

export class ErroDeFerias extends Error {}

const br = (iso) => iso.split('-').reverse().join('/');
const curta = (iso) => br(iso).slice(0, 5);

export function fimDoGozo(item) {
  return isoDe(diaDe(item.inicio) + item.dias - 1);
}

/**
 * A situação de hoje pelas datas: o gozo aprovado anda sozinho (programada →
 * em andamento → gozada) e os dias por tirar viram "a vencer" e "vencida".
 * O pedido esperando a Gestão continua esperando.
 */
export function situacaoAtual(item, hojeIso) {
  if (item.situacao === 'aguardando aprovação') return item;
  if (item.inicio && ['programada', 'em andamento', 'gozada'].includes(item.situacao)) {
    const situacao = hojeIso < item.inicio ? 'programada' : hojeIso <= fimDoGozo(item) ? 'em andamento' : 'gozada';
    return situacao === item.situacao ? item : { ...item, situacao };
  }
  if (!item.inicio || SEM_GOZO.includes(item.situacao)) {
    const faltam = diaDe(item.concessivo_fim) - diaDe(hojeIso);
    const situacao = faltam < 0 ? 'vencida' : faltam < JANELA_A_VENCER ? 'a vencer' : 'a programar';
    return situacao === item.situacao ? item : { ...item, situacao };
  }
  return item;
}

export function comSituacaoAtual(ferias, hojeIso) {
  return (ferias || []).map((item) => situacaoAtual(item, hojeIso));
}

/** Os períodos aquisitivos da pessoa, do mais antigo ao mais novo, com o que falta tirar. */
export function periodosDaPessoa(pessoa, ferias) {
  const porPeriodo = new Map();
  for (const item of ferias) {
    if (item.pessoa_id !== pessoa.id) continue;
    const chave = item.aquisitivo_inicio;
    if (!porPeriodo.has(chave)) {
      porPeriodo.set(chave, { aquisitivo_inicio: item.aquisitivo_inicio, aquisitivo_fim: item.aquisitivo_fim, concessivo_fim: item.concessivo_fim, parcelas: [], porTirar: [] });
    }
    const periodo = porPeriodo.get(chave);
    if (item.inicio) periodo.parcelas.push(item);
    else periodo.porTirar.push(item);
  }
  return [...porPeriodo.values()]
    .map((periodo) => ({
      ...periodo,
      saldo: periodo.porTirar.reduce((soma, item) => soma + item.dias, 0),
      vencido: periodo.porTirar.some((item) => item.situacao === 'vencida'),
    }))
    .sort((a, b) => (a.aquisitivo_inicio < b.aquisitivo_inicio ? -1 : 1));
}

/** Por que as férias não podem começar nesse dia (ou null, se podem). */
export function motivoParaNaoComecar(inicioIso) {
  const dia = diaDe(inicioIso);
  const descanso = (d) => diaDaSemanaDe(d) === 0 || feriadoEm(d);
  if (descanso(dia)) return `${curta(inicioIso)} é ${motivoDeNaoSerUtil(dia)}: as férias não começam em dia de descanso.`;
  for (let k = 1; k <= F.semInicioAntesDoDescanso; k += 1) {
    if (descanso(dia + k)) {
      return `As férias não podem começar nos 2 dias antes de ${motivoDeNaoSerUtil(dia + k)} (${curta(isoDe(dia + k))}). Escolha outro dia.`;
    }
  }
  return null;
}

/** Os prazos de uma programação: aviso (30 dias antes) e pagamento (2 dias antes, no dia útil anterior). */
export function prazosDaProgramacao(inicioIso) {
  const inicio = diaDe(inicioIso);
  const bruto = inicio - R.pagamentoDeFerias.antecedencia;
  const pagar = diaUtilAnterior(bruto);
  return {
    aviso: isoDe(inicio - R.avisoDeFerias.antecedencia),
    pagamento: isoDe(pagar),
    notaDoPagamento: pagar === bruto ? '' : `${curta(isoDe(bruto))} é ${motivoDeNaoSerUtil(bruto)}`,
  };
}

/**
 * Programar férias. entrada: { periodo (início do aquisitivo), inicio, dias,
 * aprovadas }. `ferias` são as da pessoa (com a situação de hoje) e
 * `afastamentos`, os dela. Devolve o registro a mudar, os campos e o resto
 * (os dias que sobram, num registro novo), mais o que vale avisar.
 */
export function montarFerias(entrada, { pessoa, ferias, afastamentos = [], hoje }) {
  if (pessoa.desligamento?.data) throw new ErroDeFerias('Esta pessoa tem desligamento registrado: as férias que faltam saem na rescisão.');
  const periodos = periodosDaPessoa(pessoa, ferias).filter((periodo) => periodo.saldo > 0);
  if (!periodos.length) throw new ErroDeFerias('Esta pessoa não tem dias de férias por tirar num período já completo.');
  const periodo = periodos.find((item) => item.aquisitivo_inicio === entrada.periodo) || (entrada.periodo ? null : periodos[0]);
  if (!periodo) throw new ErroDeFerias('Escolha um período com dias por tirar.');

  const inicio = String(entrada.inicio || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) throw new ErroDeFerias('Informe o primeiro dia de férias.');
  if (inicio < hoje) throw new ErroDeFerias('O primeiro dia de férias não pode ser num dia que já passou.');
  const motivo = motivoParaNaoComecar(inicio);
  if (motivo) throw new ErroDeFerias(motivo);

  const dias = Number(entrada.dias);
  if (!Number.isInteger(dias) || dias < F.parcelaMinima || dias > periodo.saldo) {
    throw new ErroDeFerias(`Informe de ${F.parcelaMinima} a ${periodo.saldo} dias (o que falta tirar deste período).`);
  }
  const resto = periodo.saldo - dias;
  const parcelas = periodo.parcelas;
  if (resto > 0 && resto < F.parcelaMinima) {
    throw new ErroDeFerias(`Sobrariam ${resto} dias: cada parcela tem ao menos ${F.parcelaMinima} dias. Programe ${periodo.saldo} dias ou deixe ${F.parcelaMinima} ou mais para depois.`);
  }
  if (parcelas.length + 1 > F.parcelas || (resto > 0 && parcelas.length + 2 > F.parcelas)) {
    throw new ErroDeFerias(`As férias se dividem em até ${F.parcelas} parcelas: programe os ${periodo.saldo} dias que faltam de uma vez.`);
  }
  const temPrincipal = parcelas.some((item) => item.dias >= F.parcelaPrincipal);
  if (!temPrincipal && dias < F.parcelaPrincipal && resto < F.parcelaPrincipal) {
    throw new ErroDeFerias(`Uma das parcelas precisa ter ao menos ${F.parcelaPrincipal} dias.`);
  }

  const fim = isoDe(diaDe(inicio) + dias - 1);
  const choca = ferias.find((item) => item.inicio && item.pessoa_id === pessoa.id && item.inicio <= fim && fimDoGozo(item) >= inicio);
  if (choca) throw new ErroDeFerias(`Já há férias de ${br(choca.inicio)} a ${br(fimDoGozo(choca))}.`);
  const afastada = afastamentos.find((item) => {
    if (item.validacao === 'Rejeitado') return false;
    const ate = item.retorno ? isoDe(diaDe(item.retorno) - 1) : item.fim_previsto;
    return item.inicio <= fim && ate >= inicio;
  });
  if (afastada) throw new ErroDeFerias(`A pessoa está afastada nesse período (a partir de ${br(afastada.inicio)}).`);

  const alvo = periodo.porTirar[0];
  const prazos = prazosDaProgramacao(inicio);
  return {
    alvo: alvo.id,
    campos: { inicio, dias, situacao: entrada.aprovadas ? 'programada' : 'aguardando aprovação' },
    resto: resto > 0 ? { ...alvo, id: undefined, inicio: null, dias: resto, situacao: 'a programar', registrado_por: null, registrado_em: null } : null,
    fim,
    retorno: isoDe(diaDe(fim) + 1),
    ...prazos,
    avisoFora: prazos.aviso < hoje,
    emDobro: periodo.vencido || fim > periodo.concessivo_fim,
  };
}

/* ------------------------------------------------------------ resumo */

const DENTRO = 90;

/**
 * A tela de Férias: vencidas (pagamento em dobro), vencendo nos próximos 90
 * dias, programadas e em andamento (com aviso e pagamento), o saldo de cada
 * pessoa do quadro e os números.
 */
export function resumoDasFerias(recorte) {
  const hoje = recorte.hoje;
  const ativas = recorte.pessoas.filter((pessoa) => !pessoa.desligamento && pessoa.admissao && pessoa.admissao <= hoje);
  const porId = new Map(ativas.map((pessoa) => [pessoa.id, pessoa]));
  const resumo = (pessoa) => ({ nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo, departamento: pessoa.departamento });
  const ferias = recorte.ferias.filter((item) => porId.has(item.pessoa_id));
  const ate = isoDe(diaDe(hoje) + DENTRO);

  const vencidas = ferias
    .filter((item) => item.situacao === 'vencida')
    .map((item) => ({ ...item, pessoa: resumo(porId.get(item.pessoa_id)), diasVencida: diaDe(hoje) - diaDe(item.concessivo_fim) }))
    .sort((a, b) => (a.concessivo_fim < b.concessivo_fim ? -1 : 1));
  const vencendo = ferias
    .filter((item) => ['a vencer', 'a programar'].includes(item.situacao) && item.concessivo_fim <= ate)
    .map((item) => {
      const limite = isoDe(diaDe(item.concessivo_fim) - item.dias + 1);
      return { ...item, pessoa: resumo(porId.get(item.pessoa_id)), limite, cabem: limite >= hoje, dias_ate_limite: diaDe(limite) - diaDe(hoje) };
    })
    .sort((a, b) => (a.limite < b.limite ? -1 : 1));
  const programadas = ferias
    .filter((item) => ['programada', 'em andamento'].includes(item.situacao))
    .map((item) => ({ ...item, pessoa: resumo(porId.get(item.pessoa_id)), fim: fimDoGozo(item), ...prazosDaProgramacao(item.inicio) }))
    .sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
  const paraAprovar = ferias.filter((item) => item.situacao === 'aguardando aprovação');

  const saldos = ativas
    .filter((pessoa) => pessoa.contrato !== 'estágio')
    .map((pessoa) => {
      const saldo = saldoDeFerias(pessoa, ferias, hoje);
      const abertos = periodosDaPessoa(pessoa, ferias).filter((periodo) => periodo.saldo > 0);
      // O saldo conta o que já está programado e ainda não começou: a tela diz quando começa.
      const proximas = ferias
        .filter((item) => item.pessoa_id === pessoa.id && item.inicio && item.inicio > hoje && ['programada', 'aguardando aprovação'].includes(item.situacao))
        .sort((a, b) => (a.inicio < b.inicio ? -1 : 1))[0];
      return {
        pessoa: resumo(pessoa),
        ...saldo,
        limite: abertos[0]?.concessivo_fim || null,
        vencido: abertos.some((periodo) => periodo.vencido),
        proximas: proximas ? { inicio: proximas.inicio, esperando: proximas.situacao === 'aguardando aprovação' } : null,
      };
    })
    .sort((a, b) => (a.limite || '9999') < (b.limite || '9999') ? -1 : 1);

  const pessoasCom = (lista) => new Set(lista.map((item) => item.pessoa_id)).size;
  return {
    vencidas,
    vencendo,
    programadas,
    paraAprovar: paraAprovar.length,
    saldos,
    numeros: {
      vencidas: pessoasCom(vencidas),
      vencendo: pessoasCom(vencendo),
      programadas: programadas.filter((item) => item.situacao === 'programada' && item.inicio <= ate).length,
      deFerias: programadas.filter((item) => item.situacao === 'em andamento').length,
      paraAprovar: paraAprovar.length,
      emDia: ativas.length ? Math.round(((ativas.length - pessoasCom(vencidas)) / ativas.length) * 1000) / 10 : 100,
    },
  };
}

