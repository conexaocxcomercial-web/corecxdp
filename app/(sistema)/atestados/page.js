import { OPCOES, listarAtestados, listarColaboradores, mensagemParaTela } from '@/lib/registros';
import { formatarData, hojeISO, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Status } from '@/componentes/Sinais';
import { Busca, Seletor } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Paragrafo, Selecao, Texto } from '@/componentes/Campos';
import { BotaoMini } from '@/componentes/Botao';
import { salvarAtestado, validarAtestado } from '@/app/acoes';

export const metadata = { title: 'Atestados' };

const GRADE = '1.5fr 112px 64px 84px 1fr 204px';

function Validacao({ item }) {
  if (item.status !== 'Pendente') return <Status>{item.status}</Status>;

  return (
    <span className="flex flex-wrap items-center gap-2">
      <form action={validarAtestado}>
        <input type="hidden" name="linha" value={item.linha} />
        <input type="hidden" name="status" value="Aprovado" />
        <BotaoMini>Aprovar</BotaoMini>
      </form>
      <form action={validarAtestado}>
        <input type="hidden" name="linha" value={item.linha} />
        <input type="hidden" name="status" value="Rejeitado" />
        <BotaoMini>Rejeitar</BotaoMini>
      </form>
    </span>
  );
}

function Anexo({ url }) {
  if (!url) return <span className="text-[var(--tinta-3)]">Sem anexo</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-[var(--acao-texto)] hover:underline">
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
        <Cabecalho titulo="Atestados" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(
              erro,
              'Não foi possível carregar os atestados agora. Recarregue a página em alguns segundos.'
            )}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const porMatricula = new Map(pessoas.map((pessoa) => [pessoa.matricula, pessoa]));
  const nomeDe = (matricula) => porMatricula.get(matricula)?.nome || matricula;
  const ativos = pessoas.filter((pessoa) => pessoa.status !== 'Inativo');

  const filtrados = atestados.filter((item) => {
    const combina =
      !busca ||
      nomeDe(item.matricula).toLowerCase().includes(busca) ||
      item.matricula.toLowerCase().includes(busca) ||
      item.cid.toLowerCase().includes(busca);
    return combina && (!status || item.status === status);
  });

  const pendentes = atestados.filter((item) => item.status === 'Pendente').length;

  const registro = (abrirAoCarregar = false) => (
    <PainelDeRegistro
      abrirAoCarregar={abrirAoCarregar}
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
        opcoes={ativos.map((p) => ({ valor: p.matricula, texto: `${p.nome} (${p.matricula})` }))}
        required
      />
      <div className="folha-duas">
        <Data rotulo="Primeiro dia" nome="inicio" defaultValue={hojeISO()} required />
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
      </div>
      <div className="folha-duas">
        <Texto rotulo="CID" nome="cid" dica="opcional" placeholder="J06.9" />
        <Selecao rotulo="Validação" nome="status" opcoes={OPCOES.statusAtestado} />
      </div>
      <Paragrafo
        rotulo="Link do documento"
        nome="anexo"
        dica="opcional"
        rows={2}
        placeholder="Cole o link do arquivo no Drive"
      />
    </PainelDeRegistro>
  );

  return (
    <>
      <Cabecalho
        titulo="Atestados"
        subtitulo={pendentes > 0 ? `${pendentes} ${plural(pendentes, 'pendente', 'pendentes')}` : `${atestados.length} no total`}
        acoes={registro(parametros?.lancar === '1')}
      >
        <Busca placeholder="Buscar por pessoa, matrícula ou CID" />
        <Seletor chave="status" rotulo="Todas as validações" opcoes={OPCOES.statusAtestado} />
      </Cabecalho>

      <Wrap>
        {pendentes > 0 ? (
          <Faixa tom="alerta">
            <b>{pendentes}</b> {plural(pendentes, 'atestado espera', 'atestados esperam')} validação
            do DP. Aprovar ou rejeitar atualiza o registro do colaborador.
          </Faixa>
        ) : null}

        <Cartao liso>
          {filtrados.length === 0 ? (
            <Vazio icone={atestados.length === 0 ? 'clinical_notes' : 'search_off'} acao={atestados.length === 0 ? registro() : null}>
              {atestados.length === 0
                ? 'Nenhum atestado registrado. Registre o primeiro para acompanhar afastamentos e dias cobertos.'
                : 'Nenhum atestado corresponde à busca. Limpe os filtros ou tente outro termo.'}
            </Vazio>
          ) : (
            <Tabela
              grade={GRADE}
              colunas={[
                { rotulo: 'Pessoa' },
                { rotulo: 'Início', alinha: 'd' },
                { rotulo: 'Dias', alinha: 'd' },
                { rotulo: 'CID', alinha: 'd' },
                { rotulo: 'Documento' },
                { rotulo: 'Validação' },
              ]}
            >
              {filtrados.map((item) => (
                <LinhaTabela key={item.id} grade={GRADE}>
                  <Celula>
                    <Nome href={`/colaboradores/${item.matricula}`}>{nomeDe(item.matricula)}</Nome>
                  </Celula>
                  <Celula rotulo="Início" alinha="d">
                    <span className="num">{formatarData(item.inicio)}</span>
                  </Celula>
                  <Celula rotulo="Dias" alinha="d">
                    <span className="num">{item.dias}</span>
                  </Celula>
                  <Celula rotulo="CID" alinha="d">
                    <span className="num text-[var(--tinta-2)]">{item.cid || '—'}</span>
                  </Celula>
                  <Celula rotulo="Documento" alinha="c">
                    <Anexo url={item.anexo} />
                  </Celula>
                  <Celula rotulo="Validação" alinha="c">
                    <Validacao item={item} />
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
