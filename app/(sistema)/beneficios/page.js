import { listarBeneficios } from '@/lib/dados/beneficios';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { emReais, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { FormularioDeBeneficio } from '@/componentes/Beneficios';

export const metadata = { title: 'Benefícios' };

const GRADE = '1.6fr 120px 130px 1.2fr 130px';
const GRADE_SEM = '1.6fr 1fr';
const porcento = (valor) => `${String(Math.round(valor * 1000) / 10).replace('.', ',')}%`;

/**
 * Benefícios (fase 13 do redesenho): o catálogo com quanto a empresa paga
 * por pessoa, o desconto no salário, quantos têm e o custo mensal; e quem
 * está no quadro sem nenhum benefício. Valores cadastrados, não calculados;
 * o custo entra na folha gerencial.
 */
export default async function Beneficios() {
  const permissoes = await permissoesAtuais();
  let lido;
  try {
    lido = await listarBeneficios();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Benefícios" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar os benefícios agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { catalogo, semNenhum, numeros, completo, peso } = lido;
  const podeMudar = completo && permissoes.lancar;

  return (
    <>
      <Cabecalho
        titulo="Benefícios"
        subtitulo={`${catalogo.length} ${plural(catalogo.length, 'benefício', 'benefícios')} no catálogo · ${numeros.comAlgum} de ${numeros.pessoas} pessoas com algum`}
        acoes={podeMudar ? <FormularioDeBeneficio /> : null}
      />

      <Wrap>
        {!completo ? <Faixa icone="info">Os benefícios ainda não estão cadastrados nesta conta.</Faixa> : null}

        <Numeros>
          <Numero rotulo="Custo mensal da empresa" valor={emReais(numeros.custoMensal)} apoio="soma do que a empresa paga" href="/indicadores/beneficios/custo-mensal" />
          <Numero rotulo="Por pessoa no quadro" valor={emReais(numeros.porPessoa)} apoio="média por mês" />
          <Numero rotulo="Com algum benefício" valor={`${numeros.comAlgum} de ${numeros.pessoas}`} apoio={`${semNenhum.length} sem nenhum`} />
          {peso !== null ? <Numero rotulo="Peso no custo de pessoal" valor={`${String(peso).replace('.', ',')}%`} apoio="do custo estimado do mês" href="/folha" /> : null}
        </Numeros>

        <Secao titulo="Catálogo" nota="o valor é por pessoa, por mês">
          <Cartao liso>
            {catalogo.length === 0 ? (
              <Vazio icone="redeem" acao={podeMudar ? <FormularioDeBeneficio rotulo="Cadastrar o primeiro" /> : null}>
                Nenhum benefício cadastrado. Cadastre o que a empresa oferece (VA, VR, VT, plano de saúde) para o custo entrar na folha gerencial.
              </Vazio>
            ) : (
              <Tabela
                grade={GRADE}
                colunas={[{ rotulo: 'Benefício' }, { rotulo: 'Empresa paga', alinha: 'd' }, { rotulo: 'Desconto', alinha: 'd' }, { rotulo: 'Quem tem' }, { rotulo: 'Custo mensal', alinha: 'd' }]}
              >
                {catalogo.map((beneficio) => {
                  const tem = beneficio.aderentes.length;
                  const total = tem + beneficio.semEle.length;
                  return (
                    <LinhaTabela key={beneficio.id} grade={GRADE}>
                      <Celula>
                        <Nome href={`/beneficios/${encodeURIComponent(beneficio.id)}`}>{beneficio.nome}</Nome>
                        {beneficio.tipo !== beneficio.nome ? <span className="tb-sub">{beneficio.tipo}</span> : null}
                      </Celula>
                      <Celula rotulo="Empresa paga" alinha="d">
                        <span className="num">{emReais(beneficio.valor_empresa)}</span>
                      </Celula>
                      <Celula rotulo="Desconto" alinha="d">
                        <span className="num">{beneficio.desconto_percentual ? `${porcento(beneficio.desconto_percentual)} do salário` : 'sem desconto'}</span>
                      </Celula>
                      <Celula rotulo="Quem tem" alinha="c">
                        <span className="ben-quem">
                          <span className="ben-barra" aria-hidden="true">
                            <span style={{ width: `${total ? (tem / total) * 100 : 0}%` }} />
                          </span>
                          <span className="num">
                            {tem} de {total}
                          </span>
                        </span>
                      </Celula>
                      <Celula rotulo="Custo mensal" alinha="d">
                        <span className="num">{emReais(beneficio.custoMensal)}</span>
                      </Celula>
                    </LinhaTabela>
                  );
                })}
              </Tabela>
            )}
          </Cartao>
        </Secao>

        <Secao titulo="Sem nenhum benefício" nota={`${semNenhum.length} ${plural(semNenhum.length, 'pessoa', 'pessoas')} no quadro`}>
          <Cartao liso>
            {semNenhum.length === 0 ? (
              <Vazio icone="task_alt">Todo mundo no quadro tem ao menos um benefício.</Vazio>
            ) : (
              <Tabela grade={GRADE_SEM} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Departamento' }]}>
                {semNenhum.map((pessoa) => (
                  <LinhaTabela key={pessoa.matricula} grade={GRADE_SEM}>
                    <Celula>
                      <Nome href={`/colaboradores/${encodeURIComponent(pessoa.matricula)}?aba=remuneracao`}>{pessoa.nome}</Nome>
                      <span className="tb-sub">{pessoa.cargo}</span>
                    </Celula>
                    <Celula rotulo="Departamento" alinha="c">
                      <span className="text-[var(--tinta-2)]">{pessoa.departamento || '—'}</span>
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
