/** Barras verticais por mês. */
export function GraficoDeColunas({ serie, campo, sufixo = '', descricao, cor = '#7371FF' }) {
  const maximo = Math.max(...serie.map((mes) => mes[campo]), 0);
  const mostrarValores = serie.length <= 8;

  const altura = (valor) => {
    if (!maximo) return 0;
    return Math.max((valor / maximo) * 100, valor > 0 ? 4 : 0);
  };

  return (
    <figure role="img" aria-label={descricao} className="mt-1">
      <div className="flex h-[132px] items-end gap-1.5 sm:gap-2">
        {serie.map((mes) => (
          <div key={mes.rotulo} className="flex flex-1 flex-col justify-end">
            {mostrarValores ? (
              <span className="numero mb-1.5 text-center text-[10.5px] text-texto-3">
                {mes[campo]}
              </span>
            ) : null}
            <div
              title={`${mes.rotulo}: ${mes[campo]}${sufixo}`}
              className="w-full rounded-t-[4px]"
              style={{ height: `${altura(mes[campo])}%`, background: cor, minHeight: '2px' }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5 border-t border-borda pt-2 sm:gap-2">
        {serie.map((mes) => (
          <span key={mes.rotulo} className="numero flex-1 text-center text-[10.5px] text-texto-3">
            {mes.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Entradas e saídas lado a lado. */
export function GraficoDeEntradasESaidas({ serie }) {
  const maximo = Math.max(...serie.map((mes) => Math.max(mes.admissoes, mes.saidas)), 0);

  const altura = (valor) => {
    if (!maximo) return 0;
    return Math.max((valor / maximo) * 100, valor > 0 ? 4 : 0);
  };

  return (
    <figure role="img" aria-label="Admissões e saídas por mês" className="mt-1">
      <div className="mb-3 flex items-center gap-4 text-[12px] text-texto-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lima" />
          Admissões
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rosa" />
          Saídas
        </span>
      </div>

      <div className="flex h-[120px] items-end gap-2">
        {serie.map((mes) => (
          <div key={mes.rotulo} className="flex flex-1 items-end justify-center gap-[3px]">
            <div
              title={`${mes.rotulo}: ${mes.admissoes} admissões`}
              className="w-1/2 rounded-t-[4px] bg-lima"
              style={{ height: `${altura(mes.admissoes)}%`, minHeight: '2px' }}
            />
            <div
              title={`${mes.rotulo}: ${mes.saidas} saídas`}
              className="w-1/2 rounded-t-[4px] bg-rosa"
              style={{ height: `${altura(mes.saidas)}%`, minHeight: '2px' }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2 border-t border-borda pt-2">
        {serie.map((mes) => (
          <span key={mes.rotulo} className="numero flex-1 text-center text-[10.5px] text-texto-3">
            {mes.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Evolução do quadro: linha com área suave por baixo. */
export function GraficoDoQuadro({ serie }) {
  const valores = serie.map((mes) => mes.quadroFim);
  const maximo = Math.max(...valores, 1);
  const minimo = Math.min(...valores, 0);
  const amplitude = maximo - minimo || 1;

  const pontos = valores.map((valor, indice) => {
    const x = serie.length === 1 ? 50 : (indice / (serie.length - 1)) * 100;
    const y = 100 - ((valor - minimo) / amplitude) * 84 - 8;
    return { x, y, valor };
  });

  const traco = pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(' ');
  const area = `${traco} 100,100 0,100`;

  return (
    <figure role="img" aria-label="Pessoas ativas ao fim de cada mês" className="mt-1">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-[128px] w-full"
        aria-hidden="true"
      >
        <polygon points={area} fill="#7371FF" opacity="0.12" />
        <polyline
          points={traco}
          fill="none"
          stroke="#7371FF"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pontos.map((ponto, indice) => (
          <circle key={indice} cx={ponto.x} cy={ponto.y} r="1.3" fill="#7371FF" />
        ))}
      </svg>

      <div className="mt-2 flex gap-1.5 border-t border-borda pt-2">
        {serie.map((mes, indice) => (
          <span key={mes.rotulo} className="flex-1 text-center">
            <span className="numero block text-[12px] font-bold">{valores[indice]}</span>
            <span className="numero block text-[10.5px] text-texto-3">{mes.rotulo}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Barras horizontais, para distribuições. */
export function ListaProporcional({ itens, vazio = 'Nada registrado no período.', cor = '#7371FF' }) {
  if (itens.length === 0) {
    return <p className="px-5 py-10 text-center text-campo text-texto-3">{vazio}</p>;
  }

  const maximo = Math.max(...itens.map((item) => item.valor), 1);

  return (
    <ul className="space-y-3.5 px-4 py-5 sm:px-5">
      {itens.map((item) => (
        <li key={item.rotulo}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-campo">{item.rotulo}</span>
            <span className="numero text-[12.5px] font-bold text-texto-2">{item.valor}</span>
          </div>
          <div className="mt-1.5 h-[6px] w-full overflow-hidden rounded-full bg-superficie-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((item.valor / maximo) * 100, 4)}%`, background: cor }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
