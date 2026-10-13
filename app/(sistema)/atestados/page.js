import { redirect } from 'next/navigation';

/** Atestados virou Atestados e afastamentos (fase 8 do redesenho): o endereço antigo leva ao novo. */
export default async function Atestados({ searchParams }) {
  const parametros = new URLSearchParams();
  const antigos = await searchParams;
  if (antigos?.status) parametros.set('validacao', antigos.status);
  if (antigos?.busca) parametros.set('busca', antigos.busca);
  const consulta = parametros.toString();
  redirect(consulta ? `/afastamentos?${consulta}` : '/afastamentos');
}
