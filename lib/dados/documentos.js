import { lerBase } from '@/lib/dados/pessoas';
import { resumoDosDocumentos } from '@/lib/documentos';

/**
 * Repositório de Documentos (fase 14 do redesenho): os documentos de quem
 * está no quadro, a situação pela validade e a completude dos cadastros.
 * O registro de documento novo é pelo Lançar (lib/dados/lancamentos.js).
 */
export async function listarDocumentos() {
  const { recorte } = await lerBase();
  return { completo: recorte.completo, hoje: recorte.hoje, ...resumoDosDocumentos(recorte) };
}
