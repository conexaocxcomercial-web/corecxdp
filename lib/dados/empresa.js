import * as demo from '@/lib/demo/fonte';
import { lerRecorte } from '@/lib/dados/recorte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerBase } from '@/lib/dados/pessoas';
import { listarUsuarios } from '@/lib/dados/usuarios';
import { AvisoAoUsuario } from '@/lib/avisos';
import { PERFIS, pode } from '@/lib/permissoes';
import { ErroDaEmpresa, montarDadosDaEmpresa } from '@/lib/empresa';
import { encargosDaEmpresa, explicacaoDaEstimativa } from '@/lib/folha';
import { historicoDaEmpresa } from '@/lib/historico';
import { registrosDaImportacao } from '@/lib/importacao';
import { conferirPlanilha } from '@/lib/planilhaModelo';
import { emRevisao } from '@/lib/prazos';
import { lerXlsx } from '@/lib/xlsx';

/**
 * Repositório de Empresa (fase 14 do redesenho): dados da empresa (regime,
 * anexo, percentual de encargos), unidades, departamentos, usuários,
 * importação da planilha modelo e histórico de ações. Mudanças só pela
 * Gestão da empresa e só na demonstração.
 */

const SO_NA_DEMONSTRACAO = 'Esta parte ainda não está disponível nesta conta.';
const LIMITE_DO_ARQUIVO = 900 * 1024;

async function quemMuda() {
  const alcance = await alcanceAtual();
  if (!pode(alcance?.perfil, 'lancar')) throw new AvisoAoUsuario('Este acesso é só de consulta: os dados da empresa ficam com a Gestão.');
  const lido = await lerRecorte();
  if (!lido) throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
  return { recorte: lido.recorte, autor: alcance.sessao.nome || 'Gestão da empresa' };
}

function comAviso(funcao) {
  try {
    return funcao();
  } catch (erro) {
    if (erro instanceof ErroDaEmpresa) throw new AvisoAoUsuario(erro.message);
    throw erro;
  }
}

function anotar(cliente, texto, autor, hoje) {
  const historico = [...(cliente.historico || []), { id: `${cliente.id}-h${(cliente.historico || []).length + 1}`, texto, autor, em: hoje }];
  demo.alterar('clientes', cliente.id, { historico });
}

export async function lerEmpresa() {
  const { recorte } = await lerBase();
  const cliente = recorte.cliente;
  const ativas = recorte.pessoas.filter((pessoa) => !pessoa.desligamento || pessoa.desligamento.data >= recorte.hoje);
  const conta = (filtro) => ativas.filter(filtro).length;
  const departamentos = [...new Set(ativas.map((pessoa) => pessoa.departamento).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((nome) => ({ nome, pessoas: conta((pessoa) => pessoa.departamento === nome) }));
  const encargos = encargosDaEmpresa(cliente);
  return {
    completo: recorte.completo,
    cliente: cliente
      ? {
          nome: cliente.nome,
          regime: cliente.regime_tributario || null,
          anexo: cliente.anexo_simples || null,
          percentual: cliente.percentual_encargos ?? null,
          implantacao: cliente.implantacao || null,
          emRevisao: emRevisao(cliente),
        }
      : null,
    encargos,
    estimativa: explicacaoDaEstimativa(encargos),
    unidades: recorte.cnpjs.map((cnpj) => ({ ...cnpj, pessoas: conta((pessoa) => pessoa.cnpj_id === cnpj.id) })),
    departamentos,
  };
}

export async function salvarDadosDaEmpresa(entrada) {
  const { recorte, autor } = await quemMuda();
  const campos = comAviso(() => montarDadosDaEmpresa(entrada));
  const antes = encargosDaEmpresa(recorte.cliente);
  demo.alterar('clientes', recorte.cliente.id, campos);
  const depois = encargosDaEmpresa({ ...recorte.cliente, ...campos });
  const percentual = (valor) => `${String(Math.round(valor * 1000) / 10).replace('.', ',')}%`;
  anotar(
    recorte.cliente,
    `mudou o regime para ${campos.regime_tributario}${campos.anexo_simples ? `, anexo ${campos.anexo_simples}` : ''}; encargos de ${percentual(antes.percentual)} para ${percentual(depois.percentual)}`,
    autor,
    recorte.hoje
  );
  return { percentual: percentual(depois.percentual), aviso: depois.aviso || null };
}

export async function listarUsuariosDaEmpresa() {
  const { recorte } = await lerBase();
  const codigo = String(recorte.cliente?.codigo || '').toLowerCase();
  const usuarios = await listarUsuarios();
  return {
    completo: recorte.completo,
    usuarios: usuarios
      .filter((usuario) => usuario.cliente.toLowerCase() === codigo && usuario.perfil === 'gestao')
      .map((usuario) => ({ ...usuario, perfilNome: PERFIS[usuario.perfil] || usuario.perfil }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  };
}

export async function lerHistorico() {
  const { recorte } = await lerBase();
  return { completo: recorte.completo, itens: historicoDaEmpresa(recorte) };
}

/* ------------------------------------------------------------ importação */

async function lerArquivo(arquivo) {
  if (!arquivo || typeof arquivo.arrayBuffer !== 'function' || !arquivo.size) throw new AvisoAoUsuario('Escolha a planilha preenchida (.xlsx).');
  if (arquivo.size > LIMITE_DO_ARQUIVO) throw new AvisoAoUsuario('A planilha passa de 900 KB. Divida em duas ou tire as linhas vazias.');
  if (!/\.xlsx$/i.test(arquivo.name || '')) throw new AvisoAoUsuario('Suba a planilha no formato .xlsx (no Excel: Salvar como › Pasta de Trabalho do Excel).');
  try {
    return lerXlsx(new Uint8Array(await arquivo.arrayBuffer()));
  } catch {
    throw new AvisoAoUsuario('Não deu para ler este arquivo como planilha .xlsx. Salve de novo no Excel e suba outra vez.');
  }
}

function contextoDa(recorte) {
  const doCliente = demo.dadosCompletos().pessoas.filter((pessoa) => pessoa.cliente_id === recorte.cliente.id);
  return { hoje: recorte.hoje, cnpjs: recorte.cnpjs, pessoas: doCliente };
}

/** Confere a planilha e devolve os erros por linha e o resumo (nada é gravado). */
export async function conferirArquivo(arquivo) {
  const { recorte } = await quemMuda();
  const lida = await lerArquivo(arquivo);
  const conferida = conferirPlanilha(lida, contextoDa(recorte));
  return { erros: conferida.erros, avisos: conferida.avisos, resumo: conferida.resumo, jaCadastradas: conferida.dados.jaCadastradas };
}

/** Importa a planilha se ela estiver sem erros: grava tudo de uma vez, em nome da importação. */
export async function importarArquivo(arquivo) {
  const { recorte, autor } = await quemMuda();
  const lida = await lerArquivo(arquivo);
  const contexto = contextoDa(recorte);
  const conferida = conferirPlanilha(lida, contexto);
  if (conferida.erros.length) throw new AvisoAoUsuario(`A planilha ainda tem ${conferida.erros.length} ${conferida.erros.length === 1 ? 'erro' : 'erros'}: corrija e confira de novo.`);
  const cliente = recorte.cliente.id;
  const registros = registrosDaImportacao(conferida.dados, {
    cliente,
    cnpjs: recorte.cnpjs,
    pessoas: contexto.pessoas,
    beneficios: recorte.beneficios,
    hoje: recorte.hoje,
  });
  if (registros.cliente) demo.alterar('clientes', cliente, registros.cliente);
  for (const item of registros.cnpjs) demo.inserir('cnpjs', item);
  for (const item of registros.pessoas) demo.inserir('pessoas', item);
  for (const item of registros.movimentacoes) demo.inserir('movimentacoes', { ...item, codigo: demo.proximoCodigo('movimentacoes', 'MOV', cliente) });
  for (const item of registros.ferias) demo.inserir('ferias', item);
  for (const item of registros.afastamentos) demo.inserir('afastamentos', { ...item, codigo: demo.proximoCodigo('afastamentos', 'ATE', cliente) });
  for (const item of registros.beneficios) demo.inserir('beneficios', item);
  for (const item of registros.adesoes) demo.inserir('adesoes', item);
  const r = conferida.resumo;
  anotar(recorte.cliente, `importou a planilha modelo: ${r.ativos} no quadro, ${r.exColaboradores} ex-colaboradores, ${r.ferias} férias, ${r.atestados} atestados`, autor, recorte.hoje);
  return { resumo: conferida.resumo };
}
