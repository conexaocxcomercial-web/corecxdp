/**
 * Regras do Lançar (fases 8 e 9 do redesenho): monta e confere cada
 * registro antes de gravar. Afastamento (com tipo, período e, quando o tipo
 * pede, atestado com CID ou "não informado"), retorno, ocorrência,
 * movimentação (com o que muda: salário, cargo, departamento ou unidade),
 * admissão e desligamento, com os custos informados pela empresa (não
 * calculados: cálculos trabalhistas são da contabilidade). Puro: as
 * gravações ficam em lib/dados/lancamentos.js; testado em
 * testes/lancamentos.test.js e testes/entradas.test.js.
 */
import { diaDe, isoDe } from './calendario.js';
import { cpfValido, apenasDigitos, mascararCPF } from './formato.js';
import { REGRAS_DE_PRAZO as R } from './regrasDePrazo.js';

export const TIPOS_DE_AFASTAMENTO = ['Doença', 'Acidente de trabalho', 'Licença-maternidade', 'Licença não remunerada', 'Outros'];

/** Para estes, o atestado é obrigatório; nos demais, opcional. */
export const PEDEM_ATESTADO = ['Doença', 'Acidente de trabalho'];

export const TIPOS_DE_OCORRENCIA = [
  'Falta Injustificada',
  'Falta Justificada',
  'Atraso',
  'Saída Antecipada',
  'Advertência',
  'Suspensão',
];

/** Movimentações: só o que muda o contrato. Desligamento e afastamento têm fluxo próprio. */
export const TIPOS_DE_MOVIMENTACAO = ['Alteração Salarial', 'Promoção', 'Mudança de Cargo', 'Transferência'];

export class ErroDeLancamento extends Error {}

const texto = (valor) => String(valor ?? '').trim();
const dataValida = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`));
const CID = /^[A-Z]\d{2}(\.\d{1,2})?$/;

/** "3.500,00", "3500" ou "3500.5" viram número; vazio vira null. */
export function paraValor(entrada) {
  const limpo = texto(entrada).replace(/[R$\s]/g, '');
  if (!limpo) return null;
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const valor = Number(normal);
  return Number.isFinite(valor) ? Math.round(valor * 100) / 100 : NaN;
}

function exigirData(valor, rotulo) {
  const data = texto(valor);
  if (!dataValida(data)) throw new ErroDeLancamento(`Informe ${rotulo}.`);
  return data;
}

function dentroDoContrato(pessoa, data, rotulo) {
  if (pessoa.admissao && data < pessoa.admissao) {
    throw new ErroDeLancamento(`${rotulo} é antes da admissão (${isoParaBr(pessoa.admissao)}).`);
  }
  if (pessoa.desligamento?.data && data > pessoa.desligamento.data) {
    throw new ErroDeLancamento(`${rotulo} é depois do desligamento (${isoParaBr(pessoa.desligamento.data)}).`);
  }
}

function isoParaBr(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Afastamento. entrada: { tipo, inicio, dias, comAtestado, cid, cidNaoInformado,
 * anexo, validacao }. `existentes` são os afastamentos da pessoa, para não
 * sobrepor dois no mesmo período.
 */
export function montarAfastamento(entrada, { pessoa, existentes = [] }) {
  const tipo = texto(entrada.tipo);
  if (!TIPOS_DE_AFASTAMENTO.includes(tipo)) throw new ErroDeLancamento('Escolha o tipo de afastamento.');
  const inicio = exigirData(entrada.inicio, 'o primeiro dia de afastamento');
  dentroDoContrato(pessoa, inicio, 'O primeiro dia');
  const dias = Number(entrada.dias);
  if (!Number.isInteger(dias) || dias < 1 || dias > 730) throw new ErroDeLancamento('Informe quantos dias de afastamento (de 1 a 730).');
  const fim = isoDe(diaDe(inicio) + dias - 1);

  const sobreposto = existentes.find((item) => {
    if (item.validacao === 'Rejeitado') return false;
    const fimDele = item.retorno ? isoDe(diaDe(item.retorno) - 1) : item.fim_previsto;
    return item.inicio <= fim && inicio <= fimDele;
  });
  if (sobreposto) throw new ErroDeLancamento(`Já há um afastamento nesse período (a partir de ${isoParaBr(sobreposto.inicio)}).`);

  const comAtestado = PEDEM_ATESTADO.includes(tipo) || Boolean(entrada.comAtestado);
  let atestado = null;
  let validacao = null;
  if (comAtestado) {
    const naoInformado = Boolean(entrada.cidNaoInformado);
    const cid = texto(entrada.cid).toUpperCase().replace(/\s/g, '');
    if (!naoInformado && !CID.test(cid)) {
      throw new ErroDeLancamento('Informe o CID do atestado (por exemplo, J11 ou M54.5) ou marque "não informado".');
    }
    atestado = { cid: naoInformado ? 'não informado' : cid, anexo: texto(entrada.anexo) };
    validacao = entrada.validacao === 'Aprovado' ? 'Aprovado' : 'Pendente';
  }

  return {
    tipo,
    inicio,
    dias,
    fim_previsto: fim,
    retorno: null,
    atestado,
    validacao,
    inss: PEDEM_ATESTADO.includes(tipo) && dias > R.inss.diasPagosPelaEmpresa,
  };
}

/** Retorno do afastamento: o primeiro dia de volta ao trabalho, até hoje. */
export function montarRetorno(afastamento, entrada, { hoje }) {
  if (afastamento.retorno) throw new ErroDeLancamento('O retorno deste afastamento já foi registrado.');
  const data = exigirData(entrada.data, 'o dia em que a pessoa voltou');
  if (data <= afastamento.inicio) throw new ErroDeLancamento('O retorno precisa ser depois do primeiro dia de afastamento.');
  if (data > hoje) throw new ErroDeLancamento('O retorno não pode ser num dia que ainda não chegou.');
  if (data > isoDe(diaDe(afastamento.fim_previsto) + 1)) {
    throw new ErroDeLancamento('O retorno é depois do fim previsto: registre um novo afastamento para o período a mais.');
  }
  return { retorno: data };
}

/** Ocorrência. entrada: { tipo, data, justificada, motivo }. */
export function montarOcorrencia(entrada, { pessoa, hoje }) {
  const tipo = texto(entrada.tipo);
  if (!TIPOS_DE_OCORRENCIA.includes(tipo)) throw new ErroDeLancamento('Escolha o tipo de ocorrência.');
  const data = exigirData(entrada.data, 'a data da ocorrência');
  if (data > hoje) throw new ErroDeLancamento('A ocorrência não pode ser num dia que ainda não chegou.');
  dentroDoContrato(pessoa, data, 'A data');
  const motivo = texto(entrada.motivo);
  if (motivo.length < 3) throw new ErroDeLancamento('Descreva o motivo: é o que sustenta o registro depois.');
  const justificada = tipo === 'Falta Justificada' ? 'Sim' : tipo === 'Falta Injustificada' ? 'Não' : entrada.justificada === 'Sim' ? 'Sim' : 'Não';
  return { tipo, data, justificada, motivo };
}

/**
 * Movimentação. entrada: { tipo, efetiva, motivo, novoSalario, novoCargo,
 * novoDepartamento, novaUnidade }. `cnpjs` são as unidades do cliente.
 */
export function montarMovimentacao(entrada, { pessoa, cnpjs = [] }) {
  const tipo = texto(entrada.tipo);
  if (!TIPOS_DE_MOVIMENTACAO.includes(tipo)) throw new ErroDeLancamento('Escolha o tipo de movimentação.');
  const efetiva = exigirData(entrada.efetiva, 'a data em que a mudança passa a valer');
  dentroDoContrato(pessoa, efetiva, 'A data');
  const motivo = texto(entrada.motivo);
  if (motivo.length < 3) throw new ErroDeLancamento('Descreva o motivo da movimentação.');

  const novo = {};
  const salario = paraValor(entrada.novoSalario);
  if (Number.isNaN(salario) || (salario !== null && salario <= 0)) throw new ErroDeLancamento('O novo salário não é um valor válido.');
  if (salario) novo.salario = salario;
  const cargo = texto(entrada.novoCargo);
  if (cargo) novo.cargo = cargo;
  const departamento = texto(entrada.novoDepartamento);
  if (departamento && departamento !== pessoa.departamento) novo.departamento = departamento;
  const unidade = texto(entrada.novaUnidade);
  if (unidade) {
    if (!cnpjs.some((item) => item.id === unidade)) throw new ErroDeLancamento('A unidade escolhida não é deste cliente.');
    if (unidade !== pessoa.cnpj_id) novo.cnpj_id = unidade;
  }

  if (tipo === 'Alteração Salarial' && !novo.salario) throw new ErroDeLancamento('Informe o novo salário.');
  if ((tipo === 'Promoção' || tipo === 'Mudança de Cargo') && !novo.cargo) throw new ErroDeLancamento('Informe o novo cargo.');
  if (tipo === 'Transferência' && !novo.cnpj_id && !novo.departamento) {
    throw new ErroDeLancamento('Informe a nova unidade ou o novo departamento.');
  }
  if (novo.salario && pessoa.salario && novo.salario === pessoa.salario && tipo === 'Alteração Salarial') {
    throw new ErroDeLancamento('O novo salário é igual ao atual.');
  }

  return { tipo, efetiva, motivo, checklist: 'Concluído', novo: Object.keys(novo).length ? novo : null };
}

export const TIPOS_DE_DESLIGAMENTO = [
  'Dispensa sem justa causa',
  'Pedido de demissão',
  'Acordo entre as partes',
  'Término de contrato de experiência',
  'Dispensa com justa causa',
];

/**
 * Desligamento. entrada: { data (último dia de trabalho), tipo, motivo }.
 * Pode ser marcado para até 60 dias à frente (aviso trabalhado).
 */
export function montarDesligamento(entrada, { pessoa, hoje }) {
  if (pessoa.desligamento?.data) throw new ErroDeLancamento(`Esta pessoa já tem desligamento em ${isoParaBr(pessoa.desligamento.data)}.`);
  const tipo = texto(entrada.tipo);
  if (!TIPOS_DE_DESLIGAMENTO.includes(tipo)) throw new ErroDeLancamento('Escolha o tipo de desligamento.');
  const data = exigirData(entrada.data, 'o último dia de trabalho');
  dentroDoContrato(pessoa, data, 'O último dia');
  if (data > isoDe(diaDe(hoje) + 60)) throw new ErroDeLancamento('O desligamento pode ser marcado para até 60 dias à frente.');
  if (tipo === 'Término de contrato de experiência' && pessoa.contrato && pessoa.contrato !== 'experiência') {
    throw new ErroDeLancamento('Esta pessoa não está em contrato de experiência.');
  }
  const motivo = texto(entrada.motivo);
  if (motivo.length < 3) throw new ErroDeLancamento('Descreva o motivo do desligamento.');
  return { data, tipo, motivo };
}


/* ---------------------------------------------------------- custos e admissão */

/**
 * Custos informados pela empresa ao registrar a admissão ou o desligamento.
 * São valores pagos, como a empresa (ou a contabilidade) apurou: a
 * plataforma soma, não calcula.
 */
export const ITENS_DE_CUSTO = {
  admissao: [
    { chave: 'exames', nome: 'Exames admissionais' },
    { chave: 'uniforme', nome: 'Uniforme e equipamentos' },
    { chave: 'outros', nome: 'Outros' },
  ],
  desligamento: [
    { chave: 'rescisao', nome: 'Rescisão paga' },
    { chave: 'exame', nome: 'Exame demissional' },
    { chave: 'outros', nome: 'Outros' },
  ],
};

/**
 * Os custos de um momento ('admissao' ou 'desligamento'). entrada traz
 * `custo_<chave>` para cada item; vazio é zero. Devolve os itens com valor
 * e o total, ou null quando nada foi informado.
 */
export function montarCustos(entrada, momento) {
  const itens = [];
  for (const { chave, nome } of ITENS_DE_CUSTO[momento] || []) {
    const valor = paraValor(entrada[`custo_${chave}`]);
    if (valor === null) continue;
    if (Number.isNaN(valor) || valor < 0) throw new ErroDeLancamento(`O valor de "${nome}" não é válido.`);
    if (valor > 0) itens.push({ item: chave, valor });
  }
  if (!itens.length) return null;
  return { itens, total: Math.round(itens.reduce((soma, item) => soma + item.valor * 100, 0)) / 100 };
}

/** O nome de um item de custo para a tela. */
export function nomeDoCusto(momento, item) {
  return ITENS_DE_CUSTO[momento]?.find((opcao) => opcao.chave === item)?.nome || 'Outros';
}

export const CONTRATOS = [
  { valor: 'experiência', texto: 'Experiência (até 90 dias)' },
  { valor: 'indeterminado', texto: 'Prazo indeterminado' },
  { valor: 'estágio', texto: 'Estágio' },
  { valor: 'aprendiz', texto: 'Aprendiz' },
  { valor: 'temporário', texto: 'Temporário' },
];

/** Idade mínima para trabalhar: 16 anos; como aprendiz, 14 (CF, art. 7º, XXXIII). */
const IDADE_MINIMA = { aprendiz: 14, padrao: 16 };

function idadeEm(nascimento, data) {
  const [an, mn, dn] = nascimento.split('-').map(Number);
  const [ad, md, dd] = data.split('-').map(Number);
  return ad - an - (md < mn || (md === mn && dd < dn) ? 1 : 0);
}

/**
 * Admissão. entrada: { nome, cpf, nascimento, unidade, departamento, cargo,
 * contrato, admissao, salario, jornada, gestor, custo_* }. `pessoas` são as
 * do cliente (para não repetir o CPF de quem está no quadro) e `cnpjs`, as
 * unidades. A admissão pode ser marcada para até 60 dias à frente.
 */
export function montarAdmissao(entrada, { pessoas = [], cnpjs = [], hoje }) {
  const nome = texto(entrada.nome).replace(/\s+/g, ' ');
  if (nome.split(' ').length < 2) throw new ErroDeLancamento('Informe o nome completo.');
  if (!cpfValido(entrada.cpf)) throw new ErroDeLancamento('O CPF não é válido. Confira os 11 dígitos.');
  const digitos = apenasDigitos(entrada.cpf);
  const noQuadro = pessoas.find((pessoa) => apenasDigitos(pessoa.cpf) === digitos && !pessoa.desligamento);
  if (noQuadro) throw new ErroDeLancamento(`Este CPF já está no quadro (matrícula ${noQuadro.matricula}).`);

  const contrato = texto(entrada.contrato);
  if (!CONTRATOS.some((item) => item.valor === contrato)) throw new ErroDeLancamento('Escolha o tipo de contrato.');
  const admissao = exigirData(entrada.admissao, 'o primeiro dia de trabalho');
  if (admissao > isoDe(diaDe(hoje) + 60)) throw new ErroDeLancamento('A admissão pode ser marcada para até 60 dias à frente.');
  const nascimento = exigirData(entrada.nascimento, 'a data de nascimento');
  const idade = idadeEm(nascimento, admissao);
  const minima = contrato === 'aprendiz' ? IDADE_MINIMA.aprendiz : IDADE_MINIMA.padrao;
  if (idade < minima) {
    throw new ErroDeLancamento(
      contrato === 'aprendiz' ? 'Para aprendiz, a idade mínima é 14 anos no primeiro dia.' : 'A idade mínima é 16 anos no primeiro dia (14 como aprendiz).'
    );
  }
  if (idade > 100) throw new ErroDeLancamento('Confira a data de nascimento.');

  let cnpj_id = texto(entrada.unidade);
  if (!cnpj_id && cnpjs.length === 1) cnpj_id = cnpjs[0].id;
  if (cnpjs.length && !cnpjs.some((item) => item.id === cnpj_id)) throw new ErroDeLancamento('Escolha a unidade (CNPJ) da pessoa.');
  const departamento = texto(entrada.departamento);
  if (!departamento) throw new ErroDeLancamento('Informe o departamento.');
  const cargo = texto(entrada.cargo);
  if (!cargo) throw new ErroDeLancamento('Informe o cargo.');
  const salario = paraValor(entrada.salario);
  if (!salario || Number.isNaN(salario) || salario <= 0) throw new ErroDeLancamento('Informe o salário.');

  return {
    pessoa: {
      nome,
      cpf: mascararCPF(digitos),
      nascimento,
      cnpj_id: cnpj_id || null,
      departamento,
      cargo,
      contrato,
      admissao,
      salario,
      jornada: texto(entrada.jornada) || '44h semanais',
      gestor: texto(entrada.gestor),
      desligamento: null,
    },
    custos: montarCustos(entrada, 'admissao'),
  };
}
