'use client';

import { useEffect, useId, useRef } from 'react';
import { Icone } from '@/componentes/Icones';

/**
 * Folha genérica: janela no centro no computador, folha que sobe de
 * baixo no celular. Com `tipo="popover"`, no computador ela abre ancorada
 * no canto de cima à direita, sem escurecer a tela (menu do usuário).
 *
 * Usa <dialog> com showModal(): o navegador prende o foco dentro, fecha
 * com Esc e devolve o foco a quem abriu. O conteúdo decide o próprio
 * corpo e rodapé com as classes .folha-corpo e .folha-pe.
 */
export function Folha({
  aberta,
  aoFechar,
  titulo,
  descricao,
  tipo = 'janela',
  rotuloFechar = 'Fechar',
  className = '',
  children,
}) {
  const dialogo = useRef(null);
  const idTitulo = useId();
  const idDescricao = useId();

  // A classe na raiz trava a rolagem da página por trás da folha.
  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return undefined;

    if (aberta) {
      if (!elemento.open) elemento.showModal();
      document.documentElement.classList.add('com-folha');
      return () => document.documentElement.classList.remove('com-folha');
    }

    if (elemento.open) elemento.close();
    return undefined;
  }, [aberta]);

  function aoCancelar(evento) {
    evento.preventDefault();
    aoFechar?.();
  }

  // Clique no fundo (fora da caixa) fecha; o alvo é o próprio <dialog>.
  function aoClicar(evento) {
    if (evento.target === dialogo.current) aoFechar?.();
  }

  return (
    <dialog
      ref={dialogo}
      className={`folha folha-${tipo} ${className}`}
      aria-labelledby={titulo ? idTitulo : undefined}
      aria-describedby={descricao ? idDescricao : undefined}
      onCancel={aoCancelar}
      onClick={aoClicar}
    >
      {aberta ? (
        <div className="folha-caixa">
          {titulo ? (
            <div className="folha-cab">
              <div className="folha-cab-txt">
                <h2 id={idTitulo} className="folha-tit">
                  {titulo}
                </h2>
                {descricao ? (
                  <p id={idDescricao} className="folha-sub">
                    {descricao}
                  </p>
                ) : null}
              </div>
              <button type="button" className="folha-fechar" onClick={aoFechar} aria-label={rotuloFechar}>
                <Icone nome="close" />
              </button>
            </div>
          ) : null}
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
