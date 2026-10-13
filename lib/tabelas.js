/**
 * Tabelas de 2026 para as estimativas do sistema (custo estimado de pessoal,
 * folha gerencial, provisões, rescisão estimada). Arquivo único: nenhum
 * destes números aparece solto em outro lugar (CLAUDE.md, docs/conceito.md › 4).
 *
 * Tudo aqui é para estimativa gerencial, não para cálculo oficial de folha.
 * Cada valor traz a fonte; `confianca` diz de onde ela vem:
 *   'oficial'       — lei, decreto, portaria, IN ou página do órgão;
 *   'calculado'     — derivado por conta de valores oficiais;
 *   'jurisprudencia' — entendimento de tribunal (STF, STJ, TST), sujeito a mudança;
 *   'secundaria'    — só em fonte secundária.
 *
 * Levantamento de 13/10/2026. Conferência do usuário: pendente (fase 7 do
 * redesenho). Os cálculos de lib/calculos/ só vão para as telas depois dela.
 */

export const VIGENCIA = 2026;

export const CONFERENCIA = { levantadoEm: '2026-10-13', conferidoEm: null, conferidoPor: null };

/* ----------------------------------------------------------- salário mínimo */

export const SALARIO_MINIMO = {
  mensal: 1621.0,
  diario: 54.04,
  horario: 7.37,
  fonte: 'Decreto 12.797/2025, art. 1º (DOU de 24/12/2025), vigente desde 1º/01/2026',
  confianca: 'oficial',
};

/* --------------------------------------------------------- INSS do empregado */

/** Alíquotas progressivas: cada uma incide só sobre a parte do salário dentro da faixa. */
export const INSS_EMPREGADO = {
  faixas: [
    { ate: 1621.0, aliquota: 0.075 },
    { ate: 2902.84, aliquota: 0.09 },
    { ate: 4354.27, aliquota: 0.12 },
    { ate: 8475.55, aliquota: 0.14 },
  ],
  teto: 8475.55,
  // Contribuição máxima no teto: soma das faixas (calculado, a portaria não publica).
  maxima: 988.09,
  fonte: 'Portaria Interministerial MPS/MF 13/2026, arts. 2º e 7º e Anexo II (DOU de 12/01/2026); EC 103/2019, art. 28',
  confianca: 'oficial',
  observacao:
    'O 13º é calculado separado do salário do mês. Arredondamento: centavos, meio para cima, no total (121,575 vira 121,58; há sistemas que truncam e dão 121,57).',
};

/* --------------------------------------------------------------------- IRRF */

/** Tabela progressiva mensal (igual à de maio de 2025). `deduzir` é a parcela a deduzir. */
export const IRRF = {
  faixas: [
    { ate: 2428.8, aliquota: 0, deduzir: 0 },
    { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
    { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
    { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
    { ate: Infinity, aliquota: 0.275, deduzir: 908.73 },
  ],
  dependente: 189.59,
  descontoSimplificado: 607.2,
  /**
   * Redução mensal (Lei 15.270/2025): medida pelo rendimento BRUTO tributável,
   * não pela base de cálculo. Até 5.000,00 o imposto zera; de 5.000,01 a
   * 7.350,00 a redução é constante − fator × rendimento; acima, nada. Sempre
   * limitada ao imposto da tabela. Vale também para o 13º.
   */
  reducao: { zeraAte: 5000.0, maxima: 312.89, parcialAte: 7350.0, constante: 978.62, fator: 0.133145 },
  fonte:
    'Lei 11.482/2007, art. 1º, XII (red. Lei 15.191/2025); Lei 9.250/1995, art. 4º, III, "i" e § 2º, e art. 3º-A (incl. Lei 15.270/2025)',
  confianca: 'oficial',
};

/* ------------------------------------------------------------ salário-família */

export const SALARIO_FAMILIA = {
  cota: 67.54,
  remuneracaoAte: 1980.38,
  fonte: 'Portaria Interministerial MPS/MF 13/2026, art. 4º; Lei 8.213/1991, arts. 65 a 70',
  confianca: 'oficial',
  observacao: 'Por filho de até 14 anos ou inválido; a empresa paga e compensa no recolhimento.',
};

/* --------------------------------------------------------------------- FGTS */

export const FGTS = {
  mensal: 0.08,
  aprendiz: 0.02,
  fonte: 'Lei 8.036/1990, art. 15, caput e § 7º',
  confianca: 'oficial',
};

/** Multa rescisória do FGTS sobre o saldo da conta, por tipo de desligamento. */
export const MULTA_DO_FGTS = {
  'Dispensa sem justa causa': 0.4,
  'Término antecipado da experiência': 0.4,
  'Acordo entre as partes': 0.2,
  'Pedido de demissão': 0,
  'Dispensa com justa causa': 0,
  'Término de contrato de experiência': 0,
  fonte:
    'Lei 8.036/1990, art. 18, §§ 1º e 2º; CLT, art. 484-A, I, "b"; Decreto 99.684/1990, art. 14 (contrato a termo encerrado antes, sem justa causa). A contribuição social de 10% (LC 110/2001) está extinta desde 1º/01/2020 (Lei 13.932/2019, art. 12)',
  confianca: 'oficial',
  observacao: 'A multa não incide sobre o FGTS do aviso prévio indenizado (TST, OJ 42, II, da SDI-1).',
};

/* ----------------------------------------------- contribuição patronal ao INSS */

export const PATRONAL = {
  cota: 0.2,
  rat: [0.01, 0.02, 0.03],
  fap: { minimo: 0.5, maximo: 2.0, padrao: 1.0 },
  fonte: 'Lei 8.212/1991, art. 22, I e II; Decreto 3.048/1999, arts. 202 e 202-A; Lei 10.666/2003, art. 10',
  confianca: 'oficial',
  observacao: 'O FAP é individual por CNPJ e divulgado todo ano; sem o valor da empresa, a estimativa usa 1,0.',
};

/** Contribuições a terceiros (outras entidades) sobre a folha, pelo FPAS da empresa. */
export const TERCEIROS_POR_FPAS = {
  507: { total: 0.058, atividade: 'Indústria em geral, construção civil, software em série, panificação autônoma' },
  515: { total: 0.058, atividade: 'Comércio, serviços de saúde, TI sob encomenda, limpeza, restaurantes, turismo' },
  566: { total: 0.045, atividade: 'Publicidade, jornalismo, rádio e TV, difusão cultural, academias' },
  574: { total: 0.045, atividade: 'Estabelecimentos de ensino (exceto os de direito público)' },
  612: { total: 0.058, atividade: 'Transporte rodoviário de cargas e passageiros, locação de veículos' },
  540: { total: 0.052, atividade: 'Navegação, portos, pesca, dragagem' },
  558: { total: 0.052, atividade: 'Empresas aeroviárias' },
  736: { total: 0.027, atividade: 'Bancos e financeiras (cota patronal de 22,5%)', cota: 0.225 },
  639: { total: 0, atividade: 'Entidade beneficente certificada (isenta)' },
  fonte: 'IN RFB 2.110/2022, Anexo III, atualizado pelo Anexo I da IN RFB 2.321/2026 (DOU de 14/04/2026)',
  confianca: 'oficial',
};

/* ---------------------------------------------------------- Simples Nacional */

/**
 * No Simples, a contribuição patronal (20% + RAT) já está no DAS, exceto no
 * Anexo IV, que a paga à parte. Nenhuma optante paga terceiros. O FGTS é
 * devido normalmente.
 */
export const SIMPLES_NACIONAL = {
  anexos: ['I', 'II', 'III', 'IV', 'V'],
  patronalNoDas: ['I', 'II', 'III', 'V'],
  patronalAParte: ['IV'],
  terceiros: false,
  fonte:
    'LC 123/2006, art. 13, VI, § 1º, VIII e § 3º, e art. 18, § 5º-C; IN RFB 2.110/2022, arts. 164, § 2º, e 171',
  confianca: 'oficial',
  observacao: 'Anexo IV: construção e obras, vigilância, limpeza e conservação, advocacia.',
};

/* ------------------------------------------------ desoneração (só para registro) */

export const DESONERACAO = {
  2026: { sobreAFolha: 0.1, fracaoDaCprb: 0.6 },
  2027: { sobreAFolha: 0.15, fracaoDaCprb: 0.4 },
  semIncidirNoDecimoTerceiro: true,
  fonte: 'Lei 12.546/2011, art. 9º-A (incl. Lei 14.973/2024)',
  confianca: 'oficial',
  observacao: 'Só para os 17 setores da Lei 12.546; RAT e terceiros continuam sobre a folha cheia. Em 2028, volta a cota de 20%.',
};

/* ------------------------------------------------------------- verbas fixas */

export const VERBAS = {
  tercoDeFerias: { fator: 1 / 3, fonte: 'CF, art. 7º, XVII', confianca: 'oficial' },
  feriasEmDobro: { fator: 2, fonte: 'CLT, arts. 134 e 137', confianca: 'oficial' },
  decimoTerceiro: {
    // Fração de 15 dias ou mais no mês conta como mês inteiro (13º e férias proporcionais).
    diasParaContarOMes: 15,
    fonte: 'Lei 4.090/1962, art. 1º, §§ 1º a 3º, e art. 3º; CLT, art. 146, parágrafo único',
    confianca: 'oficial',
  },
  avisoPrevio: {
    base: 30,
    porAnoCompleto: 3,
    maximo: 90,
    fonte: 'Lei 12.506/2011, art. 1º; CLT, art. 487, § 1º (o aviso indenizado conta como tempo de serviço)',
    confianca: 'oficial',
    observacao: '3 dias a cada ano completo (33 com 1 ano): leitura da Nota Técnica 184/2012/MTE, achada só em fonte secundária.',
  },
  multaDoArt477: { salarios: 1, fonte: 'CLT, art. 477, §§ 6º e 8º', confianca: 'oficial', observacao: 'Só quando a rescisão atrasa; não entra na estimativa.' },
  indenizacaoDoArt479: {
    fator: 0.5,
    fonte: 'CLT, arts. 479 a 481',
    confianca: 'oficial',
    observacao: 'Metade do que receberia até o fim do contrato a termo (experiência) encerrado antes, sem justa causa.',
  },
  valeTransporte: {
    descontoMaximo: 0.06,
    fonte: 'Lei 7.418/1985, art. 4º, parágrafo único; Decreto 10.854/2021',
    confianca: 'oficial',
    observacao: 'A empresa paga o que passa de 6% do salário básico.',
  },
};

/* --------------------------------------------- o que entra na base de cada encargo */

/**
 * Incidências por verba: se entra na base do INSS (empregado e patronal, com
 * RAT e terceiros), do FGTS e do IRRF. As marcadas como jurisprudência podem
 * mudar com novos julgamentos.
 */
export const INCIDENCIAS = {
  salario: { inss: true, fgts: true, irrf: true, fonte: 'Lei 8.212/1991, art. 28, I; Lei 8.036/1990, art. 15', confianca: 'oficial' },
  decimoTerceiro: { inss: true, fgts: true, irrf: true, fonte: 'STF, Súmula 688; Lei 8.036/1990, art. 15', confianca: 'oficial' },
  feriasGozadasComTerco: {
    inss: true,
    fgts: true,
    irrf: true,
    fonte: 'STF, Tema 985 (terço de férias gozadas, desde 15/09/2020); STJ, retratação no Tema 479 (2026)',
    confianca: 'jurisprudencia',
  },
  feriasIndenizadasComTerco: {
    inss: false,
    fgts: false,
    irrf: false,
    fonte: 'Lei 8.212/1991, art. 28, § 9º, "d"; Lei 8.036/1990, art. 15, § 6º; STJ, Súmula 386 (IR)',
    confianca: 'oficial',
  },
  avisoPrevioIndenizado: {
    inss: false,
    fgts: true,
    irrf: false,
    fonte: 'STJ, Tema 478 (sem INSS); TST, Súmula 305 e STJ, Súmula 646 (com FGTS)',
    confianca: 'jurisprudencia',
  },
  decimoTerceiroDoAviso: {
    inss: true,
    fgts: true,
    irrf: true,
    fonte: 'STJ, Tema 1.170 (com INSS); a constitucionalidade está no STF, Tema 1.445, ainda sem julgamento',
    confianca: 'jurisprudencia',
  },
  indenizacaoDoArt479: { inss: false, fgts: false, irrf: false, fonte: 'Lei 8.212/1991, art. 28, § 9º, "e", 3', confianca: 'oficial' },
  multaDoFgts: { inss: false, fgts: false, irrf: false, fonte: 'Lei 8.212/1991, art. 28, § 9º, "e", 1', confianca: 'oficial' },
};

/* ------------------------------------------------------ verbas da rescisão */

/**
 * O que cada tipo de desligamento paga. "aviso": 'inteiro' (indenizado),
 * 'metade' (acordo) ou false; "multa" vem de MULTA_DO_FGTS.
 */
export const VERBAS_DA_RESCISAO = {
  'Dispensa sem justa causa': { saldo: true, aviso: 'inteiro', decimoTerceiro: true, feriasVencidas: true, feriasProporcionais: true, art479: false },
  'Término antecipado da experiência': { saldo: true, aviso: false, decimoTerceiro: true, feriasVencidas: true, feriasProporcionais: true, art479: true },
  'Pedido de demissão': { saldo: true, aviso: false, decimoTerceiro: true, feriasVencidas: true, feriasProporcionais: true, art479: false },
  'Acordo entre as partes': { saldo: true, aviso: 'metade', decimoTerceiro: true, feriasVencidas: true, feriasProporcionais: true, art479: false },
  'Dispensa com justa causa': { saldo: true, aviso: false, decimoTerceiro: false, feriasVencidas: true, feriasProporcionais: false, art479: false },
  'Término de contrato de experiência': { saldo: true, aviso: false, decimoTerceiro: true, feriasVencidas: true, feriasProporcionais: true, art479: false },
  fonte:
    'CLT, arts. 146, 147, 477, 479, 484-A e 487; Lei 4.090/1962, art. 3º; TST, Súmulas 157, 171 e 261',
  confianca: 'oficial',
  observacao: 'No pedido de demissão, o aviso é do empregado: não cumprido, pode ser descontado (não entra na estimativa).',
};
