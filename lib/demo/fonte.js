/**
 * Modo de demonstração: substitui o Google Sheets por dados fictícios em
 * memória, gerados por lib/demo/gerador.js para o dia de hoje (os logins
 * vêm de lib/demo/dados/usuarios.json). Os dados completos são a fonte
 * única; as abas das telas atuais saem deles (lib/demo/memoria.js).
 * Para remover, apague a pasta lib/demo e os desvios listados no CLAUDE.md.
 */
import { ErroDePlanilha } from '@/lib/planilha';
import { hojeISO } from '@/lib/formato';
import usuarios from './dados/usuarios.json';
import { gerarDemonstracao } from './gerador';
import { ErroDaMemoria, criarMemoria } from './memoria';

export function modoDemo() {
  return process.env.MODO_DEMO === '1';
}

// Os logins entram na assinatura: mudou o JSON, a cópia em memória recomeça
// sem precisar reiniciar o next dev.
const USUARIOS = JSON.stringify(usuarios);

/**
 * Cópia em memória, para que cadastros e aprovações funcionem na demonstração.
 * Ela é refeita quando o dia muda (as datas são contadas a partir de hoje) ou
 * quando o servidor reinicia; aí o que foi cadastrado volta ao original.
 * Fica em globalThis para sobreviver ao recarregamento de módulos do next dev.
 */
function memoria() {
  const assinatura = `${hojeISO()}|${USUARIOS}`;
  if (!globalThis.__coreCxDemo || globalThis.__coreCxDemoAssinatura !== assinatura) {
    globalThis.__coreCxDemoAssinatura = assinatura;
    globalThis.__coreCxDemo = criarMemoria(gerarDemonstracao(hojeISO()), JSON.parse(USUARIOS));
  }
  return globalThis.__coreCxDemo;
}

function traduzir(funcao) {
  try {
    return funcao();
  } catch (erro) {
    if (erro instanceof ErroDaMemoria) throw new ErroDePlanilha(erro.message);
    throw erro;
  }
}

/** Quem está gravando, para a autoria do registro. */
async function autor() {
  const { usuarioDaSessao } = await import('@/lib/sessao');
  const sessao = await usuarioDaSessao();
  return sessao?.nome || 'Gestão da empresa';
}

export async function lerAba(aba) {
  return traduzir(() => memoria().lerAba(aba));
}

export async function anexarLinha(aba, valores) {
  const quem = await autor();
  traduzir(() => memoria().anexarLinha(aba, valores, quem));
}

export async function atualizarCampo(aba, numeroDaLinha, coluna, valor) {
  const quem = await autor();
  traduzir(() => memoria().atualizarCampo(aba, numeroDaLinha, coluna, valor, quem));
}

/**
 * Parceiros, clientes e CNPJs da demonstração, no formato das tabelas
 * pensadas para o Supabase (lib/dados/regras.js). Só leitura.
 */
export function estrutura() {
  const { dados } = memoria();
  return {
    parceiros: dados.parceiros.map((item) => ({ ...item })),
    clientes: dados.clientes.map((item) => ({ ...item })),
    cnpjs: dados.cnpjs.map((item) => ({ ...item })),
  };
}

/**
 * Os dados completos (pessoas com salário e contrato, afastamentos de todos
 * os tipos, férias, benefícios, documentos, autoria), para os repositórios
 * de lib/dados dos módulos novos. Só leitura: para mudar, use `alterar`.
 */
export function dadosCompletos() {
  return memoria().dados;
}

/** Altera um item dos dados completos pelo id (repositórios de lib/dados). */
export function alterar(colecao, id, campos) {
  return traduzir(() => memoria().alterar(colecao, id, campos));
}
