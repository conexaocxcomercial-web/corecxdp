import { empresaAtual } from '@/lib/contexto';
import { Trilho } from '@/componentes/Trilho';

export const dynamic = 'force-dynamic';

export default function LayoutDoSistema({ children }) {
  return (
    <div className="min-h-dvh">
      <Trilho empresa={empresaAtual()} />
      <main className="lg:pl-[232px]">
        <div className="mx-auto max-w-conteudo px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
