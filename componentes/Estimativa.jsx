'use client';

import { useState } from 'react';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';

/*
 * Selo de estimativa (fase 12 do redesenho): todo valor calculado aparece
 * identificado como estimativa. O selo abre a explicação do cálculo e, quando
 * falta um dado da empresa, mostra o aviso ("anexo a conferir", "regime a
 * conferir") no próprio selo.
 */
export function SeloDeEstimativa({ texto, aviso, percentual }) {
  const [aberta, setAberta] = useState(false);
  return (
    <>
      <button type="button" className={`selo ${aviso ? 'com-aviso' : ''}`} onClick={() => setAberta(true)} aria-haspopup="dialog">
        <Icone nome="info" tamanho={16} />
        <span>Estimativa</span>
        {aviso ? <span className="selo-aviso">· {aviso}</span> : null}
      </button>
      <Folha aberta={aberta} aoFechar={() => setAberta(false)} titulo="Como a estimativa é feita" descricao={percentual ? `Encargos de ${percentual}` : null}>
        <div className="folha-corpo">
          <p className="selo-texto">{texto}</p>
          {aviso ? (
            <div className="faixa alerta">
              <Icone nome="warning" />
              <span>
                {aviso === 'anexo a conferir'
                  ? 'O anexo do Simples Nacional não está cadastrado: a estimativa usa 8% (só o FGTS). No Anexo IV, a contribuição patronal é paga à parte. Confira com a contabilidade.'
                  : aviso === 'regime a conferir'
                    ? 'O regime tributário não está cadastrado: a estimativa usa 8%. Confira com a contabilidade.'
                    : 'O percentual configurado para a empresa está fora do esperado: a estimativa usa o padrão do regime.'}
              </span>
            </div>
          ) : null}
        </div>
        <div className="folha-pe">
          <button type="button" className="btn btn-acao" onClick={() => setAberta(false)}>
            Entendi
          </button>
        </div>
      </Folha>
    </>
  );
}
