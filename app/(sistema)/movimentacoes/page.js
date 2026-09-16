import { OPCOES, listarColaboradores, listarMovimentacoes } from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, hojeISO } from '@/lib/formato';
import {
  Cartao, Celula, Comando, Faixa, LinhaTabela, Nome, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Status } from '@/componentes/Sinais';
import { Busca, Seletor } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Paragrafo, Selecao } from '@/componentes/Campos';
import { BotaoMini } from '@/componentes/Botao';
import { atualizarChecklist, salvarMovimentacao } from '@/app/acoes';

export const metadata = { title: 'Movimentações' };

const GRADE = '1.4fr 1fr 110px 1.6fr 180px';

function Checklist({ item }) {
  if (item.checklist === 'Concluído') return <Status>{item.checklist}</Status>;
  const proximo = item.checklist === 'Pendente' ? 'Em andamento' : 'Concluído';

  return (
    <span className="flex flex-wrap items-center gap-2">
      <Status>{item.checklist}</Status>
      <form action={atualizarChecklist}>
        <input type="hidden" name="linha" value={item.linha} />
        <input type="hidden" name="status" value={proximo} />
        <BotaoMini>{proximo === 'Concluído' ? 'Concluir' : 'Iniciar'}</BotaoMini>
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
        <Comando titulo="Movimentações" />
        <Wrap>
          <Faixa tom="erro">
            {erro instanceof ErroDePlanilha
              ? erro.message
              : 'Não foi possível ler a aba Movimentacoes_DP agora. Recarregue a página em alguns segundos.'}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const porMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa]));
  const nomeDe = (matricula) => porMatricula.get(matricula)?.nome || matricula;

  const filtradas = movimentacoes.filter((item) => {
    const combina =
      !busca ||
      nomeDe(item.matricula).toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.motivo.toLowerCase().includes(busca);
    return combina && (!tipo || item.tipo === tipo);
  });

  const registro = (
    <PainelDeRegistro
      abrir="Registrar"
      titulo="Registrar movimentação"
      descricao="Promoções, transferências, afastamentos e desligamentos, com a data em que a mudança passa a valer."
      acao={salvarMovimentacao}
      enviar="Registrar movimentação"
      enviando="Registrando…"
    >
      <Selecao
        rotulo="Colaborador"
        nome="matricula"
        opcoes={pessoas.map((p) => ({ valor: p.matricula, texto: `${p.nome} (${p.matricula})` }))}
        required
      />
      <div className="md-duas">
        <Selecao rotulo="Tipo" nome="tipo" opcoes={OPCOES.tiposDeMovimentacao} />
        <Data rotulo="Passa a valer em" nome="efetiva" defaultValue={hojeISO()} required />
      </div>
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
      <Comando titulo="Movimentações" contador={`${filtradas.length} de ${movimentacoes.length}`}>
        <Busca placeholder="Buscar por pessoa, matrícula ou motivo" />
        <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={OPCOES.tiposDeMovimentacao} />
        {registro}
      </Comando>

      <Wrap>
        <Cartao liso>
          {filtradas.length === 0 ? (
            <Vazio icone={movimentacoes.length === 0 ? 'swap_horiz' : 'search_off'} acao={movimentacoes.length === 0 ? registro : null}>
              {movimentacoes.length === 0
                ? 'Nenhuma movimentação registrada. Registre a primeira para acompanhar promoções, transferências e desligamentos.'
                : 'Nenhuma movimentação corresponde à busca. Limpe os filtros ou tente outro termo.'}
            </Vazio>
          ) : (
            <div className="p-[10px]">
              <Tabela
                grade={GRADE}
                colunas={[
                  { rotulo: 'Pessoa' },
                  { rotulo: 'Tipo' },
                  { rotulo: 'Passa a valer', alinha: 'd' },
                  { rotulo: 'Motivo' },
                  { rotulo: 'Checklist' },
                ]}
              >
                {filtradas.map((item) => (
                  <LinhaTabela key={item.id} grade={GRADE}>
                    <Celula>
                      <Nome href={`/colaboradores/${item.matricula}`}>{nomeDe(item.matricula)}</Nome>
                    </Celula>
                    <Celula rotulo="Tipo" alinha="c">
                      <span className="text-[var(--tinta-2)]">{item.tipo}</span>
                    </Celula>
                    <Celula rotulo="Passa a valer" alinha="d">
                      <span className="num">{formatarData(item.efetiva)}</span>
                    </Celula>
                    <Celula rotulo="Motivo" alinha="c">
                      <span className="text-[var(--tinta-2)]">{item.motivo || '—'}</span>
                    </Celula>
                    <Celula rotulo="Checklist" alinha="c">
                      <Checklist item={item} />
                    </Celula>
                  </LinhaTabela>
                ))}
              </Tabela>
            </div>
          )}
        </Cartao>
      </Wrap>
    </>
  );
}
