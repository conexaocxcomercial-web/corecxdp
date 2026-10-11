'use client';

import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/componentes/Icones';

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

/**
 * Senha com botão de mostrar/ocultar e aviso de Caps Lock. Volta a
 * ficar oculta quando o formulário é enviado, para o navegador
 * oferecer guardar a senha.
 */
export function Senha({ rotulo, nome, dica, ...props }) {
  const campo = useRef(null);
  const [visivel, setVisivel] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const idAviso = `${nome}-aviso`;

  useEffect(() => {
    const formulario = campo.current?.form;
    if (!formulario) return undefined;
    const ocultar = () => setVisivel(false);
    formulario.addEventListener('submit', ocultar);
    return () => formulario.removeEventListener('submit', ocultar);
  }, []);

  function lerTeclas(evento) {
    setCapsLock(Boolean(evento.getModifierState?.('CapsLock')));
  }

  return (
    <div className="fg">
      <Rotulo nome={nome} dica={dica}>
        {rotulo}
      </Rotulo>
      <div className="campo-senha">
        <input
          ref={campo}
          id={nome}
          name={nome}
          type={visivel ? 'text' : 'password'}
          className="campo"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={lerTeclas}
          onKeyUp={lerTeclas}
          onBlur={() => setCapsLock(false)}
          {...props}
          aria-describedby={[props['aria-describedby'], capsLock ? idAviso : null].filter(Boolean).join(' ') || undefined}
        />
        <button
          type="button"
          className="campo-olho"
          aria-controls={nome}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => setVisivel((atual) => !atual)}
        >
          <Icone nome={visivel ? 'visibility_off' : 'visibility'} tamanho={20} />
        </button>
      </div>
      <p id={idAviso} className="fg-aviso" aria-live="polite">
        {capsLock ? (
          <>
            <Icone nome="keyboard_capslock" tamanho={16} />
            Caps Lock ligado
          </>
        ) : null}
      </p>
    </div>
  );
}

/**
 * Caixa de marcar com alvo de toque inteiro (quadro, texto e dica).
 * O nome vem só do título e a dica fica como descrição: sem isso o
 * leitor de tela leria a dica duas vezes, já que o label envolve as duas.
 */
export function Caixa({ rotulo, nome, dica, ...props }) {
  const idRotulo = `${nome}-rotulo`;
  const idDica = dica ? `${nome}-dica` : undefined;

  return (
    <label className="caixa" htmlFor={nome}>
      <input
        type="checkbox"
        id={nome}
        name={nome}
        className="caixa-in"
        aria-labelledby={idRotulo}
        aria-describedby={idDica}
        {...props}
      />
      <span className="caixa-q" aria-hidden="true">
        <Icone nome="check" tamanho={16} />
      </span>
      <span className="caixa-t">
        <span id={idRotulo}>{rotulo}</span>
        {dica ? (
          <span id={idDica} className="caixa-dica">
            {dica}
          </span>
        ) : null}
      </span>
    </label>
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
