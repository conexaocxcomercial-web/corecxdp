'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { informarCustosDaPessoa } from '@/app/acoes';
import { Texto } from '@/componentes/Campos';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { ITENS_DE_CUSTO } from '@/lib/lancamentos';

/*
 * Custos informados pela empresa na admissão (exames, uniforme, outros) e no
 * desligamento (rescisão paga, exame demissional, outros). São valores que a
 * empresa pagou, como ela ou a contabilidade apurou: a plataforma soma, não
 * calcula (cálculos trabalhistas são da contabilidade).
 */

const NOTA = {
  admissao: 'Valores que a empresa pagou. Opcionais: dá para informar depois, em Admissões.',
  desligamento: 'Valores pagos, como a contabilidade apurou. Se ainda não sabe, deixe em branco e informe depois, em Desligamentos.',
};

const emCampo = (valor) => (valor ? valor.toFixed(2).replace('.', ',') : '');

/** Os campos custo_* de um momento, com os valores já informados quando houver. */
export function CamposDeCustos({ momento, custo = null }) {
  const atual = new Map((custo?.itens || []).map((item) => [item.item, item.valor]));
  return (
    <fieldset className="lancar-grupo">
      <legend>{momento === 'admissao' ? 'Custos da admissão' : 'Custos do desligamento'}</legend>
      <p className="nota">{NOTA[momento]}</p>
      <div className="folha-duas">
        {ITENS_DE_CUSTO[momento].map((item) => (
          <Texto
            key={item.chave}
            rotulo={item.nome}
            nome={`custo_${item.chave}`}
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={emCampo(atual.get(item.chave))}
            autoComplete="off"
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Botão "Informar custos" (ou "Corrigir custos") que abre a folha com os
 * campos. Os campos só existem com a folha aberta: assim, numa lista com um
 * botão por linha, os ids não se repetem.
 */
export function InformarCustos({ matricula, nome, momento, custo = null, mini = true, curto = false, variante }) {
  const [aberta, setAberta] = useState(false);
  const [estado, executar, enviando] = useActionState(informarCustosDaPessoa, null);

  useEffect(() => {
    if (estado?.ok) setAberta(false);
  }, [estado]);

  function enviar(evento) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => executar(dados));
  }

  const rotulo = custo ? 'Corrigir custos' : 'Informar custos';
  // Na linha de uma tabela, o rótulo curto; o nome completo fica para o leitor de tela.
  const visivel = curto && custo ? 'Corrigir' : rotulo;
  const tom = variante || (custo ? 'fant' : 'acao');
  return (
    <>
      <button
        type="button"
        className={`btn btn-${tom} ${mini ? 'btn-mini' : ''}`}
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        aria-label={`${rotulo}: ${nome}`}
      >
        <Icone nome="payments" />
        {visivel}
      </button>
      <Folha aberta={aberta} aoFechar={() => setAberta(false)} titulo={momento === 'admissao' ? 'Custos da admissão' : 'Custos do desligamento'} descricao={nome}>
        <form onSubmit={enviar} className="folha-form" aria-busy={enviando}>
          <input type="hidden" name="matricula" value={matricula} />
          <input type="hidden" name="momento" value={momento} />
          <div className="folha-corpo">
            {aberta ? <CamposDeCustos momento={momento} custo={custo} /> : null}
          </div>
          {estado?.erro ? (
            <div className="folha-erro">
              <div className="faixa erro" role="alert">
                <Icone nome="error" />
                <span>{estado.erro}</span>
              </div>
            </div>
          ) : null}
          <div className="folha-pe">
            <button type="button" className="btn btn-fant" onClick={() => setAberta(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-acao" disabled={enviando}>
              <Icone nome={enviando ? 'hourglass_empty' : 'check'} />
              {enviando ? 'Salvando…' : 'Salvar custos'}
            </button>
          </div>
        </form>
      </Folha>
    </>
  );
}
