const CORES = {
  Ativo: '#1C6B4C',
  Inativo: '#8A97A3',
  Afastado: '#9A5A0B',
  Férias: '#2B6CB0',
  Aprovado: '#1C6B4C',
  Pendente: '#9A5A0B',
  Rejeitado: '#9E2A2B',
  Concluído: '#1C6B4C',
  'Em andamento': '#2B6CB0',
  Sim: '#1C6B4C',
  Não: '#9E2A2B',
};

/** Barra de tinta na altura da linha: o status é lido como marginália, não como enfeite. */
export function Status({ children, tamanho = 'normal' }) {
  const cor = CORES[children] || '#6F7F8E';
  const altura = tamanho === 'grande' ? 'h-4' : 'h-3.5';

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`${altura} w-[3px] shrink-0 rounded-full`}
        style={{ background: cor }}
      />
      <span className="text-campo" style={{ color: cor }}>
        {children}
      </span>
    </span>
  );
}

export function Vazio({ titulo, descricao, acao }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="expandido text-[17px] font-semibold">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-campo leading-relaxed text-tinta-50">
        {descricao}
      </p>
      {acao ? <div className="mt-5 flex justify-center">{acao}</div> : null}
    </div>
  );
}

export function Aviso({ titulo, children }) {
  return (
    <div className="border-l-[3px] border-recusa bg-folha px-5 py-4">
      <p className="text-[14px] font-semibold">{titulo}</p>
      <div className="mt-1 max-w-[70ch] text-campo leading-relaxed text-tinta-70">{children}</div>
    </div>
  );
}
