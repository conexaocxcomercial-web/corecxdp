'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const ESTILOS = {
  principal:
    'bg-violeta-forte text-folha hover:bg-[#3A38C4] disabled:bg-violeta/50',
  secundario:
    'bg-folha text-grafite border border-[#C7D0D9] hover:border-grafite hover:bg-papel/60',
  discreto: 'text-grafite-60 hover:text-violeta-forte underline-offset-4 hover:underline',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 h-10 text-[13px] font-bold transition-colors disabled:cursor-not-allowed';

export function Botao({ variante = 'principal', className = '', ...props }) {
  const estilo = variante === 'discreto' ? '' : BASE;
  return <button className={`${estilo} ${ESTILOS[variante]} ${className}`} {...props} />;
}

export function BotaoLink({ variante = 'principal', className = '', ...props }) {
  const estilo = variante === 'discreto' ? '' : BASE;
  return <Link className={`${estilo} ${ESTILOS[variante]} ${className}`} {...props} />;
}

export function BotaoEnviar({ children, enviando, variante = 'principal', className = '' }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${BASE} ${ESTILOS[variante]} ${className}`}
    >
      {pending ? enviando || 'Salvando…' : children}
    </button>
  );
}

export function BotaoCompacto({ children, className = '', ...props }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-7 rounded-[5px] border border-[#C7D0D9] bg-folha px-2.5 text-[12px] font-medium text-grafite-60 transition-colors hover:border-violeta hover:text-violeta-forte disabled:opacity-50 ${className}`}
      {...props}
    >
      {pending ? '…' : children}
    </button>
  );
}
