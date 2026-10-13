import Link from 'next/link';

/**
 * Abas com endereço próprio (?aba=ferias): o voltar funciona, um alerta leva
 * direto à aba certa e a aba aberta sobrevive a recarregar. São links, não
 * um tablist: cada aba é uma página da mesma ficha. No celular, rolam de
 * lado e ficam presas logo abaixo da barra do topo.
 */
export function Abas({ abas, atual, base, rotulo }) {
  return (
    <nav className="abas" aria-label={rotulo}>
      <ul className="abas-l">
        {abas.map((aba) => {
          const ativa = aba.chave === atual;
          return (
            <li key={aba.chave}>
              <Link
                href={aba.chave === abas[0].chave ? base : `${base}?aba=${aba.chave}`}
                scroll={false}
                className={`aba ${ativa ? 'ativa' : ''}`}
                aria-current={ativa ? 'page' : undefined}
              >
                {aba.rotulo}
                {aba.n ? <span className="aba-n">{aba.n}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
