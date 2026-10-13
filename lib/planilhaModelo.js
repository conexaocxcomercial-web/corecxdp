/**
 * Planilha modelo de importação (fase 14 do redesenho; conceito › 11): as
 * abas, as colunas, a conferência linha a linha e os registros prontos para
 * gravar. A empresa baixa o modelo, preenche no Excel e sobe; cada erro diz a
 * aba, a linha e a coluna, para corrigir e subir de novo.
 *
 * Abas: Empresa (CNPJs, regime e, no Simples, o anexo), Colaboradores ativos,
 * Ex-colaboradores (últimos 12 meses, com data, tipo e motivo), Férias,
 * Atestados (últimos 12 meses), Reajustes (opcional) e Benefícios.
 *
 * Puro; testado em testes/planilhaModelo.test.js. A leitura do arquivo fica
 * em lib/xlsx.js.
 */
import { cpfValido, apenasDigitos, mascararCPF } from './formato.js';
import { CONTRATOS, TIPOS_DE_DESLIGAMENTO } from './lancamentos.js';
import { TIPOS_DE_BENEFICIO } from './beneficios.js';

const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];
const ANEXOS = ['I', 'II', 'III', 'IV', 'V'];
const TIPOS_DE_ATESTADO = ['Doença', 'Acidente de trabalho'];
const TIPOS_DE_REAJUSTE = ['Alteração Salarial', 'Promoção', 'Mudança de Cargo'];
const CID = /^[A-Z]\d{2}(\.\d{1,2})?$/;

/* Colunas: rótulo (como aparece no modelo), chave, obrigatória, tipo e exemplo. */
export const ABAS_DO_MODELO = [
  {
    nome: 'Empresa',
    descricao: 'Uma linha por CNPJ. Regime e anexo vêm da linha da matriz.',
    colunas: [
      { rotulo: 'CNPJ', chave: 'cnpj', obrigatoria: true, tipo: 'cnpj', exemplo: '11.222.333/0001-81' },
      { rotulo: 'Nome da unidade', chave: 'nome', obrigatoria: true, exemplo: 'Matriz' },
      { rotulo: 'Tipo', chave: 'tipo', obrigatoria: true, opcoes: ['Matriz', 'Filial'], exemplo: 'Matriz' },
      { rotulo: 'Regime tributário', chave: 'regime', opcoes: REGIMES, exemplo: 'Simples Nacional' },
      { rotulo: 'Anexo do Simples', chave: 'anexo', opcoes: ANEXOS, exemplo: 'III' },
    ],
  },
  {
    nome: 'Colaboradores ativos',
    obrigatoria: true,
    descricao: 'Quem está no quadro hoje.',
    colunas: [
      { rotulo: 'Nome completo', chave: 'nome', obrigatoria: true, exemplo: 'Ana Beatriz Moreira' },
      { rotulo: 'CPF', chave: 'cpf', obrigatoria: true, tipo: 'cpf', exemplo: '529.982.247-25' },
      { rotulo: 'Nascimento', chave: 'nascimento', obrigatoria: true, tipo: 'data', exemplo: '10/04/1995' },
      { rotulo: 'CNPJ da unidade', chave: 'cnpj', tipo: 'cnpj', exemplo: '11.222.333/0001-81' },
      { rotulo: 'Departamento', chave: 'departamento', obrigatoria: true, exemplo: 'Financeiro' },
      { rotulo: 'Cargo', chave: 'cargo', obrigatoria: true, exemplo: 'Analista Financeira' },
      { rotulo: 'Contrato', chave: 'contrato', obrigatoria: true, opcoes: CONTRATOS.map((item) => item.valor), exemplo: 'indeterminado' },
      { rotulo: 'Admissão', chave: 'admissao', obrigatoria: true, tipo: 'data', exemplo: '01/03/2024' },
      { rotulo: 'Salário', chave: 'salario', obrigatoria: true, tipo: 'valor', exemplo: '3.200,00' },
      { rotulo: 'Jornada', chave: 'jornada', exemplo: '44h semanais' },
      { rotulo: 'Gestor imediato', chave: 'gestor', exemplo: 'Letícia Tavares' },
    ],
  },
  {
    nome: 'Ex-colaboradores',
    descricao: 'Quem saiu nos últimos 12 meses, para o turnover já nascer com histórico.',
    colunas: [
      { rotulo: 'Nome completo', chave: 'nome', obrigatoria: true, exemplo: 'Carlos Lima Souza' },
      { rotulo: 'CPF', chave: 'cpf', obrigatoria: true, tipo: 'cpf', exemplo: '111.444.777-35' },
      { rotulo: 'CNPJ da unidade', chave: 'cnpj', tipo: 'cnpj', exemplo: '' },
      { rotulo: 'Departamento', chave: 'departamento', obrigatoria: true, exemplo: 'Comercial' },
      { rotulo: 'Cargo', chave: 'cargo', obrigatoria: true, exemplo: 'Vendedor' },
      { rotulo: 'Admissão', chave: 'admissao', obrigatoria: true, tipo: 'data', exemplo: '10/02/2022' },
      { rotulo: 'Salário', chave: 'salario', tipo: 'valor', exemplo: '2.800,00' },
      { rotulo: 'Último dia', chave: 'ultimoDia', obrigatoria: true, tipo: 'data', exemplo: '30/06/2026' },
      { rotulo: 'Tipo de desligamento', chave: 'tipoDesligamento', obrigatoria: true, opcoes: TIPOS_DE_DESLIGAMENTO, exemplo: 'Pedido de demissão' },
      { rotulo: 'Motivo', chave: 'motivo', obrigatoria: true, exemplo: 'Recebeu proposta de outra empresa.' },
    ],
  },
  {
    nome: 'Férias',
    descricao: 'Desde o período aquisitivo aberto mais antigo. Com início das férias: férias tiradas (ou programadas); sem início: dias por tirar.',
    colunas: [
      { rotulo: 'CPF', chave: 'cpf', obrigatoria: true, tipo: 'cpf', exemplo: '529.982.247-25' },
      { rotulo: 'Início do período aquisitivo', chave: 'aquisitivo', obrigatoria: true, tipo: 'data', exemplo: '01/03/2025' },
      { rotulo: 'Início das férias', chave: 'inicio', tipo: 'data', exemplo: '' },
      { rotulo: 'Dias', chave: 'dias', obrigatoria: true, tipo: 'inteiro', exemplo: '30' },
    ],
  },
  {
    nome: 'Atestados',
    descricao: 'Atestados dos últimos 12 meses. CID visível só para a Gestão da empresa e a Administração.',
    colunas: [
      { rotulo: 'CPF', chave: 'cpf', obrigatoria: true, tipo: 'cpf', exemplo: '529.982.247-25' },
      { rotulo: 'Tipo', chave: 'tipo', opcoes: TIPOS_DE_ATESTADO, exemplo: 'Doença' },
      { rotulo: 'Início', chave: 'inicio', obrigatoria: true, tipo: 'data', exemplo: '05/08/2026' },
      { rotulo: 'Dias', chave: 'dias', obrigatoria: true, tipo: 'inteiro', exemplo: '2' },
      { rotulo: 'CID', chave: 'cid', exemplo: 'J11 (ou "não informado")' },
    ],
  },
  {
    nome: 'Reajustes',
    descricao: 'Opcional: reajustes e mudanças de cargo, para o histórico da ficha.',
    colunas: [
      { rotulo: 'CPF', chave: 'cpf', obrigatoria: true, tipo: 'cpf', exemplo: '529.982.247-25' },
      { rotulo: 'Tipo', chave: 'tipo', obrigatoria: true, opcoes: TIPOS_DE_REAJUSTE, exemplo: 'Alteração Salarial' },
      { rotulo: 'Passa a valer em', chave: 'efetiva', obrigatoria: true, tipo: 'data', exemplo: '01/05/2026' },
      { rotulo: 'Novo salário', chave: 'novoSalario', tipo: 'valor', exemplo: '3.400,00' },
      { rotulo: 'Novo cargo', chave: 'novoCargo', exemplo: '' },
      { rotulo: 'Motivo', chave: 'motivo', exemplo: 'Reajuste da convenção coletiva.' },
    ],
  },
  {
    nome: 'Benefícios',
    descricao: 'Uma linha por pessoa e benefício. O valor e o desconto definem o benefício no catálogo.',
    colunas: [
      { rotulo: 'CPF', chave: 'cpf', obrigatoria: true, tipo: 'cpf', exemplo: '529.982.247-25' },
      { rotulo: 'Benefício', chave: 'beneficio', obrigatoria: true, exemplo: 'Vale-refeição' },
      { rotulo: 'Tipo', chave: 'tipo', obrigatoria: true, opcoes: TIPOS_DE_BENEFICIO, exemplo: 'VR' },
      { rotulo: 'Empresa paga por pessoa', chave: 'valor', obrigatoria: true, tipo: 'valor', exemplo: '660,00' },
      { rotulo: 'Desconto no salário (%)', chave: 'desconto', tipo: 'percentual', exemplo: '10' },
    ],
  },
];

/* ----------------------------------------------------------- leituras */

const semAcento = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\*/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const BASE_DO_EXCEL = Date.UTC(1899, 11, 30);

/** "aaaa-mm-dd", "dd/mm/aaaa" ou o número de série do Excel; null se não der. */
export function lerData(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  let iso = null;
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) iso = texto.slice(0, 10);
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split('/').map(Number);
    iso = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  } else if (/^\d{4,5}(\.\d+)?$/.test(texto)) {
    iso = new Date(BASE_DO_EXCEL + Math.floor(Number(texto)) * 86400000).toISOString().slice(0, 10);
  }
  if (!iso) return null;
  const data = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== iso ? null : iso;
}

/** "3.200,00", "3200,5" ou o número do Excel ("3200.5"). */
export function lerValor(valor) {
  const texto = String(valor ?? '').trim().replace(/[R$\s]/g, '');
  if (!texto) return null;
  const normal = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto;
  const numero = Number(normal);
  return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : NaN;
}

export function cnpjValido(texto) {
  const cnpj = apenasDigitos(texto);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digito = (tamanho) => {
    const pesos = tamanho === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((total, peso, i) => total + Number(cnpj[i]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(12) === Number(cnpj[12]) && digito(13) === Number(cnpj[13]);
}

export function mascararCNPJ(texto) {
  const d = apenasDigitos(texto);
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : String(texto || '').trim();
}

/* ------------------------------------------------------------- modelo */

/**
 * As abas da planilha modelo: as Instruções (o que vai em cada aba e, coluna
 * por coluna, se é obrigatória, o exemplo e as opções) e as abas de dados,
 * só com o cabeçalho (obrigatórias com *). Sem linha de exemplo nas abas de
 * dados: assim nada do que a empresa preencher é confundido com exemplo.
 */
export function abasDoModelo() {
  const instrucoes = [
    ['Planilha modelo de importação'],
    ['Preencha uma aba de cada vez, a partir da linha 2. Colunas com * são obrigatórias. Datas em dd/mm/aaaa; valores em reais (3.200,00).'],
    ['Depois de subir, a tela mostra os erros por aba, linha e coluna. Corrija no Excel e suba de novo.'],
    [''],
  ];
  for (const aba of ABAS_DO_MODELO) {
    instrucoes.push([`Aba ${aba.nome}${aba.obrigatoria ? ' (obrigatória)' : ''}`, aba.descricao]);
    instrucoes.push(['Coluna', 'Exemplo', 'Opções']);
    for (const coluna of aba.colunas) {
      instrucoes.push([`${coluna.rotulo}${coluna.obrigatoria ? ' *' : ''}`, coluna.exemplo || '', coluna.opcoes ? coluna.opcoes.join(', ') : '']);
    }
    instrucoes.push(['']);
  }
  return [
    { nome: 'Instruções', linhas: instrucoes, larguras: [34, 60, 70] },
    ...ABAS_DO_MODELO.map((aba) => ({
      nome: aba.nome,
      linhas: [aba.colunas.map((coluna) => `${coluna.rotulo}${coluna.obrigatoria ? ' *' : ''}`)],
      larguras: aba.colunas.map((coluna) => Math.max(14, coluna.rotulo.length + 4)),
    })),
  ];
}

/* ----------------------------------------------------------- conferência */

/**
 * Confere a planilha lida (lib/xlsx.js › lerXlsx: { aba: [{ numero, celulas }] })
 * e devolve os erros por aba, linha e coluna, um resumo e os registros
 * normalizados. `contexto`: { hoje, cnpjs (da empresa), pessoas (já
 * cadastradas, para não repetir CPF) }.
 */
export function conferirPlanilha(lida, { hoje, cnpjs = [], pessoas = [] } = {}) {
  const erros = [];
  const avisos = [];
  const erro = (aba, linha, coluna, mensagem) => erros.push({ aba, linha, coluna, mensagem });
  const abaPorNome = new Map(Object.keys(lida).map((nome) => [semAcento(nome), nome]));
  const umAnoAntes = (() => {
    const [a, m, d] = hoje.split('-').map(Number);
    return new Date(Date.UTC(a - 1, m - 1, d)).toISOString().slice(0, 10);
  })();

  /* Cada aba vira uma lista de linhas com os campos pelas chaves. */
  function linhasDa(definicao) {
    const nome = abaPorNome.get(semAcento(definicao.nome));
    if (!nome) {
      if (definicao.obrigatoria) erro(definicao.nome, null, null, `Falta a aba "${definicao.nome}".`);
      return [];
    }
    const [cabecalho, ...resto] = lida[nome];
    if (!cabecalho) return [];
    const posicao = new Map(cabecalho.celulas.map((rotulo, indice) => [semAcento(rotulo), indice]));
    const faltando = definicao.colunas.filter((coluna) => coluna.obrigatoria && !posicao.has(semAcento(coluna.rotulo)));
    for (const coluna of faltando) erro(definicao.nome, cabecalho.numero, coluna.rotulo, `Falta a coluna "${coluna.rotulo}" no cabeçalho.`);
    if (faltando.length) return [];
    return resto
      .map(({ numero, celulas }) => {
        const campos = {};
        for (const coluna of definicao.colunas) {
          const indice = posicao.get(semAcento(coluna.rotulo));
          campos[coluna.chave] = indice === undefined ? '' : String(celulas[indice] ?? '').trim();
        }
        return { numero, campos };
      });
  }

  /* Confere os campos de uma linha pelas colunas; devolve os valores lidos. */
  function conferirLinha(definicao, { numero, campos }) {
    const valores = {};
    let ok = true;
    for (const coluna of definicao.colunas) {
      const bruto = campos[coluna.chave];
      const falha = (mensagem) => {
        ok = false;
        erro(definicao.nome, numero, coluna.rotulo, mensagem);
      };
      if (!bruto) {
        if (coluna.obrigatoria) falha('Preencha este campo.');
        valores[coluna.chave] = null;
        continue;
      }
      if (coluna.tipo === 'data') {
        const data = lerData(bruto);
        if (!data) falha(`"${bruto}" não é uma data (use dd/mm/aaaa).`);
        valores[coluna.chave] = data;
      } else if (coluna.tipo === 'valor') {
        const valor = lerValor(bruto);
        if (Number.isNaN(valor) || valor < 0) falha(`"${bruto}" não é um valor em reais.`);
        valores[coluna.chave] = valor;
      } else if (coluna.tipo === 'percentual') {
        const valor = Number(String(bruto).replace('%', '').replace(',', '.'));
        if (!Number.isFinite(valor) || valor < 0 || valor > 100) falha(`"${bruto}" não é um percentual de 0 a 100.`);
        valores[coluna.chave] = valor;
      } else if (coluna.tipo === 'inteiro') {
        const valor = Number(bruto);
        if (!Number.isInteger(valor) || valor < 1) falha(`"${bruto}" não é um número inteiro de dias.`);
        valores[coluna.chave] = valor;
      } else if (coluna.tipo === 'cpf') {
        if (!cpfValido(bruto)) falha(`O CPF "${bruto}" não é válido.`);
        valores[coluna.chave] = apenasDigitos(bruto);
      } else if (coluna.tipo === 'cnpj') {
        if (!cnpjValido(bruto)) falha(`O CNPJ "${bruto}" não é válido.`);
        valores[coluna.chave] = apenasDigitos(bruto);
      } else if (coluna.opcoes) {
        const opcao = coluna.opcoes.find((item) => semAcento(item) === semAcento(bruto));
        if (!opcao) falha(`"${bruto}" não é uma opção. Use: ${coluna.opcoes.join(', ')}.`);
        valores[coluna.chave] = opcao || null;
      } else {
        valores[coluna.chave] = bruto;
      }
    }
    return ok ? valores : null;
  }

  const definicao = (nome) => ABAS_DO_MODELO.find((aba) => aba.nome === nome);

  /* ---- Empresa */
  const unidades = [];
  for (const linha of linhasDa(definicao('Empresa'))) {
    const valores = conferirLinha(definicao('Empresa'), linha);
    if (!valores) continue;
    if (valores.regime && valores.regime !== 'Simples Nacional' && valores.anexo) erro('Empresa', linha.numero, 'Anexo do Simples', 'O anexo só vale para o Simples Nacional.');
    unidades.push({ ...valores, numero: linha.numero });
  }
  const matriz = unidades.find((item) => item.tipo === 'Matriz') || null;
  if (unidades.length && unidades.filter((item) => item.tipo === 'Matriz').length > 1) erro('Empresa', null, 'Tipo', 'Só uma linha pode ser a matriz.');
  if (matriz?.regime === 'Simples Nacional' && !matriz.anexo) avisos.push('O anexo do Simples não foi informado: a estimativa de encargos usa 8% ("anexo a conferir").');
  const cnpjsConhecidos = new Set([...cnpjs.map((item) => apenasDigitos(item.cnpj || '')), ...unidades.map((item) => item.cnpj)]);

  /* ---- Pessoas (ativas e ex-colaboradores) */
  const cpfsCadastrados = new Map(pessoas.map((pessoa) => [apenasDigitos(pessoa.cpf), pessoa]));
  const cpfsDaPlanilha = new Map();
  const novasPessoas = [];
  const jaCadastradas = [];
  const conferirPessoa = (aba, linha, valores, saiu) => {
    const anterior = cpfsDaPlanilha.get(valores.cpf);
    if (anterior) {
      erro(aba, linha.numero, 'CPF', `CPF repetido (também na aba ${anterior.aba}, linha ${anterior.numero}).`);
      return;
    }
    cpfsDaPlanilha.set(valores.cpf, { aba, numero: linha.numero });
    if (valores.cnpj && !cnpjsConhecidos.has(valores.cnpj)) erro(aba, linha.numero, 'CNPJ da unidade', 'Este CNPJ não está na aba Empresa nem nas unidades da empresa.');
    if (valores.admissao && valores.admissao > hoje) erro(aba, linha.numero, 'Admissão', 'A admissão é depois de hoje: cadastre pelo Lançar › Admissão.');
    if (saiu) {
      if (valores.ultimoDia && (valores.ultimoDia > hoje || valores.ultimoDia < umAnoAntes)) erro(aba, linha.numero, 'Último dia', 'O último dia precisa estar nos últimos 12 meses.');
      if (valores.ultimoDia && valores.admissao && valores.ultimoDia < valores.admissao) erro(aba, linha.numero, 'Último dia', 'O último dia é antes da admissão.');
    }
    if (cpfsCadastrados.has(valores.cpf)) {
      jaCadastradas.push({ aba, numero: linha.numero, nome: valores.nome });
      return;
    }
    novasPessoas.push({ ...valores, saiu, aba, numero: linha.numero });
  };
  const cpfsComErro = new Set();
  for (const [nome, saiu] of [['Colaboradores ativos', false], ['Ex-colaboradores', true]]) {
    for (const linha of linhasDa(definicao(nome))) {
      const valores = conferirLinha(definicao(nome), linha);
      if (valores) conferirPessoa(nome, linha, valores, saiu);
      else if (cpfValido(linha.campos.cpf)) cpfsComErro.add(apenasDigitos(linha.campos.cpf));
    }
  }
  const daPlanilha = (aba, linha, cpf) => {
    if (!cpf) return false;
    if (cpfsDaPlanilha.has(cpf) || cpfsCadastrados.has(cpf)) return true;
    // A pessoa está na planilha, mas a linha dela tem erro: o aviso fica lá, não aqui.
    if (cpfsComErro.has(cpf)) return false;
    erro(aba, linha.numero, 'CPF', 'Este CPF não está em Colaboradores ativos, em Ex-colaboradores nem no quadro.');
    return false;
  };

  /* ---- Férias */
  const ferias = [];
  for (const linha of linhasDa(definicao('Férias'))) {
    const valores = conferirLinha(definicao('Férias'), linha);
    if (!valores || !daPlanilha('Férias', linha, valores.cpf)) continue;
    if (valores.dias > 30) erro('Férias', linha.numero, 'Dias', 'Um período dá direito a até 30 dias.');
    else ferias.push({ ...valores, numero: linha.numero });
  }

  /* ---- Atestados */
  const atestados = [];
  for (const linha of linhasDa(definicao('Atestados'))) {
    const valores = conferirLinha(definicao('Atestados'), linha);
    if (!valores || !daPlanilha('Atestados', linha, valores.cpf)) continue;
    if (valores.inicio < umAnoAntes || valores.inicio > hoje) {
      erro('Atestados', linha.numero, 'Início', 'Só os atestados dos últimos 12 meses.');
      continue;
    }
    const cid = String(valores.cid || '').toUpperCase().replace(/\s/g, '');
    const naoInformado = !cid || semAcento(valores.cid) === 'nao informado';
    if (!naoInformado && !CID.test(cid)) {
      erro('Atestados', linha.numero, 'CID', `"${valores.cid}" não é um CID (por exemplo, J11) nem "não informado".`);
      continue;
    }
    atestados.push({ ...valores, tipo: valores.tipo || 'Doença', cid: naoInformado ? 'não informado' : cid, numero: linha.numero });
  }

  /* ---- Reajustes */
  const reajustes = [];
  for (const linha of linhasDa(definicao('Reajustes'))) {
    const valores = conferirLinha(definicao('Reajustes'), linha);
    if (!valores || !daPlanilha('Reajustes', linha, valores.cpf)) continue;
    if (valores.tipo === 'Alteração Salarial' && !valores.novoSalario) {
      erro('Reajustes', linha.numero, 'Novo salário', 'A alteração salarial pede o novo salário.');
      continue;
    }
    if (valores.tipo !== 'Alteração Salarial' && !valores.novoCargo) {
      erro('Reajustes', linha.numero, 'Novo cargo', 'Promoção e mudança de cargo pedem o novo cargo.');
      continue;
    }
    reajustes.push({ ...valores, numero: linha.numero });
  }

  /* ---- Benefícios */
  const catalogo = new Map();
  const adesoes = [];
  for (const linha of linhasDa(definicao('Benefícios'))) {
    const valores = conferirLinha(definicao('Benefícios'), linha);
    if (!valores || !daPlanilha('Benefícios', linha, valores.cpf)) continue;
    if (valores.tipo === 'VT' && (valores.desconto || 0) > 6) {
      erro('Benefícios', linha.numero, 'Desconto no salário (%)', 'O desconto do vale-transporte é de até 6%.');
      continue;
    }
    const chave = semAcento(valores.beneficio);
    const anterior = catalogo.get(chave);
    if (anterior && (anterior.valor !== valores.valor || (anterior.desconto || 0) !== (valores.desconto || 0))) {
      erro('Benefícios', linha.numero, 'Empresa paga por pessoa', `${valores.beneficio} tem outro valor ou desconto na linha ${anterior.numero}: use o mesmo em todas as linhas.`);
      continue;
    }
    if (!anterior) catalogo.set(chave, { nome: valores.beneficio, tipo: valores.tipo, valor: valores.valor, desconto: valores.desconto || 0, numero: linha.numero });
    adesoes.push({ cpf: valores.cpf, beneficio: chave, numero: linha.numero });
  }

  const ordenados = erros.sort((a, b) => {
    const ordem = (nome) => ABAS_DO_MODELO.findIndex((aba) => aba.nome === nome);
    return ordem(a.aba) - ordem(b.aba) || (a.linha || 0) - (b.linha || 0);
  });
  return {
    erros: ordenados,
    avisos,
    resumo: {
      unidades: unidades.length,
      ativos: novasPessoas.filter((item) => !item.saiu).length,
      exColaboradores: novasPessoas.filter((item) => item.saiu).length,
      jaCadastradas: jaCadastradas.length,
      ferias: ferias.length,
      atestados: atestados.length,
      reajustes: reajustes.length,
      beneficios: catalogo.size,
      adesoes: adesoes.length,
    },
    dados: {
      empresa: matriz ? { regime: matriz.regime || null, anexo: matriz.anexo || null } : null,
      unidades: unidades.map((item) => ({ cnpj: mascararCNPJ(item.cnpj), nome: item.nome, tipo: item.tipo.toLowerCase() })),
      pessoas: novasPessoas.map((item) => ({ ...item, cpf: mascararCPF(item.cpf) })),
      jaCadastradas,
      ferias,
      atestados,
      reajustes,
      catalogo: [...catalogo.values()],
      adesoes,
    },
  };
}
