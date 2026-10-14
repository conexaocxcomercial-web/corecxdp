import { Icone } from '@/componentes/Icones';
import { formatarCurto, variacaoCurta } from '@/lib/formato';

/*
 * Gráficos do sistema, num lugar só (todos os gráficos se beneficiam):
 *
 * - Evolução no tempo é coluna (`Serie`, uma ou mais séries lado a lado).
 *   O eixo começa do zero, porque a altura da coluna é o valor. Em
 *   destaque, só o último mês (a coluna cheia, as outras mais claras) com a
 *   variação sobre o anterior; cada mês tem uma área de toque que mostra o
 *   valor ao passar o mouse, tocar ou chegar pelo teclado. Nenhum valor
 *   escrito sobre as colunas. No celular, os rótulos do eixo saem de dois
 *   em dois meses e nada rola de lado.
 * - Comparar unidades, departamentos e categorias é barra (`BarrasH`), com o
 *   valor numa coluna própria ao fim da linha, nunca sobre a barra.
 * - Valores sempre formatados (lib/formato.js › formatarCurto): reais curtos,
 *   percentual com uma casa, quantidades inteiras.
 *
 * Sem JavaScript no navegador: as dicas abrem pelo CSS (:hover e :focus).
 */

/** Cores por categoria (rosca). Os valores ficam em --graf-* no globals.css. */
export const PALETA = [1, 2, 3, 4, 5, 6, 7].map((n) => `var(--graf-${n})`);

const ALTURA = 150;

/** Os passos redondos do eixo (1; 1,2; 1,5; 2; 2,5; 3; 4; 5; 6; 8, em cada potência de 10). */
const PASSOS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/**
 * O eixo vertical das colunas: do zero até um valor redondo um pouco acima
 * do maior, em dois passos iguais (o do meio também é redondo). Quantidades
 * (pessoas, dias, registros) em passos inteiros, com pelo menos 2 de altura.
 */
function eixo(valores, formato) {
  const maximo = Math.max(...valores, 0);
  const meio = maximo > 0 ? (maximo * 1.08) / 2 : 0.5;
  const potencia = 10 ** Math.floor(Math.log10(meio));
  let passo = PASSOS.find((item) => item * potencia >= meio) * potencia;
  if (formato === 'numero' || formato === 'dias') passo = Math.max(1, Math.ceil(passo));
  return { baixo: 0, alto: passo * 2 };
}

function SetaDaVariacao({ texto }) {
  if (!texto) return null;
  const sentido = texto.startsWith('+') ? 'trending_up' : 'trending_down';
  return (
    <span className="numero-var neutro">
      <Icone nome={sentido} />
      {texto}
    </span>
  );
}

/**
 * Evolução mês a mês, em colunas. itens: [{ rotulo, valor }] (ou, com
 * `series`, [{ rotulo, [campo]: valor }]). formato: o de formatarCurto.
 * series: [{ campo, nome, cor }] para mais de uma coluna por mês.
 */
export function Serie({ itens, formato = 'numero', rotulo = 'Evolução mês a mês', cor = 'var(--acao)', series = null }) {
  const linhas = series || [{ campo: 'valor', nome: rotulo, cor }];
  const n = itens.length;
  if (!n) return <p className="nota">Sem dados no período.</p>;
  const valor = (item, campo) => Number(item[campo]) || 0;
  const todos = itens.flatMap((item) => linhas.map((linha) => valor(item, linha.campo)));
  const { baixo, alto } = eixo(todos, formato);
  const y = (v) => ALTURA - ((v - baixo) / (alto - baixo || 1)) * ALTURA;
  const x = (indice) => ((indice + 0.5) / n) * 100;
  const altura = (v) => Math.max(v > 0 ? 2 : 0, ALTURA - y(v));
  const ultimo = itens[n - 1];
  const anterior = itens[n - 2];
  // No celular, com mais de 6 meses, o eixo mostra um mês a cada dois (sempre o último).
  const passo = n > 6 ? 2 : 1;
  const mostraNoCelular = (indice) => indice === n - 1 || (n - 1 - indice) % passo === 0;
  // As marcas do eixo: topo, meio e base, sem repetir o mesmo texto (o meio sai se não for exato).
  const marcas = [];
  for (const [posicao, marca] of [[0, alto], [0.5, (baixo + alto) / 2], [1, baixo]]) {
    const texto = formatarCurto(marca, formato);
    const inteiro = formato !== 'numero' && formato !== 'dias' ? true : Number.isInteger(marca);
    if (inteiro && !marcas.some((item) => item.texto === texto)) marcas.push({ posicao, texto });
  }

  return (
    <figure className="sl" aria-label={rotulo}>
      <div className="sl-destaque">
        {linhas.length === 1 ? (
          <>
            <span className="sl-dest-r">{ultimo.rotulo}</span>
            <span className="sl-dest-v num">{formatarCurto(valor(ultimo, 'valor'), formato)}</span>
            {anterior ? <SetaDaVariacao texto={variacaoCurta(valor(ultimo, 'valor'), valor(anterior, 'valor'), formato)} /> : null}
            {anterior && !variacaoCurta(valor(ultimo, 'valor'), valor(anterior, 'valor'), formato) ? (
              <span className="sl-dest-p">igual a {anterior.rotulo}</span>
            ) : anterior ? (
              <span className="sl-dest-p">sobre {anterior.rotulo}</span>
            ) : null}
          </>
        ) : (
          <ul className="sl-legenda" role="list">
            {linhas.map((linha) => (
              <li key={linha.campo}>
                <span className="sl-legenda-ponto" style={{ background: linha.cor }} aria-hidden="true" />
                <span>{linha.nome}</span>
                <b className="num">{formatarCurto(valor(ultimo, linha.campo), formato)}</b>
              </li>
            ))}
            <li className="sl-legenda-quando">em {ultimo.rotulo}</li>
          </ul>
        )}
      </div>

      <div className="sl-area">
        <div className="sl-plot" style={{ height: ALTURA }}>
          {marcas.map((marca) => (
            <span key={marca.posicao} className="sl-grade" style={{ top: `${marca.posicao * 100}%` }}>
              <span className="sl-grade-r num">{marca.texto}</span>
            </span>
          ))}
          {itens.map((item, indice) => (
            <span
              key={item.rotulo}
              className={`sc-mes ${indice === n - 1 ? 'ultimo' : ''}`}
              style={{ left: `${(indice / n) * 100}%`, width: `${100 / n}%`, '--series': linhas.length }}
              aria-hidden="true"
            >
              {linhas.map((linha) => (
                <span key={linha.campo} className="sc-barra" style={{ height: altura(valor(item, linha.campo)), '--cor': linha.cor }} />
              ))}
            </span>
          ))}
          {itens.map((item, indice) => {
            const texto = linhas.map((linha) => `${linhas.length > 1 ? `${linha.nome}: ` : ''}${formatarCurto(valor(item, linha.campo), formato)}`).join(' · ');
            const topo = Math.min(...linhas.map((linha) => y(valor(item, linha.campo))));
            const lado = indice < n / 4 ? 'ini' : indice >= n - n / 4 ? 'fim' : '';
            return (
              <button
                key={item.rotulo}
                type="button"
                className={`sl-col ${lado}`}
                style={{ left: `${(indice / n) * 100}%`, width: `${100 / n}%`, '--topo': `${topo}px` }}
                aria-label={`${item.rotulo}: ${texto}`}
              >
                <span className="sl-dica" aria-hidden="true">
                  <b>{item.rotulo}</b>
                  {texto}
                </span>
              </button>
            );
          })}
        </div>
        <div className="sl-eixo" aria-hidden="true">
          {itens.map((item, indice) => (
            <span key={item.rotulo} className={`sl-x ${mostraNoCelular(indice) ? '' : 'so-largo'}`} style={{ left: `${x(indice)}%` }}>
              {item.rotulo}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

/** Duas ou mais séries lado a lado em cada mês (por exemplo, entradas e saídas). */
export function SerieDupla({ itens, series, rotulo = 'Evolução mês a mês', formato = 'numero' }) {
  return <Serie itens={itens} series={series} rotulo={rotulo} formato={formato} />;
}

/* -------------------------------------------- barras horizontais */

/**
 * Comparação entre categorias (unidades, departamentos, tipos): uma barra
 * por linha, com o valor numa coluna própria ao fim, formatado.
 */
export function BarrasH({ itens, cor = 'var(--acao)', formato = 'numero' }) {
  const maximo = Math.max(...itens.map((item) => item.valor), 1);
  return (
    <div className="bh">
      {itens.map((item) => (
        <div key={item.rotulo} className="bh-l">
          <span className="bh-c">
            <span className="bh-t">{item.rotulo}</span>
            <span className="bh-b">
              <span className="bh-f" style={{ width: `${Math.max(2, (item.valor / maximo) * 100)}%`, background: cor }} />
            </span>
          </span>
          <span className="bh-v num">
            {formatarCurto(item.valor, formato)}
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
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" aria-hidden="true">
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
            />
          ))}
          {/* Contorno do anel (borda interna e externa), como nas barras. */}
          {[13.415, 18.415].map((raio) => (
            <circle key={raio} cx="21" cy="21" r={raio} fill="none" stroke="var(--graf-contorno)" strokeWidth="0.28" />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num text-[26px] font-bold leading-none tracking-[-0.9px]">{formatarCurto(soma)}</p>
            <p className="mt-1 text-[13px] font-medium text-[var(--tinta-3)]">{rotulo}</p>
          </div>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2.5">
        {fatias.map((fatia) => (
          <li key={fatia.rotulo} className="flex items-center gap-2.5 text-[14px]">
            <span className="graf-ponto h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: fatia.cor }} />
            <span className="flex-1 truncate text-[var(--tinta-2)]">{fatia.rotulo}</span>
            <span className="num font-semibold">{formatarCurto(fatia.valor)}</span>
            <span className="num w-12 text-right text-[13px] text-[var(--tinta-3)]">{formatarCurto(fatia.fracao, 'percentual')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
