/**
 * Modo de demonstração: substitui o Google Sheets por dados fictícios em
 * memória, gerados por lib/demo/gerador.js para o dia de hoje (os logins
 * vêm de lib/demo/dados/usuarios.json).
 * Para remover, apague a pasta lib/demo e o desvio no início de lib/planilha.js.
 */
import { ErroDePlanilha } from '@/lib/planilha';
import { hojeISO } from '@/lib/formato';
import usuarios from './dados/usuarios.json';
import { gerarDemonstracao, paraTabelas } from './gerador';

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
function demonstracao() {
  const assinatura = `${hojeISO()}|${USUARIOS}`;
  if (!globalThis.__coreCxDemo || globalThis.__coreCxDemoAssinatura !== assinatura) {
    const dados = gerarDemonstracao(hojeISO());
    const abas = { Usuarios: usuarios, ...paraTabelas(dados) };
    globalThis.__coreCxDemoAssinatura = assinatura;
    globalThis.__coreCxDemo = {
      dados,
      abas: Object.fromEntries(
        Object.entries(abas).map(([aba, { cabecalho, registros }]) => [
          aba,
          {
            cabecalho: [...cabecalho],
            registros: registros.map((registro, indice) => ({ ...registro, _linha: indice + 2 })),
          },
        ])
      ),
    };
  }
  return globalThis.__coreCxDemo;
}

function tabela(aba) {
  const encontrada = demonstracao().abas[aba];
  if (!encontrada) {
    throw new ErroDePlanilha(`A aba ${aba} não existe nos dados de demonstração.`);
  }
  return encontrada;
}

export async function lerAba(aba) {
  const { cabecalho, registros } = tabela(aba);
  return {
    cabecalho: [...cabecalho],
    registros: registros.map((registro) => ({ ...registro })),
  };
}

export async function anexarLinha(aba, valores) {
  const { cabecalho, registros } = tabela(aba);
  const registro = { _linha: registros.length + 2 };
  cabecalho.forEach((coluna, i) => {
    registro[coluna] = valores[i] ?? '';
  });
  registros.push(registro);
}

export async function atualizarCampo(aba, numeroDaLinha, coluna, valor) {
  const { cabecalho, registros } = tabela(aba);

  if (!cabecalho.includes(coluna)) {
    throw new ErroDePlanilha(`A coluna ${coluna} não existe na aba ${aba}.`);
  }

  const registro = registros.find((linha) => linha._linha === Number(numeroDaLinha));
  if (!registro) {
    throw new ErroDePlanilha(`A linha ${numeroDaLinha} não existe na aba ${aba}.`);
  }

  registro[coluna] = valor;
}

/**
 * Parceiros, clientes e CNPJs da demonstração, no formato das tabelas
 * pensadas para o Supabase (lib/dados/regras.js). Só leitura.
 */
export function estrutura() {
  const { dados } = demonstracao();
  return {
    parceiros: dados.parceiros.map((item) => ({ ...item })),
    clientes: dados.clientes.map((item) => ({ ...item })),
    cnpjs: dados.cnpjs.map((item) => ({ ...item })),
  };
}

/**
 * Os dados completos (pessoas com salário e contrato, afastamentos de todos
 * os tipos, férias, benefícios, documentos, autoria), para os repositórios
 * de lib/dados dos módulos novos. Só leitura.
 */
export function dadosCompletos() {
  return demonstracao().dados;
}
