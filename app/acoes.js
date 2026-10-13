'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { abrirSessao, fecharSessao } from '@/lib/sessao';
import { autenticar } from '@/lib/usuarios';
import { gravarAlcance, limparAlcance } from '@/lib/dados/alcance';
import { emDemonstracao } from '@/lib/dados/estrutura';
import { usuarioDeExemplo } from '@/lib/dados/usuarios';
import { concluirRevisao, conferir, decidir, desfazer } from '@/lib/dados/pendencias';
import { inicioDoPerfil } from '@/lib/navegacao';
import { PERFIS } from '@/lib/permissoes';
import {
  cadastrarColaborador,
  listarColaboradores,
  mudarChecklist,
  mudarStatusDoAtestado,
  mudarStatusDoColaborador,
  registrarAtestado,
  registrarMovimentacao,
  registrarOcorrencia,
  mensagemParaTela,
} from '@/lib/registros';
import { cpfValido, paraBusca } from '@/lib/formato';

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

export async function salvarColaborador(_estado, dados) {
  const pessoa = {
    nome: ler(dados, 'nome'),
    cpf: ler(dados, 'cpf'),
    departamento: ler(dados, 'departamento'),
    cargo: ler(dados, 'cargo'),
    gestor: ler(dados, 'gestor'),
    admissao: ler(dados, 'admissao'),
    status: ler(dados, 'status') || 'Ativo',
    cnpj: ler(dados, 'cnpj'),
  };

  if (!pessoa.nome || pessoa.nome.split(/\s+/).length < 2) {
    return { erro: 'Informe o nome completo do colaborador.' };
  }
  if (!cpfValido(pessoa.cpf)) {
    return { erro: 'O CPF informado não é válido. Confira os 11 dígitos.' };
  }
  if (!pessoa.cargo) {
    return { erro: 'Informe o cargo do colaborador.' };
  }
  if (!pessoa.admissao) {
    return { erro: 'Informe a data de admissão.' };
  }

  try {
    const matricula = await cadastrarColaborador(pessoa);
    revalidatePath('/colaboradores');
    revalidatePath('/painel');
    revalidatePath('/indicadores');
    return { ok: true, matricula };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function alterarStatusDoColaborador(dados) {
  const linha = Number(ler(dados, 'linha'));
  const status = ler(dados, 'status');
  if (!linha || !status) return;

  await mudarStatusDoColaborador(linha, status);
  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${ler(dados, 'matricula')}`);
  revalidatePath('/painel');
  revalidatePath('/indicadores');
}

/* ------------------------------------------------------------- ocorrências */

export async function salvarOcorrencia(_estado, dados) {
  const ocorrencia = {
    matricula: ler(dados, 'matricula'),
    data: ler(dados, 'data'),
    tipo: ler(dados, 'tipo'),
    justificada: ler(dados, 'justificada'),
    motivo: ler(dados, 'motivo'),
  };

  if (!ocorrencia.matricula) return { erro: 'Escolha de quem é a ocorrência.' };
  if (!ocorrencia.data) return { erro: 'Informe a data da ocorrência.' };
  if (!ocorrencia.motivo) return { erro: 'Descreva o motivo: é o que sustenta o registro depois.' };

  try {
    await registrarOcorrencia(ocorrencia);
    revalidatePath('/ocorrencias');
    revalidatePath('/painel');
    revalidatePath('/indicadores');
    revalidatePath(`/colaboradores/${ocorrencia.matricula}`);
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

/* --------------------------------------------------------------- atestados */

export async function salvarAtestado(_estado, dados) {
  const atestado = {
    matricula: ler(dados, 'matricula'),
    inicio: ler(dados, 'inicio'),
    dias: ler(dados, 'dias'),
    cid: ler(dados, 'cid').toUpperCase(),
    anexo: ler(dados, 'anexo'),
    status: ler(dados, 'status') || 'Pendente',
  };

  if (!atestado.matricula) return { erro: 'Escolha de quem é o atestado.' };
  if (!atestado.inicio) return { erro: 'Informe o primeiro dia de afastamento.' };
  if (!Number(atestado.dias) || Number(atestado.dias) < 1) {
    return { erro: 'Informe quantos dias de afastamento o atestado cobre.' };
  }

  try {
    await registrarAtestado(atestado);
    revalidatePath('/atestados');
    revalidatePath('/painel');
    revalidatePath('/indicadores');
    revalidatePath(`/colaboradores/${atestado.matricula}`);
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function validarAtestado(dados) {
  const linha = Number(ler(dados, 'linha'));
  const status = ler(dados, 'status');
  if (!linha || !status) return;

  await mudarStatusDoAtestado(linha, status);
  revalidatePath('/atestados');
  revalidatePath('/painel');
  revalidatePath('/indicadores');
}

/* ----------------------------------------------------------- movimentações */

export async function salvarMovimentacao(_estado, dados) {
  const movimentacao = {
    matricula: ler(dados, 'matricula'),
    tipo: ler(dados, 'tipo'),
    efetiva: ler(dados, 'efetiva'),
    motivo: ler(dados, 'motivo'),
    checklist: ler(dados, 'checklist') || 'Pendente',
  };

  if (!movimentacao.matricula) return { erro: 'Escolha de quem é a movimentação.' };
  if (!movimentacao.efetiva) return { erro: 'Informe a data em que a mudança passa a valer.' };
  if (!movimentacao.motivo) return { erro: 'Descreva o motivo da movimentação.' };

  try {
    await registrarMovimentacao(movimentacao);
    revalidatePath('/movimentacoes');
    revalidatePath('/painel');
    revalidatePath('/indicadores');
    revalidatePath(`/colaboradores/${movimentacao.matricula}`);
    return { ok: true };
  } catch (erro) {
    return { erro: mensagemDeFalha(erro) };
  }
}

export async function atualizarChecklist(dados) {
  const linha = Number(ler(dados, 'linha'));
  const status = ler(dados, 'status');
  if (!linha || !status) return;

  await mudarChecklist(linha, status);
  revalidatePath('/movimentacoes');
  revalidatePath('/painel');
  revalidatePath('/indicadores');
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
