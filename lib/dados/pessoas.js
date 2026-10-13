import { cache } from 'react';
import { lerRecorte } from '@/lib/dados/recorte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { pode } from '@/lib/permissoes';
import { listarAtestados, listarColaboradores, listarMovimentacoes, listarOcorrencias } from '@/lib/registros';
import {
  cpfProtegido,
  experienciaDe,
  linhaDoTempo,
  numerosDaPessoa,
  situacoes,
  tempoDeCasa,
} from '@/lib/pessoas';
import { listarAprovacoes, listarPrazos } from '@/lib/prazos';
import { passosDoDesligamento } from '@/lib/entradasESaidas';
import { beneficiosEm, encargosDaEmpresa, explicacaoDaEstimativa, salarioEm } from '@/lib/folha';
import { custoEstimado } from '@/lib/calculos/custo';
import { diaDe, isoDe } from '@/lib/calendario';
import { hojeISO, paraISO } from '@/lib/formato';

/**
 * Repositório das pessoas (lista e ficha de colaboradores, fase 6 do
 * redesenho). Na demonstração, lê os dados completos do recorte do alcance.
 * Fora dela, adapta o que a planilha tem (lib/registros) para o mesmo
 * formato: contrato, salário, férias, benefícios e documentos ficam vazios,
 * e as telas dizem que o dado não está cadastrado.
 */

/** O que a planilha tem, no formato dos dados completos (sem demonstração). */
async function recorteDaPlanilha() {
  const [pessoas, ocorrencias, atestados, movimentacoes] = await Promise.all([
    listarColaboradores(),
    listarOcorrencias(),
    listarAtestados(),
    listarMovimentacoes(),
  ]);
  const hoje = hojeISO();
  const saidas = new Map();
  for (const item of movimentacoes) {
    if (item.tipo !== 'Desligamento' || !paraISO(item.efetiva)) continue;
    const atual = saidas.get(item.matricula);
    if (!atual || paraISO(item.efetiva) < atual) saidas.set(item.matricula, paraISO(item.efetiva));
  }
  const fim = (inicio, dias) => isoDe(diaDe(inicio) + Math.max(dias, 1) - 1);

  return {
    hoje,
    completo: false,
    cliente: null,
    cnpjs: [],
    pessoas: pessoas.map((pessoa) => ({
      id: pessoa.matricula,
      matricula: pessoa.matricula,
      cnpj_id: null,
      cnpj_numero: pessoa.cnpj || '',
      nome: pessoa.nome,
      cpf: pessoa.cpf,
      departamento: pessoa.departamento,
      cargo: pessoa.cargo,
      gestor: pessoa.gestor,
      admissao: paraISO(pessoa.admissao),
      contrato: null,
      salario: null,
      jornada: null,
      nascimento: null,
      situacao_registrada: pessoa.status,
      desligamento: saidas.has(pessoa.matricula) ? { data: saidas.get(pessoa.matricula), tipo: null, motivo: null } : null,
      registrado_por: null,
      registrado_em: null,
    })),
    ocorrencias: ocorrencias.map((item) => ({
      id: item.id,
      pessoa_id: item.matricula,
      matricula: item.matricula,
      codigo: item.id,
      data: paraISO(item.data),
      tipo: item.tipo,
      justificada: item.justificada,
      motivo: item.motivo,
      registrado_por: null,
      registrado_em: paraISO(item.registro) || null,
    })),
    afastamentos: atestados
      .filter((item) => paraISO(item.inicio))
      .map((item) => ({
        id: item.id,
        pessoa_id: item.matricula,
        matricula: item.matricula,
        codigo: item.id,
        tipo: 'Doença',
        inicio: paraISO(item.inicio),
        dias: item.dias,
        fim_previsto: fim(paraISO(item.inicio), item.dias),
        retorno: null,
        atestado: { cid: item.cidRestrito ? null : item.cid || 'não informado', anexo: item.anexo },
        validacao: item.status,
        registrado_por: null,
        registrado_em: paraISO(item.registro) || null,
      })),
    movimentacoes: movimentacoes.map((item) => ({
      id: item.id,
      pessoa_id: item.matricula,
      matricula: item.matricula,
      codigo: item.id,
      tipo: item.tipo,
      efetiva: paraISO(item.efetiva),
      motivo: item.motivo,
      checklist: item.checklist,
      registrado_por: null,
      registrado_em: paraISO(item.registro) || null,
    })),
    ferias: [],
    documentos: [],
    adesoes: [],
    custos: [],
    beneficios: [],
  };
}

/** O recorte que as telas de pessoa usam, nos dois modos, e se quem vê pode ver o CID. */
export const lerBase = cache(async () => {
  const [lido, alcance] = await Promise.all([lerRecorte(), alcanceAtual()]);
  const recorte = lido ? { ...lido.recorte, completo: true } : await recorteDaPlanilha();
  return { recorte, verCid: pode(alcance?.perfil, 'ver-cid') };
});

/** Fora da demonstração, Inativo e Férias que só a planilha sabe continuam valendo. */
function situacaoFinal(pessoa, calculada) {
  if (calculada === 'Ativo' && ['Inativo', 'Férias'].includes(pessoa.situacao_registrada)) return pessoa.situacao_registrada;
  return calculada;
}

function nomeDoCnpj(recorte, pessoa) {
  const cnpj = recorte.cnpjs.find((item) => item.id === pessoa.cnpj_id);
  return cnpj ? { nome: cnpj.nome, numero: cnpj.cnpj, tipo: cnpj.tipo } : pessoa.cnpj_numero ? { nome: pessoa.cnpj_numero, numero: pessoa.cnpj_numero } : null;
}

/** A lista de colaboradores, com a situação calculada e o salário (a tela mascara). */
export const listarPessoas = cache(async () => {
  const { recorte } = await lerBase();
  const calculadas = situacoes(recorte, recorte.hoje);
  return {
    completo: recorte.completo,
    cnpjs: recorte.cnpjs.map((item) => ({ id: item.id, nome: item.nome, numero: item.cnpj })),
    pessoas: recorte.pessoas
      .map((pessoa) => ({
        matricula: pessoa.matricula,
        nome: pessoa.nome,
        cpf: pessoa.cpf,
        cargo: pessoa.cargo,
        departamento: pessoa.departamento,
        cnpj: nomeDoCnpj(recorte, pessoa),
        cnpjId: pessoa.cnpj_id,
        contrato: pessoa.contrato,
        admissao: pessoa.admissao,
        desligamento: pessoa.desligamento,
        situacao: situacaoFinal(pessoa, calculadas.get(pessoa.id)),
        tempoDeCasa: pessoa.admissao ? tempoDeCasa(pessoa.admissao, { hoje: recorte.hoje, saida: pessoa.desligamento?.data }) : '—',
        salario: pessoa.salario ?? null,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  };
});

function idadeEm(nascimento, hoje) {
  if (!nascimento) return null;
  const [an, mn, dn] = nascimento.split('-').map(Number);
  const [ah, mh, dh] = hoje.split('-').map(Number);
  return ah - an - (mh < mn || (mh === mn && dh < dn) ? 1 : 0);
}

/** O custo estimado do mês da pessoa (folha gerencial), com a explicação para o selo. */
function custoDoMesDe(recorte, pessoa) {
  const salario = salarioEm(pessoa, recorte.movimentacoes, recorte.hoje);
  if (!salario) return null;
  const encargos = encargosDaEmpresa(recorte.cliente);
  const beneficios = beneficiosEm(pessoa, recorte, recorte.hoje);
  return {
    ...custoEstimado({ salarios: [salario], beneficios: beneficios.map((item) => item.valor) }, encargos.percentual),
    estimativa: explicacaoDaEstimativa(encargos),
  };
}

/**
 * A ficha de uma pessoa: dados, situação, números, alertas (os prazos e as
 * aprovações dela), eventos por aba e a linha do tempo. O CID só sai daqui
 * para quem pode vê-lo (Gestão da empresa e Administração, LGPD).
 */
export async function lerFicha(matricula) {
  const { recorte, verCid } = await lerBase();
  const pessoa = recorte.pessoas.find((item) => item.matricula === matricula);
  if (!pessoa) return null;

  const dela = (lista) => lista.filter((item) => item.pessoa_id === pessoa.id);
  const eventos = {
    ocorrencias: dela(recorte.ocorrencias),
    afastamentos: dela(recorte.afastamentos),
    movimentacoes: dela(recorte.movimentacoes),
    ferias: dela(recorte.ferias),
    documentos: dela(recorte.documentos),
  };
  const soDela = { ...recorte, pessoas: [pessoa], ...eventos, adesoes: dela(recorte.adesoes) };
  const situacao = situacaoFinal(pessoa, situacoes(soDela, recorte.hoje).get(pessoa.id));
  const prazos = recorte.completo ? listarPrazos(soDela).filter((item) => item.pessoa) : [];
  const aprovacoes = recorte.completo ? listarAprovacoes(soDela) : [];
  const beneficioPorId = new Map(recorte.beneficios.map((item) => [item.id, item]));
  const custos = (recorte.custos || []).filter((item) => item.pessoa_id === pessoa.id);
  const custoDe = (momento) => custos.find((item) => item.momento === momento) || null;
  const saida = eventos.movimentacoes.find((item) => item.tipo === 'Desligamento');

  const afastamentos = eventos.afastamentos
    .map((item) => ({
      ...item,
      atestado: item.atestado ? { ...item.atestado, cid: verCid ? item.atestado.cid : null } : null,
      cidRestrito: Boolean(item.atestado) && !verCid,
    }))
    .sort((a, b) => (a.inicio < b.inicio ? 1 : -1));

  return {
    hoje: recorte.hoje,
    completo: recorte.completo,
    verCid,
    pessoa: {
      matricula: pessoa.matricula,
      nome: pessoa.nome,
      cpf: pessoa.cpf,
      cpfProtegido: cpfProtegido(pessoa.cpf),
      cargo: pessoa.cargo,
      departamento: pessoa.departamento,
      gestor: pessoa.gestor,
      cnpj: nomeDoCnpj(recorte, pessoa),
      contrato: pessoa.contrato,
      admissao: pessoa.admissao,
      admissaoFutura: Boolean(pessoa.admissao && pessoa.admissao > recorte.hoje),
      jornada: pessoa.jornada,
      nascimento: pessoa.nascimento,
      idade: idadeEm(pessoa.nascimento, recorte.hoje),
      salario: pessoa.salario ?? null,
      situacao,
      desligamento: pessoa.desligamento,
      experiencia: experienciaDe(pessoa, recorte.hoje),
      registradoPor: pessoa.registrado_por,
    },
    numeros: numerosDaPessoa(pessoa, eventos, recorte.hoje),
    alertas: { aprovacoes, prazos },
    eventos: {
      ocorrencias: [...eventos.ocorrencias].sort((a, b) => (a.data < b.data ? 1 : -1)),
      afastamentos,
      movimentacoes: [...eventos.movimentacoes].sort((a, b) => (a.efetiva < b.efetiva ? 1 : -1)),
      reajustes: eventos.movimentacoes
        .filter((item) => ['Alteração Salarial', 'Promoção', 'Mudança de Cargo'].includes(item.tipo))
        .sort((a, b) => (a.efetiva < b.efetiva ? 1 : -1)),
      ferias: [...eventos.ferias].sort((a, b) => (a.aquisitivo_inicio < b.aquisitivo_inicio ? 1 : -1)),
      documentos: eventos.documentos.map((item) => ({
        ...item,
        prazo: prazos.find((prazo) => prazo.id === `${item.id}-validade`) || null,
      })),
      // Só os em vigor hoje: adesão encerrada sai da ficha (e do custo).
      beneficios: soDela.adesoes
        .filter((adesao) => !adesao.ate || adesao.ate >= recorte.hoje)
        .map((adesao) => ({ ...beneficioPorId.get(adesao.beneficio_id), desde: adesao.desde }))
        .filter((item) => item.nome),
    },
    linha: linhaDoTempo(pessoa, eventos),
    custos: { admissao: custoDe('admissao'), desligamento: custoDe('desligamento') },
    custoDoMes: recorte.completo && !pessoa.desligamento ? custoDoMesDe(recorte, pessoa) : null,
    // Desligamento: o prazo da rescisão e os passos (custos informados, não calculados).
    saida: saida
      ? { id: saida.id, concluido: saida.checklist === 'Concluído', ...passosDoDesligamento(saida, { custo: custoDe('desligamento'), hoje: recorte.hoje }) }
      : null,
  };
}
