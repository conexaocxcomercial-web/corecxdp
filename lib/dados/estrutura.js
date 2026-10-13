import { cache } from 'react';
import * as demo from '@/lib/demo/fonte';
import { usuarioDaSessao } from '@/lib/sessao';

/**
 * Repositório da estrutura: parceiros → clientes → CNPJs. Na demonstração
 * vem de lib/demo; fora dela (Google Sheets, provisório) não existe
 * estrutura guardada, e o único cliente é o da sessão, como sempre foi.
 * No Supabase vira as tabelas parceiros, clientes e cnpjs com RLS.
 */

export function emDemonstracao() {
  return demo.modoDemo();
}

export const lerEstrutura = cache(async () => {
  if (emDemonstracao()) return demo.estrutura();

  const sessao = await usuarioDaSessao();
  const codigo = sessao?.cliente || '';
  return {
    parceiros: [],
    clientes: codigo ? [{ id: codigo, parceiro_id: null, codigo, nome: sessao.empresa || codigo }] : [],
    cnpjs: [],
  };
});
