import { notFound } from 'next/navigation';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerAdministracao } from '@/lib/dados/administracao';
import { mensagemParaTela } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import { formatarData } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Tabela, Wrap } from '@/componentes/Estrutura';
import { Seletor } from '@/componentes/Filtros';
import { Status } from '@/componentes/Sinais';
import { AbasDaAdministracao } from '@/componentes/AbasDaAdministracao';
import { BotaoConsultar } from '@/componentes/EscolhaDeCliente';

export const metadata = { title: 'Clientes da plataforma' };

const GRADE = 'minmax(170px, 1.5fr) minmax(140px, 1fr) minmax(150px, 1.1fr) 80px 110px minmax(150px, 1.2fr) 130px';

/** Todos os clientes (fase 16 do redesenho): parceiro, regime e encargos, implantação, usuários e o que pede suporte. */
export default async function ClientesDaPlataforma({ searchParams }) {
  const parametros = await searchParams;
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'administrar')) notFound();
  let lido;
  try {
    lido = await lerAdministracao();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Clientes" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar a administração agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const parceiro = lido.parceiros.some((item) => item.id === parametros?.parceiro) ? parametros.parceiro : '';
  const clientes = lido.clientes.filter((cliente) => !parceiro || cliente.parceiro_id === parceiro);
  const percentual = (valor) => `${String(Math.round(valor * 1000) / 10).replace('.', ',')}%`;
  return (
    <>
      <Cabecalho titulo="Clientes" subtitulo={`${clientes.length} de ${lido.clientes.length} clientes`}>
        <Seletor chave="parceiro" rotulo="Todos os parceiros" opcoes={lido.parceiros.map((item) => ({ valor: item.id, rotulo: item.nome }))} />
      </Cabecalho>
      <Wrap>
        <AbasDaAdministracao atual="clientes" />
        <Cartao liso>
          <Tabela
            grade={GRADE}
            colunas={[{ rotulo: 'Cliente' }, { rotulo: 'Parceiro' }, { rotulo: 'Regime e encargos' }, { rotulo: 'Pessoas', alinha: 'd' }, { rotulo: 'Implantação' }, { rotulo: 'Suporte' }, { rotulo: '' }]}
          >
            {clientes.map((cliente) => (
              <LinhaTabela key={cliente.id} grade={GRADE}>
                <Celula>
                  <span className="tb-nome">{cliente.nome}</span>
                  <span className="tb-sub">
                    {cliente.usuarios} {cliente.usuarios === 1 ? 'usuário' : 'usuários'} da Gestão
                  </span>
                </Celula>
                <Celula rotulo="Parceiro" alinha="c">
                  <span className="text-[var(--tinta-2)]">{cliente.parceiro}</span>
                </Celula>
                <Celula rotulo="Regime e encargos" alinha="c">
                  <span>
                    {cliente.regime || 'regime a conferir'}
                    {cliente.anexo ? `, anexo ${cliente.anexo}` : ''}
                  </span>
                  <span className="tb-sub">
                    {percentual(cliente.percentual)} {cliente.origemDoPercentual === 'empresa' ? 'configurado' : 'padrão'}
                  </span>
                </Celula>
                <Celula rotulo="Pessoas" alinha="d">
                  <span className="num">{cliente.pessoas}</span>
                </Celula>
                <Celula rotulo="Implantação" alinha="c">
                  <span className="num">{cliente.implantacao ? formatarData(cliente.implantacao) : '—'}</span>
                  {cliente.emRevisao ? <span className="tb-sub">revisão em aberto</span> : null}
                </Celula>
                <Celula rotulo="Suporte" alinha="c">
                  {cliente.suporte.length ? <span className="sup-motivos">{cliente.suporte.map((motivo) => <span key={motivo}>{motivo}</span>)}</span> : <Status>Em dia</Status>}
                </Celula>
                <Celula rotulo="" alinha="d">
                  <BotaoConsultar parceiro={cliente.parceiro_id} cliente={cliente.id} nome={cliente.nome} />
                </Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        </Cartao>
      </Wrap>
    </>
  );
}
