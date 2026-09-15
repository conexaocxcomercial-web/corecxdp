import Link from 'next/link';
import {
  listarAtestados,
  listarColaboradores,
  listarMovimentacoes,
  listarOcorrencias,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { dataPorExtenso, diasAtras, formatarData, paraData, plural } from '@/lib/formato';
import { Celula, Folha, Linha, Tabela, TituloDaPagina, TituloDaSecao } from '@/componentes/Estrutura';
import { Aviso, Vazio } from '@/componentes/Sinais';
import { BotaoLink } from '@/componentes/Botao';

export const metadata = { title: 'Painel' };

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
        <TituloDaPagina titulo="Quadro de pessoal" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível ler a planilha agora. Confira as variáveis de ambiente e recarregue a página.'}
        </Aviso>
      </>
    );
  }

  const nomePorMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa.nome]));
  const ativos = pessoas.filter((pessoa) => pessoa.status === 'Ativo');
  const foraDoQuadro = pessoas.length - ativos.length;

  const porArea = [...ativos.reduce((mapa, pessoa) => {
    const area = pessoa.departamento || 'Sem área definida';
    mapa.set(area, (mapa.get(area) || 0) + 1);
    return mapa;
  }, new Map())].sort((a, b) => b[1] - a[1]);

  const maiorArea = porArea[0]?.[1] || 1;

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
    },
    {
      quantidade: checklistsAbertos.length,
      texto: `${plural(checklistsAbertos.length, 'movimentação com checklist', 'movimentações com checklist')} em aberto`,
      href: '/movimentacoes',
    },
    {
      quantidade: faltasDoMes.length,
      texto: `${plural(faltasDoMes.length, 'falta injustificada', 'faltas injustificadas')} nos últimos 30 dias`,
      href: '/ocorrencias?tipo=Falta+Injustificada',
    },
  ].filter((item) => item.quantidade > 0);

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
    .slice(0, 9);

  return (
    <>
      <TituloDaPagina
        titulo="Quadro de pessoal"
        apoio={`Situação em ${dataPorExtenso(new Date())}.`}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Folha>
          <TituloDaSecao apoio="Pessoas ativas por área">Quadro</TituloDaSecao>

          {pessoas.length === 0 ? (
            <Vazio
              titulo="Nenhum colaborador registrado"
              descricao="Cadastre a primeira pessoa para o quadro começar a existir."
              acao={<BotaoLink href="/colaboradores">Ir para colaboradores</BotaoLink>}
            />
          ) : (
            <div className="px-5 pb-6 pt-5">
              <p className="flex items-baseline gap-2.5">
                <span className="numero expandido font-mono text-[42px] font-semibold leading-none">
                  {ativos.length}
                </span>
                <span className="text-[14px] text-tinta-70">
                  {plural(ativos.length, 'pessoa ativa', 'pessoas ativas')} em{' '}
                  {porArea.length} {plural(porArea.length, 'área', 'áreas')}
                </span>
              </p>

              <ul className="mt-6 space-y-3.5">
                {porArea.map(([area, quantidade]) => (
                  <li key={area}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-campo">{area}</span>
                      <span className="numero font-mono text-[12.5px] text-tinta-70">
                        {quantidade}
                      </span>
                    </div>
                    <div className="mt-1.5 h-[6px] w-full rounded-[2px] bg-linha-clara">
                      <div
                        className="h-full rounded-[2px] bg-tinta"
                        style={{ width: `${Math.max((quantidade / maiorArea) * 100, 6)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {foraDoQuadro > 0 ? (
                <p className="mt-6 border-t border-linha pt-4 text-[12.5px] text-tinta-50">
                  {foraDoQuadro} {plural(foraDoQuadro, 'pessoa', 'pessoas')} fora do quadro ativo
                  (inativas, afastadas ou de férias).
                </p>
              ) : null}
            </div>
          )}
        </Folha>

        <Folha>
          <TituloDaSecao apoio="O que depende do DP hoje">Pendências</TituloDaSecao>

          {pendencias.length === 0 ? (
            <Vazio
              titulo="Nada pendente"
              descricao="Atestados validados, checklists concluídos e nenhuma falta injustificada no último mês."
            />
          ) : (
            <ul className="px-5 py-2">
              {pendencias.map((pendencia) => (
                <li key={pendencia.href} className="border-b border-linha-clara last:border-b-0">
                  <Link
                    href={pendencia.href}
                    className="group flex items-center gap-4 py-4 transition-colors"
                  >
                    <span className="numero font-mono text-[26px] font-medium leading-none text-carimbo">
                      {pendencia.quantidade}
                    </span>
                    <span className="text-campo leading-snug text-tinta-70 group-hover:text-tinta">
                      {pendencia.texto}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Folha>
      </div>

      <Folha className="mt-5">
        <TituloDaSecao apoio="Tudo o que entrou nos livros, em ordem">
          Últimos lançamentos
        </TituloDaSecao>

        {lancamentos.length === 0 ? (
          <Vazio
            titulo="Nenhum lançamento ainda"
            descricao="Assim que você registrar uma ocorrência, um atestado ou uma movimentação, o histórico aparece aqui."
          />
        ) : (
          <Tabela colunas={['Data', 'Livro', 'Pessoa', 'Registro']}>
            {lancamentos.map((item, indice) => (
              <Linha key={`${item.livro}-${item.matricula}-${indice}`}>
                <Celula className="w-[108px]">
                  <span className="numero font-mono text-[12.5px] text-tinta-70">
                    {formatarData(item.data)}
                  </span>
                </Celula>
                <Celula className="w-[132px] text-tinta-70">{item.livro}</Celula>
                <Celula className="w-[220px]">
                  <Link
                    href={`/colaboradores/${item.matricula}`}
                    className="font-medium underline-offset-4 hover:text-carimbo hover:underline"
                  >
                    {nomePorMatricula.get(item.matricula) || item.matricula}
                  </Link>
                </Celula>
                <Celula className="text-tinta-70">{item.descricao}</Celula>
              </Linha>
            ))}
          </Tabela>
        )}
      </Folha>
    </>
  );
}
