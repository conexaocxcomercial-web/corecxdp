import { lerHistorico } from '@/lib/dados/empresa';
import { mensagemParaTela } from '@/lib/avisos';
import { formatarData, plural, paraBusca } from '@/lib/formato';
import { TIPOS_DO_HISTORICO } from '@/lib/historico';
import { Cabecalho, Cartao, Faixa, Vazio, Wrap } from '@/componentes/Estrutura';
import { Busca, Seletor } from '@/componentes/Filtros';
import { AbasDaEmpresa } from '@/componentes/AbasDaEmpresa';
import Link from 'next/link';

export const metadata = { title: 'Histórico' };

const POR_PAGINA = 80;

/**
 * Histórico de ações (fase 14 do redesenho): quem fez o quê e quando, do
 * mais novo ao mais antigo, com busca por pessoa ou autor e filtro por tipo.
 */
export default async function Historico({ searchParams }) {
  const parametros = await searchParams;
  let lido;
  try {
    lido = await lerHistorico();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Histórico" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar o histórico agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const busca = paraBusca(parametros?.busca || '');
  const tipo = TIPOS_DO_HISTORICO.includes(parametros?.tipo) ? parametros.tipo : '';
  const filtrados = lido.itens.filter(
    (item) =>
      (!tipo || item.tipo === tipo) &&
      (!busca || paraBusca(item.autor).includes(busca) || paraBusca(item.pessoa?.nome).includes(busca) || paraBusca(item.texto).includes(busca))
  );
  const mostrados = filtrados.slice(0, POR_PAGINA);

  return (
    <>
      <Cabecalho titulo="Histórico" subtitulo={`${filtrados.length} ${plural(filtrados.length, 'ação registrada', 'ações registradas')}, com autor e data`}>
        <Busca placeholder="Buscar por pessoa ou por quem fez" />
        <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={TIPOS_DO_HISTORICO} />
      </Cabecalho>
      <Wrap>
        <AbasDaEmpresa atual="historico" />
        <Cartao>
          {mostrados.length === 0 ? (
            <Vazio icone="history">Nenhuma ação com este filtro.</Vazio>
          ) : (
            <ol className="hist" role="list">
              {mostrados.map((item) => (
                <li key={item.id} className="hist-i">
                  <span className="hist-data num">{formatarData(item.em)}</span>
                  <span className="hist-t">
                    <b>{item.autor}</b> {item.texto}
                    {item.pessoa ? (
                      <>
                        {' de '}
                        <Link href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}${item.aba ? `?aba=${item.aba}` : ''}`} className="hist-pessoa">
                          {item.pessoa.nome}
                        </Link>
                      </>
                    ) : null}
                  </span>
                  <span className="hist-tipo">{item.tipo}</span>
                </li>
              ))}
            </ol>
          )}
          {filtrados.length > POR_PAGINA ? <p className="nota hist-mais">Mostrando as {POR_PAGINA} mais recentes. Use a busca ou o tipo para achar as mais antigas.</p> : null}
        </Cartao>
      </Wrap>
    </>
  );
}
