import Link from 'next/link';
import { OPCOES, listarColaboradores, listarMovimentacoes } from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, hojeISO, plural } from '@/lib/formato';
import { Celula, Folha, Linha, Tabela, TituloDaPagina } from '@/componentes/Estrutura';
import { Aviso, Status, Vazio } from '@/componentes/Sinais';
import { Filtros } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Paragrafo, Selecao } from '@/componentes/Campos';
import { BotaoCompacto } from '@/componentes/Botao';
import { atualizarChecklist, salvarMovimentacao } from '@/app/acoes';

export const metadata = { title: 'Movimentações' };

function Checklist({ item }) {
  if (item.checklist === 'Concluído') return <Status>{item.checklist}</Status>;

  const proximo = item.checklist === 'Pendente' ? 'Em andamento' : 'Concluído';

  return (
    <span className="flex items-center gap-2.5">
      <Status>{item.checklist}</Status>
      <form action={atualizarChecklist}>
        <input type="hidden" name="linha" value={item.linha} />
        <input type="hidden" name="status" value={proximo} />
        <BotaoCompacto>
          {proximo === 'Concluído' ? 'Concluir' : 'Iniciar'}
        </BotaoCompacto>
      </form>
    </span>
  );
}

export default async function Movimentacoes({ searchParams }) {
  const parametros = await searchParams;
  const busca = String(parametros?.busca || '').trim().toLowerCase();
  const tipo = String(parametros?.tipo || '');

  let movimentacoes;
  let pessoas;

  try {
    [movimentacoes, pessoas] = await Promise.all([listarMovimentacoes(), listarColaboradores()]);
  } catch (erro) {
    return (
      <>
        <TituloDaPagina titulo="Movimentações" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível ler a aba Movimentacoes_DP agora. Confira as variáveis de ambiente e recarregue a página.'}
        </Aviso>
      </>
    );
  }

  const porMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa]));

  const filtradas = movimentacoes.filter((item) => {
    const nome = porMatricula.get(item.matricula)?.nome || '';
    const combinaTexto =
      !busca ||
      nome.toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.motivo.toLowerCase().includes(busca);

    return combinaTexto && (!tipo || item.tipo === tipo);
  });

  const registro = (
    <PainelDeRegistro
      abrir="Registrar movimentação"
      titulo="Registrar movimentação"
      descricao="Promoções, transferências, afastamentos e desligamentos, com a data em que a mudança passa a valer."
      acao={salvarMovimentacao}
      enviar="Registrar movimentação"
      enviando="Registrando…"
    >
      <Selecao
        rotulo="Colaborador"
        nome="matricula"
        opcoes={pessoas.map((pessoa) => ({
          valor: pessoa.matricula,
          texto: `${pessoa.nome} (${pessoa.matricula})`,
        }))}
        required
      />
      <Selecao rotulo="Tipo" nome="tipo" opcoes={OPCOES.tiposDeMovimentacao} />
      <Data rotulo="Passa a valer em" nome="efetiva" defaultValue={hojeISO()} required />
      <Paragrafo
        rotulo="Motivo"
        nome="motivo"
        placeholder="O que motivou a mudança e quem aprovou."
        required
      />
      <Selecao rotulo="Checklist" nome="checklist" opcoes={OPCOES.statusChecklist} />
    </PainelDeRegistro>
  );

  return (
    <>
      <TituloDaPagina
        titulo="Movimentações"
        apoio="Mudanças na vida funcional das pessoas: o que muda, quando passa a valer e o que o DP ainda precisa fazer."
        acao={registro}
      />

      <Folha>
        <Filtros
          busca="Buscar por pessoa, matrícula ou motivo"
          seletores={[
            { chave: 'tipo', rotulo: 'Todos os tipos', opcoes: OPCOES.tiposDeMovimentacao },
          ]}
        />

        {filtradas.length === 0 ? (
          <Vazio
            titulo={
              movimentacoes.length === 0 ? 'Nenhuma movimentação registrada' : 'Nada encontrado'
            }
            descricao={
              movimentacoes.length === 0
                ? 'Registre a primeira movimentação para acompanhar promoções, transferências e desligamentos.'
                : 'Nenhuma movimentação corresponde à busca. Limpe os filtros ou tente outro termo.'
            }
            acao={movimentacoes.length === 0 ? registro : null}
          />
        ) : (
          <>
            <Tabela colunas={['Efetiva em', 'Pessoa', 'Tipo', 'Motivo', 'Checklist']}>
              {filtradas.map((item) => (
                <Linha key={item.id}>
                  <Celula className="w-[116px]">
                    <span className="numero font-mono text-[12.5px] text-tinta-70">
                      {formatarData(item.efetiva)}
                    </span>
                  </Celula>
                  <Celula className="w-[204px]">
                    <Link
                      href={`/colaboradores/${item.matricula}`}
                      className="font-medium underline-offset-4 hover:text-carimbo hover:underline"
                    >
                      {porMatricula.get(item.matricula)?.nome || item.matricula}
                    </Link>
                  </Celula>
                  <Celula className="w-[172px] text-tinta-70">{item.tipo}</Celula>
                  <Celula className="text-tinta-70">{item.motivo || '—'}</Celula>
                  <Celula className="w-[196px]">
                    <Checklist item={item} />
                  </Celula>
                </Linha>
              ))}
            </Tabela>

            <p className="border-t border-linha px-5 py-3 text-[12.5px] text-tinta-50">
              {filtradas.length} {plural(filtradas.length, 'movimentação', 'movimentações')} de{' '}
              {movimentacoes.length} no livro.
            </p>
          </>
        )}
      </Folha>
    </>
  );
}
