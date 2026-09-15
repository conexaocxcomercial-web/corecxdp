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
import { formatarData, plural, tempoDeCasa } from '@/lib/formato';
import {
  Celula,
  Folha,
  Linha,
  Tabela,
  TituloDaSecao,
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

function Dado({ rotulo, children, mono }) {
  return (
    <div>
      <dt className="text-[12px] text-tinta-50">{rotulo}</dt>
      <dd className={`mt-1 text-campo ${mono ? 'numero font-mono' : ''}`}>{children || '—'}</dd>
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
        className="text-[12.5px] text-tinta-50 underline-offset-4 transition-colors hover:text-carimbo hover:underline"
      >
        Voltar para colaboradores
      </Link>

      <header className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-5 border-b-2 border-tinta pb-5">
        <div>
          <p className="numero font-mono text-[12.5px] text-tinta-50">{pessoa.matricula}</p>
          <h1 className="expandido mt-1 text-[28px] font-semibold leading-tight sm:text-[32px]">
            {pessoa.nome}
          </h1>
          <p className="mt-1.5 text-[14px] text-tinta-70">
            {pessoa.cargo || 'Cargo não informado'}
            {pessoa.departamento ? ` em ${pessoa.departamento}` : ''}
          </p>
        </div>

        <form action={alterarStatusDoColaborador} className="flex items-end gap-2">
          <input type="hidden" name="linha" value={pessoa.linha} />
          <input type="hidden" name="matricula" value={pessoa.matricula} />
          <div>
            <label htmlFor="status" className="mb-1.5 block text-[12px] text-tinta-50">
              Situação
            </label>
            <select
              id="status"
              name="status"
              defaultValue={pessoa.status}
              className="h-8 rounded-md border border-[#C7D0D9] bg-folha px-2.5 text-campo transition-colors hover:border-tinta-30 focus:border-carimbo"
            >
              {OPCOES.statusColaborador.map((opcao) => (
                <option key={opcao}>{opcao}</option>
              ))}
            </select>
          </div>
          <BotaoCompacto>Salvar situação</BotaoCompacto>
        </form>
      </header>

      <Folha className="mb-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 sm:grid-cols-3 lg:grid-cols-6">
          <Dado rotulo="CPF" mono>
            {pessoa.cpf}
          </Dado>
          <Dado rotulo="Admissão" mono>
            {formatarData(pessoa.admissao)}
          </Dado>
          <Dado rotulo="Tempo de casa">{tempoDeCasa(pessoa.admissao)}</Dado>
          <Dado rotulo="Gestor imediato">{pessoa.gestor}</Dado>
          <Dado rotulo="Situação">
            <Status>{pessoa.status}</Status>
          </Dado>
          <Dado rotulo="Dias afastados" mono>
            {diasAfastado}
          </Dado>
        </dl>
      </Folha>

      <Folha className="mb-5">
        <TituloDaSecao
          apoio={`${minhasOcorrencias.length} ${plural(minhasOcorrencias.length, 'registro', 'registros')}`}
        >
          Ocorrências e faltas
        </TituloDaSecao>

        {minhasOcorrencias.length === 0 ? (
          <Vazio
            titulo="Nenhuma ocorrência"
            descricao="Faltas, atrasos e advertências desta pessoa aparecem aqui."
          />
        ) : (
          <Tabela colunas={['Data', 'Tipo', 'Justificada', 'Motivo']}>
            {minhasOcorrencias.map((item) => (
              <Linha key={item.id}>
                <Celula className="w-[108px]">
                  <span className="numero font-mono text-[12.5px] text-tinta-70">
                    {formatarData(item.data)}
                  </span>
                </Celula>
                <Celula className="w-[188px]">{item.tipo}</Celula>
                <Celula className="w-[124px]">
                  <Status>{item.justificada}</Status>
                </Celula>
                <Celula className="text-tinta-70">{item.motivo || '—'}</Celula>
              </Linha>
            ))}
          </Tabela>
        )}
      </Folha>

      <Folha className="mb-5">
        <TituloDaSecao
          apoio={`${meusAtestados.length} ${plural(meusAtestados.length, 'registro', 'registros')}`}
        >
          Atestados
        </TituloDaSecao>

        {meusAtestados.length === 0 ? (
          <Vazio
            titulo="Nenhum atestado"
            descricao="Atestados médicos e dias de afastamento desta pessoa aparecem aqui."
          />
        ) : (
          <Tabela colunas={['Início', 'Dias', 'CID', 'Validação', 'Documento']}>
            {meusAtestados.map((item) => (
              <Linha key={item.id}>
                <Celula className="w-[108px]">
                  <span className="numero font-mono text-[12.5px] text-tinta-70">
                    {formatarData(item.inicio)}
                  </span>
                </Celula>
                <Celula className="w-[80px]">
                  <span className="numero font-mono text-[12.5px]">{item.dias}</span>
                </Celula>
                <Celula className="w-[100px]">
                  <span className="numero font-mono text-[12.5px] text-tinta-70">
                    {item.cid || '—'}
                  </span>
                </Celula>
                <Celula className="w-[132px]">
                  <Status>{item.status}</Status>
                </Celula>
                <Celula>
                  {item.anexo ? (
                    <a
                      href={item.anexo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-carimbo underline-offset-4 hover:underline"
                    >
                      Abrir anexo
                    </a>
                  ) : (
                    <span className="text-tinta-50">Sem anexo</span>
                  )}
                </Celula>
              </Linha>
            ))}
          </Tabela>
        )}
      </Folha>

      <Folha>
        <TituloDaSecao
          apoio={`${minhasMovimentacoes.length} ${plural(minhasMovimentacoes.length, 'registro', 'registros')}`}
        >
          Movimentações
        </TituloDaSecao>

        {minhasMovimentacoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma movimentação"
            descricao="Promoções, transferências, afastamentos e desligamentos aparecem aqui."
          />
        ) : (
          <Tabela colunas={['Efetiva em', 'Tipo', 'Motivo', 'Checklist']}>
            {minhasMovimentacoes.map((item) => (
              <Linha key={item.id}>
                <Celula className="w-[116px]">
                  <span className="numero font-mono text-[12.5px] text-tinta-70">
                    {formatarData(item.efetiva)}
                  </span>
                </Celula>
                <Celula className="w-[188px]">{item.tipo}</Celula>
                <Celula className="text-tinta-70">{item.motivo || '—'}</Celula>
                <Celula className="w-[148px]">
                  <Status>{item.checklist}</Status>
                </Celula>
              </Linha>
            ))}
          </Tabela>
        )}
      </Folha>
    </>
  );
}
