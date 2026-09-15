import { paraData } from '@/lib/formato';

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const DIA = 86400000;

function inicioDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes, 1));
}

function fimDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0));
}

function diasUteis(ano, mes) {
  const ultimo = fimDoMes(ano, mes).getUTCDate();
  let total = 0;

  for (let dia = 1; dia <= ultimo; dia += 1) {
    const semana = new Date(Date.UTC(ano, mes, dia)).getUTCDay();
    if (semana !== 0 && semana !== 6) total += 1;
  }

  return total;
}

/** Os últimos N meses, terminando no mês corrente. */
export function montarPeriodo(meses) {
  const agora = new Date();
  const lista = [];

  for (let recuo = meses - 1; recuo >= 0; recuo -= 1) {
    const referencia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - recuo, 1));
    const ano = referencia.getUTCFullYear();
    const mes = referencia.getUTCMonth();

    lista.push({
      ano,
      mes,
      inicio: inicioDoMes(ano, mes),
      fim: fimDoMes(ano, mes),
      diasUteis: diasUteis(ano, mes),
      rotulo: `${MESES_CURTOS[mes]}/${String(ano).slice(2)}`,
    });
  }

  return lista;
}

function dentro(data, inicio, fim) {
  const referencia = paraData(data);
  if (!referencia) return false;
  return referencia >= inicio && referencia <= fim;
}

function taxa(numerador, denominador) {
  if (!denominador) return 0;
  return (numerador / denominador) * 100;
}

function arredondar(valor, casas = 1) {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

export function calcularIndicadores({
  pessoas,
  ocorrencias,
  atestados,
  movimentacoes,
  meses = 6,
}) {
  const periodo = montarPeriodo(meses);
  const abertura = periodo[0].inicio;
  const fechamento = periodo[periodo.length - 1].fim;
  const hoje = new Date();

  /* Saída de cada pessoa: a movimentação de desligamento manda. Quem está
     inativo sem desligamento registrado conta como saída no mês corrente. */
  const desligamentos = new Map();
  movimentacoes
    .filter((item) => item.tipo === 'Desligamento')
    .forEach((item) => {
      const data = paraData(item.efetiva);
      if (!data) return;
      const atual = desligamentos.get(item.matricula);
      if (!atual || data < atual) desligamentos.set(item.matricula, data);
    });

  const semRegistroDeSaida = pessoas.filter(
    (pessoa) => pessoa.status === 'Inativo' && !desligamentos.has(pessoa.matricula)
  ).length;

  function saidaDe(pessoa) {
    const registrada = desligamentos.get(pessoa.matricula);
    if (registrada) return registrada;
    if (pessoa.status === 'Inativo') return hoje;
    return null;
  }

  function ativoEm(pessoa, data) {
    const admissao = paraData(pessoa.admissao);
    if (!admissao || admissao > data) return false;
    const saida = saidaDe(pessoa);
    return !saida || saida > data;
  }

  /* --------------------------------------------------------- série mensal */

  const serie = periodo.map((mes) => {
    const vespera = new Date(mes.inicio.getTime() - DIA);
    const quadroInicio = pessoas.filter((pessoa) => ativoEm(pessoa, vespera)).length;
    const quadroFim = pessoas.filter((pessoa) => ativoEm(pessoa, mes.fim)).length;
    const quadroMedio = (quadroInicio + quadroFim) / 2 || quadroFim;

    const admissoes = pessoas.filter((pessoa) =>
      dentro(pessoa.admissao, mes.inicio, mes.fim)
    ).length;

    const saidas = pessoas.filter((pessoa) => {
      const saida = saidaDe(pessoa);
      return saida && saida >= mes.inicio && saida <= mes.fim;
    }).length;

    const faltas = ocorrencias.filter(
      (item) => item.tipo.startsWith('Falta') && dentro(item.data, mes.inicio, mes.fim)
    ).length;

    const faltasInjustificadas = ocorrencias.filter(
      (item) => item.tipo === 'Falta Injustificada' && dentro(item.data, mes.inicio, mes.fim)
    ).length;

    /* Atestado que atravessa a virada do mês tem os dias distribuídos. */
    const diasDeAtestado = atestados
      .filter((item) => item.status !== 'Rejeitado')
      .reduce((total, item) => {
        const inicio = paraData(item.inicio);
        if (!inicio) return total;

        let contados = 0;
        for (let i = 0; i < item.dias; i += 1) {
          const dia = new Date(inicio.getTime() + i * DIA);
          if (dia >= mes.inicio && dia <= mes.fim) contados += 1;
        }
        return total + contados;
      }, 0);

    const diasPerdidos = faltas + diasDeAtestado;

    return {
      ...mes,
      quadroInicio,
      quadroFim,
      quadroMedio,
      admissoes,
      saidas,
      faltas,
      faltasInjustificadas,
      diasDeAtestado,
      diasPerdidos,
      turnover: arredondar(taxa((admissoes + saidas) / 2, quadroMedio)),
      absenteismo: arredondar(taxa(diasPerdidos, quadroMedio * mes.diasUteis)),
    };
  });

  /* ------------------------------------------------------ totais do período */

  const admissoesTotais = serie.reduce((total, mes) => total + mes.admissoes, 0);
  const saidasTotais = serie.reduce((total, mes) => total + mes.saidas, 0);
  const quadroMedioDoPeriodo =
    serie.reduce((total, mes) => total + mes.quadroMedio, 0) / serie.length || 0;

  const diasPerdidosTotais = serie.reduce((total, mes) => total + mes.diasPerdidos, 0);
  const diasUteisTotais = serie.reduce((total, mes) => total + mes.diasUteis, 0);

  const ativos = pessoas.filter((pessoa) => ativoEm(pessoa, hoje));

  /* -------------------------------------------------- recortes do período */

  const noPeriodo = (data) => dentro(data, abertura, fechamento);

  const ocorrenciasDoPeriodo = ocorrencias.filter((item) => noPeriodo(item.data));
  const atestadosDoPeriodo = atestados.filter((item) => noPeriodo(item.inicio));
  const movimentacoesDoPeriodo = movimentacoes.filter((item) => noPeriodo(item.efetiva));

  const contar = (lista, campo) => {
    const mapa = new Map();
    lista.forEach((item) => {
      const chave = item[campo] || 'Não informado';
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });
    return [...mapa].sort((a, b) => b[1] - a[1]).map(([rotulo, valor]) => ({ rotulo, valor }));
  };

  const porPessoa = new Map();
  ocorrenciasDoPeriodo.forEach((item) => {
    porPessoa.set(item.matricula, (porPessoa.get(item.matricula) || 0) + 1);
  });

  const reincidentes = [...porPessoa]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([matricula, valor]) => ({
      matricula,
      rotulo: pessoas.find((pessoa) => pessoa.matricula === matricula)?.nome || matricula,
      valor,
    }));

  /* Tempo de casa de quem está no quadro hoje. */
  const faixas = [
    { rotulo: 'Menos de 1 ano', valor: 0 },
    { rotulo: 'De 1 a 3 anos', valor: 0 },
    { rotulo: 'De 3 a 5 anos', valor: 0 },
    { rotulo: 'Mais de 5 anos', valor: 0 },
  ];

  ativos.forEach((pessoa) => {
    const admissao = paraData(pessoa.admissao);
    if (!admissao) return;
    const anos = (hoje - admissao) / (365 * DIA);
    if (anos < 1) faixas[0].valor += 1;
    else if (anos < 3) faixas[1].valor += 1;
    else if (anos < 5) faixas[2].valor += 1;
    else faixas[3].valor += 1;
  });

  const diasDeAtestadoTotais = atestadosDoPeriodo
    .filter((item) => item.status !== 'Rejeitado')
    .reduce((total, item) => total + item.dias, 0);

  return {
    periodo,
    serie,
    meses,
    resumo: {
      quadroAtual: ativos.length,
      admissoes: admissoesTotais,
      saidas: saidasTotais,
      saldo: admissoesTotais - saidasTotais,
      turnover: arredondar(taxa((admissoesTotais + saidasTotais) / 2, quadroMedioDoPeriodo)),
      absenteismo: arredondar(
        taxa(diasPerdidosTotais, (quadroMedioDoPeriodo || 1) * diasUteisTotais)
      ),
      diasPerdidos: diasPerdidosTotais,
      diasDeAtestado: diasDeAtestadoTotais,
      atestados: atestadosDoPeriodo.length,
      mediaDiasPorAtestado: atestadosDoPeriodo.length
        ? arredondar(diasDeAtestadoTotais / atestadosDoPeriodo.length)
        : 0,
      ocorrencias: ocorrenciasDoPeriodo.length,
      movimentacoes: movimentacoesDoPeriodo.length,
      promocoes: movimentacoesDoPeriodo.filter((item) => item.tipo === 'Promoção').length,
      lancamentos:
        ocorrenciasDoPeriodo.length + atestadosDoPeriodo.length + movimentacoesDoPeriodo.length,
      semRegistroDeSaida,
    },
    porTipoDeOcorrencia: contar(ocorrenciasDoPeriodo, 'tipo'),
    porTipoDeMovimentacao: contar(movimentacoesDoPeriodo, 'tipo'),
    porArea: contar(ativos, 'departamento'),
    reincidentes,
    tempoDeCasa: faixas,
  };
}
