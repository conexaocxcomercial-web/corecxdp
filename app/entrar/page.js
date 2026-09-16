import { FormularioDeEntrada } from './formulario';
import { BotaoDeTema } from '@/componentes/Tema';

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
          core<span>.cx</span>
          <span className="entrada-mod">módulo dp</span>
        </div>

        <div className="cartao entrada-cartao">
          <h1 className="entrada-tit">Entrar</h1>
          <p className="entrada-sub">
            Acesse o registro de pessoal da sua empresa: ficha dos colaboradores, ocorrências,
            atestados e movimentações.
          </p>

          <FormularioDeEntrada destino={destino} />
        </div>

        <p className="entrada-pe">Uma solução cx de RH Estratégico</p>
      </div>
    </div>
  );
}
