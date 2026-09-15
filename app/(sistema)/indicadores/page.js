import Link from 'next/link';
import {
  listarAtestados,
  listarColaboradores,
  listarMovimentacoes,
  listarOcorrencias,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { calcularIndicadores } from '@/lib/indicadores';
import { plural } from '@/lib/formato';
import { Folha, TituloDaPagina, TituloDaSecao } from '@/componentes/Estrutura';
import { Aviso, Vazio } from '@/componentes/Sinais';
import { BotaoLink } from '@/componentes/Botao';
import {
  Figura,
  GraficoDeColunas,
  GraficoDeEntradasESaidas,
  GraficoDoQuadro,
  ListaProporcional,
} from '@/componentes/Graficos';

export const metadata = { title: 'Indicadores' };

const PERIODOS = [
  { meses: 3, rotulo: '3 meses' },
  { meses: 6, rotulo: '6 meses' },
  { meses: 12, rotulo: '12 meses' },
];

function SeletorDePeriodo({ atual }) {
  return (
    <nav aria-label="Período" className="flex items-center gap-1 rounded-md bg-folha p-1">
      {PERIODOS.map((opcao) => {
        const ativo = opcao.meses === atual;
        return (
          <Link
            key={opcao.meses}
            href={`/indicadores?meses=${opcao.meses}`}
            aria-current={ativo ? 'true' : undefined}
            className={`rounded-[5px] px-3 py-1.5 text-[12.5px] transition-colors ${
              ativo ? 'bg-tinta font-semibold text-folha' : 'text-tinta-70 hover:text-tinta'
            }`}
          >
            {opcao.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function Indicadores({ searchParams }) {
  const parametros = await searchParams;
  const escolhido = Number(parametros?.meses);
  const meses = [3, 6, 12].includes(escolhido) ? escolhido : 6;

  let pessoas;
  let ocorrencias;
  let atestados;
  let movimentacoes;

  try {
    [pessoas, ocorrencias, atestados, movimentacoes] = await Promise.all([
      listarColaboradores(),
      listarOcorrencias(),
      listarAtestados(),
      listarMovimentacoes(),
    ]);
  } catch (erro) {
    return (
      <>
        <TituloDaPagina titulo="Indicadores" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível calcular os indicadores agora. Recarregue a página em alguns segundos.'}
        </Aviso>
      </>
    );
  }

  if (pessoas.length === 0) {
    return (
      <>
        <TituloDaPagina titulo="Indicadores" />
        <Folha>
          <Vazio
            titulo="Ainda não há o que medir"
            descricao="Os indicadores são calculados a partir das admissões, ausências e movimentações registradas. Cadastre os colaboradores para começar."
            acao={<BotaoLink href="/colaboradores">Ir para colaboradores</BotaoLink>}
          />
        </Folha>
      </>
    );
  }

  const { serie, resumo, porTipoDeOcorrencia, porTipoDeMovimentacao, porArea, reincidentes, tempoDeCasa } =
    calcularIndicadores({ pessoas, ocorrencias, atestados, movimentacoes, meses });

  const baseMagra = resumo.lancamentos < 12;

  return (
    <>
      <TituloDaPagina
        titulo="Indicadores"
        apoio={`Turnover, absenteísmo e movimento do quadro nos últimos ${meses} meses.`}
        acao={<SeletorDePeriodo atual={meses} />}
      />

      {baseMagra ? (
        <p className="mb-5 border-l-[3px] border-carimbo bg-folha px-4 py-3 text-campo leading-relaxed text-tinta-70">
          A base tem {resumo.lancamentos} {plural(resumo.lancamentos, 'lançamento', 'lançamentos')}{' '}
          no período. As taxas já são calculadas, mas só começam a descrever a empresa depois de
          alguns meses de registro contínuo.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Folha>
          <TituloDaSecao apoio="Entradas e saídas sobre o quadro médio">Turnover</TituloDaSecao>
          <div className="px-5 pb-6 pt-5">
            <Figura valor={String(resumo.turnover).replace('.', ',')} unidade="%">
              no período, com {resumo.admissoes} {plural(resumo.admissoes, 'entrada', 'entradas')} e{' '}
              {resumo.saidas} {plural(resumo.saidas, 'saída', 'saídas')}
            </Figura>
            <GraficoDeColunas
              serie={serie}
              campo="turnover"
              sufixo="%"
              descricao="Turnover mês a mês, em percentual"
            />
          </div>
        </Folha>

        <Folha>
          <TituloDaSecao apoio="Dias perdidos sobre dias úteis disponíveis">
            Absenteísmo
          </TituloDaSecao>
          <div className="px-5 pb-6 pt-5">
            <Figura valor={String(resumo.absenteismo).replace('.', ',')} unidade="%">
              no período, somando {resumo.diasPerdidos}{' '}
              {plural(resumo.diasPerdidos, 'dia perdido', 'dias perdidos')} entre faltas e atestados
            </Figura>
            <GraficoDeColunas
              serie={serie}
              campo="absenteismo"
              sufixo="%"
              descricao="Absenteísmo mês a mês, em percentual"
            />
          </div>
        </Folha>

        <Folha>
          <TituloDaSecao apoio="Pessoas ativas ao fim de cada mês">Quadro</TituloDaSecao>
          <div className="px-5 pb-6 pt-5">
            <Figura valor={resumo.quadroAtual}>
              pessoas hoje, saldo de {resumo.saldo > 0 ? '+' : ''}
              {resumo.saldo} no período
            </Figura>
            <GraficoDoQuadro serie={serie} />
          </div>
        </Folha>

        <Folha>
          <TituloDaSecao apoio="Quem entrou e quem saiu, mês a mês">
            Admissões e saídas
          </TituloDaSecao>
          <div className="px-5 pb-6 pt-5">
            <GraficoDeEntradasESaidas serie={serie} />
            {resumo.semRegistroDeSaida > 0 ? (
              <p className="mt-5 border-t border-linha pt-4 text-[12.5px] leading-relaxed text-tinta-50">
                {resumo.semRegistroDeSaida}{' '}
                {plural(resumo.semRegistroDeSaida, 'pessoa inativa', 'pessoas inativas')} sem
                movimentação de desligamento registrada. A saída foi contada no mês corrente;
                registre o desligamento para a série ficar exata.
              </p>
            ) : null}
          </div>
        </Folha>

        <Folha>
          <TituloDaSecao apoio={`${resumo.ocorrencias} no período`}>
            Ausências por tipo
          </TituloDaSecao>
          <ListaProporcional
            itens={porTipoDeOcorrencia}
            vazio="Nenhuma ocorrência registrada no período."
          />
        </Folha>

        <Folha>
          <TituloDaSecao
            apoio={`${resumo.atestados} ${plural(resumo.atestados, 'atestado', 'atestados')}, média de ${String(resumo.mediaDiasPorAtestado).replace('.', ',')} ${plural(resumo.mediaDiasPorAtestado, 'dia', 'dias')}`}
          >
            Atestados
          </TituloDaSecao>
          <div className="px-5 pb-6 pt-5">
            <Figura valor={resumo.diasDeAtestado}>
              dias de afastamento por atestado no período
            </Figura>
            <GraficoDeColunas
              serie={serie}
              campo="diasDeAtestado"
              descricao="Dias de atestado por mês"
            />
          </div>
        </Folha>

        <Folha>
          <TituloDaSecao apoio="Quem mais acumulou ocorrências no período">
            Reincidência
          </TituloDaSecao>
          {reincidentes.length === 0 ? (
            <p className="px-5 py-8 text-center text-campo text-tinta-50">
              Ninguém com ocorrências no período.
            </p>
          ) : (
            <ul className="px-5 py-2">
              {reincidentes.map((pessoa) => (
                <li key={pessoa.matricula} className="border-b border-linha-clara last:border-b-0">
                  <Link
                    href={`/colaboradores/${pessoa.matricula}`}
                    className="group flex items-center justify-between gap-4 py-3.5"
                  >
                    <span className="text-campo font-medium group-hover:text-carimbo">
                      {pessoa.rotulo}
                    </span>
                    <span className="numero font-mono text-[13px] text-tinta-70">
                      {pessoa.valor} {plural(pessoa.valor, 'registro', 'registros')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Folha>

        <Folha>
          <TituloDaSecao apoio="Quem está no quadro hoje">Tempo de casa</TituloDaSecao>
          <ListaProporcional itens={tempoDeCasa} vazio="Sem datas de admissão registradas." />
        </Folha>

        <Folha>
          <TituloDaSecao apoio="Pessoas ativas por área">Distribuição do quadro</TituloDaSecao>
          <ListaProporcional itens={porArea} vazio="Nenhuma área informada." />
        </Folha>

        <Folha>
          <TituloDaSecao
            apoio={`${resumo.movimentacoes} no período, ${resumo.promocoes} ${plural(resumo.promocoes, 'promoção', 'promoções')}`}
          >
            Movimentações por tipo
          </TituloDaSecao>
          <ListaProporcional
            itens={porTipoDeMovimentacao}
            vazio="Nenhuma movimentação registrada no período."
          />
        </Folha>
      </div>

      <p className="mt-5 max-w-[78ch] text-[12.5px] leading-relaxed text-tinta-50">
        Como as contas são feitas: turnover é a média entre admissões e saídas do mês dividida pelo
        quadro médio. Absenteísmo é o total de dias perdidos, somando faltas e dias de atestado não
        rejeitado, sobre o quadro médio multiplicado pelos dias úteis do mês. Atestados que
        atravessam a virada do mês têm os dias distribuídos entre os dois meses.
      </p>
    </>
  );
}
