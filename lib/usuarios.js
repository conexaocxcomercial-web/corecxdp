import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ABAS, ErroDePlanilha, lerAba } from '@/lib/planilha';

export const ABA_USUARIOS = 'Usuarios';

function texto(valor) {
  return String(valor ?? '').trim();
}

function normalizar(email) {
  return texto(email).toLowerCase();
}

/** Gera o valor a colar na coluna Senha. Use: npm run senha "minhaSenha" */
export function gerarHash(senha) {
  const sal = randomBytes(16).toString('hex');
  const chave = scryptSync(String(senha), sal, 32).toString('hex');
  return `scrypt$${sal}$${chave}`;
}

/**
 * Aceita senha em texto puro (protótipo, para você preencher a planilha à
 * mão) ou no formato scrypt$sal$chave, que é o recomendado em produção.
 */
function senhaConfere(informada, guardada) {
  const alvo = texto(guardada);
  if (!alvo) return false;

  if (alvo.startsWith('scrypt$')) {
    const [, sal, chave] = alvo.split('$');
    if (!sal || !chave) return false;
    try {
      const calculada = scryptSync(String(informada), sal, 32);
      const esperada = Buffer.from(chave, 'hex');
      return calculada.length === esperada.length && timingSafeEqual(calculada, esperada);
    } catch {
      return false;
    }
  }

  const a = Buffer.from(String(informada));
  const b = Buffer.from(alvo);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A aba de usuários é lida sem recorte: o cliente só se sabe depois de entrar. */
export async function autenticar(email, senha) {
  let cabecalho;
  let registros;

  try {
    ({ cabecalho, registros } = await lerAba(ABA_USUARIOS));
  } catch (erro) {
    if (erro instanceof ErroDePlanilha && /não foi encontrada|Unable to parse/i.test(erro.message)) {
      throw new ErroDePlanilha(
        'A planilha ainda não tem a aba Usuarios. Crie a aba com as colunas Cliente, Empresa, Nome, Email, Senha, Perfil e Ativo.'
      );
    }
    throw erro;
  }

  const faltando = ['Cliente', 'Nome', 'Email', 'Senha'].filter(
    (coluna) => !cabecalho.includes(coluna)
  );
  if (faltando.length > 0) {
    throw new ErroDePlanilha(
      `A aba Usuarios está sem ${faltando.join(', ')} no cabeçalho. Confira os nomes das colunas.`
    );
  }

  const procurado = normalizar(email);
  const linha = registros.find((registro) => normalizar(registro.Email) === procurado);

  if (!linha) return { erro: 'credenciais' };

  const ativo = texto(linha.Ativo).toLowerCase();
  if (ativo === 'não' || ativo === 'nao' || ativo === 'false' || ativo === '0') {
    return { erro: 'inativo' };
  }

  if (!senhaConfere(senha, linha.Senha)) return { erro: 'credenciais' };

  if (!texto(linha.Cliente)) return { erro: 'sem-cliente' };

  return {
    usuario: {
      nome: texto(linha.Nome) || texto(linha.Email),
      email: normalizar(linha.Email),
      cliente: texto(linha.Cliente),
      empresa: texto(linha.Empresa) || texto(linha.Cliente),
      perfil: texto(linha.Perfil) || 'Operador',
    },
  };
}

export { ABAS };
