import { notFound } from 'next/navigation';
import { lerCarteira } from '@/lib/dados/carteira';
import { alcanceAtual } from '@/lib/dados/alcance';
import { pode } from '@/lib/permissoes';
import { emReais, formatarData } from '@/lib/formato';
import { Cartao, Wrap } from '@/componentes/Estrutura';
import { ComparacaoDeClientes } from '@/componentes/Carteira';
import { BotaoDeImprimir } from '@/componentes/Imprimir';

export const metadata = { title: 'Carteira para imprimir' };

/** A carteira numa página para imprimir ou salvar em PDF (fase 15 do redesenho). */
export default async function CarteiraParaImprimir() {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'ver-carteira')) notFound();
  const carteira = await lerCarteira('nome');
  return (
    <Wrap>
      <div className="impressao">
        <header className="impressao-cab">
          <div>
            <h1 className="impressao-t">Carteira de {carteira.parceiro?.nome || 'clientes'}</h1>
            <p className="nota">
              {formatarData(carteira.hoje)} · {carteira.numeros.clientes} clientes · {carteira.numeros.pessoas} pessoas · custo estimado de pessoal de {emReais(carteira.numeros.custo)} no mês (estimativa)
            </p>
          </div>
          <BotaoDeImprimir />
        </header>
        <Cartao liso>
          <ComparacaoDeClientes clientes={carteira.clientes} parceiro={carteira.parceiro} imprimir />
        </Cartao>
        <p className="nota">Custo e fator de custo são estimativas para gestão; o cálculo oficial é da contabilidade. Absenteísmo oculto em clientes com menos de 3 pessoas.</p>
      </div>
    </Wrap>
  );
}
