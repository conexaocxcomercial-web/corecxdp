import { empresaAtual } from '@/lib/contexto';
import { Navegacao } from '@/componentes/Navegacao';
import { BotaoDeTema } from '@/componentes/Tema';

export const dynamic = 'force-dynamic';

export default function LayoutDoSistema({ children }) {
  return (
    <>
      <Navegacao empresa={empresaAtual()} />

      <div className="top-bar">
        <div className="top-bar-logo">
          core<span>.cx</span>
          <span className="top-bar-mod">módulo dp</span>
        </div>
        <BotaoDeTema />
      </div>

      {children}
    </>
  );
}
