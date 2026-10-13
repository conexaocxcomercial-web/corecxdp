import { notFound } from 'next/navigation';
import { mensagemParaTela, resumirClientes } from '@/lib/registros';
import { alcanceAtual } from '@/lib/dados/alcance';
import { pode } from '@/lib/permissoes';
import { plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Faixa, Numero, Numeros, Secao, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { TabelaDeClientes } from '@/componentes/EscolhaDeCliente';

export const metadata = { title: 'Carteira' };

/**
 * Carteira do parceiro (versão inicial, fase 3 do redesenho): os clientes
 * dele com os números que já existem e o "Consultar". A carteira completa,
 * com custo, turnover e clientes que pedem atenção, é a fase 15.
 * Módulo novo: só existe na demonstração.
 */
export default async function Carteira() {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'ver-carteira')) notFound();

  let clientes;
  try {
    clientes = await resumirClientes();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Carteira" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(erro, 'Não foi possível carregar a carteira agora. Recarregue a página em alguns segundos.')}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const ativos = clientes.reduce((soma, cliente) => soma + cliente.ativos, 0);
  const pendentes = clientes.reduce((soma, cliente) => soma + cliente.pendentes, 0);

  return (
    <>
      <Cabecalho
        titulo="Carteira"
        subtitulo={`${clientes.length} ${plural(clientes.length, 'cliente', 'clientes')} de ${alcance.parceiro?.nome || 'seu parceiro'}`}
      />
      <Wrap>
        <Numeros>
          <Numero rotulo="Clientes" valor={clientes.length} />
          <Numero rotulo="Pessoas ativas" valor={ativos} apoio="somando todos os clientes" />
          <Numero
            rotulo="Atestados por validar"
            valor={pendentes}
            tom={pendentes ? 'var(--atencao)' : undefined}
            apoio="esperando a Gestão de cada cliente"
          />
        </Numeros>

        <Secao titulo="Clientes" nota="consulte um cliente para ver as telas dele">
          <Cartao liso>
            {clientes.length === 0 ? (
              <Vazio icone="domain">Nenhum cliente ligado a este parceiro ainda.</Vazio>
            ) : (
              <TabelaDeClientes clientes={clientes} />
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
