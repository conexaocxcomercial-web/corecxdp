'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconeBusca } from '@/componentes/Icones';

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
    <div className="flex flex-col gap-2 border-b border-borda p-3 sm:flex-row sm:items-center sm:px-4">
      {busca ? (
        <div className="relative flex-1">
          <IconeBusca className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" />
          <input
            type="search"
            defaultValue={parametros.get('busca') || ''}
            onChange={aoDigitar}
            placeholder={busca}
            aria-label={busca}
            className="h-11 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-campo transition-colors hover:border-texto-3 focus:border-acao sm:h-10"
          />
        </div>
      ) : null}

      {seletores.length > 0 ? (
        <div className="flex gap-2">
          {seletores.map((seletor) => (
            <div key={seletor.chave} className="relative flex-1 sm:flex-none">
              <select
                aria-label={seletor.rotulo}
                defaultValue={parametros.get(seletor.chave) || ''}
                onChange={(evento) => aplicar(seletor.chave, evento.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-borda bg-superficie pl-3 pr-8 text-campo transition-colors hover:border-texto-3 focus:border-acao sm:h-10 sm:w-auto"
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
                className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-texto-3"
              >
                <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
