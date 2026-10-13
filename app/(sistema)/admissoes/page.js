import { listarAdmissoes } from '@/lib/dados/entradasESaidas';
import { permissoesAtuais } from '@/lib/dados/alcance';
import { mensagemParaTela } from '@/lib/avisos';
import { diaDe } from '@/lib/calendario';
import { grupoDoPrazo } from '@/lib/prazos';
import { emReais, formatarData, plural } from '@/lib/formato';
import {
  Cabecalho, Cartao, Celula, Faixa, LinhaTabela, Nome, Numero, Numeros, Secao, Tabela, Vazio, Wrap,
} from '@/componentes/Estrutura';
import { nomeDoContrato } from '@/componentes/Ficha';
import { BotaoDeLancar } from '@/componentes/Lancar';
import { InformarCustos } from '@/componentes/Custos';
import { Passos, ResumoDosPassos } from '@/componentes/Passos';
import { Prazo } from '@/componentes/Prazos';

export const metadata = { title: 'Admissões' };

const GRADE_EXPERIENCIA = '1.6fr 120px 1fr 1fr';
const GRADE = '1.5fr 130px 1.6fr 1.1fr';

const ficha = (pessoa, aba = 'contrato') => `/colaboradores/${encodeURIComponent(pessoa.matricula)}?aba=${aba}`;

function PrazoDaExperiencia({ data, hoje }) {
  const dias = diaDe(data) - diaDe(hoje);
  if (dias < 0) {
    return <span className="text-[var(--tinta-3)]">passou em {formatarData(data)}</span>;
  }
  return (
    <span className="linha-situacao">
      <span className="num">{formatarData(data)}</span>
      <Prazo dias={dias} grupo={grupoDoPrazo(dias)} data={data} />
    </span>
  );
}

/**
 * Admissões (fase 9 do redesenho): quem começa em breve, com os passos
 * (registro até a véspera, ASO admissional e contrato pelos documentos,
 * custos informados); quem está em experiência, com os 45 e os 90 dias; e
 * as admissões dos últimos 12 meses com o custo admissional informado pela
 * empresa (não calculado).
 */
export default async function Admissoes() {
  const permissoes = await permissoesAtuais();
  let lista;
  try {
    lista = await listarAdmissoes();
  } catch (erro) {
    return (
      <>
        <Cabecalho titulo="Admissões" />
        <Wrap>
          <Faixa tom="erro">{mensagemParaTela(erro, 'Não foi possível carregar as admissões agora. Recarregue a página em alguns segundos.')}</Faixa>
        </Wrap>
      </>
    );
  }

  const { futuras, emExperiencia, itens, numeros, hoje, completo } = lista;
  const passadas = itens.filter((item) => !item.futura);
  const podeInformar = completo && permissoes.lancar;

  return (
    <>
      <Cabecalho
        titulo="Admissões"
        subtitulo={`${numeros.admissoes} ${plural(numeros.admissoes, 'admissão', 'admissões')} nos últimos 12 meses${
          numeros.futuras ? ` · ${numeros.futuras} ${plural(numeros.futuras, 'marcada', 'marcadas')}` : ''
        }`}
        acoes={<BotaoDeLancar tipo="admissao" rotulo="Admitir" icone="person_add" />}
      />

      <Wrap>
        {!completo ? (
          <Faixa icone="info">Contrato, documentos e custos ainda não estão cadastrados nesta conta: os passos aparecem quando estiverem.</Faixa>
        ) : null}

        <Numeros>
          <Numero rotulo="Admissões em 12 meses" valor={numeros.admissoes} apoio={`${numeros.retidas} ${plural(numeros.retidas, 'segue', 'seguem')} no quadro`} />
          <Numero rotulo="Em experiência" valor={emExperiencia.length} apoio="prazos de 45 e 90 dias" />
          <Numero
            rotulo="Custo admissional informado"
            valor={emReais(numeros.custoInformado)}
            apoio={
              numeros.comCusto
                ? `média de ${emReais(numeros.custoMedio)} em ${numeros.comCusto} ${plural(numeros.comCusto, 'admissão', 'admissões')}`
                : 'nenhum custo informado ainda'
            }
          />
        </Numeros>

        {futuras.length ? (
          <Secao titulo="Começam em breve" nota="o registro vence na véspera do primeiro dia">
            <div className="es-lista">
              {futuras.map((item) => (
                <Cartao key={item.id} className="es-cartao">
                  <div className="es-cab">
                    <span className="es-quem">
                      <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">
                        {[item.pessoa.cargo, item.pessoa.departamento, nomeDoContrato(item.contrato)].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="es-data">
                      começa em <b className="num">{formatarData(item.admissao)}</b>
                    </span>
                  </div>
                  <Passos passos={item.passos} />
                  {podeInformar && !item.custo ? (
                    <div className="es-pe">
                      <InformarCustos matricula={item.pessoa.matricula} nome={item.pessoa.nome} momento="admissao" custo={item.custo} />
                    </div>
                  ) : null}
                </Cartao>
              ))}
            </div>
          </Secao>
        ) : null}

        {emExperiencia.length ? (
          <Secao titulo="Em experiência" nota="prorrogar ou efetivar até o fim de cada período">
            <Cartao liso>
              <Tabela
                grade={GRADE_EXPERIENCIA}
                colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Admissão', alinha: 'd' }, { rotulo: 'Fim dos 45 dias' }, { rotulo: 'Fim dos 90 dias' }]}
              >
                {emExperiencia.map((item) => (
                  <LinhaTabela key={item.id} grade={GRADE_EXPERIENCIA}>
                    <Celula>
                      <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">{[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}</span>
                    </Celula>
                    <Celula rotulo="Admissão" alinha="d">
                      <span className="num">{formatarData(item.admissao)}</span>
                    </Celula>
                    <Celula rotulo="Fim dos 45 dias" alinha="c">
                      <PrazoDaExperiencia data={item.experiencia.primeiroPeriodo} hoje={hoje} />
                    </Celula>
                    <Celula rotulo="Fim dos 90 dias" alinha="c">
                      <PrazoDaExperiencia data={item.experiencia.fim} hoje={hoje} />
                    </Celula>
                  </LinhaTabela>
                ))}
              </Tabela>
            </Cartao>
          </Secao>
        ) : null}

        <Secao titulo="Últimos 12 meses" nota="custos informados pela empresa, não calculados">
          <Cartao liso>
            {passadas.length === 0 ? (
              <Vazio icone="person_add">Nenhuma admissão nos últimos 12 meses.</Vazio>
            ) : (
              <Tabela grade={GRADE} colunas={[{ rotulo: 'Pessoa' }, { rotulo: 'Admissão', alinha: 'd' }, { rotulo: 'Passos' }, { rotulo: 'Custos', alinha: 'd' }]}>
                {passadas.map((item) => (
                  <LinhaTabela key={item.id} grade={GRADE}>
                    <Celula>
                      <Nome href={ficha(item.pessoa)}>{item.pessoa.nome}</Nome>
                      <span className="tb-sub">
                        {[item.pessoa.cargo, item.pessoa.departamento].filter(Boolean).join(' · ')}
                        {item.desligamento ? ` · saiu em ${formatarData(item.desligamento)}` : ''}
                      </span>
                    </Celula>
                    <Celula rotulo="Admissão" alinha="d">
                      <span className="num">{formatarData(item.admissao)}</span>
                      <span className="tb-sub">{nomeDoContrato(item.contrato) || ''}</span>
                    </Celula>
                    <Celula rotulo="Passos" alinha="c">
                      <ResumoDosPassos passos={item.passos} />
                    </Celula>
                    <Celula rotulo="Custos" alinha="d">
                      <span className="linha-situacao fim">
                        {item.custo ? <span className="num">{emReais(item.custo.total)}</span> : <span className="text-[var(--tinta-3)]">—</span>}
                        {podeInformar && item.passos ? (
                          <InformarCustos matricula={item.pessoa.matricula} nome={item.pessoa.nome} momento="admissao" custo={item.custo} curto />
                        ) : null}
                      </span>
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
