import { listarUsuariosDaEmpresa } from '@/lib/dados/empresa';
import { mensagemParaTela } from '@/lib/avisos';
import { plural } from '@/lib/formato';
import { Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Tabela, Vazio, Wrap } from '@/componentes/Estrutura';
import { AbasDaEmpresa } from '@/componentes/AbasDaEmpresa';
import { Status } from '@/componentes/Sinais';

export const metadata = { title: 'Usuários da empresa' };

const GRADE = '1.6fr 1.4fr 1fr 100px';

/**
 * Usuários da empresa (fase 14 do redesenho): quem acessa como Gestão da
 * empresa. Convidar e desativar chegam com o login pelo Supabase Auth.
 */
export default async function UsuariosDaEmpresa() {
  let lido;
  try {
    lido = await listarUsuariosDaEmpresa();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Usuários" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar os usuários agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const { usuarios } = lido;
  return (
    <>
      <Cabecalho titulo="Usuários" subtitulo={`${usuarios.length} ${plural(usuarios.length, 'pessoa acessa', 'pessoas acessam')} como Gestão da empresa`} />
      <Wrap>
        <AbasDaEmpresa atual="usuarios" />
        <Faixa icone="info">
          A Gestão da empresa (dono e RH interno) tem o mesmo acesso: lança, aprova e acompanha, em todos os CNPJs. Convidar e desativar usuários chegam com o login novo.
        </Faixa>
        <Cartao liso>
          {usuarios.length === 0 ? (
            <Vazio icone="manage_accounts">Ninguém acessa esta empresa como Gestão ainda.</Vazio>
          ) : (
            <Tabela grade={GRADE} colunas={[{ rotulo: 'Nome' }, { rotulo: 'E-mail' }, { rotulo: 'Perfil' }, { rotulo: 'Situação' }]}>
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
