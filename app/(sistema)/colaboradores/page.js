import { OPCOES, listarColaboradores, mensagemParaTela } from '@/lib/registros';
import { alcanceAtual, permissoesAtuais } from '@/lib/dados/alcance';
import { apenasDigitos, formatarData, hojeISO, plural } from '@/lib/formato';
import {
  Cabecalho,
  Cartao,
  Celula,
  Faixa,
  LinhaTabela,
  Nome,
  Tabela,
  Vazio,
  Wrap,
} from '@/componentes/Estrutura';
import { Status } from '@/componentes/Sinais';
import { Busca, Seletor } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Selecao, Texto } from '@/componentes/Campos';
import { salvarColaborador } from '@/app/acoes';

export const metadata = { title: 'Colaboradores' };

const GRADE = '1.6fr 100px 1fr 1.2fr 104px 120px';

export default async function Colaboradores({ searchParams }) {
  const parametros = await searchParams;
  const busca = String(parametros?.busca || '').trim().toLowerCase();
  const area = String(parametros?.area || '');
  const situacao = String(parametros?.status || '');
  const [permissoes, alcance] = await Promise.all([permissoesAtuais(), alcanceAtual()]);
  const cnpjs = alcance?.opcoes.cnpjs || [];

  let pessoas;
  try {
    pessoas = await listarColaboradores();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Colaboradores" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(
              erro,
              'Não foi possível carregar os colaboradores agora. Recarregue a página em alguns segundos.'
            )}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const areas = [...new Set([...OPCOES.departamentos, ...pessoas.map((p) => p.departamento)])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const digitos = apenasDigitos(busca);
  const filtradas = pessoas.filter((pessoa) => {
    const combina =
      !busca ||
      pessoa.nome.toLowerCase().includes(busca) ||
      pessoa.matricula.toLowerCase().includes(busca) ||
      pessoa.cargo.toLowerCase().includes(busca) ||
      (digitos.length >= 3 && apenasDigitos(pessoa.cpf).includes(digitos));

    return (
      combina &&
      (!area || pessoa.departamento === area) &&
      (!situacao || pessoa.status === situacao)
    );
  });

  const cadastro = (abrirAoCarregar = false) => (
    <PainelDeRegistro
      abrirAoCarregar={abrirAoCarregar}
      abrir="Cadastrar"
      titulo="Cadastrar colaborador"
      descricao="A matrícula é gerada automaticamente, na sequência das já cadastradas."
      acao={salvarColaborador}
      enviar="Cadastrar colaborador"
      enviando="Cadastrando…"
    >
      <Texto rotulo="Nome completo" nome="nome" placeholder="Ana Beatriz Moreira" required />
      <div className="folha-duas">
        <Texto rotulo="CPF" nome="cpf" placeholder="000.000.000-00" inputMode="numeric" required />
        <Data rotulo="Admissão" nome="admissao" defaultValue={hojeISO()} required />
      </div>
      <Texto rotulo="Cargo" nome="cargo" placeholder="Analista de Operações Júnior" required />
      {cnpjs.length > 1 ? (
        <Selecao
          rotulo="CNPJ"
          nome="cnpj"
          defaultValue={(alcance.cnpj || cnpjs.find((item) => item.tipo === 'matriz') || cnpjs[0]).cnpj}
          opcoes={cnpjs.map((item) => ({ valor: item.cnpj, texto: `${item.nome} (${item.cnpj})` }))}
        />
      ) : null}
      <div className="folha-duas">
        <Selecao rotulo="Área" nome="departamento" opcoes={areas} />
        <Selecao rotulo="Situação" nome="status" opcoes={OPCOES.statusColaborador} />
      </div>
      <Texto
        rotulo="Gestor imediato"
        nome="gestor"
        dica="opcional"
        placeholder="Nome de quem responde pela pessoa"
      />
    </PainelDeRegistro>
  );

  return (
    <>
      <Cabecalho
        titulo="Colaboradores"
        subtitulo={`${filtradas.length} de ${pessoas.length}`}
        acoes={permissoes.lancar ? cadastro(parametros?.lancar === '1') : null}
      >
        <Busca placeholder="Buscar por nome, matrícula, cargo ou CPF" />
        <Seletor chave="area" rotulo="Todas as áreas" opcoes={areas} />
        <Seletor chave="status" rotulo="Todas as situações" opcoes={OPCOES.statusColaborador} />
      </Cabecalho>

      <Wrap>
        <Cartao liso>
          {filtradas.length === 0 ? (
            <Vazio icone={pessoas.length === 0 ? 'group_add' : 'search_off'} acao={pessoas.length === 0 && permissoes.lancar ? cadastro() : null}>
              {pessoas.length === 0
                ? permissoes.lancar
                  ? 'Nenhum colaborador cadastrado. Cadastre a primeira pessoa para abrir o registro de pessoal da empresa.'
                  : 'Nenhum colaborador cadastrado nesta empresa ainda.'
                : 'Nenhum colaborador corresponde à busca. Limpe os filtros ou tente outro termo.'}
            </Vazio>
          ) : (
            <Tabela
              grade={GRADE}
              colunas={[
                { rotulo: 'Nome' },
                { rotulo: 'Matrícula', alinha: 'd' },
                { rotulo: 'Área' },
                { rotulo: 'Cargo' },
                { rotulo: 'Admissão', alinha: 'd' },
                { rotulo: 'Situação' },
              ]}
            >
              {filtradas.map((pessoa) => (
                <LinhaTabela key={pessoa.matricula} grade={GRADE}>
                  <Celula>
                    <Nome href={`/colaboradores/${pessoa.matricula}`}>{pessoa.nome}</Nome>
                  </Celula>
                  <Celula rotulo="Matrícula" alinha="d">
                    <span className="num text-[var(--tinta-2)]">{pessoa.matricula}</span>
                  </Celula>
                  <Celula rotulo="Área" alinha="c">
                    <span className="text-[var(--tinta-2)]">{pessoa.departamento || '—'}</span>
                  </Celula>
                  <Celula rotulo="Cargo" alinha="c">
                    <span className="text-[var(--tinta-2)]">{pessoa.cargo || '—'}</span>
                  </Celula>
                  <Celula rotulo="Admissão" alinha="d">
                    <span className="num">{formatarData(pessoa.admissao)}</span>
                  </Celula>
                  <Celula rotulo="Situação" alinha="c">
                    <Status>{pessoa.status}</Status>
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
