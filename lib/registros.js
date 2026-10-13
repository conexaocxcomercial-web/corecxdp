import { cache } from 'react';
import { ABAS, ErroDePlanilha, anexarLinha, atualizarCampo, lerAba } from '@/lib/planilha';
import { COLUNA_CLIENTE, clienteAtual, exigirColunaCliente, semRecorte } from '@/lib/contexto';
import { alcanceAtual, escopoAtual } from '@/lib/dados/alcance';
import { lerEstrutura } from '@/lib/dados/estrutura';
import { filtrarPorCnpj, filtrarPorEscopo } from '@/lib/dados/regras';
import { pode } from '@/lib/permissoes';
import { diasAtras, mascararCPF, paraData, paraISO } from '@/lib/formato';
import { AvisoAoUsuario, mensagemParaTela } from '@/lib/avisos';

export { ABAS, AvisoAoUsuario, mensagemParaTela };

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

const COLUNA_CNPJ = 'CNPJ';

/**
 * Lê a aba e devolve só o que pertence ao cliente do alcance, inteiro
 * (todos os CNPJs). É o que a gravação usa: códigos e matrículas seguem
 * uma sequência por cliente, não por CNPJ.
 */
const lerDoCliente = cache(async (aba) => {
  const [{ cabecalho, registros }, cliente] = await Promise.all([lerAba(aba), clienteAtual()]);

  exigirColunaCliente(cabecalho, aba, cliente);

  return {
    cabecalho,
    cliente,
    registros: filtrarPorEscopo(registros, { cliente }, COLUNA_CLIENTE),
  };
});

/**
 * O que as telas leem: o cliente do alcance e, quando o alcance é um CNPJ,
 * só as pessoas dele e os eventos delas (lib/dados/regras.js).
 */
const lerEscopo = cache(async (aba) => {
  const [lido, escopo] = await Promise.all([lerDoCliente(aba), escopoAtual()]);
  if (!escopo?.cnpj) return lido;

  const pessoas = aba === ABAS.colaboradores ? lido : await lerDoCliente(ABAS.colaboradores);
  const recorte = filtrarPorCnpj(pessoas.registros, lido.registros, escopo, COLUNA_CNPJ);
  return { ...lido, registros: aba === ABAS.colaboradores ? recorte.pessoas : recorte.eventos };
});

export async function listarColaboradores() {
  const { registros } = await lerEscopo(ABAS.colaboradores);

  return registros
    .map((linha) => ({
      linha: linha._linha,
      matricula: texto(linha.Matricula),
      cnpj: texto(linha[COLUNA_CNPJ]),
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

/**
 * O CID individual só vai para quem pode vê-lo (Gestão da empresa e
 * Administração, LGPD): para os outros perfis ele nem sai daqui.
 */
export async function listarAtestados() {
  const [{ registros }, alcance] = await Promise.all([lerEscopo(ABAS.atestados), alcanceAtual()]);
  const verCid = pode(alcance?.perfil, 'ver-cid');

  return registros
    .map((linha) => ({
      linha: linha._linha,
      id: texto(linha.ID_Atestado),
      registro: linha.Data_Registro,
      matricula: texto(linha.Matricula),
      inicio: linha.Data_Inicio,
      dias: Number(linha.Dias_Afastamento) || 0,
      cid: verCid ? texto(linha.CID) : '',
      cidRestrito: !verCid,
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

/**
 * O que espera o DP: atestados por validar, checklists de movimentação em
 * aberto e faltas injustificadas dos últimos 30 dias. Usado no painel e
 * no número do Início da barra inferior. As leituras são as mesmas das
 * telas (cache por requisição), então não custam uma segunda ida aos dados.
 */
export async function contarPendencias() {
  const [atestados, movimentacoes, ocorrencias] = await Promise.all([
    listarAtestados(),
    listarMovimentacoes(),
    listarOcorrencias(),
  ]);

  const contagem = {
    atestados: atestados.filter((item) => item.status === 'Pendente').length,
    checklists: movimentacoes.filter((item) => item.checklist !== 'Concluído').length,
    faltas: ocorrencias.filter(
      (item) => item.tipo === 'Falta Injustificada' && diasAtras(item.data) <= 30
    ).length,
  };

  return { ...contagem, total: contagem.atestados + contagem.checklists + contagem.faltas };
}

/**
 * Números por cliente para a carteira do parceiro e a administração: só dos
 * clientes que o alcance alcança (a Administração alcança todos). Lê as
 * linhas sem o recorte de um cliente só, e agrupa pela coluna Cliente.
 */
export async function resumirClientes() {
  const alcance = await alcanceAtual();
  const clientes = alcance?.perfil === 'admin' ? (await lerEstrutura()).clientes : alcance?.opcoes.clientes || [];
  const codigos = new Set(clientes.map((cliente) => cliente.codigo.toLowerCase()));
  const doCliente = (linha) => texto(linha[COLUNA_CLIENTE]).toLowerCase();

  const [pessoas, atestados] = await Promise.all([lerAba(ABAS.colaboradores), lerAba(ABAS.atestados)]);
  const contagem = new Map(clientes.map((cliente) => [cliente.codigo.toLowerCase(), { ativos: 0, pendentes: 0 }]));

  for (const linha of pessoas.registros) {
    const codigo = doCliente(linha);
    if (!codigos.has(codigo) || !texto(linha.Matricula)) continue;
    if ((texto(linha.Status) || 'Ativo') === 'Ativo') contagem.get(codigo).ativos += 1;
  }
  for (const linha of atestados.registros) {
    const codigo = doCliente(linha);
    if (!codigos.has(codigo) || !texto(linha.ID_Atestado)) continue;
    if ((texto(linha.Status_Validacao) || 'Pendente') === 'Pendente') contagem.get(codigo).pendentes += 1;
  }

  return clientes.map((cliente) => ({ ...cliente, ...contagem.get(cliente.codigo.toLowerCase()) }));
}

function ordenarPorData(campo) {
  return (a, b) => {
    const dataA = paraData(a[campo])?.getTime() ?? 0;
    const dataB = paraData(b[campo])?.getTime() ?? 0;
    return dataB - dataA;
  };
}

/* ----------------------------------------------------------------- escrita */

/**
 * Segunda barreira, além das ações de servidor: só quem pode lançar grava
 * e só quem pode aprovar valida. Parceiro e Administração só consultam.
 */
async function exigir(acao) {
  const alcance = await alcanceAtual();
  if (!pode(alcance?.perfil, acao)) {
    throw new AvisoAoUsuario(
      'Este acesso é só de consulta: lançar e aprovar ficam com a Gestão da empresa.'
    );
  }
}

async function gravar(aba, valoresPorColuna) {
  await exigir('lancar');
  const { cabecalho, cliente } = await lerDoCliente(aba);

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
  const { registros } = await lerDoCliente(aba);

  if (!registros.some((linha) => linha._linha === Number(numeroDaLinha))) {
    throw new AvisoAoUsuario('Este registro não pertence à sua empresa.');
  }
}

export async function cadastrarColaborador(dados) {
  const [{ registros, cabecalho }, alcance] = await Promise.all([lerDoCliente(ABAS.colaboradores), alcanceAtual()]);
  const matricula = proximoCodigo(registros, 'Matricula', 'MAT');

  // CNPJ: o escolhido no cadastro, se for do cliente; senão o do alcance; senão a matriz.
  const cnpjs = alcance?.opcoes.cnpjs || [];
  const escolhido =
    cnpjs.find((item) => item.cnpj === dados.cnpj) ||
    alcance?.cnpj ||
    cnpjs.find((item) => item.tipo === 'matriz') ||
    null;

  await gravar(ABAS.colaboradores, {
    Matricula: matricula,
    Nome_Completo: dados.nome,
    CPF: mascararCPF(dados.cpf),
    Departamento: dados.departamento,
    Cargo: dados.cargo,
    Gestor_Imediato: dados.gestor,
    Data_Admissao: paraISO(dados.admissao),
    Status: dados.status,
    ...(cabecalho.includes(COLUNA_CNPJ) ? { [COLUNA_CNPJ]: escolhido?.cnpj || '' } : {}),
  });

  return matricula;
}

export async function registrarOcorrencia(dados) {
  const { registros } = await lerDoCliente(ABAS.ocorrencias);

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
  const { registros } = await lerDoCliente(ABAS.atestados);

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
  const { registros } = await lerDoCliente(ABAS.movimentacoes);

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
  await exigir('lancar');
  await exigirLinhaDoCliente(ABAS.colaboradores, linha);
  await atualizarCampo(ABAS.colaboradores, linha, 'Status', status);
}

export async function mudarStatusDoAtestado(linha, status) {
  await exigir('aprovar');
  await exigirLinhaDoCliente(ABAS.atestados, linha);
  await atualizarCampo(ABAS.atestados, linha, 'Status_Validacao', status);
}

export async function mudarChecklist(linha, status) {
  await exigir('lancar');
  await exigirLinhaDoCliente(ABAS.movimentacoes, linha);
  await atualizarCampo(ABAS.movimentacoes, linha, 'Status_Checklist', status);
}
