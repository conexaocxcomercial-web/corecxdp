import Link from 'next/link';
import { Icone } from '@/componentes/Icones';
import { LinhaDePrazo } from '@/componentes/Prazos';
import { dataCurta, diasPorExtenso, emReaisCurto } from '@/lib/formato';

/*
 * Peças da tela inicial da Gestão (opção "Por assunto", fase 5 do
 * redesenho): a faixa de urgência, a faixa da implantação, a faixa violeta
 * com o quadro e os números do negócio, os quadros por assunto e a
 * atividade recente. Os dados vêm de lib/dados/inicio.js.
 */

const decimal = (valor) => valor.toFixed(1).replace('.', ',');

/** Fina, escura, no topo: só quando há algo vencido ou vencendo em até 2 dias. */
export function FaixaDeUrgencia({ vencidos, vencendo, ate }) {
  if (!vencidos && !vencendo) return null;
  const prazos = (n) => `${n} ${n === 1 ? 'prazo' : 'prazos'}`;
  const vencem = (n) => `${n === 1 ? 'vence' : 'vencem'} até ${ate}`;
  let frase;
  if (vencidos && vencendo) frase = `${prazos(vencidos)} ${vencidos === 1 ? 'vencido' : 'vencidos'} e ${vencendo} que ${vencem(vencendo)}`;
  else if (vencidos) frase = `${prazos(vencidos)} ${vencidos === 1 ? 'vencido' : 'vencidos'}`;
  else frase = `${prazos(vencendo)} que ${vencem(vencendo)}`;
  return (
    <Link href="/pendencias?quando=urgente" className="urgente">
      <span className={`urgente-ponto ${vencidos ? 'vencido' : ''}`} aria-hidden="true" />
      <span className="urgente-txt">
        <b>{frase}</b>
      </span>
      <span className="urgente-ir">
        Ver pendências
        <Icone nome="arrow_forward" />
      </span>
    </Link>
  );
}

/** Durante a revisão da implantação, no lugar da faixa de urgência. */
export function FaixaDaImplantacao({ implantacao }) {
  const faltam = implantacao.itens - implantacao.conferidos;
  return (
    <Link href="/pendencias#revisao" className="urgente implantacao">
      <Icone nome="fact_check" className="urgente-ic" />
      <span className="urgente-txt">
        <b>Revisão da implantação</b>
        <span className="urgente-quem">
          {' '}
          · importado em {implantacao.data}.{' '}
          {faltam > 0
            ? `${faltam} ${faltam === 1 ? 'item para conferir' : 'itens para conferir'} antes de os alertas começarem.`
            : 'Tudo conferido: falta concluir a revisão.'}
        </span>
      </span>
      <span className="urgente-ir">
        Revisar
        <Icone nome="arrow_forward" />
      </span>
    </Link>
  );
}

function juntar(partes) {
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/** "11 coisas esperando você, a maior parte em férias e documentos." */
export function fraseDosAssuntos(assuntos, quem) {
  const atencao = assuntos.filter((assunto) => assunto.pedeVoce > 0).sort((a, b) => b.pedeVoce - a.pedeVoce);
  const total = atencao.reduce((soma, assunto) => soma + assunto.pedeVoce, 0);
  if (total === 0) {
    const semana = assuntos.reduce((soma, assunto) => soma + assunto.estaSemana, 0);
    return semana ? `Nada atrasado; ${semana} ${semana === 1 ? 'prazo' : 'prazos'} esta semana.` : 'Tudo em dia.';
  }
  const coisas = `${total} ${total === 1 ? 'coisa' : 'coisas'} esperando ${quem}`;
  if (atencao.length === 1) return `${coisas}, em ${atencao[0].curto}.`;
  const [primeiro, segundo] = atencao;
  if (primeiro.pedeVoce + segundo.pedeVoce > total / 2) {
    return `${coisas}, a maior parte em ${juntar([primeiro.curto, segundo.curto])}.`;
  }
  return `${coisas}, em ${atencao.length} assuntos.`;
}

function variacao(diferenca, texto) {
  return diferenca === 0 ? texto.igual : texto.mudou;
}

/** Os números do negócio na faixa violeta: salários, turnover e absenteísmo. */
export function figurasDoNegocio(numeros) {
  const salarios = numeros.salarios - numeros.salariosDoMesPassado;
  const figuras = [
    {
      chave: 'salarios',
      rotulo: 'Salários do mês',
      valor: emReaisCurto(numeros.salarios),
      apoio: variacao(salarios, {
        igual: `igual a ${numeros.mesPassado}, sem encargos`,
        mudou: `${salarios > 0 ? '+' : '−'}${emReaisCurto(Math.abs(salarios))} sobre ${numeros.mesPassado}, sem encargos`,
      }),
      href: '/colaboradores',
    },
    {
      chave: 'turnover',
      rotulo: 'Turnover em 12 meses',
      valor: `${decimal(numeros.turnover)}%`,
      apoio: `${numeros.admissoesEm12Meses} entradas e ${numeros.saidasEm12Meses} saídas`,
      href: '/indicadores/quadro/turnover',
    },
  ];
  if (numeros.absenteismo) {
    const { mes, valor, anterior, mesAnterior } = numeros.absenteismo;
    const diferenca = Math.round((valor - anterior) * 10) / 10;
    figuras.push({
      chave: 'absenteismo',
      rotulo: `Absenteísmo em ${mes}`,
      valor: `${decimal(valor)}%`,
      apoio: variacao(diferenca, {
        igual: `igual a ${mesAnterior}`,
        mudou: `${diferenca > 0 ? '+' : '−'}${decimal(Math.abs(diferenca))} p.p. sobre ${mesAnterior}`,
      }),
      href: '/indicadores/saude/absenteismo?meses=3',
    });
  }
  return figuras;
}

/** A faixa violeta: o quadro em Display, o que pede atenção e os números do negócio. */
export function FaixaDoInicio({ inicio, quem }) {
  const { numeros } = inicio;
  return (
    <section className="ini-faixa" aria-labelledby="ini-frase">
      <div className="ini-faixa-in">
        <div>
          <h1 id="ini-frase" className="ini-frase">
            {numeros.quadro} {numeros.quadro === 1 ? 'pessoa' : 'pessoas'} no quadro
            <span className="ini-frase-2">{fraseDosAssuntos(inicio.assuntos, quem)}</span>
          </h1>
          <p className="ini-linha">
            {inicio.data} · {inicio.alcance}
          </p>
        </div>
        <ul className="ini-nums">
          {figurasDoNegocio(numeros).map((figura) => (
            <li key={figura.chave}>
              <Link href={figura.href} className="ini-num">
                <span className="ini-num-r">{figura.rotulo}</span>
                <span className="ini-num-v">{figura.valor}</span>
                <span className="ini-num-p">{figura.apoio}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const MOSTRAR = 3;

const ASSUNTO_NA_PENDENCIA = {
  pessoas: 'pessoas',
  ferias: 'ferias',
  saude: 'saude',
  documentos: 'documentos',
  desligamentos: 'desligamentos',
};

function LinhaDeAprovacao({ item, quem }) {
  return (
    <li className="prazo">
      <Link href={`/pendencias?assunto=${item.tema}`} className="prazo-a">
        <span className="prazo-txt">
          <span className="prazo-t">{item.titulo}</span>
          <span className="prazo-d">
            {item.pessoa?.nome} · {item.detalhe}
          </span>
        </span>
        <span className="quando semana">{item.tipo === 'desligamento' ? 'para concluir' : quem === 'você' ? 'para aprovar' : 'esperando'}</span>
        <Icone nome="chevron_right" className="prazo-ir" />
      </Link>
    </li>
  );
}

function LinhaSimples({ item }) {
  return (
    <li className="prazo">
      <Link href={`/colaboradores/${item.pessoa.matricula}?aba=ocorrencias`} className="prazo-a">
        <span className="prazo-txt">
          <span className="prazo-t">{item.titulo}</span>
          <span className="prazo-d">
            {item.pessoa.nome} · {item.detalhe}
          </span>
        </span>
        <Icone nome="chevron_right" className="prazo-ir" />
      </Link>
    </li>
  );
}

/** Um quadro por assunto: situação, números e o que espera você, com o caminho para o detalhe. */
export function Assunto({ assunto, quem }) {
  const linhas = [
    ...assunto.aprovacoes.map((item) => ({ tipo: 'aprovacao', item })),
    ...assunto.prazos.map((item) => ({ tipo: 'prazo', item })),
    ...assunto.outros.map((item) => ({ tipo: 'outro', item })),
  ];
  const resto = linhas.length - MOSTRAR;
  const pendencias = ASSUNTO_NA_PENDENCIA[assunto.chave];

  return (
    <section className="ini-tema" aria-labelledby={`ini-${assunto.chave}`}>
      <div className="ini-tema-cab">
        <h2 id={`ini-${assunto.chave}`} className="ini-tema-t">
          {assunto.nome}
        </h2>
        {assunto.pedeVoce ? (
          <span className="pil at">
            <span className="pil-pt" />
            {assunto.pedeVoce} esperando {quem}
          </span>
        ) : assunto.estaSemana ? (
          <span className="pil">
            <span className="pil-pt" />
            {assunto.estaSemana} esta semana
          </span>
        ) : (
          <span className="pil ok">
            <span className="pil-pt" />
            Em dia
          </span>
        )}
      </div>

      <dl className="ini-tema-nums">
        {assunto.figuras.map((figura) => (
          <div key={figura.rotulo} className={figura.tom === 'critico' && figura.valor ? 'critico' : ''}>
            <dt>{figura.rotulo}</dt>
            <dd>{figura.valor}</dd>
          </div>
        ))}
      </dl>

      {linhas.length ? (
        <ul className="linhas ini-tema-l">
          {linhas.slice(0, MOSTRAR).map(({ tipo, item }) =>
            tipo === 'aprovacao' ? (
              <LinhaDeAprovacao key={item.id} item={item} quem={quem} />
            ) : tipo === 'prazo' ? (
              <LinhaDePrazo key={item.id} item={item} />
            ) : (
              <LinhaSimples key={item.id} item={item} />
            )
          )}
        </ul>
      ) : null}

      <div className="ini-tema-pe">
        {resto > 0 && pendencias ? (
          <Link href={`/pendencias?assunto=${pendencias}`} className="ini-tema-mais">
            e mais {resto}
          </Link>
        ) : resto > 0 ? (
          <span className="nota">e mais {resto}</span>
        ) : (
          <span />
        )}
        {assunto.href ? (
          <Link href={assunto.href} className="ini-tema-ir">
            {assunto.link}
            <Icone nome="arrow_forward" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/** Quem registrou o quê, com a pessoa levando à ficha. */
export function Atividade({ itens }) {
  if (itens.length === 0) return <p className="nota">Nenhum registro ainda.</p>;
  return (
    <ol className="ativ">
      {itens.map((item) => (
        <li key={item.id}>
          <p>
            <b>{item.autor}</b> {item.acao}{' '}
            {item.pessoa ? (
              <Link href={`/colaboradores/${item.pessoa.matricula}`} className="ativ-p">
                {item.pessoa.nome}
              </Link>
            ) : null}
          </p>
          <span className="ativ-q">{Math.abs(item.dias) <= 6 ? diasPorExtenso(item.dias) : dataCurta(item.quando)}</span>
        </li>
      ))}
    </ol>
  );
}

