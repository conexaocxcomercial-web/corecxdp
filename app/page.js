import { redirect } from 'next/navigation';
import { alcanceAtual } from '@/lib/dados/alcance';
import { inicioDoPerfil } from '@/lib/navegacao';

export default async function Inicio() {
  const alcance = await alcanceAtual();
  redirect(alcance ? inicioDoPerfil(alcance.perfil, { demonstracao: alcance.demonstracao }) : '/entrar');
}
