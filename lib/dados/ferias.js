import { lerBase } from '@/lib/dados/pessoas';
import { resumoDasFerias } from '@/lib/ferias';
import { listarAprovacoes } from '@/lib/prazos';

/**
 * Repositório da tela de Férias (fase 11 do redesenho): vencidas, vencendo,
 * programadas, saldo por pessoa e os pedidos esperando a Gestão (os mesmos
 * de Pendências). Fora da demonstração, a planilha não tem férias.
 */
export async function listarFerias() {
  const { recorte } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    ...resumoDasFerias(recorte),
    aprovacoes: recorte.completo ? listarAprovacoes(recorte).filter((item) => item.tipo === 'ferias') : [],
  };
}
