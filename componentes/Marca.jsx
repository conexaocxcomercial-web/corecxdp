export function Marca({ tom = 'claro' }) {
  const corTexto = tom === 'claro' ? 'text-folha' : 'text-tinta';

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`expandido text-[17px] font-semibold tracking-tight ${corTexto}`}>
        core.cx
      </span>
      <span className="rounded-[3px] bg-carimbo px-1.5 py-[3px] text-[10px] font-semibold leading-none text-folha">
        dp
      </span>
    </span>
  );
}

export function Carimbo({ pressionado = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={`transition-transform duration-300 ease-out ${
        pressionado ? 'scale-[0.93] -rotate-3' : ''
      } ${className}`}
    >
      <defs>
        <path
          id="anel-do-carimbo"
          fill="none"
          d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"
        />
      </defs>

      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="1" />

      <text fill="currentColor" fontSize="8.4" fontWeight="600" letterSpacing="2.6">
        <textPath href="#anel-do-carimbo" startOffset="50%" textAnchor="middle">
          DEPARTAMENTO PESSOAL · CORE.CX ·
        </textPath>
      </text>

      <text
        x="60"
        y="57"
        textAnchor="middle"
        fill="currentColor"
        fontSize="19"
        fontWeight="700"
        letterSpacing="1"
      >
        DP
      </text>

      <line x1="44" y1="64" x2="76" y2="64" stroke="currentColor" strokeWidth="1.4" />

      <text
        x="60"
        y="77"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7.4"
        fontWeight="600"
        letterSpacing="1.8"
      >
        REGISTRO
      </text>
    </svg>
  );
}
