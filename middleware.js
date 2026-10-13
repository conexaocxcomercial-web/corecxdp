import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const NOME_DO_COOKIE = 'core_cx_sessao';

async function sessaoValida(token) {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(requisicao) {
  const caminho = requisicao.nextUrl.pathname;
  const valida = await sessaoValida(requisicao.cookies.get(NOME_DO_COOKIE)?.value);

  if (caminho === '/entrar') {
    return valida ? NextResponse.redirect(new URL('/', requisicao.url)) : NextResponse.next();
  }

  if (!valida) {
    const destino = new URL('/entrar', requisicao.url);
    if (caminho !== '/') destino.searchParams.set('de', caminho);
    return NextResponse.redirect(destino);
  }

  // O layout das telas internas precisa saber a rota (para pedir um
  // cliente no alcance quando a tela é de um cliente).
  const cabecalhos = new Headers(requisicao.headers);
  cabecalhos.set('x-caminho', caminho);
  return NextResponse.next({ request: { headers: cabecalhos } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|marca).*)'],
};
