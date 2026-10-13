import { notFound } from 'next/navigation';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerAdministracao } from '@/lib/dados/administracao';
import { mensagemParaTela } from '@/lib/avisos';
import { PERFIS, pode } from '@/lib/permissoes';
import { paraBusca } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Tabela, Vazio, Wrap } from '@/componentes/Estrutura';
import { Busca, Seletor } from '@/componentes/Filtros';
import { Status } from '@/componentes/Sinais';
import { AbasDaAdministracao } from '@/componentes/AbasDaAdministracao';

export const metadata = { title: 'Usuários da plataforma' };

const GRADE = 'minmax(150px, 1.3fr) minmax(170px, 1.4fr) minmax(150px, 1fr) minmax(150px, 1.2fr) 100px';

/** Todos os usuários (fase 16 do redesenho), com o perfil e o vínculo (cliente ou parceiro). Sem senha. */
export default async function UsuariosDaPlataforma({ searchParams }) {
  const parametros = await searchParams;
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'administrar')) notFound();
  let lido;
  try {
    lido = await lerAdministracao();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Usuários" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar a administração agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const busca = paraBusca(parametros?.busca || '');
  const perfil = Object.keys(PERFIS).includes(parametros?.perfil) ? parametros.perfil : '';
  const nomeDoParceiro = new Map(lido.parceiros.map((item) => [item.id, item.nome]));
  const nomeDoCliente = new Map(lido.clientes.map((item) => [item.codigo.toLowerCase(), item.nome]));
  const usuarios = lido.usuarios.filter(
    (usuario) => (!perfil || usuario.perfil === perfil) && (!busca || paraBusca(usuario.nome).includes(busca) || paraBusca(usuario.email).includes(busca))
  );
  const vinculo = (usuario) =>
    usuario.perfil === 'admin' ? 'toda a plataforma' : usuario.perfil === 'parceiro' ? nomeDoParceiro.get(usuario.parceiro) || usuario.parceiro : nomeDoCliente.get(usuario.cliente.toLowerCase()) || usuario.empresa || usuario.cliente;
  return (
    <>
      <Cabecalho titulo="Usuários" subtitulo={`${usuarios.length} de ${lido.usuarios.length} usuários`}>
        <Busca placeholder="Buscar por nome ou e-mail" />
        <Seletor chave="perfil" rotulo="Todos os perfis" opcoes={Object.entries(PERFIS).map(([valor, rotulo]) => ({ valor, rotulo }))} />
      </Cabecalho>
      <Wrap>
        <AbasDaAdministracao atual="usuarios" />
        <Cartao liso>
          {usuarios.length === 0 ? (
            <Vazio icone="search_off">Nenhum usuário com este filtro.</Vazio>
          ) : (
            <Tabela grade={GRADE} colunas={[{ rotulo: 'Nome' }, { rotulo: 'E-mail' }, { rotulo: 'Perfil' }, { rotulo: 'Vínculo' }, { rotulo: 'Situação' }]}>
              {usuarios.map((usuario) => (
                <LinhaTabela key={usuario.email} grade={GRADE}>
                  <Celula>
                    <span className="tb-nome">{usuario.nome}</span>
                  </Celula>
                  <Celula rotulo="E-mail" alinha="c">
                    <span className="text-[var(--tinta-2)]">{usuario.email}</span>
                  </Celula>
                  <Celula rotulo="Perfil" alinha="c">
                    <span>{usuario.perfilNome}</span>
                  </Celula>
                  <Celula rotulo="Vínculo" alinha="c">
                    <span className="text-[var(--tinta-2)]">{vinculo(usuario)}</span>
                  </Celula>
                  <Celula rotulo="Situação" alinha="c">
                    <Status>{usuario.ativo ? 'Ativo' : 'Inativo'}</Status>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          )}
        </Cartao>
      </Wrap>
    </>
  );
}
