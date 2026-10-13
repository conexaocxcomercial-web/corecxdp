import { Icone } from '@/componentes/Icones';
import { emReais } from '@/lib/formato';

/*
 * Passos de uma admissão ou de um desligamento (fase 9 do redesenho): o que
 * já foi feito, o que falta e o que passou do prazo. Lima resolve, anel
 * espera, rosa atrasou, como nas pílulas de situação.
 */

function estadoDo(passo) {
  if (passo.atraso) return 'atraso';
  return passo.feito ? 'feito' : 'falta';
}

const ICONE = { feito: 'check', falta: 'schedule', atraso: 'warning' };
const LEITURA = { feito: 'feito', falta: 'falta', atraso: 'atrasado' };

export function Passos({ passos }) {
  return (
    <ol className="passos">
      {passos.map((passo) => {
        const estado = estadoDo(passo);
        const detalhe = passo.valor ? `${emReais(passo.valor)} informados` : passo.detalhe;
        return (
          <li key={passo.chave} className={`passo ${estado}`}>
            <span className="passo-ic">
              <Icone nome={ICONE[estado]} tamanho={14} />
            </span>
            <span className="passo-n">
              {passo.nome}
              <span className="sr-only">: {LEITURA[estado]}</span>
            </span>
            {detalhe ? <span className="passo-d">{detalhe}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Em uma linha de tabela: "completos" ou o que falta, sem a lista inteira. */
export function ResumoDosPassos({ passos }) {
  if (!passos) return <span className="text-[var(--tinta-3)]">veio da implantação</span>;
  const faltam = passos.filter((passo) => !passo.feito);
  const atrasou = passos.some((passo) => passo.atraso);
  if (!faltam.length) {
    return (
      <span className={`passos-resumo ${atrasou ? 'atraso' : 'feito'}`}>
        <span className="passo-ic">
          <Icone nome={atrasou ? 'warning' : 'check'} tamanho={14} />
        </span>
        {atrasou ? 'completos, com atraso' : 'completos'}
      </span>
    );
  }
  return (
    <span className="passos-resumo falta">
      <span className="passo-ic">
        <Icone nome="schedule" tamanho={14} />
      </span>
      <span>
        {faltam.length === 1 ? 'falta' : `faltam ${faltam.length}`}: {faltam.map((passo) => passo.curto || passo.nome).join(', ')}
      </span>
    </span>
  );
}
