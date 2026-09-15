import Link from 'next/link';
import { OPCOES, listarColaboradores, listarOcorrencias } from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, hojeISO, plural } from '@/lib/formato';
import { Celula, Folha, Linha, Tabela, TituloDaPagina } from '@/componentes/Estrutura';
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

  const filtradas = ocorrencias.filter((item) => {
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
      abrir="Registrar ocorrência"
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
        apoio="O livro das ausências: cada falta, atraso ou medida disciplinar com data, motivo e justificativa."
        acao={registro}
      />

      <Folha>
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
                  <Celula className="w-[108px]">
                    <span className="numero font-mono text-[12.5px] text-tinta-70">
                      {formatarData(item.data)}
                    </span>
                  </Celula>
                  <Celula className="w-[216px]">
                    <Link
                      href={`/colaboradores/${item.matricula}`}
                      className="font-medium underline-offset-4 hover:text-carimbo hover:underline"
                    >
                      {porMatricula.get(item.matricula)?.nome || item.matricula}
                    </Link>
                  </Celula>
                  <Celula className="w-[176px] text-tinta-70">{item.tipo}</Celula>
                  <Celula className="w-[112px]">
                    <Status>{item.justificada}</Status>
                  </Celula>
                  <Celula className="text-tinta-70">{item.motivo || '—'}</Celula>
                </Linha>
              ))}
            </Tabela>

            <p className="border-t border-linha px-5 py-3 text-[12.5px] text-tinta-50">
              {filtradas.length} {plural(filtradas.length, 'ocorrência', 'ocorrências')} de{' '}
              {ocorrencias.length} no livro.
            </p>
          </>
        )}
      </Folha>
    </>
  );
}
