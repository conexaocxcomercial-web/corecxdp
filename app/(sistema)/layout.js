import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { contarPendencias } from '@/lib/registros';
import { alcanceAtual, resumoDoAlcance } from '@/lib/dados/alcance';
import { contarEsperandoVoce } from '@/lib/dados/pendencias';
import { navegacaoDe, precisaDeCliente } from '@/lib/navegacao';
import { Navegacao } from '@/componentes/Navegacao';
import { BarraInferior } from '@/componentes/BarraInferior';
import { BuscaDePessoa } from '@/componentes/BuscaDePessoa';
import { EscolhaDeCliente } from '@/componentes/EscolhaDeCliente';
import { MarcaDoAlcance, SeletorDeAlcance } from '@/componentes/Filtros';
import { BotaoLancar, ProvedorDoLancar } from '@/componentes/Lancar';
import { BotaoDoUsuario } from '@/componentes/MenuDoUsuario';
import { Marca } from '@/componentes/Marca';
import { Icone } from '@/componentes/Icones';

export const dynamic = 'force-dynamic';

export default async function LayoutDoSistema({ children }) {
  const alcance = await alcanceAtual();
  if (!alcance) redirect('/entrar');

  const { sessao, demonstracao } = alcance;
  const resumo = await resumoDoAlcance();
  const temCliente = Boolean(alcance.cliente);
  const { grupos, barra, lancamentos, podeLancar, perfil, inicio } = navegacaoDe(alcance.perfil, {
    temCliente,
    demonstracao,
  });
  const usuario = { nome: sessao.nome, email: sessao.email, empresa: sessao.empresa };
  const caminho = (await headers()).get('x-caminho') || '';
  const pedeCliente = precisaDeCliente(caminho) && !temCliente;

  // O número do Início na barra inferior: na demonstração, o mesmo
  // "esperando você" do Início (aprovações e prazos vencidos); fora dela,
  // as pendências do painel. Se a leitura falhar, a casca aparece sem ele.
  let pendencias = 0;
  if (temCliente && podeLancar) {
    try {
      pendencias = demonstracao ? await contarEsperandoVoce() : (await contarPendencias()).total;
    } catch {
      pendencias = 0;
    }
  }

  return (
    <ProvedorDoLancar tipos={lancamentos} podeLancar={podeLancar && temCliente}>
      <a href="#conteudo" className="pular">
        Pular para o conteúdo
      </a>
      <MarcaDoAlcance chave={alcance.chave} />
      <Navegacao empresa={alcance.cliente?.nome || sessao.empresa} grupos={grupos} inicio={inicio} />

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
          <SeletorDeAlcance alcance={resumo} />
          {temCliente ? <BuscaDePessoa /> : null}
          <BotaoLancar />
          <BotaoDoUsuario usuario={usuario} perfil={perfil} alcance={resumo} demonstracao={demonstracao} />
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        {!podeLancar && temCliente ? (
          <p className="so-consulta">
            <Icone nome="visibility" />
            <span>
              <b>Só consulta</b> · {alcance.cliente.nome}. Lançar e aprovar ficam com a Gestão da empresa.
            </span>
          </p>
        ) : null}
        {pedeCliente ? <EscolhaDeCliente alcance={resumo} /> : children}
      </main>

      <BarraInferior
        barra={barra}
        grupos={grupos}
        lancamentos={lancamentos}
        contadores={{ pendencias }}
        usuario={usuario}
        perfil={perfil}
        alcance={resumo}
        demonstracao={demonstracao}
      />
    </ProvedorDoLancar>
  );
}
