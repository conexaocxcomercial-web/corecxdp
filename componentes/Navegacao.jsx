'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Marca } from '@/componentes/Marca';
import { BotaoDeTema } from '@/componentes/Tema';
import {
  IconeAtestados,
  IconeFechar,
  IconeIndicadores,
  IconeMais,
  IconeMovimentacoes,
  IconeOcorrencias,
  IconePainel,
  IconePessoas,
} from '@/componentes/Icones';

const VISAO = [
  { href: '/painel', nome: 'Painel', Icone: IconePainel },
  { href: '/indicadores', nome: 'Indicadores', Icone: IconeIndicadores },
];

const REGISTROS = [
  { href: '/colaboradores', nome: 'Colaboradores', Icone: IconePessoas },
  { href: '/ocorrencias', nome: 'Ocorrências', Icone: IconeOcorrencias },
  { href: '/atestados', nome: 'Atestados', Icone: IconeAtestados },
  { href: '/movimentacoes', nome: 'Movimentações', Icone: IconeMovimentacoes },
];

const NO_CELULAR = [VISAO[0], VISAO[1], REGISTROS[0]];
const NO_MENU = REGISTROS.slice(1);

function estaAtiva(caminho, href) {
  return caminho === href || caminho.startsWith(`${href}/`);
}

function ItemLateral({ item, ativa }) {
  const { Icone } = item;

  return (
    <Link
      href={item.href}
      aria-current={ativa ? 'page' : undefined}
      className={`flex h-10 items-center gap-2.5 rounded-lg px-3 text-[13.5px] transition-colors ${
        ativa
          ? 'bg-superficie-2 font-bold text-texto'
          : 'text-texto-2 hover:bg-superficie-2 hover:text-texto'
      }`}
    >
      <Icone className={`h-[18px] w-[18px] ${ativa ? 'text-marca' : ''}`} />
      {item.nome}
    </Link>
  );
}

export function Navegacao({ empresa }) {
  const caminho = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [caminho]);

  const emOutroRegistro = NO_MENU.some((item) => estaAtiva(caminho, item.href));

  return (
    <>
      {/* -------------------------------------------------- barra lateral */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-borda bg-superficie lg:flex">
        <div className="px-5 pb-6 pt-6">
          <Link href="/painel" className="inline-block">
            <Marca />
          </Link>
          <p className="mt-2 truncate text-[12.5px] text-texto-3">{empresa}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {VISAO.map((item) => (
            <ItemLateral key={item.href} item={item} ativa={estaAtiva(caminho, item.href)} />
          ))}

          <p className="px-3 pb-1 pt-5 text-[11.5px] font-medium text-texto-3">Registros</p>

          {REGISTROS.map((item) => (
            <ItemLateral key={item.href} item={item} ativa={estaAtiva(caminho, item.href)} />
          ))}
        </nav>

        <div className="border-t border-borda p-3">
          <BotaoDeTema />
          <p className="px-3 pb-1 pt-3 text-[11px] leading-snug text-texto-3">
            Uma solução cx de RH Estratégico
          </p>
        </div>
      </aside>

      {/* ------------------------------------------- topo no celular */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-borda bg-superficie/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/painel" className="min-w-0">
          <Marca tamanho="pequeno" />
        </Link>
        <BotaoDeTema compacto />
      </header>

      {/* --------------------------------------- barra inferior no celular */}
      <nav
        aria-label="Seções"
        className="barra-inferior fixed inset-x-0 bottom-0 z-30 flex border-t border-borda bg-superficie/95 backdrop-blur lg:hidden"
      >
        {NO_CELULAR.map((item) => {
          const ativa = estaAtiva(caminho, item.href);
          const { Icone } = item;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativa ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] transition-colors ${
                ativa ? 'font-bold text-texto' : 'text-texto-3'
              }`}
            >
              <Icone className={`h-[21px] w-[21px] ${ativa ? 'text-marca' : ''}`} />
              {item.nome}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-expanded={menuAberto}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] transition-colors ${
            emOutroRegistro ? 'font-bold text-texto' : 'text-texto-3'
          }`}
        >
          <IconeMais className={`h-[21px] w-[21px] ${emOutroRegistro ? 'text-marca' : ''}`} />
          Mais
        </button>
      </nav>

      {/* ------------------------------------------ gaveta do botão "Mais" */}
      {menuAberto ? (
        <div className="fixed inset-0 z-40 flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 animate-surgir bg-grafite/50"
          />

          <div className="barra-inferior relative w-full animate-baixo rounded-t-[20px] border-t border-borda bg-superficie p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="marcante text-[15px] font-bold">Outros registros</p>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="grid h-9 w-9 place-items-center rounded-full text-texto-2 hover:bg-superficie-2"
              >
                <IconeFechar />
              </button>
            </div>

            <div className="space-y-1 pb-2">
              {NO_MENU.map((item) => (
                <ItemLateral key={item.href} item={item} ativa={estaAtiva(caminho, item.href)} />
              ))}
            </div>

            <p className="border-t border-borda pt-3 text-[11px] text-texto-3">
              Uma solução cx de RH Estratégico
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
