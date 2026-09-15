import Link from 'next/link';
import { OPCOES, listarAtestados, listarColaboradores } from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, hojeISO, plural } from '@/lib/formato';
import { Celula, Folha, Linha, Tabela, TituloDaPagina } from '@/componentes/Estrutura';
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

  const filtrados = atestados.filter((item) => {
    const nome = porMatricula.get(item.matricula)?.nome || '';
    const combinaTexto =
      !busca ||
      nome.toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.cid.toLowerCase().includes(busca);

    return combinaTexto && (!status || item.status === status);
  });

  const pendentes = atestados.filter((item) => item.status === 'Pendente').length;

  const registro = (
    <PainelDeRegistro
      abrir="Registrar atestado"
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

      <Folha>
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
                  <Celula className="w-[108px]">
                    <span className="numero codigo text-[12.5px] text-grafite-60">
                      {formatarData(item.inicio)}
                    </span>
                  </Celula>
                  <Celula className="w-[208px]">
                    <Link
                      href={`/colaboradores/${item.matricula}`}
                      className="font-medium underline-offset-4 hover:text-violeta-forte hover:underline"
                    >
                      {porMatricula.get(item.matricula)?.nome || item.matricula}
                    </Link>
                  </Celula>
                  <Celula className="w-[72px]">
                    <span className="numero codigo text-[12.5px]">{item.dias}</span>
                  </Celula>
                  <Celula className="w-[92px]">
                    <span className="numero codigo text-[12.5px] text-grafite-60">
                      {item.cid || '—'}
                    </span>
                  </Celula>
                  <Celula>
                    {item.anexo ? (
                      <a
                        href={item.anexo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violeta-forte underline-offset-4 hover:underline"
                      >
                        Abrir anexo
                      </a>
                    ) : (
                      <span className="text-grafite-45">Sem anexo</span>
                    )}
                  </Celula>
                  <Celula className="w-[188px]">
                    <Validacao item={item} />
                  </Celula>
                </Linha>
              ))}
            </Tabela>

            <p className="border-t border-linha px-5 py-3 text-[12.5px] text-grafite-45">
              {filtrados.length} {plural(filtrados.length, 'atestado', 'atestados')} de{' '}
              {atestados.length} no livro.
            </p>
          </>
        )}
      </Folha>
    </>
  );
}
