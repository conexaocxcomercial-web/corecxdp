import { notFound } from 'next/navigation';
import { lerCarteira } from '@/lib/dados/carteira';
import { alcanceAtual } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { ORDENS } from '@/lib/carteira';
import { pode } from '@/lib/permissoes';
import { emReais, plural } from '@/lib/formato';
import { Cabecalho, Cartao, Faixa, Numero, Numeros, Secao, Vazio, Wrap } from '@/componentes/Estrutura';
import { Seletor } from '@/componentes/Filtros';
import { ComparacaoDeClientes } from '@/componentes/Carteira';
import { Icone } from '@/componentes/Icones';

export const metadata = { title: 'Carteira' };

/**
 * Carteira do parceiro (fase 15 do redesenho): os clientes dele lado a lado
 * (pessoas, custo estimado, fator, turnover, absenteísmo) com o que pede
 * atenção primeiro, "Consultar" para abrir as telas do cliente, e a
 * exportação em CSV e para imprimir. Só na demonstração.
 */
export default async function Carteira({ searchParams }) {
  const parametros = await searchParams;
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'ver-carteira')) notFound();

  let carteira;
  try {
    carteira = await lerCarteira(parametros?.ordem);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Carteira" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar a carteira agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const { numeros, clientes, parceiro } = carteira;

  return (
    <>
      <Cabecalho
        titulo="Carteira"
        subtitulo={`${numeros.clientes} ${plural(numeros.clientes, 'cliente', 'clientes')} de ${parceiro?.nome || 'seu parceiro'}`}
        acoes={
          <>
            <a className="btn btn-fant" href="/exportacoes/carteira.csv" download>
              <Icone nome="download" />
              Exportar CSV
            </a>
            <a className="btn btn-fant" href="/carteira/imprimir" target="_blank" rel="noopener">
              <Icone nome="print" />
              Para imprimir
            </a>
          </>
        }
      >
        <Seletor chave="ordem" rotulo="Ordenar: o que pede atenção primeiro" opcoes={ORDENS.slice(1)} />
      </Cabecalho>
      <Wrap>
        <Numeros>
          <Numero rotulo="Clientes" valor={numeros.clientes} apoio={`${numeros.pedemAtencao} ${plural(numeros.pedemAtencao, 'pede', 'pedem')} atenção`} />
          <Numero rotulo="Pessoas no quadro" valor={numeros.pessoas} apoio="somando todos os clientes" />
          <Numero rotulo="Custo estimado de pessoal" valor={emReais(numeros.custo)} apoio="estimativa, no mês" />
          <Numero rotulo="Prazos vencidos" valor={numeros.vencidos} tom={numeros.vencidos ? 'var(--critico)' : undefined} apoio={`${numeros.aprovacoes} aprovações esperando`} />
        </Numeros>

        <Secao titulo="Clientes lado a lado" nota="turnover em 12 meses, absenteísmo em 3; custo e fator são estimativa">
          <Cartao liso>
            {clientes.length === 0 ? (
              <Vazio icone="domain">Nenhum cliente ligado a este parceiro ainda.</Vazio>
            ) : (
              <ComparacaoDeClientes clientes={clientes} parceiro={parceiro} />
            )}
          </Cartao>
        </Secao>
        <p className="nota ind-nota">
          O parceiro consulta e exporta; lançar e aprovar ficam com a Gestão de cada cliente. As aprovações esperando aparecem aqui para o parceiro saber onde está o atraso.
        </p>
      </Wrap>
    </>
  );
}
