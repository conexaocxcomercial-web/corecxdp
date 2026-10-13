import { OPCOES, mensagemParaTela } from '@/lib/registros';
import { listarPessoas } from '@/lib/dados/pessoas';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { apenasDigitos, emReais, formatarData, paraBusca } from '@/lib/formato';
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
import { nomeDoContrato } from '@/componentes/Ficha';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { BotaoDeMostrar, ProtecaoDeValores, ValorProtegido } from '@/componentes/Valores';

export const metadata = { title: 'Colaboradores' };

const CONTRATOS = ['indeterminado', 'experiência', 'estágio', 'aprendiz', 'temporário'];

/**
 * Lista de colaboradores (fase 6 do redesenho): busca por nome, matrícula,
 * cargo ou CPF; filtros por unidade, departamento, contrato e situação (a
 * situação vem dos eventos); salário mascarado, revelado só por "Mostrar
 * salários" (LGPD).
 */
export default async function Colaboradores({ searchParams }) {
  const parametros = await searchParams;
  const busca = paraBusca(parametros?.busca || '');
  const permissoes = await permissoesAtuais();

  let lista;
  try {
    lista = await listarPessoas();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Colaboradores" />
        <Wrap>
          <Faixa tom="erro">
            {mensagemParaTela(erro, 'Não foi possível carregar os colaboradores agora. Recarregue a página em alguns segundos.')}
          </Faixa>
        </Wrap>
      </>
    );
  }

  const { pessoas, cnpjs, completo } = lista;
  const departamentos = [...new Set(pessoas.map((pessoa) => pessoa.departamento).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  const area = departamentos.includes(parametros?.area) ? parametros.area : '';
  const situacao = OPCOES.statusColaborador.includes(parametros?.status) ? parametros.status : '';
  const contrato = CONTRATOS.includes(parametros?.contrato) ? parametros.contrato : '';
  const unidade = cnpjs.some((item) => item.id === parametros?.unidade) ? parametros.unidade : '';
  const comUnidade = cnpjs.length > 1;
  const comSalario = completo && pessoas.some((pessoa) => pessoa.salario);

  const digitos = apenasDigitos(busca);
  const filtradas = pessoas.filter((pessoa) => {
    const combina =
      !busca ||
      paraBusca(pessoa.nome).includes(busca) ||
      paraBusca(pessoa.matricula).includes(busca) ||
      paraBusca(pessoa.cargo).includes(busca) ||
      (digitos.length >= 3 && apenasDigitos(pessoa.cpf).includes(digitos));
    return (
      combina &&
      (!area || pessoa.departamento === area) &&
      (!situacao || pessoa.situacao === situacao) &&
      (!contrato || pessoa.contrato === contrato) &&
      (!unidade || pessoa.cnpjId === unidade)
    );
  });
  const noQuadro = pessoas.filter((pessoa) => pessoa.situacao !== 'Inativo').length;
  const filtrado = Boolean(busca || area || situacao || contrato || unidade);
  const sairam = pessoas.length - noQuadro;

  const admitir = <BotaoDeLancar tipo="admissao" rotulo="Admitir" icone="person_add" />;

  const colunas = [
    { rotulo: 'Nome', chave: 'nome', grade: '1.7fr' },
    { rotulo: 'Departamento', chave: 'area', grade: '1fr' },
    ...(comUnidade ? [{ rotulo: 'Unidade', chave: 'unidade', grade: '1fr' }] : []),
    ...(completo ? [{ rotulo: 'Contrato', chave: 'contrato', grade: '130px' }] : []),
    { rotulo: 'Admissão', chave: 'admissao', grade: '140px', alinha: 'd' },
    ...(comSalario ? [{ rotulo: 'Salário', chave: 'salario', grade: '120px', alinha: 'd' }] : []),
    { rotulo: 'Situação', chave: 'situacao', grade: '110px' },
  ];
  const grade = colunas.map((coluna) => coluna.grade).join(' ');

  return (
    <ProtecaoDeValores>
      <Cabecalho
        titulo="Colaboradores"
        subtitulo={
          filtrado
            ? `${filtradas.length} de ${pessoas.length} com o filtro`
            : `${noQuadro} no quadro${sairam ? ` · ${sairam} ${sairam === 1 ? 'já saiu' : 'já saíram'}` : ''}`
        }
        acoes={
          <>
            {comSalario ? <BotaoDeMostrar rotulo="salários" /> : null}
            {permissoes.lancar ? admitir : null}
          </>
        }
      >
        <Busca placeholder="Buscar por nome, matrícula, cargo ou CPF" />
        {comUnidade ? (
          <Seletor chave="unidade" rotulo="Todas as unidades" opcoes={cnpjs.map((item) => ({ valor: item.id, rotulo: item.nome }))} />
        ) : null}
        <Seletor chave="area" rotulo="Todos os departamentos" opcoes={departamentos} />
        {completo ? (
          <Seletor chave="contrato" rotulo="Todos os contratos" opcoes={CONTRATOS.map((item) => ({ valor: item, rotulo: nomeDoContrato(item) }))} />
        ) : null}
        <Seletor chave="status" rotulo="Todas as situações" opcoes={OPCOES.statusColaborador} />
      </Cabecalho>

      <Wrap>
        <Cartao liso>
          {filtradas.length === 0 ? (
            <Vazio icone={pessoas.length === 0 ? 'group_add' : 'search_off'} acao={pessoas.length === 0 && permissoes.lancar ? admitir : null}>
              {pessoas.length === 0
                ? permissoes.lancar
                  ? 'Nenhum colaborador cadastrado. Admita a primeira pessoa para abrir o registro de pessoal da empresa.'
                  : 'Nenhum colaborador cadastrado nesta empresa ainda.'
                : 'Nenhum colaborador corresponde à busca. Limpe os filtros ou tente outro termo.'}
            </Vazio>
          ) : (
            <Tabela grade={grade} colunas={colunas}>
              {filtradas.map((pessoa) => (
                <LinhaTabela key={pessoa.matricula} grade={grade}>
                  <Celula>
                    <Nome href={`/colaboradores/${encodeURIComponent(pessoa.matricula)}`}>{pessoa.nome}</Nome>
                    <span className="tb-sub">
                      <span className="num">{pessoa.matricula}</span>
                      {pessoa.cargo ? ` · ${pessoa.cargo}` : ''}
                    </span>
                  </Celula>
                  <Celula rotulo="Departamento" alinha="c">
                    <span className="text-[var(--tinta-2)]">{pessoa.departamento || '—'}</span>
                  </Celula>
                  {comUnidade ? (
                    <Celula rotulo="Unidade" alinha="c">
                      <span className="text-[var(--tinta-2)]">{pessoa.cnpj?.nome.split(' · ').pop() || '—'}</span>
                    </Celula>
                  ) : null}
                  {completo ? (
                    <Celula rotulo="Contrato" alinha="c">
                      <span className="text-[var(--tinta-2)]">{nomeDoContrato(pessoa.contrato) || '—'}</span>
                    </Celula>
                  ) : null}
                  <Celula rotulo="Admissão" alinha="d">
                    <span className="num">{formatarData(pessoa.admissao)}</span>
                    <span className="tb-sub">{pessoa.tempoDeCasa}</span>
                  </Celula>
                  {comSalario ? (
                    <Celula rotulo="Salário" alinha="d">
                      {pessoa.salario ? <ValorProtegido valor={emReais(pessoa.salario)} mascara="R$ •••••" rotulo="Salário" /> : '—'}
                    </Celula>
                  ) : null}
                  <Celula rotulo="Situação" alinha="c">
                    <Status>{pessoa.situacao}</Status>
                  </Celula>
                </LinhaTabela>
              ))}
            </Tabela>
          )}
        </Cartao>
      </Wrap>
    </ProtecaoDeValores>
  );
}
