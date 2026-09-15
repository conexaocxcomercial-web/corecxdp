import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[46ch] text-center">
        <p className="numero codigo text-[12.5px] text-grafite-45">404</p>
        <h1 className="marcante mt-2 text-[26px] font-bold">Esta página não existe</h1>
        <p className="mt-2 text-campo leading-relaxed text-grafite-60">
          O endereço pode ter mudado, ou a matrícula que você abriu não está mais na planilha.
        </p>
        <Link
          href="/painel"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-violeta-forte px-4 text-[13px] font-bold text-folha transition-colors hover:bg-[#3A38C4]"
        >
          Voltar para o painel
        </Link>
      </div>
    </main>
  );
}
