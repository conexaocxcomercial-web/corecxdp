import { redirect } from 'next/navigation';
import { usuarioDaSessao } from '@/lib/sessao';
import { contarPendencias } from '@/lib/registros';
import { emDemonstracao } from '@/lib/contexto';
import { navegacaoDe } from '@/lib/navegacao';
import { Navegacao } from '@/componentes/Navegacao';
import { BarraInferior } from '@/componentes/BarraInferior';
import { BuscaDePessoa } from '@/componentes/BuscaDePessoa';
import { BotaoLancar } from '@/componentes/Lancar';
import { BotaoDoUsuario } from '@/componentes/MenuDoUsuario';
import { Marca } from '@/componentes/Marca';

export const dynamic = 'force-dynamic';

export default async function LayoutDoSistema({ children }) {
  const sessao = await usuarioDaSessao();
  if (!sessao) redirect('/entrar');

  const usuario = { nome: sessao.nome, email: sessao.email, empresa: sessao.empresa };
  const { grupos, barra, lancamentos, podeLancar, perfil } = navegacaoDe(sessao.perfil);
  const demonstracao = emDemonstracao();

  // O número do Início na barra inferior. Se a leitura falhar, a casca
  // aparece sem ele; a própria tela mostra o erro.
  let pendencias = 0;
  try {
    pendencias = (await contarPendencias()).total;
  } catch {
    pendencias = 0;
  }

  return (
    <>
      <a href="#conteudo" className="pular">
        Pular para o conteúdo
      </a>
      <Navegacao empresa={sessao.empresa} grupos={grupos} />

      <header className="top-bar">
        <div className="top-esq">
          <Marca />
          <span id="titulo-na-barra" className="top-tit" aria-hidden="true" />
        </div>

        <div className="top-dir">
          {demonstracao ? (
            <span className="top-demo" title="O que você cadastrar some quando o servidor reinicia.">
              Dados de demonstração
            </span>
          ) : null}
          <BuscaDePessoa />
          {podeLancar ? <BotaoLancar lancamentos={lancamentos} /> : null}
          <BotaoDoUsuario usuario={usuario} perfil={perfil} demonstracao={demonstracao} />
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        {children}
      </main>

      <BarraInferior
        barra={barra}
        grupos={grupos}
        lancamentos={lancamentos}
        contadores={{ pendencias }}
        usuario={usuario}
        perfil={perfil}
        demonstracao={demonstracao}
      />
    </>
  );
}
