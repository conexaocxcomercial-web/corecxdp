import { FormularioDeEntrada } from './formulario';
import { BotaoDeTema } from '@/componentes/Tema';
import { Assinatura, Marca } from '@/componentes/Marca';

export const metadata = { title: 'Entrar' };

export default async function Entrar({ searchParams }) {
  const parametros = await searchParams;
  const destino = typeof parametros?.de === 'string' ? parametros.de : '/painel';

  return (
    <div className="entrada">
      <div className="entrada-tema">
        <BotaoDeTema />
      </div>

      <div className="entrada-cx">
        <div className="entrada-marca">
          <Marca grande />
        </div>

        <div className="cartao entrada-cartao">
          <h1 className="entrada-tit">Entrar</h1>
          <p className="entrada-sub">
            Acesse o registro de pessoal da sua empresa: ficha dos colaboradores, ocorrências,
            atestados e movimentações.
          </p>

          <FormularioDeEntrada destino={destino} />
        </div>

        <div className="entrada-pe">
          <Assinatura />
        </div>
      </div>
    </div>
  );
}
