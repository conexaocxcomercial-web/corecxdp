'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const ESTILOS = {
  principal:
    'bg-carimbo text-folha hover:bg-carimbo-escuro disabled:bg-carimbo/50',
  secundario:
    'bg-folha text-tinta border border-[#C7D0D9] hover:border-tinta hover:bg-papel/60',
  discreto: 'text-tinta-70 hover:text-carimbo underline-offset-4 hover:underline',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 h-10 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed';

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
      className={`h-7 rounded-[5px] border border-[#C7D0D9] bg-folha px-2.5 text-[12px] font-medium text-tinta-70 transition-colors hover:border-carimbo hover:text-carimbo disabled:opacity-50 ${className}`}
      {...props}
    >
      {pending ? '…' : children}
    </button>
  );
}
