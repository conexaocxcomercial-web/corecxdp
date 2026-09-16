import { redirect } from 'next/navigation';
import { usuarioDaSessao } from '@/lib/sessao';
import { sair } from '@/app/acoes';
import { iniciais } from '@/lib/formato';
import { Navegacao } from '@/componentes/Navegacao';
import { BotaoDeTema } from '@/componentes/Tema';
import { Icone } from '@/componentes/Icones';

export const dynamic = 'force-dynamic';

export default async function LayoutDoSistema({ children }) {
  const usuario = await usuarioDaSessao();
  if (!usuario) redirect('/entrar');

  return (
    <>
      <Navegacao empresa={usuario.empresa} />

      <div className="top-bar">
        <div className="top-bar-logo">
          core<span>.cx</span>
          <span className="top-bar-mod">módulo dp</span>
        </div>

        <div className="usermenu">
          <BotaoDeTema />
          <div className="usermenu-id">
            <div className="usermenu-nome">{usuario.nome}</div>
            <div className="usermenu-emp">{usuario.empresa}</div>
          </div>
          <span className="usermenu-av" aria-hidden="true">
            {iniciais(usuario.nome)}
          </span>
          <form action={sair}>
            <button type="submit" className="usermenu-sair" title="Sair" aria-label="Sair">
              <Icone nome="logout" tamanho={18} />
            </button>
          </form>
        </div>
      </div>

      {children}
    </>
  );
}
