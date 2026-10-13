import { notFound } from 'next/navigation';
import { lerBeneficio } from '@/lib/dados/beneficios';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { emReais, formatarData, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { EncerrarAdesao, FormularioDeBeneficio, IncluirNoBeneficio } from '@/componentes/Beneficios';

export const metadata = { title: 'Benefício' };

const GRADE = '1.6fr 1fr 130px';
const porcento = (valor) => `${String(Math.round(valor * 1000) / 10).replace('.', ',')}%`;

/** Um benefício: os valores, quem tem (com Encerrar) e quem não tem (com Incluir). */
export default async function Beneficio({ params }) {
  const { id } = await params;
  const permissoes = await permissoesAtuais();
  const voltar = { href: '/beneficios', rotulo: 'Benefícios' };
  let lido;
  try {
    lido = await lerBeneficio(decodeURIComponent(id));
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Benefício" voltar={voltar} />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar este benefício agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  if (!lido) notFound();

  const { beneficio, completo } = lido;
  const podeMudar = completo && permissoes.lancar;
  const tem = beneficio.aderentes.length;

  return (
    <>
      <Cabecalho
        titulo={beneficio.nome}
        subtitulo={`${beneficio.tipo} · ${tem} de ${tem + beneficio.semEle.length} pessoas do quadro`}
        voltar={voltar}
        acoes={podeMudar ? <FormularioDeBeneficio beneficio={beneficio} variante="fant" /> : null}
      />
      <Wrap>
        <Numeros>
          <Numero rotulo="Empresa paga por pessoa" valor={emReais(beneficio.valor_empresa)} apoio="por mês" />
          <Numero rotulo="Desconto no salário" valor={beneficio.desconto_percentual ? porcento(beneficio.desconto_percentual) : '0%'} apoio="aplicado na folha pela contabilidade" />
          <Numero rotulo="Custo mensal da empresa" valor={emReais(beneficio.custoMensal)} apoio={`${tem} ${plural(tem, 'pessoa', 'pessoas')}`} />
        </Numeros>

        <Secao titulo="Quem tem" nota="desde quando">
          <Cartao liso>
            {tem === 0 ? (
              <Vazio icone="redeem">Ninguém do quadro tem este benefício.</Vazio>
            ) : (
              <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Desde' }, { rotulo: '' }]}>
                {beneficio.aderentes.map(({ adesao, pessoa }) => (
                  <LinhaTabela key={adesao.id} grade={GRADE}>
                    <Celula>
                      <Nome href={`/colaboradores/${encodeURIComponent(pessoa.matricula)}?aba=remuneracao`}>{pessoa.nome}</Nome>
                      <span className="tb-sub">{[pessoa.cargo, pessoa.departamento].filter(Boolean).join(' · ')}</span>
                    </Celula>
                    <Celula rotulo="Desde" alinha="c">
                      <span className="num">{adesao.desde ? formatarData(adesao.desde) : '—'}</span>
                      {adesao.ate ? <span className="tb-sub">até {formatarData(adesao.ate)}</span> : null}
                    </Celula>
                    <Celula rotulo="" alinha="d">
                      {podeMudar && !adesao.ate ? <EncerrarAdesao adesao={adesao.id} nome={pessoa.nome} nomeDoBeneficio={beneficio.nome} /> : null}
                    </Celula>
                  </LinhaTabela>
                ))}
              </Tabela>
            )}
          </Cartao>
        </Secao>

        <Secao titulo="Quem não tem" nota={`${beneficio.semEle.length} ${plural(beneficio.semEle.length, 'pessoa', 'pessoas')} no quadro`}>
          <Cartao liso>
            {beneficio.semEle.length === 0 ? (
              <Vazio icone="task_alt">Todo mundo no quadro tem este benefício.</Vazio>
            ) : (
              <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Departamento' }, { rotulo: '' }]}>
                {beneficio.semEle.map((pessoa) => (
                  <LinhaTabela key={pessoa.matricula} grade={GRADE}>
                    <Celula>
                      <Nome href={`/colaboradores/${encodeURIComponent(pessoa.matricula)}?aba=remuneracao`}>{pessoa.nome}</Nome>
                      <span className="tb-sub">{pessoa.cargo}</span>
                    </Celula>
                    <Celula rotulo="Departamento" alinha="c">
                      <span className="text-[var(--tinta-2)]">{pessoa.departamento || '—'}</span>
                    </Celula>
                    <Celula rotulo="" alinha="d">
                      {podeMudar ? <IncluirNoBeneficio beneficio={beneficio.id} matricula={pessoa.matricula} nome={pessoa.nome} nomeDoBeneficio={beneficio.nome} /> : null}
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
