/* ----------------------------------------------------------- paleta */

/** Cores por categoria (rosca). Os valores ficam em --graf-* no globals.css. */
export const PALETA = [1, 2, 3, 4, 5, 6, 7].map((n) => `var(--graf-${n})`);

/* ------------------------------------------------------------ escala */

function escala(maximo, casas = 0) {
  if (!maximo || maximo <= 0) return { topo: casas ? 1 : 4 };
  const bruto = maximo / 4;
  const grandeza = 10 ** Math.floor(Math.log10(bruto));
  const opcoes = casas ? [1, 1.5, 2, 2.5, 5, 10] : [1, 2, 4, 5, 8, 10];
  const escolhido = opcoes.find((opcao) => bruto <= opcao * grandeza) || 10;
  let passo = escolhido * grandeza;
  if (!casas) passo = Math.max(1, Math.round(passo));
  return { topo: passo * 4 };
}

function fmt(valor, casas) {
  const numero = casas > 0 ? Number(valor).toFixed(casas) : String(valor);
  return numero.replace('.', ',');
}

/* ------------------------------------------------- série de barras */

/**
 * Barras por mês, com o valor impresso acima. Num toque não existe
 * passar o mouse: sem o rótulo o gráfico vira desenho.
 */
export function Serie({ itens, cor = 'var(--acao)', casas = 0, sufixo = '', rotulo = 'Série mês a mês' }) {
  const { topo } = escala(Math.max(...itens.map((i) => i.valor), 0), casas);

  return (
    <>
      {/* No celular a série rola de lado: a região recebe foco para rolar pelo teclado. */}
      <div className="serie-rolagem" tabIndex={0} role="region" aria-label={rotulo}>
        <div className="serie">
          {itens.map((item) => (
            <div key={item.rotulo} className="sb" title={`${item.rotulo}: ${fmt(item.valor, casas)}${sufixo}`}>
              <span className="sb-n num">
                {fmt(item.valor, casas)}
                {sufixo}
              </span>
              <span
                className="sb-b"
                style={{ height: `${Math.max(2, (item.valor / topo) * 108)}px`, background: cor }}
              />
              <span className="sb-x num">{item.rotulo}</span>
            </div>
          ))}
        </div>
      </div>
      {itens.length > 6 ? (
        <div className="serie-dica">arraste para ver o período todo</div>
      ) : null}
    </>
  );
}

/** Duas barras por mês, para entradas contra saídas. */
export function SerieDupla({ itens, series, rotulo = 'Série mês a mês' }) {
  const todos = itens.flatMap((item) => series.map((s) => item[s.campo] || 0));
  const { topo } = escala(Math.max(...todos, 0));

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.campo} className="flex items-center gap-1.5 text-[13px] text-[var(--tinta-2)]">
            <span className="graf-ponto h-2.5 w-2.5 rounded-full" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>

      <div className="serie-rolagem" tabIndex={0} role="region" aria-label={rotulo}>
        <div className="serie">
          {itens.map((item) => (
            <div key={item.rotulo} className="sb">
              <span className="sb-n num">
                {series.map((s) => item[s.campo]).join(' / ')}
              </span>
              <span className="sb-dupla">
                {series.map((s) => (
                  <span
                    key={s.campo}
                    title={`${item.rotulo} — ${s.nome}: ${item[s.campo]}`}
                    className="sb-b"
                    style={{
                      height: `${Math.max(2, ((item[s.campo] || 0) / topo) * 104)}px`,
                      background: s.cor,
                    }}
                  />
                ))}
              </span>
              <span className="sb-x num">{item.rotulo}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------- barras horizontais */

export function BarrasH({ itens, cor = 'var(--acao)', sufixo = '' }) {
  const maximo = Math.max(...itens.map((item) => item.valor), 1);

  return (
    <div className="bh">
      {itens.map((item) => (
        <div key={item.rotulo} className="bh-l">
          <span className="bh-c">
            <span className="bh-t">{item.rotulo}</span>
            <span className="bh-b">
              <span
                className="bh-f"
                style={{ width: `${Math.max(2, (item.valor / maximo) * 100)}%`, background: cor }}
              />
            </span>
          </span>
          <span className="bh-v num">
            {item.valor}
            {sufixo}
            {item.sub ? <small>{item.sub}</small> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- rosca */

export function Rosca({ itens, total, rotulo = 'pessoas' }) {
  const soma = total ?? itens.reduce((acumulado, item) => acumulado + item.valor, 0);
  if (!soma) return null;

  let percorrido = 0;
  const fatias = itens.map((item) => {
    const fracao = (item.valor / soma) * 100;
    const fatia = { ...item, fracao, deslocamento: 25 - percorrido };
    percorrido += fracao;
    return fatia;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--papel-2)" strokeWidth="5" />
          {fatias.map((fatia) => (
            <circle
              key={fatia.rotulo}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke={fatia.cor}
              strokeWidth="5"
              strokeDasharray={`${fatia.fracao} ${100 - fatia.fracao}`}
              strokeDashoffset={fatia.deslocamento}
            >
              <title>{`${fatia.rotulo}: ${fatia.valor}`}</title>
            </circle>
          ))}
          {/* Contorno do anel (borda interna e externa), como nas barras. */}
          {[13.415, 18.415].map((raio) => (
            <circle
              key={raio}
              cx="21"
              cy="21"
              r={raio}
              fill="none"
              stroke="var(--graf-contorno)"
              strokeWidth="0.28"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num text-[26px] font-bold leading-none tracking-[-0.9px]">{soma}</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--tinta-3)]">
              {rotulo}
            </p>
          </div>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2.5">
        {fatias.map((fatia) => (
          <li key={fatia.rotulo} className="flex items-center gap-2.5 text-[14px]">
            <span className="graf-ponto h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: fatia.cor }} />
            <span className="flex-1 truncate text-[var(--tinta-2)]">{fatia.rotulo}</span>
            <span className="num font-semibold">{fatia.valor}</span>
            <span className="num w-10 text-right text-[13px] text-[var(--tinta-3)]">
              {Math.round(fatia.fracao)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
