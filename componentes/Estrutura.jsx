import Link from 'next/link';
import { Icone } from '@/componentes/Icones';
import { TituloNaBarra } from '@/componentes/TituloNaBarra';

/* --------------------------------------------------------- estrutura */

/**
 * Título da página no tamanho do "Entrar" (32px; 28px no celular), com
 * subtítulo, ações à direita e, como filhos, a linha de filtros. Rola
 * com a página: quando o título some, ele aparece pequeno na barra do topo.
 */
export function Cabecalho({ titulo, subtitulo, acoes, voltar, children }) {
  return (
    <header className="cab">
      {voltar ? (
        <Link href={voltar.href} className="cab-voltar">
          <Icone nome="arrow_back" />
          {voltar.rotulo}
        </Link>
      ) : null}
      <div className="cab-linha">
        <div className="cab-txt">
          <h1 className="cab-tit">{titulo}</h1>
          <TituloNaBarra titulo={titulo} />
          {subtitulo ? <p className="cab-sub">{subtitulo}</p> : null}
        </div>
        {acoes ? <div className="cab-acoes">{acoes}</div> : null}
      </div>
      {children ? <div className="cab-filtros">{children}</div> : null}
    </header>
  );
}

export function Wrap({ children }) {
  return <div className="wrap">{children}</div>;
}

/** Seção com título; `nota` é o texto de apoio à direita e `acao`, um controle ao lado dele (o selo de estimativa, por exemplo). */
export function Secao({ titulo, nota, acao, children }) {
  return (
    <section className="sec">
      <div className="sec-cab">
        <h2 className="sec-tit">{titulo}</h2>
        {nota || acao ? (
          <span className="sec-lado">
            {nota ? <p className="sec-nota">{nota}</p> : null}
            {acao}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Cartao({ titulo, descricao, liso, className = '', children }) {
  return (
    <div className={`cartao ${liso ? 'cartao-liso' : ''} ${className}`}>
      {titulo ? (
        <div className="cartao-cab">
          <h3 className="cartao-t">{titulo}</h3>
          {descricao ? <p className="cartao-d">{descricao}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- números */

export function Numeros({ children }) {
  return <div className="numeros">{children}</div>;
}

const SETAS = { sobe: 'trending_up', desce: 'trending_down', igual: 'trending_flat' };

/**
 * Número de um tema. `tom` é uma cor de situação (ex.: 'var(--atencao)'),
 * mostrada como ponto ao lado do rótulo. `variacao` é
 * `{ texto, sentido: 'sobe' | 'desce' | 'igual', leitura: 'bom' | 'ruim' | 'neutro' }`;
 * o texto diz a comparação por extenso (ex.: "+0,4 p.p. sobre setembro").
 * Com `href`, o cartão inteiro leva ao detalhe.
 */
export function Numero({ rotulo, valor, apoio, tom, variacao, href }) {
  const conteudo = (
    <>
      <span className="numero-r">
        {tom ? <span className="numero-tom" style={{ background: tom }} aria-hidden="true" /> : null}
        {rotulo}
      </span>
      <span className="numero-v">{valor}</span>
      {apoio ? <span className="numero-p">{apoio}</span> : null}
      {variacao ? (
        <span className={`numero-var ${variacao.leitura || ''}`}>
          <Icone nome={SETAS[variacao.sentido] || SETAS.igual} />
          {variacao.texto}
        </span>
      ) : null}
      {href ? <Icone nome="arrow_forward" className="numero-ir" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="numero">
        {conteudo}
      </Link>
    );
  }

  return <div className="numero">{conteudo}</div>;
}

/* ---------------------------------------------------------- tabelas */

export function Tabela({ grade, colunas, children }) {
  return (
    <div className="tb">
      <div className="tb-h" style={{ gridTemplateColumns: grade }}>
        {colunas.map((coluna) => (
          <span key={coluna.rotulo} className={coluna.alinha || ''}>
            {coluna.rotulo}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

export function LinhaTabela({ grade, children }) {
  return (
    <div className="tb-l" style={{ gridTemplateColumns: grade }}>
      {children}
    </div>
  );
}

export function Celula({ rotulo, alinha, children }) {
  return (
    <span className={alinha || ''} data-r={rotulo}>
      {children}
    </span>
  );
}

export function Nome({ href, children }) {
  return (
    <Link href={href} className="tb-nome hover:text-[var(--acao-texto)]">
      {children}
    </Link>
  );
}

/* ----------------------------------------------------------- avisos */

export function Vazio({ icone = 'inbox', children, acao }) {
  return (
    <div className="vazio">
      <Icone nome={icone} />
      <p>{children}</p>
      {acao ? <div className="mt-4 flex justify-center">{acao}</div> : null}
    </div>
  );
}

export function Faixa({ tom = 'info', icone, children }) {
  const padrao = { info: 'info', alerta: 'warning', erro: 'error' }[tom];
  return (
    <div className={`faixa ${tom}`}>
      <Icone nome={icone || padrao} />
      <span>{children}</span>
    </div>
  );
}
