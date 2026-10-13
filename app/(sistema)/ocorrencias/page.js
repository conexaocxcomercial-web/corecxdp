import {
  OPCOES, listarColaboradores, listarOcorrencias, mensagemParaTela,
} from '@/lib/registros';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { formatarData, hojeISO } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Status } from '@/componentes/Sinais';
import { Busca, Seletor } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Paragrafo, Selecao } from '@/componentes/Campos';
import { salvarOcorrencia } from '@/app/acoes';

export const metadata = { title: 'Ocorrências' };

const GRADE = '1.5fr 1fr 104px 118px 2fr';

export default async function Ocorrencias({ searchParams }) {
  const parametros = await searchParams;
  const busca = String(parametros?.busca || '').trim().toLowerCase();
  const tipo = String(parametros?.tipo || '');
  const permissoes = await permissoesAtuais();

  let ocorrencias;
  let pessoas;

  try {
    [ocorrencias, pessoas] = await Promise.all([listarOcorrencias(), listarColaboradores()]);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Ocorrências" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(
              erro,
              'Não foi possível carregar as ocorrências agora. Recarregue a página em alguns segundos.'
            )}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const porMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa]));
  const nomeDe = (matricula) => porMatricula.get(matricula)?.nome || matricula;
  const ativos = pessoas.filter((pessoa) => pessoa.status !== 'Inativo');

  const filtradas = ocorrencias.filter((item) => {
    const combina =
      !busca ||
      nomeDe(item.matricula).toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.motivo.toLowerCase().includes(busca);
    return combina && (!tipo || item.tipo === tipo);
  });

  const registro = (abrirAoCarregar = false) => (
    <PainelDeRegistro
      abrirAoCarregar={abrirAoCarregar}
      abrir="Registrar"
      titulo="Registrar ocorrência"
      descricao="Faltas, atrasos e medidas disciplinares. O que for descrito aqui é o que sustenta a decisão depois."
      acao={salvarOcorrencia}
      enviar="Registrar ocorrência"
      enviando="Registrando…"
    >
      <Selecao
        rotulo="Colaborador"
        nome="matricula"
        opcoes={ativos.map((p) => ({ valor: p.matricula, texto: `${p.nome} (${p.matricula})` }))}
        required
      />
      <div className="folha-duas">
        <Data rotulo="Data da ocorrência" nome="data" defaultValue={hojeISO()} required />
        <Selecao rotulo="Tipo" nome="tipo" opcoes={OPCOES.tiposDeOcorrencia} />
      </div>
      <Selecao rotulo="Houve justificativa aceita" nome="justificada" opcoes={OPCOES.justificada} />
      <Paragrafo
        rotulo="Motivo"
        nome="motivo"
        placeholder="O que aconteceu, o que foi apresentado e quem comunicou."
        required
      />
    </PainelDeRegistro>
  );

  return (
    <>
      <Cabecalho
        titulo="Ocorrências e faltas"
        subtitulo={`${filtradas.length} de ${ocorrencias.length}`}
        acoes={permissoes.lancar ? registro(parametros?.lancar === '1') : null}
      >
        <Busca placeholder="Buscar por pessoa, matrícula ou motivo" />
        <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={OPCOES.tiposDeOcorrencia} />
      </Cabecalho>

      <Wrap>
        <Cartao liso>
          {filtradas.length === 0 ? (
            <Vazio icone={ocorrencias.length === 0 ? 'event_available' : 'search_off'} acao={ocorrencias.length === 0 && permissoes.lancar ? registro() : null}>
              {ocorrencias.length === 0
                ? permissoes.lancar
                  ? 'Nenhuma ocorrência registrada. Registre a primeira para começar o histórico de ausências da empresa.'
                  : 'Nenhuma ocorrência registrada nesta empresa ainda.'
                : 'Nenhuma ocorrência corresponde à busca. Limpe os filtros ou tente outro termo.'}
            </Vazio>
          ) : (
            <Tabela
              grade={GRADE}
              colunas={[
                { rotulo: 'Pessoa' },
                { rotulo: 'Tipo' },
                { rotulo: 'Data', alinha: 'd' },
                { rotulo: 'Justificada' },
                { rotulo: 'Motivo' },
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
                  <Celula rotulo="Data" alinha="d">
                    <span className="num">{formatarData(item.data)}</span>
                  </Celula>
                  <Celula rotulo="Justificada" alinha="c">
                    <Status>{item.justificada}</Status>
                  </Celula>
                  <Celula rotulo="Motivo" alinha="c">
                    <span className="text-[var(--tinta-2)]">{item.motivo || '—'}</span>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          )}
        </Cartao>
      </Wrap>
    </>
  );
}
