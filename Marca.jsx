/** Marca do produto: core.cx, e o módulo em que a pessoa está. */
export function Marca({ tamanho = 'normal' }) {
  const texto = tamanho === 'pequeno' ? 'text-[16px]' : 'text-[18px]';

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`marcante font-bold text-texto ${texto}`}>core.cx</span>
      <span className="rounded-md bg-marca px-1.5 py-[3px] text-[10px] font-bold leading-none text-white">
        dp
      </span>
    </span>
  );
}

/** Assinatura da casa. Cada tema mostra a versão que enxerga melhor. */
export function AssinaturaCX({ className = 'h-[20px] w-auto' }) {
  return (
    <>
      <img
        src="/marca/cx-rh-estrategico-preto.png"
        alt="cx RH Estratégico"
        width={1709}
        height={372}
        className={`so-no-claro ${className}`}
      />
      <img
        src="/marca/cx-rh-estrategico-branco.png"
        alt="cx RH Estratégico"
        width={1709}
        height={372}
        className={`so-no-escuro ${className}`}
      />
    </>
  );
}
