import { lerFolha } from '@/lib/dados/folha';
import { mensagemParaTela } from '@/lib/avisos';
import { emReais, emReaisExato, formatarData, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Abas } from '@/componentes/Abas';
import { Seletor } from '@/componentes/Filtros';
import { BarrasH, Serie } from '@/componentes/Graficos';
import { SeloDeEstimativa } from '@/componentes/Estimativa';
import { ValorDoIndicador } from '@/componentes/Indicadores';
import { BotaoDeMostrar, ProtecaoDeValores, ValorProtegido } from '@/componentes/Valores';

export const metadata = { title: 'Folha gerencial' };

const ABAS = [
  { chave: 'resumo', rotulo: 'Resumo do mês' },
  { chave: 'pessoas', rotulo: 'Por colaborador' },
  { chave: 'provisoes', rotulo: 'Provisões e 13º' },
];

const MASCARA = 'R$ •••••';
const fator = (valor) => (valor ? String(valor.toFixed(2)).replace('.', ',') : '—');
const porcento = (fracao) => `${String(Math.round(fracao * 1000) / 10).replace('.', ',')}%`;
const GRADE_PESSOAS = '1.5fr repeat(4, minmax(96px, 1fr)) minmax(110px, 1fr) 70px';
const GRADE_GRUPOS = '1.6fr 80px 1fr 80px';
const GRADE_DECIMO = '1.6fr 70px repeat(3, minmax(100px, 1fr))';

function variacaoDe(atual, anterior) {
  if (!anterior?.total) return null;
  const diferenca = ((atual - anterior.total) / anterior.total) * 100;
  const arredondada = Math.round(diferenca * 10) / 10;
  if (arredondada === 0) return { texto: `igual a ${anterior.rotulo}`, sentido: 'igual', leitura: 'neutro' };
  return {
    texto: `${arredondada > 0 ? '+' : '−'}${String(Math.abs(arredondada)).replace('.', ',')}% sobre ${anterior.rotulo.split(' ')[0]}`,
    sentido: arredondada > 0 ? 'sobe' : 'desce',
    leitura: 'neutro',
  };
}

/**
 * Folha gerencial (fase 12 do redesenho): o custo estimado de pessoal da
 * competência, com a composição, o fator de custo e a evolução; por
 * colaborador (valores mascarados); e as provisões e o 13º, com as parcelas
 * e os vencimentos. Sempre identificada como estimativa: o cálculo oficial é
 * da contabilidade.
 */
export default async function FolhaGerencial({ searchParams }) {
  const parametros = await searchParams;
  let lido;
  try {
    lido = await lerFolha(parametros?.competencia);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Folha gerencial" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível calcular a folha gerencial agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const atual = ABAS.some((aba) => aba.chave === parametros?.aba) ? parametros.aba : 'resumo';
  const { totais, competencia, estimativa } = lido;
  const consulta = competencia.atual ? '' : `competencia=${competencia.valor}`;
  const pessoas = lido.pessoas.length;

  return (
    <ProtecaoDeValores>
      <Cabecalho
        titulo="Folha gerencial"
        subtitulo={`${competencia.rotulo} · ${pessoas} ${plural(pessoas, 'pessoa', 'pessoas')} no quadro${competencia.atual ? ' hoje' : ' no fim do mês'}`}
        acoes={
          <>
            {atual !== 'resumo' ? <BotaoDeMostrar rotulo="valores" /> : null}
            <SeloDeEstimativa texto={estimativa.texto} aviso={estimativa.aviso} percentual={estimativa.percentual} />
          </>
        }
      >
        <Seletor chave="competencia" rotulo="Competência atual" opcoes={lido.competencias.slice(1).map((item) => ({ valor: item.valor, rotulo: item.rotulo }))} />
      </Cabecalho>

      <Wrap>
        {!lido.completo ? <Faixa icone="info">Salários e benefícios ainda não estão cadastrados nesta conta: a folha gerencial aparece quando estiverem.</Faixa> : null}
        {lido.semSalario ? (
          <Faixa icone="info">
            {lido.semSalario} {plural(lido.semSalario, 'pessoa está', 'pessoas estão')} sem salário cadastrado e ficam fora da estimativa.
          </Faixa>
        ) : null}

        <Abas abas={ABAS} atual={atual} base="/folha" consulta={consulta} rotulo="Partes da folha gerencial" />

        {atual === 'resumo' ? (
          <>
            <Numeros>
              <Numero rotulo="Custo estimado de pessoal" valor={emReais(totais.total)} apoio="no mês" variacao={variacaoDe(totais.total, lido.anterior)} href="/indicadores/custos/custo-total" />
              <Numero rotulo="Fator de custo" valor={fator(totais.fatorDeCusto)} apoio="por R$ 1 de salário" href="/indicadores/custos/fator" />
              <Numero rotulo="Salários" valor={emReais(totais.salarios)} apoio={`${pessoas} ${plural(pessoas, 'pessoa', 'pessoas')}`} />
              <Numero rotulo="Encargos" valor={emReais(totais.encargos)} apoio={`${estimativa.percentual} sobre salários e provisões${estimativa.aviso ? ` · ${estimativa.aviso}` : ''}`} />
            </Numeros>

            <div className="duas folha-graficos">
              <Cartao titulo="Composição do custo" descricao="De onde vem cada real do custo estimado.">
                <BarrasH
                  itens={lido.composicao.map((parte) => ({ rotulo: parte.rotulo, valor: Math.round(parte.valor), sub: porcento(parte.fracao) }))}
                  formatar={(valor) => emReais(valor)}
                />
              </Cartao>
              <Cartao titulo="Custo estimado, mês a mês" descricao="Os últimos 12 meses; o mês atual vai até hoje.">
                <Serie itens={lido.serie} rotulo="Custo estimado de pessoal, mês a mês" formatar={(valor) => `${Math.round(valor / 1000)} mil`} />
              </Cartao>
            </div>

            {lido.porUnidade.length ? (
              <Secao titulo="Por unidade">
                <Cartao liso>
                  <TabelaDeGrupos grupos={lido.porUnidade} titulo="Unidade" />
                </Cartao>
              </Secao>
            ) : null}
            <Secao titulo="Por departamento" nota="do maior custo para o menor">
              <Cartao liso>
                <TabelaDeGrupos grupos={lido.porDepartamento} titulo="Departamento" />
              </Cartao>
            </Secao>
          </>
        ) : null}

        {atual === 'pessoas' ? (
          <Secao titulo="Por colaborador" nota="valores mascarados; o olho mostra">
            <Cartao liso>
              {pessoas === 0 ? (
                <Vazio icone="group">Ninguém no quadro nesta competência.</Vazio>
              ) : (
                <Tabela
                  grade={GRADE_PESSOAS}
                  colunas={[
                    { rotulo: 'Pessoa' },
                    { rotulo: 'Salário', alinha: 'd' },
                    { rotulo: 'Provisões', alinha: 'd' },
                    { rotulo: 'Encargos', alinha: 'd' },
                    { rotulo: 'Benefícios', alinha: 'd' },
                    { rotulo: 'Custo estimado', alinha: 'd' },
                    { rotulo: 'Fator', alinha: 'd' },
                  ]}
                >
                  {lido.pessoas.map((item) => (
                    <LinhaTabela key={item.pessoa.matricula} grade={GRADE_PESSOAS}>
                      <Celula>
                        <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=remuneracao`}>{item.pessoa.nome}</Nome>
                        <span className="tb-sub">{[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}</span>
                      </Celula>
                      <Celula rotulo="Salário" alinha="d">
                        {item.salario ? <ValorProtegido valor={emReais(item.salario)} mascara={MASCARA} rotulo="Salário" /> : '—'}
                      </Celula>
                      <Celula rotulo="Provisões" alinha="d">
                        <ValorProtegido valor={emReais(item.custo.provisoes.total)} mascara={MASCARA} rotulo="Provisões" />
                      </Celula>
                      <Celula rotulo="Encargos" alinha="d">
                        <ValorProtegido valor={emReais(item.custo.encargos)} mascara={MASCARA} rotulo="Encargos" />
                      </Celula>
                      <Celula rotulo="Benefícios" alinha="d">
                        <ValorProtegido valor={emReais(item.custo.beneficios)} mascara={MASCARA} rotulo="Benefícios" />
                      </Celula>
                      <Celula rotulo="Custo estimado" alinha="d">
                        <ValorProtegido valor={emReais(item.custo.total)} mascara={MASCARA} rotulo="Custo estimado" />
                      </Celula>
                      <Celula rotulo="Fator" alinha="d">
                        <span className="num">{fator(item.custo.fatorDeCusto)}</span>
                      </Celula>
                    </LinhaTabela>
                  ))}
                </Tabela>
              )}
            </Cartao>
          </Secao>
        ) : null}

        {atual === 'provisoes' ? (
          <>
            <Numeros>
              <Numero rotulo="Provisão de férias do mês" valor={emReais(lido.provisoesDoMes.ferias)} apoio="salário ÷ 12, mais 1/3" />
              <Numero rotulo="Provisão de 13º do mês" valor={emReais(lido.provisoesDoMes.decimoTerceiro)} apoio="salário ÷ 12" />
              {lido.decimo.parcelas.map((parcela) => (
                <Numero
                  key={parcela.numero}
                  rotulo={`${parcela.numero}ª parcela do 13º`}
                  valor={emReais(parcela.total)}
                  apoio={`até ${formatarData(parcela.data)}${parcela.nota ? ` (${parcela.nota})` : ''}`}
                />
              ))}
            </Numeros>
            <Faixa icone="info">
              13º de {lido.decimo.ano}, estimado: salário de hoje × meses com 15 dias ou mais de trabalho no ano ÷ 12, metade em cada parcela, sem os descontos (INSS e IRRF ficam com a contabilidade).
            </Faixa>
            <Secao titulo={`13º de ${lido.decimo.ano} por colaborador`} nota="valores mascarados; o olho mostra">
              <Cartao liso>
                <Tabela
                  grade={GRADE_DECIMO}
                  colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Avos', alinha: 'd' }, { rotulo: '1ª parcela', alinha: 'd' }, { rotulo: '2ª parcela', alinha: 'd' }, { rotulo: '13º estimado', alinha: 'd' }]}
                >
                  {lido.decimo.pessoas.map((item) => (
                    <LinhaTabela key={item.pessoa.matricula} grade={GRADE_DECIMO}>
                      <Celula>
                        <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=remuneracao`}>{item.pessoa.nome}</Nome>
                        <span className="tb-sub">{item.pessoa.cargo}</span>
                      </Celula>
                      <Celula rotulo="Avos" alinha="d">
                        <span className="num">{item.avos}/12</span>
                      </Celula>
                      <Celula rotulo="1ª parcela" alinha="d">
                        <ValorProtegido valor={emReaisExato(item.primeira)} mascara={MASCARA} rotulo="1ª parcela" />
                      </Celula>
                      <Celula rotulo="2ª parcela" alinha="d">
                        <ValorProtegido valor={emReaisExato(item.segunda)} mascara={MASCARA} rotulo="2ª parcela" />
                      </Celula>
                      <Celula rotulo="13º estimado" alinha="d">
                        <ValorProtegido valor={emReaisExato(item.estimado)} mascara={MASCARA} rotulo="13º estimado" />
                      </Celula>
                    </LinhaTabela>
                  ))}
                </Tabela>
              </Cartao>
            </Secao>
          </>
        ) : null}
      </Wrap>
    </ProtecaoDeValores>
  );
}

function TabelaDeGrupos({ grupos, titulo }) {
  return (
    <Tabela grade={GRADE_GRUPOS} colunas={[{ rotulo: titulo }, { rotulo: 'Pessoas', alinha: 'd' }, { rotulo: 'Custo estimado', alinha: 'd' }, { rotulo: 'Fator', alinha: 'd' }]}>
      {grupos.map((grupo) => (
        <LinhaTabela key={grupo.chave} grade={GRADE_GRUPOS}>
          <Celula>
            <span className="tb-nome">{grupo.rotulo}</span>
          </Celula>
          <Celula rotulo="Pessoas" alinha="d">
            <span className="num">{grupo.pessoas}</span>
          </Celula>
          {/* Grupo com menos de 3 pessoas revelaria o salário: fica oculto, como na saúde. */}
          <Celula rotulo="Custo estimado" alinha="d">
            {grupo.pessoas < 3 ? <ValorDoIndicador oculto /> : <span className="num">{emReais(grupo.totais.total)}</span>}
          </Celula>
          <Celula rotulo="Fator" alinha="d">
            {grupo.pessoas < 3 ? <ValorDoIndicador oculto /> : <span className="num">{fator(grupo.totais.fatorDeCusto)}</span>}
          </Celula>
        </LinhaTabela>
      ))}
    </Tabela>
  );
}
