/**
 * Exportação em CSV (fase 15 do redesenho), no jeito que o Excel em
 * português abre direto: separador ";", vírgula decimal, BOM do UTF-8 e
 * aspas onde precisa. Nada de CPF inteiro, salário individual nem CID:
 * exportação é para acompanhar, não para levar dado pessoal.
 *
 * Puro; testado em testes/carteira.test.js.
 */
const BOM = '﻿';

function celula(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? String(Math.round(valor * 100) / 100).replace('.', ',') : String(valor);
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** colunas: [{ rotulo, valor(linha) }]; linhas: os objetos. */
export function paraCsv(colunas, linhas) {
  const cabecalho = colunas.map((coluna) => celula(coluna.rotulo)).join(';');
  const corpo = linhas.map((linha) => colunas.map((coluna) => celula(coluna.valor(linha))).join(';'));
  return `${BOM}${[cabecalho, ...corpo].join('\r\n')}\r\n`;
}

/** As colunas da carteira (comparação entre clientes). */
export const COLUNAS_DA_CARTEIRA = [
  { rotulo: 'Cliente', valor: (linha) => linha.nome },
  { rotulo: 'Regime tributário', valor: (linha) => linha.regime },
  { rotulo: 'Pessoas no quadro', valor: (linha) => linha.pessoas },
  { rotulo: 'Custo estimado de pessoal (R$, estimativa)', valor: (linha) => linha.custo },
  { rotulo: 'Fator de custo (estimativa)', valor: (linha) => linha.fator },
  { rotulo: 'Turnover em 12 meses (%)', valor: (linha) => linha.turnover },
  { rotulo: 'Absenteísmo em 3 meses (%)', valor: (linha) => (linha.absenteismoOculto ? 'oculto (menos de 3 pessoas)' : linha.absenteismo) },
  { rotulo: 'Pessoas com férias vencidas', valor: (linha) => linha.feriasVencidas },
  { rotulo: 'Aprovações esperando', valor: (linha) => linha.aprovacoes },
  { rotulo: 'Prazos vencidos', valor: (linha) => linha.vencidos },
];

/** As colunas da lista de colaboradores de um cliente (sem CPF nem salário). */
export const COLUNAS_DE_COLABORADORES = [
  { rotulo: 'Matrícula', valor: (linha) => linha.matricula },
  { rotulo: 'Nome', valor: (linha) => linha.nome },
  { rotulo: 'Unidade', valor: (linha) => linha.cnpj?.nome || '' },
  { rotulo: 'Departamento', valor: (linha) => linha.departamento },
  { rotulo: 'Cargo', valor: (linha) => linha.cargo },
  { rotulo: 'Contrato', valor: (linha) => linha.contrato },
  { rotulo: 'Admissão', valor: (linha) => (linha.admissao ? linha.admissao.split('-').reverse().join('/') : '') },
  { rotulo: 'Situação', valor: (linha) => linha.situacao },
  { rotulo: 'Tempo de casa', valor: (linha) => linha.tempoDeCasa },
];
