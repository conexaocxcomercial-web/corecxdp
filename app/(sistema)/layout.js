import { empresaAtual } from '@/lib/contexto';
import { Navegacao } from '@/componentes/Navegacao';

export const dynamic = 'force-dynamic';

export default function LayoutDoSistema({ children }) {
  return (
    <div className="min-h-dvh">
      <Navegacao empresa={empresaAtual()} />
      <main className="lg:pl-[248px]">
        <div className="recuo-seguro mx-auto max-w-conteudo px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
