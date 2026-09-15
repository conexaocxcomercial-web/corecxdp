'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function Filtros({ busca, seletores = [] }) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const temporizador = useRef(null);

  function aplicar(chave, valor) {
    const novos = new URLSearchParams(parametros.toString());
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);

    const consulta = novos.toString();
    router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
  }

  function aoDigitar(evento) {
    const valor = evento.target.value;
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => aplicar('busca', valor), 220);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-linha px-5 py-3">
      {busca ? (
        <div className="relative min-w-[220px] flex-1">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grafite-30"
          >
            <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.6 10.6 14 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <input
            type="search"
            defaultValue={parametros.get('busca') || ''}
            onChange={aoDigitar}
            placeholder={busca}
            aria-label={busca}
            className="h-9 w-full rounded-md border border-[#C7D0D9] bg-folha pl-9 pr-3 text-campo transition-colors hover:border-grafite-30 focus:border-violeta"
          />
        </div>
      ) : null}

      {seletores.map((seletor) => (
        <div key={seletor.chave} className="relative">
          <select
            aria-label={seletor.rotulo}
            defaultValue={parametros.get(seletor.chave) || ''}
            onChange={(evento) => aplicar(seletor.chave, evento.target.value)}
            className="h-9 appearance-none rounded-md border border-[#C7D0D9] bg-folha pl-3 pr-8 text-campo transition-colors hover:border-grafite-30 focus:border-violeta"
          >
            <option value="">{seletor.rotulo}</option>
            {seletor.opcoes.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-grafite-45"
          >
            <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
      ))}
    </div>
  );
}
