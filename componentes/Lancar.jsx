'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';

/**
 * "O que aconteceu?": a primeira pergunta do Lançar. Cada opção leva ao
 * cadastro da própria tela, já aberto (?lancar=1). O Lançar em três
 * passos (o quê → com quem → formulário) chega na fase 8 do redesenho.
 */
export function FolhaDoLancar({ aberta, aoFechar, lancamentos }) {
  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="O que aconteceu?" descricao="Escolha o que lançar.">
      <ul className="folha-corpo folha-lista" role="list">
        {lancamentos.map((item) => (
          <li key={item.chave}>
            <Link href={item.href} className="opcao" onClick={aoFechar}>
              <span className="opcao-ic">
                <Icone nome={item.icone} />
              </span>
              <span className="opcao-txt">
                <span className="opcao-nome">{item.nome}</span>
                <span className="opcao-desc">{item.descricao}</span>
              </span>
              <Icone nome="chevron_right" className="opcao-ir" />
            </Link>
          </li>
        ))}
      </ul>
    </Folha>
  );
}

/** Botão Lançar da barra do topo (só no computador; no celular, é a barra inferior). */
export function BotaoLancar({ lancamentos }) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-acao top-lancar" onClick={() => setAberta(true)}>
        <Icone nome="add" />
        Lançar
      </button>
      <FolhaDoLancar aberta={aberta} aoFechar={() => setAberta(false)} lancamentos={lancamentos} />
    </>
  );
}
