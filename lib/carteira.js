/**
 * Carteira do parceiro (fase 15 do redesenho): cada cliente com os números
 * para comparar (pessoas, custo estimado, fator de custo, turnover,
 * absenteísmo, férias vencidas) e o que pede atenção (aprovações esperando
 * a Gestão, prazos vencidos, férias vencidas). Só os clientes do parceiro:
 * quem chama passa a lista do alcance.
 *
 * Saúde: absenteísmo oculto em cliente com menos de 3 pessoas (LGPD).
 * Puro; testado em testes/carteira.test.js.
 */
import { listarAprovacoes, listarPrazos, recortar } from './prazos.js';
import { competencias, folhaDoMes } from './folha.js';
import { resumoDoTema } from './paineis.js';

export const ORDENS = [
  { valor: 'atencao', rotulo: 'O que pede atenção primeiro' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'pessoas', rotulo: 'Mais pessoas' },
  { valor: 'custo', rotulo: 'Maior custo estimado' },
  { valor: 'turnover', rotulo: 'Maior turnover' },
  { valor: 'absenteismo', rotulo: 'Maior absenteísmo' },
];

function resumoDoCliente(dados, cliente) {
  const recorte = recortar(dados, { cliente: cliente.id });
  const quadro = resumoDoTema(recorte, 'quadro', { meses: 12 });
  const saude = resumoDoTema(recorte, 'saude', { meses: 3 });
  const ferias = resumoDoTema(recorte, 'ferias', { meses: 12 });
  const folha = folhaDoMes(recorte, competencias(recorte.hoje, 1)[0]).totais;
  const aprovacoes = listarAprovacoes(recorte).length;
  const vencidos = listarPrazos(recorte).filter((item) => item.grupo === 'vencido').length;
  const feriasVencidas = ferias.vencidas.valor || 0;
  const motivos = [
    aprovacoes ? `${aprovacoes} ${aprovacoes === 1 ? 'aprovação esperando' : 'aprovações esperando'}` : null,
    vencidos ? `${vencidos} ${vencidos === 1 ? 'prazo vencido' : 'prazos vencidos'}` : null,
  ].filter(Boolean);
  return {
    id: cliente.id,
    codigo: cliente.codigo,
    nome: cliente.nome,
    regime: cliente.regime_tributario || null,
    pessoas: quadro.ativos.valor,
    custo: folha.total,
    fator: folha.fatorDeCusto,
    turnover: quadro.turnover.valor,
    absenteismo: saude.absenteismo.oculto ? null : saude.absenteismo.valor,
    absenteismoOculto: saude.absenteismo.oculto,
    feriasVencidas,
    aprovacoes,
    vencidos,
    emRevisao: Boolean(cliente.implantacao && !cliente.revisao?.concluida_em),
    atencao: aprovacoes + vencidos,
    motivos,
  };
}

export function resumoDaCarteira(dados, clientes, ordem = 'atencao') {
  const linhas = clientes.map((cliente) => resumoDoCliente(dados, cliente));
  const comparar = {
    atencao: (a, b) => b.atencao - a.atencao || a.nome.localeCompare(b.nome, 'pt-BR'),
    nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
    pessoas: (a, b) => b.pessoas - a.pessoas,
    custo: (a, b) => b.custo - a.custo,
    turnover: (a, b) => b.turnover - a.turnover,
    absenteismo: (a, b) => (b.absenteismo ?? -1) - (a.absenteismo ?? -1),
  }[ordem] || ((a, b) => b.atencao - a.atencao);
  const soma = (campo) => linhas.reduce((total, linha) => total + (linha[campo] || 0), 0);
  return {
    clientes: [...linhas].sort(comparar),
    numeros: {
      clientes: linhas.length,
      pessoas: soma('pessoas'),
      custo: Math.round(soma('custo') * 100) / 100,
      vencidos: soma('vencidos'),
      aprovacoes: soma('aprovacoes'),
      pedemAtencao: linhas.filter((linha) => linha.atencao > 0).length,
    },
  };
}
