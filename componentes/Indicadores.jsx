import Link from 'next/link';
import { Celula, LinhaTabela, Tabela } from '@/componentes/Estrutura';
import { Icone } from '@/componentes/Icones';
import { OCULTO, PERIODOS, formatarIndicador } from '@/lib/paineis';

/*
 * Peças dos indicadores (fase 10 do redesenho): o seletor de período (no
 * endereço, guardando o departamento), o valor que respeita a regra dos
 * menos de 3 (LGPD) e a tabela dos recortes por unidade e por departamento.
 */

/** O endereço com o período e o departamento atuais, trocando o que vier em `muda`. */
export function enderecoDe(base, { meses, departamento }, muda = {}) {
  const parametros = new URLSearchParams();
  const atual = { meses, departamento, ...muda };
  if (atual.meses && atual.meses !== 12) parametros.set('meses', String(atual.meses));
  if (atual.departamento) parametros.set('departamento', atual.departamento);
  const consulta = parametros.toString();
  return consulta ? `${base}?${consulta}` : base;
}

export function SeletorDePeriodo({ base, filtros }) {
  return (
    <div className="segm" role="group" aria-label="Período">
      {PERIODOS.map((opcao) => (
        <Link
          key={opcao}
          href={enderecoDe(base, filtros, { meses: opcao })}
          aria-current={opcao === filtros.meses ? 'true' : undefined}
          className={`segm-btn ${opcao === filtros.meses ? 'on' : ''}`}
          scroll={false}
        >
          {opcao} meses
        </Link>
      ))}
    </div>
  );
}

/** Um valor de indicador, ou o aviso de privacidade quando o grupo é pequeno demais. */
export function ValorDoIndicador({ valor, formato, oculto }) {
  if (oculto) {
    return (
      <span className="ind-oculto" title={OCULTO}>
        <Icone nome="lock" tamanho={16} />
        <span>oculto</span>
        <span className="sr-only">: {OCULTO}</span>
      </span>
    );
  }
  return <span className="num">{formatarIndicador(valor, formato)}</span>;
}

/**
 * Tabela de recortes: uma linha por grupo, com as pessoas no quadro e uma
 * coluna por indicador. `colunas` são os indicadores ({ chave, nome }).
 */
export function TabelaDeRecortes({ titulo, linhas, colunas, href }) {
  const grade = `minmax(150px, 1.6fr) 90px ${colunas.map(() => 'minmax(90px, 1fr)').join(' ')}`;
  return (
    <Tabela
      grade={grade}
      colunas={[{ rotulo: titulo }, { rotulo: 'Pessoas', alinha: 'd' }, ...colunas.map((coluna) => ({ rotulo: coluna.nome, alinha: 'd' }))]}
    >
      {linhas.map((linha) => (
        <LinhaTabela key={linha.chave} grade={grade}>
          <Celula>
            {href ? (
              <Link href={href(linha)} className="tb-nome">
                {linha.rotulo}
              </Link>
            ) : (
              <span className="tb-nome">{linha.rotulo}</span>
            )}
          </Celula>
          <Celula rotulo="Pessoas" alinha="d">
            <span className="num">{linha.pessoas}</span>
          </Celula>
          {linha.valores.map((valor, indice) => (
            <Celula key={valor.chave} rotulo={colunas[indice].nome} alinha="d">
              <ValorDoIndicador {...valor} />
            </Celula>
          ))}
        </LinhaTabela>
      ))}
    </Tabela>
  );
}
