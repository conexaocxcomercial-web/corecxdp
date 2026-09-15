'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { BotaoEnviar } from '@/componentes/Botao';
import { IconeFechar, IconeSoma } from '@/componentes/Icones';

/**
 * Painel lateral no desktop, folha que sobe de baixo no celular.
 * Fecha sozinho quando o registro entra.
 */
export function PainelDeRegistro({ abrir, titulo, descricao, acao, enviar, enviando, children }) {
  const [aberto, setAberto] = useState(false);
  const [estado, executar] = useActionState(acao, {});
  const conteudo = useRef(null);

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

    if (window.matchMedia('(min-width: 640px)').matches) {
      conteudo.current?.querySelector('input, select, textarea')?.focus();
    }

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-acao px-4 text-[13px] font-bold text-acao-texto transition-colors hover:bg-acao-hover"
      >
        <IconeSoma className="h-4 w-4" />
        {abrir}
      </button>

      {aberto ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
          <button
            type="button"
            aria-label="Fechar sem salvar"
            onClick={() => setAberto(false)}
            className="absolute inset-0 animate-surgir bg-grafite/50"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className="relative flex max-h-[92dvh] w-full animate-baixo flex-col rounded-t-[20px] border-t border-borda bg-superficie sm:h-full sm:max-h-none sm:w-[460px] sm:animate-lado sm:rounded-none sm:border-l sm:border-t-0"
          >
            <header className="flex items-start justify-between gap-4 border-b border-borda px-5 py-4">
              <div>
                <h2 className="marcante text-[17px] font-bold">{titulo}</h2>
                {descricao ? (
                  <p className="mt-1 max-w-[46ch] text-campo leading-relaxed text-texto-3">
                    {descricao}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar sem salvar"
                className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto"
              >
                <IconeFechar />
              </button>
            </header>

            <form action={executar} className="flex min-h-0 flex-1 flex-col">
              <div
                ref={conteudo}
                className="rolagem-fina flex-1 space-y-4 overflow-y-auto px-5 py-5"
              >
                {children}
              </div>

              {estado?.erro ? (
                <p className="border-t border-borda px-5 py-3 text-campo leading-relaxed text-rosa">
                  {estado.erro}
                </p>
              ) : null}

              <footer className="barra-inferior flex items-center justify-end gap-2 border-t border-borda px-5 py-4">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="h-10 rounded-lg px-3 text-[13px] font-medium text-texto-2 transition-colors hover:text-texto"
                >
                  Cancelar
                </button>
                <BotaoEnviar enviando={enviando}>{enviar}</BotaoEnviar>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
