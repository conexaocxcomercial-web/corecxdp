'use client';

import { useState, useTransition } from 'react';
import { registrarRetornoDoAfastamento, validarAfastamentoNaLinha } from '@/app/acoes';
import { Data } from '@/componentes/Campos';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { hojeISO } from '@/lib/formato';

/*
 * Ações na linha de Atestados e afastamentos: validar o atestado (Aprovar ou
 * Rejeitar) e registrar o retorno de quem está afastado. Cada uma grava e
 * a lista se atualiza; o erro do servidor aparece logo abaixo.
 */

export function ValidacaoNaLinha({ id, rotulo }) {
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();

  function decidir(acao) {
    setErro('');
    iniciar(async () => {
      const resposta = await validarAfastamentoNaLinha({ id, acao });
      if (resposta?.erro) setErro(resposta.erro);
    });
  }

  return (
    <span className="linha-acoes">
      <button type="button" className="btn btn-fant btn-mini" disabled={enviando} onClick={() => decidir('rejeitar')} aria-label={`Rejeitar: ${rotulo}`}>
        <Icone nome="close" />
        Rejeitar
      </button>
      <button type="button" className="btn btn-acao btn-mini" disabled={enviando} onClick={() => decidir('aprovar')} aria-label={`Aprovar: ${rotulo}`}>
        <Icone nome={enviando ? 'hourglass_empty' : 'check'} />
        Aprovar
      </button>
      {erro ? <span className="linha-erro" role="alert">{erro}</span> : null}
    </span>
  );
}

export function RegistrarRetorno({ id, nome, inicio }) {
  const [aberta, setAberta] = useState(false);
  const [data, setData] = useState(hojeISO());
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();

  function salvar(evento) {
    evento.preventDefault();
    setErro('');
    iniciar(async () => {
      const resposta = await registrarRetornoDoAfastamento({ id, data });
      if (resposta?.erro) setErro(resposta.erro);
      else setAberta(false);
    });
  }

  return (
    <>
      <button type="button" className="btn btn-fant btn-mini" onClick={() => setAberta(true)} aria-haspopup="dialog">
        <Icone nome="event_available" />
        Registrar retorno
      </button>
      <Folha aberta={aberta} aoFechar={() => setAberta(false)} titulo="Registrar retorno" descricao={nome}>
        <form onSubmit={salvar} className="folha-form">
          <div className="folha-corpo">
            <Data
              rotulo="Primeiro dia de volta ao trabalho"
              nome={`retorno-${id}`}
              value={data}
              min={inicio}
              max={hojeISO()}
              onChange={(evento) => setData(evento.target.value)}
              required
            />
            <p className="nota">A situação volta para Ativo a partir deste dia.</p>
          </div>
          {erro ? (
            <div className="folha-erro">
              <div className="faixa erro" role="alert">
                <Icone nome="error" />
                <span>{erro}</span>
              </div>
            </div>
          ) : null}
          <div className="folha-pe">
            <button type="button" className="btn btn-fant" onClick={() => setAberta(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-acao" disabled={enviando}>
              <Icone nome={enviando ? 'hourglass_empty' : 'check'} />
              {enviando ? 'Salvando…' : 'Registrar retorno'}
            </button>
          </div>
        </form>
      </Folha>
    </>
  );
}
