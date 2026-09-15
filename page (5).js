import { OPCOES, listarColaboradores, listarOcorrencias } from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, hojeISO, plural } from '@/lib/formato';
import {
  Cartao,
  CartaoDeRegistro,
  Celula,
  Linha,
  ListaNoCelular,
  Nome,
  Rodape,
  Tabela,
  TituloDaPagina,
} from '@/componentes/Estrutura';
import { Aviso, Status, Vazio } from '@/componentes/Sinais';
import { Filtros } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Paragrafo, Selecao } from '@/componentes/Campos';
import { salvarOcorrencia } from '@/app/acoes';

export const metadata = { title: 'Ocorrências' };

export default async function Ocorrencias({ searchParams }) {
  const parametros = await searchParams;
  const busca = String(parametros?.busca || '').trim().toLowerCase();
  const tipo = String(parametros?.tipo || '');

  let ocorrencias;
  let pessoas;

  try {
    [ocorrencias, pessoas] = await Promise.all([listarOcorrencias(), listarColaboradores()]);
  } catch (erro) {
    return (
      <>
        <TituloDaPagina titulo="Ocorrências e faltas" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível ler a aba Ocorrencias_Faltas agora. Confira as variáveis de ambiente e recarregue a página.'}
        </Aviso>
      </>
    );
  }

  const porMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa]));
  const ativos = pessoas.filter((pessoa) => pessoa.status !== 'Inativo');
  const nomeDe = (matricula) => porMatricula.get(matricula)?.nome || matricula;

  const filtradas = ocorrencias.filter((item) => {
    const combinaTexto =
      !busca ||
      nomeDe(item.matricula).toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.motivo.toLowerCase().includes(busca);

    return combinaTexto && (!tipo || item.tipo === tipo);
  });

  const registro = (
    <PainelDeRegistro
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
        opcoes={ativos.map((pessoa) => ({
          valor: pessoa.matricula,
          texto: `${pessoa.nome} (${pessoa.matricula})`,
        }))}
        required
      />
      <Data rotulo="Data da ocorrência" nome="data" defaultValue={hojeISO()} required />
      <Selecao rotulo="Tipo" nome="tipo" opcoes={OPCOES.tiposDeOcorrencia} />
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
      <TituloDaPagina
        titulo="Ocorrências e faltas"
        apoio="Cada falta, atraso ou medida disciplinar com data, motivo e justificativa."
        acao={registro}
      />

      <Cartao>
        <Filtros
          busca="Buscar por pessoa, matrícula ou motivo"
          seletores={[{ chave: 'tipo', rotulo: 'Todos os tipos', opcoes: OPCOES.tiposDeOcorrencia }]}
        />

        {filtradas.length === 0 ? (
          <Vazio
            titulo={ocorrencias.length === 0 ? 'Nenhuma ocorrência registrada' : 'Nada encontrado'}
            descricao={
              ocorrencias.length === 0
                ? 'Registre a primeira ocorrência para começar o histórico de ausências da empresa.'
                : 'Nenhuma ocorrência corresponde à busca. Limpe os filtros ou tente outro termo.'
            }
            acao={ocorrencias.length === 0 ? registro : null}
          />
        ) : (
          <>
            <Tabela colunas={['Data', 'Pessoa', 'Tipo', 'Justificada', 'Motivo']}>
              {filtradas.map((item) => (
                <Linha key={item.id}>
                  <Celula className="w-[110px]">
                    <span className="numero text-[12.5px] text-texto-2">
                      {formatarData(item.data)}
                    </span>
                  </Celula>
                  <Celula className="w-[214px]">
                    <Nome href={`/colaboradores/${item.matricula}`}>{nomeDe(item.matricula)}</Nome>
                  </Celula>
                  <Celula className="w-[176px] text-texto-2">{item.tipo}</Celula>
                  <Celula className="w-[124px]">
                    <Status>{item.justificada}</Status>
                  </Celula>
                  <Celula className="text-texto-2">{item.motivo || '—'}</Celula>
                </Linha>
              ))}
            </Tabela>

            <ListaNoCelular>
              {filtradas.map((item) => (
                <CartaoDeRegistro
                  key={item.id}
                  titulo={nomeDe(item.matricula)}
                  href={`/colaboradores/${item.matricula}`}
                  etiqueta={<Status>{item.justificada}</Status>}
                  campos={[
                    { rotulo: 'Data', valor: formatarData(item.data) },
                    { rotulo: 'Tipo', valor: item.tipo },
                  ]}
                  rodape={
                    item.motivo ? (
                      <p className="text-[12.5px] leading-snug text-texto-2">{item.motivo}</p>
                    ) : null
                  }
                />
              ))}
            </ListaNoCelular>

            <Rodape>
              {filtradas.length} {plural(filtradas.length, 'ocorrência', 'ocorrências')} de{' '}
              {ocorrencias.length} no registro.
            </Rodape>
          </>
        )}
      </Cartao>
    </>
  );
}
