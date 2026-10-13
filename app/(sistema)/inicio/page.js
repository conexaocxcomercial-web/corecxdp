import { notFound } from 'next/navigation';
import { lerInicio } from '@/lib/dados/inicio';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { Cabecalho, Cartao, Faixa, Vazio, Wrap } from '@/componentes/Estrutura';
import { BotaoLink } from '@/componentes/Botao';
import { Assunto, Atividade, FaixaDaImplantacao, FaixaDeUrgencia, FaixaDoInicio } from '@/componentes/Inicio';
import { TituloNaBarra } from '@/componentes/TituloNaBarra';

export const metadata = { title: 'Início' };

/**
 * Tela inicial da Gestão da empresa (fase 5 do redesenho, opção "Por
 * assunto"): no topo, a faixa de urgência (só com algo vencido ou vencendo
 * em até 2 dias) ou, durante a implantação, a da revisão; a faixa violeta
 * com o quadro e os números do negócio; um quadro por assunto; a atividade
 * recente. Módulo novo: só existe na demonstração (fora dela, o início é o
 * painel).
 */
export default async function Inicio() {
  const permissoes = await permissoesAtuais();
  let inicio;
  try {
    inicio = await lerInicio();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Início" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(erro, 'Não foi possível carregar o Início agora. Recarregue a página em alguns segundos.')}
          </Faixa>
        </Wrap>
      </>
    );
  }
  if (!inicio) notFound();

  const quem = permissoes.aprovar ? 'você' : 'a Gestão';

  if (inicio.vazio) {
    return (
      <>
        <Cabecalho titulo="Início" subtitulo={`${inicio.data} · ${inicio.alcance}`} />
        <Wrap>
          <Cartao>
            <Vazio
              icone="group_add"
              acao={
                permissoes.lancar ? (
                  <BotaoLink href="/colaboradores?lancar=1" icone="person_add">
                    Cadastrar a primeira pessoa
                  </BotaoLink>
                ) : null
              }
            >
              Nenhuma pessoa no quadro ainda. Cadastre a primeira para o Início mostrar o quadro, os prazos e o
              que espera {quem}.
            </Vazio>
          </Cartao>
        </Wrap>
      </>
    );
  }

  return (
    <div className="ini">
      {inicio.implantacao ? (
        <FaixaDaImplantacao implantacao={inicio.implantacao} />
      ) : (
        <FaixaDeUrgencia {...inicio.urgentes} />
      )}
      <FaixaDoInicio inicio={inicio} quem={quem} />
      <TituloNaBarra titulo="Início" />

      <div className="ini-folha">
        <div className="ini-folha-in">
          <div className="ini-grade">
            {inicio.assuntos.map((assunto) => (
              <Assunto key={assunto.chave} assunto={assunto} quem={quem} />
            ))}
          </div>
          <section className="ini-ativ" aria-labelledby="ini-ativ">
            <h2 id="ini-ativ" className="sec-tit">
              Atividade recente
            </h2>
            <Atividade itens={inicio.atividade} />
          </section>
        </div>
      </div>
    </div>
  );
}
