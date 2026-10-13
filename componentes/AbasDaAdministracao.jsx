import Link from 'next/link';

/* As partes da Administração da plataforma (fase 16 do redesenho). */
const ABAS = [
  { chave: 'inicio', rotulo: 'Suporte', href: '/admin' },
  { chave: 'parceiros', rotulo: 'Parceiros', href: '/admin/parceiros' },
  { chave: 'clientes', rotulo: 'Clientes', href: '/admin/clientes' },
  { chave: 'usuarios', rotulo: 'Usuários', href: '/admin/usuarios' },
];

export function AbasDaAdministracao({ atual }) {
  return (
    <nav className="abas" aria-label="Partes da administração">
      <ul className="abas-l">
        {ABAS.map((aba) => (
          <li key={aba.chave}>
            <Link href={aba.href} className={`aba ${aba.chave === atual ? 'ativa' : ''}`} aria-current={aba.chave === atual ? 'page' : undefined}>
              {aba.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
