import Link from 'next/link';
import { Icone } from '@/componentes/Icones';

/* --------------------------------------------------------- estrutura */

export function Comando({ titulo, contador, children }) {
  return (
    <div className="cmd">
      <span className="cmd-tit">{titulo}</span>
      {contador ? (
        <>
          <div className="cmd-sep" />
          <span className="cmd-cont">{contador}</span>
        </>
      ) : null}
      {children ? <div className="cmd-dir">{children}</div> : null}
    </div>
  );
}

export function Wrap({ children }) {
  return <div className="wrap">{children}</div>;
}

export function Secao({ titulo, nota, children }) {
  return (
    <section className="sec">
      <div className="sec-cab">
        <span className="sec-tit">{titulo}</span>
        <span className="sec-linha" />
        {nota ? <span className="sec-nota">{nota}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Cartao({ titulo, descricao, liso, className = '', children }) {
  return (
    <div className={`cartao ${liso ? 'cartao-liso' : ''} ${className}`}>
      {titulo ? (
        <div className={liso ? 'px-[19px] pt-[17px]' : ''}>
          <div className="cartao-t">{titulo}</div>
          {descricao ? <div className="cartao-d">{descricao}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- KPIs */

export function Kpis({ children }) {
  return <div className="kpis">{children}</div>;
}

export function Kpi({ rotulo, valor, apoio, cor, href }) {
  const conteudo = (
    <>
      <div className="kpi-r">{rotulo}</div>
      <div className="kpi-v num" style={cor ? { color: cor } : undefined}>
        {valor}
      </div>
      {apoio ? <div className="kpi-p">{apoio}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="kpi block transition-shadow hover:shadow-[var(--e2)]">
        {conteudo}
      </Link>
    );
  }

  return <div className="kpi">{conteudo}</div>;
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
    <Link href={href} className="tb-nome hover:text-[var(--acao)]">
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
