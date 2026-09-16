'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { BotaoEnviar } from '@/componentes/Botao';
import { Icone } from '@/componentes/Icones';

/**
 * Janela de registro. No desktop é modal centrado, como as do quadro;
 * no celular sobe de baixo. Fecha sozinha quando o registro entra.
 */
export function PainelDeRegistro({ abrir, titulo, descricao, acao, enviar, enviando, children }) {
  const [aberto, setAberto] = useState(false);
  const [estado, executar] = useActionState(acao, {});
  const corpo = useRef(null);

  useEffect(() => {
    if (estado?.ok) setAberto(false);
  }, [estado]);

  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';
    if (window.matchMedia('(min-width: 901px)').matches) {
      corpo.current?.querySelector('input, select, textarea')?.focus();
    }
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [aberto]);

  return (
    <>
      <button type="button" className="btn btn-acao" onClick={() => setAberto(true)}>
        <Icone nome="add" />
        {abrir}
      </button>

      {aberto ? (
        <div className="md-veu" onClick={(e) => e.target === e.currentTarget && setAberto(false)}>
          <div className="md" role="dialog" aria-modal="true" aria-label={titulo}>
            <div className="md-head">
              <div className="md-head-txt">
                <div className="md-titulo">{titulo}</div>
                {descricao ? <div className="md-sub">{descricao}</div> : null}
              </div>
              <button
                type="button"
                className="md-fechar"
                onClick={() => setAberto(false)}
                aria-label="Fechar sem salvar"
              >
                <Icone nome="close" />
              </button>
            </div>

            <form action={executar} className="flex min-h-0 flex-1 flex-col">
              <div ref={corpo} className="md-corpo">
                {children}
              </div>

              {estado?.erro ? (
                <div className="px-6 pb-1">
                  <div className="faixa erro" style={{ marginBottom: 0 }}>
                    <Icone nome="error" />
                    <span>{estado.erro}</span>
                  </div>
                </div>
              ) : null}

              <div className="md-pe">
                <button type="button" className="btn btn-fant" onClick={() => setAberto(false)}>
                  Cancelar
                </button>
                <BotaoEnviar enviando={enviando}>{enviar}</BotaoEnviar>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
