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
import {
  Cartao,
  CabecalhoDeCartao,
  Metrica,
  Metricas,
  TituloDaPagina,
} from '@/componentes/Estrutura';
import { Aviso, Vazio } from '@/componentes/Sinais';
import { BotaoLink } from '@/componentes/Botao';
import {
  GraficoDeArea,
  GraficoDeBarras,
  ListaProporcional,
  Rosca,
} from '@/componentes/Graficos';

export const metadata = { title: 'Indicadores' };

const PALETA = ['#7371FF', '#BEF533', '#FF43C0', '#DBBFFF', '#1E1E1E', '#8A8A8A', '#4B49E8'];

const PERIODOS = [
  { meses: 3, rotulo: '3 meses' },
  { meses: 6, rotulo: '6 meses' },
  { meses: 12, rotulo: '12 meses' },
];

function SeletorDePeriodo({ atual }) {
  return (
    <nav
      aria-label="Período"
      className="flex items-center gap-1 rounded-lg border border-borda bg-superficie p-1"
    >
      {PERIODOS.map((opcao) => {
        const ativo = opcao.meses === atual;
        return (
          <Link
            key={opcao.meses}
            href={`/indicadores?meses=${opcao.meses}`}
            aria-current={ativo ? 'true' : undefined}
            className={`rounded-md px-3 py-1.5 text-[12.5px] transition-colors ${
              ativo
                ? 'bg-acao font-bold text-acao-texto'
                : 'text-texto-2 hover:bg-superficie-2 hover:text-texto'
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
        <Cartao>
          <Vazio
            titulo="Ainda não há o que medir"
            descricao="Os indicadores são calculados a partir das admissões, ausências e movimentações registradas. Cadastre os colaboradores para começar."
            acao={<BotaoLink href="/colaboradores">Ir para colaboradores</BotaoLink>}
          />
        </Cartao>
      </>
    );
  }

  const {
    serie,
    resumo,
    porTipoDeOcorrencia,
    porTipoDeMovimentacao,
    porArea,
    reincidentes,
    tempoDeCasa,
  } = calcularIndicadores({ pessoas, ocorrencias, atestados, movimentacoes, meses });

  const baseMagra = resumo.lancamentos < 12;
  const decimal = (valor) => String(valor).replace('.', ',');

  return (
    <>
      <TituloDaPagina
        titulo="Indicadores"
        apoio={`Turnover, absenteísmo e movimento do quadro nos últimos ${meses} meses.`}
        acao={<SeletorDePeriodo atual={meses} />}
      />

      {baseMagra ? (
        <div className="mb-5 rounded-folha border border-borda bg-superficie px-4 py-3.5">
          <p className="flex items-start gap-2.5 text-campo leading-relaxed text-texto-2">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marca" />
            A base tem {resumo.lancamentos}{' '}
            {plural(resumo.lancamentos, 'lançamento', 'lançamentos')} no período. As taxas já são
            calculadas, mas só começam a descrever a empresa depois de alguns meses de registro
            contínuo.
          </p>
        </div>
      ) : null}

      <Metricas>
        <Metrica
          rotulo="Turnover"
          valor={decimal(resumo.turnover)}
          unidade="%"
          apoio={`${resumo.admissoes} ${plural(resumo.admissoes, 'entrada', 'entradas')} e ${resumo.saidas} ${plural(resumo.saidas, 'saída', 'saídas')}`}
          cor="#FF43C0"
        />
        <Metrica
          rotulo="Absenteísmo"
          valor={decimal(resumo.absenteismo)}
          unidade="%"
          apoio={`${resumo.diasPerdidos} ${plural(resumo.diasPerdidos, 'dia perdido', 'dias perdidos')}`}
          cor="#7371FF"
        />
        <Metrica
          rotulo="Quadro hoje"
          valor={resumo.quadroAtual}
          apoio={`saldo de ${resumo.saldo > 0 ? '+' : ''}${resumo.saldo} no período`}
          cor="#BEF533"
        />
        <Metrica
          rotulo="Dias de atestado"
          valor={resumo.diasDeAtestado}
          apoio={`${resumo.atestados} ${plural(resumo.atestados, 'atestado', 'atestados')}, média de ${decimal(resumo.mediaDiasPorAtestado)}`}
          cor="#DBBFFF"
        />
      </Metricas>

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao>
          <CabecalhoDeCartao apoio="Entradas e saídas sobre o quadro médio, mês a mês">
            Turnover
          </CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeBarras
              serie={serie}
              casas={1}
              sufixo="%"
              series={[{ campo: 'turnover', nome: 'Turnover', cor: '#FF43C0' }]}
              descricao="Turnover mês a mês, em percentual"
            />
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Dias perdidos sobre dias úteis disponíveis">
            Absenteísmo
          </CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeArea
              serie={serie}
              campo="absenteismo"
              casas={1}
              cor="#7371FF"
              descricao="Absenteísmo mês a mês, em percentual"
            />
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Pessoas ativas ao fim de cada mês">Quadro</CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeArea
              serie={serie}
              campo="quadroFim"
              cor="#BEF533"
              descricao="Pessoas ativas ao fim de cada mês"
            />
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Quem entrou e quem saiu, mês a mês">
            Admissões e saídas
          </CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeBarras
              serie={serie}
              series={[
                { campo: 'admissoes', nome: 'Admissões', cor: '#BEF533' },
                { campo: 'saidas', nome: 'Saídas', cor: '#FF43C0' },
              ]}
              descricao="Admissões e saídas por mês"
            />
            {resumo.semRegistroDeSaida > 0 ? (
              <p className="mt-4 border-t border-borda pt-3.5 text-[12.5px] leading-relaxed text-texto-3">
                {resumo.semRegistroDeSaida}{' '}
                {plural(resumo.semRegistroDeSaida, 'pessoa inativa', 'pessoas inativas')} sem
                movimentação de desligamento registrada. A saída foi contada no mês corrente;
                registre o desligamento para a série ficar exata.
              </p>
            ) : null}
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio={`${resumo.ocorrencias} no período`}>
            Ausências por tipo
          </CabecalhoDeCartao>
          <ListaProporcional
            itens={porTipoDeOcorrencia}
            cor="#FF43C0"
            vazio="Nenhuma ocorrência registrada no período."
          />
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Dias de atestado lançados por mês">Atestados</CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeBarras
              serie={serie}
              series={[{ campo: 'diasDeAtestado', nome: 'Dias de atestado', cor: '#DBBFFF' }]}
              descricao="Dias de atestado por mês"
            />
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Quem mais acumulou ocorrências no período">
            Reincidência
          </CabecalhoDeCartao>
          {reincidentes.length === 0 ? (
            <p className="px-5 py-10 text-center text-campo text-texto-3">
              Ninguém com ocorrências no período.
            </p>
          ) : (
            <ul className="divide-y divide-borda">
              {reincidentes.map((pessoa) => (
                <li key={pessoa.matricula}>
                  <Link
                    href={`/colaboradores/${pessoa.matricula}`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-superficie-2 sm:px-5"
                  >
                    <span className="text-campo font-bold">{pessoa.rotulo}</span>
                    <span className="numero text-[12.5px] text-texto-2">
                      {pessoa.valor} {plural(pessoa.valor, 'registro', 'registros')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Quem está no quadro hoje">Tempo de casa</CabecalhoDeCartao>
          <ListaProporcional
            itens={tempoDeCasa}
            cor="#BEF533"
            vazio="Sem datas de admissão registradas."
          />
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Pessoas ativas por área">
            Distribuição do quadro
          </CabecalhoDeCartao>
          <Rosca
            itens={porArea.map((item, indice) => ({
              ...item,
              cor: PALETA[indice % PALETA.length],
            }))}
            total={resumo.quadroAtual}
            rotuloCentral="pessoas ativas"
          />
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao
            apoio={`${resumo.movimentacoes} no período, ${resumo.promocoes} ${plural(resumo.promocoes, 'promoção', 'promoções')}`}
          >
            Movimentações por tipo
          </CabecalhoDeCartao>
          <ListaProporcional
            itens={porTipoDeMovimentacao}
            cor="#DBBFFF"
            vazio="Nenhuma movimentação registrada no período."
          />
        </Cartao>
      </div>

      <p className="mt-5 max-w-[78ch] text-[12.5px] leading-relaxed text-texto-3">
        Como as contas são feitas: turnover é a média entre admissões e saídas do mês dividida pelo
        quadro médio. Absenteísmo é o total de dias perdidos, somando faltas e dias de atestado não
        rejeitado, sobre o quadro médio multiplicado pelos dias úteis do mês. Atestados que
        atravessam a virada do mês têm os dias distribuídos entre os dois meses.
      </p>
    </>
  );
}
