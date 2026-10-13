import * as demo from '@/lib/demo/fonte';
import { lerRecorte } from '@/lib/dados/recorte';
import { alcanceAtual } from '@/lib/dados/alcance';
import { lerBase } from '@/lib/dados/pessoas';
import { decidir } from '@/lib/dados/pendencias';
import { AvisoAoUsuario } from '@/lib/avisos';
import { pode } from '@/lib/permissoes';
import * as registros from '@/lib/registros';
import {
  ErroDeLancamento,
  montarAdmissao,
  montarAfastamento,
  montarCustos,
  montarDesligamento,
  montarMovimentacao,
  montarOcorrencia,
  montarRetorno,
} from '@/lib/lancamentos';
import { experienciaDe } from '@/lib/pessoas';
import { ErroDeFerias, montarFerias, periodosDaPessoa } from '@/lib/ferias';
import { listarPrazos, prazoDaRescisao, recortar } from '@/lib/prazos';
import { REGRAS_DE_PRAZO as R } from '@/lib/regrasDePrazo';
import { diaDe, isoDe } from '@/lib/calendario';
import { dataCurta, emReais, emReaisExato, paraISO } from '@/lib/formato';

/**
 * Repositório do Lançar e das telas de Atestados e afastamentos, Ocorrências,
 * Movimentações, Admissões e Desligamentos (fases 8 e 9 do redesenho). As
 * regras ficam em lib/lancamentos.js; aqui ficam a permissão, o recorte do
 * alcance e a autoria.
 *
 * Na demonstração, grava nos dados completos (lib/demo). Fora dela, usa a
 * planilha no que ela suporta: atestado por doença, ocorrência e movimentação
 * (o que muda vai no motivo); o resto pede o banco novo.
 */

const SO_NA_DEMONSTRACAO = 'Este tipo de registro ainda não está disponível nesta conta.';

async function quemLanca(acao = 'lancar') {
  const alcance = await alcanceAtual();
  if (!pode(alcance?.perfil, acao)) {
    throw new AvisoAoUsuario(`Este acesso é só de consulta: ${acao === 'aprovar' ? 'aprovar' : 'lançar'} fica com a Gestão da empresa.`);
  }
  const lido = await lerRecorte();
  return { alcance, recorte: lido?.recorte || null, autor: alcance.sessao.nome || 'Gestão da empresa' };
}

function comAviso(funcao) {
  try {
    return funcao();
  } catch (erro) {
    if (erro instanceof ErroDeLancamento || erro instanceof ErroDeFerias) throw new AvisoAoUsuario(erro.message);
    throw erro;
  }
}

function pessoaDoRecorte(recorte, matricula) {
  const pessoa = recorte.pessoas.find((item) => item.matricula === String(matricula || '').trim());
  if (!pessoa) throw new AvisoAoUsuario('Escolha uma pessoa do seu alcance.');
  return pessoa;
}

/** Fora da demonstração: a pessoa na planilha, no formato que as regras pedem. */
async function pessoaDaPlanilha(matricula) {
  const pessoa = await registros.buscarColaborador(String(matricula || '').trim());
  if (!pessoa) throw new AvisoAoUsuario('Escolha uma pessoa do seu alcance.');
  return { ...pessoa, id: pessoa.matricula, admissao: paraISO(pessoa.admissao), desligamento: null };
}

const resumo = (pessoa) => ({ nome: pessoa.nome, matricula: pessoa.matricula });

/* ---------------------------------------------------------------- gravação */

export async function lancarAfastamento(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    if (entrada.tipo !== 'Doença') throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarAfastamento(entrada, { pessoa }));
    await registros.registrarAtestado({
      matricula: pessoa.matricula,
      inicio: item.inicio,
      dias: item.dias,
      cid: item.atestado.cid === 'não informado' ? 'Não informado' : item.atestado.cid,
      anexo: item.atestado.anexo,
      status: item.validacao,
    });
    return { pessoa: resumo(pessoa), inss: null };
  }

  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() =>
    montarAfastamento(entrada, { pessoa, existentes: recorte.afastamentos.filter((registro) => registro.pessoa_id === pessoa.id) })
  );
  const cliente = recorte.cliente.id;
  demo.inserir('afastamentos', {
    ...item,
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: item.atestado ? demo.proximoCodigo('afastamentos', 'ATE', cliente) : null,
    validado_por: item.validacao === 'Aprovado' ? autor : null,
    validado_em: item.validacao === 'Aprovado' ? recorte.hoje : null,
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });

  // Depois de gravar, os prazos dizem se passou dos 15 dias (somando a mesma doença em 60 dias).
  const inss = listarPrazos(recortar(demo.dadosCompletos(), { cliente })).find(
    (prazo) => prazo.regra === 'inss' && prazo.pessoa?.matricula === pessoa.matricula
  );
  return { pessoa: resumo(pessoa), inss: inss ? { data: dataCurta(inss.data), detalhe: inss.detalhe } : null };
}

export async function registrarRetorno(id, entrada) {
  const { recorte } = await quemLanca();
  if (!recorte) throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
  const afastamento = recorte.afastamentos.find((item) => item.id === id);
  if (!afastamento) throw new AvisoAoUsuario('Este afastamento não está mais no seu alcance. Recarregue a página.');
  const campos = comAviso(() => montarRetorno(afastamento, entrada, { hoje: recorte.hoje }));
  demo.alterar('afastamentos', id, campos);
}

export async function lancarOcorrencia(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarOcorrencia(entrada, { pessoa, hoje: paraISO(new Date()) }));
    await registros.registrarOcorrencia({ matricula: pessoa.matricula, ...item });
    return { pessoa: resumo(pessoa) };
  }
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() => montarOcorrencia(entrada, { pessoa, hoje: recorte.hoje }));
  const cliente = recorte.cliente.id;
  demo.inserir('ocorrencias', {
    ...item,
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: demo.proximoCodigo('ocorrencias', 'OCO', cliente),
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  return { pessoa: resumo(pessoa) };
}

function resumoDoNovo(novo, cnpjs) {
  if (!novo) return '';
  return [
    novo.salario ? `novo salário de ${emReais(novo.salario)}` : null,
    novo.cargo ? `novo cargo: ${novo.cargo}` : null,
    novo.departamento ? `novo departamento: ${novo.departamento}` : null,
    novo.cnpj_id ? `nova unidade: ${cnpjs.find((item) => item.id === novo.cnpj_id)?.nome || novo.cnpj_id}` : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export async function lancarMovimentacao(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarMovimentacao({ ...entrada, novaUnidade: '' }, { pessoa }));
    const muda = resumoDoNovo(item.novo, []);
    await registros.registrarMovimentacao({
      matricula: pessoa.matricula,
      tipo: item.tipo,
      efetiva: item.efetiva,
      motivo: muda ? `${item.motivo} (${muda})` : item.motivo,
      checklist: 'Concluído',
    });
    return { pessoa: resumo(pessoa) };
  }
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() => montarMovimentacao(entrada, { pessoa, cnpjs: recorte.cnpjs }));
  const cliente = recorte.cliente.id;
  demo.inserir('movimentacoes', {
    ...item,
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: demo.proximoCodigo('movimentacoes', 'MOV', cliente),
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  return { pessoa: resumo(pessoa), passaAValer: item.efetiva > recorte.hoje ? dataCurta(item.efetiva) : null };
}

const prazoParaTela = (ultimoDia) => {
  const prazo = prazoDaRescisao(ultimoDia);
  return { data: dataCurta(prazo.data), nota: prazo.nota };
};

const SEM_CUSTOS_AQUI = 'Os custos informados ainda não ficam guardados nesta conta.';

/** Grava (ou troca) os custos informados de uma pessoa num momento: admissão ou desligamento. */
function gravarCustos(recorte, pessoa, momento, custos, autor) {
  const existente = (recorte.custos || []).find((item) => item.pessoa_id === pessoa.id && item.momento === momento);
  const campos = { itens: custos.itens, total: custos.total, registrado_por: autor, registrado_em: recorte.hoje };
  if (existente) demo.alterar('custos', existente.id, campos);
  else demo.inserir('custos', { cliente_id: recorte.cliente.id, pessoa_id: pessoa.id, momento, ...campos });
}

/** A próxima matrícula do cliente (MAT + número), pelo cliente inteiro, não só pelo CNPJ do alcance. */
function proximaMatricula(pessoasDoCliente) {
  const maior = pessoasDoCliente.reduce((maximo, pessoa) => {
    const numero = String(pessoa.matricula || '').match(/(\d+)\s*$/);
    return numero ? Math.max(maximo, Number(numero[1])) : maximo;
  }, 0);
  return `MAT${String(maior + 1).padStart(3, '0')}`;
}

/**
 * Admissão completa (fase 9): a pessoa entra no quadro com contrato, salário
 * e jornada, e os custos admissionais informados ficam guardados. A
 * confirmação diz o prazo do registro e as datas da experiência.
 */
export async function lancarAdmissao(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoas = (await registros.listarColaboradores()).map((pessoa) => ({
      ...pessoa,
      desligamento: pessoa.status === 'Inativo' ? {} : null,
    }));
    const item = comAviso(() => montarAdmissao({ ...entrada, unidade: '' }, { pessoas, cnpjs: [], hoje: paraISO(new Date()) }));
    const matricula = await registros.cadastrarColaborador({
      nome: item.pessoa.nome,
      cpf: item.pessoa.cpf,
      departamento: item.pessoa.departamento,
      cargo: item.pessoa.cargo,
      gestor: item.pessoa.gestor,
      admissao: item.pessoa.admissao,
      status: 'Ativo',
      cnpj: '',
    });
    return { pessoa: { nome: item.pessoa.nome, matricula }, nota: item.custos ? SEM_CUSTOS_AQUI : null };
  }

  const cliente = recorte.cliente.id;
  const doCliente = demo.dadosCompletos().pessoas.filter((pessoa) => pessoa.cliente_id === cliente);
  const item = comAviso(() => montarAdmissao(entrada, { pessoas: doCliente, cnpjs: recorte.cnpjs, hoje: recorte.hoje }));
  const matricula = proximaMatricula(doCliente);
  const nova = demo.inserir('pessoas', {
    ...item.pessoa,
    cliente_id: cliente,
    matricula,
    situacao: 'Ativo',
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  if (item.custos) gravarCustos({ ...recorte, custos: [] }, nova, 'admissao', item.custos, autor);

  const experiencia = experienciaDe(nova, recorte.hoje);
  const futura = nova.admissao > recorte.hoje;
  return {
    pessoa: { nome: nova.nome, matricula },
    admissao: {
      comeca: futura ? dataCurta(nova.admissao) : null,
      registroAte: futura ? dataCurta(isoDe(diaDe(nova.admissao) - R.registroDeAdmissao.antecedencia)) : null,
      experiencia: experiencia ? { primeiroPeriodo: dataCurta(experiencia.primeiroPeriodo), fim: dataCurta(experiencia.fim) } : null,
      custos: item.custos ? emReaisExato(item.custos.total) : null,
    },
  };
}

/**
 * Desligamento: a data, o tipo e o motivo ficam na pessoa, a movimentação
 * de desligamento entra para concluir em Pendências (rescisão em 10 dias,
 * no dia útil anterior) e os custos demissionais informados ficam guardados.
 */
export async function lancarDesligamento(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) {
    const pessoa = await pessoaDaPlanilha(entrada.matricula);
    const item = comAviso(() => montarDesligamento(entrada, { pessoa, hoje: paraISO(new Date()) }));
    const custos = comAviso(() => montarCustos(entrada, 'desligamento'));
    await registros.registrarMovimentacao({
      matricula: pessoa.matricula,
      tipo: 'Desligamento',
      efetiva: item.data,
      motivo: `${item.tipo}. ${item.motivo}`,
      checklist: 'Pendente',
    });
    return { pessoa: resumo(pessoa), rescisao: prazoParaTela(item.data), nota: custos ? SEM_CUSTOS_AQUI : null };
  }
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const item = comAviso(() => montarDesligamento(entrada, { pessoa, hoje: recorte.hoje }));
  const custos = comAviso(() => montarCustos(entrada, 'desligamento'));
  const cliente = recorte.cliente.id;
  demo.alterar('pessoas', pessoa.id, { desligamento: { data: item.data, tipo: item.tipo, motivo: item.motivo } });
  demo.inserir('movimentacoes', {
    cliente_id: cliente,
    pessoa_id: pessoa.id,
    matricula: pessoa.matricula,
    codigo: demo.proximoCodigo('movimentacoes', 'MOV', cliente),
    tipo: 'Desligamento',
    efetiva: item.data,
    motivo: `${item.tipo}. ${item.motivo}`,
    checklist: 'Pendente',
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  if (custos) gravarCustos(recorte, pessoa, 'desligamento', custos, autor);
  return { pessoa: resumo(pessoa), rescisao: prazoParaTela(item.data), custos: custos ? emReaisExato(custos.total) : null };
}

/**
 * Férias (fase 11): programa um período com dias por tirar. A Gestão é quem
 * aprova, então já entram aprovadas; "esperar aprovação" deixa o pedido em
 * Pendências. Os dias que sobram viram um registro novo do mesmo período.
 */
export async function lancarFerias(entrada) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
  const pessoa = pessoaDoRecorte(recorte, entrada.matricula);
  const dela = (lista) => lista.filter((item) => item.pessoa_id === pessoa.id);
  const item = comAviso(() =>
    montarFerias(entrada, { pessoa, ferias: dela(recorte.ferias), afastamentos: dela(recorte.afastamentos), hoje: recorte.hoje })
  );
  demo.alterar('ferias', item.alvo, {
    ...item.campos,
    aprovado_por: item.campos.situacao === 'programada' ? autor : null,
    registrado_por: autor,
    registrado_em: recorte.hoje,
  });
  if (item.resto) {
    const { id: _sem, ...resto } = item.resto;
    demo.inserir('ferias', { ...resto, cliente_id: recorte.cliente.id });
  }
  return {
    pessoa: resumo(pessoa),
    ferias: {
      de: dataCurta(item.campos.inicio),
      ate: dataCurta(item.fim),
      retorno: dataCurta(item.retorno),
      aviso: dataCurta(item.aviso),
      pagamento: dataCurta(item.pagamento),
      notaDoPagamento: item.notaDoPagamento,
      avisoFora: item.avisoFora,
      emDobro: item.emDobro,
      esperando: item.campos.situacao === 'aguardando aprovação',
      sobram: item.resto ? item.resto.dias : 0,
    },
  };
}

/** Os períodos com dias por tirar de uma pessoa, para o formulário de férias. */
export async function periodosDeFerias(matricula) {
  const { recorte } = await lerBase();
  if (!recorte.completo) return { periodos: [], aviso: SO_NA_DEMONSTRACAO };
  const pessoa = recorte.pessoas.find((item) => item.matricula === String(matricula || '').trim());
  if (!pessoa) return { periodos: [] };
  return {
    periodos: periodosDaPessoa(pessoa, recorte.ferias.filter((item) => item.pessoa_id === pessoa.id))
      .filter((periodo) => periodo.saldo > 0)
      .map((periodo) => ({
        valor: periodo.aquisitivo_inicio,
        saldo: periodo.saldo,
        concessivo_fim: periodo.concessivo_fim,
        vencido: periodo.vencido,
        parcelas: periodo.parcelas.length,
        texto: `${dataCurta(periodo.aquisitivo_inicio)}/${periodo.aquisitivo_inicio.slice(2, 4)} a ${dataCurta(periodo.aquisitivo_fim)}/${periodo.aquisitivo_fim.slice(2, 4)} · ${periodo.saldo} dias${periodo.vencido ? ' · vencido' : ''}`,
      })),
  };
}

/** Custos informados depois do registro (por exemplo, quando a contabilidade fecha a rescisão). */
export async function informarCustos({ matricula, momento, ...entrada }) {
  const { recorte, autor } = await quemLanca();
  if (!recorte) throw new AvisoAoUsuario(SO_NA_DEMONSTRACAO);
  if (!['admissao', 'desligamento'].includes(momento)) throw new AvisoAoUsuario('Escolha se os custos são da admissão ou do desligamento.');
  const pessoa = pessoaDoRecorte(recorte, matricula);
  if (momento === 'desligamento' && !pessoa.desligamento) throw new AvisoAoUsuario('Esta pessoa não tem desligamento registrado.');
  const custos = comAviso(() => montarCustos(entrada, momento));
  if (!custos) throw new AvisoAoUsuario('Informe ao menos um valor.');
  gravarCustos(recorte, pessoa, momento, custos, autor);
  return { total: emReaisExato(custos.total) };
}

/** Aprovar ou rejeitar o atestado na linha da lista. */
export async function validarAfastamento(id, acao) {
  const { recorte } = await quemLanca('aprovar');
  if (recorte) {
    await decidir('atestado', id, acao);
    return;
  }
  await registros.mudarStatusDoAtestadoPorCodigo(id, acao === 'aprovar' ? 'Aprovado' : 'Rejeitado');
}

/* ----------------------------------------------------------------- leitura */

function comPessoa(recorte) {
  const porId = new Map(recorte.pessoas.map((pessoa) => [pessoa.id, pessoa]));
  return (item) => {
    const pessoa = porId.get(item.pessoa_id);
    return { ...item, pessoa: pessoa ? { nome: pessoa.nome, matricula: pessoa.matricula } : null };
  };
}

/** Atestados e afastamentos do alcance; o CID só sai para quem pode vê-lo (LGPD). */
export async function listarAfastamentos() {
  const { recorte, verCid } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    itens: recorte.afastamentos
      .map(comPessoa(recorte))
      .map((item) => ({
        ...item,
        atestado: item.atestado ? { ...item.atestado, cid: verCid ? item.atestado.cid : null } : null,
        cidRestrito: Boolean(item.atestado) && !verCid,
      }))
      .sort((a, b) => (a.inicio < b.inicio ? 1 : a.inicio > b.inicio ? -1 : 0)),
  };
}

export async function listarOcorrencias() {
  const { recorte } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    itens: recorte.ocorrencias.map(comPessoa(recorte)).sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)),
  };
}

/** Movimentações do contrato: sem desligamento nem afastamento, que têm tela própria. */
export async function listarMovimentacoes() {
  const { recorte } = await lerBase();
  return {
    completo: recorte.completo,
    hoje: recorte.hoje,
    cnpjs: recorte.cnpjs,
    itens: recorte.movimentacoes
      .filter((item) => !['Desligamento', 'Afastamento', 'Retorno de Afastamento'].includes(item.tipo))
      .map(comPessoa(recorte))
      .sort((a, b) => (a.efetiva < b.efetiva ? 1 : a.efetiva > b.efetiva ? -1 : 0)),
  };
}

/**
 * O que os formulários do Lançar precisam: departamentos, unidades e
 * gestores do alcance, e a unidade escolhida no alcance (para a admissão
 * já vir nela).
 */
export async function opcoesDoLancar() {
  const [{ recorte }, lido] = await Promise.all([lerBase(), lerRecorte()]);
  const ordenados = (lista) => [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const ativas = recorte.pessoas.filter((pessoa) => !pessoa.desligamento);
  return {
    departamentos: ordenados(recorte.pessoas.map((pessoa) => pessoa.departamento)),
    cnpjs: recorte.cnpjs.map((item) => ({ id: item.id, nome: item.nome })),
    gestores: ordenados(ativas.map((pessoa) => pessoa.gestor)),
    unidadeAtual: lido?.alcance.cnpj?.id || null,
  };
}
