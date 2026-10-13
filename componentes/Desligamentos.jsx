'use client';

import { useState, useTransition } from 'react';
import { decidirPendencia } from '@/app/acoes';
import { Icone } from '@/componentes/Icones';

/*
 * Concluir o desligamento na lista de Desligamentos: a mesma decisão de
 * Pendências (a rescisão foi paga). Os custos informados ficam à parte,
 * em "Informar custos", porque podem chegar depois.
 */
export function ConcluirDesligamento({ id, nome }) {
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();

  function concluir() {
    setErro('');
    iniciar(async () => {
      const resposta = await decidirPendencia({ tipo: 'desligamento', id, acao: 'concluir' });
      if (resposta?.erro) setErro(resposta.erro);
    });
  }

  return (
    <>
      <button type="button" className="btn btn-acao btn-mini" disabled={enviando} onClick={concluir} aria-label={`Concluir o desligamento de ${nome}`}>
        <Icone nome={enviando ? 'hourglass_empty' : 'task_alt'} />
        {enviando ? 'Concluindo…' : 'Rescisão paga: concluir'}
      </button>
      {erro ? (
        <span className="linha-erro" role="alert">
          {erro}
        </span>
      ) : null}
    </>
  );
}
