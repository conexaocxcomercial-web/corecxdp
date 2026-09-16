import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  OPCOES, buscarColaborador, listarAtestados, listarMovimentacoes, listarOcorrencias,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { formatarData, iniciais, plural, tempoDeCasa } from '@/lib/formato';
import {
  Cartao, Celula, Comando, Faixa, LinhaTabela, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Status } from '@/componentes/Sinais';
import { BotaoMini } from '@/componentes/Botao';
import { Icone } from '@/componentes/Icones';
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

const G_OCO = '104px 1fr 118px 2fr';
const G_ATE = '104px 74px 84px 150px 1fr';
const G_MOV = '110px 1fr 2fr 140px';

function Chip({ icone, rotulo, children }) {
  return (
    <span className="pil">
      <Icone nome={icone} tamanho={14} />
      {rotulo}
      <b className="font-semibold text-[var(--tinta)]">{children || '—'}</b>
    </span>
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
      <>
        <Comando titulo="Ficha" />
        <Wrap>
          <Faixa tom="erro">
            {erro instanceof ErroDePlanilha
              ? erro.message
              : 'Não foi possível abrir esta ficha agora. Recarregue a página em alguns segundos.'}
          </Faixa>
        </Wrap>
      </>
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
      <Comando titulo={pessoa.nome} contador={pessoa.matricula}>
        <Link href="/colaboradores" className="btn btn-fant">
          <Icone nome="arrow_back" />
          Voltar
        </Link>
      </Comando>

      <Wrap>
        <div className="cartao mb-[22px]">
          <div className="flex flex-wrap items-start gap-4">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--acao-fraco)] text-[14px] font-bold text-[var(--acao)]"
            >
              {iniciais(pessoa.nome)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-[650] leading-tight tracking-[-0.35px]">
                {pessoa.nome}
              </p>
              <p className="mt-1 text-[12.5px] text-[var(--tinta-2)]">
                {pessoa.cargo || 'Cargo não informado'}
                {pessoa.departamento ? ` em ${pessoa.departamento}` : ''}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip icone="badge" rotulo="CPF">
                  <span className="num">{pessoa.cpf}</span>
                </Chip>
                <Chip icone="event" rotulo="Admissão">
                  <span className="num">{formatarData(pessoa.admissao)}</span>
                </Chip>
                <Chip icone="schedule" rotulo="Casa">
                  {tempoDeCasa(pessoa.admissao)}
                </Chip>
                <Chip icone="supervisor_account" rotulo="Gestor">
                  {pessoa.gestor}
                </Chip>
                <Chip icone="healing" rotulo="Dias afastado">
                  <span className="num">{diasAfastado}</span>
                </Chip>
              </div>
            </div>

            <form
              action={alterarStatusDoColaborador}
              className="flex w-full items-end gap-2 sm:w-auto"
            >
              <input type="hidden" name="linha" value={pessoa.linha} />
              <input type="hidden" name="matricula" value={pessoa.matricula} />
              <div className="fg flex-1 sm:flex-none">
                <label htmlFor="status">Situação</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={pessoa.status}
                  className="campo cursor-pointer"
                >
                  {OPCOES.statusColaborador.map((opcao) => (
                    <option key={opcao}>{opcao}</option>
                  ))}
                </select>
              </div>
              <BotaoMini>Salvar</BotaoMini>
            </form>
          </div>
        </div>

        <Secao
          titulo="Ocorrências e faltas"
          nota={`${minhasOcorrencias.length} ${plural(minhasOcorrencias.length, 'registro', 'registros')}`}
        >
          <Cartao liso>
            {minhasOcorrencias.length === 0 ? (
              <Vazio icone="event_available">
                Nenhuma ocorrência. Faltas, atrasos e advertências desta pessoa aparecem aqui.
              </Vazio>
            ) : (
              <div className="p-[10px]">
                <Tabela
                  grade={G_OCO}
                  colunas={[
                    { rotulo: 'Data', alinha: 'd' },
                    { rotulo: 'Tipo' },
                    { rotulo: 'Justificada' },
                    { rotulo: 'Motivo' },
                  ]}
                >
                  {minhasOcorrencias.map((item) => (
                    <LinhaTabela key={item.id} grade={G_OCO}>
                      <Celula alinha="d">
                        <span className="num">{formatarData(item.data)}</span>
                      </Celula>
                      <Celula rotulo="Tipo" alinha="c">
                        <span className="tb-nome">{item.tipo}</span>
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
              </div>
            )}
          </Cartao>
        </Secao>

        <Secao
          titulo="Atestados"
          nota={`${meusAtestados.length} ${plural(meusAtestados.length, 'registro', 'registros')}`}
        >
          <Cartao liso>
            {meusAtestados.length === 0 ? (
              <Vazio icone="clinical_notes">
                Nenhum atestado. Afastamentos médicos desta pessoa aparecem aqui.
              </Vazio>
            ) : (
              <div className="p-[10px]">
                <Tabela
                  grade={G_ATE}
                  colunas={[
                    { rotulo: 'Início', alinha: 'd' },
                    { rotulo: 'Dias', alinha: 'd' },
                    { rotulo: 'CID', alinha: 'd' },
                    { rotulo: 'Validação' },
                    { rotulo: 'Documento' },
                  ]}
                >
                  {meusAtestados.map((item) => (
                    <LinhaTabela key={item.id} grade={G_ATE}>
                      <Celula alinha="d">
                        <span className="num tb-nome">{formatarData(item.inicio)}</span>
                      </Celula>
                      <Celula rotulo="Dias" alinha="d">
                        <span className="num">{item.dias}</span>
                      </Celula>
                      <Celula rotulo="CID" alinha="d">
                        <span className="num text-[var(--tinta-2)]">{item.cid || '—'}</span>
                      </Celula>
                      <Celula rotulo="Validação" alinha="c">
                        <Status>{item.status}</Status>
                      </Celula>
                      <Celula rotulo="Documento" alinha="c">
                        {item.anexo ? (
                          <a
                            href={item.anexo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--acao)] hover:underline"
                          >
                            Abrir anexo
                          </a>
                        ) : (
                          <span className="text-[var(--tinta-3)]">Sem anexo</span>
                        )}
                      </Celula>
                    </LinhaTabela>
                  ))}
                </Tabela>
              </div>
            )}
          </Cartao>
        </Secao>

        <Secao
          titulo="Movimentações"
          nota={`${minhasMovimentacoes.length} ${plural(minhasMovimentacoes.length, 'registro', 'registros')}`}
        >
          <Cartao liso>
            {minhasMovimentacoes.length === 0 ? (
              <Vazio icone="swap_horiz">
                Nenhuma movimentação. Promoções, transferências e desligamentos aparecem aqui.
              </Vazio>
            ) : (
              <div className="p-[10px]">
                <Tabela
                  grade={G_MOV}
                  colunas={[
                    { rotulo: 'Passa a valer', alinha: 'd' },
                    { rotulo: 'Tipo' },
                    { rotulo: 'Motivo' },
                    { rotulo: 'Checklist' },
                  ]}
                >
                  {minhasMovimentacoes.map((item) => (
                    <LinhaTabela key={item.id} grade={G_MOV}>
                      <Celula alinha="d">
                        <span className="num">{formatarData(item.efetiva)}</span>
                      </Celula>
                      <Celula rotulo="Tipo" alinha="c">
                        <span className="tb-nome">{item.tipo}</span>
                      </Celula>
                      <Celula rotulo="Motivo" alinha="c">
                        <span className="text-[var(--tinta-2)]">{item.motivo || '—'}</span>
                      </Celula>
                      <Celula rotulo="Checklist" alinha="c">
                        <Status>{item.checklist}</Status>
                      </Celula>
                    </LinhaTabela>
                  ))}
                </Tabela>
              </div>
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
