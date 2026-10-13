/**
 * Rescisão estimada e custo de desligar (estimativa gerencial; o cálculo
 * oficial é da contabilidade). Verbas por tipo de desligamento, aviso
 * prévio proporcional com projeção, avos de 13º e de férias, férias vencidas
 * (em dobro depois do período concessivo), indenização do art. 479, FGTS
 * do mês da rescisão, multa do FGTS sobre o saldo estimado e encargos sobre
 * o que tem incidência. Puro; tabelas e incidências em lib/tabelas.js.
 */
import { MULTA_DO_FGTS, VERBAS, VERBAS_DA_RESCISAO } from '../tabelas.js';
import { diaDe, isoDe } from '../calendario.js';
import { centavos, somar } from './dinheiro.js';
import { aliquotaDoFgts, encargosSobre } from './encargos.js';

const partes = (iso) => iso.split('-').map(Number);
const ultimoDia = (ano, mes) => new Date(Date.UTC(ano, mes, 0)).getUTCDate();

/** Soma meses a uma data, sem passar do último dia do mês (31/01 + 1 mês = 28 ou 29/02). */
export function somarMeses(iso, meses) {
  const [ano, mes, dia] = partes(iso);
  const total = mes - 1 + meses;
  const novoAno = ano + Math.floor(total / 12);
  const novoMes = ((total % 12) + 12) % 12 + 1;
  return `${novoAno}-${String(novoMes).padStart(2, '0')}-${String(Math.min(dia, ultimoDia(novoAno, novoMes))).padStart(2, '0')}`;
}

/** Anos completos de casa na data. */
export function anosCompletos(admissao, data) {
  let anos = 0;
  while (somarMeses(admissao, 12 * (anos + 1)) <= data) anos += 1;
  return anos;
}

/** Dias de aviso prévio: 30, mais 3 por ano completo, até 90. */
export function diasDeAvisoPrevio(admissao, data) {
  const { base, porAnoCompleto, maximo } = VERBAS.avisoPrevio;
  return Math.min(maximo, base + porAnoCompleto * anosCompletos(admissao, data));
}

const contaComoMes = (dias) => dias >= VERBAS.decimoTerceiro.diasParaContarOMes;

/** Avos do 13º no ano da data final: cada mês do ano com 15 dias ou mais de trabalho conta. */
export function avosDoDecimoTerceiro(admissao, fim) {
  const [ano, mesFinal] = partes(fim);
  let avos = 0;
  for (let mes = 1; mes <= mesFinal; mes += 1) {
    const primeiro = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimo = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia(ano, mes)).padStart(2, '0')}`;
    const de = admissao > primeiro ? admissao : primeiro;
    const ate = fim < ultimo ? fim : ultimo;
    if (de > ate) continue;
    if (contaComoMes(diaDe(ate) - diaDe(de) + 1)) avos += 1;
  }
  return avos;
}

/** Avos de férias de um período aquisitivo aberto em `inicio`: meses completos, e a fração de 15 dias ou mais. */
export function avosDeFerias(inicio, fim) {
  let avos = 0;
  while (avos < 12) {
    const proximo = somarMeses(inicio, avos + 1);
    if (proximo > isoDe(diaDe(fim) + 1)) break;
    avos += 1;
  }
  if (avos < 12) {
    const comeco = somarMeses(inicio, avos);
    if (comeco <= fim && contaComoMes(diaDe(fim) - diaDe(comeco) + 1)) avos += 1;
  }
  return Math.min(avos, 12);
}

/**
 * Saldo estimado da conta do FGTS no contrato: o depósito de cada mês sobre
 * o salário atual, com o 13º e o terço de férias proporcionais. Sem juros,
 * atualização nem saques: é uma estimativa para a multa.
 */
export function saldoEstimadoDoFgts({ salario, contrato, admissao, saida }) {
  const meses = Math.max((diaDe(saida) - diaDe(admissao) + 1) / 30.4375, 0);
  const porMes = salario * (1 + 1 / 12 + VERBAS.tercoDeFerias.fator / 12);
  return centavos(meses * porMes * aliquotaDoFgts(contrato));
}

/**
 * entrada: {
 *   salario, contrato, admissao, saida (último dia trabalhado), tipo,
 *   periodosPendentes: [{ aquisitivo_fim, concessivo_fim, dias }] — períodos
 *     aquisitivos completos e não tirados,
 *   fimDaExperiencia (contrato de experiência), saldoDoFgts (se souber),
 *   aliquotas (de aliquotasDaEmpresa)
 * }
 */
export function rescisaoEstimada(entrada) {
  const { salario, contrato, admissao, saida, aliquotas, periodosPendentes = [], fimDaExperiencia = null } = entrada;
  let tipo = entrada.tipo;
  // Dispensar antes do fim da experiência é término antecipado (art. 479), sem aviso.
  if (tipo === 'Dispensa sem justa causa' && contrato === 'experiência' && fimDaExperiencia && saida < fimDaExperiencia) {
    tipo = 'Término antecipado da experiência';
  }
  const regras = VERBAS_DA_RESCISAO[tipo];
  if (!regras || typeof regras !== 'object') throw new Error(`Tipo de desligamento desconhecido: ${entrada.tipo}`);

  const diario = salario / 30;
  const verbas = [];
  const verba = (chave, rotulo, valor, incidencia, detalhe) => {
    if (valor > 0) verbas.push({ chave, rotulo, valor: centavos(valor), incidencia, detalhe });
  };

  // Saldo de salário: os dias do mês até a saída (mês comercial de 30 dias).
  const diasNoMes = Math.min(partes(saida)[2], 30);
  if (regras.saldo) verba('saldo', 'Saldo de salário', diario * diasNoMes, 'salario', `${diasNoMes} dias`);

  // Aviso prévio indenizado e a projeção dele no tempo de serviço.
  const diasDeAviso = diasDeAvisoPrevio(admissao, saida);
  const diasPagos = regras.aviso === 'inteiro' ? diasDeAviso : regras.aviso === 'metade' ? Math.ceil(diasDeAviso / 2) : 0;
  if (diasPagos) verba('aviso', 'Aviso prévio indenizado', diario * diasPagos, 'avisoPrevioIndenizado', `${diasPagos} dias`);
  const projecao = diasPagos ? isoDe(diaDe(saida) + diasPagos) : saida;

  // 13º proporcional, com os avos que o aviso projeta.
  const avos13 = regras.decimoTerceiro ? avosDoDecimoTerceiro(admissao, projecao) : 0;
  const avos13SemAviso = regras.decimoTerceiro ? avosDoDecimoTerceiro(admissao, saida) : 0;
  if (avos13) {
    verba('decimoTerceiro', '13º proporcional', (salario / 12) * avos13SemAviso, 'decimoTerceiro', `${avos13SemAviso}/12`);
    if (avos13 > avos13SemAviso) {
      verba('decimoTerceiroDoAviso', '13º sobre o aviso', (salario / 12) * (avos13 - avos13SemAviso), 'decimoTerceiroDoAviso', `${avos13 - avos13SemAviso}/12`);
    }
  }

  // Férias vencidas (períodos completos não tirados), em dobro depois do concessivo.
  const terco = 1 + VERBAS.tercoDeFerias.fator;
  if (regras.feriasVencidas) {
    for (const periodo of periodosPendentes) {
      const dobro = periodo.concessivo_fim < saida ? VERBAS.feriasEmDobro.fator : 1;
      verba(
        `ferias-${periodo.aquisitivo_fim}`,
        dobro > 1 ? 'Férias vencidas em dobro, com 1/3' : 'Férias vencidas, com 1/3',
        diario * (periodo.dias || 30) * terco * dobro,
        'feriasIndenizadasComTerco',
        `período até ${periodo.aquisitivo_fim}`
      );
    }
  }

  // Férias proporcionais do período aberto, com a projeção do aviso.
  let avosFerias = 0;
  if (regras.feriasProporcionais) {
    // O período aberto começa depois do último período completo, tirado ou não.
    const fimDoUltimoCompleto = ultimoCompletoAte(admissao, projecao);
    const inicioDoAberto = fimDoUltimoCompleto ? isoDe(diaDe(fimDoUltimoCompleto) + 1) : admissao;
    avosFerias = inicioDoAberto <= projecao ? avosDeFerias(inicioDoAberto, projecao) : 0;
    if (avosFerias) verba('feriasProporcionais', 'Férias proporcionais, com 1/3', (salario / 12) * avosFerias * terco, 'feriasIndenizadasComTerco', `${avosFerias}/12`);
  }

  // Indenização do art. 479: metade do que receberia até o fim da experiência.
  if (regras.art479 && fimDaExperiencia) {
    const restantes = Math.max(diaDe(fimDaExperiencia) - diaDe(saida), 0);
    verba('art479', 'Indenização do art. 479', diario * restantes * VERBAS.indenizacaoDoArt479.fator, 'indenizacaoDoArt479', `${restantes} dias restantes`);
  }

  // Bases dos encargos, pelas incidências de cada verba.
  const INSS_SIM = ['salario', 'decimoTerceiro', 'decimoTerceiroDoAviso'];
  const FGTS_SIM = ['salario', 'decimoTerceiro', 'decimoTerceiroDoAviso', 'avisoPrevioIndenizado'];
  const baseInss = somar(verbas.filter((item) => INSS_SIM.includes(item.incidencia)).map((item) => item.valor));
  const baseFgts = somar(verbas.filter((item) => FGTS_SIM.includes(item.incidencia)).map((item) => item.valor));
  const baseFgtsSemAviso = somar(verbas.filter((item) => FGTS_SIM.includes(item.incidencia) && item.incidencia !== 'avisoPrevioIndenizado').map((item) => item.valor));
  const encargos = encargosSobre({ inss: baseInss, fgts: baseFgts }, aliquotas, contrato);

  // Multa do FGTS: sobre o saldo e o FGTS do mês, sem o do aviso indenizado (TST, OJ 42).
  const saldo = entrada.saldoDoFgts ?? saldoEstimadoDoFgts({ salario, contrato, admissao, saida });
  const taxaDaMulta = MULTA_DO_FGTS[tipo] || 0;
  const multa = centavos((saldo + baseFgtsSemAviso * aliquotaDoFgts(contrato)) * taxaDaMulta);

  const totalDasVerbas = somar(verbas.map((item) => item.valor));
  const patronal = centavos(encargos.cota + encargos.rat + encargos.terceiros);
  return {
    tipo,
    diasDeAviso,
    diasDeAvisoPagos: diasPagos,
    projecao,
    avos: { decimoTerceiro: avos13, ferias: avosFerias },
    verbas,
    fgts: { saldoEstimado: saldo, doMes: encargos.fgts, multa, taxaDaMulta },
    encargos: { cota: encargos.cota, rat: encargos.rat, terceiros: encargos.terceiros, total: patronal },
    totais: {
      verbas: totalDasVerbas,
      // O que a empresa desembolsa: verbas brutas, FGTS do mês, multa e encargos.
      custo: somar([totalDasVerbas, encargos.fgts, multa, patronal]),
    },
  };
}

/** Fim do último período aquisitivo completo até a data (sem períodos informados). */
function ultimoCompletoAte(admissao, data) {
  let k = 0;
  while (isoDe(diaDe(somarMeses(admissao, 12 * (k + 1))) - 1) <= data) k += 1;
  return k === 0 ? '' : isoDe(diaDe(somarMeses(admissao, 12 * k)) - 1);
}
