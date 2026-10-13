import { notFound } from 'next/navigation';
import { filtrosDoEndereco, lerPainel } from '@/lib/dados/indicadores';
import { mensagemParaTela } from '@/lib/avisos';
import { casasDoFormato, temaDe } from '@/lib/paineis';
import { Cabecalho, Cartao, Faixa, Numero, Numeros, Secao, Wrap } from '@/componentes/Estrutura';
import { Seletor } from '@/componentes/Filtros';
import { Serie } from '@/componentes/Graficos';
import { SeletorDePeriodo, TabelaDeRecortes, ValorDoIndicador, enderecoDe } from '@/componentes/Indicadores';
import { SeloDeEstimativa } from '@/componentes/Estimativa';

export async function generateMetadata({ params }) {
  const { tema } = await params;
  return { title: temaDe(tema)?.nome || 'Indicadores' };
}

const SUFIXO = { percentual: '%' };

/**
 * Painel de um tema (fase 10 do redesenho): os números do tema, cada um
 * levando ao detalhe; a evolução mês a mês; e a tabela por unidade e por
 * departamento. Período e departamento ficam no endereço.
 */
export default async function PainelDoTema({ params, searchParams }) {
  const [{ tema: chave }, parametros] = await Promise.all([params, searchParams]);
  if (!temaDe(chave)) notFound();
  const filtros = filtrosDoEndereco(parametros);
  const voltar = { href: enderecoDe('/indicadores', { meses: filtros.meses }), rotulo: 'Indicadores' };

  let lido;
  try {
    lido = await lerPainel(chave, filtros);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo={temaDe(chave).nome} voltar={voltar} />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível calcular este painel agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { tema, indicadores, tabela, oculto, departamentos } = lido;
  const base = `/indicadores/${tema.chave}`;
  const atuais = { meses: filtros.meses, departamento: lido.departamento };
  const comSerie = indicadores.filter((item) => item.serie);
  const colunas = indicadores.map((item) => ({ chave: item.chave, nome: item.nome }));

  return (
    <>
      <Cabecalho
        titulo={tema.nome}
        subtitulo={`${lido.departamento || 'Todos os departamentos'} · últimos ${filtros.meses} meses`}
        voltar={voltar}
        acoes={
          <>
            {lido.estimativa ? <SeloDeEstimativa {...lido.estimativa} /> : null}
            <SeletorDePeriodo base={base} filtros={atuais} />
          </>
        }
      >
        {departamentos.length > 1 ? <Seletor chave="departamento" rotulo="Todos os departamentos" opcoes={departamentos} /> : null}
      </Cabecalho>

      <Wrap>
        {oculto ? (
          <Faixa icone="lock">
            Este grupo tem menos de 3 pessoas: os números de {tema.chave === 'custos' ? 'custo' : 'saúde'} ficam ocultos para ninguém ser identificado (LGPD).
          </Faixa>
        ) : null}

        <Numeros>
          {indicadores.map((item) => (
            <Numero
              key={item.chave}
              rotulo={item.nome}
              valor={<ValorDoIndicador {...item} />}
              apoio={item.apoio}
              href={enderecoDe(`${base}/${item.chave}`, atuais)}
            />
          ))}
        </Numeros>

        {comSerie.length ? (
          <Secao titulo="Mês a mês" nota={`os últimos ${filtros.meses} meses; o mês atual vai até hoje`}>
            <div className="duas">
              {comSerie.map((item) => (
                <Cartao key={item.chave} titulo={item.nomeDaSerie}>
                  <Serie itens={item.serie} casas={casasDoFormato(item.formato)} sufixo={SUFIXO[item.formato] || ''} rotulo={`${item.nome}, mês a mês`} />
                </Cartao>
              ))}
            </div>
          </Secao>
        ) : null}

        {tabela.unidade.length ? (
          <Secao titulo="Por unidade" nota="matriz e filiais">
            <Cartao liso>
              <TabelaDeRecortes titulo="Unidade" linhas={tabela.unidade} colunas={colunas} />
            </Cartao>
          </Secao>
        ) : null}

        {tabela.departamento.length && !lido.departamento ? (
          <Secao titulo="Por departamento" nota={['saude', 'custos'].includes(tema.chave) ? 'grupos com menos de 3 pessoas ficam ocultos' : 'toque no departamento para filtrar o painel'}>
            <Cartao liso>
              <TabelaDeRecortes
                titulo="Departamento"
                linhas={tabela.departamento}
                colunas={colunas}
                href={(linha) => enderecoDe(base, atuais, { departamento: linha.chave })}
              />
            </Cartao>
          </Secao>
        ) : null}
      </Wrap>
    </>
  );
}
