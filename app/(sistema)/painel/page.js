import Link from 'next/link';
import {
  contarPendencias,
  listarAtestados,
  listarColaboradores,
  listarMovimentacoes,
  listarOcorrencias,
  mensagemParaTela,
} from '@/lib/registros';
import { calcularIndicadores } from '@/lib/indicadores';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { dataPorExtenso, formatarData, paraData, plural } from '@/lib/formato';
import {
  Cartao,
  Cabecalho,
  Celula,
  Faixa,
  LinhaTabela,
  Nome,
  Numero,
  Numeros,
  Secao,
  Tabela,
  Vazio,
  Wrap,
} from '@/componentes/Estrutura';
import { BotaoLink } from '@/componentes/Botao';
import { PALETA, Rosca, Serie, SerieDupla } from '@/componentes/Graficos';
import { Icone } from '@/componentes/Icones';

export const metadata = { title: 'Painel' };

const CORES_DO_LIVRO = {
  Admissão: 'var(--ok)',
  Ocorrência: 'var(--atencao)',
  Atestado: 'var(--azul)',
  Movimentação: 'var(--acao)',
};

const GRADE = '1.4fr .8fr .8fr 2fr';

export default async function Painel() {
  const permissoes = await permissoesAtuais();
  let pessoas;
  let ocorrencias;
  let atestados;
  let movimentacoes;
  let contagem;

  try {
    [pessoas, ocorrencias, atestados, movimentacoes, contagem] = await Promise.all([
      listarColaboradores(),
      listarOcorrencias(),
      listarAtestados(),
      listarMovimentacoes(),
      contarPendencias(),
    ]);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Painel" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(
              erro,
              'Não foi possível carregar o painel agora. Recarregue a página em alguns segundos.'
            )}
          </Faixa>
        </Wrap>
      </>
    );
  }

  if (pessoas.length === 0) {
    return (
      <>
        <Cabecalho titulo="Painel" />
        <Wrap>
          <Cartao>
            <Vazio
              icone="group_add"
              acao={
                permissoes.lancar ? (
                  <BotaoLink href="/colaboradores?lancar=1" icone="add">
                    Cadastrar colaborador
                  </BotaoLink>
                ) : null
              }
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

  const pendencias = [
    {
      quantidade: contagem.atestados,
      icone: 'clinical_notes',
      tom: 'at',
      texto: `${plural(contagem.atestados, 'atestado esperando', 'atestados esperando')} validação`,
      href: '/afastamentos?validacao=Pendente',
    },
    {
      quantidade: contagem.checklists,
      icone: 'checklist',
      tom: 'ac',
      texto: `${plural(contagem.checklists, 'movimentação com checklist', 'movimentações com checklist')} em aberto`,
      href: '/movimentacoes',
    },
    {
      quantidade: contagem.faltas,
      icone: 'event_busy',
      tom: 'cr',
      texto: `${plural(contagem.faltas, 'falta injustificada', 'faltas injustificadas')} nos últimos 30 dias`,
      href: '/ocorrencias?tipo=Falta+Injustificada',
    },
  ].filter((item) => item.quantidade > 0);

  const totalPendente = contagem.total;

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
      <Cabecalho
        titulo="Painel"
        subtitulo={`${ativos.length} no quadro`}
        acoes={
          <BotaoLink href="/indicadores" variante="fant" icone="monitoring">
            Ver indicadores
          </BotaoLink>
        }
      />

      <Wrap>
        <Numeros>
          <Numero
            rotulo="Pessoas ativas"
            valor={ativos.length}
            apoio={`em ${porArea.length} ${plural(porArea.length, 'área', 'áreas')}`}
            href="/colaboradores?status=Ativo"
          />
          <Numero
            rotulo="Pendências"
            valor={totalPendente}
            tom={totalPendente ? 'var(--atencao)' : undefined}
            apoio={totalPendente === 0 ? 'nada esperando o DP' : 'esperando o DP hoje'}
          />
          <Numero
            rotulo="Absenteísmo no mês"
            valor={`${decimal(mes.absenteismo)}%`}
            apoio={`${mes.diasPerdidos} ${plural(mes.diasPerdidos, 'dia perdido', 'dias perdidos')}`}
            href="/indicadores"
          />
          <Numero
            rotulo="Turnover no mês"
            valor={`${decimal(mes.turnover)}%`}
            apoio={`${mes.admissoes} ${plural(mes.admissoes, 'entrada', 'entradas')}, ${mes.saidas} ${plural(mes.saidas, 'saída', 'saídas')}`}
            href="/indicadores"
          />
        </Numeros>

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
                    <li key={pendencia.href} className="border-b border-[var(--linha)] last:border-0">
                      <Link
                        href={pendencia.href}
                        className="group flex min-h-[72px] items-center gap-4 px-4 py-4 transition-colors hover:bg-[var(--papel-2)] min-[901px]:px-6"
                      >
                        <span className={`pil ${pendencia.tom} h-10 w-10 shrink-0 justify-center p-0`}>
                          <Icone nome={pendencia.icone} tamanho={20} />
                        </span>
                        <span className="num text-[22px] font-bold tracking-[-0.02em]">{pendencia.quantidade}</span>
                        <span className="flex-1 text-[14px] leading-snug text-[var(--tinta-2)]">
                          {pendencia.texto}
                        </span>
                        <Icone
                          nome="arrow_forward"
                          tamanho={20}
                          className="text-[var(--tinta-3)] transition-colors group-hover:text-[var(--acao-texto)]"
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
                          className="graf-ponto h-2 w-2 shrink-0 rounded-full"
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
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
