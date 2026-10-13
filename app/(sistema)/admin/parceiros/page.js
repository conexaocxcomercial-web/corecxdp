import { notFound } from 'next/navigation';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerAdministracao } from '@/lib/dados/administracao';
import { mensagemParaTela } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Tabela, Wrap } from '@/componentes/Estrutura';
import { AbasDaAdministracao } from '@/componentes/AbasDaAdministracao';

export const metadata = { title: 'Parceiros' };

const GRADE = 'minmax(180px, 1.5fr) 90px 90px 90px minmax(200px, 1.6fr)';

/** Parceiros da plataforma (fase 16 do redesenho), com a marca de cada um e a checagem de contraste. */
export default async function Parceiros() {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'administrar')) notFound();
  let lido;
  try {
    lido = await lerAdministracao();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Parceiros" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar a administração agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  return (
    <>
      <Cabecalho titulo="Parceiros" subtitulo={`${lido.parceiros.length} parceiros`} />
      <Wrap>
        <AbasDaAdministracao atual="parceiros" />
        <Cartao liso>
          <Tabela grade={GRADE} colunas={[{ rotulo: 'Parceiro' }, { rotulo: 'Clientes', alinha: 'd' }, { rotulo: 'Pessoas', alinha: 'd' }, { rotulo: 'Usuários', alinha: 'd' }, { rotulo: 'Marca' }]}>
            {lido.parceiros.map((parceiro) => (
              <LinhaTabela key={parceiro.id} grade={GRADE}>
                <Celula>
                  <span className="tb-nome">{parceiro.nome}</span>
                  {parceiro.ficticio ? <span className="tb-sub">fictício, para a demonstração</span> : null}
                </Celula>
                <Celula rotulo="Clientes" alinha="d">
                  <span className="num">{parceiro.clientes}</span>
                </Celula>
                <Celula rotulo="Pessoas" alinha="d">
                  <span className="num">{parceiro.pessoas}</span>
                </Celula>
                <Celula rotulo="Usuários" alinha="d">
                  <span className="num">{parceiro.usuarios}</span>
                </Celula>
                <Celula rotulo="Marca" alinha="c">
                  <span className="adm-marca">
                    {parceiro.cores ? (
                      <span className="adm-amostras" aria-hidden="true">
                        <span style={{ background: parceiro.cores.violeta }} />
                        <span style={{ background: parceiro.cores.lilas }} />
                      </span>
                    ) : null}
                    <span>{parceiro.marca}</span>
                  </span>
                  {parceiro.checagens.length ? (
                    <span className="tb-sub">
                      contraste: {parceiro.checagens.map((item) => `${String(item.razao).replace('.', ',')}:1`).join(' · ')}
                    </span>
                  ) : null}
                </Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        </Cartao>
        <p className="nota ind-nota">
          As cores de um parceiro só entram se passarem na checagem de contraste (texto sobre o botão, marca sobre o papel claro e o escuro, texto de ação e texto sobre o lilás). Se alguma falhar, os clientes dele veem a marca padrão.
        </p>
      </Wrap>
    </>
  );
}
