'use client';

export default function ErroDoSistema({ error, reset }) {
  return (
    <div className="rounded-folha border border-borda bg-superficie p-6">
      <h1 className="marcante text-[18px] font-bold">A ação não foi concluída</h1>
      <p className="mt-2 max-w-[70ch] text-campo leading-relaxed text-texto-2">
        {error?.message ||
          'O registro não chegou até a planilha. Tente de novo; se persistir, confira o acesso da conta de serviço à planilha.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-acao px-4 text-[13px] font-bold text-acao-texto transition-colors hover:bg-acao-hover"
      >
        Tentar de novo
      </button>
    </div>
  );
}
