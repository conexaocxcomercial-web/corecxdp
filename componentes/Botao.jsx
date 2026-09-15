'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const ESTILOS = {
  principal: 'bg-acao text-acao-texto hover:bg-acao-hover disabled:opacity-55',
  secundario: 'border border-borda bg-superficie text-texto hover:border-borda-forte',
  discreto: 'text-texto-2 hover:text-acao underline-offset-4 hover:underline',
};

const BASE =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-bold transition-colors disabled:cursor-not-allowed';

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
    <button type="submit" disabled={pending} className={`${BASE} ${ESTILOS[variante]} ${className}`}>
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
      className={`h-8 rounded-lg border border-borda bg-superficie px-3 text-[12px] font-medium text-texto-2 transition-colors hover:border-borda-forte hover:text-texto disabled:opacity-50 ${className}`}
      {...props}
    >
      {pending ? '…' : children}
    </button>
  );
}
