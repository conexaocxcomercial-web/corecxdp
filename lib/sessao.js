import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { normalizarPerfil } from '@/lib/permissoes';

export const NOME_DO_COOKIE = 'core_cx_sessao';
const DURACAO = 60 * 60 * 10; // 10 horas: cobre um turno de trabalho.
const DURACAO_LONGA = 60 * 60 * 24 * 7; // 7 dias, quando a pessoa marca "Manter conectado".

export function segredo() {
  const chave = process.env.AUTH_SECRET;
  if (!chave) {
    throw new Error('Defina AUTH_SECRET nas variáveis de ambiente.');
  }
  return new TextEncoder().encode(chave);
}

export async function abrirSessao(usuario, { manterConectado = false } = {}) {
  const duracao = manterConectado ? DURACAO_LONGA : DURACAO;
  const token = await new SignJWT({
    nome: usuario.nome,
    email: usuario.email,
    cliente: usuario.cliente,
    parceiro: usuario.parceiro || '',
    empresa: usuario.empresa,
    perfil: usuario.perfil,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${duracao}s`)
    .sign(segredo());

  const pote = await cookies();
  pote.set(NOME_DO_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: duracao,
  });
}

export async function fecharSessao() {
  const pote = await cookies();
  pote.delete(NOME_DO_COOKIE);
}

export async function usuarioDaSessao() {
  const pote = await cookies();
  const token = pote.get(NOME_DO_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, segredo());
    const perfil = normalizarPerfil(payload.perfil, payload.cliente);
    if (perfil === 'parceiro' ? !payload.parceiro : !payload.cliente) return null;
    return {
      nome: payload.nome,
      email: payload.email,
      cliente: payload.cliente || '',
      parceiro: payload.parceiro || '',
      empresa: payload.empresa || payload.cliente || payload.parceiro,
      perfil,
    };
  } catch {
    return null;
  }
}
