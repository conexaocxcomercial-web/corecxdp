'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/componentes/Icones';

const GRUPOS = [
  {
    chave: 'visao',
    rotulo: null,
    itens: [
      { href: '/painel', nome: 'Painel', icone: 'space_dashboard' },
      { href: '/indicadores', nome: 'Indicadores', icone: 'monitoring' },
    ],
  },
  {
    chave: 'registros',
    rotulo: 'Registros',
    itens: [
      { href: '/colaboradores', nome: 'Colaboradores', icone: 'group' },
      { href: '/ocorrencias', nome: 'Ocorrências', icone: 'event_busy' },
      { href: '/atestados', nome: 'Atestados', icone: 'clinical_notes' },
      { href: '/movimentacoes', nome: 'Movimentações', icone: 'swap_horiz' },
    ],
  },
];

function estaAtiva(caminho, href) {
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function Navegacao({ empresa }) {
  const caminho = usePathname();
  const [fixa, setFixa] = useState(false);
  const [gaveta, setGaveta] = useState(false);
  const [fechados, setFechados] = useState({});

  useEffect(() => {
    let salvo = null;
    try {
      salvo = localStorage.getItem('cx_sb_fixa');
    } catch {
      salvo = null;
    }
    setFixa(salvo === null ? window.innerWidth >= 1600 : salvo === '1');

    try {
      setFechados(JSON.parse(localStorage.getItem('cx_sb_grupos_dp') || '{}') || {});
    } catch {
      setFechados({});
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--cx-sb-w', fixa ? '248px' : '60px');
  }, [fixa]);

  useEffect(() => {
    setGaveta(false);
  }, [caminho]);

  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') setGaveta(false);
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, []);

  function alternarFixa() {
    const nova = !fixa;
    setFixa(nova);
    try {
      localStorage.setItem('cx_sb_fixa', nova ? '1' : '0');
    } catch {
      // Armazenamento bloqueado: a preferência vale só nesta visita.
    }
  }

  function alternarGrupo(chave) {
    const novos = { ...fechados, [chave]: !fechados[chave] };
    setFechados(novos);
    try {
      localStorage.setItem('cx_sb_grupos_dp', JSON.stringify(novos));
    } catch {
      // idem
    }
  }

  return (
    <>
      <button className="cxsb-ham" onClick={() => setGaveta(true)} aria-label="Abrir menu">
        <Icone nome="menu" />
      </button>

      <div
        className={`cxsb-veu ${gaveta ? 'on' : ''}`}
        onClick={() => setGaveta(false)}
        role="presentation"
      />

      <nav
        className={`cxsidebar ${fixa ? 'fixa' : ''} ${gaveta ? 'gaveta' : ''}`}
        aria-label="Navegação principal"
      >
        <div className="cxsb-head">
          <Link href="/painel" className="cxsb-marca">
            core<span>.cx</span>
          </Link>
          <span className="cxsb-sigla" aria-hidden="true">
            cx
          </span>
          <button
            className="cxsb-toggle"
            onClick={alternarFixa}
            aria-pressed={fixa}
            title={fixa ? 'Soltar menu' : 'Fixar menu aberto'}
            aria-label={fixa ? 'Soltar menu' : 'Fixar menu aberto'}
          >
            <Icone nome={fixa ? 'left_panel_close' : 'keep'} />
          </button>
        </div>

        <div className="cxsb-body">
          <p className="cxsb-empresa">{empresa}</p>

          {GRUPOS.map((grupo) => {
            const fechado = Boolean(fechados[grupo.chave]);

            return (
              <div key={grupo.chave}>
                {grupo.rotulo ? (
                  <>
                    <div className="cxsb-sep" />
                    <button
                      type="button"
                      className={`cxsb-grupo ${fechado ? 'fechado' : ''}`}
                      onClick={() => alternarGrupo(grupo.chave)}
                      aria-expanded={!fechado}
                    >
                      {grupo.rotulo}
                      <Icone nome="expand_more" className="cxsb-grupo-caret" />
                    </button>
                  </>
                ) : null}

                <div className={`cxsb-lista ${fechado ? 'fechada' : ''}`}>
                  {grupo.itens.map((item) => {
                    const ativa = estaAtiva(caminho, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-tip={item.nome}
                        aria-current={ativa ? 'page' : undefined}
                        className={`cxsb-item ${ativa ? 'ativo' : ''}`}
                      >
                        <Icone nome={item.icone} />
                        <span className="cxsb-item-txt">{item.nome}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
