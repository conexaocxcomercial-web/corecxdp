/**
 * Modo de demonstração: substitui o Google Sheets pelos JSON de lib/demo/dados.
 * Para remover, apague a pasta lib/demo e o desvio no início de lib/planilha.js.
 */
import { ErroDePlanilha } from '@/lib/planilha';
import usuarios from './dados/usuarios.json';
import colaboradores from './dados/colaboradores.json';
import ocorrencias from './dados/ocorrencias.json';
import atestados from './dados/atestados.json';
import movimentacoes from './dados/movimentacoes.json';
import estruturaDemo from './dados/estrutura.json';

const ORIGINAIS = {
  Usuarios: usuarios,
  Colaboradores: colaboradores,
  Ocorrencias_Faltas: ocorrencias,
  Atestados: atestados,
  Movimentacoes_DP: movimentacoes,
};

export function modoDemo() {
  return process.env.MODO_DEMO === '1';
}

// Muda quando o conteúdo dos JSON muda: aí a cópia em memória recomeça,
// sem precisar reiniciar o next dev.
const ASSINATURA = JSON.stringify(ORIGINAIS);

/**
 * Cópia em memória, para que cadastros e aprovações funcionem na demonstração.
 * Os arquivos nunca mudam; tudo volta ao original quando o servidor reinicia.
 * Fica em globalThis para sobreviver ao recarregamento de módulos do next dev.
 */
function tabelas() {
  if (!globalThis.__coreCxDemo || globalThis.__coreCxDemoAssinatura !== ASSINATURA) {
    globalThis.__coreCxDemoAssinatura = ASSINATURA;
    globalThis.__coreCxDemo = Object.fromEntries(
      Object.entries(ORIGINAIS).map(([aba, { cabecalho, registros }]) => [
        aba,
        {
          cabecalho: [...cabecalho],
          registros: registros.map((registro, indice) => ({ ...registro, _linha: indice + 2 })),
        },
      ])
    );
  }
  return globalThis.__coreCxDemo;
}

function tabela(aba) {
  const encontrada = tabelas()[aba];
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
  return {
    parceiros: estruturaDemo.parceiros.map((item) => ({ ...item })),
    clientes: estruturaDemo.clientes.map((item) => ({ ...item })),
    cnpjs: estruturaDemo.cnpjs.map((item) => ({ ...item })),
  };
}
