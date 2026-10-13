/**
 * Regras de alcance e de isolamento, puras (sem Next, sem fonte de dados):
 * é aqui que se decide o que cada perfil enxerga. Testadas em
 * testes/isolamento.test.js; as telas chegam a elas por lib/dados/alcance.js.
 *
 * Hierarquia: plataforma → parceiro → cliente → CNPJ. A estrutura segue as
 * tabelas pensadas para o Supabase:
 *   parceiros { id, nome }
 *   clientes  { id, parceiro_id, codigo, nome, regime_tributario }
 *   cnpjs     { id, cliente_id, cnpj, nome, tipo: 'matriz' | 'filial' }
 * `codigo` é o valor que os registros atuais trazem na coluna Cliente.
 */

/** Pedido vindo do cookie ("p:<parceiro>|c:<cliente>|j:<cnpj>"); vazio vale "todos". */
export function lerPedido(valor) {
  const pedido = { parceiro: null, cliente: null, cnpj: null };
  for (const parte of String(valor ?? '').split('|')) {
    const [chave, ...resto] = parte.split(':');
    const id = resto.join(':').trim();
    if (!id) continue;
    if (chave === 'p') pedido.parceiro = id;
    if (chave === 'c') pedido.cliente = id;
    if (chave === 'j') pedido.cnpj = id;
  }
  return pedido;
}

export function escreverPedido({ parceiro, cliente, cnpj } = {}) {
  return [parceiro && `p:${parceiro}`, cliente && `c:${cliente}`, cnpj && `j:${cnpj}`]
    .filter(Boolean)
    .join('|');
}

/**
 * O alcance de quem está logado, já validado: um pedido fora do que o
 * perfil alcança é ignorado e cai no nível de cima, nunca em outro cliente.
 *
 * usuario: { perfil: 'gestao' | 'parceiro' | 'admin', parceiro, cliente }
 *   (para a Gestão, `cliente` é o código do cliente; para o Parceiro,
 *   `parceiro` é o id do parceiro)
 */
export function resolverAlcance(usuario, estrutura, pedido = {}) {
  const { parceiros = [], clientes = [], cnpjs = [] } = estrutura;
  const perfil = usuario?.perfil;

  let parceirosPossiveis = [];
  let clientesPossiveis = [];
  let parceiro = null;
  let cliente = null;
  let clienteFixo = false;
  let parceiroFixo = false;

  if (perfil === 'admin') {
    parceirosPossiveis = parceiros;
    parceiro = parceiros.find((item) => item.id === pedido.parceiro) || null;
    clientesPossiveis = parceiro ? clientes.filter((item) => item.parceiro_id === parceiro.id) : clientes;
    cliente = clientesPossiveis.find((item) => item.id === pedido.cliente) || null;
    if (cliente && !parceiro) parceiro = parceiros.find((item) => item.id === cliente.parceiro_id) || null;
  } else if (perfil === 'parceiro') {
    parceiro = parceiros.find((item) => item.id === usuario.parceiro) || null;
    parceiroFixo = true;
    parceirosPossiveis = parceiro ? [parceiro] : [];
    clientesPossiveis = parceiro ? clientes.filter((item) => item.parceiro_id === parceiro.id) : [];
    cliente = clientesPossiveis.find((item) => item.id === pedido.cliente) || null;
  } else {
    cliente = clientes.find((item) => item.codigo === usuario?.cliente) || null;
    clienteFixo = true;
    parceiroFixo = true;
    clientesPossiveis = cliente ? [cliente] : [];
    parceiro = cliente ? parceiros.find((item) => item.id === cliente.parceiro_id) || null : null;
    parceirosPossiveis = parceiro ? [parceiro] : [];
  }

  const cnpjsPossiveis = cliente ? cnpjs.filter((item) => item.cliente_id === cliente.id) : [];
  const cnpj = cnpjsPossiveis.find((item) => item.id === pedido.cnpj) || null;

  return {
    perfil,
    parceiro,
    cliente,
    cnpj,
    fixo: { parceiro: parceiroFixo, cliente: clienteFixo },
    opcoes: { parceiros: parceirosPossiveis, clientes: clientesPossiveis, cnpjs: cnpjsPossiveis },
    chave: escreverPedido({ parceiro: parceiro?.id, cliente: cliente?.id, cnpj: cnpj?.id }) || 'tudo',
  };
}

/**
 * O recorte que a leitura de registros usa: o código do cliente e, quando
 * o alcance é um CNPJ, o número dele. Sem cliente no alcance não há
 * recorte possível para as telas de um cliente.
 */
export function escopoDe(alcance) {
  if (!alcance?.cliente) return null;
  return { cliente: alcance.cliente.codigo, cnpj: alcance.cnpj?.cnpj || null };
}

function mesmoTexto(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}

/** Linhas que pertencem ao escopo. Escopo "*" (dados sem recorte) devolve todas. */
export function filtrarPorEscopo(linhas, escopo, coluna = 'Cliente') {
  if (!escopo) return [];
  if (escopo.cliente === '*') return linhas;
  return linhas.filter((linha) => mesmoTexto(linha[coluna], escopo.cliente));
}
