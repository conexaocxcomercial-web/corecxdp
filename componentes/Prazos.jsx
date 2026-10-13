import Link from 'next/link';
import { Icone } from '@/componentes/Icones';
import { dataCurta, diasPorExtenso } from '@/lib/formato';

/*
 * Prazos (lib/prazos.js) na tela: a pílula dos dias e a linha de prazo, que
 * o Início e Pendências dividem. Cada linha leva à ficha da pessoa, na aba
 * do assunto (?aba=ferias).
 */

const ROTULO_DO_GRUPO = {
  vencido: 'Vencido',
  conferir: 'A conferir na implantação',
  semana: 'Esta semana',
  mes: 'Próximos 30 dias',
  adiante: 'Mais adiante',
};

export function rotuloDoGrupo(grupo) {
  return ROTULO_DO_GRUPO[grupo] || '';
}

/** Dias até o prazo: rosa venceu, escura esta semana, neutra depois, tracejada a conferir. */
export function Prazo({ dias, grupo, data }) {
  let texto = diasPorExtenso(dias);
  if (grupo === 'conferir') texto = `a conferir · ${dataCurta(data)}`;
  else if (dias < 0) texto = `venceu ${diasPorExtenso(dias)}`;
  return <span className={`quando ${grupo || ''}`}>{texto}</span>;
}

export function linkDaFicha(pessoa, aba) {
  if (!pessoa) return null;
  return `/colaboradores/${pessoa.matricula}${aba ? `?aba=${aba}` : ''}`;
}

/** Um prazo: o que é, de quem e quando. A agenda por dia pode tirar a pílula. */
export function LinhaDePrazo({ item, comPrazo = true, etiqueta }) {
  const destino = linkDaFicha(item.pessoa, item.aba);
  const conteudo = (
    <>
      <span className="prazo-txt">
        <span className="prazo-t">{item.titulo}</span>
        <span className="prazo-d">{[item.pessoa?.nome, item.detalhe].filter(Boolean).join(' · ')}</span>
      </span>
      {etiqueta ? <span className="prazo-etiqueta">{etiqueta}</span> : null}
      {comPrazo ? <Prazo dias={item.dias} grupo={item.grupo} data={item.data} /> : null}
      {destino ? <Icone nome="chevron_right" className="prazo-ir" /> : null}
    </>
  );
  return (
    <li className="prazo">
      {destino ? (
        <Link href={destino} className="prazo-a">
          {conteudo}
        </Link>
      ) : (
        <div className="prazo-a">{conteudo}</div>
      )}
    </li>
  );
}

/** Um grupo de prazos com título, ponto do tom e contagem; o que passa do limite fica em "Mais". */
export function GrupoDePrazos({ grupo, itens, limite }) {
  if (itens.length === 0) return null;
  const primeiros = limite ? itens.slice(0, limite) : itens;
  const resto = limite ? itens.slice(limite) : [];
  return (
    <div className="grupo-prazos">
      <h3 className="grupo-prazos-t">
        <span className={`grupo-ponto ${grupo}`} aria-hidden="true" />
        {rotuloDoGrupo(grupo)}
        <span className="grupo-prazos-n">{itens.length}</span>
      </h3>
      <ul className="linhas">
        {primeiros.map((item) => (
          <LinhaDePrazo key={item.id} item={item} />
        ))}
      </ul>
      {resto.length ? (
        <details className="mais">
          <summary>Mais {resto.length}</summary>
          <ul className="linhas">
            {resto.map((item) => (
              <LinhaDePrazo key={item.id} item={item} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
