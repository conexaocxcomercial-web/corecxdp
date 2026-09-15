export function Folha({ children, className = '' }) {
  return (
    <section className={`rounded-[10px] border border-linha bg-folha ${className}`}>
      {children}
    </section>
  );
}

/** O fio grosso separa o título do conteúdo; o fino separa registros. */
export function TituloDaSecao({ children, apoio, acao }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-tinta px-5 pb-2.5 pt-5">
      <div>
        <h2 className="expandido text-[15px] font-semibold">{children}</h2>
        {apoio ? <p className="mt-0.5 text-[12.5px] text-tinta-50">{apoio}</p> : null}
      </div>
      {acao}
    </header>
  );
}

export function TituloDaPagina({ titulo, apoio, acao }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="expandido text-[27px] font-semibold leading-tight sm:text-[31px]">
          {titulo}
        </h1>
        {apoio ? (
          <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-tinta-70">{apoio}</p>
        ) : null}
      </div>
      {acao}
    </header>
  );
}

export function Tabela({ colunas, children, alinhamento = {} }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-campo">
        <thead>
          <tr className="border-b border-linha">
            {colunas.map((coluna) => (
              <th
                key={coluna}
                scope="col"
                className={`px-5 pb-2 pt-3 text-[12px] font-medium text-tinta-50 ${
                  alinhamento[coluna] === 'direita' ? 'text-right' : 'text-left'
                }`}
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

export function Linha({ children, className = '' }) {
  return (
    <tr
      className={`border-b border-linha-clara transition-colors last:border-b-0 hover:bg-carimbo-claro/45 ${className}`}
    >
      {children}
    </tr>
  );
}

export function Celula({ children, className = '', ...props }) {
  return (
    <td className={`px-5 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export function Codigo({ children }) {
  return <span className="numero font-mono text-[12.5px] text-tinta-70">{children}</span>;
}
