'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Icone } from '@/componentes/Icones';

export function Botao({ variante = 'acao', icone, children, className = '', ...props }) {
  return (
    <button className={`btn btn-${variante} ${className}`} {...props}>
      {icone ? <Icone nome={icone} /> : null}
      {children}
    </button>
  );
}

export function BotaoLink({ variante = 'acao', icone, children, className = '', ...props }) {
  return (
    <Link className={`btn btn-${variante} ${className}`} {...props}>
      {icone ? <Icone nome={icone} /> : null}
      {children}
    </Link>
  );
}

export function BotaoEnviar({ children, enviando, icone = 'check', className = '' }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`btn btn-acao ${className}`}>
      <Icone nome={pending ? 'hourglass_empty' : icone} />
      {pending ? enviando || 'Salvando…' : children}
    </button>
  );
}

export function BotaoMini({ children, className = '', ...props }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn btn-fant btn-mini ${className}`}
      {...props}
    >
      {pending ? '…' : children}
    </button>
  );
}
