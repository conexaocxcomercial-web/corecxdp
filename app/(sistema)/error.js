'use client';

export default function ErroDoSistema({ error, reset }) {
  return (
    <div className="border-l-[3px] border-rosa-escura bg-folha px-5 py-5">
      <h1 className="marcante text-[18px] font-bold">A ação não foi concluída</h1>
      <p className="mt-1.5 max-w-[70ch] text-campo leading-relaxed text-grafite-60">
        {error?.message ||
          'O registro não chegou até a planilha. Tente de novo; se persistir, confira o acesso da conta de serviço à planilha.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex h-10 items-center rounded-md bg-violeta-forte px-4 text-[13px] font-bold text-folha transition-colors hover:bg-[#3A38C4]"
      >
        Tentar de novo
      </button>
    </div>
  );
}
