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
  Celula,
  Comando,
  Faixa,
  Kpi,
  Kpis,
  LinhaTabela,
  Nome,
  Secao,
  Tabela,
  Vazio,
  Wrap,
} from '@/componentes/Estrutura';
import { BotaoLink } from '@/componentes/Botao';
import { Rosca, Serie, SerieDupla } from '@/componentes/Graficos';
import { Icone } from '@/componentes/Icones';

export const metadata = { title: 'Painel' };

const PALETA = ['#6C5CE7', '#0E9F6E', '#1A5FA0', '#C2660B', '#D42F2F', '#8B7BF0', '#7C7C88'];

const CORES_DO_LIVRO = {
  Admissão: 'var(--ok)',
  Ocorrência: 'var(--atencao)',
  Atestado: 'var(--azul)',
  Movimentação: 'var(--acao)',
};

const GRADE = '1.4fr .8fr .8fr 2fr';

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
        <Comando titulo="Painel" />
        <Wrap>
          <Faixa tom="erro">
            {erro instanceof ErroDePlanilha
              ? erro.message
              : 'Não foi possível ler a planilha agora. Confira as variáveis de ambiente e recarregue a página.'}
          </Faixa>
        </Wrap>
      </>
    );
  }

  if (pessoas.length === 0) {
    return (
      <>
        <Comando titulo="Painel" />
        <Wrap>
          <Cartao>
            <Vazio
              icone="group_add"
              acao={<BotaoLink href="/colaboradores" icone="add">Cadastrar colaborador</BotaoLink>}
            >
              Nenhum colaborador registrado. Cadastre a primeira pessoa para o painel mostrar o
              quadro, as pendências e o histórico.
            </Vazio>
          </Cartao>
        </Wrap>
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
      icone: 'clinical_notes',
      tom: 'at',
      texto: `${plural(atestadosPendentes.length, 'atestado esperando', 'atestados esperando')} validação`,
      href: '/atestados?status=Pendente',
    },
    {
      quantidade: checklistsAbertos.length,
      icone: 'checklist',
      tom: 'ac',
      texto: `${plural(checklistsAbertos.length, 'movimentação com checklist', 'movimentações com checklist')} em aberto`,
      href: '/movimentacoes',
    },
    {
      quantidade: faltasDoMes.length,
      icone: 'event_busy',
      tom: 'cr',
      texto: `${plural(faltasDoMes.length, 'falta injustificada', 'faltas injustificadas')} nos últimos 30 dias`,
      href: '/ocorrencias?tipo=Falta+Injustificada',
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
  const mes = serie[serie.length - 1];
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
      <Comando titulo="Painel" contador={`${ativos.length} no quadro`}>
        <BotaoLink href="/indicadores" variante="fant" icone="monitoring">
          Ver indicadores
        </BotaoLink>
      </Comando>

      <Wrap>
        <Kpis>
          <Kpi
            rotulo="Pessoas ativas"
            valor={ativos.length}
            apoio={`em ${porArea.length} ${plural(porArea.length, 'área', 'áreas')}`}
            href="/colaboradores?status=Ativo"
          />
          <Kpi
            rotulo="Pendências"
            valor={totalPendente}
            cor={totalPendente ? 'var(--atencao)' : undefined}
            apoio={totalPendente === 0 ? 'nada esperando o DP' : 'esperando o DP hoje'}
          />
          <Kpi
            rotulo="Absenteísmo no mês"
            valor={`${decimal(mes.absenteismo)}%`}
            apoio={`${mes.diasPerdidos} ${plural(mes.diasPerdidos, 'dia perdido', 'dias perdidos')}`}
            href="/indicadores"
          />
          <Kpi
            rotulo="Turnover no mês"
            valor={`${decimal(mes.turnover)}%`}
            apoio={`${mes.admissoes} ${plural(mes.admissoes, 'entrada', 'entradas')}, ${mes.saidas} ${plural(mes.saidas, 'saída', 'saídas')}`}
            href="/indicadores"
          />
        </Kpis>

        <Secao titulo="O que depende de você" nota={`situação em ${dataPorExtenso(new Date())}`}>
          <div className="duas">
            <Cartao liso>
              {pendencias.length === 0 ? (
                <Vazio icone="task_alt">
                  Nada pendente. Atestados validados, checklists concluídos e nenhuma falta
                  injustificada no último mês.
                </Vazio>
              ) : (
                <ul>
                  {pendencias.map((pendencia) => (
                    <li key={pendencia.href} className="border-b border-[var(--papel-2)] last:border-0">
                      <Link
                        href={pendencia.href}
                        className="group flex items-center gap-3.5 px-[19px] py-[15px] transition-colors hover:bg-[var(--papel-2)]"
                      >
                        <span className={`pil ${pendencia.tom} h-8 w-8 justify-center p-0`}>
                          <Icone nome={pendencia.icone} tamanho={17} />
                        </span>
                        <span className="num text-[17px] font-bold">{pendencia.quantidade}</span>
                        <span className="flex-1 text-[12.5px] leading-snug text-[var(--tinta-2)]">
                          {pendencia.texto}
                        </span>
                        <Icone
                          nome="arrow_forward"
                          tamanho={17}
                          className="text-[var(--tinta-3)] transition-colors group-hover:text-[var(--acao)]"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>

            <Cartao titulo="Distribuição do quadro" descricao="Pessoas ativas por área, hoje.">
              <Rosca itens={porArea} total={ativos.length} rotulo="ativas" />
            </Cartao>
          </div>
        </Secao>

        <Secao titulo="Movimento do quadro" nota="últimos 6 meses">
          <div className="duas">
            <Cartao titulo="Pessoas ativas" descricao="Quadro ao fim de cada mês.">
              <Serie itens={serie.map((m) => ({ rotulo: m.rotulo, valor: m.quadroFim }))} />
            </Cartao>

            <Cartao titulo="Entradas e saídas" descricao="Quem entrou e quem saiu, mês a mês.">
              <SerieDupla
                itens={serie}
                series={[
                  { campo: 'admissoes', nome: 'Admissões', cor: 'var(--ok)' },
                  { campo: 'saidas', nome: 'Saídas', cor: 'var(--critico)' },
                ]}
              />
            </Cartao>
          </div>
        </Secao>

        <Secao titulo="Últimos lançamentos" nota="tudo o que entrou nos registros, em ordem">
          <Cartao liso>
            {lancamentos.length === 0 ? (
              <Vazio icone="history">
                Nenhum lançamento ainda. Assim que você registrar uma ocorrência, um atestado ou uma
                movimentação, o histórico aparece aqui.
              </Vazio>
            ) : (
              <div className="p-[10px]">
                <Tabela
                  grade={GRADE}
                  colunas={[
                    { rotulo: 'Pessoa' },
                    { rotulo: 'Tipo' },
                    { rotulo: 'Data', alinha: 'd' },
                    { rotulo: 'Registro' },
                  ]}
                >
                  {lancamentos.map((item, indice) => (
                    <LinhaTabela key={`${item.livro}-${item.matricula}-${indice}`} grade={GRADE}>
                      <Celula>
                        <Nome href={`/colaboradores/${item.matricula}`}>
                          {nomePorMatricula.get(item.matricula) || item.matricula}
                        </Nome>
                      </Celula>
                      <Celula rotulo="Tipo" alinha="c">
                        <span className="inline-flex items-center gap-1.5 text-[var(--tinta-2)]">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: CORES_DO_LIVRO[item.livro] }}
                          />
                          {item.livro}
                        </span>
                      </Celula>
                      <Celula rotulo="Data" alinha="d">
                        <span className="num">{formatarData(item.data)}</span>
                      </Celula>
                      <Celula rotulo="Registro" alinha="c">
                        <span className="text-[var(--tinta-2)]">{item.descricao}</span>
                      </Celula>
                    </LinhaTabela>
                  ))}
                </Tabela>
              </div>
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
