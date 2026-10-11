'use client';

import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/componentes/Icones';

const CHAVE = 'core-cx-tema';

/* Escolha salva: 'claro', 'escuro' ou 'sistema' (também quando não há nada salvo). */
function lerEscolha() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema';
  } catch {
    return 'sistema';
  }
}

function temaDa(escolha) {
  if (escolha !== 'sistema') return escolha;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

/** Troca o tema com uma transição suave onde o navegador permite. */
function aplicar(escolha) {
  try {
    if (escolha === 'sistema') localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, escolha);
  } catch {
    // Armazenamento bloqueado: o tema vale só nesta visita.
  }

  const tema = temaDa(escolha);
  const raiz = document.documentElement;
  if (raiz.dataset.tema === tema) return;

  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !calmo) {
    document.startViewTransition(() => {
      raiz.dataset.tema = tema;
    });
  } else {
    raiz.dataset.tema = tema;
  }
}

/** Escolha atual, atualizada quando outra aba muda o tema. */
function useEscolha() {
  const [escolha, setEscolha] = useState(null);

  useEffect(() => {
    setEscolha(lerEscolha());
    const sincronizar = (evento) => {
      if (evento.key === CHAVE) setEscolha(lerEscolha());
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, []);

  function escolher(nova) {
    aplicar(nova);
    setEscolha(nova);
  }

  return [escolha, escolher];
}

/** Botão único da barra do topo: alterna entre claro e escuro. */
export function BotaoDeTema() {
  const [tema, setTema] = useState('claro');

  useEffect(() => {
    setTema(document.documentElement.dataset.tema || 'claro');
  }, []);

  function alternar() {
    const novo = tema === 'escuro' ? 'claro' : 'escuro';
    aplicar(novo);
    setTema(novo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      title={`Mudar para o tema ${tema === 'escuro' ? 'claro' : 'escuro'}`}
      aria-label={`Mudar para o tema ${tema === 'escuro' ? 'claro' : 'escuro'}`}
      className="grid h-11 w-11 place-items-center rounded-full min-[901px]:h-9 min-[901px]:w-9 bg-[var(--papel-2)] text-[var(--tinta-3)] transition-colors hover:bg-[var(--linha)] hover:text-[var(--tinta)]"
    >
      <Icone nome={tema === 'escuro' ? 'light_mode' : 'dark_mode'} tamanho={20} />
    </button>
  );
}

const OPCOES_DE_TEMA = [
  { valor: 'claro', rotulo: 'Claro', icone: 'light_mode' },
  { valor: 'sistema', rotulo: 'Sistema', icone: 'contrast' },
  { valor: 'escuro', rotulo: 'Escuro', icone: 'dark_mode' },
];

/**
 * Claro, Sistema ou Escuro, as três sempre visíveis. Grupo de opções
 * de rádio: Tab entra na escolhida, as setas trocam.
 */
export function SeletorDeTema({ className = '' }) {
  const [escolha, escolher] = useEscolha();
  const botoes = useRef([]);

  function mover(evento, indice) {
    const passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let destino;
    if (evento.key in passos) {
      destino = (indice + passos[evento.key] + OPCOES_DE_TEMA.length) % OPCOES_DE_TEMA.length;
    } else if (evento.key === 'Home') {
      destino = 0;
    } else if (evento.key === 'End') {
      destino = OPCOES_DE_TEMA.length - 1;
    } else {
      return;
    }
    evento.preventDefault();
    escolher(OPCOES_DE_TEMA[destino].valor);
    botoes.current[destino]?.focus();
  }

  const ativa = escolha ?? 'sistema';

  return (
    <div role="radiogroup" aria-label="Tema" className={`segm seletor-tema ${className}`}>
      {OPCOES_DE_TEMA.map((opcao, indice) => {
        const marcada = escolha === opcao.valor;
        return (
          <button
            key={opcao.valor}
            ref={(no) => {
              botoes.current[indice] = no;
            }}
            type="button"
            role="radio"
            aria-checked={marcada}
            title={opcao.valor === 'sistema' ? 'Seguir o tema do aparelho' : undefined}
            tabIndex={opcao.valor === ativa ? 0 : -1}
            className={`segm-btn ${marcada ? 'on' : ''}`}
            onClick={() => escolher(opcao.valor)}
            onKeyDown={(evento) => mover(evento, indice)}
          >
            <Icone nome={opcao.icone} tamanho={16} />
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Aplica o tema antes da primeira pintura, para a tela não piscar.
 * Em "Sistema", acompanha a troca do sistema operacional; e uma
 * escolha feita em outra aba vale aqui também.
 */
export function ScriptDeTema() {
  const codigo = `
    (function () {
      var raiz = document.documentElement;
      var escuro = window.matchMedia('(prefers-color-scheme: dark)');
      function salvo() {
        try { return localStorage.getItem('${CHAVE}'); } catch (e) { return null; }
      }
      function definir() {
        var s = salvo();
        raiz.dataset.tema = s === 'claro' || s === 'escuro' ? s : (escuro.matches ? 'escuro' : 'claro');
      }
      definir();
      try {
        escuro.addEventListener('change', function () { if (!salvo()) definir(); });
        window.addEventListener('storage', function (e) { if (e.key === '${CHAVE}') definir(); });
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: codigo }} />;
}
