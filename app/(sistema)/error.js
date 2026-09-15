'use client';

export default function ErroDoSistema({ error, reset }) {
  return (
    <div className="border-l-[3px] border-recusa bg-folha px-5 py-5">
      <h1 className="expandido text-[18px] font-semibold">A ação não foi concluída</h1>
      <p className="mt-1.5 max-w-[70ch] text-campo leading-relaxed text-tinta-70">
        {error?.message ||
          'O registro não chegou até a planilha. Tente de novo; se persistir, confira o acesso da conta de serviço à planilha.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex h-10 items-center rounded-md bg-carimbo px-4 text-[13px] font-semibold text-folha transition-colors hover:bg-carimbo-escuro"
      >
        Tentar de novo
      </button>
    </div>
  );
}
