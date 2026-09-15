import { JWT } from 'google-auth-library';

const ESCOPOS = ['https://www.googleapis.com/auth/spreadsheets'];
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const ABAS = {
  colaboradores: 'Colaboradores',
  ocorrencias: 'Ocorrencias_Faltas',
  atestados: 'Atestados',
  movimentacoes: 'Movimentacoes_DP',
};

export class ErroDePlanilha extends Error {}

let clienteJWT = null;

function autenticar() {
  if (clienteJWT) return clienteJWT;

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const chave = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !chave) {
    throw new ErroDePlanilha(
      'A conexão com a planilha não está configurada. Defina GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY nas variáveis de ambiente.'
    );
  }

  clienteJWT = new JWT({ email, key: chave, scopes: ESCOPOS });
  return clienteJWT;
}

async function chamar(caminho, opcoes = {}) {
  const planilha = process.env.GOOGLE_SHEET_ID;

  if (!planilha) {
    throw new ErroDePlanilha(
      'Nenhuma planilha conectada. Defina GOOGLE_SHEET_ID nas variáveis de ambiente.'
    );
  }

  const { token } = await autenticar().getAccessToken();

  const resposta = await fetch(`${BASE}/${planilha}${caminho}`, {
    ...opcoes,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();

    if (resposta.status === 403) {
      throw new ErroDePlanilha(
        `A conta de serviço não tem acesso à planilha. Compartilhe a planilha com ${process.env.GOOGLE_CLIENT_EMAIL} como Editor.`
      );
    }
    if (resposta.status === 400 && corpo.includes('Unable to parse range')) {
      throw new ErroDePlanilha(
        'Uma das abas não foi encontrada. A planilha precisa ter as abas Colaboradores, Ocorrencias_Faltas, Atestados e Movimentacoes_DP.'
      );
    }

    throw new ErroDePlanilha(
      `O Google Sheets respondeu ${resposta.status}. ${corpo.slice(0, 220)}`
    );
  }

  return resposta.json();
}

function comConteudo(linha) {
  return linha.some((celula) => String(celula ?? '').trim() !== '');
}

/**
 * Lê uma aba inteira. Datas voltam como número de série do Sheets,
 * o que mantém a leitura estável em qualquer idioma da planilha.
 */
export async function lerAba(aba) {
  const intervalo = encodeURIComponent(`${aba}!A1:Z5000`);
  const dados = await chamar(
    `/values/${intervalo}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`
  );

  const [cabecalho = [], ...linhas] = dados.values || [];

  const registros = linhas
    .map((linha, indice) => ({ linha, numero: indice + 2 }))
    .filter(({ linha }) => comConteudo(linha))
    .map(({ linha, numero }) => {
      const registro = { _linha: numero };
      cabecalho.forEach((coluna, i) => {
        registro[coluna] = linha[i] ?? '';
      });
      return registro;
    });

  return { cabecalho, registros };
}

export async function anexarLinha(aba, valores) {
  const intervalo = encodeURIComponent(`${aba}!A1`);
  return chamar(
    `/values/${intervalo}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [valores] }) }
  );
}

function letraDaColuna(indice) {
  let letra = '';
  let n = indice + 1;
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

export async function atualizarCampo(aba, numeroDaLinha, coluna, valor) {
  const { cabecalho } = await lerAba(aba);
  const indice = cabecalho.indexOf(coluna);

  if (indice === -1) {
    throw new ErroDePlanilha(`A coluna ${coluna} não existe na aba ${aba}.`);
  }

  const celula = `${aba}!${letraDaColuna(indice)}${numeroDaLinha}`;
  return chamar(
    `/values/${encodeURIComponent(celula)}?valueInputOption=USER_ENTERED`,
    { method: 'PUT', body: JSON.stringify({ values: [[valor]] }) }
  );
}
