/**
 * Histórico de ações da empresa (fase 14 do redesenho): toda ação relevante
 * com autor e data, do mais novo ao mais antigo. Sai dos próprios registros
 * (registrado_por, validado_por, aprovado_por, concluido_por, alterado_por,
 * encerrado_por), sem tabela à parte; no Supabase, vira a tabela de
 * auditoria.
 *
 * Puro; testado em testes/documentos.test.js. Sem CID nem valores: o
 * histórico diz quem fez o quê e quando.
 */
export const TIPOS_DO_HISTORICO = ['Cadastro', 'Afastamento', 'Ocorrência', 'Movimentação', 'Férias', 'Documento', 'Benefício', 'Custos', 'Empresa'];

export function historicoDaEmpresa(recorte) {
  const pessoaPorId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  const itens = [];
  const pessoa = (id) => {
    const achada = pessoaPorId.get(id);
    return achada ? { nome: achada.nome, matricula: achada.matricula } : null;
  };
  const acao = (dados) => {
    if (!dados.autor || !dados.em) return;
    itens.push(dados);
  };

  for (const item of recorte.pessoas) {
    acao({ id: `${item.id}-cad`, tipo: 'Cadastro', texto: item.desligamento ? 'cadastrou (ex-colaborador)' : 'cadastrou a admissão', pessoa: pessoa(item.id), autor: item.registrado_por, em: item.registrado_em, aba: 'contrato' });
  }
  for (const item of recorte.afastamentos) {
    acao({ id: `${item.id}-reg`, tipo: 'Afastamento', texto: `registrou ${item.atestado ? 'um atestado' : 'um afastamento'} de ${item.dias} dias`, pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: 'saude' });
    if (item.validado_por) acao({ id: `${item.id}-val`, tipo: 'Afastamento', texto: `${item.validacao === 'Rejeitado' ? 'rejeitou' : 'aprovou'} o atestado`, pessoa: pessoa(item.pessoa_id), autor: item.validado_por, em: item.validado_em, aba: 'saude' });
  }
  for (const item of recorte.ocorrencias) {
    acao({ id: `${item.id}-reg`, tipo: 'Ocorrência', texto: `registrou ${item.tipo.toLowerCase()}`, pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: 'ocorrencias' });
  }
  for (const item of recorte.movimentacoes) {
    if (['Afastamento', 'Retorno de Afastamento'].includes(item.tipo)) continue;
    acao({ id: `${item.id}-reg`, tipo: 'Movimentação', texto: `registrou ${item.tipo === 'Desligamento' ? 'o desligamento' : item.tipo.toLowerCase()}`, pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: item.tipo === 'Desligamento' ? 'desligamento' : 'movimentacoes' });
    if (item.concluido_por) acao({ id: `${item.id}-con`, tipo: 'Movimentação', texto: 'concluiu o desligamento', pessoa: pessoa(item.pessoa_id), autor: item.concluido_por, em: item.concluido_em, aba: 'desligamento' });
  }
  for (const item of recorte.ferias) {
    if (item.registrado_por) {
      acao({ id: `${item.id}-reg`, tipo: 'Férias', texto: item.situacao === 'aguardando aprovação' ? 'pediu férias' : `programou férias de ${item.dias} dias`, pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: 'ferias' });
    }
    if (item.recusado_por) acao({ id: `${item.id}-rec`, tipo: 'Férias', texto: 'recusou o pedido de férias', pessoa: pessoa(item.pessoa_id), autor: item.recusado_por, em: item.recusado_em, aba: 'ferias' });
  }
  for (const item of recorte.documentos || []) {
    acao({ id: `${item.id}-reg`, tipo: 'Documento', texto: `registrou ${item.tipo}`, pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: 'documentos' });
  }
  for (const item of recorte.adesoes || []) {
    if (item.registrado_por) acao({ id: `${item.id}-reg`, tipo: 'Benefício', texto: 'incluiu num benefício', pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: 'remuneracao' });
    if (item.encerrado_por) acao({ id: `${item.id}-enc`, tipo: 'Benefício', texto: 'encerrou um benefício', pessoa: pessoa(item.pessoa_id), autor: item.encerrado_por, em: item.encerrado_em, aba: 'remuneracao' });
  }
  for (const item of recorte.beneficios || []) {
    acao({ id: `${item.id}-reg`, tipo: 'Benefício', texto: `cadastrou o benefício ${item.nome}`, pessoa: null, autor: item.registrado_por, em: item.registrado_em });
    acao({ id: `${item.id}-alt`, tipo: 'Benefício', texto: `mudou os valores de ${item.nome}`, pessoa: null, autor: item.alterado_por, em: item.alterado_em });
  }
  for (const item of recorte.custos || []) {
    acao({ id: `${item.id}-reg`, tipo: 'Custos', texto: `informou os custos ${item.momento === 'admissao' ? 'da admissão' : 'do desligamento'}`, pessoa: pessoa(item.pessoa_id), autor: item.registrado_por, em: item.registrado_em, aba: item.momento === 'admissao' ? 'contrato' : 'desligamento' });
  }
  for (const item of recorte.cliente?.historico || []) {
    acao({ id: item.id, tipo: 'Empresa', texto: item.texto, pessoa: null, autor: item.autor, em: item.em });
  }
  return itens.sort((a, b) => (a.em < b.em ? 1 : a.em > b.em ? -1 : a.id < b.id ? 1 : -1));
}
