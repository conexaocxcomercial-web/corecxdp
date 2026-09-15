/**
 * Lima é o que está resolvido, rosa é o que pede ação, violeta é o que está
 * em curso, cinza é o que encerrou. A cor mora no ponto; o texto fica na cor
 * da interface, que lê bem nos dois temas.
 */
const CORES = {
  Ativo: '#BEF533',
  Aprovado: '#BEF533',
  Concluído: '#BEF533',
  Sim: '#BEF533',
  Pendente: '#FF43C0',
  Não: '#FF43C0',
  'Em andamento': '#7371FF',
  Afastado: '#7371FF',
  Férias: '#7371FF',
  Rejeitado: '#8A8A8A',
  Inativo: '#8A8A8A',
};

export function Status({ children }) {
  const cor = CORES[children] || '#8A8A8A';

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-borda bg-superficie-2 py-1 pl-2 pr-2.5">
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: cor }}
      />
      <span className="text-[12px] font-medium leading-none text-texto">{children}</span>
    </span>
  );
}

export function Vazio({ titulo, descricao, acao }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="marcante text-[16px] font-bold">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-campo leading-relaxed text-texto-3">
        {descricao}
      </p>
      {acao ? <div className="mt-5 flex justify-center">{acao}</div> : null}
    </div>
  );
}

export function Aviso({ titulo, children }) {
  return (
    <div className="rounded-folha border border-borda bg-superficie p-5">
      <p className="flex items-center gap-2 text-[14px] font-bold">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rosa" />
        {titulo}
      </p>
      <div className="mt-2 max-w-[70ch] text-campo leading-relaxed text-texto-2">{children}</div>
    </div>
  );
}
