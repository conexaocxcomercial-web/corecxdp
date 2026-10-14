import Link from 'next/link';
import { notFound } from 'next/navigation';
import { filtrosDoEndereco, lerDetalhe } from '@/lib/dados/indicadores';
import { mensagemParaTela } from '@/lib/avisos';
import { indicadorDe, temaDe } from '@/lib/paineis';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Seletor } from '@/componentes/Filtros';
import { BarrasH, Serie } from '@/componentes/Graficos';
import { SeletorDePeriodo, TabelaDeRecortes, ValorDoIndicador, enderecoDe } from '@/componentes/Indicadores';
import { SeloDeEstimativa } from '@/componentes/Estimativa';

export async function generateMetadata({ params }) {
  const { tema, indicador } = await params;
  return { title: indicadorDe(tema, indicador)?.nome || 'Indicador' };
}
const GRADE = '1.6fr 1fr 1fr';

/**
 * Detalhe de um indicador (fase 10 do redesenho): o número, como é
 * calculado, a evolução, os recortes e as pessoas por trás, cada uma
 * levando à aba certa da ficha. Indicadores de saúde não listam pessoas.
 */
export default async function DetalheDoIndicador({ params, searchParams }) {
  const [{ tema: chaveDoTema, indicador: chave }, parametros] = await Promise.all([params, searchParams]);
  const tema = temaDe(chaveDoTema);
  if (!tema || !indicadorDe(chaveDoTema, chave)) notFound();
  const filtros = filtrosDoEndereco(parametros);
  const voltar = { href: enderecoDe(`/indicadores/${tema.chave}`, filtros), rotulo: tema.nome };

  let lido;
  try {
    lido = await lerDetalhe(chaveDoTema, chave, filtros);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo={indicadorDe(chaveDoTema, chave).nome} voltar={voltar} />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível calcular este indicador agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const base = `/indicadores/${tema.chave}/${lido.chave}`;
  const atuais = { meses: filtros.meses, departamento: lido.departamento };
  const coluna = [{ chave: lido.chave, nome: lido.nome }];
  const linhas = (grupos) => grupos.map((grupo) => ({ ...grupo, valores: [grupo] }));

  return (
    <>
      <Cabecalho
        titulo={lido.nome}
        subtitulo={`${tema.nome} · ${lido.departamento || 'todos os departamentos'} · últimos ${filtros.meses} meses`}
        voltar={voltar}
        acoes={
          <>
            {lido.estimativa ? <SeloDeEstimativa {...lido.estimativa} /> : null}
            <SeletorDePeriodo base={base} filtros={atuais} />
          </>
        }
      >
        {lido.departamentos.length > 1 ? <Seletor chave="departamento" rotulo="Todos os departamentos" opcoes={lido.departamentos} /> : null}
      </Cabecalho>

      <Wrap>
        {lido.oculto ? (
          <Faixa icone="lock">Este grupo tem menos de 3 pessoas: o número fica oculto para ninguém ser identificado (LGPD).</Faixa>
        ) : null}

        <div className="ind-detalhe">
          <Numeros>
            <Numero rotulo={lido.nome} valor={<ValorDoIndicador {...lido} />} apoio={lido.apoio} />
          </Numeros>
          <Cartao titulo="Como é calculado">
            <p className="ind-explicacao">{lido.explicacao}</p>
          </Cartao>
        </div>

        {lido.serie ? (
          <Secao titulo="Mês a mês" nota="o mês atual vai até hoje">
            <Cartao>
              <Serie itens={lido.serie} formato={lido.formato} rotulo={`${lido.nomeDaSerie}, mês a mês`} />
            </Cartao>
          </Secao>
        ) : null}

        {lido.distribuicao?.length ? (
          <Secao titulo={lido.chave === 'tempo-de-casa' ? 'Por faixa de tempo de casa' : 'Por tipo'}>
            <Cartao>
              <BarrasH itens={lido.distribuicao} formato={lido.formatoDaDistribuicao} />
            </Cartao>
          </Secao>
        ) : null}

        {lido.recortes.unidade.length ? (
          <Secao titulo="Por unidade">
            <Cartao liso>
              <TabelaDeRecortes titulo="Unidade" linhas={linhas(lido.recortes.unidade)} colunas={coluna} />
            </Cartao>
          </Secao>
        ) : null}

        {lido.recortes.departamento.length && !lido.departamento ? (
          <Secao titulo="Por departamento" nota={lido.saude || lido.estimativa ? 'grupos com menos de 3 pessoas ficam ocultos' : 'toque no departamento para filtrar'}>
            <Cartao liso>
              <TabelaDeRecortes
                titulo="Departamento"
                linhas={linhas(lido.recortes.departamento)}
                colunas={coluna}
                href={(linha) => enderecoDe(base, atuais, { departamento: linha.chave })}
              />
            </Cartao>
          </Secao>
        ) : null}

        {lido.saude ? (
          <Faixa icone="lock">
            Indicadores de saúde são sempre de grupo, sem a lista de pessoas (LGPD). Os atestados de cada pessoa ficam na ficha, para a Gestão da empresa.
          </Faixa>
        ) : lido.estimativa ? (
          <Faixa icone="lock">
            O custo de cada pessoa revela o salário: os valores individuais ficam na <Link href="/folha?aba=pessoas">folha gerencial</Link>, mascarados.
          </Faixa>
        ) : lido.pessoas ? (
          <Secao titulo="Quem está por trás do número" nota={lido.notaDasPessoas || `${lido.pessoas.length} ${lido.pessoas.length === 1 ? 'pessoa' : 'pessoas'}`}>
            <Cartao liso>
              {lido.pessoas.length === 0 ? (
                <Vazio icone="group">Ninguém neste recorte e período.</Vazio>
              ) : (
                <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Departamento' }, { rotulo: lido.rotuloDoValor, alinha: 'd' }]}>
                  {lido.pessoas.map((item, indice) => (
                    <LinhaTabela key={`${item.pessoa.matricula}-${indice}`} grade={GRADE}>
                      <Celula>
                        <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=${item.aba}`}>{item.pessoa.nome}</Nome>
                        <span className="tb-sub">{[item.pessoa.cargo, item.detalhe].filter(Boolean).join(' · ')}</span>
                      </Celula>
                      <Celula rotulo="Departamento" alinha="c">
                        <span className="text-[var(--tinta-2)]">{item.pessoa.departamento || '—'}</span>
                      </Celula>
                      <Celula rotulo={lido.rotuloDoValor} alinha="d">
                        <span className="num">{item.valor}</span>
                      </Celula>
                    </LinhaTabela>
                  ))}
                </Tabela>
              )}
            </Cartao>
          </Secao>
        ) : null}
      </Wrap>
    </>
  );
}
