/* ------------------------------------------------------------- utilitários */

/**
 * Escolhe um passo redondo para o eixo e devolve as cinco marcas.
 * O topo é sempre quatro passos, para as linhas da grade caírem em
 * números inteiros e nenhuma marca aparecer repetida.
 */
function escalaDoEixo(maximo, casas = 0) {
  const inteiro = casas === 0;

  if (!maximo || maximo <= 0) {
    const base = inteiro ? 1 : 0.25;
    return { topo: base * 4, marcas: [4, 3, 2, 1, 0].map((n) => Number((base * n).toFixed(casas))) };
  }

  const bruto = maximo / 4;
  const grandeza = 10 ** Math.floor(Math.log10(bruto));
  const opcoes = inteiro ? [1, 2, 4, 5, 8, 10] : [1, 1.5, 2, 2.5, 5, 10];
  const escolhido = opcoes.find((opcao) => bruto <= opcao * grandeza) || 10;

  let passo = escolhido * grandeza;
  if (inteiro) passo = Math.max(1, Math.round(passo));

  return {
    topo: passo * 4,
    marcas: [4, 3, 2, 1, 0].map((n) => Number((passo * n).toFixed(casas))),
  };
}

function formatar(valor, casas) {
  const numero = casas > 0 ? valor.toFixed(casas) : String(valor);
  return numero.replace('.', ',');
}

/** Grade, eixo e rótulos ficam em HTML; só o desenho vai para o SVG.
    Assim o gráfico estica em qualquer largura sem deformar o texto. */
function Moldura({ marcas, rotulos, altura = 'h-[190px]', casas = 0, children, legenda }) {
  return (
    <figure>
      {legenda ? <div className="mb-4 flex flex-wrap gap-4">{legenda}</div> : null}

      <div className="flex gap-2.5">
        <div
          className={`${altura} flex w-9 shrink-0 flex-col justify-between text-right text-[10px] leading-none text-texto-3`}
        >
          {marcas.map((marca, indice) => (
            <span key={indice} className="numero">
              {formatar(marca, casas)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`relative ${altura}`}>
            {[0, 25, 50, 75, 100].map((posicao) => (
              <span
                key={posicao}
                aria-hidden="true"
                className="absolute inset-x-0 border-t border-borda"
                style={{ top: `${posicao}%` }}
              />
            ))}
            <div className="absolute inset-0">{children}</div>
          </div>

          <div className="mt-2 flex gap-1">
            {rotulos.map((rotulo) => (
              <span
                key={rotulo}
                className="numero flex-1 truncate text-center text-[10.5px] text-texto-3"
              >
                {rotulo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function ItemDeLegenda({ cor, children }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-texto-2">
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ linha e área */

export function GraficoDeArea({ serie, campo, cor = '#7371FF', descricao, casas = 0 }) {
  const valores = serie.map((mes) => Number(mes[campo]) || 0);
  const { topo, marcas } = escalaDoEixo(Math.max(...valores), casas);

  const pontos = valores.map((valor, indice) => {
    const x = serie.length === 1 ? 50 : (indice / (serie.length - 1)) * 100;
    return { x, y: 100 - (valor / topo) * 100, valor };
  });

  const traco = pontos.map((ponto) => `${ponto.x},${ponto.y}`).join(' ');

  return (
    <Moldura marcas={marcas} rotulos={serie.map((mes) => mes.rotulo)} casas={casas}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        role="img"
        aria-label={descricao}
      >
        <defs>
          <linearGradient id={`area-${campo}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon points={`${traco} 100,100 0,100`} fill={`url(#area-${campo})`} />
        <polyline
          points={traco}
          fill="none"
          stroke={cor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pontos.map((ponto, indice) => (
          <circle
            key={indice}
            cx={ponto.x}
            cy={ponto.y}
            r="3.5"
            fill={cor}
            stroke="rgb(var(--superficie))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          >
            <title>{`${serie[indice].rotulo}: ${formatar(ponto.valor, casas)}`}</title>
          </circle>
        ))}
      </svg>
    </Moldura>
  );
}

/* ------------------------------------------------------------------ barras */

/** Uma ou mais séries de barras lado a lado, com grade por trás. */
export function GraficoDeBarras({ serie, series, descricao, casas = 0, sufixo = '' }) {
  const todos = series.flatMap((linha) => serie.map((mes) => Number(mes[linha.campo]) || 0));
  const { topo, marcas } = escalaDoEixo(Math.max(...todos), casas);

  const legenda =
    series.length > 1
      ? series.map((linha) => (
          <ItemDeLegenda key={linha.campo} cor={linha.cor}>
            {linha.nome}
          </ItemDeLegenda>
        ))
      : null;

  return (
    <Moldura marcas={marcas} rotulos={serie.map((mes) => mes.rotulo)} casas={casas} legenda={legenda}>
      <div className="flex h-full items-end gap-1.5" role="img" aria-label={descricao}>
        {serie.map((mes) => (
          <div key={mes.rotulo} className="flex h-full flex-1 items-end justify-center gap-[3px]">
            {series.map((linha) => {
              const valor = Number(mes[linha.campo]) || 0;
              const altura = topo ? (valor / topo) * 100 : 0;

              return (
                <div
                  key={linha.campo}
                  title={`${mes.rotulo} — ${linha.nome}: ${formatar(valor, casas)}${sufixo}`}
                  className="w-full max-w-[26px] rounded-t-[4px] transition-all"
                  style={{
                    height: `${Math.max(altura, valor > 0 ? 2 : 0)}%`,
                    background: linha.cor,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </Moldura>
  );
}

/* ------------------------------------------------------------------- rosca */

export function Rosca({ itens, total, rotuloCentral = 'pessoas' }) {
  const soma = total ?? itens.reduce((acumulado, item) => acumulado + item.valor, 0);

  if (soma === 0) {
    return <p className="px-5 py-10 text-center text-campo text-texto-3">Nada a distribuir.</p>;
  }

  const raio = 15.915;
  let percorrido = 0;

  const fatias = itens.map((item) => {
    const fracao = (item.valor / soma) * 100;
    const fatia = { ...item, fracao, deslocamento: 25 - percorrido };
    percorrido += fracao;
    return fatia;
  });

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-5 sm:flex-row sm:px-5">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle
            cx="21"
            cy="21"
            r={raio}
            fill="none"
            stroke="rgb(var(--superficie-2))"
            strokeWidth="6"
          />
          {fatias.map((fatia) => (
            <circle
              key={fatia.rotulo}
              cx="21"
              cy="21"
              r={raio}
              fill="none"
              stroke={fatia.cor}
              strokeWidth="6"
              strokeDasharray={`${fatia.fracao} ${100 - fatia.fracao}`}
              strokeDashoffset={fatia.deslocamento}
            >
              <title>{`${fatia.rotulo}: ${fatia.valor}`}</title>
            </circle>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="numero marcante text-[30px] font-bold leading-none">{soma}</p>
            <p className="mt-1 text-[11.5px] text-texto-3">{rotuloCentral}</p>
          </div>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2.5">
        {fatias.map((fatia) => (
          <li key={fatia.rotulo} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: fatia.cor }}
            />
            <span className="flex-1 truncate text-campo">{fatia.rotulo}</span>
            <span className="numero text-[12.5px] font-bold">{fatia.valor}</span>
            <span className="numero w-11 text-right text-[11.5px] text-texto-3">
              {Math.round(fatia.fracao)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- miniatura */

/** Linha minúscula para dentro dos cartões de métrica. */
export function Miniatura({ valores, cor = '#7371FF' }) {
  if (!valores || valores.length < 2) return null;

  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  const amplitude = maximo - minimo || 1;

  const traco = valores
    .map((valor, indice) => {
      const x = (indice / (valores.length - 1)) * 100;
      const y = 100 - ((valor - minimo) / amplitude) * 76 - 12;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mt-3 h-[34px] w-full"
    >
      <polygon points={`${traco} 100,100 0,100`} fill={cor} opacity="0.12" />
      <polyline
        points={traco}
        fill="none"
        stroke={cor}
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------- barras horizontais */

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
