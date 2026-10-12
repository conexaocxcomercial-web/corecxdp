'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Marco logo abaixo do título grande do Cabecalho. Quando ele passa por
 * baixo da barra do topo, o título aparece pequeno na barra (no lugar
 * reservado em #titulo-na-barra, que é oculto para leitores de tela: o
 * h1 continua sendo o título da página).
 */
export function TituloNaBarra({ titulo }) {
  const marco = useRef(null);
  const [lugar, setLugar] = useState(null);

  useEffect(() => {
    const barra = document.querySelector('.top-bar');
    const destino = document.getElementById('titulo-na-barra');
    if (!barra || !destino || !marco.current) return undefined;
    setLugar(destino);

    const altura = barra.offsetHeight;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        const passou = !entrada.isIntersecting && entrada.boundingClientRect.top < altura;
        barra.toggleAttribute('data-titulo', passou);
      },
      { rootMargin: `-${altura}px 0px 0px 0px` }
    );
    observador.observe(marco.current);

    return () => {
      observador.disconnect();
      barra.removeAttribute('data-titulo');
    };
  }, []);

  return (
    <>
      <span ref={marco} className="cab-marco" aria-hidden="true" />
      {lugar ? createPortal(titulo, lugar) : null}
    </>
  );
}
