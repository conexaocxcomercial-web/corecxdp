/**
 * Aprovações, prazos e revisão da implantação da Gestão da empresa,
 * calculados a partir dos dados no formato das tabelas pensadas para o
 * Supabase (lib/demo/gerador.js). Puro, sem Next nem fonte de dados:
 * testado em testes/prazos.test.js.
 *
 * - Aprovações: o que só a Gestão resolve (atestado para validar, férias
 *   para aprovar, desligamento para concluir).
 * - Prazos: datas legais que saem dos eventos (lib/regrasDePrazo.js). Os de
 *   pagamento que caem em fim de semana ou feriado antecipam para o dia
 *   útil anterior.
 * - Implantação: enquanto a revisão da implantação não termina, o que
 *   venceu antes da data de implantação aparece como "a conferir na
 *   implantação", e não como vencido.
 *
 * O que já passou e não deixa rastro nos dados (aviso de férias entregue,
 * encaminhamento ao INSS) conta como feito; o que os dados mostram em
 * aberto (férias vencidas, documento vencido) aparece como vencido.
 */
import { JANELAS, REGRAS_DE_PRAZO as R } from './regrasDePrazo.js';
import { diaDaData, diaDe, diaUtilAnterior, isoDe, motivoDeNaoSerUtil } from './calendario.js';
import { dataCurta } from './formato.js';

export { diaDe, isoDe };

/** vencido, semana, mes, adiante, conferir (antes da implantação) ou null (longe demais). */
export function grupoDoPrazo(dias, { aConferir = false } = {}) {
  if (dias < 0) return aConferir ? 'conferir' : 'vencido';
  if (dias <= JANELAS.semana) return 'semana';
  if (dias <= JANELAS.mes) return 'mes';
  if (dias <= JANELAS.adiante) return 'adiante';
  return null;
}

/** O cliente e, quando há, um CNPJ dele: as pessoas pelo cnpj_id, os eventos pelas pessoas. */
export function recortar(dados, { cliente, cnpj = null }) {
  const pessoas = dados.pessoas.filter(
    (pessoa) => pessoa.cliente_id === cliente && (!cnpj || pessoa.cnpj_id === cnpj)
  );
  const ids = new Set(pessoas.map((pessoa) => pessoa.id));
  const delas = (lista) => lista.filter((item) => ids.has(item.pessoa_id));

  return {
    hoje: dados.hoje,
    cliente: dados.clientes.find((item) => item.id === cliente) || null,
    cnpjs: (dados.cnpjs || []).filter((item) => item.cliente_id === cliente),
    pessoas,
    ocorrencias: delas(dados.ocorrencias),
    afastamentos: delas(dados.afastamentos),
    movimentacoes: delas(dados.movimentacoes),
    ferias: delas(dados.ferias),
    documentos: delas(dados.documentos),
    adesoes: delas(dados.adesoes),
    beneficios: dados.beneficios.filter((beneficio) => beneficio.cliente_id === cliente),
  };
}

/** A implantação ainda está em revisão: os alertas do que venceu antes dela não começaram. */
export function emRevisao(cliente) {
  return Boolean(cliente?.implantacao && !cliente.revisao?.concluida_em);
}

function resumoDaPessoa(pessoa) {
  return pessoa ? { nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo } : null;
}

const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

/**
 * Prazo de pagamento: se cai em fim de semana ou feriado, antecipa para o
 * dia útil anterior. Devolve o dia e, quando mudou, o porquê.
 */
function pagamento(dia) {
  const util = diaUtilAnterior(dia);
  return { dia: util, nota: util === dia ? '' : `${dataCurta(isoDe(dia))} é ${motivoDeNaoSerUtil(dia)}` };
}

/**
 * O que espera a Gestão, de quem espera há mais tempo para quem chegou
 * agora. Sem CID: a tela inicial não mostra dado de saúde individual.
 */
export function listarAprovacoes(recorte) {
  const hoje = diaDe(recorte.hoje);
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const itens = [];

  for (const afastamento of recorte.afastamentos) {
    if (!afastamento.atestado || afastamento.validacao !== 'Pendente') continue;
    const pessoa = pessoaPorId.get(afastamento.pessoa_id);
    itens.push({
      id: afastamento.id,
      tipo: 'atestado',
      tema: 'saude',
      pessoa: resumoDaPessoa(pessoa),
      titulo: `Atestado de ${dias(afastamento.dias)}`,
      detalhe: `${afastamento.tipo}, desde ${dataCurta(afastamento.inicio)}`,
      desde: afastamento.registrado_em,
      acoes: ['rejeitar', 'aprovar'],
      feito: { aprovar: 'Atestado aprovado', rejeitar: 'Atestado rejeitado' },
    });
  }

  for (const ferias of recorte.ferias) {
    if (ferias.situacao !== 'aguardando aprovação') continue;
    const pessoa = pessoaPorId.get(ferias.pessoa_id);
    itens.push({
      id: ferias.id,
      tipo: 'ferias',
      tema: 'ferias',
      pessoa: resumoDaPessoa(pessoa),
      titulo: `Férias de ${dias(ferias.dias)}`,
      detalhe: `a partir de ${dataCurta(ferias.inicio)}`,
      desde: ferias.registrado_em,
      acoes: ['rejeitar', 'aprovar'],
      feito: { aprovar: 'Férias aprovadas', rejeitar: 'Férias recusadas' },
    });
  }

  for (const movimentacao of recorte.movimentacoes) {
    if (movimentacao.tipo !== 'Desligamento' || movimentacao.checklist === 'Concluído') continue;
    const pessoa = pessoaPorId.get(movimentacao.pessoa_id);
    const { dia: limite, nota } = pagamento(diaDe(movimentacao.efetiva) + R.rescisao.dias);
    itens.push({
      id: movimentacao.id,
      tipo: 'desligamento',
      tema: 'desligamentos',
      pessoa: resumoDaPessoa(pessoa),
      titulo: 'Desligamento para concluir',
      detalhe: `saiu em ${dataCurta(movimentacao.efetiva)}, rescisão até ${dataCurta(isoDe(limite))}${nota ? ` (${nota})` : ''}`,
      desde: movimentacao.registrado_em,
      prazo: { data: isoDe(limite), dias: limite - hoje },
      acoes: ['concluir'],
      feito: { concluir: 'Desligamento concluído' },
    });
  }

  return itens.sort((a, b) => (a.desde < b.desde ? -1 : a.desde > b.desde ? 1 : a.id < b.id ? -1 : 1));
}

/**
 * Afastamentos com atestado pela mesma doença (mesmo CID) em sequência:
 * cada um começa até 60 dias depois do retorno do anterior. A soma dos
 * dias é o que conta para os 15 dias pagos pela empresa.
 */
export function sequenciasDaMesmaDoenca(afastamentos) {
  const porChave = new Map();
  for (const item of afastamentos) {
    const cid = item.atestado?.cid;
    if (!['Doença', 'Acidente de trabalho'].includes(item.tipo) || !cid || cid === 'não informado') continue;
    const chave = `${item.pessoa_id}|${cid}`;
    porChave.set(chave, [...(porChave.get(chave) || []), item]);
  }
  const sequencias = [];
  for (const lista of porChave.values()) {
    let atual = [];
    for (const item of [...lista].sort((a, b) => (a.inicio < b.inicio ? -1 : 1))) {
      const anterior = atual[atual.length - 1];
      const intervalo = anterior ? diaDe(item.inicio) - diaDe(anterior.fim_previsto) - 1 : 0;
      if (anterior && intervalo > R.inss.mesmaDoencaEmDias) {
        sequencias.push(atual);
        atual = [];
      }
      atual.push(item);
    }
    if (atual.length) sequencias.push(atual);
  }
  return sequencias;
}

/** O 16º dia somado de uma sequência (o primeiro com o INSS), ou null se não passa de 15. */
function decimoSextoDia(sequencia) {
  let somados = 0;
  for (const item of sequencia) {
    if (somados + item.dias > R.inss.diasPagosPelaEmpresa) {
      return diaDe(item.inicio) + (R.inss.diasPagosPelaEmpresa - somados);
    }
    somados += item.dias;
  }
  return null;
}

/** Prazos de hoje até 60 dias, mais os vencidos (ou a conferir), do mais urgente para o mais distante. */
export function listarPrazos(recorte) {
  const hoje = diaDe(recorte.hoje);
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const ativas = recorte.pessoas.filter((pessoa) => !pessoa.desligamento);
  const ativos = new Set(ativas.map((pessoa) => pessoa.id));
  const revisando = emRevisao(recorte.cliente);
  const implantacao = recorte.cliente?.implantacao ? diaDe(recorte.cliente.implantacao) : null;
  const itens = [];

  const prazo = (item) => {
    const dia = diaDe(item.data);
    const faltam = dia - hoje;
    const grupo = grupoDoPrazo(faltam, { aConferir: revisando && implantacao !== null && dia < implantacao });
    if (grupo) itens.push({ pessoa: null, ...item, dias: faltam, grupo });
  };

  /* ---- contratos */
  for (const pessoa of ativas) {
    const admissao = diaDe(pessoa.admissao);
    if (admissao > hoje) {
      prazo({
        id: `${pessoa.id}-registro`,
        regra: 'registroDeAdmissao',
        tema: 'pessoas',
        aba: 'contrato',
        pessoa: resumoDaPessoa(pessoa),
        titulo: 'Registrar a admissão',
        detalhe: `começa em ${dataCurta(pessoa.admissao)}`,
        data: isoDe(admissao - R.registroDeAdmissao.antecedencia),
      });
      continue;
    }
    if (pessoa.contrato !== 'experiência') continue;
    // O dia da admissão conta: 45 dias terminam no 44º dia depois dela.
    const fimDoPrimeiro = admissao + R.experiencia.primeiroPeriodo - 1;
    const fim = admissao + R.experiencia.total - 1;
    if (fimDoPrimeiro >= hoje) {
      prazo({
        id: `${pessoa.id}-experiencia-${R.experiencia.primeiroPeriodo}`,
        regra: 'experiencia',
        tema: 'pessoas',
        aba: 'contrato',
        pessoa: resumoDaPessoa(pessoa),
        titulo: `Fim dos ${R.experiencia.primeiroPeriodo} dias de experiência`,
        detalhe: 'prorrogar ou efetivar',
        data: isoDe(fimDoPrimeiro),
      });
    } else if (fim >= hoje) {
      prazo({
        id: `${pessoa.id}-experiencia-${R.experiencia.total}`,
        regra: 'experiencia',
        tema: 'pessoas',
        aba: 'contrato',
        pessoa: resumoDaPessoa(pessoa),
        titulo: 'Fim da experiência',
        detalhe: 'efetivar ou encerrar o contrato',
        data: isoDe(fim),
      });
    }
  }

  /* ---- férias */
  for (const ferias of recorte.ferias) {
    if (!ativos.has(ferias.pessoa_id)) continue;
    const pessoa = resumoDaPessoa(pessoaPorId.get(ferias.pessoa_id));
    const comum = { tema: 'ferias', aba: 'ferias', pessoa };
    if (ferias.situacao === 'vencida') {
      prazo({
        id: `${ferias.id}-dobro`,
        regra: 'feriasEmDobro',
        ...comum,
        titulo: 'Férias vencidas',
        detalhe: 'o período para tirar acabou: pagamento em dobro',
        data: ferias.concessivo_fim,
      });
    } else if (ferias.situacao === 'a vencer') {
      // Para caberem inteiras no período concessivo, começam até `limite`.
      // Passado esse dia, o prazo que resta é o fim do período: dali em
      // diante, cada dia de férias sai em dobro.
      const limite = diaDe(ferias.concessivo_fim) - ferias.dias + 1;
      const cabem = limite >= hoje;
      prazo({
        id: `${ferias.id}-vencer`,
        regra: 'feriasEmDobro',
        ...comum,
        titulo: 'Férias a vencer',
        detalhe: cabem
          ? `começar até ${dataCurta(isoDe(limite))} para não pagar em dobro`
          : `já não cabem inteiras: o que passar de ${dataCurta(ferias.concessivo_fim)} sai em dobro`,
        data: cabem ? isoDe(limite) : ferias.concessivo_fim,
      });
    } else if (ferias.situacao === 'programada' && ferias.inicio) {
      const inicio = diaDe(ferias.inicio);
      const aviso = inicio - R.avisoDeFerias.antecedencia;
      const { dia: pagar, nota } = pagamento(inicio - R.pagamentoDeFerias.antecedencia);
      if (aviso >= hoje) {
        prazo({
          id: `${ferias.id}-aviso`,
          regra: 'avisoDeFerias',
          ...comum,
          titulo: 'Entregar o aviso de férias',
          detalhe: `férias a partir de ${dataCurta(ferias.inicio)}`,
          data: isoDe(aviso),
        });
      }
      if (pagar >= hoje) {
        prazo({
          id: `${ferias.id}-pagamento`,
          regra: 'pagamentoDeFerias',
          ...comum,
          titulo: 'Pagar as férias',
          detalhe: `férias a partir de ${dataCurta(ferias.inicio)}${nota ? `; ${nota}, vence no dia útil anterior` : ''}`,
          data: isoDe(pagar),
        });
      }
    }
  }

  /* ---- 13º: um prazo da empresa, sem pessoa */
  const ano = new Date(hoje * 86400000).getUTCFullYear();
  const noQuadro = ativas.filter((pessoa) => diaDe(pessoa.admissao) <= hoje).length;
  for (const [parcela, titulo] of [
    ['primeiraParcela', 'Pagar a 1ª parcela do 13º'],
    ['segundaParcela', 'Pagar a 2ª parcela do 13º'],
  ]) {
    const { mes, dia } = R.decimoTerceiro[parcela];
    const { dia: pagar, nota } = pagamento(diaDaData(ano, mes, dia));
    if (pagar < hoje || noQuadro === 0) continue;
    prazo({
      id: `decimo-${parcela}-${ano}`,
      regra: 'decimoTerceiro',
      tema: 'ferias',
      titulo,
      detalhe: `${noQuadro} ${noQuadro === 1 ? 'pessoa' : 'pessoas'} no quadro${nota ? `; ${nota}, vence no dia útil anterior` : ''}`,
      data: isoDe(pagar),
    });
  }

  /* ---- INSS: do 16º dia somado pela mesma doença em diante, é com o INSS */
  const comSequencia = new Set();
  for (const sequencia of sequenciasDaMesmaDoenca(recorte.afastamentos)) {
    const ultimo = sequencia[sequencia.length - 1];
    sequencia.forEach((item) => comSequencia.add(item.id));
    if (!ativos.has(ultimo.pessoa_id)) continue;
    const dia16 = decimoSextoDia(sequencia);
    if (dia16 === null || dia16 < hoje || diaDe(ultimo.fim_previsto) < dia16) continue;
    const total = sequencia.reduce((soma, item) => soma + item.dias, 0);
    prazo({
      id: `${ultimo.id}-inss`,
      regra: 'inss',
      tema: 'saude',
      aba: 'saude',
      pessoa: resumoDaPessoa(pessoaPorId.get(ultimo.pessoa_id)),
      titulo: 'Encaminhar ao INSS',
      detalhe:
        sequencia.length > 1
          ? `${sequencia.length} afastamentos pela mesma doença somam ${dias(total)}`
          : `afastamento de ${dias(ultimo.dias)} desde ${dataCurta(ultimo.inicio)}`,
      data: isoDe(dia16),
    });
  }
  // Afastamento longo sem CID informado: conta sozinho.
  for (const afastamento of recorte.afastamentos) {
    if (!afastamento.inss || comSequencia.has(afastamento.id) || !ativos.has(afastamento.pessoa_id)) continue;
    const dia16 = diaDe(afastamento.inicio) + R.inss.diasPagosPelaEmpresa;
    if (dia16 < hoje || diaDe(afastamento.fim_previsto) < hoje) continue;
    prazo({
      id: `${afastamento.id}-inss`,
      regra: 'inss',
      tema: 'saude',
      aba: 'saude',
      pessoa: resumoDaPessoa(pessoaPorId.get(afastamento.pessoa_id)),
      titulo: 'Encaminhar ao INSS',
      detalhe: `afastamento de ${dias(afastamento.dias)} desde ${dataCurta(afastamento.inicio)}`,
      data: isoDe(dia16),
    });
  }

  /* ---- documentos com validade */
  for (const documento of recorte.documentos) {
    if (!documento.validade || !ativos.has(documento.pessoa_id)) continue;
    const venceu = diaDe(documento.validade) < hoje;
    prazo({
      id: `${documento.id}-validade`,
      regra: 'validade',
      tema: 'documentos',
      aba: 'documentos',
      pessoa: resumoDaPessoa(pessoaPorId.get(documento.pessoa_id)),
      titulo: `Renovar ${documento.tipo}`,
      detalhe: `${venceu ? 'venceu' : 'vence'} em ${dataCurta(documento.validade)}`,
      data: documento.validade,
    });
  }

  return itens.sort((a, b) => a.dias - b.dias || (a.id < b.id ? -1 : 1));
}

/** Esperando você: aprovações e prazos vencidos (o que já devia ter sido feito). */
export function contarEsperando(aprovacoes, prazos) {
  return aprovacoes.length + prazos.filter((item) => item.grupo === 'vencido').length;
}

/** Urgente (a faixa do Início): prazo vencido ou que vence em até 2 dias, inclusive a rescisão por concluir. */
export function listarUrgentes(aprovacoes, prazos) {
  const datas = prazos.filter((item) => item.grupo === 'vencido' || (item.dias >= 0 && item.dias <= JANELAS.urgente));
  const rescisoes = aprovacoes.filter((item) => item.prazo && item.prazo.dias <= JANELAS.urgente);
  return [...rescisoes, ...datas];
}

/** Documentos que precisam de validade para o alerta funcionar. */
const COM_VALIDADE = ['ASO periódico', 'CNH'];

/**
 * Revisão da implantação: o que parece inconsistente nos dados importados
 * e a Gestão confere antes de os alertas começarem. `conferidos` vem do
 * cliente (cliente.revisao.conferidos).
 */
export function listarRevisao(recorte, prazos) {
  const cliente = recorte.cliente;
  if (!emRevisao(cliente)) return [];
  const conferidos = new Set(cliente.revisao?.conferidos || []);
  const implantacao = cliente.implantacao;
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const itens = [];

  for (const item of prazos.filter((prazo) => prazo.grupo === 'conferir')) {
    itens.push({
      id: `revisao-${item.id}`,
      tipo: 'prazo',
      tema: item.tema,
      aba: item.aba,
      pessoa: item.pessoa,
      titulo: item.titulo,
      detalhe: `${item.detalhe}; venceu em ${dataCurta(item.data)}, antes da implantação`,
      orientacao:
        item.regra === 'feriasEmDobro'
          ? 'Se já foram tiradas, registre o período na ficha; se não, estão vencidas de fato.'
          : 'Confira na ficha se já foi resolvido antes da implantação.',
    });
  }

  for (const pessoa of recorte.pessoas) {
    if (pessoa.desligamento || pessoa.contrato !== 'experiência' || pessoa.admissao >= implantacao) continue;
    itens.push({
      id: `revisao-${pessoa.id}-experiencia`,
      tipo: 'experiencia',
      tema: 'pessoas',
      aba: 'contrato',
      pessoa: resumoDaPessoa(pessoa),
      titulo: 'Experiência aberta',
      detalhe: `admissão em ${dataCurta(pessoa.admissao)}, antes da implantação`,
      orientacao: 'Confirme se o contrato foi prorrogado, efetivado ou encerrado.',
    });
  }

  for (const documento of recorte.documentos) {
    if (documento.validade || !COM_VALIDADE.includes(documento.tipo)) continue;
    const pessoa = pessoaPorId.get(documento.pessoa_id);
    if (!pessoa || pessoa.desligamento) continue;
    itens.push({
      id: `revisao-${documento.id}-validade`,
      tipo: 'documento',
      tema: 'documentos',
      aba: 'documentos',
      pessoa: resumoDaPessoa(pessoa),
      titulo: `${documento.tipo} sem validade`,
      detalhe: `emitido em ${dataCurta(documento.emissao)}`,
      orientacao: 'Informe a validade na ficha para o alerta de vencimento funcionar.',
    });
  }

  return itens.map((item) => ({ ...item, conferido: conferidos.has(item.id) }));
}
