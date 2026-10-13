import { lerEmpresa } from '@/lib/dados/empresa';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { formatarData, plural } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Secao, Tabela, Wrap } from '@/componentes/Estrutura';
import { Dados } from '@/componentes/Ficha';
import { AbasDaEmpresa } from '@/componentes/AbasDaEmpresa';
import { FormularioDaEmpresa } from '@/componentes/Empresa';
import { SeloDeEstimativa } from '@/componentes/Estimativa';

export const metadata = { title: 'Dados da empresa' };

const GRADE_UNIDADES = '1.6fr 1.2fr 100px 90px';
const GRADE_DEPARTAMENTOS = '1.6fr 90px';

/**
 * Dados da empresa (fase 14 do redesenho): regime tributário, anexo do
 * Simples e o percentual de encargos (com o aviso de dado a conferir), a
 * data de implantação, as unidades (CNPJs) e os departamentos.
 */
export default async function Empresa() {
  const permissoes = await permissoesAtuais();
  let lido;
  try {
    lido = await lerEmpresa();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Dados da empresa" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar os dados da empresa agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const { cliente, encargos, estimativa, unidades, departamentos, completo } = lido;
  const percentual = estimativa.percentual;

  return (
    <>
      <Cabecalho
        titulo={cliente?.nome || 'Dados da empresa'}
        subtitulo={`${unidades.length} ${plural(unidades.length, 'unidade', 'unidades')} · ${departamentos.length} ${plural(departamentos.length, 'departamento', 'departamentos')}`}
        acoes={completo && permissoes.lancar ? <FormularioDaEmpresa regime={cliente?.regime} anexo={cliente?.anexo} percentual={cliente?.percentual} /> : null}
      />
      <Wrap>
        <AbasDaEmpresa atual="dados" />
        {!completo ? <Faixa icone="info">Os dados da empresa ainda não estão cadastrados nesta conta.</Faixa> : null}
        {encargos.aviso ? (
          <Faixa tom="alerta" icone="warning">
            {encargos.aviso === 'anexo a conferir'
              ? 'Anexo a conferir: sem o anexo do Simples, a estimativa de encargos usa 8% (só o FGTS). No Anexo IV, o INSS patronal é pago à parte; na dúvida, confirme com a contabilidade.'
              : encargos.aviso === 'regime a conferir'
                ? 'Regime a conferir: sem o regime tributário, a estimativa de encargos usa 8%.'
                : 'Percentual a conferir: o percentual configurado está fora do esperado, e a estimativa usa o padrão do regime.'}
          </Faixa>
        ) : null}

        <Secao titulo="Regime e encargos" nota="entram no custo estimado de pessoal" acao={<SeloDeEstimativa {...estimativa} />}>
          <Cartao>
            <Dados
              itens={[
                { rotulo: 'Regime tributário', valor: cliente?.regime || 'regime a conferir' },
                ...(cliente?.regime === 'Simples Nacional' ? [{ rotulo: 'Anexo do Simples', valor: cliente.anexo ? `Anexo ${cliente.anexo}` : 'anexo a conferir' }] : []),
                {
                  rotulo: 'Percentual de encargos',
                  valor: encargos.origem === 'empresa' ? `${percentual}, configurado para a empresa` : `${percentual}, padrão do regime`,
                },
                { rotulo: 'Implantação', valor: cliente?.implantacao ? `${formatarData(cliente.implantacao)}${cliente.emRevisao ? ' (revisão em aberto)' : ''}` : null },
              ]}
            />
          </Cartao>
        </Secao>

        <Secao titulo="Unidades" nota="matriz e filiais">
          <Cartao liso>
            <Tabela grade={GRADE_UNIDADES} colunas={[{ rotulo: 'Unidade' }, { rotulo: 'CNPJ' }, { rotulo: 'Tipo' }, { rotulo: 'Pessoas', alinha: 'd' }]}>
              {unidades.map((unidade) => (
                <LinhaTabela key={unidade.id} grade={GRADE_UNIDADES}>
                  <Celula>
                    <span className="tb-nome">{unidade.nome}</span>
                  </Celula>
                  <Celula rotulo="CNPJ" alinha="c">
                    <span className="num">{unidade.cnpj}</span>
                  </Celula>
                  <Celula rotulo="Tipo" alinha="c">
                    <span className="text-[var(--tinta-2)]">{unidade.tipo === 'matriz' ? 'Matriz' : 'Filial'}</span>
                  </Celula>
                  <Celula rotulo="Pessoas" alinha="d">
                    <span className="num">{unidade.pessoas}</span>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          </Cartao>
        </Secao>

        <Secao titulo="Departamentos" nota="vêm do cadastro das pessoas">
          <Cartao liso>
            <Tabela grade={GRADE_DEPARTAMENTOS} colunas={[{ rotulo: 'Departamento' }, { rotulo: 'Pessoas', alinha: 'd' }]}>
              {departamentos.map((departamento) => (
                <LinhaTabela key={departamento.nome} grade={GRADE_DEPARTAMENTOS}>
                  <Celula>
                    <span className="tb-nome">{departamento.nome}</span>
                  </Celula>
                  <Celula rotulo="Pessoas" alinha="d">
                    <span className="num">{departamento.pessoas}</span>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
