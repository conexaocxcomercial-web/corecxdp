import { cache } from 'react';
import { lerPendencias, lerRecorte } from '@/lib/dados/pendencias';
import { IMPORTACAO } from '@/lib/demo/gerador';
import { calcularIndicadores } from '@/lib/indicadores';
import { diaDe, isoDe } from '@/lib/prazos';
import { situacoes } from '@/lib/pessoas';
import { JANELAS } from '@/lib/regrasDePrazo';
import { dataCurta, diaDaSemana, nomeDoMes, paraData } from '@/lib/formato';

/**
 * Repositório da tela inicial da Gestão da empresa (fase 5 do redesenho,
 * opção "Por assunto"): números do negócio, um resumo por assunto, os
 * urgentes da faixa do topo, a revisão da implantação e a atividade
 * recente, no recorte do alcance (cliente e, quando há, CNPJ). Aprovações e
 * prazos vêm de lib/dados/pendencias.js.
 *
 * Módulo novo: só existe na demonstração, lendo os dados completos de
 * lib/demo. No Supabase, cada parte vira uma consulta com RLS.
 */

const DIA = 86400000;

/** Assuntos, na ordem em que aparecem. `curto` entra na frase "… pedem atenção". */
export const ASSUNTOS = [
  { chave: 'pessoas', nome: 'Pessoas e contratos', curto: 'contratos', href: '/colaboradores', link: 'Ver colaboradores' },
  { chave: 'ferias', nome: 'Férias e 13º', curto: 'férias' },
  { chave: 'saude', nome: 'Saúde e afastamentos', curto: 'afastamentos', href: '/atestados', link: 'Ver atestados' },
  { chave: 'ocorrencias', nome: 'Ocorrências', curto: 'ocorrências', href: '/ocorrencias', link: 'Ver ocorrências' },
  { chave: 'documentos', nome: 'Documentos', curto: 'documentos' },
  { chave: 'desligamentos', nome: 'Desligamentos', curto: 'desligamentos', href: '/movimentacoes', link: 'Ver movimentações' },
];

/** Reincidência: tantas ocorrências da mesma pessoa em tantos dias. */
const REINCIDENCIA = { ocorrencias: 3, dias: 90 };

/** Indicador de saúde de grupo com menos de 3 pessoas fica oculto (LGPD). */
const MINIMO_DO_GRUPO = 3;

function resumoDaPessoa(pessoa) {
  return pessoa ? { nome: pessoa.nome, matricula: pessoa.matricula } : null;
}

const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

function noQuadroEm(pessoa, dia) {
  return diaDe(pessoa.admissao) <= dia && (!pessoa.desligamento || diaDe(pessoa.desligamento.data) > dia);
}

/* ------------------------------------------------- números do negócio */

function numerosDoNegocio(recorte) {
  const hoje = diaDe(recorte.hoje);
  const quadro = recorte.pessoas.filter((pessoa) => noQuadroEm(pessoa, hoje));
  const situacao = situacoes(recorte, recorte.hoje);
  const data = new Date(hoje * DIA);
  const fimDoMesPassado = Math.floor(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 0) / DIA);
  const soma = (lista) => lista.reduce((total, pessoa) => total + (pessoa.salario || 0), 0);

  const { serie, resumo } = calcularIndicadores({
    pessoas: recorte.pessoas.map((pessoa) => ({
      matricula: pessoa.matricula,
      nome: pessoa.nome,
      departamento: pessoa.departamento,
      admissao: pessoa.admissao,
      status: situacao.get(pessoa.id),
    })),
    ocorrencias: recorte.ocorrencias.map((item) => ({ matricula: item.matricula, tipo: item.tipo, data: item.data })),
    // Só atestado conta no absenteísmo; licenças ficam de fora.
    atestados: recorte.afastamentos
      .filter((item) => item.atestado)
      .map((item) => ({ matricula: item.matricula, inicio: item.inicio, dias: item.dias, status: item.validacao })),
    movimentacoes: recorte.movimentacoes.map((item) => ({
      matricula: item.matricula,
      tipo: item.tipo,
      efetiva: item.efetiva,
    })),
    meses: 12,
  });
  // O mês corrente ainda está pela metade: o absenteísmo é o do último mês fechado.
  const fechado = serie[serie.length - 2];
  const anterior = serie[serie.length - 3];
  const privado = quadro.length < MINIMO_DO_GRUPO;

  return {
    quadro: quadro.length,
    quadroHa30Dias: recorte.pessoas.filter((pessoa) => noQuadroEm(pessoa, hoje - 30)).length,
    afastados: quadro.filter((pessoa) => situacao.get(pessoa.id) === 'Afastado').length,
    emFerias: quadro.filter((pessoa) => situacao.get(pessoa.id) === 'Férias').length,
    salarios: soma(quadro),
    salariosDoMesPassado: soma(recorte.pessoas.filter((pessoa) => noQuadroEm(pessoa, fimDoMesPassado))),
    mesPassado: nomeDoMes(new Date(fimDoMesPassado * DIA).getUTCMonth()),
    turnover: resumo.turnover,
    admissoesEm12Meses: resumo.admissoes,
    saidasEm12Meses: resumo.saidas,
    absenteismo: privado
      ? null
      : {
          mes: nomeDoMes(fechado.mes),
          valor: fechado.absenteismo,
          anterior: anterior.absenteismo,
          mesAnterior: nomeDoMes(anterior.mes),
          diasDeAtestado: fechado.diasDeAtestado,
        },
    feriasVencidas: recorte.ferias.filter((item) => item.situacao === 'vencida').length,
  };
}

/* ------------------------------------------------------------ assuntos */

function reincidentes(recorte) {
  const desde = diaDe(recorte.hoje) - REINCIDENCIA.dias;
  const porPessoa = new Map();
  for (const item of recorte.ocorrencias) {
    if (diaDe(item.data) < desde) continue;
    porPessoa.set(item.pessoa_id, (porPessoa.get(item.pessoa_id) || 0) + 1);
  }
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  return [...porPessoa]
    .filter(([id, total]) => total >= REINCIDENCIA.ocorrencias && !pessoaPorId.get(id)?.desligamento)
    .sort((a, b) => b[1] - a[1])
    .map(([id, total]) => ({
      id: `${id}-reincidencia`,
      pessoa: resumoDaPessoa(pessoaPorId.get(id)),
      titulo: `${total} ocorrências em ${REINCIDENCIA.dias} dias`,
      detalhe: 'reincidência',
    }));
}

function resumirAssuntos(recorte, aprovacoes, prazos, numeros) {
  const hoje = diaDe(recorte.hoje);
  const ha30 = hoje - 30;
  const doAssunto = (chave) => ({
    aprovacoes: aprovacoes.filter((item) => item.tema === chave),
    prazos: prazos.filter((item) => item.tema === chave),
  });
  const ativas = recorte.pessoas.filter((pessoa) => !pessoa.desligamento);
  const ocorrencias30 = recorte.ocorrencias.filter((item) => diaDe(item.data) >= ha30);
  const repetidas = reincidentes(recorte);

  const figuras = {
    pessoas: [
      { valor: numeros.quadro, rotulo: 'no quadro hoje' },
      { valor: ativas.filter((pessoa) => pessoa.contrato === 'experiência').length, rotulo: 'em experiência' },
      {
        valor: ativas.filter((pessoa) => diaDe(pessoa.admissao) >= ha30).length,
        rotulo: 'admissões em 30 dias',
      },
    ],
    ferias: [
      { valor: numeros.emFerias, rotulo: 'de férias hoje' },
      { valor: numeros.feriasVencidas, rotulo: 'vencidas', tom: numeros.feriasVencidas ? 'critico' : null },
      {
        valor: aprovacoes.filter((item) => item.tipo === 'ferias').length,
        rotulo: 'pedidos para aprovar',
      },
    ],
    saude: [
      { valor: numeros.afastados, rotulo: 'pessoas afastadas' },
      { valor: aprovacoes.filter((item) => item.tipo === 'atestado').length, rotulo: 'atestados para validar' },
      numeros.absenteismo
        ? { valor: numeros.absenteismo.diasDeAtestado, rotulo: `dias de atestado em ${numeros.absenteismo.mes}` }
        : { valor: '—', rotulo: 'oculto: menos de 3 pessoas' },
    ],
    ocorrencias: [
      {
        valor: ocorrencias30.filter((item) => item.tipo === 'Falta Injustificada').length,
        rotulo: 'faltas injustificadas em 30 dias',
      },
      { valor: ocorrencias30.length, rotulo: 'ocorrências em 30 dias' },
      { valor: repetidas.length, rotulo: `com ${REINCIDENCIA.ocorrencias} ou mais em ${REINCIDENCIA.dias} dias` },
    ],
    documentos: [
      {
        valor: prazos.filter((item) => item.tema === 'documentos' && item.dias >= 0 && item.dias <= 30).length,
        rotulo: 'vencem em 30 dias',
      },
      {
        valor: prazos.filter((item) => item.tema === 'documentos' && item.dias < 0).length,
        rotulo: 'vencidos',
        tom: prazos.some((item) => item.tema === 'documentos' && item.dias < 0) ? 'critico' : null,
      },
    ],
    desligamentos: [
      { valor: aprovacoes.filter((item) => item.tipo === 'desligamento').length, rotulo: 'para concluir' },
      { valor: numeros.saidasEm12Meses, rotulo: 'saídas em 12 meses' },
    ],
  };

  return ASSUNTOS.map((assunto) => {
    const { aprovacoes: esperando, prazos: datas } = doAssunto(assunto.chave);
    // Esperando você: aprovações e prazos vencidos (a mesma conta do número do Início).
    const pedeVoce = esperando.length + datas.filter((item) => item.grupo === 'vencido').length;
    const estaSemana = datas.filter((item) => item.grupo === 'semana').length;
    const extras = assunto.chave === 'ocorrencias' ? repetidas : [];
    return {
      ...assunto,
      pedeVoce,
      estaSemana,
      figuras: figuras[assunto.chave],
      aprovacoes: esperando,
      prazos: datas.filter((item) => item.grupo !== 'adiante' && item.grupo !== 'conferir'),
      outros: extras,
    };
  });
}

/* ------------------------------------------------------ atividade recente */

const OCORRENCIA = {
  'Falta Injustificada': 'uma falta injustificada',
  'Falta Justificada': 'uma falta justificada',
  Atraso: 'um atraso',
  'Saída Antecipada': 'uma saída antecipada',
  Advertência: 'uma advertência',
  Suspensão: 'uma suspensão',
};

const MOVIMENTACAO = {
  Promoção: 'a promoção',
  'Alteração Salarial': 'a alteração salarial',
  Transferência: 'a transferência',
  'Mudança de Cargo': 'a mudança de cargo',
  Desligamento: 'o desligamento',
  Afastamento: 'o afastamento',
  'Retorno de Afastamento': 'o retorno',
};

const AFASTAMENTO = {
  'Acidente de trabalho': 'um afastamento por acidente de trabalho',
  'Licença-maternidade': 'a licença-maternidade',
  'Licença não remunerada': 'uma licença não remunerada',
  Outros: 'um afastamento',
};

const DOCUMENTO = { CNH: 'a CNH' };

/** Quem registrou o quê, do mais novo para o mais antigo (autoria em tudo). */
function atividadeRecente(recorte, limite = 6) {
  const hoje = diaDe(recorte.hoje);
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const eventos = [];
  const evento = (id, quando, autor, acao, pessoaId) => {
    if (!quando || !autor || diaDe(quando) > hoje) return;
    eventos.push({ id, quando, autor, acao, pessoa: pessoaId ? resumoDaPessoa(pessoaPorId.get(pessoaId)) : null });
  };

  for (const pessoa of recorte.pessoas) {
    if (pessoa.registrado_por === IMPORTACAO) continue;
    evento(`${pessoa.id}-cadastro`, pessoa.registrado_em, pessoa.registrado_por, 'cadastrou a admissão de', pessoa.id);
  }
  for (const item of recorte.ocorrencias) {
    evento(item.id, item.registrado_em, item.registrado_por, `registrou ${OCORRENCIA[item.tipo] || 'uma ocorrência'} de`, item.pessoa_id);
  }
  for (const item of recorte.afastamentos) {
    const oQue = item.tipo === 'Doença' ? `um atestado de ${dias(item.dias)}` : AFASTAMENTO[item.tipo] || 'um afastamento';
    evento(item.id, item.registrado_em, item.registrado_por, `registrou ${oQue} de`, item.pessoa_id);
    if (item.validado_em) {
      const verbo = item.validacao === 'Aprovado' ? 'aprovou' : 'rejeitou';
      evento(`${item.id}-validacao`, item.validado_em, item.validado_por, `${verbo} o atestado de`, item.pessoa_id);
    }
  }
  // O reajuste da convenção entra para todo o quadro de uma vez: vira uma linha só.
  const reajustes = new Map();
  for (const item of recorte.movimentacoes) {
    if (item.tipo === 'Alteração Salarial' && item.percentual) {
      const chave = `${item.registrado_em}|${item.registrado_por}`;
      const atual = reajustes.get(chave) || { quando: item.registrado_em, autor: item.registrado_por, total: 0 };
      atual.total += 1;
      reajustes.set(chave, atual);
      continue;
    }
    evento(item.id, item.registrado_em, item.registrado_por, `registrou ${MOVIMENTACAO[item.tipo] || 'a movimentação'} de`, item.pessoa_id);
  }
  for (const [chave, { quando, autor, total }] of reajustes) {
    evento(`reajuste-${chave}`, quando, autor, `registrou o reajuste da convenção de ${total} ${total === 1 ? 'pessoa' : 'pessoas'}`, null);
  }
  for (const item of recorte.ferias) {
    const acao = item.situacao === 'aguardando aprovação' ? 'registrou o pedido de férias de' : 'programou as férias de';
    evento(`${item.id}-registro`, item.registrado_em, item.registrado_por, acao, item.pessoa_id);
  }
  for (const item of recorte.documentos) {
    evento(item.id, item.registrado_em, item.registrado_por, `anexou ${DOCUMENTO[item.tipo] || `o ${item.tipo}`} de`, item.pessoa_id);
  }

  // O que veio pela planilha modelo vira uma linha só, no dia da implantação.
  const importados = recorte.pessoas.filter((pessoa) => pessoa.registrado_por === IMPORTACAO);
  const doHistorico = eventos.filter((item) => item.autor === IMPORTACAO);
  const restantes = eventos.filter((item) => item.autor !== IMPORTACAO);
  if (importados.length && recorte.cliente?.implantacao) {
    restantes.push({
      id: 'importacao',
      quando: recorte.cliente.implantacao,
      autor: IMPORTACAO,
      acao: `trouxe ${importados.length} ${importados.length === 1 ? 'pessoa' : 'pessoas'} e ${doHistorico.length} registros do histórico`,
      pessoa: null,
    });
  }

  return restantes
    .sort((a, b) => (a.quando < b.quando ? 1 : a.quando > b.quando ? -1 : a.id < b.id ? 1 : -1))
    .slice(0, limite)
    .map((item) => ({ ...item, dias: diaDe(item.quando) - hoje }));
}

/* -------------------------------------------------------------- leitura */

function primeiraMaiuscula(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

function textoDoAlcance(alcance) {
  if (alcance.cnpj) return alcance.cnpj.nome;
  if (alcance.opcoes.cnpjs.length > 1) return `${alcance.cliente.nome}, todas as unidades`;
  return alcance.cliente.nome;
}

/** Tudo o que a tela inicial mostra, ou null fora da demonstração e sem cliente no alcance. */
export const lerInicio = cache(async () => {
  const [lido, pendencias] = await Promise.all([lerRecorte(), lerPendencias()]);
  if (!lido || !pendencias) return null;

  const { alcance, recorte } = lido;
  const { aprovacoes, prazos, urgentes, revisao } = pendencias;
  const numeros = numerosDoNegocio(recorte);
  const hoje = paraData(recorte.hoje);

  return {
    hoje: recorte.hoje,
    data: `${primeiraMaiuscula(diaDaSemana(recorte.hoje))}, ${hoje.getUTCDate()} de ${nomeDoMes(hoje.getUTCMonth())}`,
    alcance: textoDoAlcance(alcance),
    cliente: alcance.cliente.nome,
    vazio: recorte.pessoas.length === 0,
    esperando: pendencias.esperando,
    urgentes: {
      vencidos: urgentes.filter((item) => (item.prazo ? item.prazo.dias : item.dias) < 0).length,
      vencendo: urgentes.filter((item) => (item.prazo ? item.prazo.dias : item.dias) >= 0).length,
      // "até quinta": o último dia da janela de urgência, sem o "-feira".
      ate: diaDaSemana(isoDe(diaDe(recorte.hoje) + JANELAS.urgente)).replace('-feira', ''),
    },
    implantacao: pendencias.emRevisao
      ? {
          data: dataCurta(recorte.cliente.implantacao),
          itens: revisao.length,
          conferidos: revisao.filter((item) => item.conferido).length,
        }
      : null,
    numeros,
    assuntos: resumirAssuntos(recorte, aprovacoes, prazos, numeros),
    atividade: atividadeRecente(recorte),
  };
});
