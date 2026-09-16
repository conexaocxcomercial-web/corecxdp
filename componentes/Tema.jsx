'use client';

import { useEffect, useState } from 'react';
import { Icone } from '@/componentes/Icones';

const CHAVE = 'core-cx-tema';

export function BotaoDeTema() {
  const [tema, setTema] = useState('claro');

  useEffect(() => {
    setTema(document.documentElement.dataset.tema || 'claro');
  }, []);

  function alternar() {
    const novo = tema === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.dataset.tema = novo;
    setTema(novo);
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      // Armazenamento bloqueado: o tema vale só nesta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      title={`Mudar para o tema ${tema === 'escuro' ? 'claro' : 'escuro'}`}
      aria-label={`Mudar para o tema ${tema === 'escuro' ? 'claro' : 'escuro'}`}
      className="grid h-9 w-9 place-items-center rounded-full bg-[var(--papel-2)] text-[var(--tinta-3)] transition-colors hover:bg-[var(--linha)] hover:text-[var(--tinta)]"
    >
      <Icone nome={tema === 'escuro' ? 'light_mode' : 'dark_mode'} tamanho={20} />
    </button>
  );
}

/** Aplica o tema salvo antes da primeira pintura, para a tela não piscar. */
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
