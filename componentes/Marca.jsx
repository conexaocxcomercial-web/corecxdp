/**
 * O sorriso da marca, redesenhado em vetor para escalar sem borrar e
 * herdar a cor de onde estiver.
 */
export function Sorriso({ className = '' }) {
  return (
    <svg viewBox="0 0 120 84" aria-hidden="true" className={className}>
      <circle cx="17" cy="17" r="13" fill="none" stroke="currentColor" strokeWidth="9" />
      <path d="M17 8h12" stroke="currentColor" strokeWidth="9" strokeLinecap="butt" />
      <path
        d="M86 5 116 34M116 5 86 34"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="butt"
      />
      <path
        d="M6 42a56 56 0 0 0 108 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Marca do produto: core.cx, e o módulo em que a pessoa está. */
export function Marca({ tom = 'claro' }) {
  const corTexto = tom === 'claro' ? 'text-folha' : 'text-grafite';
  const corChip = tom === 'claro' ? 'bg-lima text-grafite' : 'bg-violeta text-folha';

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`marcante text-[18px] font-bold ${corTexto}`}>core.cx</span>
      <span className={`rounded-[3px] px-1.5 py-[3px] text-[10px] font-bold leading-none ${corChip}`}>
        dp
      </span>
    </span>
  );
}

/** Assinatura da casa, no pé da navegação. */
export function AssinaturaCX({ tom = 'claro', className = '' }) {
  const arquivo =
    tom === 'claro'
      ? '/marca/cx-rh-estrategico-branco.png'
      : '/marca/cx-rh-estrategico-preto.png';

  return (
    <img
      src={arquivo}
      alt="cx RH Estratégico"
      width={1709}
      height={372}
      className={className}
    />
  );
}
