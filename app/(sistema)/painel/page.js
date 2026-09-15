import Link from 'next/link';
import {
  listarAtestados,
  listarColaboradores,
  listarMovimentacoes,
  listarOcorrencias,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { calcularIndicadores } from '@/lib/indicadores';
import { dataPorExtenso, diasAtras, formatarData, paraData, plural } from '@/lib/formato';
import {
  Cartao,
  CabecalhoDeCartao,
  Metrica,
  Metricas,
  TituloDaPagina,
} from '@/componentes/Estrutura';
import { Aviso, Vazio } from '@/componentes/Sinais';
import { BotaoLink } from '@/componentes/Botao';
import { GraficoDeArea, GraficoDeBarras, Miniatura, Rosca } from '@/componentes/Graficos';
import { IconeSeta } from '@/componentes/Icones';

export const metadata = { title: 'Painel' };

const PALETA = ['#7371FF', '#BEF533', '#FF43C0', '#DBBFFF', '#1E1E1E', '#8A8A8A', '#4B49E8'];

const CORES_DO_LIVRO = {
  Admissão: '#BEF533',
  Ocorrência: '#FF43C0',
  Atestado: '#DBBFFF',
  Movimentação: '#7371FF',
};

export default async function Painel() {
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
        <TituloDaPagina titulo="Painel" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível ler a planilha agora. Confira as variáveis de ambiente e recarregue a página.'}
        </Aviso>
      </>
    );
  }

  if (pessoas.length === 0) {
    return (
      <>
        <TituloDaPagina titulo="Painel" apoio={`Situação em ${dataPorExtenso(new Date())}.`} />
        <Cartao>
          <Vazio
            titulo="Nenhum colaborador registrado"
            descricao="Cadastre a primeira pessoa para o painel começar a mostrar o quadro, as pendências e o histórico."
            acao={<BotaoLink href="/colaboradores">Cadastrar colaborador</BotaoLink>}
          />
        </Cartao>
      </>
    );
  }

  const nomePorMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa.nome]));
  const ativos = pessoas.filter((pessoa) => pessoa.status === 'Ativo');

  const porArea = [...ativos.reduce((mapa, pessoa) => {
    const area = pessoa.departamento || 'Sem área definida';
    mapa.set(area, (mapa.get(area) || 0) + 1);
    return mapa;
  }, new Map())]
    .sort((a, b) => b[1] - a[1])
    .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: PALETA[indice % PALETA.length] }));

  const atestadosPendentes = atestados.filter((item) => item.status === 'Pendente');
  const checklistsAbertos = movimentacoes.filter((item) => item.checklist !== 'Concluído');
  const faltasDoMes = ocorrencias.filter(
    (item) => item.tipo === 'Falta Injustificada' && diasAtras(item.data) <= 30
  );

  const pendencias = [
    {
      quantidade: atestadosPendentes.length,
      texto: `${plural(atestadosPendentes.length, 'atestado esperando', 'atestados esperando')} validação`,
      href: '/atestados?status=Pendente',
      cor: '#FF43C0',
    },
    {
      quantidade: checklistsAbertos.length,
      texto: `${plural(checklistsAbertos.length, 'movimentação com checklist', 'movimentações com checklist')} em aberto`,
      href: '/movimentacoes',
      cor: '#7371FF',
    },
    {
      quantidade: faltasDoMes.length,
      texto: `${plural(faltasDoMes.length, 'falta injustificada', 'faltas injustificadas')} nos últimos 30 dias`,
      href: '/ocorrencias?tipo=Falta+Injustificada',
      cor: '#DBBFFF',
    },
  ].filter((item) => item.quantidade > 0);

  const totalPendente = pendencias.reduce((soma, item) => soma + item.quantidade, 0);

  const { serie } = calcularIndicadores({
    pessoas,
    ocorrencias,
    atestados,
    movimentacoes,
    meses: 6,
  });
  const mesCorrente = serie[serie.length - 1];
  const decimal = (valor) => String(valor).replace('.', ',');

  const lancamentos = [
    ...pessoas.map((pessoa) => ({
      data: pessoa.admissao,
      livro: 'Admissão',
      matricula: pessoa.matricula,
      descricao: `${pessoa.cargo || 'Cargo não informado'} em ${pessoa.departamento || 'área não informada'}`,
    })),
    ...ocorrencias.map((item) => ({
      data: item.registro || item.data,
      livro: 'Ocorrência',
      matricula: item.matricula,
      descricao: `${item.tipo}${item.motivo ? ` — ${item.motivo}` : ''}`,
    })),
    ...atestados.map((item) => ({
      data: item.registro || item.inicio,
      livro: 'Atestado',
      matricula: item.matricula,
      descricao: `${item.dias} ${plural(item.dias, 'dia', 'dias')} de afastamento${item.cid ? `, CID ${item.cid}` : ''}`,
    })),
    ...movimentacoes.map((item) => ({
      data: item.registro || item.efetiva,
      livro: 'Movimentação',
      matricula: item.matricula,
      descricao: `${item.tipo}${item.motivo ? ` — ${item.motivo}` : ''}`,
    })),
  ]
    .filter((item) => paraData(item.data))
    .sort((a, b) => paraData(b.data).getTime() - paraData(a.data).getTime())
    .slice(0, 8);

  return (
    <>
      <TituloDaPagina titulo="Painel" apoio={`Situação em ${dataPorExtenso(new Date())}.`} />

      <Metricas>
        <Metrica
          rotulo="Pessoas ativas"
          valor={ativos.length}
          apoio={`em ${porArea.length} ${plural(porArea.length, 'área', 'áreas')}`}
          cor="#BEF533"
          href="/colaboradores?status=Ativo"
          grafico={<Miniatura valores={serie.map((mes) => mes.quadroFim)} cor="#BEF533" />}
        />
        <Metrica
          rotulo="Pendências"
          valor={totalPendente}
          apoio={totalPendente === 0 ? 'nada esperando o DP' : 'esperando o DP hoje'}
          cor="#FF43C0"
        />
        <Metrica
          rotulo="Absenteísmo no mês"
          valor={decimal(mesCorrente.absenteismo)}
          unidade="%"
          apoio={`${mesCorrente.diasPerdidos} ${plural(mesCorrente.diasPerdidos, 'dia perdido', 'dias perdidos')}`}
          cor="#7371FF"
          href="/indicadores"
          grafico={<Miniatura valores={serie.map((mes) => mes.absenteismo)} cor="#7371FF" />}
        />
        <Metrica
          rotulo="Turnover no mês"
          valor={decimal(mesCorrente.turnover)}
          unidade="%"
          apoio={`${mesCorrente.admissoes} ${plural(mesCorrente.admissoes, 'entrada', 'entradas')}, ${mesCorrente.saidas} ${plural(mesCorrente.saidas, 'saída', 'saídas')}`}
          cor="#DBBFFF"
          href="/indicadores"
          grafico={<Miniatura valores={serie.map((mes) => mes.turnover)} cor="#FF43C0" />}
        />
      </Metricas>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Cartao>
          <CabecalhoDeCartao apoio="Pessoas ativas ao fim de cada mês">
            Evolução do quadro
          </CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeArea
              serie={serie}
              campo="quadroFim"
              cor="#7371FF"
              descricao="Pessoas ativas ao fim de cada mês"
            />
          </div>
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Quem está no quadro hoje">Distribuição por área</CabecalhoDeCartao>
          <Rosca itens={porArea} total={ativos.length} rotuloCentral="pessoas ativas" />
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="O que depende do DP hoje">Precisa de você</CabecalhoDeCartao>

          {pendencias.length === 0 ? (
            <Vazio
              titulo="Nada pendente"
              descricao="Atestados validados, checklists concluídos e nenhuma falta injustificada no último mês."
            />
          ) : (
            <ul className="divide-y divide-borda">
              {pendencias.map((pendencia) => (
                <li key={pendencia.href}>
                  <Link
                    href={pendencia.href}
                    className="group flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-superficie-2 sm:px-5"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-bold text-grafite"
                      style={{ background: pendencia.cor }}
                    >
                      {pendencia.quantidade}
                    </span>
                    <span className="flex-1 text-campo leading-snug text-texto-2">
                      {pendencia.texto}
                    </span>
                    <IconeSeta className="h-4 w-4 shrink-0 text-texto-3 transition-colors group-hover:text-acao" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao apoio="Entradas e saídas por mês">Movimento do quadro</CabecalhoDeCartao>
          <div className="p-4 sm:p-5">
            <GraficoDeBarras
              serie={serie}
              series={[
                { campo: 'admissoes', nome: 'Admissões', cor: '#BEF533' },
                { campo: 'saidas', nome: 'Saídas', cor: '#FF43C0' },
              ]}
              descricao="Admissões e saídas por mês"
            />
          </div>
        </Cartao>
      </div>

      <Cartao className="mt-4">
        <CabecalhoDeCartao apoio="Tudo o que entrou nos registros, em ordem">
          Últimos lançamentos
        </CabecalhoDeCartao>

        {lancamentos.length === 0 ? (
          <Vazio
            titulo="Nenhum lançamento ainda"
            descricao="Assim que você registrar uma ocorrência, um atestado ou uma movimentação, o histórico aparece aqui."
          />
        ) : (
          <ul className="px-4 py-2 sm:px-5">
            {lancamentos.map((item, indice) => (
              <li
                key={`${item.livro}-${item.matricula}-${indice}`}
                className="relative flex gap-3.5 py-3.5"
              >
                <span className="relative flex w-3 shrink-0 justify-center">
                  <span
                    aria-hidden="true"
                    className="z-10 mt-[5px] h-3 w-3 rounded-full ring-4 ring-superficie"
                    style={{ background: CORES_DO_LIVRO[item.livro] || '#8A8A8A' }}
                  />
                  {indice < lancamentos.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-[14px] h-full w-px bg-borda"
                    />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Link
                      href={`/colaboradores/${item.matricula}`}
                      className="marcante text-[14px] font-bold underline-offset-4 hover:text-acao hover:underline"
                    >
                      {nomePorMatricula.get(item.matricula) || item.matricula}
                    </Link>
                    <span className="text-[12px] text-texto-3">{item.livro}</span>
                    <span className="numero ml-auto text-[12px] text-texto-3">
                      {formatarData(item.data)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-texto-2">{item.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  );
}
