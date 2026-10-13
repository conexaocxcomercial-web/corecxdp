'use client';

import { Icone } from '@/componentes/Icones';

/** Abre a impressão do navegador (dá para salvar em PDF dali). */
export function BotaoDeImprimir() {
  return (
    <button type="button" className="btn btn-acao nao-imprime" onClick={() => window.print()}>
      <Icone nome="print" />
      Imprimir ou salvar em PDF
    </button>
  );
}
