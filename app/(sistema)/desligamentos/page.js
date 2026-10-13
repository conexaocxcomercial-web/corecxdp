import { listarDesligamentos } from '@/lib/dados/entradasESaidas';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { TIPOS_DE_DESLIGAMENTO } from '@/lib/lancamentos';
import { grupoDoPrazo } from '@/lib/prazos';
import { emReais, formatarData } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Seletor } from '@/componentes/Filtros';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { InformarCustos } from '@/componentes/Custos';
import { ConcluirDesligamento } from '@/componentes/Desligamentos';
import { Passos } from '@/componentes/Passos';
import { Prazo } from '@/componentes/Prazos';
import { Status } from '@/componentes/Sinais';

export const metadata = { title: 'Desligamentos' };

const GRADE = '1.5fr 120px 1.4fr 1.1fr 120px';

const ficha = (pessoa) => `/colaboradores/${encodeURIComponent(pessoa.matricula)}?aba=desligamento`;

/**
 * Desligamentos (fase 9 do redesenho): os que faltam concluir, com o prazo
 * da rescisão (10 dias, no dia útil anterior) e os custos demissionais
 * informados pela empresa; e os dos últimos 12 meses. Nada aqui é rescisão
 * calculada: cálculos trabalhistas são da contabilidade.
 */
export default async function Desligamentos({ searchParams }) {
  const parametros = await searchParams;
  const permissoes = await permissoesAtuais();
  let lista;
  try {
    lista = await listarDesligamentos();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Desligamentos" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar os desligamentos agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { abertos, itens, numeros, completo } = lista;
  const tipo = TIPOS_DE_DESLIGAMENTO.includes(parametros?.tipo) ? parametros.tipo : '';
  const filtrados = itens.filter((item) => !tipo || item.tipo === tipo);
  const podeLancar = completo && permissoes.lancar;
  const marcados = numeros.marcados ? ` · ${numeros.marcados} ${numeros.marcados === 1 ? 'marcado' : 'marcados'} para os próximos dias` : '';
  const notaDaLista = `custos informados pela empresa, não calculados${marcados}`;

  return (
    <>
      <Cabecalho
        titulo="Desligamentos"
        subtitulo={`${numeros.abertos} para concluir · ${numeros.desligamentos} nos últimos 12 meses`}
        acoes={<BotaoDeLancar tipo="desligamento" rotulo="Desligar" icone="person_remove" />}
      >
        {completo ? <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={TIPOS_DE_DESLIGAMENTO} /> : null}
      </Cabecalho>

      <Wrap>
        <Numeros>
          <Numero rotulo="Para concluir" valor={numeros.abertos} tom={numeros.abertos ? 'var(--atencao)' : undefined} apoio="rescisão em 10 dias" />
          <Numero rotulo="Desligamentos em 12 meses" valor={numeros.desligamentos} href="/indicadores/quadro/turnover" apoio="turnover em Indicadores" />
          <Numero
            rotulo="Custo demissional informado"
            valor={emReais(numeros.custoInformado)}
            apoio={
              numeros.comCusto
                ? `média de ${emReais(numeros.custoMedio)}${numeros.semCusto ? ` · ${numeros.semCusto} sem custos` : ''}`
                : 'nenhum custo informado ainda'
            }
          />
        </Numeros>

        <Secao titulo="Para concluir" nota="concluir quando a rescisão estiver paga">
          {abertos.length === 0 ? (
            <Cartao liso>
              <Vazio icone="task_alt">Nenhum desligamento para concluir.</Vazio>
            </Cartao>
          ) : (
            <div className="es-lista">
              {abertos.map((item) => (
                <Cartao key={item.id} className="es-cartao">
                  <div className="es-cab">
                    <span className="es-quem">
                      <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">{[item.tipo, item.pessoa.cargo].filter(Boolean).join(' · ')}</span>
                    </span>
                    <Prazo dias={item.prazo.dias} grupo={grupoDoPrazo(item.prazo.dias)} data={item.prazo.data} />
                  </div>
                  <Passos passos={item.passos} />
                  {podeLancar || permissoes.aprovar ? (
                    <div className="es-pe">
                      {podeLancar ? (
                        <InformarCustos matricula={item.pessoa.matricula} nome={item.pessoa.nome} momento="desligamento" custo={item.custo} variante="fant" />
                      ) : null}
                      {completo && permissoes.aprovar ? <ConcluirDesligamento id={item.id} nome={item.pessoa.nome} /> : null}
                    </div>
                  ) : null}
                </Cartao>
              ))}
            </div>
          )}
        </Secao>

        <Secao titulo="Últimos 12 meses" nota={notaDaLista}>
          <Cartao liso>
            {filtrados.length === 0 ? (
              <Vazio icone={itens.length === 0 ? 'person_remove' : 'search_off'}>
                {itens.length === 0 ? 'Nenhum desligamento nos últimos 12 meses.' : 'Nenhum desligamento deste tipo.'}
              </Vazio>
            ) : (
              <Tabela
                grade={GRADE}
                colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Último dia', alinha: 'd' }, { rotulo: 'Tipo e motivo' }, { rotulo: 'Custos', alinha: 'd' }, { rotulo: 'Situação' }]}
              >
                {filtrados.map((item) => (
                  <LinhaTabela key={item.id} grade={GRADE}>
                    <Celula>
                      <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">{[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}</span>
                    </Celula>
                    <Celula rotulo="Último dia" alinha="d">
                      <span className="num">{formatarData(item.data)}</span>
                      {item.futuro ? <span className="tb-sub">marcado</span> : null}
                    </Celula>
                    <Celula rotulo="Tipo e motivo" alinha="c">
                      <span>{item.tipo || '—'}</span>
                      {item.motivo ? <span className="tb-sub">{item.motivo}</span> : null}
                    </Celula>
                    <Celula rotulo="Custos" alinha="d">
                      <span className="linha-situacao fim">
                        {item.custo ? <span className="num">{emReais(item.custo.total)}</span> : <span className="text-[var(--tinta-3)]">—</span>}
                        {podeLancar && item.concluido ? (
                          <InformarCustos matricula={item.pessoa.matricula} nome={item.pessoa.nome} momento="desligamento" custo={item.custo} curto />
                        ) : null}
                      </span>
                    </Celula>
                    <Celula rotulo="Situação" alinha="c">
                      <Status>{item.concluido ? 'Concluído' : 'Pendente'}</Status>
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
