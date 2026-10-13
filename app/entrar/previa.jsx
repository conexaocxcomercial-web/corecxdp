import { Cartao } from '@/componentes/Estrutura';
import { Marca } from '@/componentes/Marca';
import { Status } from '@/componentes/Sinais';

/*
 * Retrato do Início da Gestão com dados ilustrativos (pessoas e números
 * inventados), montado com as mesmas peças das telas internas: a faixa do
 * Início com o quadro, a frase do que espera você e os números do negócio,
 * e a lista "Esperando você" com as pílulas de prazo. Acompanha o tema e a
 * cor do parceiro, e não fica desatualizado em relação ao produto.
 */
const NUMEROS = [
  { rotulo: 'Custo estimado de pessoal', valor: 'R$ 182 mil', apoio: '+R$ 2,4 mil sobre setembro, estimativa' },
  { rotulo: 'Turnover em 12 meses', valor: '18,4%', apoio: '9 entradas e 6 saídas' },
  { rotulo: 'Absenteísmo em setembro', valor: '1,2%', apoio: '−0,3 p.p. sobre agosto' },
];

const ESPERANDO = [
  { nome: 'Ana Ribeiro', registro: 'Atestado de 2 dias · Doença', pilula: { texto: 'para aprovar', grupo: 'semana' } },
  { nome: 'Carla Souza', registro: 'Férias de 15 dias · a partir de 03/11', pilula: { texto: 'para aprovar', grupo: 'semana' } },
  { nome: 'Bruno Lima', registro: 'Fim dos 45 dias de experiência', pilula: { texto: 'em 3 dias', grupo: 'semana' } },
  { nome: 'Diego Alves', registro: 'Renovar ASO periódico', pilula: { texto: 'venceu ontem', grupo: 'vencido' } },
];

export function PreviaDoPainel() {
  return (
    <div className="previa" aria-hidden="true" inert>
      <div className="previa-topo">
        <Marca />
        <span className="previa-tela">Início</span>
        <span className="previa-avatar">AR</span>
      </div>

      <div className="previa-corpo">
        <div className="previa-faixa">
          <p className="previa-frase">
            32 pessoas no quadro
            <span>4 coisas esperando você, a maior parte em férias e afastamentos.</span>
          </p>
          <ul className="previa-nums">
            {NUMEROS.map((numero) => (
              <li key={numero.rotulo}>
                <span className="previa-num-r">{numero.rotulo}</span>
                <span className="previa-num-v num">{numero.valor}</span>
                <span className="previa-num-p">{numero.apoio}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="previa-duas">
          <Cartao liso titulo="Esperando você">
            <ul className="previa-lista">
              {ESPERANDO.map((item) => (
                <li key={item.nome}>
                  <span className="previa-pessoa">
                    <b>{item.nome}</b>
                    <span>{item.registro}</span>
                  </span>
                  <span className={`quando ${item.pilula.grupo}`}>{item.pilula.texto}</span>
                </li>
              ))}
            </ul>
          </Cartao>

          <Cartao liso titulo="Pessoas e contratos">
            <ul className="previa-lista">
              <li>
                <span className="previa-pessoa">
                  <b>Elisa Moura</b>
                  <span>Registrar a admissão · começa em 20/10</span>
                </span>
                <span className="quando mes">em 6 dias</span>
              </li>
              <li>
                <span className="previa-pessoa">
                  <b>Rafael Teixeira</b>
                  <span>Desligamento para concluir</span>
                </span>
                <Status>Pendente</Status>
              </li>
            </ul>
          </Cartao>
        </div>
      </div>
    </div>
  );
}
