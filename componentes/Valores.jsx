'use client';

import { createContext, useContext, useState } from 'react';
import { Icone } from '@/componentes/Icones';

/*
 * Valores protegidos (LGPD): salário, CPF e dados bancários aparecem
 * mascarados e só se revelam por ação explícita, com o mesmo olho do campo
 * de senha da entrada. Na lista, um botão revela a coluna inteira; na ficha,
 * cada valor tem o próprio olho.
 */

const Protecao = createContext({ revelado: false, alternar: null });

export function ProtecaoDeValores({ children }) {
  const [revelado, setRevelado] = useState(false);
  return <Protecao.Provider value={{ revelado, alternar: () => setRevelado((atual) => !atual) }}>{children}</Protecao.Provider>;
}

/** O botão da lista que mostra ou esconde todos os valores protegidos. */
export function BotaoDeMostrar({ rotulo = 'salários' }) {
  const { revelado, alternar } = useContext(Protecao);
  if (!alternar) return null;
  return (
    <button type="button" className="btn btn-fant" aria-pressed={revelado} onClick={alternar}>
      <Icone nome={revelado ? 'visibility_off' : 'visibility'} />
      {revelado ? `Esconder ${rotulo}` : `Mostrar ${rotulo}`}
    </button>
  );
}

/**
 * Um valor protegido. Dentro de ProtecaoDeValores segue o botão da lista;
 * sozinho (`comOlho`), tem o próprio olho de 44px.
 */
export function ValorProtegido({ valor, mascara = '•••••', rotulo, comOlho = false }) {
  const { revelado: todos } = useContext(Protecao);
  const [proprio, setProprio] = useState(false);
  const visivel = todos || proprio;

  return (
    <span className={`protegido ${visivel ? 'visivel' : ''}`}>
      <span className="num" aria-label={visivel ? undefined : `${rotulo || 'Valor'} escondido`}>
        {visivel ? valor : mascara}
      </span>
      {comOlho ? (
        <button
          type="button"
          className="protegido-olho"
          aria-pressed={proprio}
          aria-label={proprio ? `Esconder ${rotulo || 'valor'}` : `Mostrar ${rotulo || 'valor'}`}
          onClick={() => setProprio((atual) => !atual)}
        >
          <Icone nome={proprio ? 'visibility_off' : 'visibility'} />
        </button>
      ) : null}
    </span>
  );
}
