import { lerAba } from '@/lib/planilha';
import { ABA_USUARIOS } from '@/lib/usuarios';
import { normalizarPerfil } from '@/lib/permissoes';

/**
 * Repositório de usuários (sem senha). Hoje lê a mesma aba do login; no
 * Supabase vira a tabela usuarios ligada ao Supabase Auth, com
 * parceiro_id ou cliente_id conforme o perfil.
 */

function texto(valor) {
  return String(valor ?? '').trim();
}

export async function listarUsuarios() {
  const { registros } = await lerAba(ABA_USUARIOS);

  return registros
    .filter((linha) => texto(linha.Email))
    .map((linha) => {
      const cliente = texto(linha.Cliente);
      const ativo = texto(linha.Ativo).toLowerCase();
      return {
        email: texto(linha.Email).toLowerCase(),
        nome: texto(linha.Nome) || texto(linha.Email),
        perfil: normalizarPerfil(linha.Perfil, cliente),
        cliente,
        parceiro: texto(linha.Parceiro),
        empresa: texto(linha.Empresa),
        ativo: !['não', 'nao', 'false', '0'].includes(ativo),
      };
    });
}

/** Na demonstração, o primeiro usuário ativo de cada perfil ("Ver como…"). */
export async function usuarioDeExemplo(perfil) {
  const usuarios = (await listarUsuarios()).filter((usuario) => usuario.ativo && usuario.perfil === perfil);
  return usuarios.find((usuario) => usuario.email.startsWith(`${perfil}@`)) || usuarios[0] || null;
}
