'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { mudarAlcance } from '@/app/acoes';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';

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
      className="sel busca"
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

/* ------------------------------------------------------------- alcance */

/** Há o que escolher? A Gestão só escolhe CNPJ quando o cliente tem mais de um. */
export function alcanceTemEscolha(alcance) {
  if (!alcance) return false;
  if (!alcance.fixo.cliente) return true;
  return alcance.opcoes.cnpjs.length > 1;
}

/** "Parceiro › Cliente › CNPJ", só com os níveis que o perfil alcança. */
export function trilhaDoAlcance(alcance) {
  const partes = [];
  if (!alcance.fixo.parceiro) partes.push(alcance.parceiro?.nome || 'Todos os parceiros');
  if (!alcance.fixo.cliente) partes.push(alcance.cliente?.nome || 'Todos os clientes');
  if (alcance.cliente && alcance.opcoes.cnpjs.length > 1) {
    partes.push(alcance.cnpj ? alcance.cnpj.nome : 'Todos os CNPJs');
  }
  return partes;
}

/**
 * Espera a tela nova chegar: o layout marca o alcance que desenhou em
 * <html data-alcance>. Serve para a view-transition saber quando terminou.
 */
function esperarAlcance(chave, limite = 3000) {
  return new Promise((resolver) => {
    const raiz = document.documentElement;
    if (raiz.dataset.alcance === chave) {
      resolver();
      return;
    }
    const observador = new MutationObserver(() => {
      if (raiz.dataset.alcance === chave) {
        observador.disconnect();
        resolver();
      }
    });
    observador.observe(raiz, { attributes: true, attributeFilter: ['data-alcance'] });
    setTimeout(() => {
      observador.disconnect();
      resolver();
    }, limite);
  });
}

/** Marca em <html> o alcance desenhado (ver esperarAlcance). */
export function MarcaDoAlcance({ chave }) {
  useEffect(() => {
    document.documentElement.dataset.alcance = chave;
  }, [chave]);
  return null;
}

const FICHA = /^\/colaboradores\/.+/;

/**
 * Troca o alcance com a mesma dissolução da troca de tema. Uma ficha de
 * outra empresa não existe no alcance novo: dali volta para a lista.
 */
export function useAplicarAlcance() {
  const router = useRouter();
  const caminho = usePathname();

  return async function aplicar(pedido) {
    const executar = async () => {
      const { chave } = await mudarAlcance(pedido);
      if (FICHA.test(caminho)) router.push('/colaboradores');
      await esperarAlcance(chave);
    };
    const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !calmo) {
      await document.startViewTransition(executar).finished.catch(() => {});
    } else {
      await executar();
    }
  };
}

function OpcaoDoAlcance({ marcada, nome, detalhe, aoEscolher }) {
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={marcada}
        className={`opcao opcao-radio ${marcada ? 'marcada' : ''}`}
        onClick={aoEscolher}
      >
        <span className="opcao-txt">
          <span className="opcao-nome">{nome}</span>
          {detalhe ? <span className="opcao-desc">{detalhe}</span> : null}
        </span>
        <span className="opcao-marca" aria-hidden="true">
          {marcada ? <Icone nome="check" /> : null}
        </span>
      </button>
    </li>
  );
}

/**
 * Folha de escolha do alcance: parceiro (só Administração), cliente
 * (Parceiro e Administração) e CNPJ (quando o cliente tem mais de um).
 * Cada nível mostra só o que o perfil alcança; o servidor confere de novo.
 */
export function FolhaDoAlcance({ aberta, aoFechar, alcance }) {
  const aplicar = useAplicarAlcance();
  const [rascunho, setRascunho] = useState({});

  useEffect(() => {
    if (aberta) {
      setRascunho({
        parceiro: alcance.parceiro?.id || null,
        cliente: alcance.cliente?.id || null,
        cnpj: alcance.cnpj?.id || null,
      });
    }
  }, [aberta, alcance]);

  const { parceiros, clientes, cnpjs } = alcance.estrutura;
  const clientesVisiveis = rascunho.parceiro
    ? clientes.filter((cliente) => cliente.parceiro_id === rascunho.parceiro)
    : clientes;
  const cnpjsVisiveis = rascunho.cliente ? cnpjs.filter((cnpj) => cnpj.cliente_id === rascunho.cliente) : [];

  function confirmar() {
    aoFechar();
    aplicar(rascunho);
  }

  return (
    <Folha
      aberta={aberta}
      aoFechar={aoFechar}
      titulo="Alcance"
      descricao="De quem são os dados que aparecem nas telas."
    >
      <div className="folha-corpo alcance">
        {!alcance.fixo.parceiro ? (
          <section>
            <p id="alcance-parceiro" className="alcance-t">
              Parceiro
            </p>
            <ul role="radiogroup" aria-labelledby="alcance-parceiro">
              <OpcaoDoAlcance
                marcada={!rascunho.parceiro}
                nome="Todos os parceiros"
                aoEscolher={() => setRascunho({ parceiro: null, cliente: null, cnpj: null })}
              />
              {parceiros.map((parceiro) => (
                <OpcaoDoAlcance
                  key={parceiro.id}
                  marcada={rascunho.parceiro === parceiro.id}
                  nome={parceiro.nome}
                  aoEscolher={() => setRascunho({ parceiro: parceiro.id, cliente: null, cnpj: null })}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {!alcance.fixo.cliente ? (
          <section>
            <p id="alcance-cliente" className="alcance-t">
              Cliente
            </p>
            <ul role="radiogroup" aria-labelledby="alcance-cliente">
              <OpcaoDoAlcance
                marcada={!rascunho.cliente}
                nome="Todos os clientes"
                aoEscolher={() => setRascunho((atual) => ({ ...atual, cliente: null, cnpj: null }))}
              />
              {clientesVisiveis.map((cliente) => (
                <OpcaoDoAlcance
                  key={cliente.id}
                  marcada={rascunho.cliente === cliente.id}
                  nome={cliente.nome}
                  detalhe={cliente.regime_tributario}
                  aoEscolher={() =>
                    setRascunho((atual) => ({ parceiro: atual.parceiro, cliente: cliente.id, cnpj: null }))
                  }
                />
              ))}
            </ul>
          </section>
        ) : null}

        {cnpjsVisiveis.length > 1 ? (
          <section>
            <p id="alcance-cnpj" className="alcance-t">
              CNPJ
            </p>
            <ul role="radiogroup" aria-labelledby="alcance-cnpj">
              <OpcaoDoAlcance
                marcada={!rascunho.cnpj}
                nome="Todos os CNPJs"
                detalhe="Consolidado"
                aoEscolher={() => setRascunho((atual) => ({ ...atual, cnpj: null }))}
              />
              {cnpjsVisiveis.map((cnpj) => (
                <OpcaoDoAlcance
                  key={cnpj.id}
                  marcada={rascunho.cnpj === cnpj.id}
                  nome={cnpj.nome}
                  detalhe={`${cnpj.tipo === 'matriz' ? 'Matriz' : 'Filial'} · ${cnpj.cnpj}`}
                  aoEscolher={() => setRascunho((atual) => ({ ...atual, cnpj: cnpj.id }))}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <div className="folha-pe">
        <button type="button" className="btn btn-fant" onClick={aoFechar}>
          Cancelar
        </button>
        <button type="button" className="btn btn-acao" onClick={confirmar}>
          <Icone nome="check" />
          Mostrar
        </button>
      </div>
    </Folha>
  );
}

/** Botão da barra do topo com a trilha do alcance; abre a FolhaDoAlcance. */
export function SeletorDeAlcance({ alcance }) {
  const [aberta, setAberta] = useState(false);
  if (!alcanceTemEscolha(alcance)) return null;
  const trilha = trilhaDoAlcance(alcance);

  return (
    <>
      <button
        type="button"
        className="alcance-botao"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        aria-label={`Alcance: ${trilha.join(', ')}. Trocar`}
      >
        <Icone nome="domain" className="alcance-botao-ic" />
        <span className="alcance-trilha">
          {trilha.map((parte, indice) => (
            <span key={`${indice}-${parte}`} className="alcance-parte">
              {parte}
            </span>
          ))}
        </span>
        <Icone nome="expand_more" className="alcance-botao-ic" />
      </button>
      <FolhaDoAlcance aberta={aberta} aoFechar={() => setAberta(false)} alcance={alcance} />
    </>
  );
}
