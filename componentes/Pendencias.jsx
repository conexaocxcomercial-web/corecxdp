'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';
import {
  concluirRevisaoDaImplantacao,
  conferirNaRevisao,
  decidirPendencia,
  desfazerPendencia,
} from '@/app/acoes';
import { Icone } from '@/componentes/Icones';
import { linkDaFicha } from '@/componentes/Prazos';

/*
 * Aprovar, rejeitar e concluir na linha. O item sai da lista e as contagens
 * baixam na hora; a decisão vai ao servidor em seguida, e "Desfazer" fica
 * alguns segundos na tela. Se o servidor recusar, o item volta com o aviso.
 */

const Fila = createContext({ ocultos: new Set(), resolver() {} });

export function FilaDePendencias({ children }) {
  const [ocultos, setOcultos] = useState(() => new Set());
  const [aviso, setAviso] = useState(null);
  const [, iniciar] = useTransition();
  const relogio = useRef(null);

  useEffect(() => () => clearTimeout(relogio.current), []);

  const mostrar = (novo) => {
    setAviso(novo);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setAviso(null), 6000);
  };
  const reexibir = (id) =>
    setOcultos((atual) => {
      const novo = new Set(atual);
      novo.delete(id);
      return novo;
    });

  function resolver(item, acao) {
    setOcultos((atual) => new Set(atual).add(item.id));
    const texto = `${item.feito[acao]}${item.pessoa ? `: ${item.pessoa.nome}` : ''}.`;
    mostrar({ id: item.id, tipo: item.tipo, texto, podeDesfazer: false });
    iniciar(async () => {
      const resposta = await decidirPendencia({ tipo: item.tipo, id: item.id, acao });
      if (resposta?.erro) {
        reexibir(item.id);
        mostrar({ id: item.id, texto: resposta.erro, erro: true });
      } else {
        mostrar({ id: item.id, tipo: item.tipo, texto, podeDesfazer: true });
      }
    });
  }

  function desfazer() {
    const { id, tipo } = aviso;
    setAviso(null);
    clearTimeout(relogio.current);
    iniciar(async () => {
      const resposta = await desfazerPendencia({ tipo, id });
      if (resposta?.erro) mostrar({ id, texto: resposta.erro, erro: true });
      else reexibir(id);
    });
  }

  return (
    <Fila.Provider value={{ ocultos, resolver }}>
      {children}
      <div className="desfazer" role="status" aria-live="polite">
        {aviso ? (
          <div className={`desfazer-in ${aviso.erro ? 'erro' : ''}`}>
            <span>{aviso.texto}</span>
            {aviso.podeDesfazer ? (
              <button type="button" onClick={desfazer}>
                Desfazer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Fila.Provider>
  );
}

/**
 * Um número que baixa a cada item resolvido. `ids` são os itens que ele
 * conta; `um` e `varios` trazem "#" no lugar do número; `nenhum` é o zero.
 */
export function Restantes({ ids, um = '#', varios = '#', nenhum = '0' }) {
  const { ocultos } = useContext(Fila);
  const n = ids.filter((id) => !ocultos.has(id)).length;
  const mudou = ids.some((id) => ocultos.has(id));
  if (n === 0) return nenhum;
  const [antes, depois] = (n === 1 ? um : varios).split('#');
  return (
    <>
      {antes}
      <span key={n} className={`conta ${mudou ? 'muda' : ''}`}>
        {n}
      </span>
      {depois}
    </>
  );
}

const ACOES = {
  aprovar: { rotulo: 'Aprovar', icone: 'check', variante: 'acao' },
  rejeitar: { rotulo: 'Rejeitar', icone: 'close', variante: 'fant' },
  concluir: { rotulo: 'Concluir', icone: 'task_alt', variante: 'acao' },
};

const ABA_DO_TIPO = { atestado: 'saude', ferias: 'ferias', desligamento: 'desligamento' };

function ItemPendente({ item, podeAprovar }) {
  const { ocultos, resolver } = useContext(Fila);
  const oculto = ocultos.has(item.id);

  function aoResolver(evento, acao) {
    // O foco segue para o próximo item da lista (ou para o "Desfazer").
    const linha = evento.currentTarget.closest('li');
    let proxima = linha?.nextElementSibling;
    while (proxima?.classList.contains('saindo')) proxima = proxima.nextElementSibling;
    resolver(item, acao);
    requestAnimationFrame(() => {
      const alvo = proxima?.querySelector('button') || document.querySelector('.desfazer button');
      alvo?.focus();
    });
  }

  return (
    <li className={`pend ${oculto ? 'saindo' : ''}`} inert={oculto}>
      <div className="pend-in">
        <div className="pend-txt">
          {item.pessoa ? (
            <Link href={linkDaFicha(item.pessoa, ABA_DO_TIPO[item.tipo])} className="pend-nome">
              {item.pessoa.nome}
            </Link>
          ) : null}
          <span className="pend-o">{item.titulo}</span>
          <span className="pend-d">
            {item.detalhe}
            {item.prazo ? (
              <span className={`quando ${item.prazo.dias < 0 ? 'vencido' : item.prazo.dias <= 6 ? 'semana' : ''}`}>
                {item.prazo.dias < 0 ? 'rescisão atrasada' : item.prazo.dias === 0 ? 'rescisão hoje' : `rescisão em ${item.prazo.dias} dias`}
              </span>
            ) : null}
          </span>
        </div>
        {podeAprovar ? (
          <div className="pend-acoes">
            {item.acoes.map((acao) => (
              <button
                key={acao}
                type="button"
                className={`btn btn-${ACOES[acao].variante} btn-mini`}
                onClick={(evento) => aoResolver(evento, acao)}
                aria-label={`${ACOES[acao].rotulo}: ${item.titulo}${item.pessoa ? `, ${item.pessoa.nome}` : ''}`}
              >
                <Icone nome={ACOES[acao].icone} />
                {ACOES[acao].rotulo}
              </button>
            ))}
          </div>
        ) : (
          <span className="pil at pend-espera">
            <span className="pil-pt" />
            Esperando a Gestão
          </span>
        )}
      </div>
    </li>
  );
}

/** Aprovações na linha; quando a última sai, aparece o `vazio`. */
export function ListaDeAprovacoes({ itens, podeAprovar, vazio }) {
  const { ocultos } = useContext(Fila);
  const restantes = itens.filter((item) => !ocultos.has(item.id)).length;

  return (
    <>
      {itens.length ? (
        <ul className="linhas">
          {itens.map((item) => (
            <ItemPendente key={item.id} item={item} podeAprovar={podeAprovar} />
          ))}
        </ul>
      ) : null}
      {restantes === 0 ? (
        <p className="lista-vazia">
          <Icone nome="task_alt" />
          {vazio}
        </p>
      ) : null}
    </>
  );
}

/* --------------------------------------------- revisão da implantação */

/** Um item da revisão: o que parece inconsistente, como conferir e a marca de conferido. */
export function ItemDaRevisao({ item, podeConferir }) {
  const [conferido, setConferido] = useState(item.conferido);
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();

  useEffect(() => setConferido(item.conferido), [item.conferido]);

  function alternar() {
    const novo = !conferido;
    setConferido(novo);
    setErro('');
    iniciar(async () => {
      const resposta = await conferirNaRevisao({ id: item.id, conferido: novo });
      if (resposta?.erro) {
        setConferido(!novo);
        setErro(resposta.erro);
      }
    });
  }

  const destino = linkDaFicha(item.pessoa, item.aba);
  return (
    <li className={`revisao ${conferido ? 'conferido' : ''}`}>
      <div className="revisao-txt">
        <span className="prazo-t">{item.titulo}</span>
        <span className="prazo-d">
          {item.pessoa && destino ? (
            <Link href={destino} className="revisao-p">
              {item.pessoa.nome}
            </Link>
          ) : null}
          {item.pessoa ? ' · ' : ''}
          {item.detalhe}
        </span>
        <span className="revisao-o">{item.orientacao}</span>
        {erro ? <span className="revisao-erro">{erro}</span> : null}
      </div>
      {podeConferir ? (
        <button
          type="button"
          className={`btn btn-mini ${conferido ? 'btn-acao' : 'btn-fant'}`}
          aria-pressed={conferido}
          onClick={alternar}
          disabled={enviando}
        >
          <Icone nome={conferido ? 'check' : 'fact_check'} />
          {conferido ? 'Conferido' : 'Conferir'}
        </button>
      ) : null}
    </li>
  );
}

/** "Concluir revisão": só com tudo conferido; daí em diante, os alertas começam. */
export function ConcluirRevisao({ faltam }) {
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();

  function concluir() {
    setErro('');
    iniciar(async () => {
      const resposta = await concluirRevisaoDaImplantacao();
      if (resposta?.erro) setErro(resposta.erro);
    });
  }

  return (
    <div className="revisao-pe">
      <p className="nota">
        {faltam > 0
          ? `${faltam === 1 ? 'Falta conferir 1 item' : `Faltam conferir ${faltam} itens`}. Os alertas de prazo começam quando a revisão terminar.`
          : 'Tudo conferido. Ao concluir, os alertas de prazo começam para tudo o que está nos dados.'}
      </p>
      {erro ? <p className="revisao-erro">{erro}</p> : null}
      <button type="button" className="btn btn-acao" onClick={concluir} disabled={faltam > 0 || enviando}>
        <Icone nome={enviando ? 'hourglass_empty' : 'task_alt'} />
        {enviando ? 'Concluindo…' : 'Concluir revisão'}
      </button>
    </div>
  );
}
