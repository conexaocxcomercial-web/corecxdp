/**
 * Documentos (fase 14 do redesenho): os documentos de cada pessoa, a
 * situação pela validade (vencido, vencendo em 30 dias, válido, sem
 * validade) e a completude do cadastro: contrato de trabalho e ASO
 * admissional para todos e, depois de um ano de casa, o ASO periódico em dia.
 *
 * Puro; testado em testes/documentos.test.js.
 */
import { diaDe, isoDe } from './calendario.js';

export const TIPOS_DE_DOCUMENTO = ['Contrato de trabalho', 'ASO admissional', 'ASO periódico', 'CNH', 'Outros'];
/** Estes vencem: pedem a validade. */
export const COM_VALIDADE = ['ASO periódico', 'CNH'];
export const VENCENDO_EM = 30;

export class ErroDeDocumento extends Error {}

export function situacaoDoDocumento(documento, hojeIso) {
  if (!documento.validade) return COM_VALIDADE.includes(documento.tipo) ? 'sem validade' : 'válido';
  const faltam = diaDe(documento.validade) - diaDe(hojeIso);
  if (faltam < 0) return 'vencido';
  if (faltam <= VENCENDO_EM) return 'vencendo';
  return 'válido';
}

/** O que falta no cadastro da pessoa: os obrigatórios e, depois de um ano, o ASO periódico em dia. */
export function pendenciasDaPessoa(pessoa, documentos, hojeIso) {
  const delas = documentos.filter((item) => item.pessoa_id === pessoa.id);
  const tem = (tipo) => delas.some((item) => item.tipo === tipo);
  const faltam = [];
  if (!tem('Contrato de trabalho')) faltam.push('contrato de trabalho');
  if (!tem('ASO admissional')) faltam.push('ASO admissional');
  if (diaDe(hojeIso) - diaDe(pessoa.admissao) > 365) {
    const periodicos = delas.filter((item) => item.tipo === 'ASO periódico');
    if (!periodicos.length) faltam.push('ASO periódico');
    else if (periodicos.every((item) => situacaoDoDocumento(item, hojeIso) === 'vencido')) faltam.push('ASO periódico vencido');
  }
  return faltam;
}

/** Documento novo. entrada: { tipo, emissao, validade, anexo, descricao }. */
export function montarDocumento(entrada, { pessoa, hoje }) {
  const tipo = String(entrada.tipo || '').trim();
  if (!TIPOS_DE_DOCUMENTO.includes(tipo)) throw new ErroDeDocumento('Escolha o tipo de documento.');
  const emissao = String(entrada.emissao || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(emissao)) throw new ErroDeDocumento('Informe a data de emissão.');
  if (emissao > hoje) throw new ErroDeDocumento('A emissão não pode ser num dia que ainda não chegou.');
  const validade = String(entrada.validade || '').trim() || null;
  if (validade && !/^\d{4}-\d{2}-\d{2}$/.test(validade)) throw new ErroDeDocumento('A validade não é uma data.');
  if (COM_VALIDADE.includes(tipo) && !validade) throw new ErroDeDocumento(`${tipo} vence: informe a validade.`);
  if (validade && validade <= emissao) throw new ErroDeDocumento('A validade precisa ser depois da emissão.');
  const descricao = String(entrada.descricao || '').trim();
  if (tipo === 'Outros' && descricao.length < 3) throw new ErroDeDocumento('Diga que documento é.');
  if (pessoa.desligamento?.data && pessoa.desligamento.data < hoje && tipo !== 'Outros') {
    throw new ErroDeDocumento('Esta pessoa já saiu: só documentos do tipo Outros.');
  }
  return { tipo, emissao, validade, anexo: String(entrada.anexo || '').trim(), descricao: descricao || null };
}

/** A tela de Documentos: os documentos de quem está no quadro, a situação de cada um e a completude. */
export function resumoDosDocumentos(recorte) {
  const hoje = recorte.hoje;
  const ativas = recorte.pessoas.filter((pessoa) => pessoa.admissao && pessoa.admissao <= hoje && (!pessoa.desligamento?.data || pessoa.desligamento.data >= hoje));
  const porId = new Map(ativas.map((pessoa) => [pessoa.id, pessoa]));
  const resumo = (pessoa) => ({ nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo, departamento: pessoa.departamento });
  const documentos = (recorte.documentos || [])
    .filter((item) => porId.has(item.pessoa_id))
    .map((item) => ({ ...item, situacao: situacaoDoDocumento(item, hoje), pessoa: resumo(porId.get(item.pessoa_id)), faltam: item.validade ? diaDe(item.validade) - diaDe(hoje) : null }));
  const pessoas = ativas.map((pessoa) => ({ pessoa: resumo(pessoa), faltam: pendenciasDaPessoa(pessoa, recorte.documentos || [], hoje) }));
  const completas = pessoas.filter((item) => item.faltam.length === 0).length;
  const conta = (situacao) => documentos.filter((item) => item.situacao === situacao).length;
  return {
    documentos: documentos.sort((a, b) => (a.validade || '9999') < (b.validade || '9999') ? -1 : 1),
    incompletos: pessoas.filter((item) => item.faltam.length).sort((a, b) => b.faltam.length - a.faltam.length),
    numeros: {
      documentos: documentos.length,
      vencidos: conta('vencido'),
      vencendo: conta('vencendo'),
      semValidade: conta('sem validade'),
      completos: ativas.length ? Math.round((completas / ativas.length) * 1000) / 10 : 100,
      pessoasCompletas: completas,
      pessoas: ativas.length,
    },
    ate: isoDe(diaDe(hoje) + VENCENDO_EM),
  };
}
