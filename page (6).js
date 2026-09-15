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
  CartaoDeRegistro,
  Celula,
  Linha,
  ListaNoCelular,
  Metrica,
  Metricas,
  Nome,
  Tabela,
  TituloDaPagina,
} from '@/componentes/Estrutura';
import { Aviso, Vazio } from '@/componentes/Sinais';
import { BotaoLink } from '@/componentes/Botao';
import { ListaProporcional } from '@/componentes/Graficos';
import { IconeSeta } from '@/componentes/Icones';

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
        <TituloDaPagina titulo="Painel" />
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

  const porArea = [...ativos.reduce((mapa, pessoa) => {
    const area = pessoa.departamento || 'Sem área definida';
    mapa.set(area, (mapa.get(area) || 0) + 1);
    return mapa;
  }, new Map())]
    .sort((a, b) => b[1] - a[1])
    .map(([rotulo, valor]) => ({ rotulo, valor }));

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

  const totalPendente = pendencias.reduce((soma, item) => soma + item.quantidade, 0);

  const { serie } = calcularIndicadores({
    pessoas,
    ocorrencias,
    atestados,
    movimentacoes,
    meses: 3,
  });
  const mesCorrente = serie[serie.length - 1];

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
        />
        <Metrica
          rotulo="Pendências"
          valor={totalPendente}
          apoio={totalPendente === 0 ? 'nada esperando o DP' : 'esperando o DP hoje'}
          cor="#FF43C0"
        />
        <Metrica
          rotulo="Absenteísmo no mês"
          valor={String(mesCorrente.absenteismo).replace('.', ',')}
          unidade="%"
          apoio={`${mesCorrente.diasPerdidos} ${plural(mesCorrente.diasPerdidos, 'dia perdido', 'dias perdidos')}`}
          cor="#7371FF"
          href="/indicadores"
        />
        <Metrica
          rotulo="Movimento do mês"
          valor={`${mesCorrente.admissoes}/${mesCorrente.saidas}`}
          apoio="admissões e saídas"
          cor="#DBBFFF"
          href="/indicadores"
        />
      </Metricas>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
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
                    className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-superficie-2 sm:px-5"
                  >
                    <span className="numero marcante w-9 shrink-0 text-[24px] font-bold leading-none text-texto">
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
          <CabecalhoDeCartao apoio="Pessoas ativas por área">Quadro</CabecalhoDeCartao>
          {pessoas.length === 0 ? (
            <Vazio
              titulo="Nenhum colaborador registrado"
              descricao="Cadastre a primeira pessoa para o quadro começar a existir."
              acao={<BotaoLink href="/colaboradores">Ir para colaboradores</BotaoLink>}
            />
          ) : (
            <ListaProporcional itens={porArea} />
          )}
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
          <>
            <Tabela colunas={['Data', 'Tipo', 'Pessoa', 'Registro']}>
              {lancamentos.map((item, indice) => (
                <Linha key={`${item.livro}-${item.matricula}-${indice}`}>
                  <Celula className="w-[110px]">
                    <span className="numero text-[12.5px] text-texto-2">
                      {formatarData(item.data)}
                    </span>
                  </Celula>
                  <Celula className="w-[132px] text-texto-2">{item.livro}</Celula>
                  <Celula className="w-[220px]">
                    <Nome href={`/colaboradores/${item.matricula}`}>
                      {nomePorMatricula.get(item.matricula) || item.matricula}
                    </Nome>
                  </Celula>
                  <Celula className="text-texto-2">{item.descricao}</Celula>
                </Linha>
              ))}
            </Tabela>

            <ListaNoCelular>
              {lancamentos.map((item, indice) => (
                <CartaoDeRegistro
                  key={`${item.livro}-${item.matricula}-${indice}`}
                  titulo={nomePorMatricula.get(item.matricula) || item.matricula}
                  href={`/colaboradores/${item.matricula}`}
                  campos={[
                    { rotulo: 'Data', valor: formatarData(item.data) },
                    { rotulo: 'Tipo', valor: item.livro },
                  ]}
                  rodape={
                    <p className="text-[12.5px] leading-snug text-texto-2">{item.descricao}</p>
                  }
                />
              ))}
            </ListaNoCelular>
          </>
        )}
      </Cartao>
    </>
  );
}
