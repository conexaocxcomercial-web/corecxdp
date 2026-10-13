import { notFound } from 'next/navigation';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerAdministracao } from '@/lib/dados/administracao';
import { mensagemParaTela } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import { plural } from '@/lib/formato';
import { Cabecalho, Cartao, Faixa, Numero, Numeros, Secao, Vazio, Wrap } from '@/componentes/Estrutura';
import { AbasDaAdministracao } from '@/componentes/AbasDaAdministracao';
import { BotaoConsultar } from '@/componentes/EscolhaDeCliente';

export const metadata = { title: 'Administração' };

/**
 * Início da Administração da plataforma (fase 16 do redesenho): os números
 * da plataforma e o que pede suporte (implantação em revisão, regime ou
 * anexo a conferir, cliente sem usuário da Gestão, prazos vencidos, cores de
 * parceiro recusadas pela checagem de contraste). A Administração dá
 * suporte: consulta, não lança nem aprova.
 */
export default async function Administracao() {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'administrar')) notFound();
  let lido;
  try {
    lido = await lerAdministracao();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Administração" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar a administração agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }
  const { numeros, suporte } = lido;
  return (
    <>
      <Cabecalho titulo="Administração" subtitulo="Parceiros, clientes e usuários da plataforma" />
      <Wrap>
        <AbasDaAdministracao atual="inicio" />
        <Numeros>
          <Numero rotulo="Parceiros" valor={numeros.parceiros} href="/admin/parceiros" />
          <Numero rotulo="Clientes" valor={numeros.clientes} apoio={`${numeros.pessoas} pessoas no quadro`} href="/admin/clientes" />
          <Numero
            rotulo="Usuários"
            valor={numeros.usuarios}
            apoio={`${numeros.porPerfil.gestao} da gestão, ${numeros.porPerfil.parceiro} de parceiro, ${numeros.porPerfil.admin} da administração`}
            href="/admin/usuarios"
          />
          <Numero rotulo="Pedem suporte" valor={suporte.length} tom={suporte.length ? 'var(--atencao)' : undefined} apoio="clientes e parceiros" />
        </Numeros>
        <Secao titulo="Pede suporte" nota="o que conferir com cada cliente ou parceiro">
          <Cartao liso>
            {suporte.length === 0 ? (
              <Vazio icone="task_alt">Nada pedindo suporte agora.</Vazio>
            ) : (
              <ul className="sup-lista" role="list">
                {suporte.map((item) => (
                  <li key={`${item.tipo}-${item.id}`} className="sup-item">
                    <span className="sup-quem">
                      <b>{item.nome}</b>
                      <span className="tb-sub">{item.tipo === 'cliente' ? `cliente de ${item.parceiro}` : 'parceiro'}</span>
                    </span>
                    <span className="sup-motivos">
                      {item.motivos.map((motivo) => (
                        <span key={motivo}>{motivo}</span>
                      ))}
                    </span>
                    {item.tipo === 'cliente' ? <BotaoConsultar parceiro={item.parceiro_id} cliente={item.id} nome={item.nome} /> : null}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </Secao>
        <p className="nota ind-nota">
          Consultar abre o cliente como a Gestão da empresa vê, em só consulta. Criar parceiros, empresas e usuários chega com o login pelo Supabase; até lá, o cadastro é feito pela equipe da plataforma.
        </p>
      </Wrap>
    </>
  );
}
