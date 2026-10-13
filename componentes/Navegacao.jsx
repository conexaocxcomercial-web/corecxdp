'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/componentes/Icones';
import { Assinatura, Marca } from '@/componentes/Marca';
import { estaAtiva } from '@/lib/navegacao';

/**
 * Menu lateral do computador (a partir de 901px): trilho de 60px que abre
 * a 248px no hover ou fica fixo aberto. Os grupos vêm de lib/navegacao.js.
 * No celular quem navega é a BarraInferior.
 */
export function Navegacao({ empresa, grupos, inicio = '/painel' }) {
  const caminho = usePathname();
  const [fixa, setFixa] = useState(false);
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
    <nav className={`cxsidebar ${fixa ? 'fixa' : ''}`} aria-label="Navegação principal">
      <div className="cxsb-head">
        <Link href={inicio} className="cxsb-marca" aria-label="Início">
          <Marca modulo={false} />
        </Link>
        <span className="cxsb-sigla" aria-hidden="true">
          cx
        </span>
        <button
          type="button"
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

        {grupos.map((grupo) => {
          const fechado = Boolean(fechados[grupo.chave]);
          const idLista = `cxsb-${grupo.chave}`;

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
                    aria-controls={idLista}
                  >
                    {grupo.rotulo}
                    <Icone nome="expand_more" className="cxsb-grupo-caret" />
                  </button>
                </>
              ) : null}

              <div id={idLista} className={`cxsb-lista ${fechado ? 'fechada' : ''}`}>
                {grupo.itens.map((item) => {
                  const ativa = estaAtiva(caminho, item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      data-tip={item.nome}
                      // Recolhido, o menu esconde o texto: o nome do link fica no aria-label.
                      aria-label={item.nome}
                      aria-current={ativa ? 'page' : undefined}
                      className={`cxsb-item ${ativa ? 'ativo' : ''}`}
                      tabIndex={fechado ? -1 : undefined}
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

      <div className="cxsb-pe">
        <Assinatura />
      </div>
    </nav>
  );
}
