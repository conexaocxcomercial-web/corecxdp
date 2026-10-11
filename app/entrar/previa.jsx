import { Cartao, Kpi, Kpis } from '@/componentes/Estrutura';
import { Serie } from '@/componentes/Graficos';
import { Icone } from '@/componentes/Icones';
import { Marca } from '@/componentes/Marca';
import { Status } from '@/componentes/Sinais';

/*
 * Retrato do painel com dados ilustrativos (pessoas e números
 * inventados), montado com os mesmos componentes das telas internas:
 * acompanha o tema e nunca fica desatualizado em relação ao produto.
 */
const QUADRO = [
  { rotulo: 'abr', valor: 11 },
  { rotulo: 'mai', valor: 12 },
  { rotulo: 'jun', valor: 12 },
  { rotulo: 'jul', valor: 13 },
  { rotulo: 'ago', valor: 14 },
  { rotulo: 'set', valor: 15 },
];

const LANCAMENTOS = [
  { nome: 'Ana Ribeiro', registro: 'Atestado · 2 dias', situacao: 'Pendente' },
  { nome: 'Bruno Lima', registro: 'Promoção · Analista II', situacao: 'Aprovado' },
  { nome: 'Carla Souza', registro: 'Férias · 15 dias', situacao: 'Férias' },
  { nome: 'Diego Alves', registro: 'Transferência · Logística', situacao: 'Em andamento' },
];

export function PreviaDoPainel() {
  return (
    <div className="previa" aria-hidden="true" inert>
      <div className="previa-topo">
        <Marca />
        <span className="previa-tela">Painel</span>
        <span className="previa-avatar">AR</span>
      </div>

      <div className="previa-corpo">
        <Kpis>
          <Kpi rotulo="Pessoas ativas" valor={15} apoio="em 4 áreas" />
          <Kpi rotulo="Pendências" valor={3} apoio="esperando o DP hoje" />
          <Kpi rotulo="Absenteísmo no mês" valor="2,1%" apoio="6 dias perdidos" />
        </Kpis>

        <div className="previa-pendencia">
          <span className="pil at previa-pendencia-i">
            <Icone nome="clinical_notes" tamanho={16} />
          </span>
          <span>
            <b className="num">2</b> atestados esperando validação
          </span>
          <Icone nome="arrow_forward" tamanho={17} />
        </div>

        <div className="previa-duas">
          <Cartao liso titulo="Últimos lançamentos">
            <ul className="previa-lista">
              {LANCAMENTOS.map((item) => (
                <li key={item.nome}>
                  <span className="previa-pessoa">
                    <b>{item.nome}</b>
                    <span>{item.registro}</span>
                  </span>
                  <Status>{item.situacao}</Status>
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao titulo="Pessoas ativas" descricao="Quadro ao fim de cada mês.">
            <Serie itens={QUADRO} />
          </Cartao>
        </div>
      </div>
    </div>
  );
}
