import { cache } from 'react';
import * as demo from '@/lib/demo/fonte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { AvisoAoUsuario } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import {
  contarEsperando,
  emRevisao,
  listarAprovacoes,
  listarPrazos,
  listarRevisao,
  listarUrgentes,
  recortar,
} from '@/lib/prazos';

/**
 * Repositório de Pendências (fase 5 do redesenho): aprovações, prazos e
 * revisão da implantação no recorte do alcance, e as decisões da Gestão
 * (aprovar, rejeitar, concluir, desfazer, conferir). As regras ficam em
 * lib/prazos.js; aqui ficam o recorte, a permissão e a autoria.
 *
 * Módulo novo: só existe na demonstração (lê e grava os dados completos de
 * lib/demo). No Supabase, cada decisão vira uma atualização com RLS.
 */

/** O recorte do alcance atual, ou null fora da demonstração e sem cliente no alcance. */
export const lerRecorte = cache(async () => {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !alcance.cliente) return null;
  return {
    alcance,
    recorte: recortar(demo.dadosCompletos(), { cliente: alcance.cliente.id, cnpj: alcance.cnpj?.id || null }),
  };
});

export const lerPendencias = cache(async () => {
  const lido = await lerRecorte();
  if (!lido) return null;
  const { recorte } = lido;
  const aprovacoes = listarAprovacoes(recorte);
  const prazos = listarPrazos(recorte);
  return {
    hoje: recorte.hoje,
    cliente: recorte.cliente,
    emRevisao: emRevisao(recorte.cliente),
    aprovacoes,
    prazos,
    revisao: listarRevisao(recorte, prazos),
    urgentes: listarUrgentes(aprovacoes, prazos),
    esperando: contarEsperando(aprovacoes, prazos),
    recorte,
  };
});

/** O número do Início na barra inferior: o que está esperando você. */
export async function contarEsperandoVoce() {
  const pendencias = await lerPendencias();
  return pendencias ? pendencias.esperando : 0;
}

/* ---------------------------------------------------------------- escrita */

async function quemDecide() {
  const lido = await lerRecorte();
  if (!lido) throw new AvisoAoUsuario('Escolha um cliente no alcance para decidir as pendências.');
  if (!pode(lido.alcance.perfil, 'aprovar')) {
    throw new AvisoAoUsuario('Este acesso é só de consulta: aprovar fica com a Gestão da empresa.');
  }
  return { ...lido, autor: lido.alcance.sessao.nome || 'Gestão da empresa' };
}

/** O item tem de estar no recorte de quem decide (cliente e, quando há, CNPJ). */
function doRecorte(recorte, colecao, id) {
  const item = recorte[colecao].find((registro) => registro.id === id);
  if (!item) throw new AvisoAoUsuario('Esta pendência não está mais no seu alcance. Recarregue a página.');
  return item;
}

const COLECOES = { atestado: 'afastamentos', ferias: 'ferias', desligamento: 'movimentacoes' };

/** Os campos que cada decisão muda (o estado anterior fica guardado para o Desfazer). */
function mudanca(tipo, item, acao, autor, hoje) {
  if (tipo === 'atestado' && item.atestado && item.validacao === 'Pendente' && ['aprovar', 'rejeitar'].includes(acao)) {
    return {
      antes: { validacao: item.validacao, validado_por: item.validado_por, validado_em: item.validado_em },
      depois: { validacao: acao === 'aprovar' ? 'Aprovado' : 'Rejeitado', validado_por: autor, validado_em: hoje },
    };
  }
  if (tipo === 'ferias' && item.situacao === 'aguardando aprovação' && ['aprovar', 'rejeitar'].includes(acao)) {
    // Recusado, o período volta a "a programar": as férias continuam por tirar.
    return {
      antes: { situacao: item.situacao, inicio: item.inicio, aprovado_por: item.aprovado_por, recusado_por: null, recusado_em: null },
      depois:
        acao === 'aprovar'
          ? { situacao: 'programada', aprovado_por: autor }
          : { situacao: 'a programar', inicio: null, recusado_por: autor, recusado_em: hoje },
    };
  }
  if (tipo === 'desligamento' && item.tipo === 'Desligamento' && item.checklist !== 'Concluído' && acao === 'concluir') {
    return {
      antes: { checklist: item.checklist, concluido_por: item.concluido_por ?? null, concluido_em: item.concluido_em ?? null },
      depois: { checklist: 'Concluído', concluido_por: autor, concluido_em: hoje },
    };
  }
  throw new AvisoAoUsuario('Esta pendência já foi decidida. Recarregue a página para ver como está.');
}

/** Aprovar, rejeitar (atestado, férias) ou concluir (desligamento). */
export async function decidir(tipo, id, acao) {
  const colecao = COLECOES[tipo];
  if (!colecao) throw new AvisoAoUsuario('Tipo de pendência desconhecido.');
  const { recorte, autor } = await quemDecide();
  const item = doRecorte(recorte, colecao, id);
  const { antes, depois } = mudanca(tipo, item, acao, autor, recorte.hoje);
  demo.alterar(colecao, id, { ...depois, desfazer_para: antes });
}

/** Desfaz a última decisão do item, enquanto ninguém mudou de novo. */
export async function desfazer(tipo, id) {
  const colecao = COLECOES[tipo];
  if (!colecao) throw new AvisoAoUsuario('Tipo de pendência desconhecido.');
  const { recorte } = await quemDecide();
  const item = doRecorte(recorte, colecao, id);
  if (!item.desfazer_para) throw new AvisoAoUsuario('Não há o que desfazer nesta pendência.');
  demo.alterar(colecao, id, { ...item.desfazer_para, desfazer_para: null });
}

/** Marca (ou desmarca) um item da revisão da implantação como conferido. */
export async function conferir(idDoItem, conferido) {
  const { recorte } = await quemDecide();
  const cliente = recorte.cliente;
  if (!emRevisao(cliente)) throw new AvisoAoUsuario('A revisão da implantação já foi concluída.');
  const itens = listarRevisao(recorte, listarPrazos(recorte));
  if (!itens.some((item) => item.id === idDoItem)) throw new AvisoAoUsuario('Este item não está mais na revisão.');
  const atuais = new Set(cliente.revisao?.conferidos || []);
  if (conferido) atuais.add(idDoItem);
  else atuais.delete(idDoItem);
  demo.alterar('clientes', cliente.id, { revisao: { ...cliente.revisao, conferidos: [...atuais] } });
}

/** Conclui a revisão: a partir daqui, os alertas de prazo começam para tudo. */
export async function concluirRevisao() {
  const { recorte, autor } = await quemDecide();
  const cliente = recorte.cliente;
  if (!emRevisao(cliente)) throw new AvisoAoUsuario('A revisão da implantação já foi concluída.');
  const faltam = listarRevisao(recorte, listarPrazos(recorte)).filter((item) => !item.conferido).length;
  if (faltam > 0) {
    throw new AvisoAoUsuario(`Ainda ${faltam === 1 ? 'falta conferir 1 item' : `faltam conferir ${faltam} itens`} da revisão.`);
  }
  demo.alterar('clientes', cliente.id, {
    revisao: { ...cliente.revisao, concluida_em: recorte.hoje, concluida_por: autor },
  });
}
