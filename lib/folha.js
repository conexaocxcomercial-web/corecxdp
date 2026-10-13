/**
 * Folha gerencial (fase 12 do redesenho): o custo estimado de pessoal de uma
 * competência, pessoa a pessoa e no total, a composição, o fator de custo e
 * as parcelas do 13º. Tudo é estimativa: a plataforma mostra a ordem de
 * grandeza dos custos para a gestão; cálculos trabalhistas (INSS e IRRF do
 * colaborador, folha oficial) são da contabilidade.
 *
 * As contas do custo ficam em lib/calculos/custo.js e os parâmetros em
 * lib/tabelas.js. Puro; testado em testes/folha.test.js.
 */
import { custoEstimado, percentualDeEncargos } from './calculos/custo.js';
import { centavos, somar } from './calculos/dinheiro.js';
import { diaDaData, diaDe, diaUtilAnterior, isoDe, motivoDeNaoSerUtil } from './calendario.js';
import { REGRAS_DE_PRAZO as R } from './regrasDePrazo.js';
import { ENCARGOS_PADRAO } from './tabelas.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const curta = (iso) => iso.split('-').reverse().join('/').slice(0, 5);

function ativaEm(pessoa, diaIso) {
  if (!pessoa.admissao || pessoa.admissao > diaIso) return false;
  return !pessoa.desligamento?.data || pessoa.desligamento.data >= diaIso;
}

/* ------------------------------------------------------- competência */

/** As competências que dá para ver: o mês atual e os anteriores (`quantas` ao todo). */
export function competencias(hojeIso, quantas = 12) {
  const [ano, mes] = hojeIso.split('-').map(Number);
  const lista = [];
  for (let recuo = 0; recuo < quantas; recuo += 1) {
    const inicio = new Date(Date.UTC(ano, mes - 1 - recuo, 1));
    const a = inicio.getUTCFullYear();
    const m = inicio.getUTCMonth();
    const fim = new Date(Date.UTC(a, m + 1, 0)).toISOString().slice(0, 10);
    lista.push({
      valor: `${a}-${String(m + 1).padStart(2, '0')}`,
      rotulo: `${MESES[m]} de ${a}`,
      inicio: inicio.toISOString().slice(0, 10),
      fim,
      // A referência é o fim do mês; no mês atual, hoje.
      referencia: fim > hojeIso ? hojeIso : fim,
      atual: recuo === 0,
    });
  }
  return lista;
}

export function competenciaDe(hojeIso, valor) {
  const lista = competencias(hojeIso);
  return lista.find((item) => item.valor === valor) || lista[0];
}

/* ------------------------------------------------- dados da empresa */

/**
 * O percentual de encargos da empresa e de onde ele veio. Percentual
 * configurado fora dos limites vira o padrão do regime, com aviso.
 */
export function encargosDaEmpresa(cliente) {
  const empresa = {
    regime: cliente?.regime_tributario || null,
    anexoSimples: cliente?.anexo_simples || null,
    percentualEncargos: cliente?.percentual_encargos ?? null,
  };
  try {
    return percentualDeEncargos(empresa);
  } catch {
    return { ...percentualDeEncargos({ ...empresa, percentualEncargos: null }), aviso: 'percentual a conferir' };
  }
}

/** O salário vigente na data: o do cadastro mais as alterações já em vigor. */
export function salarioEm(pessoa, movimentacoes, dataIso) {
  let salario = pessoa.salario_cadastro ?? pessoa.salario ?? null;
  const delas = movimentacoes
    .filter((item) => item.pessoa_id === pessoa.id && item.novo?.salario && item.efetiva <= dataIso)
    .sort((a, b) => (a.efetiva < b.efetiva ? -1 : 1));
  for (const item of delas) salario = item.novo.salario;
  return salario;
}

/** Os benefícios da pessoa na data, com o valor que a empresa paga por mês. */
export function beneficiosEm(pessoa, { adesoes = [], beneficios = [] }, dataIso) {
  const porId = new Map(beneficios.map((item) => [item.id, item]));
  return adesoes
    .filter((adesao) => adesao.pessoa_id === pessoa.id && (!adesao.desde || adesao.desde <= dataIso) && (!adesao.ate || adesao.ate >= dataIso))
    .map((adesao) => porId.get(adesao.beneficio_id))
    .filter(Boolean)
    .map((beneficio) => ({ id: beneficio.id, nome: beneficio.nome, tipo: beneficio.tipo, valor: beneficio.valor_empresa }));
}

/* ------------------------------------------------------------- folha */

/**
 * A folha gerencial de uma competência: quem estava no quadro na data de
 * referência, com o salário vigente, as provisões, os encargos pelo
 * percentual da empresa e os benefícios; o total, o fator de custo e a
 * composição. `grupos` divide o total por unidade e por departamento.
 */
export function folhaDoMes(recorte, competencia) {
  const referencia = competencia.referencia;
  const encargos = encargosDaEmpresa(recorte.cliente);
  const pessoas = recorte.pessoas
    .filter((pessoa) => ativaEm(pessoa, referencia))
    .map((pessoa) => {
      const salario = salarioEm(pessoa, recorte.movimentacoes || [], referencia);
      const beneficios = beneficiosEm(pessoa, recorte, referencia);
      const custo = custoEstimado({ salarios: salario ? [salario] : [], beneficios: beneficios.map((item) => item.valor) }, encargos.percentual);
      return { pessoa, salario, beneficios, custo };
    });
  const comSalario = pessoas.filter((item) => item.salario);
  const totais = custoEstimado(
    { salarios: comSalario.map((item) => item.salario), beneficios: pessoas.flatMap((item) => item.beneficios.map((beneficio) => beneficio.valor)) },
    encargos.percentual
  );
  return {
    competencia,
    encargos,
    pessoas,
    semSalario: pessoas.length - comSalario.length,
    totais,
    composicao: composicaoDe(totais),
  };
}

/** A composição do total, na ordem em que o custo se forma. */
export function composicaoDe(totais) {
  const partes = [
    { chave: 'salarios', rotulo: 'Salários', valor: totais.salarios },
    { chave: 'provisoes', rotulo: 'Provisões de férias e 13º', valor: totais.provisoes.total },
    { chave: 'encargos', rotulo: 'Encargos', valor: totais.encargos },
    { chave: 'beneficios', rotulo: 'Benefícios', valor: totais.beneficios },
  ];
  return partes.map((parte) => ({ ...parte, fracao: totais.total ? parte.valor / totais.total : 0 }));
}

/** O total de cada uma das últimas `quantas` competências, da mais antiga para a atual. */
export function serieDaFolha(recorte, quantas = 12) {
  return competencias(recorte.hoje, quantas)
    .reverse()
    .map((competencia) => ({ competencia, totais: folhaDoMes(recorte, competencia).totais }));
}

/** Divide as pessoas da folha por um campo (departamento ou unidade). */
export function folhaPorGrupo(folha, campo, rotuloDe = (chave) => chave) {
  const grupos = new Map();
  for (const item of folha.pessoas) {
    const chave = item.pessoa[campo] || '—';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(item);
  }
  return [...grupos]
    .map(([chave, itens]) => {
      const totais = custoEstimado(
        { salarios: itens.filter((item) => item.salario).map((item) => item.salario), beneficios: itens.flatMap((item) => item.beneficios.map((b) => b.valor)) },
        folha.encargos.percentual
      );
      return { chave, rotulo: rotuloDe(chave), pessoas: itens.length, totais };
    })
    .sort((a, b) => b.totais.total - a.totais.total);
}

/* --------------------------------------------------------------- 13º */

/** Meses do ano em que a pessoa trabalha 15 dias ou mais (os avos do 13º). */
export function avosDoAno(pessoa, ano) {
  let avos = 0;
  for (let mes = 1; mes <= 12; mes += 1) {
    const inicio = diaDaData(ano, mes, 1);
    const fim = diaDaData(ano, mes + 1, 1) - 1;
    const de = Math.max(inicio, diaDe(pessoa.admissao));
    const ate = Math.min(fim, pessoa.desligamento?.data ? diaDe(pessoa.desligamento.data) : fim);
    if (ate - de + 1 >= 15) avos += 1;
  }
  return avos;
}

function vencimento(ano, { mes, dia }) {
  const bruto = diaDaData(ano, mes, dia);
  const util = diaUtilAnterior(bruto);
  return { data: isoDe(util), nota: util === bruto ? '' : `${curta(isoDe(bruto))} é ${motivoDeNaoSerUtil(bruto)}` };
}

/**
 * As parcelas do 13º do ano (estimativa, sem descontos): salário de hoje ×
 * avos ÷ 12, metade na 1ª parcela e o resto na 2ª. Vencimentos no dia útil
 * anterior a 30/11 e a 20/12.
 */
export function decimoTerceiro(recorte) {
  const ano = Number(recorte.hoje.slice(0, 4));
  const pessoas = recorte.pessoas
    .filter((pessoa) => ativaEm(pessoa, recorte.hoje) && pessoa.contrato !== 'estágio')
    .map((pessoa) => {
      const salario = salarioEm(pessoa, recorte.movimentacoes || [], recorte.hoje);
      const avos = avosDoAno(pessoa, ano);
      const estimado = salario ? centavos((salario * avos) / 12) : 0;
      const primeira = centavos(estimado / 2);
      return { pessoa, salario, avos, estimado, primeira, segunda: centavos(estimado - primeira) };
    });
  return {
    ano,
    pessoas,
    parcelas: [
      { numero: 1, ...vencimento(ano, R.decimoTerceiro.primeiraParcela), total: somar(pessoas.map((item) => item.primeira)) },
      { numero: 2, ...vencimento(ano, R.decimoTerceiro.segundaParcela), total: somar(pessoas.map((item) => item.segunda)) },
    ],
    total: somar(pessoas.map((item) => item.estimado)),
    semEstagio: true,
  };
}

/** O texto do selo de estimativa: como o custo é formado e de onde veio o percentual. */
export function explicacaoDaEstimativa(encargos) {
  const percentual = `${String(Math.round(encargos.percentual * 1000) / 10).replace('.', ',')}%`;
  const origem =
    encargos.origem === 'empresa'
      ? `${percentual}, o percentual configurado para a empresa`
      : `${percentual}, o padrão de ${encargos.regime}${ENCARGOS_PADRAO[encargos.regime] ? ` (${ENCARGOS_PADRAO[encargos.regime].explicacao})` : ''}`;
  return {
    percentual,
    texto: `Salários cadastrados, provisões (férias: salário ÷ 12, mais 1/3; 13º: salário ÷ 12), encargos de ${origem} sobre salários e provisões, e o que a empresa paga de benefícios. É a ordem de grandeza para a gestão: o cálculo oficial é da contabilidade.`,
    aviso: encargos.aviso || null,
  };
}
