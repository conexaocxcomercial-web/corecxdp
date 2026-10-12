'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sair } from '@/app/acoes';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { SeletorDeTema } from '@/componentes/Tema';
import { iniciais } from '@/lib/formato';
import { estaAtiva } from '@/lib/navegacao';
import { MARCA } from '@/lib/marca';

export function Avatar({ nome, grande = false }) {
  return (
    <span className={`avatar ${grande ? 'avatar-g' : ''}`} aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}

/**
 * Conteúdo do menu do usuário: quem é, em que empresa, tema, ajuda e
 * sair. Com `grupos` (aba Menu do celular), mostra também a navegação
 * completa entre o bloco da pessoa e o tema.
 */
export function ConteudoDoMenu({ usuario, perfil, demonstracao, grupos, aoNavegar }) {
  const caminho = usePathname();
  const { whatsapp, email } = MARCA.suporte;

  return (
    <div className="folha-corpo menu-u">
      <div className="menu-u-quem">
        <Avatar nome={usuario.nome} grande />
        <div className="menu-u-id">
          <p className="menu-u-nome">{usuario.nome}</p>
          <p className="menu-u-email">{usuario.email}</p>
        </div>
      </div>

      <dl className="menu-u-dados">
        <div>
          <dt>Perfil</dt>
          <dd>{perfil}</dd>
        </div>
        <div>
          <dt>Empresa</dt>
          <dd>{usuario.empresa}</dd>
        </div>
      </dl>

      {demonstracao ? (
        <p className="menu-u-demo">
          <Icone nome="info" />
          Dados de demonstração: o que você cadastrar some quando o servidor reinicia.
        </p>
      ) : null}

      {grupos ? (
        <nav className="menu-u-nav" aria-label="Todas as telas">
          {grupos.map((grupo) => (
            <div key={grupo.chave} className="menu-u-grupo">
              {grupo.rotulo ? <p className="menu-u-grupo-t">{grupo.rotulo}</p> : null}
              <ul role="list">
                {grupo.itens.map((item) => {
                  const ativa = estaAtiva(caminho, item.href);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`opcao opcao-nav ${ativa ? 'ativa' : ''}`}
                        aria-current={ativa ? 'page' : undefined}
                        onClick={aoNavegar}
                      >
                        <span className="opcao-ic">
                          <Icone nome={item.icone} />
                        </span>
                        <span className="opcao-nome">{item.nome}</span>
                        <Icone nome="chevron_right" className="opcao-ir" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      ) : null}

      <section className="menu-u-bloco" aria-labelledby="menu-u-tema">
        <p id="menu-u-tema" className="menu-u-bloco-t">
          Tema
        </p>
        <SeletorDeTema className="menu-u-tema" />
      </section>

      <section className="menu-u-bloco" aria-labelledby="menu-u-ajuda">
        <p id="menu-u-ajuda" className="menu-u-bloco-t">
          Ajuda
        </p>
        <p className="menu-u-txt">Dúvida ou problema? Fale com a {MARCA.empresa}.</p>
        <ul className="menu-u-contatos" role="list">
          <li>
            <a href={whatsapp.link} target="_blank" rel="noopener noreferrer">
              <Icone nome="chat" />
              <span>
                WhatsApp <span className="num">{whatsapp.exibicao}</span>
              </span>
            </a>
          </li>
          <li>
            <a href={email.link}>
              <Icone nome="mail" />
              <span>{email.exibicao}</span>
            </a>
          </li>
        </ul>
      </section>

      <form action={sair} className="menu-u-sair">
        <button type="submit" className="btn btn-fant">
          <Icone nome="logout" />
          Sair
        </button>
      </form>
    </div>
  );
}

/** Avatar da barra do topo: abre o menu (popover no computador, folha no celular). */
export function BotaoDoUsuario({ usuario, perfil, demonstracao }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        className="top-avatar"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-label={`Menu de ${usuario.nome}`}
      >
        <Avatar nome={usuario.nome} />
      </button>
      <Folha aberta={aberto} aoFechar={() => setAberto(false)} tipo="popover" titulo="Sua conta">
        <ConteudoDoMenu usuario={usuario} perfil={perfil} demonstracao={demonstracao} />
      </Folha>
    </>
  );
}
