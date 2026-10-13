import { Celula, LinhaTabela, Tabela } from '@/componentes/Estrutura';
import { BotaoConsultar } from '@/componentes/EscolhaDeCliente';
import { Status } from '@/componentes/Sinais';
import { emReais } from '@/lib/formato';

/*
 * A comparação entre os clientes do parceiro (fase 15 do redesenho): uma
 * linha por cliente, com os números lado a lado e o que pede atenção. A
 * mesma tabela vai para a tela, para a página de imprimir e para o CSV.
 */

const GRADE = 'minmax(170px, 1.6fr) 80px 120px 70px 90px 110px minmax(150px, 1.3fr) 130px';
const decimal = (valor, casas = 1) => (valor === null || valor === undefined ? '—' : String((Math.round(valor * 10 ** casas) / 10 ** casas).toFixed(casas)).replace('.', ','));

export function ComparacaoDeClientes({ clientes, parceiro, imprimir = false }) {
  const grade = imprimir ? GRADE.replace(/ 130px$/, '') : GRADE;
  const colunas = [
    { rotulo: 'Cliente' },
    { rotulo: 'Pessoas', alinha: 'd' },
    { rotulo: 'Custo estimado', alinha: 'd' },
    { rotulo: 'Fator', alinha: 'd' },
    { rotulo: 'Turnover', alinha: 'd' },
    { rotulo: 'Absenteísmo', alinha: 'd' },
    { rotulo: 'Pede atenção' },
    ...(imprimir ? [] : [{ rotulo: '' }]),
  ];
  return (
    <Tabela grade={grade} colunas={colunas}>
      {clientes.map((cliente) => (
        <LinhaTabela key={cliente.id} grade={grade}>
          <Celula>
            <span className="tb-nome">{cliente.nome}</span>
            <span className="tb-sub">
              {[cliente.regime, cliente.emRevisao ? 'implantação em revisão' : null].filter(Boolean).join(' · ')}
            </span>
          </Celula>
          <Celula rotulo="Pessoas" alinha="d">
            <span className="num">{cliente.pessoas}</span>
          </Celula>
          <Celula rotulo="Custo estimado" alinha="d">
            <span className="num">{emReais(cliente.custo)}</span>
          </Celula>
          <Celula rotulo="Fator" alinha="d">
            <span className="num">{decimal(cliente.fator, 2)}</span>
          </Celula>
          <Celula rotulo="Turnover (12 meses)" alinha="d">
            <span className="num">{decimal(cliente.turnover)}%</span>
          </Celula>
          <Celula rotulo="Absenteísmo (3 meses)" alinha="d">
            {cliente.absenteismoOculto ? <span className="text-[var(--tinta-3)]">oculto</span> : <span className="num">{decimal(cliente.absenteismo)}%</span>}
          </Celula>
          <Celula rotulo="Pede atenção" alinha="c">
            {cliente.motivos.length || cliente.feriasVencidas ? (
              <span className="cart-atencao">
                {cliente.motivos.map((motivo) => (
                  <span key={motivo}>{motivo}</span>
                ))}
                {cliente.feriasVencidas ? <span>{cliente.feriasVencidas} com férias vencidas</span> : null}
              </span>
            ) : (
              <Status>Em dia</Status>
            )}
          </Celula>
          {imprimir ? null : (
            <Celula rotulo="" alinha="d">
              <BotaoConsultar parceiro={cliente.parceiro_id || parceiro?.id} cliente={cliente.id} nome={cliente.nome} />
            </Celula>
          )}
        </LinhaTabela>
      ))}
    </Tabela>
  );
}
