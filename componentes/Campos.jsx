const CAMPO =
  'h-10 w-full rounded-md border border-[#C7D0D9] bg-folha px-3 text-campo transition-colors hover:border-grafite-30 focus:border-violeta';

function Rotulo({ nome, children, dica }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={nome} className="text-[12.5px] font-medium text-grafite-60">
        {children}
      </label>
      {dica ? <span className="text-[11.5px] text-grafite-30">{dica}</span> : null}
    </span>
  );
}

export function Texto({ rotulo, nome, dica, className = '', ...props }) {
  return (
    <div className={className}>
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <input id={nome} name={nome} className={CAMPO} {...props} />
    </div>
  );
}

export function Data({ rotulo, nome, dica, className = '', ...props }) {
  return (
    <div className={className}>
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <input
        id={nome}
        name={nome}
        type="date"
        className={`${CAMPO} text-[12.5px]`}
        {...props}
      />
    </div>
  );
}

export function Selecao({ rotulo, nome, opcoes, dica, className = '', ...props }) {
  return (
    <div className={className}>
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <div className="relative">
        <select
          id={nome}
          name={nome}
          className={`${CAMPO} appearance-none pr-9`}
          {...props}
        >
          {opcoes.map((opcao) => {
            const valor = typeof opcao === 'string' ? opcao : opcao.valor;
            const texto = typeof opcao === 'string' ? opcao : opcao.texto;
            return (
              <option key={valor} value={valor}>
                {texto}
              </option>
            );
          })}
        </select>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-grafite-45"
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
    </div>
  );
}

export function Paragrafo({ rotulo, nome, dica, className = '', ...props }) {
  return (
    <div className={className}>
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <textarea
        id={nome}
        name={nome}
        rows={3}
        className={`${CAMPO} h-auto resize-none py-2.5 leading-relaxed`}
        {...props}
      />
    </div>
  );
}
