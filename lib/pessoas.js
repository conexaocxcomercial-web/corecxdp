/**
 * Regras da pessoa (ficha e lista de colaboradores, fase 6 do redesenho):
 * situação calculada pelos eventos, tempo de casa, saldo de férias, números
 * dela e linha do tempo. Puro, sobre os dados no formato das tabelas
 * pensadas para o Supabase (lib/demo/gerador.js); testado em
 * testes/pessoas.test.js.
 */
import { diaDe, isoDe } from './calendario.js';
import { REGRAS_DE_PRAZO as R } from './regrasDePrazo.js';

/** Afastamento em curso no dia: começou, não terminou e não teve o atestado rejeitado. */
export function afastadoEm(afastamento, dia) {
  if (afastamento.validacao === 'Rejeitado') return false;
  const fim = afastamento.retorno ? diaDe(afastamento.retorno) - 1 : diaDe(afastamento.fim_previsto);
  return diaDe(afastamento.inicio) <= dia && dia <= fim;
}

/** Férias em curso no dia: aprovadas (programadas, em andamento ou gozadas) e dentro do período de gozo. */
export function deFeriasEm(ferias, dia) {
  if (!ferias.inicio || !['programada', 'em andamento', 'gozada'].includes(ferias.situacao)) return false;
  const inicio = diaDe(ferias.inicio);
  return inicio <= dia && dia < inicio + ferias.dias;
}

/**
 * A situação de hoje sai dos eventos, não de uma escolha à mão: Inativo
 * depois do desligamento, Afastado com afastamento em curso, Férias com
 * férias em curso, Ativo no resto (inclusive admissão marcada).
 */
export function situacaoDe(pessoa, { afastamentos = [], ferias = [] }, hojeIso) {
  const hoje = diaDe(hojeIso);
  if (pessoa.desligamento?.data && diaDe(pessoa.desligamento.data) <= hoje) return 'Inativo';
  if (afastamentos.some((item) => item.pessoa_id === pessoa.id && afastadoEm(item, hoje))) return 'Afastado';
  if (ferias.some((item) => item.pessoa_id === pessoa.id && deFeriasEm(item, hoje))) return 'Férias';
  return 'Ativo';
}

/** Índice por pessoa, para calcular a situação de muitas de uma vez. */
export function situacoes(dados, hojeIso) {
  const porPessoa = (lista) => {
    const mapa = new Map();
    for (const item of lista) mapa.set(item.pessoa_id, [...(mapa.get(item.pessoa_id) || []), item]);
    return mapa;
  };
  const afastamentos = porPessoa(dados.afastamentos);
  const ferias = porPessoa(dados.ferias);
  return new Map(
    dados.pessoas.map((pessoa) => [
      pessoa.id,
      situacaoDe(pessoa, { afastamentos: afastamentos.get(pessoa.id) || [], ferias: ferias.get(pessoa.id) || [] }, hojeIso),
    ])
  );
}

/** Tempo de casa até hoje, ou até a saída para quem já saiu. "3 anos e 2 meses". */
export function tempoDeCasa(admissao, { hoje, saida = null }) {
  const fim = saida ? Math.min(diaDe(saida), diaDe(hoje)) : diaDe(hoje);
  const dias = fim - diaDe(admissao);
  if (dias < 0) return 'ainda não começou';
  const anos = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  if (anos === 0 && meses === 0) return dias === 1 ? '1 dia' : `${dias} dias`;
  const parteMeses = meses === 1 ? '1 mês' : `${meses} meses`;
  if (anos === 0) return parteMeses;
  const parteAnos = anos === 1 ? '1 ano' : `${anos} anos`;
  return meses ? `${parteAnos} e ${parteMeses}` : parteAnos;
}

/**
 * Saldo de férias: dias de períodos aquisitivos já completos e ainda não
 * tirados, mais os avos do período em aquisição (2,5 dias por mês completo).
 * Recusadas voltam ao saldo; programadas contam até começarem.
 */
export function saldoDeFerias(pessoa, ferias, hojeIso) {
  const hoje = diaDe(hojeIso);
  const delas = ferias.filter((item) => item.pessoa_id === pessoa.id);
  const pendentes = delas.filter(
    (item) =>
      ['vencida', 'a vencer', 'a programar', 'aguardando aprovação'].includes(item.situacao) ||
      (item.situacao === 'programada' && item.inicio && diaDe(item.inicio) > hoje)
  );
  const vencidos = pendentes.filter((item) => item.situacao === 'vencida').reduce((soma, item) => soma + item.dias, 0);
  const completos = pendentes.reduce((soma, item) => soma + item.dias, 0);

  // Período em aquisição: do fim do último período registrado (ou da admissão) até hoje.
  let emAquisicao = 0;
  if (!pessoa.desligamento && pessoa.admissao && diaDe(pessoa.admissao) <= hoje && pessoa.contrato !== 'estágio') {
    const ultimoFim = delas.reduce((maior, item) => Math.max(maior, diaDe(item.aquisitivo_fim)), diaDe(pessoa.admissao) - 1);
    const meses = Math.floor((hoje - ultimoFim) / 30.4);
    emAquisicao = Math.min(Math.max(meses, 0), 12) * 2.5;
  }
  return { dias: completos, vencidos, emAquisicao };
}

const doze = (hoje) => isoDe(diaDe(hoje) - 365);

/** Os números da ficha: tempo de casa, dias de atestado e faltas em 12 meses, saldo de férias. */
export function numerosDaPessoa(pessoa, eventos, hojeIso) {
  const desde = doze(hojeIso);
  const atestados = eventos.afastamentos.filter(
    (item) => item.atestado && item.validacao !== 'Rejeitado' && item.inicio >= desde && item.inicio <= hojeIso
  );
  const faltas = eventos.ocorrencias.filter(
    (item) => item.tipo.startsWith('Falta') && item.data >= desde && item.data <= hojeIso
  );
  return {
    tempoDeCasa: tempoDeCasa(pessoa.admissao, { hoje: hojeIso, saida: pessoa.desligamento?.data }),
    diasDeAtestado: atestados.reduce((soma, item) => soma + item.dias, 0),
    atestados: atestados.length,
    faltas: faltas.length,
    faltasInjustificadas: faltas.filter((item) => item.tipo === 'Falta Injustificada').length,
    ferias: saldoDeFerias(pessoa, eventos.ferias, hojeIso),
  };
}

/** Situação da experiência: as datas de 45 e 90 dias e em que ponto está. */
export function experienciaDe(pessoa, hojeIso) {
  if (pessoa.contrato !== 'experiência' || !pessoa.admissao) return null;
  const admissao = diaDe(pessoa.admissao);
  const fim45 = admissao + R.experiencia.primeiroPeriodo - 1;
  const fim90 = admissao + R.experiencia.total - 1;
  const hoje = diaDe(hojeIso);
  return {
    primeiroPeriodo: isoDe(fim45),
    fim: isoDe(fim90),
    fase: hoje <= fim45 ? 'primeiro' : hoje <= fim90 ? 'prorrogado' : 'encerrado',
  };
}

const OCORRENCIA = {
  'Falta Injustificada': 'Falta injustificada',
  'Falta Justificada': 'Falta justificada',
  Atraso: 'Atraso',
  'Saída Antecipada': 'Saída antecipada',
  Advertência: 'Advertência',
  Suspensão: 'Suspensão',
};

const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

/**
 * Todos os eventos da pessoa em ordem de data, do mais novo para o mais
 * antigo, com quem registrou cada um. Sem CID: a linha do tempo nunca
 * mostra dado de saúde individual (a aba Saúde mostra, para quem pode).
 * `aba` diz em que aba da ficha o evento está.
 */
export function linhaDoTempo(pessoa, eventos) {
  const itens = [];
  const evento = (item) => item.data && itens.push(item);

  evento({ id: `${pessoa.id}-admissao`, data: pessoa.admissao, tipo: 'Admissão', aba: 'contrato', texto: `${pessoa.cargo || 'Cargo não informado'}${pessoa.departamento ? ` em ${pessoa.departamento}` : ''}`, autor: pessoa.registrado_por, em: pessoa.registrado_em });
  for (const item of eventos.ocorrencias) {
    evento({ id: item.id, data: item.data, tipo: OCORRENCIA[item.tipo] || item.tipo, aba: 'ocorrencias', texto: item.motivo, autor: item.registrado_por, em: item.registrado_em });
  }
  for (const item of eventos.afastamentos) {
    const titulo = item.atestado ? `Atestado de ${dias(item.dias)}` : `${item.tipo}, ${dias(item.dias)}`;
    const validacao = item.validacao && item.validacao !== 'Pendente' ? `${item.validacao === 'Aprovado' ? 'aprovado' : 'rejeitado'}${item.validado_por ? ` por ${item.validado_por}` : ''}` : item.validacao === 'Pendente' ? 'esperando validação' : '';
    evento({ id: item.id, data: item.inicio, tipo: 'Afastamento', aba: 'saude', texto: [titulo, item.atestado ? item.tipo : null, validacao].filter(Boolean).join(' · '), autor: item.registrado_por, em: item.registrado_em });
  }
  for (const item of eventos.movimentacoes) {
    if (item.tipo === 'Desligamento') continue;
    evento({ id: item.id, data: item.efetiva, tipo: item.tipo, aba: 'movimentacoes', texto: item.motivo, autor: item.registrado_por, em: item.registrado_em });
  }
  for (const item of eventos.ferias) {
    if (!item.inicio || !['gozada', 'em andamento', 'programada'].includes(item.situacao)) continue;
    evento({ id: item.id, data: item.inicio, tipo: item.situacao === 'programada' ? 'Férias programadas' : 'Férias', aba: 'ferias', texto: `${dias(item.dias)}${item.aprovado_por ? ` · aprovadas por ${item.aprovado_por}` : ''}`, autor: item.registrado_por, em: item.registrado_em });
  }
  for (const item of eventos.documentos) {
    evento({ id: item.id, data: item.emissao, tipo: 'Documento', aba: 'documentos', texto: item.tipo, autor: item.registrado_por, em: item.registrado_em });
  }
  if (pessoa.desligamento?.data) {
    evento({ id: `${pessoa.id}-desligamento`, data: pessoa.desligamento.data, tipo: 'Desligamento', aba: 'desligamento', texto: [pessoa.desligamento.tipo, pessoa.desligamento.motivo].filter(Boolean).join(' · '), autor: eventos.movimentacoes.find((item) => item.tipo === 'Desligamento')?.registrado_por, em: null });
  }
  return itens.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : a.id < b.id ? 1 : -1));
}

/** CPF com o meio escondido: "•••.•••.247-25". */
export function cpfProtegido(cpf) {
  const digitos = String(cpf || '').replace(/\D/g, '');
  if (digitos.length !== 11) return '•••';
  return `•••.•••.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}
