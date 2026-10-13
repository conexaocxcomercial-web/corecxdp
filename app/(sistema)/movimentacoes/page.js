import { listarMovimentacoes } from '@/lib/dados/lancamentos';
import { mensagemParaTela } from '@/lib/avisos';
import { TIPOS_DE_MOVIMENTACAO } from '@/lib/lancamentos';
import { emReais, formatarData, paraBusca } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Tabela, Vazio, Wrap } from '@/componentes/Estrutura';
import { Busca, Seletor } from '@/componentes/Filtros';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { BotaoDeMostrar, ProtecaoDeValores, ValorProtegido } from '@/componentes/Valores';

export const metadata = { title: 'Movimentações' };

const GRADE = '1.5fr 120px 1fr 1.4fr 1.6fr';

/**
 * Movimentações (fase 8 do redesenho): reajuste, promoção, mudança de cargo
 * e transferência, com "passa a valer em" e o que muda. Desligamento e
 * afastamento têm telas próprias; o checklist saiu.
 */
export default async function Movimentacoes({ searchParams }) {
  const parametros = await searchParams;
  let lista;
  try {
    lista = await listarMovimentacoes();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Movimentações" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar as movimentações agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { itens, hoje, cnpjs } = lista;
  const busca = paraBusca(parametros?.busca || '');
  const tipo = TIPOS_DE_MOVIMENTACAO.includes(parametros?.tipo) ? parametros.tipo : '';
  const filtradas = itens.filter((item) => {
    if (busca && ![item.pessoa?.nome, item.pessoa?.matricula, item.motivo].some((campo) => paraBusca(campo).includes(busca))) return false;
    return !tipo || item.tipo === tipo;
  });
  const futuras = itens.filter((item) => item.efetiva > hoje).length;
  const comSalario = filtradas.some((item) => item.novo?.salario);
  const unidade = (id) => cnpjs.find((item) => item.id === id)?.nome.split(' · ').pop() || id;

  return (
    <ProtecaoDeValores>
      <Cabecalho
        titulo="Movimentações"
        subtitulo={`${filtradas.length} de ${itens.length}${futuras ? ` · ${futuras} ${futuras === 1 ? 'passa' : 'passam'} a valer mais adiante` : ''}`}
        acoes={
          <>
            {comSalario ? <BotaoDeMostrar rotulo="salários" /> : null}
            <BotaoDeLancar tipo="movimentacao" rotulo="Registrar" />
          </>
        }
      >
        <Busca placeholder="Buscar por nome, matrícula ou motivo" />
        <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={TIPOS_DE_MOVIMENTACAO} />
      </Cabecalho>

      <Wrap>
        <Cartao liso>
          {filtradas.length === 0 ? (
            <Vazio icone={itens.length === 0 ? 'swap_horiz' : 'search_off'}>
              {itens.length === 0 ? 'Nenhuma movimentação registrada. Reajustes, promoções e transferências aparecem aqui.' : 'Nenhuma movimentação com este filtro.'}
            </Vazio>
          ) : (
            <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Passa a valer' }, { rotulo: 'Tipo' }, { rotulo: 'O que muda' }, { rotulo: 'Motivo' }]}>
              {filtradas.map((item) => (
                <LinhaTabela key={item.id} grade={GRADE}>
                  <Celula>
                    {item.pessoa ? <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=movimentacoes`}>{item.pessoa.nome}</Nome> : item.matricula}
                    {item.registrado_por ? <span className="tb-sub">registrado por {item.registrado_por}</span> : null}
                  </Celula>
                  <Celula rotulo="Passa a valer" alinha="c">
                    <span className="num">{formatarData(item.efetiva)}</span>
                    {item.efetiva > hoje ? <span className="tb-sub">mais adiante</span> : null}
                  </Celula>
                  <Celula rotulo="Tipo" alinha="c">
                    <span className="tb-nome">{item.tipo}</span>
                  </Celula>
                  <Celula rotulo="O que muda" alinha="c">
                    <span className="text-[var(--tinta-2)]">
                      {item.novo ? (
                        <>
                          {item.novo.cargo ? <span className="tb-linha">cargo: {item.novo.cargo}</span> : null}
                          {item.novo.salario ? (
                            <span className="tb-linha">
                              salário: <ValorProtegido valor={emReais(item.novo.salario)} mascara="R$ •••••" rotulo="Novo salário" />
                            </span>
                          ) : null}
                          {item.novo.departamento ? <span className="tb-linha">departamento: {item.novo.departamento}</span> : null}
                          {item.novo.cnpj_id ? <span className="tb-linha">unidade: {unidade(item.novo.cnpj_id)}</span> : null}
                        </>
                      ) : item.percentual ? (
                        `reajuste de ${String(item.percentual).replace('.', ',')}%`
                      ) : (
                        '—'
                      )}
                    </span>
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
    </ProtecaoDeValores>
  );
}
