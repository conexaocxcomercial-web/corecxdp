import Link from 'next/link';

/* ------------------------------------------------------------- superfícies */

export function Cartao({ children, className = '' }) {
  return (
    <section className={`rounded-folha border border-borda bg-superficie ${className}`}>
      {children}
    </section>
  );
}

export function CabecalhoDeCartao({ children, apoio, acao }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borda px-4 py-3.5 sm:px-5">
      <div>
        <h2 className="marcante text-[15px] font-bold leading-tight">{children}</h2>
        {apoio ? <p className="mt-1 text-[12.5px] text-texto-3">{apoio}</p> : null}
      </div>
      {acao}
    </header>
  );
}

export function TituloDaPagina({ titulo, apoio, acao }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
      <div>
        <h1 className="marcante text-[24px] font-bold leading-tight sm:text-[30px]">{titulo}</h1>
        {apoio ? (
          <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-texto-2 sm:text-[14px]">
            {apoio}
          </p>
        ) : null}
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </header>
  );
}

/* --------------------------------------------------------------- métricas */

export function Metricas({ children }) {
  return <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

export function Metrica({ rotulo, valor, unidade, apoio, cor, href, grafico }) {
  const conteudo = (
    <>
      <div className="flex items-center gap-2">
        {cor ? (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: cor }}
          />
        ) : null}
        <p className="text-[12px] font-medium text-texto-2">{rotulo}</p>
      </div>
      <p className="numero marcante mt-2.5 text-[28px] font-bold leading-none sm:text-[32px]">
        {valor}
        {unidade ? <span className="ml-0.5 text-[17px] font-bold">{unidade}</span> : null}
      </p>
      {apoio ? <p className="mt-2 text-[12px] leading-snug text-texto-3">{apoio}</p> : null}
      {grafico}
    </>
  );

  const estilo = 'rounded-folha border border-borda bg-superficie p-4 transition-colors sm:p-[18px]';

  if (href) {
    return (
      <Link href={href} className={`${estilo} block hover:border-borda-forte`}>
        {conteudo}
      </Link>
    );
  }

  return <div className={estilo}>{conteudo}</div>;
}

/* ---------------------------------------------------------------- tabelas */

/** Tabela é para telas largas; no celular cada registro vira cartão. */
export function Tabela({ colunas, children }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-campo">
        <thead>
          <tr className="border-b border-borda">
            {colunas.map((coluna) => (
              <th
                key={coluna}
                scope="col"
                className="whitespace-nowrap px-5 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-wide text-texto-3"
              >
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Linha({ children }) {
  return (
    <tr className="border-b border-borda/70 transition-colors last:border-b-0 hover:bg-superficie-2">
      {children}
    </tr>
  );
}

export function Celula({ children, className = '', ...props }) {
  return (
    <td className={`px-5 py-3.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export function Codigo({ children }) {
  return <span className="codigo text-[12.5px] text-texto-2">{children}</span>;
}

export function Nome({ href, children }) {
  return (
    <Link
      href={href}
      className="font-bold text-texto underline-offset-4 transition-colors hover:text-acao hover:underline"
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------ cartões no celular */

export function ListaNoCelular({ children }) {
  return <ul className="divide-y divide-borda md:hidden">{children}</ul>;
}

export function CartaoDeRegistro({ titulo, href, etiqueta, campos = [], rodape }) {
  const cabecalho = (
    <div className="flex items-start justify-between gap-3">
      <p className="marcante text-[14.5px] font-bold leading-snug">{titulo}</p>
      {etiqueta ? <span className="shrink-0 pt-0.5">{etiqueta}</span> : null}
    </div>
  );

  return (
    <li className="px-4 py-3.5">
      {href ? (
        <Link href={href} className="block">
          {cabecalho}
        </Link>
      ) : (
        cabecalho
      )}

      {campos.length > 0 ? (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
          {campos.map((campo) => (
            <div key={campo.rotulo}>
              <dt className="text-[11px] text-texto-3">{campo.rotulo}</dt>
              <dd className="mt-0.5 text-[13px] leading-snug text-texto">{campo.valor || '—'}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {rodape ? <div className="mt-3">{rodape}</div> : null}
    </li>
  );
}

export function Rodape({ children }) {
  return (
    <p className="border-t border-borda px-4 py-3 text-[12.5px] text-texto-3 sm:px-5">{children}</p>
  );
}
