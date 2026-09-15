const BASE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Moldura({ children, className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...BASE}>
      {children}
    </svg>
  );
}

export function IconePainel(props) {
  return (
    <Moldura {...props}>
      <rect x="3" y="3" width="7.5" height="8.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="2" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="2" />
    </Moldura>
  );
}

export function IconeIndicadores(props) {
  return (
    <Moldura {...props}>
      <path d="M3 21h18" />
      <path d="M6.5 21v-6" />
      <path d="M12 21V7" />
      <path d="M17.5 21v-9" />
    </Moldura>
  );
}

export function IconePessoas(props) {
  return (
    <Moldura {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20c0-3.2 2.7-5.4 6-5.4s6 2.2 6 5.4" />
      <path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.4" />
      <path d="M18 14.9c1.7.7 2.9 2.2 2.9 4.1" />
    </Moldura>
  );
}

export function IconeOcorrencias(props) {
  return (
    <Moldura {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.6v5" />
      <path d="M12 16.2h.01" />
    </Moldura>
  );
}

export function IconeAtestados(props) {
  return (
    <Moldura {...props}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M12 11v5" />
      <path d="M9.5 13.5h5" />
    </Moldura>
  );
}

export function IconeMovimentacoes(props) {
  return (
    <Moldura {...props}>
      <path d="M4 8h13" />
      <path d="M13.5 4.5 17 8l-3.5 3.5" />
      <path d="M20 16H7" />
      <path d="M10.5 12.5 7 16l3.5 3.5" />
    </Moldura>
  );
}

export function IconeSol(props) {
  return (
    <Moldura {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" />
    </Moldura>
  );
}

export function IconeLua(props) {
  return (
    <Moldura {...props}>
      <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
    </Moldura>
  );
}

export function IconeMais(props) {
  return (
    <Moldura {...props}>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Moldura>
  );
}

export function IconeSeta(props) {
  return (
    <Moldura {...props}>
      <path d="M5 12h13" />
      <path d="m13 6.5 5.5 5.5-5.5 5.5" />
    </Moldura>
  );
}

export function IconeFechar(props) {
  return (
    <Moldura {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Moldura>
  );
}

export function IconeBusca(props) {
  return (
    <Moldura {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 3.6 3.6" />
    </Moldura>
  );
}

export function IconeSoma(props) {
  return (
    <Moldura {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Moldura>
  );
}
