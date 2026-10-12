'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { FolhaDoLancar } from '@/componentes/Lancar';
import { ConteudoDoMenu } from '@/componentes/MenuDoUsuario';
import { estaAtiva } from '@/lib/navegacao';

/**
 * Barra inferior do celular (até 900px): cinco posições no alcance do
 * polegar. Lançar, ao centro, é o único sólido; Menu abre a navegação
 * completa com o bloco da pessoa no alto.
 */
export function BarraInferior({ barra, grupos, lancamentos, contadores, usuario, perfil, demonstracao }) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(null);
  const fechar = () => setAberta(null);

  return (
    <>
      <nav className="barra-inf" aria-label="Navegação principal">
        <ul role="list">
          {barra.map((posicao) => {
            const numero = posicao.contador ? contadores?.[posicao.contador] || 0 : 0;
            const rotulo = numero
              ? `${posicao.nome}, ${numero} ${numero === 1 ? 'pendência' : 'pendências'}`
              : posicao.nome;

            if (posicao.acao) {
              const lancar = posicao.acao === 'lancar';
              return (
                <li key={posicao.chave}>
                  <button
                    type="button"
                    className={`barra-inf-item ${lancar ? 'barra-inf-lancar' : ''}`}
                    aria-haspopup="dialog"
                    aria-expanded={aberta === posicao.acao}
                    onClick={() => setAberta(posicao.acao)}
                  >
                    <span className="barra-inf-ic">
                      <Icone nome={posicao.icone} />
                    </span>
                    <span className="barra-inf-nome">{posicao.nome}</span>
                  </button>
                </li>
              );
            }

            const ativa = estaAtiva(caminho, posicao.href);
            return (
              <li key={posicao.chave}>
                <Link
                  href={posicao.href}
                  className={`barra-inf-item ${ativa ? 'ativa' : ''}`}
                  aria-current={ativa ? 'page' : undefined}
                  aria-label={rotulo}
                >
                  <span className="barra-inf-ic">
                    <Icone nome={posicao.icone} />
                    {numero ? (
                      <span className="barra-inf-num num" aria-hidden="true">
                        {numero > 99 ? '99+' : numero}
                      </span>
                    ) : null}
                  </span>
                  <span className="barra-inf-nome" aria-hidden="true">
                    {posicao.nome}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <FolhaDoLancar aberta={aberta === 'lancar'} aoFechar={fechar} lancamentos={lancamentos} />

      <Folha aberta={aberta === 'menu'} aoFechar={fechar} titulo="Menu">
        <ConteudoDoMenu
          usuario={usuario}
          perfil={perfil}
          demonstracao={demonstracao}
          grupos={grupos}
          aoNavegar={fechar}
        />
      </Folha>
    </>
  );
}
