import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  OPCOES,
  buscarColaborador,
  listarAtestados,
  listarMovimentacoes,
  listarOcorrencias,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, iniciais, plural, tempoDeCasa } from '@/lib/formato';
import {
  Cartao,
  CabecalhoDeCartao,
  CartaoDeRegistro,
  Celula,
  Linha,
  ListaNoCelular,
  Tabela,
} from '@/componentes/Estrutura';
import { Aviso, Status, Vazio } from '@/componentes/Sinais';
import { BotaoCompacto } from '@/componentes/Botao';
import { alterarStatusDoColaborador } from '@/app/acoes';

export async function generateMetadata({ params }) {
  const { matricula } = await params;
  try {
    const pessoa = await buscarColaborador(matricula);
    return { title: pessoa?.nome || 'Ficha' };
  } catch {
    return { title: 'Ficha' };
  }
}

function Dado({ rotulo, children }) {
  return (
    <div>
      <dt className="text-[11.5px] text-texto-3">{rotulo}</dt>
      <dd className="mt-1 text-campo text-texto">{children || '—'}</dd>
    </div>
  );
}

export default async function Ficha({ params }) {
  const { matricula } = await params;

  let pessoa;
  let ocorrencias;
  let atestados;
  let movimentacoes;

  try {
    [pessoa, ocorrencias, atestados, movimentacoes] = await Promise.all([
      buscarColaborador(matricula),
      listarOcorrencias(),
      listarAtestados(),
      listarMovimentacoes(),
    ]);
  } catch (erro) {
    return (
      <Aviso titulo="A planilha não respondeu">
        {erro instanceof ErroDePlanilha
          ? erro.message
          : 'Não foi possível abrir esta ficha agora. Recarregue a página em alguns segundos.'}
      </Aviso>
    );
  }

  if (!pessoa) notFound();

  const minhas = (lista) => lista.filter((item) => item.matricula === matricula);
  const minhasOcorrencias = minhas(ocorrencias);
  const meusAtestados = minhas(atestados);
  const minhasMovimentacoes = minhas(movimentacoes);

  const diasAfastado = meusAtestados
    .filter((item) => item.status === 'Aprovado')
    .reduce((total, item) => total + item.dias, 0);

  return (
    <>
      <Link
        href="/colaboradores"
        className="text-[12.5px] text-texto-3 underline-offset-4 transition-colors hover:text-acao hover:underline"
      >
        Voltar para colaboradores
      </Link>

      <Cartao className="mb-4 mt-3">
        <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lavanda text-[16px] font-bold text-grafite"
          >
            {iniciais(pessoa.nome)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="codigo text-[12px] text-texto-3">{pessoa.matricula}</p>
            <h1 className="marcante mt-0.5 text-[22px] font-bold leading-tight sm:text-[27px]">
              {pessoa.nome}
            </h1>
            <p className="mt-1 text-[13.5px] text-texto-2">
              {pessoa.cargo || 'Cargo não informado'}
              {pessoa.departamento ? ` em ${pessoa.departamento}` : ''}
            </p>
          </div>

          <form
            action={alterarStatusDoColaborador}
            className="flex w-full items-end gap-2 sm:w-auto"
          >
            <input type="hidden" name="linha" value={pessoa.linha} />
            <input type="hidden" name="matricula" value={pessoa.matricula} />
            <div className="flex-1 sm:flex-none">
              <label htmlFor="status" className="mb-1.5 block text-[11.5px] text-texto-3">
                Situação
              </label>
              <select
                id="status"
                name="status"
                defaultValue={pessoa.status}
                className="h-8 w-full rounded-lg border border-borda bg-superficie px-2.5 text-campo transition-colors hover:border-texto-3 focus:border-acao sm:w-auto"
              >
                {OPCOES.statusColaborador.map((opcao) => (
                  <option key={opcao}>{opcao}</option>
                ))}
              </select>
            </div>
            <BotaoCompacto>Salvar</BotaoCompacto>
          </form>
        </div>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-borda p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-6">
          <Dado rotulo="CPF">
            <span className="codigo">{pessoa.cpf}</span>
          </Dado>
          <Dado rotulo="Admissão">
            <span className="numero">{formatarData(pessoa.admissao)}</span>
          </Dado>
          <Dado rotulo="Tempo de casa">{tempoDeCasa(pessoa.admissao)}</Dado>
          <Dado rotulo="Gestor imediato">{pessoa.gestor}</Dado>
          <Dado rotulo="Situação">
            <Status>{pessoa.status}</Status>
          </Dado>
          <Dado rotulo="Dias afastados">
            <span className="numero">{diasAfastado}</span>
          </Dado>
        </dl>
      </Cartao>

      <div className="space-y-4">
        <Cartao>
          <CabecalhoDeCartao
            apoio={`${minhasOcorrencias.length} ${plural(minhasOcorrencias.length, 'registro', 'registros')}`}
          >
            Ocorrências e faltas
          </CabecalhoDeCartao>

          {minhasOcorrencias.length === 0 ? (
            <Vazio
              titulo="Nenhuma ocorrência"
              descricao="Faltas, atrasos e advertências desta pessoa aparecem aqui."
            />
          ) : (
            <>
              <Tabela colunas={['Data', 'Tipo', 'Justificada', 'Motivo']}>
                {minhasOcorrencias.map((item) => (
                  <Linha key={item.id}>
                    <Celula className="w-[110px]">
                      <span className="numero text-[12.5px] text-texto-2">
                        {formatarData(item.data)}
                      </span>
                    </Celula>
                    <Celula className="w-[188px]">{item.tipo}</Celula>
                    <Celula className="w-[124px]">
                      <Status>{item.justificada}</Status>
                    </Celula>
                    <Celula className="text-texto-2">{item.motivo || '—'}</Celula>
                  </Linha>
                ))}
              </Tabela>

              <ListaNoCelular>
                {minhasOcorrencias.map((item) => (
                  <CartaoDeRegistro
                    key={item.id}
                    titulo={item.tipo}
                    etiqueta={<Status>{item.justificada}</Status>}
                    campos={[{ rotulo: 'Data', valor: formatarData(item.data) }]}
                    rodape={
                      item.motivo ? (
                        <p className="text-[12.5px] leading-snug text-texto-2">{item.motivo}</p>
                      ) : null
                    }
                  />
                ))}
              </ListaNoCelular>
            </>
          )}
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao
            apoio={`${meusAtestados.length} ${plural(meusAtestados.length, 'registro', 'registros')}`}
          >
            Atestados
          </CabecalhoDeCartao>

          {meusAtestados.length === 0 ? (
            <Vazio
              titulo="Nenhum atestado"
              descricao="Atestados médicos e dias de afastamento desta pessoa aparecem aqui."
            />
          ) : (
            <>
              <Tabela colunas={['Início', 'Dias', 'CID', 'Validação', 'Documento']}>
                {meusAtestados.map((item) => (
                  <Linha key={item.id}>
                    <Celula className="w-[110px]">
                      <span className="numero text-[12.5px] text-texto-2">
                        {formatarData(item.inicio)}
                      </span>
                    </Celula>
                    <Celula className="w-[80px]">
                      <span className="numero text-[12.5px]">{item.dias}</span>
                    </Celula>
                    <Celula className="w-[100px]">
                      <span className="codigo text-[12.5px] text-texto-2">{item.cid || '—'}</span>
                    </Celula>
                    <Celula className="w-[140px]">
                      <Status>{item.status}</Status>
                    </Celula>
                    <Celula>
                      {item.anexo ? (
                        <a
                          href={item.anexo}
                          target="_blank"
                          rel="noreferrer"
                          className="text-acao underline-offset-4 hover:underline"
                        >
                          Abrir anexo
                        </a>
                      ) : (
                        <span className="text-texto-3">Sem anexo</span>
                      )}
                    </Celula>
                  </Linha>
                ))}
              </Tabela>

              <ListaNoCelular>
                {meusAtestados.map((item) => (
                  <CartaoDeRegistro
                    key={item.id}
                    titulo={`${item.dias} ${plural(item.dias, 'dia', 'dias')} de afastamento`}
                    etiqueta={<Status>{item.status}</Status>}
                    campos={[
                      { rotulo: 'Início', valor: formatarData(item.inicio) },
                      { rotulo: 'CID', valor: item.cid },
                    ]}
                  />
                ))}
              </ListaNoCelular>
            </>
          )}
        </Cartao>

        <Cartao>
          <CabecalhoDeCartao
            apoio={`${minhasMovimentacoes.length} ${plural(minhasMovimentacoes.length, 'registro', 'registros')}`}
          >
            Movimentações
          </CabecalhoDeCartao>

          {minhasMovimentacoes.length === 0 ? (
            <Vazio
              titulo="Nenhuma movimentação"
              descricao="Promoções, transferências, afastamentos e desligamentos aparecem aqui."
            />
          ) : (
            <>
              <Tabela colunas={['Efetiva em', 'Tipo', 'Motivo', 'Checklist']}>
                {minhasMovimentacoes.map((item) => (
                  <Linha key={item.id}>
                    <Celula className="w-[118px]">
                      <span className="numero text-[12.5px] text-texto-2">
                        {formatarData(item.efetiva)}
                      </span>
                    </Celula>
                    <Celula className="w-[188px]">{item.tipo}</Celula>
                    <Celula className="text-texto-2">{item.motivo || '—'}</Celula>
                    <Celula className="w-[150px]">
                      <Status>{item.checklist}</Status>
                    </Celula>
                  </Linha>
                ))}
              </Tabela>

              <ListaNoCelular>
                {minhasMovimentacoes.map((item) => (
                  <CartaoDeRegistro
                    key={item.id}
                    titulo={item.tipo}
                    etiqueta={<Status>{item.checklist}</Status>}
                    campos={[{ rotulo: 'Passa a valer', valor: formatarData(item.efetiva) }]}
                    rodape={
                      item.motivo ? (
                        <p className="text-[12.5px] leading-snug text-texto-2">{item.motivo}</p>
                      ) : null
                    }
                  />
                ))}
              </ListaNoCelular>
            </>
          )}
        </Cartao>
      </div>
    </>
  );
}
