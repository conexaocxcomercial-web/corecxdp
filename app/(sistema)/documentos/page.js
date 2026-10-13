import { listarDocumentos } from '@/lib/dados/documentos';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { COM_VALIDADE, TIPOS_DE_DOCUMENTO } from '@/lib/documentos';
import { grupoDoPrazo } from '@/lib/prazos';
import { formatarData, paraBusca, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { Busca, Seletor } from '@/componentes/Filtros';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { Prazo } from '@/componentes/Prazos';
import { Status } from '@/componentes/Sinais';

export const metadata = { title: 'Documentos' };

const SITUACOES = [
  { valor: 'vencido', rotulo: 'Vencidos' },
  { valor: 'vencendo', rotulo: 'Vencendo em 30 dias' },
  { valor: 'sem validade', rotulo: 'Sem validade' },
  { valor: 'válido', rotulo: 'Válidos' },
];
const NOME_DA_SITUACAO = { vencido: 'Vencido', vencendo: 'Vencendo', 'sem validade': 'Sem validade', válido: 'Válido' };

const GRADE = '1.5fr 1.2fr 110px 1.2fr 120px';
const GRADE_INCOMPLETOS = '1.5fr 1.6fr 120px';

/**
 * Documentos (fase 14 do redesenho): a validade de cada documento, os que
 * vencem ou já venceram, e a completude dos cadastros (contrato, ASO
 * admissional e, depois de um ano, o ASO periódico em dia). Registrar é
 * pelo Lançar › Documento.
 */
export default async function Documentos({ searchParams }) {
  const parametros = await searchParams;
  const permissoes = await permissoesAtuais();
  let lido;
  try {
    lido = await listarDocumentos();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Documentos" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar os documentos agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { documentos, incompletos, numeros, completo } = lido;
  const busca = paraBusca(parametros?.busca || '');
  const tipo = TIPOS_DE_DOCUMENTO.includes(parametros?.tipo) ? parametros.tipo : '';
  const situacao = SITUACOES.some((item) => item.valor === parametros?.situacao) ? parametros.situacao : '';
  // Sem filtro, só o que vence: contratos e ASO admissionais ficam na ficha (ou no filtro de tipo).
  const soOsQueVencem = !busca && !tipo && !situacao;
  const filtrados = documentos.filter(
    (item) =>
      (!busca || paraBusca(item.pessoa.nome).includes(busca) || paraBusca(item.pessoa.matricula).includes(busca)) &&
      (!tipo || item.tipo === tipo) &&
      (!situacao || item.situacao === situacao) &&
      (!soOsQueVencem || item.validade || COM_VALIDADE.includes(item.tipo))
  );
  const podeLancar = completo && permissoes.lancar;

  return (
    <>
      <Cabecalho
        titulo="Documentos"
        subtitulo={`${numeros.vencidos} ${plural(numeros.vencidos, 'vencido', 'vencidos')} · ${numeros.vencendo} vencendo em 30 dias`}
        acoes={<BotaoDeLancar tipo="documento" rotulo="Registrar documento" icone="description" />}
      >
        <Busca placeholder="Buscar por nome ou matrícula" />
        <Seletor chave="tipo" rotulo="Todos os tipos" opcoes={TIPOS_DE_DOCUMENTO} />
        <Seletor chave="situacao" rotulo="Qualquer situação" opcoes={SITUACOES} />
      </Cabecalho>

      <Wrap>
        {!completo ? <Faixa icone="info">Os documentos ainda não estão cadastrados nesta conta.</Faixa> : null}
        <Numeros>
          <Numero rotulo="Cadastros completos" valor={`${String(numeros.completos).replace('.', ',')}%`} apoio={`${numeros.pessoasCompletas} de ${numeros.pessoas} pessoas`} />
          <Numero rotulo="Vencidos" valor={numeros.vencidos} tom={numeros.vencidos ? 'var(--critico)' : undefined} apoio="renovar" />
          <Numero rotulo="Vencendo em 30 dias" valor={numeros.vencendo} apoio="o alerta já está em Pendências" />
          <Numero rotulo="Sem validade" valor={numeros.semValidade} apoio="ASO e CNH pedem a validade" />
        </Numeros>

        {incompletos.length ? (
          <Secao titulo="Cadastros incompletos" nota="o que falta em cada pessoa">
            <Cartao liso>
              <Tabela grade={GRADE_INCOMPLETOS} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Falta' }, { rotulo: '' }]}>
                {incompletos.map((item) => (
                  <LinhaTabela key={item.pessoa.matricula} grade={GRADE_INCOMPLETOS}>
                    <Celula>
                      <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=documentos`}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">{[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}</span>
                    </Celula>
                    <Celula rotulo="Falta" alinha="c">
                      <span>{item.faltam.join(', ')}</span>
                    </Celula>
                    <Celula rotulo="" alinha="d">
                      {podeLancar ? (
                        <BotaoDeLancar tipo="documento" pessoa={{ matricula: item.pessoa.matricula, nome: item.pessoa.nome }} rotulo="Registrar" icone="add" variante="fant" mini />
                      ) : null}
                    </Celula>
                  </LinhaTabela>
                ))}
              </Tabela>
            </Cartao>
          </Secao>
        ) : null}

        <Secao
          titulo={soOsQueVencem ? 'Documentos que vencem' : 'Documentos'}
          nota={soOsQueVencem ? 'do que vence primeiro; os que não vencem aparecem pelo filtro de tipo' : `${filtrados.length} com este filtro`}
        >
          <Cartao liso>
            {filtrados.length === 0 ? (
              <Vazio icone={documentos.length ? 'search_off' : 'description'}>
                {documentos.length ? 'Nenhum documento com este filtro.' : 'Nenhum documento registrado ainda.'}
              </Vazio>
            ) : (
              <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Documento' }, { rotulo: 'Emissão', alinha: 'd' }, { rotulo: 'Validade' }, { rotulo: 'Situação' }]}>
                {filtrados.map((item) => (
                  <LinhaTabela key={item.id} grade={GRADE}>
                    <Celula>
                      <Nome href={`/colaboradores/${encodeURIComponent(item.pessoa.matricula)}?aba=documentos`}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">{item.registrado_por ? `por ${item.registrado_por}` : item.pessoa.cargo}</span>
                    </Celula>
                    <Celula rotulo="Documento" alinha="c">
                      <span>{item.descricao || item.tipo}</span>
                      {item.anexo ? (
                        <a className="tb-sub doc-link" href={item.anexo} target="_blank" rel="noreferrer noopener">
                          abrir o arquivo
                        </a>
                      ) : null}
                    </Celula>
                    <Celula rotulo="Emissão" alinha="d">
                      <span className="num">{formatarData(item.emissao)}</span>
                    </Celula>
                    <Celula rotulo="Validade" alinha="c">
                      {item.validade ? (
                        <span className="linha-situacao">
                          <span className="num">{formatarData(item.validade)}</span>
                          {item.faltam !== null && item.faltam <= 60 ? <Prazo dias={item.faltam} grupo={grupoDoPrazo(item.faltam)} data={item.validade} /> : null}
                        </span>
                      ) : (
                        <span className="text-[var(--tinta-3)]">não vence</span>
                      )}
                    </Celula>
                    <Celula rotulo="Situação" alinha="c">
                      <Status>{NOME_DA_SITUACAO[item.situacao]}</Status>
                    </Celula>
                  </LinhaTabela>
                ))}
              </Tabela>
            )}
          </Cartao>
        </Secao>
      </Wrap>
    </>
  );
}
