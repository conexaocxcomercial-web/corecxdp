/** Figura do período, dentro de uma frase e não isolada num quadrinho. */
export function Figura({ valor, unidade, children }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className="numero marcante text-[38px] font-bold leading-none">
        {valor}
        {unidade ? <span className="text-[20px] font-medium">{unidade}</span> : null}
      </span>
      <span className="max-w-[34ch] text-[13.5px] leading-snug text-grafite-60">{children}</span>
    </p>
  );
}

function alturaRelativa(valor, maximo) {
  if (!maximo) return 0;
  return Math.max((valor / maximo) * 100, valor > 0 ? 4 : 0);
}

/**
 * Colunas mensais. O fio de base é a linha do zero; o fio pontilhado
 * de cima marca o maior valor da série.
 */
export function GraficoDeColunas({ serie, campo, sufixo = '', descricao }) {
  const maximo = Math.max(...serie.map((mes) => mes[campo]), 0);
  const mostrarValores = serie.length <= 8;

  return (
    <figure
      role="img"
      aria-label={descricao}
      className="mt-5"
    >
      <div className="relative">
        {maximo > 0 ? (
          <div className="absolute inset-x-0 top-0 flex items-center gap-2">
            <span className="numero codigo text-[10.5px] text-grafite-30">
              {maximo}
              {sufixo}
            </span>
            <span className="h-px flex-1 border-t border-dashed border-linha" />
          </div>
        ) : null}

        <div className="flex h-[136px] items-end gap-1.5 pt-4">
          {serie.map((mes) => (
            <div key={mes.rotulo} className="flex flex-1 flex-col justify-end">
              {mostrarValores ? (
                <span className="numero mb-1 text-center text-[10.5px] text-grafite-45">
                  {mes[campo]}
                </span>
              ) : null}
              <div
                title={`${mes.rotulo}: ${mes[campo]}${sufixo}`}
                className="w-full rounded-[2px] bg-grafite"
                style={{ height: `${alturaRelativa(mes[campo], maximo)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-grafite pt-1.5">
        {serie.map((mes) => (
          <span
            key={mes.rotulo}
            className="numero flex-1 text-center text-[10.5px] text-grafite-45"
          >
            {mes.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}

/**
 * Entradas e saídas lado a lado. Entrada é barra cheia, saída é barra
 * vazada: distingue sem precisar de uma segunda cor.
 */
export function GraficoDeEntradasESaidas({ serie }) {
  const maximo = Math.max(...serie.map((mes) => Math.max(mes.admissoes, mes.saidas)), 0);

  return (
    <figure role="img" aria-label="Admissões e saídas por mês" className="mt-5">
      <div className="mb-3 flex items-center gap-4 text-[12px] text-grafite-60">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-[2px] bg-grafite" />
          Admissões
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-[2px] border-[1.5px] border-grafite" />
          Saídas
        </span>
      </div>

      <div className="flex h-[120px] items-end gap-2">
        {serie.map((mes) => (
          <div key={mes.rotulo} className="flex flex-1 items-end justify-center gap-[3px]">
            <div
              title={`${mes.rotulo}: ${mes.admissoes} admissões`}
              className="w-1/2 rounded-[2px] bg-grafite"
              style={{ height: `${alturaRelativa(mes.admissoes, maximo)}%` }}
            />
            <div
              title={`${mes.rotulo}: ${mes.saidas} saídas`}
              className="w-1/2 rounded-[2px] border-[1.5px] border-grafite"
              style={{ height: `${alturaRelativa(mes.saidas, maximo)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t border-grafite pt-1.5">
        {serie.map((mes) => (
          <span
            key={mes.rotulo}
            className="numero flex-1 text-center text-[10.5px] text-grafite-45"
          >
            {mes.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Evolução do quadro: a linha que interessa é o contorno, não a área. */
export function GraficoDoQuadro({ serie }) {
  const valores = serie.map((mes) => mes.quadroFim);
  const maximo = Math.max(...valores, 1);
  const minimo = Math.min(...valores, 0);
  const amplitude = maximo - minimo || 1;

  const pontos = valores.map((valor, indice) => {
    const x = serie.length === 1 ? 50 : (indice / (serie.length - 1)) * 100;
    const y = 100 - ((valor - minimo) / amplitude) * 88 - 6;
    return { x, y, valor };
  });

  const traco = pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(' ');

  return (
    <figure role="img" aria-label="Pessoas ativas ao fim de cada mês" className="mt-5">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-[132px] w-full text-grafite"
        aria-hidden="true"
      >
        <polyline
          points={traco}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {pontos.map((ponto, indice) => (
          <circle key={indice} cx={ponto.x} cy={ponto.y} r="1.1" fill="currentColor" />
        ))}
      </svg>

      <div className="flex gap-1.5 border-t border-grafite pt-1.5">
        {serie.map((mes, indice) => (
          <span key={mes.rotulo} className="flex-1 text-center">
            <span className="numero block text-[11.5px]">{valores[indice]}</span>
            <span className="numero block text-[10.5px] text-grafite-45">
              {mes.rotulo}
            </span>
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Barras proporcionais horizontais, para distribuições. */
export function ListaProporcional({ itens, vazio = 'Nada registrado no período.' }) {
  if (itens.length === 0) {
    return <p className="px-5 py-8 text-center text-campo text-grafite-45">{vazio}</p>;
  }

  const maximo = Math.max(...itens.map((item) => item.valor), 1);

  return (
    <ul className="space-y-3.5 px-5 pb-6 pt-5">
      {itens.map((item) => (
        <li key={item.rotulo}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-campo">{item.rotulo}</span>
            <span className="numero codigo text-[12.5px] text-grafite-60">{item.valor}</span>
          </div>
          <div className="mt-1.5 h-[6px] w-full rounded-[2px] bg-linha-clara">
            <div
              className="h-full rounded-[2px] bg-grafite"
              style={{ width: `${Math.max((item.valor / maximo) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
