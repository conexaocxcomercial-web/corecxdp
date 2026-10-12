'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buscarPessoas } from '@/app/acoes';
import { Icone } from '@/componentes/Icones';
import { Status } from '@/componentes/Sinais';

/**
 * Busca de pessoa da barra do topo (computador): nome ou matrícula, e
 * Enter abre a ficha. Combobox com lista (padrão ARIA 1.2): as setas
 * escolhem, Esc limpa, e a tecla / traz o foco para cá de qualquer tela.
 * No celular a busca fica no alto da aba Pessoas (Colaboradores).
 */
export function BuscaDePessoa() {
  const router = useRouter();
  const campo = useRef(null);
  const temporizador = useRef(null);
  const pedido = useRef(0);
  const idLista = useId();
  const [termo, setTermo] = useState('');
  const [pessoas, setPessoas] = useState([]);
  const [erro, setErro] = useState('');
  const [aberta, setAberta] = useState(false);
  const [ativa, setAtiva] = useState(-1);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key !== '/' || evento.defaultPrevented) return;
      const alvo = evento.target;
      if (alvo.closest?.('input, textarea, select, [contenteditable="true"], dialog')) return;
      evento.preventDefault();
      campo.current?.focus();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, []);

  function procurar(valor) {
    clearTimeout(temporizador.current);
    const numero = ++pedido.current;
    if (valor.trim().length < 2) {
      setPessoas([]);
      setErro('');
      setAtiva(-1);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    temporizador.current = setTimeout(async () => {
      const resposta = await buscarPessoas(valor);
      if (numero !== pedido.current) return; // chegou uma busca mais nova
      setPessoas(resposta.pessoas || []);
      setErro(resposta.erro || '');
      setAtiva(resposta.pessoas?.length ? 0 : -1);
      setBuscando(false);
    }, 180);
  }

  function abrirFicha(pessoa) {
    setAberta(false);
    setTermo('');
    setPessoas([]);
    campo.current?.blur();
    router.push(`/colaboradores/${pessoa.matricula}`);
  }

  function aoTeclar(evento) {
    if (evento.key === 'ArrowDown' && pessoas.length) {
      evento.preventDefault();
      setAberta(true);
      setAtiva((atual) => (atual + 1) % pessoas.length);
    } else if (evento.key === 'ArrowUp' && pessoas.length) {
      evento.preventDefault();
      setAtiva((atual) => (atual <= 0 ? pessoas.length - 1 : atual - 1));
    } else if (evento.key === 'Enter' && pessoas[ativa]) {
      evento.preventDefault();
      abrirFicha(pessoas[ativa]);
    } else if (evento.key === 'Escape') {
      if (termo) {
        evento.preventDefault();
        setTermo('');
        setPessoas([]);
        setAtiva(-1);
      } else {
        campo.current?.blur();
      }
    }
  }

  const mostrar = aberta && termo.trim().length >= 2;
  const idOpcao = (indice) => `${idLista}-${indice}`;

  return (
    <div className="busca-p">
      <Icone nome="search" className="busca-p-ic" />
      <input
        ref={campo}
        type="search"
        className="sel busca-p-campo"
        placeholder="Buscar pessoa"
        aria-label="Buscar pessoa por nome ou matrícula"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrar}
        aria-controls={idLista}
        aria-activedescendant={mostrar && ativa >= 0 ? idOpcao(ativa) : undefined}
        autoComplete="off"
        spellCheck={false}
        value={termo}
        onChange={(evento) => {
          setTermo(evento.target.value);
          setAberta(true);
          procurar(evento.target.value);
        }}
        onFocus={() => setAberta(true)}
        onBlur={() => setTimeout(() => setAberta(false), 120)}
        onKeyDown={aoTeclar}
      />
      <kbd className="busca-p-atalho" aria-hidden="true">
        /
      </kbd>

      <div className="busca-p-lista" hidden={!mostrar}>
        <ul id={idLista} role="listbox" aria-label="Pessoas encontradas">
          {pessoas.map((pessoa, indice) => (
            <li
              key={pessoa.matricula}
              id={idOpcao(indice)}
              role="option"
              aria-selected={indice === ativa}
              className={`busca-p-op ${indice === ativa ? 'ativa' : ''}`}
              onMouseDown={(evento) => evento.preventDefault()}
              onMouseEnter={() => setAtiva(indice)}
              onClick={() => abrirFicha(pessoa)}
            >
              <span className="busca-p-txt">
                <span className="busca-p-nome">{pessoa.nome}</span>
                <span className="busca-p-sub">
                  <span className="num">{pessoa.matricula}</span>
                  {pessoa.cargo ? ` · ${pessoa.cargo}` : ''}
                </span>
              </span>
              <Status>{pessoa.status}</Status>
            </li>
          ))}
        </ul>
        {pessoas.length === 0 || buscando ? (
          <p className="busca-p-vazio" role="status">
            {buscando ? 'Procurando…' : erro || 'Ninguém com esse nome ou matrícula.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
