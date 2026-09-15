'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { BotaoEnviar } from '@/componentes/Botao';

export function PainelDeRegistro({
  abrir,
  titulo,
  descricao,
  acao,
  enviar,
  enviando,
  children,
}) {
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
    conteudo.current?.querySelector('input, select, textarea')?.focus();

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
        className="inline-flex h-10 items-center justify-center rounded-md bg-violeta-forte px-4 text-[13px] font-bold text-folha transition-colors hover:bg-[#3A38C4]"
      >
        {abrir}
      </button>

      {aberto ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Fechar sem salvar"
            onClick={() => setAberto(false)}
            className="absolute inset-0 animate-surgir bg-grafite/35"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className="relative flex h-full w-full animate-painel flex-col border-l border-linha bg-folha sm:w-[468px]"
          >
            <header className="flex items-start justify-between gap-4 border-b-2 border-grafite px-6 pb-3.5 pt-6">
              <div>
                <h2 className="marcante text-[18px] font-bold">{titulo}</h2>
                {descricao ? (
                  <p className="mt-1 max-w-[46ch] text-campo leading-relaxed text-grafite-45">
                    {descricao}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="-mr-1 -mt-1 rounded p-1 text-grafite-45 transition-colors hover:text-grafite"
                aria-label="Fechar sem salvar"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
            </header>

            <form action={executar} className="flex min-h-0 flex-1 flex-col">
              <div ref={conteudo} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                {children}
              </div>

              {estado?.erro ? (
                <p className="border-t border-linha bg-folha px-6 py-3 text-campo leading-relaxed text-rosa-escura">
                  {estado.erro}
                </p>
              ) : null}

              <footer className="flex items-center justify-end gap-2 border-t border-linha px-6 py-4">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="h-10 rounded-md px-3 text-[13px] font-medium text-grafite-60 transition-colors hover:text-grafite"
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
