/**
 * Lima é o que está resolvido, rosa é o que pede ação, violeta é o que está
 * em curso e cinza é o que já encerrou. A cor mora na barra; o texto fica
 * em grafite, que lê bem em qualquer fundo.
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
  Rejeitado: '#1E1E1E',
  Inativo: '#A3A3A3',
};

export function Status({ children, tamanho = 'normal' }) {
  const cor = CORES[children] || '#A3A3A3';
  const altura = tamanho === 'grande' ? 'h-4' : 'h-3.5';

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`${altura} w-[3px] shrink-0 rounded-full`}
        style={{ background: cor }}
      />
      <span className="text-campo text-grafite">{children}</span>
    </span>
  );
}

export function Vazio({ titulo, descricao, acao }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="marcante text-[17px] font-bold">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-campo leading-relaxed text-grafite-45">
        {descricao}
      </p>
      {acao ? <div className="mt-5 flex justify-center">{acao}</div> : null}
    </div>
  );
}

export function Aviso({ titulo, children }) {
  return (
    <div className="border-l-[3px] border-rosa bg-folha px-5 py-4">
      <p className="text-[14px] font-bold">{titulo}</p>
      <div className="mt-1 max-w-[70ch] text-campo leading-relaxed text-grafite-60">{children}</div>
    </div>
  );
}
