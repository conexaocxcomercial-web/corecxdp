import { notFound } from 'next/navigation';
import { lerFicha } from '@/lib/dados/pessoas';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { emReais, emReaisExato, formatarData, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Abas } from '@/componentes/Abas';
import {
  AcoesRapidas, AlertasDaPessoa, Dados, LinhaDoTempo, NumerosDaPessoa, ResumoDaPessoa, nomeDoContrato,
} from '@/componentes/Ficha';
import { Prazo } from '@/componentes/Prazos';
import { Status } from '@/componentes/Sinais';
import { ValorProtegido } from '@/componentes/Valores';
import { InformarCustos } from '@/componentes/Custos';
import { ConcluirDesligamento } from '@/componentes/Desligamentos';
import { Passos } from '@/componentes/Passos';
import { nomeDoCusto } from '@/lib/lancamentos';

export async function generateMetadata({ params }) {
  const { matricula } = await params;
  try {
    const ficha = await lerFicha(decodeURIComponent(matricula));
    return { title: ficha?.pessoa.nome || 'Ficha' };
  } catch {
    return { title: 'Ficha' };
  }
}

const ABAS = [
  { chave: 'resumo', rotulo: 'Resumo' },
  { chave: 'contrato', rotulo: 'Contrato' },
  { chave: 'remuneracao', rotulo: 'Remuneração' },
  { chave: 'ferias', rotulo: 'Férias' },
  { chave: 'saude', rotulo: 'Saúde' },
  { chave: 'ocorrencias', rotulo: 'Ocorrências' },
  { chave: 'movimentacoes', rotulo: 'Movimentações' },
  { chave: 'documentos', rotulo: 'Documentos' },
  { chave: 'historico', rotulo: 'Histórico' },
];

const SITUACAO_DAS_FERIAS = {
  gozada: 'Concluído',
  'em andamento': 'Em andamento',
  programada: 'Aprovado',
  'aguardando aprovação': 'Pendente',
  'a vencer': 'A vencer',
  vencida: 'Vencida',
  'a programar': 'A programar',
};

const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
const fimDoGozo = (inicio, n) => {
  const data = new Date(`${inicio}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + n - 1);
  return data.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ abas */

function AbaResumo({ ficha, base }) {
  const { pessoa } = ficha;
  return (
    <>
      <NumerosDaPessoa ficha={ficha} base={base} />
      <Secao titulo="Dados">
        <Cartao>
          <Dados
            itens={[
              { rotulo: 'CPF', valor: pessoa.cpf ? <ValorProtegido valor={pessoa.cpf} mascara={pessoa.cpfProtegido} rotulo="CPF" comOlho /> : null },
              { rotulo: 'Nascimento', valor: pessoa.nascimento ? `${formatarData(pessoa.nascimento)} (${pessoa.idade} anos)` : null },
              { rotulo: 'Gestor imediato', valor: pessoa.gestor || null },
              { rotulo: 'Unidade', valor: pessoa.cnpj ? `${pessoa.cnpj.nome}${pessoa.cnpj.numero && pessoa.cnpj.numero !== pessoa.cnpj.nome ? ` · ${pessoa.cnpj.numero}` : ''}` : null },
            ]}
          />
        </Cartao>
      </Secao>
      <Secao titulo="Últimos registros" nota="o histórico completo fica na aba Histórico">
        <Cartao>
          <LinhaDoTempo itens={ficha.linha} base={base} limite={5} />
        </Cartao>
      </Secao>
    </>
  );
}

/** Os custos informados de um momento, item a item, com o total. */
function CustosInformados({ custo, momento }) {
  if (!custo) return <p className="nota">Nenhum custo informado.</p>;
  return (
    <Dados
      itens={[
        ...custo.itens.map((item) => ({ rotulo: nomeDoCusto(momento, item.item), valor: emReaisExato(item.valor) })),
        { rotulo: 'Total informado', valor: <b>{emReaisExato(custo.total)}</b> },
      ]}
    />
  );
}

function AbaContrato({ ficha, permissoes }) {
  const { pessoa, numeros } = ficha;
  const experiencia = pessoa.experiencia;
  return (
    <>
      <Secao titulo="Contrato">
        <Cartao>
          <Dados
            itens={[
              { rotulo: 'Tipo de contrato', valor: nomeDoContrato(pessoa.contrato) },
              { rotulo: 'Admissão', valor: pessoa.admissao ? `${formatarData(pessoa.admissao)} (${numeros.tempoDeCasa})` : null },
              { rotulo: 'Jornada', valor: pessoa.jornada },
              { rotulo: 'Cargo', valor: pessoa.cargo || null },
              { rotulo: 'Departamento', valor: pessoa.departamento || null },
              { rotulo: 'Gestor imediato', valor: pessoa.gestor || null },
              ...(experiencia
                ? [
                    { rotulo: 'Fim dos 45 dias', valor: formatarData(experiencia.primeiroPeriodo) },
                    {
                      rotulo: 'Fim da experiência',
                      valor: `${formatarData(experiencia.fim)}${experiencia.fase === 'encerrado' ? ' (passou: o contrato vira indeterminado)' : ''}`,
                    },
                  ]
                : []),
            ]}
          />
        </Cartao>
      </Secao>
      {ficha.completo ? (
        <Secao titulo="Custos da admissão" nota="informados pela empresa, não calculados">
          <Cartao>
            <CustosInformados custo={ficha.custos.admissao} momento="admissao" />
            {permissoes?.lancar ? (
              <div className="es-pe">
                <InformarCustos matricula={pessoa.matricula} nome={pessoa.nome} momento="admissao" custo={ficha.custos.admissao} mini={false} />
              </div>
            ) : null}
          </Cartao>
        </Secao>
      ) : null}
    </>
  );
}

function AbaRemuneracao({ ficha }) {
  const { pessoa, eventos, completo } = ficha;
  return (
    <>
      <Secao titulo="Salário" nota="sem encargos nem benefícios">
        <Cartao>
          {pessoa.salario ? (
            <p className="ficha-salario">
              <ValorProtegido valor={emReais(pessoa.salario)} mascara="R$ •••••" rotulo="Salário" comOlho />
              <span className="nota">por mês</span>
            </p>
          ) : (
            <p className="nota">O salário não está cadastrado.</p>
          )}
        </Cartao>
      </Secao>
      <Secao titulo="Reajustes e mudanças de cargo" nota={`${eventos.reajustes.length} ${plural(eventos.reajustes.length, 'registro', 'registros')}`}>
        <Cartao liso>
          {eventos.reajustes.length === 0 ? (
            <Vazio icone="trending_up">Nenhum reajuste nem mudança de cargo registrados.</Vazio>
          ) : (
            <Tabela grade="120px 180px 1fr" colunas={[{ rotulo: 'Passa a valer' }, { rotulo: 'Tipo' }, { rotulo: 'Motivo' }]}>
              {eventos.reajustes.map((item) => (
                <LinhaTabela key={item.id} grade="120px 180px 1fr">
                  <Celula><span className="num">{formatarData(item.efetiva)}</span></Celula>
                  <Celula rotulo="Tipo" alinha="c"><span className="tb-nome">{item.tipo}</span></Celula>
                  <Celula rotulo="Motivo" alinha="c"><span className="text-[var(--tinta-2)]">{item.motivo || '—'}</span></Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          )}
        </Cartao>
      </Secao>
      <Secao titulo="Benefícios" nota="valores por mês">
        <Cartao liso>
          {eventos.beneficios.length === 0 ? (
            <Vazio icone="redeem">{completo ? 'Nenhum benefício para esta pessoa.' : 'Os benefícios ainda não estão cadastrados.'}</Vazio>
          ) : (
            <Tabela grade="1.4fr 1fr 1fr 120px" colunas={[{ rotulo: 'Benefício' }, { rotulo: 'Empresa paga', alinha: 'd' }, { rotulo: 'Desconto', alinha: 'd' }, { rotulo: 'Desde', alinha: 'd' }]}>
              {eventos.beneficios.map((item) => (
                <LinhaTabela key={item.id} grade="1.4fr 1fr 1fr 120px">
                  <Celula><span className="tb-nome">{item.nome}</span></Celula>
                  <Celula rotulo="Empresa paga" alinha="d"><span className="num">{emReais(item.valor_empresa)}</span></Celula>
                  <Celula rotulo="Desconto" alinha="d"><span className="num">{item.desconto_percentual ? `${String(Math.round(item.desconto_percentual * 1000) / 10).replace('.', ',')}%` : 'sem desconto'}</span></Celula>
                  <Celula rotulo="Desde" alinha="d"><span className="num">{formatarData(item.desde)}</span></Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          )}
        </Cartao>
      </Secao>
    </>
  );
}

function AbaFerias({ ficha }) {
  const { eventos, numeros, completo } = ficha;
  const { ferias } = numeros;
  return (
    <Secao
      titulo="Férias"
      nota={completo ? `saldo de ${dias(ferias.dias)}${ferias.emAquisicao ? `, mais ${String(ferias.emAquisicao).replace('.', ',')} em aquisição` : ''}` : null}
    >
      <Cartao liso>
        {eventos.ferias.length === 0 ? (
          <Vazio icone="beach_access">
            {completo ? 'Nenhum período aquisitivo completo ainda.' : 'Os períodos de férias ainda não estão cadastrados.'}
          </Vazio>
        ) : (
          <Tabela
            grade="1.4fr 120px 1.2fr 150px"
            colunas={[{ rotulo: 'Período aquisitivo' }, { rotulo: 'Tirar até', alinha: 'd' }, { rotulo: 'Gozo' }, { rotulo: 'Situação' }]}
          >
            {eventos.ferias.map((item) => (
              <LinhaTabela key={item.id} grade="1.4fr 120px 1.2fr 150px">
                <Celula>
                  <span className="num tb-nome">
                    {formatarData(item.aquisitivo_inicio)} a {formatarData(item.aquisitivo_fim)}
                  </span>
                </Celula>
                <Celula rotulo="Tirar até" alinha="d"><span className="num">{formatarData(item.concessivo_fim)}</span></Celula>
                <Celula rotulo="Gozo" alinha="c">
                  <span className="num text-[var(--tinta-2)]">
                    {item.inicio ? `${formatarData(item.inicio)} a ${formatarData(fimDoGozo(item.inicio, item.dias))} (${dias(item.dias)})` : '—'}
                  </span>
                </Celula>
                <Celula rotulo="Situação" alinha="c"><Status>{SITUACAO_DAS_FERIAS[item.situacao] || item.situacao}</Status></Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        )}
      </Cartao>
    </Secao>
  );
}

function AbaSaude({ ficha }) {
  const { eventos, numeros, verCid } = ficha;
  const grade = '1.2fr 110px 70px 110px 110px 130px';
  return (
    <Secao
      titulo="Atestados e afastamentos"
      nota={`${dias(numeros.diasDeAtestado)} de atestado em 12 meses${verCid ? '' : ' · CID restrito'}`}
    >
      <Cartao liso>
        {eventos.afastamentos.length === 0 ? (
          <Vazio icone="clinical_notes">Nenhum atestado nem afastamento.</Vazio>
        ) : (
          <Tabela
            grade={grade}
            colunas={[
              { rotulo: 'Tipo' }, { rotulo: 'Início', alinha: 'd' }, { rotulo: 'Dias', alinha: 'd' },
              { rotulo: 'Até', alinha: 'd' }, { rotulo: 'CID', alinha: 'd' }, { rotulo: 'Validação' },
            ]}
          >
            {eventos.afastamentos.map((item) => (
              <LinhaTabela key={item.id} grade={grade}>
                <Celula><span className="tb-nome">{item.atestado ? `Atestado · ${item.tipo}` : item.tipo}</span></Celula>
                <Celula rotulo="Início" alinha="d"><span className="num">{formatarData(item.inicio)}</span></Celula>
                <Celula rotulo="Dias" alinha="d"><span className="num">{item.dias}</span></Celula>
                <Celula rotulo="Até" alinha="d"><span className="num">{formatarData(item.retorno ? fimDoGozo(item.retorno, 0) : item.fim_previsto)}</span></Celula>
                <Celula rotulo="CID" alinha="d">
                  <span className="num text-[var(--tinta-2)]">
                    {!item.atestado ? '—' : item.cidRestrito ? 'Restrito' : item.atestado.cid === 'não informado' ? 'Não informado' : item.atestado.cid}
                  </span>
                </Celula>
                <Celula rotulo="Validação" alinha="c">{item.validacao ? <Status>{item.validacao}</Status> : <span className="text-[var(--tinta-3)]">sem atestado</span>}</Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        )}
      </Cartao>
    </Secao>
  );
}

function AbaOcorrencias({ ficha }) {
  const { ocorrencias } = ficha.eventos;
  const grade = '110px 1fr 120px 2fr';
  return (
    <Secao titulo="Ocorrências" nota={`${ocorrencias.length} ${plural(ocorrencias.length, 'registro', 'registros')}`}>
      <Cartao liso>
        {ocorrencias.length === 0 ? (
          <Vazio icone="event_available">Nenhuma ocorrência. Faltas, atrasos e advertências desta pessoa aparecem aqui.</Vazio>
        ) : (
          <Tabela grade={grade} colunas={[{ rotulo: 'Data' }, { rotulo: 'Tipo' }, { rotulo: 'Justificada' }, { rotulo: 'Motivo' }]}>
            {ocorrencias.map((item) => (
              <LinhaTabela key={item.id} grade={grade}>
                <Celula><span className="num">{formatarData(item.data)}</span></Celula>
                <Celula rotulo="Tipo" alinha="c"><span className="tb-nome">{item.tipo}</span></Celula>
                <Celula rotulo="Justificada" alinha="c"><Status>{item.justificada}</Status></Celula>
                <Celula rotulo="Motivo" alinha="c">
                  <span className="text-[var(--tinta-2)]">
                    {item.motivo || '—'}
                    {item.registrado_por ? <span className="tb-autor"> · {item.registrado_por}</span> : null}
                  </span>
                </Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        )}
      </Cartao>
    </Secao>
  );
}

function AbaMovimentacoes({ ficha }) {
  const { movimentacoes } = ficha.eventos;
  const grade = '120px 1fr 2fr 140px';
  return (
    <Secao titulo="Movimentações" nota={`${movimentacoes.length} ${plural(movimentacoes.length, 'registro', 'registros')}`}>
      <Cartao liso>
        {movimentacoes.length === 0 ? (
          <Vazio icone="swap_horiz">Nenhuma movimentação. Promoções, reajustes e transferências aparecem aqui.</Vazio>
        ) : (
          <Tabela grade={grade} colunas={[{ rotulo: 'Passa a valer' }, { rotulo: 'Tipo' }, { rotulo: 'Motivo' }, { rotulo: 'Checklist' }]}>
            {movimentacoes.map((item) => (
              <LinhaTabela key={item.id} grade={grade}>
                <Celula><span className="num">{formatarData(item.efetiva)}</span></Celula>
                <Celula rotulo="Tipo" alinha="c"><span className="tb-nome">{item.tipo}</span></Celula>
                <Celula rotulo="Motivo" alinha="c"><span className="text-[var(--tinta-2)]">{item.motivo || '—'}</span></Celula>
                <Celula rotulo="Checklist" alinha="c"><Status>{item.checklist}</Status></Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        )}
      </Cartao>
    </Secao>
  );
}

function AbaDocumentos({ ficha }) {
  const { documentos } = ficha.eventos;
  const grade = '1.4fr 120px 120px 170px';
  return (
    <Secao titulo="Documentos" nota={`${documentos.length} ${plural(documentos.length, 'documento', 'documentos')}`}>
      <Cartao liso>
        {documentos.length === 0 ? (
          <Vazio icone="description">{ficha.completo ? 'Nenhum documento anexado.' : 'Os documentos ainda não estão cadastrados.'}</Vazio>
        ) : (
          <Tabela grade={grade} colunas={[{ rotulo: 'Documento' }, { rotulo: 'Emissão', alinha: 'd' }, { rotulo: 'Validade', alinha: 'd' }, { rotulo: 'Prazo' }]}>
            {documentos.map((item) => (
              <LinhaTabela key={item.id} grade={grade}>
                <Celula><span className="tb-nome">{item.tipo}</span></Celula>
                <Celula rotulo="Emissão" alinha="d"><span className="num">{formatarData(item.emissao)}</span></Celula>
                <Celula rotulo="Validade" alinha="d"><span className="num">{item.validade ? formatarData(item.validade) : 'sem validade'}</span></Celula>
                <Celula rotulo="Prazo" alinha="c">
                  {item.prazo ? <Prazo dias={item.prazo.dias} grupo={item.prazo.grupo} data={item.prazo.data} /> : <span className="text-[var(--tinta-3)]">—</span>}
                </Celula>
              </LinhaTabela>
            ))}
          </Tabela>
        )}
      </Cartao>
    </Secao>
  );
}

function AbaHistorico({ ficha, base }) {
  return (
    <Secao titulo="Histórico" nota="tudo em ordem de data, com quem registrou">
      <Cartao>
        <LinhaDoTempo itens={ficha.linha} base={base} />
      </Cartao>
    </Secao>
  );
}

function AbaDesligamento({ ficha, permissoes }) {
  const { pessoa, saida } = ficha;
  const { desligamento } = pessoa;
  return (
    <>
      <Secao titulo="Desligamento">
        <Cartao>
          <Dados
            itens={[
              { rotulo: 'Último dia', valor: desligamento?.data ? formatarData(desligamento.data) : null },
              { rotulo: 'Tipo', valor: desligamento?.tipo || null },
              { rotulo: 'Motivo', valor: desligamento?.motivo || null },
              ...(saida ? [{ rotulo: 'Rescisão até', valor: `${formatarData(saida.prazo.data)}${saida.prazo.nota ? ` (${saida.prazo.nota})` : ''}` }] : []),
            ]}
          />
        </Cartao>
      </Secao>
      {saida && ficha.completo ? (
        <>
          <Secao titulo="Passos" nota={saida.concluido ? 'concluído' : 'concluir quando a rescisão estiver paga'}>
            <Cartao>
              <Passos passos={saida.passos} />
              {!saida.concluido && permissoes?.aprovar ? (
                <div className="es-pe">
                  <ConcluirDesligamento id={saida.id} nome={pessoa.nome} />
                </div>
              ) : null}
            </Cartao>
          </Secao>
          <Secao titulo="Custos do desligamento" nota="informados pela empresa, não calculados">
            <Cartao>
              <CustosInformados custo={ficha.custos.desligamento} momento="desligamento" />
              {permissoes?.lancar ? (
                <div className="es-pe">
                  <InformarCustos matricula={pessoa.matricula} nome={pessoa.nome} momento="desligamento" custo={ficha.custos.desligamento} mini={false} />
                </div>
              ) : null}
            </Cartao>
          </Secao>
        </>
      ) : null}
    </>
  );
}

const CONTEUDO = {
  resumo: AbaResumo,
  contrato: AbaContrato,
  remuneracao: AbaRemuneracao,
  ferias: AbaFerias,
  saude: AbaSaude,
  ocorrencias: AbaOcorrencias,
  movimentacoes: AbaMovimentacoes,
  documentos: AbaDocumentos,
  historico: AbaHistorico,
  desligamento: AbaDesligamento,
};

/**
 * Ficha do colaborador (fase 6 do redesenho): o resumo em cinco segundos
 * (com os alertas dela e as ações rápidas) e as abas com endereço próprio.
 * No computador, o resumo fica numa coluna à esquerda; no celular, em cima,
 * com as abas presas logo abaixo da barra do topo.
 */
export default async function Ficha({ params, searchParams }) {
  const [{ matricula: bruta }, parametros, permissoes] = await Promise.all([params, searchParams, permissoesAtuais()]);
  const matricula = decodeURIComponent(bruta);
  const voltar = { href: '/colaboradores', rotulo: 'Colaboradores' };

  let ficha;
  try {
    ficha = await lerFicha(matricula);
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Ficha" voltar={voltar} />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(erro, 'Não foi possível abrir esta ficha agora. Recarregue a página em alguns segundos.')}
          </Faixa>
        </Wrap>
      </>
    );
  }
  if (!ficha) notFound();

  const base = `/colaboradores/${encodeURIComponent(matricula)}`;
  const abas = [
    ...ABAS.map((aba) => ({
      ...aba,
      n:
        aba.chave === 'ocorrencias' ? ficha.eventos.ocorrencias.length
        : aba.chave === 'saude' ? ficha.eventos.afastamentos.length
        : null,
    })),
    ...(ficha.pessoa.desligamento ? [{ chave: 'desligamento', rotulo: 'Desligamento' }] : []),
  ];
  const atual = abas.some((aba) => aba.chave === parametros?.aba) ? parametros.aba : 'resumo';
  const Conteudo = CONTEUDO[atual];
  const quem = permissoes.aprovar ? 'você' : 'a Gestão';

  return (
    <>
      <Cabecalho titulo={ficha.pessoa.nome} voltar={voltar} />
      <Wrap>
        <div className="ficha">
          <aside className="ficha-lado">
            <ResumoDaPessoa ficha={ficha} />
            <AlertasDaPessoa alertas={ficha.alertas} base={base} quem={quem} />
            {permissoes.lancar && ficha.pessoa.situacao !== 'Inativo' ? <AcoesRapidas pessoa={ficha.pessoa} /> : null}
          </aside>
          <div className="ficha-corpo">
            <Abas abas={abas} atual={atual} base={base} rotulo="Seções da ficha" />
            <div className="ficha-aba">
              <Conteudo ficha={ficha} base={base} permissoes={permissoes} />
            </div>
          </div>
        </div>
      </Wrap>
    </>
  );
}
