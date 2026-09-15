'use server';

import { revalidatePath } from 'next/cache';
import {
  cadastrarColaborador,
  mudarChecklist,
  mudarStatusDoAtestado,
  mudarStatusDoColaborador,
  registrarAtestado,
  registrarMovimentacao,
  registrarOcorrencia,
} from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { cpfValido } from '@/lib/formato';

function ler(dados, campo) {
  return String(dados.get(campo) ?? '').trim();
}

function mensagemDeFalha(erro) {
  if (erro instanceof ErroDePlanilha) return erro.message;
  console.error(erro);
  return 'O registro não foi gravado na planilha. Tente de novo em alguns segundos.';
}

/* ----------------------------------------------------------- colaboradores */

export async function salvarColaborador(_estado, dados) {
  const pessoa = {
    nome: ler(dados, 'nome'),
    cpf: ler(dados, 'cpf'),
    departamento: ler(dados, 'departamento'),
    cargo: ler(dados, 'cargo'),
    gestor: ler(dados, 'gestor'),
    admissao: ler(dados, 'admissao'),
    status: ler(dados, 'status') || 'Ativo',
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
