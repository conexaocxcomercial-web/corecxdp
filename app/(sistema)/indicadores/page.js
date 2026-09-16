import Link from 'next/link';
import {
  listarAtestados, listarColaboradores, listarMovimentacoes, listarOcorrencias,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { calcularIndicadores } from '@/lib/indicadores';
import { plural } from '@/lib/formato';
import {
  Cartao, Comando, Faixa, Kpi, Kpis, Secao, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { BotaoLink } from '@/componentes/Botao';
import { BarrasH, Rosca, Serie, SerieDupla } from '@/componentes/Graficos';

export const metadata = { title: 'Indicadores' };

const PALETA = ['#6C5CE7', '#0E9F6E', '#1A5FA0', '#C2660B', '#D42F2F', '#8B7BF0', '#7C7C88'];
const PERIODOS = [3, 6, 12];

export default async function Indicadores({ searchParams }) {
  const parametros = await searchParams;
  const escolhido = Number(parametros?.meses);
  const meses = PERIODOS.includes(escolhido) ? escolhido : 6;

  let pessoas;
  let ocorrencias;
  let atestados;
  let movimentacoes;

  try {
    [pessoas, ocorrencias, atestados, movimentacoes] = await Promise.all([
      listarColaboradores(), listarOcorrencias(), listarAtestados(), listarMovimentacoes(),
    ]);
  } catch (erro) {
    return (
      <>
        <Comando titulo="Indicadores" />
        <Wrap>
          <Faixa tom="erro">
            {erro instanceof ErroDePlanilha
              ? erro.message
              : 'Não foi possível calcular os indicadores agora. Recarregue a página em alguns segundos.'}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const seletor = (
    <div className="segm" role="tablist" aria-label="Período">
      {PERIODOS.map((opcao) => (
        <Link
          key={opcao}
          href={`/indicadores?meses=${opcao}`}
          role="tab"
          aria-selected={opcao === meses}
          className={`segm-btn ${opcao === meses ? 'on' : ''}`}
        >
          {opcao} meses
        </Link>
      ))}
    </div>
  );

  if (pessoas.length === 0) {
    return (
      <>
        <Comando titulo="Indicadores">{seletor}</Comando>
        <Wrap>
          <Cartao>
            <Vazio icone="monitoring" acao={<BotaoLink href="/colaboradores" icone="add">Cadastrar colaborador</BotaoLink>}>
              Ainda não há o que medir. Os indicadores são calculados a partir das admissões,
              ausências e movimentações registradas.
            </Vazio>
          </Cartao>
        </Wrap>
      </>
    );
  }

  const {
    serie, resumo, porTipoDeOcorrencia, porTipoDeMovimentacao, porArea, reincidentes, tempoDeCasa,
  } = calcularIndicadores({ pessoas, ocorrencias, atestados, movimentacoes, meses });

  const decimal = (valor) => String(valor).replace('.', ',');

  return (
    <>
      <Comando titulo="Indicadores" contador={`últimos ${meses} meses`}>
        {seletor}
      </Comando>

      <Wrap>
        {resumo.lancamentos < 12 ? (
          <Faixa tom="info">
            A base tem <b>{resumo.lancamentos}</b>{' '}
            {plural(resumo.lancamentos, 'lançamento', 'lançamentos')} no período. As taxas já são
            calculadas, mas só começam a descrever a empresa depois de alguns meses de registro
            contínuo.
          </Faixa>
        ) : null}

        <Kpis>
          <Kpi
            rotulo="Turnover"
            valor={`${decimal(resumo.turnover)}%`}
            apoio={`${resumo.admissoes} ${plural(resumo.admissoes, 'entrada', 'entradas')} e ${resumo.saidas} ${plural(resumo.saidas, 'saída', 'saídas')}`}
          />
          <Kpi
            rotulo="Absenteísmo"
            valor={`${decimal(resumo.absenteismo)}%`}
            apoio={`${resumo.diasPerdidos} ${plural(resumo.diasPerdidos, 'dia perdido', 'dias perdidos')}`}
          />
          <Kpi
            rotulo="Quadro hoje"
            valor={resumo.quadroAtual}
            cor="var(--ok)"
            apoio={`saldo de ${resumo.saldo > 0 ? '+' : ''}${resumo.saldo} no período`}
          />
          <Kpi
            rotulo="Dias de atestado"
            valor={resumo.diasDeAtestado}
            apoio={`${resumo.atestados} ${plural(resumo.atestados, 'atestado', 'atestados')}, média de ${decimal(resumo.mediaDiasPorAtestado)}`}
          />
        </Kpis>

        <Secao titulo="Como o quadro se moveu" nota="mês a mês">
          <div className="duas">
            <Cartao titulo="Turnover" descricao="Entradas e saídas sobre o quadro médio do mês.">
              <Serie
                itens={serie.map((m) => ({ rotulo: m.rotulo, valor: m.turnover }))}
                cor="var(--critico)"
                casas={1}
                sufixo="%"
              />
            </Cartao>
            <Cartao titulo="Absenteísmo" descricao="Dias perdidos sobre os dias úteis disponíveis.">
              <Serie
                itens={serie.map((m) => ({ rotulo: m.rotulo, valor: m.absenteismo }))}
                casas={1}
                sufixo="%"
              />
            </Cartao>
            <Cartao titulo="Pessoas ativas" descricao="Quadro ao fim de cada mês.">
              <Serie
                itens={serie.map((m) => ({ rotulo: m.rotulo, valor: m.quadroFim }))}
                cor="var(--ok)"
              />
            </Cartao>
            <Cartao titulo="Entradas e saídas" descricao="Quem entrou e quem saiu, mês a mês.">
              <SerieDupla
                itens={serie}
                series={[
                  { campo: 'admissoes', nome: 'Admissões', cor: 'var(--ok)' },
                  { campo: 'saidas', nome: 'Saídas', cor: 'var(--critico)' },
                ]}
              />
              {resumo.semRegistroDeSaida > 0 ? (
                <p className="mt-4 border-t border-[var(--linha)] pt-3 text-[11.5px] leading-relaxed text-[var(--tinta-3)]">
                  {resumo.semRegistroDeSaida}{' '}
                  {plural(resumo.semRegistroDeSaida, 'pessoa inativa', 'pessoas inativas')} sem
                  movimentação de desligamento registrada. A saída foi contada no mês corrente.
                </p>
              ) : null}
            </Cartao>
          </div>
        </Secao>

        <Secao titulo="Ausências" nota={`${resumo.ocorrencias} no período`}>
          <div className="duas">
            <Cartao titulo="Por tipo" descricao="Como as ausências se distribuem.">
              {porTipoDeOcorrencia.length ? (
                <BarrasH itens={porTipoDeOcorrencia} cor="var(--atencao)" />
              ) : (
                <Vazio icone="event_available">Nenhuma ocorrência registrada no período.</Vazio>
              )}
            </Cartao>

            <Cartao titulo="Reincidência" descricao="Quem mais acumulou ocorrências no período.">
              {reincidentes.length ? (
                <ul className="-mx-[19px] -mb-[17px]">
                  {reincidentes.map((pessoa) => (
                    <li key={pessoa.matricula} className="border-b border-[var(--papel-2)] last:border-0">
                      <Link
                        href={`/colaboradores/${pessoa.matricula}`}
                        className="flex items-center justify-between gap-4 px-[19px] py-3 text-[12.5px] transition-colors hover:bg-[var(--papel-2)]"
                      >
                        <span className="font-semibold">{pessoa.rotulo}</span>
                        <span className="num text-[var(--tinta-2)]">
                          {pessoa.valor} {plural(pessoa.valor, 'registro', 'registros')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Vazio icone="sentiment_satisfied">Ninguém com ocorrências no período.</Vazio>
              )}
            </Cartao>

            <Cartao titulo="Dias de atestado" descricao="Afastamento médico lançado por mês.">
              <Serie
                itens={serie.map((m) => ({ rotulo: m.rotulo, valor: m.diasDeAtestado }))}
                cor="var(--azul)"
              />
            </Cartao>

            <Cartao titulo="Movimentações por tipo" descricao={`${resumo.movimentacoes} no período, ${resumo.promocoes} ${plural(resumo.promocoes, 'promoção', 'promoções')}.`}>
              {porTipoDeMovimentacao.length ? (
                <BarrasH itens={porTipoDeMovimentacao} />
              ) : (
                <Vazio icone="swap_horiz">Nenhuma movimentação registrada no período.</Vazio>
              )}
            </Cartao>
          </div>
        </Secao>

        <Secao titulo="Quem está no quadro" nota="situação de hoje">
          <div className="duas">
            <Cartao titulo="Distribuição por área">
              <Rosca
                itens={porArea.map((item, indice) => ({ ...item, cor: PALETA[indice % PALETA.length] }))}
                total={resumo.quadroAtual}
                rotulo="ativas"
              />
            </Cartao>
            <Cartao titulo="Tempo de casa" descricao="Há quanto tempo cada faixa está na empresa.">
              <BarrasH itens={tempoDeCasa} cor="var(--ok)" />
            </Cartao>
          </div>
        </Secao>

        <p className="max-w-[78ch] text-[11.5px] leading-relaxed text-[var(--tinta-3)]">
          Como as contas são feitas: turnover é a média entre admissões e saídas do mês dividida
          pelo quadro médio. Absenteísmo é o total de dias perdidos, somando faltas e dias de
          atestado não rejeitado, sobre o quadro médio multiplicado pelos dias úteis do mês.
          Atestados que atravessam a virada do mês têm os dias distribuídos entre os dois meses.
        </p>
      </Wrap>
    </>
  );
}
