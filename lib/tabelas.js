/**
 * Parâmetros das estimativas de custo (custo estimado de pessoal, folha
 * gerencial). Arquivo único: nenhum destes números aparece solto em outro
 * lugar.
 *
 * Regra do produto (decisão de 13/10/2026): a plataforma mostra a ordem de
 * grandeza dos custos para a gestão; cálculos trabalhistas são da
 * contabilidade. Por isso não há aqui INSS nem IRRF do colaborador,
 * rescisão item por item, saldo ou multa do FGTS, nem encargos detalhados:
 * só estimativas simples, sempre identificadas como estimativa.
 * O detalhamento em docs/tabelas.md.
 */

/** Provisões do mês sobre o salário: férias com o terço e 13º. */
export const PROVISOES = {
  ferias: { fracao: 1 / 12, terco: 1 / 3 },
  decimoTerceiro: { fracao: 1 / 12 },
};

/**
 * Encargos: um percentual único por regime tributário, sobre os salários e
 * as provisões, para dar a ordem de grandeza. A empresa pode ter o próprio
 * percentual (cliente.percentual_encargos), que substitui o padrão.
 */
export const ENCARGOS_PADRAO = {
  'Simples Nacional': {
    percentual: 0.08,
    explicacao: 'só o FGTS; a contribuição patronal já está no DAS',
  },
  'Simples Nacional, Anexo IV': {
    percentual: 0.36,
    explicacao: 'FGTS e contribuição patronal, que no Anexo IV é paga à parte',
  },
  'Lucro Presumido': {
    percentual: 0.36,
    explicacao: 'FGTS, contribuição patronal e demais encargos sobre a folha',
  },
  'Lucro Real': {
    percentual: 0.36,
    explicacao: 'FGTS, contribuição patronal e demais encargos sobre a folha',
  },
};

/**
 * Sem o anexo do Simples ou sem o regime, vale o padrão do Simples (8%) e o
 * aviso aparece no cadastro da empresa e no selo de estimativa.
 */
export const AVISOS_DOS_ENCARGOS = {
  anexo: 'anexo a conferir',
  regime: 'regime a conferir',
};

/** Limites do percentual configurado por empresa, para barrar erro de digitação. */
export const LIMITES_DO_PERCENTUAL = { minimo: 0, maximo: 0.8 };

export const DECISAO = {
  em: '2026-10-13',
  regra: 'A plataforma mostra a ordem de grandeza dos custos para a gestão; cálculos trabalhistas são da contabilidade.',
};
