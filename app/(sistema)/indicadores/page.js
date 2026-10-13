import Link from 'next/link';
import { filtrosDoEndereco, lerCentral } from '@/lib/dados/indicadores';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { Cabecalho, Cartao, Faixa, Vazio, Wrap } from '@/componentes/Estrutura';
import { Icone } from '@/componentes/Icones';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { SeletorDePeriodo, ValorDoIndicador, enderecoDe } from '@/componentes/Indicadores';

export const metadata = { title: 'Indicadores' };

/**
 * Central de indicadores (fase 10 do redesenho): um cartão por tema, com o
 * número principal e dois de apoio, cada um levando ao detalhe; o tema leva
 * ao painel. Saúde sempre agregada (LGPD).
 */
export default async function Indicadores({ searchParams }) {
  const filtros = filtrosDoEndereco(await searchParams);
  const permissoes = await permissoesAtuais();
  let lido;
  try {
    lido = await lerCentral(filtros);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Indicadores" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível calcular os indicadores agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const seletor = <SeletorDePeriodo base="/indicadores" filtros={filtros} />;
  if (lido.vazio) {
    return (
      <>
        <Cabecalho titulo="Indicadores" acoes={seletor} />
        <Wrap>
          <Cartao>
            <Vazio icone="monitoring" acao={permissoes.lancar ? <BotaoDeLancar tipo="admissao" rotulo="Admitir" icone="person_add" /> : null}>
              Ainda não há o que medir. Os indicadores saem das admissões, ausências e movimentações registradas.
            </Vazio>
          </Cartao>
        </Wrap>
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo="Indicadores" subtitulo={`últimos ${filtros.meses} meses, até hoje`} acoes={seletor} />
      <Wrap>
        <div className="ind-temas">
          {lido.temas.map((tema) => {
            const base = `/indicadores/${tema.chave}`;
            return (
              <section key={tema.chave} className="cartao ind-tema" aria-labelledby={`tema-${tema.chave}`}>
                <div className="ind-tema-cab">
                  <span className="ind-tema-ic" aria-hidden="true">
                    <Icone nome={tema.icone} />
                  </span>
                  <div>
                    <h2 id={`tema-${tema.chave}`} className="ind-tema-t">
                      {tema.nome}
                    </h2>
                    <p className="ind-tema-d">{tema.descricao}</p>
                  </div>
                </div>
                <Link href={enderecoDe(`${base}/${tema.principal.chave}`, filtros)} className="ind-principal">
                  <span className="ind-principal-r">{tema.principal.nome}</span>
                  <span className="ind-principal-v">
                    <ValorDoIndicador {...tema.principal} />
                  </span>
                  <span className="ind-principal-p">{tema.principal.apoio}</span>
                </Link>
                <ul className="ind-apoio" role="list">
                  {tema.apoio.map((item) => (
                    <li key={item.chave}>
                      <Link href={enderecoDe(`${base}/${item.chave}`, filtros)} className="ind-apoio-l">
                        <span>{item.nome}</span>
                        <ValorDoIndicador {...item} />
                        <Icone nome="chevron_right" className="prazo-ir" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={enderecoDe(base, filtros)} className="ind-tema-ir" aria-label={`Ver o painel completo de ${tema.nome}`}>
                  Ver o painel completo
                  <Icone nome="arrow_forward" />
                </Link>
              </section>
            );
          })}
        </div>
        <p className="nota ind-nota">
          Saúde e custos aparecem sempre por grupo: num grupo com menos de 3 pessoas, ficam ocultos.
        </p>
      </Wrap>
    </>
  );
}
