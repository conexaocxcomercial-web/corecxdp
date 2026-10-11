import { FormularioDeEntrada } from './formulario';
import { PreviaDoPainel } from './previa';
import { SeletorDeTema } from '@/componentes/Tema';
import { Assinatura, Marca } from '@/componentes/Marca';
import { Icone } from '@/componentes/Icones';
import { MARCA } from '@/lib/marca';

export const metadata = {
  title: 'Entrar',
  description: MARCA.frase,
};

// A barra do navegador no celular continua a faixa violeta (--marca-violeta).
export const viewport = { themeColor: '#7371FF' };

export default async function Entrar({ searchParams }) {
  const parametros = await searchParams;
  const destino = typeof parametros?.de === 'string' ? parametros.de : '/painel';
  const { whatsapp, email } = MARCA.contato;

  return (
    <div className="entrada">
      <main className="entrada-col">
        <header className="entrada-cab">
          <Marca grande />
        </header>

        <div className="entrada-centro">
          <div className="entrada-cx">
            <h1 className="entrada-tit">Entrar</h1>
            <p className="entrada-sub">Use o e-mail que a sua empresa cadastrou no core.cx.</p>

            <FormularioDeEntrada destino={destino} />

            <details className="entrada-ajuda">
              <summary>
                Perdeu o acesso?
                <Icone nome="expand_more" tamanho={20} />
              </summary>
              <p>
                Peça a quem administra o core.cx na sua empresa para recriar a sua senha. Se essa
                pessoa é você, fale com a {MARCA.empresa} pelos contatos abaixo.
              </p>
            </details>

            <section className="entrada-contato" aria-labelledby="entrada-contato-t">
              <p id="entrada-contato-t">
                Ainda não usa o core.cx? <span>Fale com a {MARCA.empresa}.</span>
              </p>
              <ul>
                <li>
                  <a href={whatsapp.link} target="_blank" rel="noopener noreferrer">
                    <Icone nome="chat" tamanho={18} />
                    <span>
                      WhatsApp <span className="num">{whatsapp.exibicao}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a href={email.link}>
                    <Icone nome="mail" tamanho={18} />
                    <span>{email.exibicao}</span>
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <footer className="entrada-pe">
          <Assinatura />
          <SeletorDeTema />
        </footer>
      </main>

      <aside className="entrada-palco" aria-label="Sobre o core.cx">
        <div className="entrada-palco-marca">
          <Marca grande />
        </div>

        <p className="entrada-frase">{MARCA.frase}</p>

        <ul className="entrada-perfis">
          {MARCA.perfis.map((perfil) => (
            <li key={perfil.titulo}>
              <b>{perfil.titulo}</b>
              <span>{perfil.texto}</span>
            </li>
          ))}
        </ul>

        <div className="entrada-vitrine">
          <span className="entrada-ilustrativo" aria-hidden="true">
            Dados ilustrativos
          </span>
          <PreviaDoPainel />
        </div>
      </aside>
    </div>
  );
}
