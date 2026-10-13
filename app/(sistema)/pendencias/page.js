import { notFound } from 'next/navigation';
import { lerPendencias } from '@/lib/dados/pendencias';
import { ASSUNTOS } from '@/lib/dados/inicio';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { JANELAS } from '@/lib/regrasDePrazo';
import { mensagemParaTela } from '@/lib/avisos';
import { dataCurta } from '@/lib/formato';
import { Cabecalho, Cartao, Faixa, Secao, Vazio, Wrap } from '@/componentes/Estrutura';
import { Seletor } from '@/componentes/Filtros';
import { GrupoDePrazos } from '@/componentes/Prazos';
import { ConcluirRevisao, FilaDePendencias, ItemDaRevisao, ListaDeAprovacoes, Restantes } from '@/componentes/Pendencias';

export const metadata = { title: 'Pendências' };

/** Os assuntos que têm aprovação ou prazo (Ocorrências não tem). */
const ASSUNTOS_COM_PENDENCIA = ASSUNTOS.filter((assunto) => assunto.chave !== 'ocorrencias').map((assunto) => ({
  valor: assunto.chave,
  rotulo: assunto.nome,
}));

const QUANDO = [
  { valor: 'urgente', rotulo: 'Vencido ou em até 2 dias' },
  { valor: 'semana', rotulo: 'Até esta semana' },
  { valor: 'mes', rotulo: 'Até 30 dias' },
];

const GRUPOS = ['vencido', 'semana', 'mes', 'adiante'];

function cabeNoQuando(dias, quando) {
  if (quando === 'urgente') return dias <= JANELAS.urgente;
  if (quando === 'semana') return dias <= JANELAS.semana;
  if (quando === 'mes') return dias <= JANELAS.mes;
  return true;
}

/**
 * Pendências (fase 5 do redesenho): a fila única do que espera a Gestão.
 * A revisão da implantação, quando há; as aprovações, decididas na linha;
 * os prazos, do vencido ao mais distante. Filtros por assunto e por data
 * no endereço (?assunto=ferias&quando=urgente). Módulo novo: só existe na
 * demonstração.
 */
export default async function Pendencias({ searchParams }) {
  const parametros = await searchParams;
  const assunto = ASSUNTOS_COM_PENDENCIA.some((item) => item.valor === parametros?.assunto) ? parametros.assunto : null;
  const quando = QUANDO.some((item) => item.valor === parametros?.quando) ? parametros.quando : null;
  const permissoes = await permissoesAtuais();

  let pendencias;
  try {
    pendencias = await lerPendencias();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Pendências" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(erro, 'Não foi possível carregar as pendências agora. Recarregue a página em alguns segundos.')}
          </Faixa>
        </Wrap>
      </>
    );
  }
  if (!pendencias) notFound();

  const quem = permissoes.aprovar ? 'você' : 'a Gestão';
  const doAssunto = (item) => !assunto || item.tema === assunto;
  const aprovacoes = pendencias.aprovacoes
    .filter(doAssunto)
    .filter((item) => !quando || (item.prazo ? cabeNoQuando(item.prazo.dias, quando) : quando !== 'urgente'));
  const prazos = pendencias.prazos.filter((item) => item.grupo !== 'conferir' && doAssunto(item) && cabeNoQuando(item.dias, quando));
  const revisao = pendencias.revisao.filter(doAssunto);
  const faltamConferir = pendencias.revisao.filter((item) => !item.conferido).length;
  const vencidos = prazos.filter((item) => item.grupo === 'vencido').length;
  const filtrado = Boolean(assunto || quando);

  return (
    <FilaDePendencias>
      <Cabecalho
        titulo="Pendências"
        subtitulo={
          <>
            <Restantes
              ids={aprovacoes.map((item) => item.id)}
              um={`# aprovação esperando ${quem}`}
              varios={`# aprovações esperando ${quem}`}
              nenhum={`Nenhuma aprovação esperando ${quem}`}
            />
            {vencidos ? ` · ${vencidos} ${vencidos === 1 ? 'prazo vencido' : 'prazos vencidos'}` : ''}
            {filtrado ? ' · com filtro' : ''}
          </>
        }
      >
        <Seletor chave="assunto" rotulo="Todos os assuntos" opcoes={ASSUNTOS_COM_PENDENCIA} />
        <Seletor chave="quando" rotulo="Qualquer data" opcoes={QUANDO} />
      </Cabecalho>

      <Wrap>
        {pendencias.emRevisao && revisao.length ? (
          <section id="revisao" className="sec">
            <div className="sec-cab">
              <h2 className="sec-tit">Revisão da implantação</h2>
              <p className="sec-nota">importado em {dataCurta(pendencias.cliente.implantacao)}</p>
            </div>
            <Cartao liso>
              <p className="revisao-intro">
                Confira o que parece inconsistente nos dados importados. O que venceu antes da implantação aparece
                aqui, e não como vencido; os alertas de prazo começam quando a revisão terminar.
              </p>
              <ul className="linhas revisao-l">
                {revisao.map((item) => (
                  <ItemDaRevisao key={item.id} item={item} podeConferir={permissoes.aprovar} />
                ))}
              </ul>
              {permissoes.aprovar && !assunto ? <ConcluirRevisao faltam={faltamConferir} /> : null}
            </Cartao>
          </section>
        ) : null}

        <Secao titulo={`Esperando ${quem}`} nota={permissoes.aprovar ? 'aprove, rejeite ou conclua na linha' : 'só consulta'}>
          <Cartao liso>
            <ListaDeAprovacoes
              itens={aprovacoes}
              podeAprovar={permissoes.aprovar}
              vazio={filtrado ? 'Nada esperando aprovação com este filtro.' : 'Nada esperando aprovação.'}
            />
          </Cartao>
        </Secao>

        <Secao titulo="Prazos" nota="do vencido ao mais distante, até 60 dias">
          <Cartao liso>
            {prazos.length === 0 ? (
              <Vazio icone="event_available">
                {filtrado ? 'Nenhum prazo com este filtro.' : 'Nenhum prazo nos próximos 60 dias.'}
              </Vazio>
            ) : (
              <div className="grupos-prazos">
                {GRUPOS.map((grupo) => (
                  <GrupoDePrazos
                    key={grupo}
                    grupo={grupo}
                    itens={prazos.filter((item) => item.grupo === grupo)}
                    limite={grupo === 'adiante' ? 5 : null}
                  />
                ))}
              </div>
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </FilaDePendencias>
  );
}
