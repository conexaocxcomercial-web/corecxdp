import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[46ch] text-center">
        <p className="numero text-[12.5px] text-texto-3">404</p>
        <h1 className="marcante mt-2 text-[26px] font-bold">Esta página não existe</h1>
        <p className="mt-2 text-campo leading-relaxed text-texto-2">
          O endereço pode ter mudado, ou a matrícula que você abriu não está mais na planilha.
        </p>
        <Link
          href="/painel"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-acao px-4 text-[13px] font-bold text-acao-texto transition-colors hover:bg-acao-hover"
        >
          Voltar para o painel
        </Link>
      </div>
    </main>
  );
}
