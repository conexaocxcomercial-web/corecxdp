import Link from 'next/link';

/* As partes de Empresa (fase 14 do redesenho): cada uma tem a própria rota. */
const ABAS_DA_EMPRESA = [
  { chave: 'dados', rotulo: 'Dados', href: '/empresa' },
  { chave: 'usuarios', rotulo: 'Usuários', href: '/empresa/usuarios' },
  { chave: 'importar', rotulo: 'Importar planilha', href: '/empresa/importar' },
  { chave: 'historico', rotulo: 'Histórico', href: '/empresa/historico' },
];

export function AbasDaEmpresa({ atual }) {
  return (
    <nav className="abas" aria-label="Partes da empresa">
      <ul className="abas-l">
        {ABAS_DA_EMPRESA.map((aba) => (
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
