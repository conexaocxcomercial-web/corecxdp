import * as demo from '@/lib/demo/fonte';
import { lerRecorte } from '@/lib/dados/recorte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerBase } from '@/lib/dados/pessoas';
import { decidir } from '@/lib/dados/pendencias';
import { AvisoAoUsuario } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import * as registros from '@/lib/registros';
import {
  ErroDeLancamento,
  montarAfastamento,
  montarDesligamento,
  montarMovimentacao,
  montarOcorrencia,
  montarRetorno,
} from '@/lib/lancamentos';
import { listarPrazos, recortar } from '@/lib/prazos';
import { dataCurta, emReais, paraISO } from '@/lib/formato';

/**
 * Repositório do Lançar e das telas de Atestados e afastamentos, Ocorrências
 * e Movimentações (fase 8 do redesenho). As regras ficam em lib/lancamentos.js;
 * aqui ficam a permissão, o recorte do alcance e a autoria.
 *
 * Na demonstração, grava nos dados completos (lib/demo). Fora dela, usa a
 * planilha no que ela suporta: atestado por doença, ocorrência e movimentação
 * (o que muda vai no motivo); o resto pede o banco novo.
 */

const SO_NA_DEMONSTRACAO = 'Este tipo de registro ainda não está disponível nesta conta.';

async function quemLanca(acao = 'lancar') {
  const alcance = await alcanceAtual();
  if (!pode(alcance?.perfil, acao)) {
    throw new AvisoAoUsuario(`Este acesso é só de consulta: ${acao === 'aprovar' ? 'aprovar' : 'lançar'} fica com a Gestão da empresa.`);
  }
  const lido = await lerRecorte();
  return { alcance, recorte: lido?.recorte || null, autor: alcance.sessao.nome || 'Gestão da empresa' };
}

function comAviso(funcao) {
  try {
    return funcao();
  } catch (erro) {
    if (erro instanceof ErroDeLancamento) throw new AvisoAoUsuario(erro.message);
    throw erro;
  }
}

function pessoaDoRecorte(recorte, matricula) {
  const pessoa = recorte.pessoas.find((item) => item.matricula === String(matricula || '').trim());
  if (!pessoa) throw new AvisoAoUsuario('Escolha uma pessoa do seu alcance.');
  return pessoa;
}

/** Fora da demonstração: a pessoa na planilha, no formato que as regras pedem. */
async function pessoaDaPlanilha(matricula) {
  const pessoa = await registros.buscarColaborador(String(matricula || '').trim());
  if (!pessoa) throw new AvisoAoUsuario('Escolha uma pessoa do seu alcance.');
  return { ...pessoa, id: pessoa.matricula, admissao: paraISO(pessoa.admissao), desligamento: null };
}

const resumo = (pessoa) => ({ nome: pessoa.nome, matricula: pessoa.matricula });

/* ---------------------------------------------------------------- gravação */

export async function lancarAfastamento(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    if (entrada.tipo !== 'Doença') throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarAfastamento(entrada, { pessoa }));
    await registros.registrarAtestado({
      matricula: pessoa.matricula,
      inicio: item.inicio,
      dias: item.dias,
      cid: item.atestado.cid === 'não informado' ? 'Não informado' : item.atestado.cid,
      anexo: item.atestado.anexo,
      status: item.validacao,
    });
    return { pessoa: resumo(pessoa), inss: null };
  }

  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() =>
    montarAfastamento(entrada, { pessoa, existentes: recorte.afastamentos.filter((registro) => registro.pessoa_id === pessoa.id) })
  );
  const cliente = recorte.cliente.id;
  demo.inserir('afastamentos', {
    ...item,
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: item.atestado ? demo.proximoCodigo('afastamentos', 'ATE', cliente) : null,
    validado_por: item.validacao === 'Aprovado' ? autor : null,
    validado_em: item.validacao === 'Aprovado' ? recorte.hoje : null,
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });

  // Depois de gravar, os prazos dizem se passou dos 15 dias (somando a mesma doença em 60 dias).
  const inss = listarPrazos(recortar(demo.dadosCompletos(), { cliente })).find(
    (prazo) => prazo.regra === 'inss' && prazo.pessoa?.matricula === pessoa.matricula
  );
  return { pessoa: resumo(pessoa), inss: inss ? { data: dataCurta(inss.data), detalhe: inss.detalhe } : null };
}

export async function registrarRetorno(id, entrada) {
  const { recorte } = await quemLanca();
  if (!recorte) throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
  const afastamento = recorte.afastamentos.find((item) => item.id === id);
  if (!afastamento) throw new AvisoAoUsuario('Este afastamento não está mais no seu alcance. Recarregue a página.');
  const campos = comAviso(() => montarRetorno(afastamento, entrada, { hoje: recorte.hoje }));
  demo.alterar('afastamentos', id, campos);
}

export async function lancarOcorrencia(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarOcorrencia(entrada, { pessoa, hoje: paraISO(new Date()) }));
    await registros.registrarOcorrencia({ matricula: pessoa.matricula, ...item });
    return { pessoa: resumo(pessoa) };
  }
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() => montarOcorrencia(entrada, { pessoa, hoje: recorte.hoje }));
  const cliente = recorte.cliente.id;
  demo.inserir('ocorrencias', {
    ...item,
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: demo.proximoCodigo('ocorrencias', 'OCO', cliente),
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  return { pessoa: resumo(pessoa) };
}

function resumoDoNovo(novo, cnpjs) {
  if (!novo) return '';
  return [
    novo.salario ? `novo salário de ${emReais(novo.salario)}` : null,
    novo.cargo ? `novo cargo: ${novo.cargo}` : null,
    novo.departamento ? `novo departamento: ${novo.departamento}` : null,
    novo.cnpj_id ? `nova unidade: ${cnpjs.find((item) => item.id === novo.cnpj_id)?.nome || novo.cnpj_id}` : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export async function lancarMovimentacao(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarMovimentacao({ ...entrada, novaUnidade: '' }, { pessoa }));
    const muda = resumoDoNovo(item.novo, []);
    await registros.registrarMovimentacao({
      matricula: pessoa.matricula,
      tipo: item.tipo,
      efetiva: item.efetiva,
      motivo: muda ? `${item.motivo} (${muda})` : item.motivo,
      checklist: 'Concluído',
    });
    return { pessoa: resumo(pessoa) };
  }
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() => montarMovimentacao(entrada, { pessoa, cnpjs: recorte.cnpjs }));
  const cliente = recorte.cliente.id;
  demo.inserir('movimentacoes', {
    ...item,
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: demo.proximoCodigo('movimentacoes', 'MOV', cliente),
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  return { pessoa: resumo(pessoa), passaAValer: item.efetiva > recorte.hoje ? dataCurta(item.efetiva) : null };
}

/**
 * Desligamento: a data, o tipo e o motivo ficam na pessoa, e a movimentação
 * de desligamento entra para concluir em Pendências (rescisão em 10 dias).
 */
export async function lancarDesligamento(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarDesligamento(entrada, { pessoa, hoje: paraISO(new Date()) }));
    await registros.registrarMovimentacao({
      matricula: pessoa.matricula,
      tipo: 'Desligamento',
      efetiva: item.data,
      motivo: `${item.tipo}. ${item.motivo}`,
      checklist: 'Pendente',
    });
    return { pessoa: resumo(pessoa) };
  }
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() => montarDesligamento(entrada, { pessoa, hoje: recorte.hoje }));
  const cliente = recorte.cliente.id;
  demo.alterar('pessoas', pessoa.id, { desligamento: { data: item.data, tipo: item.tipo, motivo: item.motivo } });
  demo.inserir('movimentacoes', {
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: demo.proximoCodigo('movimentacoes', 'MOV', cliente),
    tipo: 'Desligamento',
    efetiva: item.data,
    motivo: `${item.tipo}. ${item.motivo}`,
    checklist: 'Pendente',
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  return { pessoa: resumo(pessoa) };
}

/** Aprovar ou rejeitar o atestado na linha da lista. */
export async function validarAfastamento(id, acao) {
  const { recorte } = await quemLanca('aprovar');
  if (recorte) {
    await decidir('atestado', id, acao);
    return;
  }
  await registros.mudarStatusDoAtestadoPorCodigo(id, acao === 'aprovar' ? 'Aprovado' : 'Rejeitado');
}

/* ----------------------------------------------------------------- leitura */

function comPessoa(recorte) {
  const porId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  return (item) => {
    const pessoa = porId.get(item.pessoa_id);
    return { ...item, pessoa: pessoa ? { nome: pessoa.nome, matricula: pessoa.matricula } : null };
  };
}

/** Atestados e afastamentos do alcance; o CID só sai para quem pode vê-lo (LGPD). */
export async function listarAfastamentos() {
  const { recorte, verCid } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    itens: recorte.afastamentos
      .map(comPessoa(recorte))
      .map((item) => ({
        ...item,
        atestado: item.atestado ? { ...item.atestado, cid: verCid ? item.atestado.cid : null } : null,
        cidRestrito: Boolean(item.atestado) && !verCid,
      }))
      .sort((a, b) => (a.inicio < b.inicio ? 1 : a.inicio > b.inicio ? -1 : 0)),
  };
}

export async function listarOcorrencias() {
  const { recorte } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    itens: recorte.ocorrencias.map(comPessoa(recorte)).sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)),
  };
}

/** Movimentações do contrato: sem desligamento nem afastamento, que têm tela própria. */
export async function listarMovimentacoes() {
  const { recorte } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    cnpjs: recorte.cnpjs,
    itens: recorte.movimentacoes
      .filter((item) => !['Desligamento', 'Afastamento', 'Retorno de Afastamento'].includes(item.tipo))
      .map(comPessoa(recorte))
      .sort((a, b) => (a.efetiva < b.efetiva ? 1 : a.efetiva > b.efetiva ? -1 : 0)),
  };
}

/** O que os formulários do Lançar precisam: departamentos e unidades do alcance. */
export async function opcoesDoLancar() {
  const { recorte } = await lerBase();
  const departamentos = [...new Set(recorte.pessoas.map((pessoa) => pessoa.departamento).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  return { departamentos, cnpjs: recorte.cnpjs.map((item) => ({ id: item.id, nome: item.nome })) };
}
