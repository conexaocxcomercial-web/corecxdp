function Rotulo({ nome, children, dica }) {
  return (
    <label htmlFor={nome}>
      {children}
      {dica ? <span className="fg-dica"> · {dica}</span> : null}
    </label>
  );
}

export function Texto({ rotulo, nome, dica, ...props }) {
  return (
    <div className="fg">
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <input id={nome} name={nome} className="campo" {...props} />
    </div>
  );
}

export function Data({ rotulo, nome, dica, ...props }) {
  return (
    <div className="fg">
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <input id={nome} name={nome} type="date" className="campo num" {...props} />
    </div>
  );
}

export function Selecao({ rotulo, nome, opcoes, dica, ...props }) {
  return (
    <div className="fg">
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <select id={nome} name={nome} className="campo cursor-pointer" {...props}>
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
    </div>
  );
}

export function Paragrafo({ rotulo, nome, dica, ...props }) {
  return (
    <div className="fg">
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <textarea
        id={nome}
        name={nome}
        rows={3}
        className="campo resize-y leading-relaxed"
        {...props}
      />
    </div>
  );
}
