/**
 * Regras de prazo da Gestão da empresa, num lugar só (docs/redesenho.md › 9).
 * São prazos legais, em dias corridos, com a fonte de cada um; quando a lei
 * mudar, muda aqui, e nenhum desses números aparece solto em outro arquivo.
 * Usadas por lib/prazos.js e lib/calendario.js. Conferidas pelo usuário em
 * 13/10/2026.
 */
export const REGRAS_DE_PRAZO = {
  experiencia: {
    primeiroPeriodo: 45,
    total: 90,
    fonte: 'CLT, art. 445, parágrafo único (até 90 dias), e art. 451 (uma prorrogação)',
  },
  registroDeAdmissao: {
    antecedencia: 1,
    fonte: 'CLT, art. 41; o eSocial pede a admissão até a véspera do primeiro dia de trabalho',
  },
  avisoDeFerias: { antecedencia: 30, fonte: 'CLT, art. 135' },
  // Prazos de pagamento que caem em fim de semana ou feriado antecipam
  // para o dia útil anterior (`antecipa: true`).
  pagamentoDeFerias: { antecedencia: 2, antecipa: true, fonte: 'CLT, art. 145' },
  feriasEmDobro: { fonte: 'CLT, arts. 134 e 137' },
  rescisao: { dias: 10, antecipa: true, fonte: 'CLT, art. 477, § 6º' },
  inss: {
    diasPagosPelaEmpresa: 15,
    // Afastamentos pela mesma doença (mesmo CID) com até 60 dias entre o
    // retorno e o novo afastamento somam os dias para contar os 15.
    mesmaDoencaEmDias: 60,
    fonte: 'Lei 8.213/1991, art. 60, § 3º; Decreto 3.048/1999, art. 75',
  },
  decimoTerceiro: {
    primeiraParcela: { mes: 11, dia: 30 },
    segundaParcela: { mes: 12, dia: 20 },
    antecipa: true,
    fonte: 'Lei 4.749/1965, arts. 1º e 2º',
  },
};

/**
 * Feriados nacionais, para antecipar os prazos de pagamento. Feriados
 * estaduais e municipais entram no cadastro da empresa (fase 14).
 * A Sexta-feira da Paixão é contada a partir da Páscoa.
 */
export const FERIADOS_NACIONAIS = [
  { mes: 1, dia: 1, nome: 'Confraternização Universal', fonte: 'Lei 662/1949' },
  { mes: 4, dia: 21, nome: 'Tiradentes', fonte: 'Lei 662/1949' },
  { mes: 5, dia: 1, nome: 'Dia do Trabalho', fonte: 'Lei 662/1949' },
  { mes: 9, dia: 7, nome: 'Independência do Brasil', fonte: 'Lei 662/1949' },
  { mes: 10, dia: 12, nome: 'Nossa Senhora Aparecida', fonte: 'Lei 6.802/1980' },
  { mes: 11, dia: 2, nome: 'Finados', fonte: 'Lei 662/1949' },
  { mes: 11, dia: 15, nome: 'Proclamação da República', fonte: 'Lei 662/1949' },
  { mes: 11, dia: 20, nome: 'Dia Nacional de Zumbi e da Consciência Negra', fonte: 'Lei 14.759/2023' },
  { mes: 12, dia: 25, nome: 'Natal', fonte: 'Lei 662/1949' },
];

export const FERIADOS_MOVEIS = [
  { diasDaPascoa: -2, nome: 'Sexta-feira da Paixão', fonte: 'Lei 9.093/1995, art. 2º' },
];

/**
 * Janelas da tela, em dias a partir de hoje: "esta semana" vai até 6,
 * "próximos 30 dias" até 30 e "mais adiante" até 60. O que passa de 60
 * não aparece. "Urgente" (a faixa do Início) é vencido ou até 2 dias.
 */
export const JANELAS = { urgente: 2, semana: 6, mes: 30, adiante: 60 };
