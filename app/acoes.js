'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { abrirSessao, fecharSessao } from '@/lib/sessao';
import { autenticar } from '@/lib/usuarios';
import { gravarAlcance, limparAlcance } from '@/lib/dados/alcance';
import { emDemonstracao } from '@/lib/dados/estrutura';
import { usuarioDeExemplo } from '@/lib/dados/usuarios';
import { concluirRevisao, conferir, decidir, desfazer } from '@/lib/dados/pendencias';
import {
  informarCustos,
  lancarAdmissao,
  lancarFerias,
  periodosDeFerias,
  lancarAfastamento,
  lancarDesligamento,
  lancarMovimentacao,
  lancarOcorrencia,
  opcoesDoLancar,
  registrarRetorno,
  validarAfastamento,
} from '@/lib/dados/lancamentos';
import { encerrarAdesao, incluirNoBeneficio, salvarBeneficio } from '@/lib/dados/beneficios';
import { inicioDoPerfil } from '@/lib/navegacao';
import { PERFIS } from '@/lib/permissoes';
import { listarColaboradores, mensagemParaTela } from '@/lib/registros';
import { paraBusca } from '@/lib/formato';

function ler(dados, campo) {
  return String(dados.get(campo) ?? '').trim();
}

function mensagemDeFalha(erro) {
  return mensagemParaTela(erro, 'O registro não foi gravado. Tente de novo em alguns segundos.');
}

/* ------------------------------------------------------------------ acesso */

const RECADOS = {
  credenciais: 'E-mail ou senha não conferem. Confira os dados e tente de novo.',
  inativo: 'Este acesso está inativo. Fale com quem administra a plataforma.',
  'sem-cliente': 'Este acesso ainda não está ligado a nenhuma empresa. Fale com quem administra a plataforma.',
};

/**
 * Destino depois do login, só dentro deste site. "//outro.com" e
 * "/\outro.com" começam com barra, mas o navegador lê como outro
 * domínio: por isso a conferência é pela origem, não pelo começo.
 */
function destinoSeguro(destino, padrao) {
  const base = 'http://core.cx';
  try {
    const url = new URL(destino, base);
    if (!destino.startsWith('/') || url.origin !== base || url.pathname === '/entrar') {
      return padrao;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return padrao;
  }
}

/** Fora da demonstração todo login é Gestão (lib/dados/alcance.js). */
function inicioDe(perfil) {
  return inicioDoPerfil(perfil, { demonstracao: emDemonstracao() });
}

export async function entrar(_estado, dados) {
  const email = ler(dados, 'email');
  const senha = ler(dados, 'senha');
  const destino = ler(dados, 'destino');
  const manterConectado = dados.get('manter') === 'sim';

  // O e-mail e a caixa voltam para a tela: o React limpa o formulário
  // depois do envio, e quem errou a senha não deve redigitar o e-mail.
  const devolver = (erro) => ({ erro, email, manterConectado });

  if (!email || !senha) {
    return devolver('Preencha e-mail e senha para entrar.');
  }

  let resultado;
  try {
    resultado = await autenticar(email, senha);
  } catch (erro) {
    return devolver(
      mensagemParaTela(erro, 'Não foi possível conferir o acesso agora. Tente de novo em alguns segundos.'),
    );
  }

  if (resultado.erro) {
    return devolver(RECADOS[resultado.erro] || RECADOS.credenciais);
  }

  await abrirSessao(resultado.usuario, { manterConectado });
  await limparAlcance();
  const inicio = inicioDe(resultado.usuario.perfil);
  redirect(destino ? destinoSeguro(destino, inicio) : inicio);
}

export async function sair() {
  await fecharSessao();
  await limparAlcance();
  redirect('/entrar');
}

/* ----------------------------------------------------------------- alcance */

/**
 * Troca o alcance (parceiro, cliente, CNPJ). O pedido é conferido no
 * servidor: o que o perfil não alcança é ignorado.
 */
export async function mudarAlcance(pedido) {
  const alcance = await gravarAlcance({
    parceiro: pedido?.parceiro || null,
    cliente: pedido?.cliente || null,
    cnpj: pedido?.cnpj || null,
  });
  revalidatePath('/', 'layout');
  return { chave: alcance?.chave || 'tudo' };
}

/** "Ver como…": só na demonstração, entra como o usuário de exemplo do perfil. */
export async function verComo(dados) {
  const perfil = ler(dados, 'perfil');
  if (!emDemonstracao() || !PERFIS[perfil]) return;

  const usuario = await usuarioDeExemplo(perfil);
  if (!usuario) return;

  await abrirSessao({
    nome: usuario.nome,
    email: usuario.email,
    cliente: usuario.perfil === 'parceiro' ? '' : usuario.cliente,
    parceiro: usuario.parceiro,
    empresa: usuario.empresa,
    perfil: usuario.perfil,
  });
  await limparAlcance();
  redirect(inicioDoPerfil(usuario.perfil));
}

/* ----------------------------------------------------------- colaboradores */

/**
 * Busca de pessoa da barra do topo: nome ou matrícula, só da empresa da
 * sessão (o recorte vem de lib/registros). Devolve no máximo 8 pessoas,
 * primeiro quem começa com o termo, sem CPF nem salário.
 */
export async function buscarPessoas(termo) {
  const busca = paraBusca(termo);
  if (busca.length < 2) return { pessoas: [] };

  try {
    const pessoas = await listarColaboradores();
    const pontuadas = pessoas
      .map((pessoa) => {
        const nome = paraBusca(pessoa.nome);
        const matricula = paraBusca(pessoa.matricula);
        let pontos = 0;
        if (matricula === busca) pontos = 4;
        else if (nome.startsWith(busca)) pontos = 3;
        else if (nome.split(/\s+/).some((parte) => parte.startsWith(busca))) pontos = 2;
        else if (nome.includes(busca) || matricula.includes(busca)) pontos = 1;
        return { pessoa, pontos };
      })
      .filter((item) => item.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos || a.pessoa.nome.localeCompare(b.pessoa.nome, 'pt-BR'))
      .slice(0, 8);

    return {
      pessoas: pontuadas.map(({ pessoa }) => ({
        matricula: pessoa.matricula,
        nome: pessoa.nome,
        cargo: pessoa.cargo,
        departamento: pessoa.departamento,
        status: pessoa.status,
      })),
    };
  } catch (erro) {
    return { pessoas: [], erro: mensagemParaTela(erro, 'A busca não respondeu agora. Tente de novo.') };
  }
}

/* -------------------------------------------------------------- pendências */

/*
 * Decisões de Pendências e do Início (só na demonstração). Cada uma muda os
 * dados de uma vez: Início, Pendências, a barra inferior e as telas de
 * Atestados e Movimentações passam a mostrar o novo estado.
 */

function aposDecidir() {
  revalidatePath('/', 'layout');
}

function falhaDaDecisao(erro) {
  return { erro: mensagemParaTela(erro, 'A decisão não foi registrada. Tente de novo em alguns segundos.') };
}

export async function decidirPendencia({ tipo, id, acao } = {}) {
  try {
    await decidir(String(tipo), String(id), String(acao));
    aposDecidir();
    return { ok: true };
  } catch (erro) {
    return falhaDaDecisao(erro);
  }
}

export async function desfazerPendencia({ tipo, id } = {}) {
  try {
    await desfazer(String(tipo), String(id));
    aposDecidir();
    return { ok: true };
  } catch (erro) {
    return falhaDaDecisao(erro);
  }
}

export async function conferirNaRevisao({ id, conferido } = {}) {
  try {
    await conferir(String(id), Boolean(conferido));
    aposDecidir();
    return { ok: true };
  } catch (erro) {
    return falhaDaDecisao(erro);
  }
}

export async function concluirRevisaoDaImplantacao() {
  try {
    await concluirRevisao();
    aposDecidir();
    return { ok: true };
  } catch (erro) {
    return falhaDaDecisao(erro);
  }
}

/* ------------------------------------------------------------------ lançar */

/*
 * O Lançar em três passos (componentes/Lancar.jsx) envia o formulário do
 * terceiro passo para cá. `lancamento` diz o que foi lançado; a resposta
 * leva a pessoa e o que vale avisar (INSS, data em que passa a valer).
 */

function revalidarTudo() {
  revalidatePath('/', 'layout');
}

const LANCAMENTOS = {
  afastamento: (dados) =>
    lancarAfastamento({
      matricula: ler(dados, 'matricula'),
      tipo: ler(dados, 'tipo'),
      inicio: ler(dados, 'inicio'),
      dias: ler(dados, 'dias'),
      comAtestado: dados.get('comAtestado') === 'sim',
      cid: ler(dados, 'cid'),
      cidNaoInformado: dados.get('cidNaoInformado') === 'sim',
      anexo: ler(dados, 'anexo'),
      validacao: ler(dados, 'validacao'),
    }),
  ocorrencia: (dados) =>
    lancarOcorrencia({
      matricula: ler(dados, 'matricula'),
      tipo: ler(dados, 'tipo'),
      data: ler(dados, 'data'),
      justificada: ler(dados, 'justificada'),
      motivo: ler(dados, 'motivo'),
    }),
  movimentacao: (dados) =>
    lancarMovimentacao({
      matricula: ler(dados, 'matricula'),
      tipo: ler(dados, 'tipo'),
      efetiva: ler(dados, 'efetiva'),
      motivo: ler(dados, 'motivo'),
      novoSalario: ler(dados, 'novoSalario'),
      novoCargo: ler(dados, 'novoCargo'),
      novoDepartamento: ler(dados, 'novoDepartamento'),
      novaUnidade: ler(dados, 'novaUnidade'),
    }),
  desligamento: (dados) =>
    lancarDesligamento({
      matricula: ler(dados, 'matricula'),
      tipo: ler(dados, 'tipo'),
      data: ler(dados, 'data'),
      motivo: ler(dados, 'motivo'),
      ...lerCustos(dados),
    }),
  ferias: (dados) =>
    lancarFerias({
      matricula: ler(dados, 'matricula'),
      periodo: ler(dados, 'periodo'),
      inicio: ler(dados, 'inicio'),
      dias: ler(dados, 'dias'),
      aprovadas: ler(dados, 'aprovacao') !== 'esperar',
    }),
  admissao: (dados) =>
    lancarAdmissao({
      nome: ler(dados, 'nome'),
      cpf: ler(dados, 'cpf'),
      nascimento: ler(dados, 'nascimento'),
      unidade: ler(dados, 'unidade'),
      departamento: ler(dados, 'departamento'),
      cargo: ler(dados, 'cargo'),
      contrato: ler(dados, 'contrato'),
      admissao: ler(dados, 'admissao'),
      salario: ler(dados, 'salario'),
      jornada: ler(dados, 'jornada'),
      gestor: ler(dados, 'gestor'),
      ...lerCustos(dados),
    }),
};

/** Os campos custo_* do formulário (custos informados, não calculados). */
function lerCustos(dados) {
  const custos = {};
  for (const [chave, valor] of dados.entries()) if (chave.startsWith('custo_')) custos[chave] = String(valor ?? '').trim();
  return custos;
}

export async function lancar(_estado, dados) {
  const lancamento = ler(dados, 'lancamento');
  const executar = LANCAMENTOS[lancamento];
  if (!executar) return { erro: 'Escolha o que lançar.' };
  try {
    const resultado = await executar(dados);
    revalidarTudo();
    return { ok: true, lancamento, ...resultado, quando: Date.now() };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function registrarRetornoDoAfastamento({ id, data } = {}) {
  try {
    await registrarRetorno(String(id), { data: String(data || '') });
    revalidarTudo();
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function validarAfastamentoNaLinha({ id, acao } = {}) {
  try {
    await validarAfastamento(String(id), acao === 'aprovar' ? 'aprovar' : 'rejeitar');
    revalidarTudo();
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

/** Custos da admissão ou do desligamento, informados depois do registro (Admissões, Desligamentos e ficha). */
export async function informarCustosDaPessoa(_estado, dados) {
  try {
    const resultado = await informarCustos({ matricula: ler(dados, 'matricula'), momento: ler(dados, 'momento'), ...lerCustos(dados) });
    revalidarTudo();
    return { ok: true, ...resultado, quando: Date.now() };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function periodosParaFerias(matricula) {
  try {
    return await periodosDeFerias(String(matricula || ''));
  } catch (erro) {
    return { periodos: [], aviso: mensagemParaTela(erro, 'Não foi possível ler os períodos de férias agora.') };
  }
}

export async function opcoesParaLancar() {
  try {
    return await opcoesDoLancar();
  } catch {
    return { departamentos: [], cnpjs: [], gestores: [], unidadeAtual: null };
  }
}


/* ------------------------------------------------------------- benefícios */

export async function salvarBeneficioDaEmpresa(_estado, dados) {
  try {
    const resultado = await salvarBeneficio(ler(dados, 'id') || null, {
      tipo: ler(dados, 'tipo'),
      nome: ler(dados, 'nome'),
      valor: ler(dados, 'valor'),
      desconto: ler(dados, 'desconto'),
    });
    revalidarTudo();
    return { ok: true, ...resultado, quando: Date.now() };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function incluirPessoaNoBeneficio({ beneficio, matricula, desde } = {}) {
  try {
    await incluirNoBeneficio(String(beneficio || ''), String(matricula || ''), { desde: String(desde || '') });
    revalidarTudo();
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function encerrarAdesaoDoBeneficio({ adesao, ate } = {}) {
  try {
    await encerrarAdesao(String(adesao || ''), { ate: String(ate || '') });
    revalidarTudo();
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}
