import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export const NOME_DO_COOKIE = 'core_cx_sessao';
const DURACAO = 60 * 60 * 10; // 10 horas: cobre um turno de trabalho.

export function segredo() {
  const chave = process.env.AUTH_SECRET;
  if (!chave) {
    throw new Error('Defina AUTH_SECRET nas variáveis de ambiente.');
  }
  return new TextEncoder().encode(chave);
}

export async function abrirSessao(usuario) {
  const token = await new SignJWT({
    nome: usuario.nome,
    email: usuario.email,
    cliente: usuario.cliente,
    empresa: usuario.empresa,
    perfil: usuario.perfil,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO}s`)
    .sign(segredo());

  const pote = await cookies();
  pote.set(NOME_DO_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO,
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
    if (!payload.cliente) return null;
    return {
      nome: payload.nome,
      email: payload.email,
      cliente: payload.cliente,
      empresa: payload.empresa || payload.cliente,
      perfil: payload.perfil || 'Operador',
    };
  } catch {
    return null;
  }
}
