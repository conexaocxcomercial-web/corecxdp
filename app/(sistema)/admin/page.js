import { notFound } from 'next/navigation';
import { mensagemParaTela, resumirClientes } from '@/lib/registros';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerEstrutura } from '@/lib/dados/estrutura';
import { listarUsuarios } from '@/lib/dados/usuarios';
import { PERFIS, pode } from '@/lib/permissoes';
import { plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Faixa, Numero, Numeros, Secao, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { TabelaDeClientes } from '@/componentes/EscolhaDeCliente';

export const metadata = { title: 'Administração' };

/**
 * Início da Administração da plataforma (versão inicial, fase 3 do
 * redesenho): parceiros, clientes e usuários, e "Consultar" para ver um
 * cliente como ele vê, em só consulta. Parceiros, clientes e usuários com
 * cadastro próprio são a fase 16. Módulo novo: só existe na demonstração.
 */
export default async function Administracao() {
  const alcance = await alcanceAtual();
  if (!alcance?.demonstracao || !pode(alcance.perfil, 'administrar')) notFound();

  let estrutura;
  let clientes;
  let usuarios;
  try {
    [estrutura, clientes, usuarios] = await Promise.all([lerEstrutura(), resumirClientes(), listarUsuarios()]);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Administração" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(erro, 'Não foi possível carregar a administração agora. Recarregue a página em alguns segundos.')}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const porPerfil = (perfil) => usuarios.filter((usuario) => usuario.perfil === perfil).length;

  return (
    <>
      <Cabecalho titulo="Administração" subtitulo="Parceiros, clientes e usuários da plataforma" />
      <Wrap>
        <Numeros>
          <Numero rotulo="Parceiros" valor={estrutura.parceiros.length} />
          <Numero rotulo="Clientes" valor={clientes.length} />
          <Numero
            rotulo="Usuários"
            valor={usuarios.length}
            apoio={`${porPerfil('gestao')} da gestão, ${porPerfil('parceiro')} de parceiro, ${porPerfil('admin')} da administração`}
          />
        </Numeros>

        {estrutura.parceiros.map((parceiro) => {
          const doParceiro = clientes.filter((cliente) => cliente.parceiro_id === parceiro.id);
          return (
            <Secao
              key={parceiro.id}
              titulo={parceiro.nome}
              nota={`${doParceiro.length} ${plural(doParceiro.length, 'cliente', 'clientes')}`}
            >
              <Cartao liso>
                {doParceiro.length === 0 ? (
                  <Vazio icone="domain">Este parceiro ainda não tem clientes.</Vazio>
                ) : (
                  <TabelaDeClientes clientes={doParceiro} />
                )}
              </Cartao>
            </Secao>
          );
        })}

        <p className="nota max-w-[70ch]">
          Consultar abre o cliente como a {PERFIS.gestao} vê, em só consulta: a Administração
          dá suporte, não lança nem aprova.
        </p>
      </Wrap>
    </>
  );
}
