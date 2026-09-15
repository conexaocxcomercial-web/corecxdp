'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Marca } from '@/componentes/Marca';

const SECOES = [
  { href: '/painel', nome: 'Painel' },
  { href: '/indicadores', nome: 'Indicadores' },
  { href: '/colaboradores', nome: 'Colaboradores' },
  { href: '/ocorrencias', nome: 'Ocorrências' },
  { href: '/atestados', nome: 'Atestados' },
  { href: '/movimentacoes', nome: 'Movimentações' },
];

function estaAtiva(caminho, href) {
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function Trilho({ empresa }) {
  const caminho = usePathname();

  return (
    <>
      {/* Desktop: lombada fixa do livro de registro. */}
      <aside className="sobre-escuro fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-tinta lg:flex">
        <div className="px-6 pb-7 pt-7">
          <Link href="/painel" className="inline-block">
            <Marca />
          </Link>
          <p className="mt-2 truncate text-[12px] leading-snug text-folha/55">
            {empresa}
          </p>
        </div>

        <nav className="flex-1 px-3">
          {SECOES.map((secao) => {
            const ativa = estaAtiva(caminho, secao.href);
            return (
              <Link
                key={secao.href}
                href={secao.href}
                aria-current={ativa ? 'page' : undefined}
                className={`relative flex h-10 items-center rounded-md pl-4 pr-3 text-[13.5px] transition-colors ${
                  ativa
                    ? 'bg-folha/[0.07] font-semibold text-folha'
                    : 'text-folha/60 hover:text-folha'
                }`}
              >
                {ativa ? (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-carimbo" />
                ) : null}
                {secao.nome}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Mobile: barra superior com as abas do livro. */}
      <header className="sobre-escuro sticky top-0 z-30 bg-tinta lg:hidden">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Link href="/painel">
            <Marca />
          </Link>
          <span className="truncate text-[12px] text-folha/50">{empresa}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-1">
          {SECOES.map((secao) => {
            const ativa = estaAtiva(caminho, secao.href);
            return (
              <Link
                key={secao.href}
                href={secao.href}
                aria-current={ativa ? 'page' : undefined}
                className={`relative whitespace-nowrap px-3 pb-2.5 pt-1 text-[13px] ${
                  ativa ? 'font-semibold text-folha' : 'text-folha/55'
                }`}
              >
                {secao.nome}
                {ativa ? (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-carimbo" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
