'use client';

import { useEffect, useState } from 'react';
import { IconeLua, IconeSol } from '@/componentes/Icones';

const CHAVE = 'core-cx-tema';

export function BotaoDeTema({ compacto = false }) {
  const [tema, setTema] = useState('claro');

  useEffect(() => {
    setTema(document.documentElement.dataset.tema || 'claro');
  }, []);

  function alternar() {
    const novo = tema === 'escuro' ? 'claro' : 'escuro';
    const raiz = document.documentElement;

    raiz.classList.add('trocando-tema');
    raiz.dataset.tema = novo;
    setTema(novo);

    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      // Navegador com armazenamento bloqueado: o tema vale só nesta visita.
    }

    window.setTimeout(() => raiz.classList.remove('trocando-tema'), 240);
  }

  const proximo = tema === 'escuro' ? 'claro' : 'escuro';

  if (compacto) {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-label={`Mudar para o tema ${proximo}`}
        className="grid h-9 w-9 place-items-center rounded-full text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto"
      >
        {tema === 'escuro' ? <IconeSol /> : <IconeLua />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto"
    >
      {tema === 'escuro' ? <IconeSol /> : <IconeLua />}
      Tema {proximo}
    </button>
  );
}

/**
 * Aplica o tema salvo antes da primeira pintura, para a tela não piscar
 * claro antes de virar escuro.
 */
export function ScriptDeTema() {
  const codigo = `
    (function () {
      try {
        var salvo = localStorage.getItem('${CHAVE}');
        var sistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.tema = salvo || (sistema ? 'escuro' : 'claro');
      } catch (e) {
        document.documentElement.dataset.tema = 'claro';
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: codigo }} />;
}
