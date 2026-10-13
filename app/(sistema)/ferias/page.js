import { listarFerias } from '@/lib/dados/ferias';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { grupoDoPrazo } from '@/lib/prazos';
import { formatarData, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { FilaDePendencias, ListaDeAprovacoes } from '@/componentes/Pendencias';
import { Prazo } from '@/componentes/Prazos';
import { Status } from '@/componentes/Sinais';

export const metadata = { title: 'Férias' };

const ficha = (pessoa) => `/colaboradores/${encodeURIComponent(pessoa.matricula)}?aba=ferias`;
const periodo = (item) => `${formatarData(item.aquisitivo_inicio)} a ${formatarData(item.aquisitivo_fim)}`;
const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
const diasAte = (hoje, data) => Math.round((Date.parse(`${data}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000);

const GRADE_POR_TIRAR = '1.5fr 1.3fr 70px 1.2fr 130px';
const GRADE_PROGRAMADAS = '1.5fr 1.3fr 70px 1fr 1fr 120px';
const GRADE_SALDO = '1.6fr 110px 130px 1.2fr';

/**
 * Férias (fase 11 do redesenho): pedidos para aprovar, vencidas (pagamento
 * em dobro, sem valor calculado), vencendo nos próximos 90 dias, programadas
 * e em andamento com os prazos de aviso e pagamento, e o saldo de cada
 * pessoa do quadro. Programar abre o Lançar › Férias.
 */
export default async function Ferias() {
  const permissoes = await permissoesAtuais();
  let lido;
  try {
    lido = await listarFerias();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Férias" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar as férias agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { numeros, vencidas, vencendo, programadas, saldos, aprovacoes, hoje, completo } = lido;
  const porTirar = [...vencidas, ...vencendo];
  const podeProgramar = completo && permissoes.lancar;
  const quem = permissoes.aprovar ? 'você' : 'a Gestão';

  return (
    <>
      <Cabecalho
        titulo="Férias"
        subtitulo={`${numeros.vencidas} ${plural(numeros.vencidas, 'pessoa com férias vencidas', 'pessoas com férias vencidas')} · ${numeros.deFerias} de férias hoje`}
        acoes={<BotaoDeLancar tipo="ferias" rotulo="Programar férias" icone="beach_access" />}
      />

      <Wrap>
        {!completo ? <Faixa icone="info">As férias ainda não estão cadastradas nesta conta.</Faixa> : null}

        <Numeros>
          <Numero rotulo="Vencidas" valor={numeros.vencidas} tom={numeros.vencidas ? 'var(--critico)' : undefined} apoio="pagamento em dobro" />
          <Numero rotulo="Vencendo em 90 dias" valor={numeros.vencendo} apoio="programar para não vencer" />
          <Numero rotulo="Programadas" valor={numeros.programadas} apoio="começam nos próximos 90 dias" />
          <Numero rotulo="Quadro com férias em dia" valor={`${String(numeros.emDia).replace('.', ',')}%`} apoio="sem nenhum período vencido" href="/indicadores/ferias" />
        </Numeros>

        {aprovacoes.length ? (
          <FilaDePendencias>
            <Secao titulo={`Esperando ${quem}`} nota="pedidos de férias">
              <Cartao liso>
                <ListaDeAprovacoes itens={aprovacoes} podeAprovar={permissoes.aprovar} vazio="Nenhum pedido de férias esperando." />
              </Cartao>
            </Secao>
          </FilaDePendencias>
        ) : null}

        <Secao titulo="Por tirar" nota="vencidas e as que vencem nos próximos 90 dias">
          <Cartao liso>
            {porTirar.length === 0 ? (
              <Vazio icone="beach_access">Nenhuma férias vencida nem vencendo nos próximos 90 dias.</Vazio>
            ) : (
              <Tabela
                grade={GRADE_POR_TIRAR}
                colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Período aquisitivo' }, { rotulo: 'Dias', alinha: 'd' }, { rotulo: 'Prazo' }, { rotulo: '' }]}
              >
                {porTirar.map((item) => {
                  const vencida = item.situacao === 'vencida';
                  const prazo = vencida ? -item.diasVencida : item.dias_ate_limite;
                  return (
                    <LinhaTabela key={item.id} grade={GRADE_POR_TIRAR}>
                      <Celula>
                        <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                        <span className="tb-sub">{[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}</span>
                      </Celula>
                      <Celula rotulo="Período aquisitivo" alinha="c">
                        <span className="num">{periodo(item)}</span>
                      </Celula>
                      <Celula rotulo="Dias" alinha="d">
                        <span className="num">{item.dias}</span>
                      </Celula>
                      <Celula rotulo="Prazo" alinha="c">
                        <span className="linha-situacao">
                          <Prazo dias={prazo} grupo={grupoDoPrazo(prazo)} data={vencida ? item.concessivo_fim : item.limite} />
                          <span className="tb-sub">
                            {vencida
                              ? `venceu em ${formatarData(item.concessivo_fim)}: em dobro`
                              : item.cabem
                                ? `começar até ${formatarData(item.limite)}`
                                : `o que passar de ${formatarData(item.concessivo_fim)} sai em dobro`}
                          </span>
                        </span>
                      </Celula>
                      <Celula rotulo="" alinha="d">
                        {podeProgramar ? (
                          <BotaoDeLancar tipo="ferias" pessoa={{ matricula: item.pessoa.matricula, nome: item.pessoa.nome }} rotulo="Programar" icone="event" variante="fant" mini />
                        ) : null}
                      </Celula>
                    </LinhaTabela>
                  );
                })}
              </Tabela>
            )}
          </Cartao>
        </Secao>

        <Secao titulo="Programadas e em andamento" nota="aviso 30 dias antes; pagamento 2 dias antes, no dia útil anterior">
          <Cartao liso>
            {programadas.length === 0 ? (
              <Vazio icone="event">Nenhuma férias programada.</Vazio>
            ) : (
              <Tabela
                grade={GRADE_PROGRAMADAS}
                colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Gozo' }, { rotulo: 'Dias', alinha: 'd' }, { rotulo: 'Aviso até' }, { rotulo: 'Pagamento até' }, { rotulo: 'Situação' }]}
              >
                {programadas.map((item) => {
                  const andamento = item.situacao === 'em andamento';
                  const aviso = diasAte(hoje, item.aviso);
                  const pagar = diasAte(hoje, item.pagamento);
                  return (
                    <LinhaTabela key={item.id} grade={GRADE_PROGRAMADAS}>
                      <Celula>
                        <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                        <span className="tb-sub">{item.aprovado_por ? `aprovadas por ${item.aprovado_por}` : item.pessoa.cargo}</span>
                      </Celula>
                      <Celula rotulo="Gozo" alinha="c">
                        <span className="num">
                          {formatarData(item.inicio)} a {formatarData(item.fim)}
                        </span>
                      </Celula>
                      <Celula rotulo="Dias" alinha="d">
                        <span className="num">{item.dias}</span>
                      </Celula>
                      <Celula rotulo="Aviso até" alinha="c">
                        {andamento || aviso < 0 ? (
                          <span className="text-[var(--tinta-3)] num">{formatarData(item.aviso)}</span>
                        ) : (
                          <span className="linha-situacao">
                            <span className="num">{formatarData(item.aviso)}</span>
                            <Prazo dias={aviso} grupo={grupoDoPrazo(aviso)} data={item.aviso} />
                          </span>
                        )}
                      </Celula>
                      <Celula rotulo="Pagamento até" alinha="c">
                        {andamento || pagar < 0 ? (
                          <span className="text-[var(--tinta-3)] num">{formatarData(item.pagamento)}</span>
                        ) : (
                          <span className="linha-situacao">
                            <span className="num">{formatarData(item.pagamento)}</span>
                            <Prazo dias={pagar} grupo={grupoDoPrazo(pagar)} data={item.pagamento} />
                          </span>
                        )}
                      </Celula>
                      <Celula rotulo="Situação" alinha="c">
                        <Status>{andamento ? 'Em andamento' : 'Aprovado'}</Status>
                      </Celula>
                    </LinhaTabela>
                  );
                })}
              </Tabela>
            )}
          </Cartao>
        </Secao>

        <Secao titulo="Saldo por pessoa" nota="dias de períodos completos por tirar, mais os do período em aquisição">
          <Cartao liso>
            {saldos.length === 0 ? (
              <Vazio icone="group">Ninguém no quadro com direito a férias ainda.</Vazio>
            ) : (
              <Tabela grade={GRADE_SALDO} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Saldo', alinha: 'd' }, { rotulo: 'Em aquisição', alinha: 'd' }, { rotulo: 'Tirar até' }]}>
                {saldos.map((item) => (
                  <LinhaTabela key={item.pessoa.matricula} grade={GRADE_SALDO}>
                    <Celula>
                      <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">{[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}</span>
                    </Celula>
                    <Celula rotulo="Saldo" alinha="d">
                      <span className="num">{dias(item.dias)}</span>
                    </Celula>
                    <Celula rotulo="Em aquisição" alinha="d">
                      <span className="num text-[var(--tinta-2)]">{String(item.emAquisicao).replace('.', ',')}</span>
                    </Celula>
                    <Celula rotulo="Tirar até" alinha="c">
                      {item.limite ? (
                        <span className="linha-situacao">
                          <span className="num">{formatarData(item.limite)}</span>
                          {item.vencido ? <Status>Vencida</Status> : null}
                        </span>
                      ) : item.proximas ? (
                        <span className="text-[var(--tinta-2)]">
                          {item.proximas.esperando ? 'pedido para ' : 'programadas para '}
                          <span className="num">{formatarData(item.proximas.inicio)}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--tinta-3)]">nada por tirar</span>
                      )}
                    </Celula>
                  </LinhaTabela>
                ))}
              </Tabela>
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
