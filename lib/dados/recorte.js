import { cache } from 'react';
import * as demo from '@/lib/demo/fonte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { recortar } from '@/lib/prazos';

/**
 * O recorte do alcance atual nos dados completos (cliente e, quando há,
 * CNPJ), para os repositórios dos módulos novos. Null fora da demonstração
 * e sem cliente no alcance. No Supabase, vira o filtro das consultas (RLS).
 */
export const lerRecorte = cache(async () => {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !alcance.cliente) return null;
  return {
    alcance,
    recorte: recortar(demo.dadosCompletos(), { cliente: alcance.cliente.id, cnpj: alcance.cnpj?.id || null }),
  };
});
