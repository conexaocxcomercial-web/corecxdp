import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="cartao max-w-[44ch] text-center">
        <div className="cartao-t">Esta página não existe</div>
        <div className="cartao-d">
          O endereço pode ter mudado, ou a matrícula que você abriu não está mais na planilha.
        </div>
        <Link href="/painel" className="btn btn-acao">
          Voltar para o painel
        </Link>
      </div>
    </main>
  );
}
