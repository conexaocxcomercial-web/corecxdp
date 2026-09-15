import { OPCOES, listarAtestados, listarColaboradores } from '@/lib/registros';
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
import { Data, Paragrafo, Selecao, Texto } from '@/componentes/Campos';
import { BotaoCompacto } from '@/componentes/Botao';
import { salvarAtestado, validarAtestado } from '@/app/acoes';

export const metadata = { title: 'Atestados' };

function Validacao({ item }) {
  if (item.status !== 'Pendente') return <Status>{item.status}</Status>;

  return (
    <span className="flex items-center gap-1.5">
      <form action={validarAtestado}>
        <input type="hidden" name="linha" value={item.linha} />
        <input type="hidden" name="status" value="Aprovado" />
        <BotaoCompacto>Aprovar</BotaoCompacto>
      </form>
      <form action={validarAtestado}>
        <input type="hidden" name="linha" value={item.linha} />
        <input type="hidden" name="status" value="Rejeitado" />
        <BotaoCompacto>Rejeitar</BotaoCompacto>
      </form>
    </span>
  );
}

function Anexo({ url }) {
  if (!url) return <span className="text-texto-3">Sem anexo</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-acao underline-offset-4 hover:underline"
    >
      Abrir anexo
    </a>
  );
}

export default async function Atestados({ searchParams }) {
  const parametros = await searchParams;
  const busca = String(parametros?.busca || '').trim().toLowerCase();
  const status = String(parametros?.status || '');

  let atestados;
  let pessoas;

  try {
    [atestados, pessoas] = await Promise.all([listarAtestados(), listarColaboradores()]);
  } catch (erro) {
    return (
      <>
        <TituloDaPagina titulo="Atestados" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível ler a aba Atestados agora. Confira as variáveis de ambiente e recarregue a página.'}
        </Aviso>
      </>
    );
  }

  const porMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa]));
  const ativos = pessoas.filter((pessoa) => pessoa.status !== 'Inativo');
  const nomeDe = (matricula) => porMatricula.get(matricula)?.nome || matricula;

  const filtrados = atestados.filter((item) => {
    const combinaTexto =
      !busca ||
      nomeDe(item.matricula).toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.cid.toLowerCase().includes(busca);

    return combinaTexto && (!status || item.status === status);
  });

  const pendentes = atestados.filter((item) => item.status === 'Pendente').length;

  const registro = (
    <PainelDeRegistro
      abrir="Registrar"
      titulo="Registrar atestado"
      descricao="Lance o afastamento e guarde o link do documento. A validação pode ficar para depois."
      acao={salvarAtestado}
      enviar="Registrar atestado"
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
      <Data rotulo="Primeiro dia de afastamento" nome="inicio" defaultValue={hojeISO()} required />
      <Texto
        rotulo="Dias de afastamento"
        nome="dias"
        type="number"
        inputMode="numeric"
        min="1"
        max="365"
        defaultValue="1"
        required
      />
      <Texto rotulo="CID" nome="cid" dica="opcional" placeholder="J06.9" />
      <Paragrafo
        rotulo="Link do documento"
        nome="anexo"
        dica="opcional"
        rows={2}
        placeholder="Cole o link do arquivo no Drive"
      />
      <Selecao rotulo="Validação" nome="status" opcoes={OPCOES.statusAtestado} />
    </PainelDeRegistro>
  );

  return (
    <>
      <TituloDaPagina
        titulo="Atestados"
        apoio={
          pendentes > 0
            ? `${pendentes} ${plural(pendentes, 'atestado espera', 'atestados esperam')} validação do DP.`
            : 'Afastamentos médicos, dias cobertos e a conferência de cada documento.'
        }
        acao={registro}
      />

      <Cartao>
        <Filtros
          busca="Buscar por pessoa, matrícula ou CID"
          seletores={[
            { chave: 'status', rotulo: 'Todas as validações', opcoes: OPCOES.statusAtestado },
          ]}
        />

        {filtrados.length === 0 ? (
          <Vazio
            titulo={atestados.length === 0 ? 'Nenhum atestado registrado' : 'Nada encontrado'}
            descricao={
              atestados.length === 0
                ? 'Registre o primeiro atestado para acompanhar afastamentos e dias cobertos.'
                : 'Nenhum atestado corresponde à busca. Limpe os filtros ou tente outro termo.'
            }
            acao={atestados.length === 0 ? registro : null}
          />
        ) : (
          <>
            <Tabela colunas={['Início', 'Pessoa', 'Dias', 'CID', 'Documento', 'Validação']}>
              {filtrados.map((item) => (
                <Linha key={item.id}>
                  <Celula className="w-[110px]">
                    <span className="numero text-[12.5px] text-texto-2">
                      {formatarData(item.inicio)}
                    </span>
                  </Celula>
                  <Celula className="w-[206px]">
                    <Nome href={`/colaboradores/${item.matricula}`}>{nomeDe(item.matricula)}</Nome>
                  </Celula>
                  <Celula className="w-[72px]">
                    <span className="numero text-[12.5px]">{item.dias}</span>
                  </Celula>
                  <Celula className="w-[92px]">
                    <span className="codigo text-[12.5px] text-texto-2">{item.cid || '—'}</span>
                  </Celula>
                  <Celula>
                    <Anexo url={item.anexo} />
                  </Celula>
                  <Celula className="w-[192px]">
                    <Validacao item={item} />
                  </Celula>
                </Linha>
              ))}
            </Tabela>

            <ListaNoCelular>
              {filtrados.map((item) => (
                <CartaoDeRegistro
                  key={item.id}
                  titulo={nomeDe(item.matricula)}
                  href={`/colaboradores/${item.matricula}`}
                  etiqueta={item.status !== 'Pendente' ? <Status>{item.status}</Status> : null}
                  campos={[
                    { rotulo: 'Início', valor: formatarData(item.inicio) },
                    {
                      rotulo: 'Afastamento',
                      valor: `${item.dias} ${plural(item.dias, 'dia', 'dias')}`,
                    },
                    { rotulo: 'CID', valor: item.cid },
                    { rotulo: 'Documento', valor: <Anexo url={item.anexo} /> },
                  ]}
                  rodape={item.status === 'Pendente' ? <Validacao item={item} /> : null}
                />
              ))}
            </ListaNoCelular>

            <Rodape>
              {filtrados.length} {plural(filtrados.length, 'atestado', 'atestados')} de{' '}
              {atestados.length} no registro.
            </Rodape>
          </>
        )}
      </Cartao>
    </>
  );
}
