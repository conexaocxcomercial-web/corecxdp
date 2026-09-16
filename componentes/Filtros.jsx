'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function Busca({ placeholder }) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();
  const temporizador = useRef(null);

  function aoDigitar(evento) {
    const valor = evento.target.value;
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const novos = new URLSearchParams(parametros.toString());
      if (valor) novos.set('busca', valor);
      else novos.delete('busca');
      const consulta = novos.toString();
      router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
    }, 220);
  }

  return (
    <input
      type="search"
      defaultValue={parametros.get('busca') || ''}
      onChange={aoDigitar}
      placeholder={placeholder}
      aria-label={placeholder}
      className="sel"
      style={{ width: 230, maxWidth: '100%' }}
    />
  );
}

export function Seletor({ chave, rotulo, opcoes }) {
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();

  function aplicar(evento) {
    const novos = new URLSearchParams(parametros.toString());
    if (evento.target.value) novos.set(chave, evento.target.value);
    else novos.delete(chave);
    const consulta = novos.toString();
    router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
  }

  return (
    <select
      className="sel"
      aria-label={rotulo}
      defaultValue={parametros.get(chave) || ''}
      onChange={aplicar}
    >
      <option value="">{rotulo}</option>
      {opcoes.map((opcao) => (
        <option key={opcao} value={opcao}>
          {opcao}
        </option>
      ))}
    </select>
  );
}
