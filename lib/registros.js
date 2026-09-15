import { cache } from 'react';
import { ABAS, ErroDePlanilha, anexarLinha, atualizarCampo, lerAba } from '@/lib/planilha';
import {
  COLUNA_CLIENTE,
  clienteAtual,
  exigirColunaCliente,
  mesmoCliente,
  semRecorte,
} from '@/lib/contexto';
import { mascararCPF, paraData, paraISO } from '@/lib/formato';

export { ABAS, ErroDePlanilha };

export const OPCOES = {
  departamentos: [
    'Tecnologia',
    'Recursos Humanos',
    'Operações',
    'Comercial',
    'Financeiro',
    'Marketing',
    'Jurídico',
  ],
  statusColaborador: ['Ativo', 'Afastado', 'Férias', 'Inativo'],
  tiposDeOcorrencia: [
    'Falta Injustificada',
    'Falta Justificada',
    'Atraso',
    'Saída Antecipada',
    'Advertência',
    'Suspensão',
  ],
  justificada: ['Sim', 'Não'],
  statusAtestado: ['Pendente', 'Aprovado', 'Rejeitado'],
  tiposDeMovimentacao: [
    'Promoção',
    'Alteração Salarial',
    'Transferência',
    'Mudança de Cargo',
    'Afastamento',
    'Retorno de Afastamento',
    'Desligamento',
  ],
  statusChecklist: ['Pendente', 'Em andamento', 'Concluído'],
};

/* ---------------------------------------------------------------- leitura */

function texto(valor) {
  return String(valor ?? '').trim();
}

/** Lê a aba e devolve só o que pertence à empresa desta instalação. */
const lerEscopo = cache(async (aba) => {
  const cliente = clienteAtual();
  const { cabecalho, registros } = await lerAba(aba);

  exigirColunaCliente(cabecalho, aba, cliente);

  return {
    cabecalho,
    cliente,
    registros: registros.filter((linha) => mesmoCliente(linha[COLUNA_CLIENTE], cliente)),
  };
});

export async function listarColaboradores() {
  const { registros } = await lerEscopo(ABAS.colaboradores);

  return registros
    .map((linha) => ({
      linha: linha._linha,
      matricula: texto(linha.Matricula),
      nome: texto(linha.Nome_Completo),
      cpf: mascararCPF(linha.CPF),
      departamento: texto(linha.Departamento),
      cargo: texto(linha.Cargo),
      gestor: texto(linha.Gestor_Imediato),
      admissao: linha.Data_Admissao,
      status: texto(linha.Status) || 'Ativo',
    }))
    .filter((pessoa) => pessoa.matricula)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function buscarColaborador(matricula) {
  const pessoas = await listarColaboradores();
  return pessoas.find((pessoa) => pessoa.matricula === matricula) || null;
}

export async function listarOcorrencias() {
  const { registros } = await lerEscopo(ABAS.ocorrencias);

  return registros
    .map((linha) => ({
      linha: linha._linha,
      id: texto(linha.ID_Ocorrencia),
      registro: linha.Data_Registro,
      matricula: texto(linha.Matricula),
      data: linha.Data_Falta,
      tipo: texto(linha.Tipo_Ocorrencia),
      justificada: texto(linha.Justificada) || 'Não',
      motivo: texto(linha.Motivo),
    }))
    .filter((item) => item.id)
    .sort(ordenarPorData('data'));
}

export async function listarAtestados() {
  const { registros } = await lerEscopo(ABAS.atestados);

  return registros
    .map((linha) => ({
      linha: linha._linha,
      id: texto(linha.ID_Atestado),
      registro: linha.Data_Registro,
      matricula: texto(linha.Matricula),
      inicio: linha.Data_Inicio,
      dias: Number(linha.Dias_Afastamento) || 0,
      cid: texto(linha.CID),
      anexo: texto(linha.Anexo_URL),
      status: texto(linha.Status_Validacao) || 'Pendente',
    }))
    .filter((item) => item.id)
    .sort(ordenarPorData('inicio'));
}

export async function listarMovimentacoes() {
  const { registros } = await lerEscopo(ABAS.movimentacoes);

  return registros
    .map((linha) => ({
      linha: linha._linha,
      id: texto(linha.ID_Movimentacao),
      registro: linha.Data_Registro,
      matricula: texto(linha.Matricula),
      tipo: texto(linha.Tipo_Movimentacao),
      efetiva: linha.Data_Efetiva,
      motivo: texto(linha.Motivo),
      checklist: texto(linha.Status_Checklist) || 'Pendente',
    }))
    .filter((item) => item.id)
    .sort(ordenarPorData('efetiva'));
}

function ordenarPorData(campo) {
  return (a, b) => {
    const dataA = paraData(a[campo])?.getTime() ?? 0;
    const dataB = paraData(b[campo])?.getTime() ?? 0;
    return dataB - dataA;
  };
}

/* ----------------------------------------------------------------- escrita */

async function gravar(aba, valoresPorColuna) {
  const { cabecalho, cliente } = await lerEscopo(aba);

  if (cabecalho.length === 0) {
    throw new ErroDePlanilha(`A aba ${aba} está sem cabeçalho na primeira linha.`);
  }

  const completo = {
    ...valoresPorColuna,
    [COLUNA_CLIENTE]: semRecorte(cliente) ? '' : cliente,
  };
  const linha = cabecalho.map((coluna) => completo[coluna] ?? '');
  await anexarLinha(aba, linha);
}

/** A sequência é por empresa: cada cliente tem o próprio MAT001. */
function proximoCodigo(registros, campo, prefixo) {
  const maior = registros.reduce((maximo, item) => {
    const encontrado = String(item[campo] ?? '').match(/(\d+)\s*$/);
    return encontrado ? Math.max(maximo, Number(encontrado[1])) : maximo;
  }, 0);

  return `${prefixo}${String(maior + 1).padStart(3, '0')}`;
}

/** Confere que a linha a alterar é da empresa de quem está logado. */
async function exigirLinhaDoCliente(aba, numeroDaLinha) {
  const { registros } = await lerEscopo(aba);

  if (!registros.some((linha) => linha._linha === Number(numeroDaLinha))) {
    throw new ErroDePlanilha('Este registro não pertence à sua empresa.');
  }
}

export async function cadastrarColaborador(dados) {
  const { registros } = await lerEscopo(ABAS.colaboradores);
  const matricula = proximoCodigo(registros, 'Matricula', 'MAT');

  await gravar(ABAS.colaboradores, {
    Matricula: matricula,
    Nome_Completo: dados.nome,
    CPF: mascararCPF(dados.cpf),
    Departamento: dados.departamento,
    Cargo: dados.cargo,
    Gestor_Imediato: dados.gestor,
    Data_Admissao: paraISO(dados.admissao),
    Status: dados.status,
  });

  return matricula;
}

export async function registrarOcorrencia(dados) {
  const { registros } = await lerEscopo(ABAS.ocorrencias);

  await gravar(ABAS.ocorrencias, {
    ID_Ocorrencia: proximoCodigo(registros, 'ID_Ocorrencia', 'OCO'),
    Data_Registro: paraISO(new Date()),
    Matricula: dados.matricula,
    Data_Falta: paraISO(dados.data),
    Tipo_Ocorrencia: dados.tipo,
    Justificada: dados.justificada,
    Motivo: dados.motivo,
  });
}

export async function registrarAtestado(dados) {
  const { registros } = await lerEscopo(ABAS.atestados);

  await gravar(ABAS.atestados, {
    ID_Atestado: proximoCodigo(registros, 'ID_Atestado', 'ATE'),
    Data_Registro: paraISO(new Date()),
    Matricula: dados.matricula,
    Data_Inicio: paraISO(dados.inicio),
    Dias_Afastamento: Number(dados.dias) || 0,
    CID: dados.cid,
    Anexo_URL: dados.anexo,
    Status_Validacao: dados.status || 'Pendente',
  });
}

export async function registrarMovimentacao(dados) {
  const { registros } = await lerEscopo(ABAS.movimentacoes);

  await gravar(ABAS.movimentacoes, {
    ID_Movimentacao: proximoCodigo(registros, 'ID_Movimentacao', 'MOV'),
    Data_Registro: paraISO(new Date()),
    Matricula: dados.matricula,
    Tipo_Movimentacao: dados.tipo,
    Data_Efetiva: paraISO(dados.efetiva),
    Motivo: dados.motivo,
    Status_Checklist: dados.checklist || 'Pendente',
  });
}

export async function mudarStatusDoColaborador(linha, status) {
  await exigirLinhaDoCliente(ABAS.colaboradores, linha);
  await atualizarCampo(ABAS.colaboradores, linha, 'Status', status);
}

export async function mudarStatusDoAtestado(linha, status) {
  await exigirLinhaDoCliente(ABAS.atestados, linha);
  await atualizarCampo(ABAS.atestados, linha, 'Status_Validacao', status);
}

export async function mudarChecklist(linha, status) {
  await exigirLinhaDoCliente(ABAS.movimentacoes, linha);
  await atualizarCampo(ABAS.movimentacoes, linha, 'Status_Checklist', status);
}
