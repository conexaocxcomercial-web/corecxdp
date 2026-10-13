import { listarAfastamentos } from '@/lib/dados/lancamentos';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { TIPOS_DE_AFASTAMENTO } from '@/lib/lancamentos';
import { afastadoEm } from '@/lib/pessoas';
import { diaDe, isoDe } from '@/lib/calendario';
import { formatarData, paraBusca, plural } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Tabela, Vazio, Wrap } from '@/componentes/Estrutura';
import { Busca, Seletor } from '@/componentes/Filtros';
import { Status } from '@/componentes/Sinais';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { RegistrarRetorno, ValidacaoNaLinha } from '@/componentes/Afastamentos';

export const metadata = { title: 'Atestados e afastamentos' };

const SITUACOES = [
  { valor: 'em-curso', rotulo: 'Em curso' },
  { valor: 'encerrado', rotulo: 'Encerrados' },
];
const VALIDACOES = [
  { valor: 'Pendente', rotulo: 'Atestado para validar' },
  { valor: 'Aprovado', rotulo: 'Atestado aprovado' },
  { valor: 'Rejeitado', rotulo: 'Atestado rejeitado' },
  { valor: 'sem', rotulo: 'Sem atestado' },
];

const GRADE = '1.6fr 1.2fr 70px 110px 1.3fr';

/**
 * Atestados e afastamentos (fase 8 do redesenho): todo afastamento com o
 * tipo, o período e, quando houver, o atestado (CID restrito ao Parceiro) e
 * a validação na linha. Quem está afastado ganha "Registrar retorno".
 */
export default async function Afastamentos({ searchParams }) {
  const parametros = await searchParams;
  const permissoes = await permissoesAtuais();
  let lista;
  try {
    lista = await listarAfastamentos();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Atestados e afastamentos" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar os afastamentos agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { itens, hoje, completo } = lista;
  const dia = diaDe(hoje);
  const busca = paraBusca(parametros?.busca || '');
  const tipo = TIPOS_DE_AFASTAMENTO.includes(parametros?.tipo) ? parametros.tipo : '';
  const situacao = SITUACOES.some((item) => item.valor === parametros?.situacao) ? parametros.situacao : '';
  const validacao = VALIDACOES.some((item) => item.valor === parametros?.validacao) ? parametros.validacao : '';

  const emCurso = (item) => afastadoEm(item, dia);
  const filtrados = itens.filter((item) => {
    if (busca && !paraBusca(item.pessoa?.nome).includes(busca) && !paraBusca(item.pessoa?.matricula).includes(busca)) return false;
    if (tipo && item.tipo !== tipo) return false;
    if (situacao === 'em-curso' && !emCurso(item)) return false;
    if (situacao === 'encerrado' && emCurso(item)) return false;
    if (validacao === 'sem' && item.atestado) return false;
    if (validacao && validacao !== 'sem' && item.validacao !== validacao) return false;
    return true;
  });
  const afastadosHoje = new Set(itens.filter(emCurso).map((item) => item.pessoa_id)).size;
  const paraValidar = itens.filter((item) => item.atestado && item.validacao === 'Pendente').length;

  return (
    <>
      <Cabecalho
        titulo="Atestados e afastamentos"
        subtitulo={`${afastadosHoje} ${plural(afastadosHoje, 'pessoa afastada', 'pessoas afastadas')} hoje · ${paraValidar} ${plural(paraValidar, 'atestado', 'atestados')} para validar`}
        acoes={<BotaoDeLancar tipo="afastamento" rotulo="Registrar" />}
      >
        <Busca placeholder="Buscar por nome ou matrícula" />
        {completo ? <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={TIPOS_DE_AFASTAMENTO} /> : null}
        <Seletor chave="situacao" rotulo="Em curso e encerrados" opcoes={SITUACOES} />
        <Seletor chave="validacao" rotulo="Qualquer validação" opcoes={completo ? VALIDACOES : VALIDACOES.slice(0, 3)} />
      </Cabecalho>

      <Wrap>
        {!permissoes.verCid ? (
          <Faixa icone="lock">O CID individual fica com a Gestão da empresa e a Administração (LGPD): aqui ele aparece como Restrito.</Faixa>
        ) : null}
        <Cartao liso>
          {filtrados.length === 0 ? (
            <Vazio icone={itens.length === 0 ? 'clinical_notes' : 'search_off'}>
              {itens.length === 0 ? 'Nenhum afastamento registrado ainda.' : 'Nenhum afastamento com este filtro.'}
            </Vazio>
          ) : (
            <Tabela
              grade={GRADE}
              colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Período' }, { rotulo: 'Dias', alinha: 'd' }, { rotulo: 'CID', alinha: 'd' }, { rotulo: 'Validação' }]}
            >
              {filtrados.map((item) => {
                const curso = emCurso(item);
                const ate = formatarData(item.retorno ? isoDe(diaDe(item.retorno) - 1) : item.fim_previsto);
                const rotulo = `${item.atestado ? 'atestado' : item.tipo.toLowerCase()} de ${item.dias} dias, ${item.pessoa?.nome || ''}`;
                return (
                  <LinhaTabela key={item.id} grade={GRADE}>
                    <Celula>
                      {item.pessoa ? <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=saude`}>{item.pessoa.nome}</Nome> : '—'}
                      <span className="tb-sub">
                        {item.tipo}
                        {item.atestado ? ' · com atestado' : ''}
                        {item.registrado_por ? ` · por ${item.registrado_por}` : ''}
                      </span>
                    </Celula>
                    <Celula rotulo="Período" alinha="c">
                      <span className="num">
                        {formatarData(item.inicio)} a {ate}
                      </span>
                      <span className="tb-sub">
                        {curso ? 'em curso' : item.retorno ? `voltou em ${formatarData(item.retorno)}` : 'encerrado'}
                        {item.inss && curso ? ' · acima de 15 dias' : ''}
                      </span>
                    </Celula>
                    <Celula rotulo="Dias" alinha="d">
                      <span className="num">{item.dias}</span>
                    </Celula>
                    <Celula rotulo="CID" alinha="d">
                      <span className="num text-[var(--tinta-2)]">
                        {!item.atestado ? '—' : item.cidRestrito ? 'Restrito' : item.atestado.cid === 'não informado' ? 'Não informado' : item.atestado.cid || '—'}
                      </span>
                    </Celula>
                    <Celula rotulo="Validação" alinha="c">
                      <span className="linha-situacao">
                        {item.atestado ? <Status>{item.validacao}</Status> : <span className="text-[var(--tinta-3)]">sem atestado</span>}
                        {item.atestado && item.validacao === 'Pendente' && permissoes.aprovar ? <ValidacaoNaLinha id={item.id} rotulo={rotulo} /> : null}
                        {curso && completo && permissoes.lancar ? <RegistrarRetorno id={item.id} nome={item.pessoa?.nome} inicio={item.inicio} /> : null}
                      </span>
                    </Celula>
                  </LinhaTabela>
                );
              })}
            </Tabela>
          )}
        </Cartao>
      </Wrap>
    </>
  );
}
