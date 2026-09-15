import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[46ch] text-center">
        <p className="numero font-mono text-[12.5px] text-tinta-50">404</p>
        <h1 className="expandido mt-2 text-[26px] font-semibold">Esta página não existe</h1>
        <p className="mt-2 text-campo leading-relaxed text-tinta-70">
          O endereço pode ter mudado, ou a matrícula que você abriu não está mais na planilha.
        </p>
        <Link
          href="/painel"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-carimbo px-4 text-[13px] font-semibold text-folha transition-colors hover:bg-carimbo-escuro"
        >
          Voltar para o painel
        </Link>
      </div>
    </main>
  );
}
