import { listarOcorrencias } from '@/lib/dados/lancamentos';
import { mensagemParaTela } from '@/lib/avisos';
import { TIPOS_DE_OCORRENCIA } from '@/lib/lancamentos';
import { diaDe, isoDe } from '@/lib/calendario';
import { formatarData, paraBusca, plural } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Tabela, Vazio, Wrap } from '@/componentes/Estrutura';
import { Busca, Seletor } from '@/componentes/Filtros';
import { Status } from '@/componentes/Sinais';
import { BotaoDeLancar } from '@/componentes/Lancar';

export const metadata = { title: 'Ocorrências' };

const PERIODOS = [
  { valor: '30', rotulo: 'Últimos 30 dias' },
  { valor: '90', rotulo: 'Últimos 90 dias' },
  { valor: '365', rotulo: 'Últimos 12 meses' },
];

const GRADE = '1.5fr 110px 1fr 110px 2fr';

/** Ocorrências (fase 8 do redesenho): faltas, atrasos, advertências e suspensões, com quem registrou. */
export default async function Ocorrencias({ searchParams }) {
  const parametros = await searchParams;
  let lista;
  try {
    lista = await listarOcorrencias();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Ocorrências" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar as ocorrências agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { itens, hoje } = lista;
  const busca = paraBusca(parametros?.busca || '');
  const tipo = TIPOS_DE_OCORRENCIA.includes(parametros?.tipo) ? parametros.tipo : '';
  const periodo = PERIODOS.some((item) => item.valor === parametros?.periodo) ? Number(parametros.periodo) : null;
  const desde = periodo ? isoDe(diaDe(hoje) - periodo) : null;

  const filtradas = itens.filter((item) => {
    if (busca && ![item.pessoa?.nome, item.pessoa?.matricula, item.motivo].some((campo) => paraBusca(campo).includes(busca))) return false;
    if (tipo && item.tipo !== tipo) return false;
    if (desde && item.data < desde) return false;
    return true;
  });
  const injustificadas30 = itens.filter((item) => item.tipo === 'Falta Injustificada' && item.data >= isoDe(diaDe(hoje) - 30)).length;

  return (
    <>
      <Cabecalho
        titulo="Ocorrências"
        subtitulo={`${filtradas.length} de ${itens.length} · ${injustificadas30} ${plural(injustificadas30, 'falta injustificada', 'faltas injustificadas')} em 30 dias`}
        acoes={<BotaoDeLancar tipo="ocorrencia" rotulo="Registrar" />}
      >
        <Busca placeholder="Buscar por nome, matrícula ou motivo" />
        <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={TIPOS_DE_OCORRENCIA} />
        <Seletor chave="periodo" rotulo="Qualquer data" opcoes={PERIODOS} />
      </Cabecalho>

      <Wrap>
        <Cartao liso>
          {filtradas.length === 0 ? (
            <Vazio icone={itens.length === 0 ? 'event_available' : 'search_off'}>
              {itens.length === 0 ? 'Nenhuma ocorrência registrada. Faltas, atrasos e advertências aparecem aqui.' : 'Nenhuma ocorrência com este filtro.'}
            </Vazio>
          ) : (
            <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Data' }, { rotulo: 'Tipo' }, { rotulo: 'Justificada' }, { rotulo: 'Motivo' }]}>
              {filtradas.map((item) => (
                <LinhaTabela key={item.id} grade={GRADE}>
                  <Celula>
                    {item.pessoa ? <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=ocorrencias`}>{item.pessoa.nome}</Nome> : item.matricula}
                    {item.registrado_por ? <span className="tb-sub">registrado por {item.registrado_por}</span> : null}
                  </Celula>
                  <Celula rotulo="Data" alinha="c">
                    <span className="num">{formatarData(item.data)}</span>
                  </Celula>
                  <Celula rotulo="Tipo" alinha="c">
                    <span className="tb-nome">{item.tipo}</span>
                  </Celula>
                  <Celula rotulo="Justificada" alinha="c">
                    <Status>{item.justificada}</Status>
                  </Celula>
                  <Celula rotulo="Motivo" alinha="c">
                    <span className="text-[var(--tinta-2)]">{item.motivo || '—'}</span>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          )}
        </Cartao>
      </Wrap>
    </>
  );
}
