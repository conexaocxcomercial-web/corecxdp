/**
 * Gerador dos dados de demonstração. Puro e determinístico: a mesma data
 * de hoje dá sempre o mesmo resultado, e todas as datas são contadas a
 * partir de hoje, para os prazos e alertas nunca envelhecerem.
 *
 * Saída no formato das tabelas pensadas para o Supabase (snake_case):
 * parceiros, clientes, cnpjs, pessoas, ocorrencias, afastamentos,
 * movimentacoes, ferias, beneficios, adesoes e documentos, com autoria
 * (registrado_por, registrado_em) em todo evento e código guardado em
 * ocorrências, atestados e movimentações. `paraTabelas` converte no
 * formato das abas que as telas atuais leem (lib/registros.js).
 *
 * Cada cliente tem uma data de implantação. O que veio antes dela entrou
 * pela planilha modelo ("Importação da planilha"), só com o que a planilha
 * traz (docs/conceito.md › 11). A Oficina Bom Motor foi implantada há
 * poucos dias e ainda está na revisão da implantação.
 *
 * Tudo aqui é fictício: pessoas, empresas, CPFs, CNPJs, salários e valores
 * de benefício são inventados para a demonstração, não são tabelas oficiais.
 */

const DIA = 86400000;

/* ------------------------------------------------------------ sorteio */

function semente(texto) {
  let h = 2166136261;
  for (const letra of String(texto)) {
    h ^= letra.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: pequeno, rápido e estável entre execuções. */
function sorteador(base) {
  let estado = semente(base);
  const proximo = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const inteiro = (min, max) => min + Math.floor(proximo() * (max - min + 1));
  const escolher = (lista) => lista[Math.floor(proximo() * lista.length)];
  const chance = (p) => proximo() < p;
  const ponderado = (pares) => {
    const total = pares.reduce((soma, [, peso]) => soma + peso, 0);
    let alvo = proximo() * total;
    for (const [valor, peso] of pares) {
      alvo -= peso;
      if (alvo <= 0) return valor;
    }
    return pares[pares.length - 1][0];
  };
  return { proximo, inteiro, escolher, chance, ponderado };
}

/* -------------------------------------------------------------- datas */

function diaDe(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(ano, mes - 1, dia) / DIA);
}

function iso(dia) {
  return new Date(dia * DIA).toISOString().slice(0, 10);
}

function semana(dia) {
  return new Date(dia * DIA).getUTCDay();
}

/** O próximo dia útil (segunda a sexta) a partir de `dia`. */
function util(dia) {
  let d = dia;
  while (semana(d) === 0 || semana(d) === 6) d += 1;
  return d;
}

function somarMeses(dia, meses) {
  const data = new Date(dia * DIA);
  const alvo = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + meses, data.getUTCDate()));
  return Math.floor(alvo.getTime() / DIA);
}

/* ---------------------------------------------------- documentos fiscais */

function cpf(sorteio) {
  let base;
  do {
    base = Array.from({ length: 9 }, () => sorteio.inteiro(0, 9));
  } while (base.every((n) => n === base[0]));
  const digito = (numeros) => {
    const soma = numeros.reduce((total, n, i) => total + n * (numeros.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  const n = [...base, d1, d2].join('');
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function cnpj(raiz, filial) {
  const base = `${raiz}${String(filial).padStart(4, '0')}`.split('').map(Number);
  const digito = (numeros) => {
    const pesos = numeros.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = numeros.reduce((soma, n, i) => soma + n * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  const n = [...base, d1, d2].join('');
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

/* ---------------------------------------------------------- catálogo */

export const PARCEIROS = [
  { id: 'conexao-cx', nome: 'Conexão CX', ficticio: false, cores: null },
  {
    id: 'contabilidade-horizonte',
    nome: 'Contabilidade Horizonte (fictícia)',
    ficticio: true,
    // Cores próprias, para a fase 15 provar o white-label (sobrescrevem --marca-*).
    cores: { violeta: '#1f9d8b', lilas: '#c4ece4' },
  },
];

/** Cargos por segmento: [masculino, feminino, salário-base fictício]. */
const SEGMENTOS = {
  servicos: {
    Tecnologia: [['Desenvolvedor Júnior', 'Desenvolvedora Júnior', 4200], ['Desenvolvedor Pleno', 'Desenvolvedora Pleno', 6800], ['Desenvolvedor Sênior', 'Desenvolvedora Sênior', 9800], ['Analista de Suporte', 'Analista de Suporte', 3400]],
    Comercial: [['Executivo de Contas', 'Executiva de Contas', 4500], ['Assistente Comercial', 'Assistente Comercial', 2600]],
    Financeiro: [['Analista Financeiro', 'Analista Financeira', 4800], ['Assistente Financeiro', 'Assistente Financeira', 2700]],
    'Recursos Humanos': [['Analista de DP', 'Analista de DP', 4200], ['Assistente de DP', 'Assistente de DP', 2600]],
    Operações: [['Analista de Operações', 'Analista de Operações', 3900], ['Auxiliar Administrativo', 'Auxiliar Administrativa', 2100]],
    Diretoria: [['Gerente Geral', 'Gerente Geral', 14000]],
  },
  alimentacao: {
    Produção: [['Padeiro', 'Padeira', 2400], ['Confeiteiro', 'Confeiteira', 2500], ['Auxiliar de Produção', 'Auxiliar de Produção', 1750]],
    Atendimento: [['Atendente', 'Atendente', 1700], ['Operador de Caixa', 'Operadora de Caixa', 1750]],
    Administração: [['Gerente da Loja', 'Gerente da Loja', 4200]],
  },
  saude: {
    Assistencial: [['Técnico de Enfermagem', 'Técnica de Enfermagem', 2900], ['Enfermeiro', 'Enfermeira', 5200], ['Fisioterapeuta', 'Fisioterapeuta', 4300]],
    Recepção: [['Recepcionista', 'Recepcionista', 1900]],
    Administrativo: [['Assistente Administrativo', 'Assistente Administrativa', 2300], ['Faturista', 'Faturista', 2600]],
    Gestão: [['Coordenador Clínico', 'Coordenadora Clínica', 8500]],
  },
  educacao: {
    Pedagógico: [['Professor', 'Professora', 3800], ['Auxiliar de Classe', 'Auxiliar de Classe', 1900], ['Coordenador Pedagógico', 'Coordenadora Pedagógica', 5600]],
    Secretaria: [['Secretário Escolar', 'Secretária Escolar', 2400]],
    'Serviços Gerais': [['Auxiliar de Limpeza', 'Auxiliar de Limpeza', 1700], ['Porteiro', 'Porteira', 1800]],
    Direção: [['Diretor', 'Diretora', 8200]],
  },
  automotivo: {
    Oficina: [['Mecânico', 'Mecânica', 3200], ['Auxiliar de Mecânico', 'Auxiliar de Mecânica', 2000], ['Eletricista Automotivo', 'Eletricista Automotiva', 3300]],
    Atendimento: [['Consultor Técnico', 'Consultora Técnica', 2800]],
    Administração: [['Gerente da Oficina', 'Gerente da Oficina', 5000]],
  },
  logistica: {
    Operação: [['Motorista', 'Motorista', 3400], ['Ajudante de Carga', 'Ajudante de Carga', 1900], ['Conferente', 'Conferente', 2300]],
    Manutenção: [['Mecânico de Frota', 'Mecânica de Frota', 3600]],
    Administrativo: [['Analista de Logística', 'Analista de Logística', 4100], ['Assistente Administrativo', 'Assistente Administrativa', 2300], ['Analista de DP', 'Analista de DP', 4000]],
    Comercial: [['Executivo de Vendas', 'Executiva de Vendas', 4800]],
    Diretoria: [['Diretor de Operações', 'Diretora de Operações', 15000]],
  },
};

/** Peso de cada departamento no quadro, por segmento (o último é a direção: 1 pessoa). */
const PESOS = {
  servicos: { Tecnologia: 10, Comercial: 5, Financeiro: 3, 'Recursos Humanos': 2, Operações: 6, Diretoria: 0 },
  alimentacao: { Produção: 5, Atendimento: 5, Administração: 0 },
  saude: { Assistencial: 10, Recepção: 3, Administrativo: 3, Gestão: 0 },
  educacao: { Pedagógico: 9, Secretaria: 2, 'Serviços Gerais': 3, Direção: 0 },
  automotivo: { Oficina: 6, Atendimento: 2, Administração: 0 },
  logistica: { Operação: 22, Manutenção: 4, Administrativo: 6, Comercial: 3, Diretoria: 0 },
};

/** Benefícios oferecidos por segmento: [tipo, nome, empresa paga por mês, desconto, adesão]. */
const BENEFICIOS = {
  servicos: [['VR', 'Vale-refeição', 660, 0.1, 1], ['VT', 'Vale-transporte', 220, 0.06, 0.55], ['Plano de saúde', 'Plano de saúde', 420, 0.2, 0.85], ['Outros', 'Plano odontológico', 28, 0, 0.5]],
  alimentacao: [['VA', 'Vale-alimentação', 300, 0, 1], ['VT', 'Vale-transporte', 220, 0.06, 0.7]],
  saude: [['VR', 'Vale-refeição', 550, 0.1, 1], ['VT', 'Vale-transporte', 220, 0.06, 0.65], ['Plano de saúde', 'Plano de saúde', 380, 0.25, 0.9]],
  educacao: [['VA', 'Vale-alimentação', 400, 0, 1], ['VT', 'Vale-transporte', 220, 0.06, 0.6]],
  automotivo: [['VR', 'Vale-refeição', 480, 0.1, 1], ['VT', 'Vale-transporte', 220, 0.06, 0.5]],
  logistica: [['VR', 'Vale-refeição', 600, 0.1, 1], ['VT', 'Vale-transporte', 220, 0.06, 0.4], ['Plano de saúde', 'Plano de saúde', 400, 0.2, 0.8], ['Outros', 'Seguro de vida', 18, 0, 1]],
};

/**
 * Os seis clientes. `codigo` é o valor da coluna Cliente nas abas (o de
 * "Empresa Teste" continua "teste", o cliente do login teste@gmail.com).
 * A Empresa Teste tem matriz e duas filiais.
 */
export const CLIENTES = [
  {
    id: 'teste', parceiro_id: 'conexao-cx', nome: 'Empresa Teste', regime_tributario: 'Simples Nacional',
    segmento: 'servicos', ativos: 42, raiz: '11222333', database: 4, encargos: { anexo_simples: 'III' },
    filiais: [['Empresa Teste · Matriz', 0.55], ['Empresa Teste · Filial Centro', 0.25], ['Empresa Teste · Filial Zona Norte', 0.2]],
    autores: ['Gabriela Souza', 'Renato Alves'],
  },
  {
    id: 'padaria-pao-de-mel', parceiro_id: 'conexao-cx', nome: 'Padaria Pão de Mel', regime_tributario: 'Simples Nacional',
    segmento: 'alimentacao', ativos: 12, raiz: '44555666', database: 2, autores: ['Marta Ribeiro'],
    encargos: { anexo_simples: 'II' },
  },
  {
    id: 'clinica-vida-plena', parceiro_id: 'conexao-cx', nome: 'Clínica Vida Plena', regime_tributario: 'Lucro Presumido',
    segmento: 'saude', ativos: 28, raiz: '22333444', database: 6, autores: ['Juliana Campos', 'Pedro Henrique Lopes'],
    encargos: {},
  },
  {
    id: 'escola-saber-mais', parceiro_id: 'conexao-cx', nome: 'Escola Saber Mais', regime_tributario: 'Simples Nacional',
    segmento: 'educacao', ativos: 18, raiz: '55666777', database: 1, autores: ['Sílvia Moraes'],
    encargos: { anexo_simples: 'III' },
  },
  {
    id: 'oficina-bom-motor', parceiro_id: 'contabilidade-horizonte', nome: 'Oficina Bom Motor', regime_tributario: 'Lucro Presumido',
    segmento: 'automotivo', ativos: 9, raiz: '77888999', database: 3, autores: ['Carlos Eduardo Brito'],
    encargos: {},
    implantadoHaDias: 12,
  },
  {
    id: 'transportes-rota-sul', parceiro_id: 'contabilidade-horizonte', nome: 'Transportes Rota Sul', regime_tributario: 'Lucro Real',
    segmento: 'logistica', ativos: 60, raiz: '33444555', database: 5, autores: ['Fernanda Teixeira', 'André Luiz Nogueira'],
    encargos: { percentual: 0.38 },
  },
];

const NOMES = [
  ['Ana', 'f'], ['Beatriz', 'f'], ['Camila', 'f'], ['Daniela', 'f'], ['Eduarda', 'f'], ['Fernanda', 'f'], ['Gabriela', 'f'],
  ['Helena', 'f'], ['Isabela', 'f'], ['Juliana', 'f'], ['Larissa', 'f'], ['Mariana', 'f'], ['Natália', 'f'], ['Patrícia', 'f'],
  ['Rafaela', 'f'], ['Sabrina', 'f'], ['Tatiane', 'f'], ['Vanessa', 'f'], ['Aline', 'f'], ['Bruna', 'f'], ['Carolina', 'f'],
  ['Débora', 'f'], ['Elaine', 'f'], ['Flávia', 'f'], ['Giovana', 'f'], ['Jéssica', 'f'], ['Letícia', 'f'], ['Michele', 'f'],
  ['Priscila', 'f'], ['Renata', 'f'], ['Simone', 'f'], ['Thaís', 'f'], ['Adriana', 'f'], ['Luana', 'f'], ['Kelly', 'f'],
  ['André', 'm'], ['Bruno', 'm'], ['Carlos', 'm'], ['Diego', 'm'], ['Eduardo', 'm'], ['Felipe', 'm'], ['Gustavo', 'm'],
  ['Henrique', 'm'], ['Igor', 'm'], ['João', 'm'], ['Leonardo', 'm'], ['Marcelo', 'm'], ['Nicolas', 'm'], ['Otávio', 'm'],
  ['Paulo', 'm'], ['Rafael', 'm'], ['Samuel', 'm'], ['Thiago', 'm'], ['Vinícius', 'm'], ['Wagner', 'm'], ['Alexandre', 'm'],
  ['Caio', 'm'], ['Daniel', 'm'], ['Fábio', 'm'], ['Gabriel', 'm'], ['Hugo', 'm'], ['Lucas', 'm'], ['Mateus', 'm'],
  ['Renan', 'm'], ['Rodrigo', 'm'], ['Sérgio', 'm'], ['Tiago', 'm'], ['Victor', 'm'], ['Wellington', 'm'], ['Roberto', 'm'],
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento',
  'Carvalho', 'Araújo', 'Ribeiro', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Moreira', 'Cardoso', 'Teixeira', 'Mendes',
  'Correia', 'Dias', 'Castro', 'Freitas', 'Pinto', 'Moraes', 'Nunes', 'Vieira', 'Campos', 'Monteiro', 'Cavalcanti',
  'Duarte', 'Lopes', 'Andrade', 'Batista', 'Prado', 'Fonseca', 'Machado', 'Ramos', 'Farias', 'Salles', 'Brito', 'Melo',
  'Queiroz', 'Peixoto', 'Bezerra', 'Tavares', 'Xavier',
];

const DESLIGAMENTOS = [
  ['Pedido de demissão', 0.38, ['Recebeu proposta de outra empresa.', 'Mudança de cidade com a família.', 'Vai se dedicar aos estudos.', 'Decidiu abrir o próprio negócio.']],
  ['Dispensa sem justa causa', 0.34, ['Reestruturação da área.', 'Redução do quadro por queda de demanda.', 'Desempenho abaixo do esperado após acompanhamento.']],
  ['Término de contrato de experiência', 0.14, ['Não se adaptou à função no período de experiência.', 'Experiência encerrada sem efetivação.']],
  ['Acordo entre as partes', 0.1, ['Acordo para encerramento do contrato, a pedido do colaborador.']],
  ['Dispensa com justa causa', 0.04, ['Faltas injustificadas reiteradas após advertências e suspensão.']],
];

const OCORRENCIAS = [
  ['Falta Injustificada', 24, 'Não', ['Não compareceu e não comunicou a liderança.', 'Faltou sem apresentar justificativa.', 'Ausência sem aviso prévio.']],
  ['Falta Justificada', 22, 'Sim', ['Acompanhou filho em consulta médica, com declaração.', 'Doação de sangue, comprovante entregue ao DP.', 'Convocação para júri, com documento.', 'Falecimento de familiar, licença nojo.']],
  ['Atraso', 32, null, ['Chegou 40 minutos atrasado por problema no transporte.', 'Atraso de 25 minutos sem aviso.', 'Atraso por trânsito, avisou a liderança.', 'Atraso de 1 hora por consulta, com declaração.']],
  ['Saída Antecipada', 10, 'Sim', ['Saiu 2 horas antes para resolver assunto pessoal, com autorização.', 'Saída antecipada por mal-estar.']],
  ['Advertência', 8, 'Não', ['Advertência por atrasos repetidos no mês.', 'Advertência por descumprir norma de segurança.', 'Advertência por ausência sem justificativa.']],
  ['Suspensão', 3, 'Não', ['Suspensão de um dia após reincidência de atrasos.', 'Suspensão por conduta inadequada com cliente.']],
];

/** CIDs comuns em atestado, com o capítulo do CID-10 (para os indicadores agregados de saúde). */
const CIDS = [
  ['J06.9', 'J', 18], ['J11', 'J', 10], ['A09', 'A', 10], ['M54.5', 'M', 9], ['R51', 'R', 7], ['K29.7', 'K', 5],
  ['H10.9', 'H', 4], ['F41.1', 'F', 5], ['F32.9', 'F', 3], ['N39.0', 'N', 3], ['M75.1', 'M', 3], ['B34.9', 'B', 5],
];

/* ------------------------------------------------------------ gerador */

function quantidade(sorteio, media) {
  // Poisson pequena, por inversão.
  const limite = Math.exp(-media);
  let k = 0;
  let produto = sorteio.proximo();
  while (produto > limite) {
    k += 1;
    produto *= sorteio.proximo();
  }
  return k;
}

function gerarCliente(definicao, hoje) {
  const s = sorteador(`core.cx demo · ${definicao.id}`);
  const inicioJanela = somarMeses(hoje, -18);
  const autor = () => s.escolher(definicao.autores);
  const quando = (dia, folga = 3) => Math.min(hoje, dia + s.inteiro(0, folga));

  /* ---- CNPJs */
  const filiais = definicao.filiais || [[definicao.nome, 1]];
  const cnpjs = filiais.map(([nome], indice) => ({
    id: `${definicao.id}-${indice === 0 ? 'matriz' : `filial-${indice}`}`,
    cliente_id: definicao.id,
    cnpj: cnpj(definicao.raiz, indice + 1),
    nome,
    tipo: indice === 0 ? 'matriz' : 'filial',
  }));
  const sortearCnpj = () => s.ponderado(filiais.map(([, peso], indice) => [cnpjs[indice].id, peso]));

  /* ---- pessoas */
  const departamentos = SEGMENTOS[definicao.segmento];
  const pesos = Object.entries(PESOS[definicao.segmento]).filter(([, peso]) => peso > 0);
  const direcao = Object.keys(PESOS[definicao.segmento]).find((nome) => PESOS[definicao.segmento][nome] === 0);
  const desligados = Math.round(definicao.ativos * 0.3);
  const total = definicao.ativos + desligados;
  const usados = new Set();

  function nomeNovo() {
    for (;;) {
      const [primeiro, genero] = s.escolher(NOMES);
      const nome = `${primeiro} ${s.escolher(SOBRENOMES)} ${s.escolher(SOBRENOMES)}`;
      if (!usados.has(nome) && nome.split(' ')[1] !== nome.split(' ')[2]) {
        usados.add(nome);
        return { nome, genero };
      }
    }
  }

  const pessoas = [];
  for (let i = 0; i < total; i += 1) {
    const departamento = i === 0 ? direcao : s.ponderado(pesos);
    const cargos = departamentos[departamento];
    const [masc, fem, base] = i === 0 ? cargos[0] : s.escolher(cargos);
    const { nome, genero } = nomeNovo();
    const dentroDaJanela = i > 0 && s.chance(0.3);
    const admissao = util(
      dentroDaJanela
        ? s.inteiro(inicioJanela, hoje - 20)
        : inicioJanela - s.inteiro(90, 365 * 12)
    );
    pessoas.push({
      genero,
      nome,
      departamento,
      cargo: genero === 'f' ? fem : masc,
      base,
      admissao,
      cnpj_id: i === 0 ? cnpjs[0].id : sortearCnpj(),
    });
  }

  // Quem chegou há pouco (contrato de experiência, prazos de 45 e 90 dias)
  // e quem começa na semana que vem (registro antes do primeiro dia).
  const recentes = definicao.ativos >= 18 ? [12, 38, 76] : [30];
  recentes.forEach((diasAtras, indice) => {
    pessoas[total - 1 - indice].admissao = util(hoje - diasAtras);
  });
  if (definicao.ativos >= 18) pessoas[total - 4].admissao = util(hoje + 5);

  // Os desligados: entre os mais antigos que não são a direção nem os recentes.
  const candidatos = pessoas.slice(1, total - 4).map((_, indice) => indice + 1);
  for (let k = candidatos.length - 1; k > 0; k -= 1) {
    const j = s.inteiro(0, k);
    [candidatos[k], candidatos[j]] = [candidatos[j], candidatos[k]];
  }
  for (const indice of candidatos.slice(0, desligados)) pessoas[indice].desligar = true;

  pessoas.sort((a, b) => a.admissao - b.admissao);

  const lista = pessoas.map((pessoa, indice) => {
    const anos = s.inteiro(19, 60);
    const contrato =
      pessoa.admissao > hoje - 90
        ? 'experiência'
        : s.ponderado([['indeterminado', 92], ['estágio', 3], ['aprendiz', 2], ['temporário', definicao.segmento === 'logistica' ? 3 : 0]]);
    const variacao = 0.9 + s.proximo() * 0.25;
    const salario = contrato === 'estágio' ? 1400 : contrato === 'aprendiz' ? 1100 : Math.round((pessoa.base * variacao) / 10) * 10;
    return {
      id: `${definicao.id}-p${String(indice + 1).padStart(3, '0')}`,
      cliente_id: definicao.id,
      cnpj_id: pessoa.cnpj_id,
      matricula: `MAT${String(indice + 1).padStart(3, '0')}`,
      nome: pessoa.nome,
      _genero: pessoa.genero, // só para flexionar o cargo; gênero não é coletado nem sai daqui
      _desligar: Boolean(pessoa.desligar),
      cpf: cpf(s),
      nascimento: iso(pessoa.admissao - anos * 365 + s.inteiro(-180, 180)),
      departamento: pessoa.departamento,
      cargo: pessoa.cargo,
      contrato,
      admissao: iso(pessoa.admissao),
      salario,
      jornada: contrato === 'estágio' ? '30h semanais' : '44h semanais',
      gestor: '',
      situacao: 'Ativo',
      desligamento: null,
      registrado_por: autor(),
      registrado_em: iso(Math.min(hoje, pessoa.admissao - s.inteiro(1, 6))),
      _admissao: pessoa.admissao,
    };
  });

  // Desligamentos, dentro da janela de 18 meses. Nos clientes médios, um
  // deles é desta semana e ainda está por concluir (rescisão em 10 dias).
  const recente = definicao.ativos >= 18 ? lista.find((pessoa) => pessoa._desligar && pessoa._admissao < hoje - 200) : null;
  for (const pessoa of lista) {
    if (!pessoa._desligar) continue;
    let dia;
    if (pessoa === recente) {
      dia = hoje - s.inteiro(2, 5);
      while (semana(dia) === 0 || semana(dia) === 6) dia -= 1;
    } else {
      const primeiro = Math.max(pessoa._admissao + 25, inicioJanela + 5);
      if (primeiro >= hoje - 2) continue;
      dia = util(s.inteiro(primeiro, hoje - 2));
    }
    if (dia >= hoje) continue;
    const [tipo, , motivos] = s.ponderado(DESLIGAMENTOS.map((item) => [item, item[1]]));
    pessoa.desligamento = { data: iso(dia), tipo, motivo: s.escolher(motivos), _dia: dia };
    pessoa.situacao = 'Inativo';
  }

  const ativoEm = (pessoa, dia) =>
    pessoa._admissao <= dia && (!pessoa.desligamento || pessoa.desligamento._dia > dia);

  // Gestor imediato: a pessoa da direção para os chefes; o maior salário ativo do departamento para os demais.
  const diretor = lista.find((pessoa) => pessoa.departamento === direcao && !pessoa.desligamento) || lista[0];
  const chefes = new Map();
  for (const pessoa of lista) {
    if (pessoa.desligamento || pessoa === diretor) continue;
    const atual = chefes.get(pessoa.departamento);
    if (!atual || pessoa.salario > atual.salario) chefes.set(pessoa.departamento, pessoa);
  }
  for (const pessoa of lista) {
    const chefe = chefes.get(pessoa.departamento);
    pessoa.gestor = pessoa === diretor ? '' : chefe && chefe !== pessoa ? chefe.nome : diretor.nome;
  }

  /* ---- ocorrências */
  const ocorrencias = [];
  const novaOcorrencia = (pessoa, dia, forcado) => {
    const [tipo, , justificada, motivos] = forcado || s.ponderado(OCORRENCIAS.map((item) => [item, item[1]]));
    ocorrencias.push({
      id: `${pessoa.id}-o${ocorrencias.length}`,
      cliente_id: definicao.id,
      pessoa_id: pessoa.id,
      matricula: pessoa.matricula,
      data: iso(dia),
      tipo,
      justificada: justificada ?? (s.chance(0.5) ? 'Sim' : 'Não'),
      motivo: s.escolher(motivos),
      registrado_por: autor(),
      registrado_em: iso(quando(dia, 2)),
      _dia: dia,
    });
  };
  for (const pessoa of lista) {
    for (let mes = 0; mes < 18; mes += 1) {
      const dia = util(somarMeses(inicioJanela, mes) + s.inteiro(0, 26));
      if (dia >= hoje || !ativoEm(pessoa, dia)) continue;
      if (s.chance(0.07)) novaOcorrencia(pessoa, dia);
    }
  }
  // Reincidência: duas pessoas com atrasos e faltas acumulados nos últimos meses.
  const ativos = lista.filter((pessoa) => !pessoa.desligamento && pessoa._admissao < hoje - 200);
  for (const pessoa of ativos.slice(2, 4)) {
    for (let k = 0; k < s.inteiro(4, 6); k += 1) {
      novaOcorrencia(pessoa, util(hoje - s.inteiro(5, 170)), s.chance(0.6) ? OCORRENCIAS[2] : OCORRENCIAS[0]);
    }
  }
  // Faltas injustificadas recentes (o painel conta as dos últimos 30 dias).
  for (const pessoa of ativos.slice(5, 5 + (definicao.ativos >= 18 ? 2 : 1))) {
    novaOcorrencia(pessoa, util(hoje - s.inteiro(3, 25)), OCORRENCIAS[0]);
  }

  /* ---- afastamentos e atestados */
  const afastamentos = [];
  const novoAfastamento = (pessoa, tipo, inicio, dias, opcoes = {}) => {
    const fim = inicio + dias - 1;
    const comAtestado = opcoes.atestado ?? (tipo === 'Doença' || tipo === 'Acidente de trabalho');
    const registro = quando(inicio, 2);
    let validacao = null;
    if (comAtestado) {
      validacao = registro >= hoje - 10 && s.chance(0.6) ? 'Pendente' : s.chance(0.93) ? 'Aprovado' : 'Rejeitado';
      if (opcoes.validacao) validacao = opcoes.validacao;
    }
    let cid = null;
    if (comAtestado) {
      if (tipo === 'Acidente de trabalho') cid = s.escolher(['S93.4', 'S61.0', 'S83.6', 'T14.0']);
      else cid = s.chance(0.15) ? 'não informado' : s.ponderado(CIDS.map(([codigo, , peso]) => [codigo, peso]));
      if (opcoes.cid) cid = opcoes.cid;
    }
    afastamentos.push({
      id: `${pessoa.id}-a${afastamentos.length}`,
      cliente_id: definicao.id,
      pessoa_id: pessoa.id,
      matricula: pessoa.matricula,
      tipo,
      inicio: iso(inicio),
      fim_previsto: iso(fim),
      dias,
      retorno: fim < hoje ? iso(fim + 1) : null,
      atestado: comAtestado ? { cid, anexo: '' } : null,
      validacao,
      validado_por: validacao && validacao !== 'Pendente' ? autor() : null,
      validado_em: validacao && validacao !== 'Pendente' ? iso(Math.min(hoje, registro + s.inteiro(0, 3))) : null,
      inss: (tipo === 'Doença' || tipo === 'Acidente de trabalho') && dias > 15,
      registrado_por: autor(),
      registrado_em: iso(registro),
      _inicio: inicio,
      _fim: fim,
    });
  };
  for (const pessoa of lista) {
    if (pessoa._admissao > hoje - 45) continue;
    for (let k = 0; k < quantidade(s, 0.95); k += 1) {
      const inicio = util(s.inteiro(Math.max(pessoa._admissao + 10, inicioJanela), hoje - 1));
      if (!ativoEm(pessoa, inicio)) continue;
      const dias = s.ponderado([[1, 35], [2, 25], [3, 15], [5, 10], [7, 7], [10, 4], [15, 2], [s.inteiro(20, 45), 2]]);
      novoAfastamento(pessoa, 'Doença', inicio, dias);
    }
    if (s.chance(0.02)) {
      const inicio = util(s.inteiro(Math.max(pessoa._admissao + 30, inicioJanela), hoje - 15));
      if (ativoEm(pessoa, inicio)) novoAfastamento(pessoa, 'Acidente de trabalho', inicio, s.inteiro(3, 30));
    }
    if (s.chance(0.05)) {
      const inicio = util(s.inteiro(Math.max(pessoa._admissao + 30, inicioJanela), hoje - 5));
      if (ativoEm(pessoa, inicio)) {
        novoAfastamento(pessoa, 'Outros', inicio, s.escolher([2, 3, 5]), { atestado: false });
      }
    }
  }
  // Os que todo cliente médio precisa ter: atestados por validar, um afastamento
  // em curso acima de 15 dias (INSS), uma licença-maternidade e uma licença não remunerada.
  const elegiveis = lista.filter((pessoa) => !pessoa.desligamento && pessoa._admissao < hoje - 120);
  const pendentes = elegiveis.length ? (definicao.ativos >= 12 ? 3 : 1) : 0;
  for (let k = 0; k < pendentes; k += 1) {
    novoAfastamento(elegiveis[(7 + k * 3) % elegiveis.length], 'Doença', hoje - s.inteiro(3, 8), s.escolher([1, 2]), {
      validacao: 'Pendente',
    });
  }
  if (definicao.ativos >= 18 && elegiveis.length > 4) {
    novoAfastamento(elegiveis[1], 'Doença', hoje - 6, 30, { validacao: 'Aprovado' });
    const gestante = elegiveis.find((pessoa) => pessoa._genero === 'f' && pessoa !== elegiveis[1]);
    if (gestante) novoAfastamento(gestante, 'Licença-maternidade', hoje - 40, 120, { atestado: false });
    novoAfastamento(elegiveis[elegiveis.length - 2], 'Licença não remunerada', util(hoje - 200), 30, { atestado: false });
    // Mesma doença duas vezes em menos de 60 dias: 10 + 8 dias passam dos 15
    // e o encaminhamento ao INSS cai no 16º dia somado.
    const recorrente = elegiveis.find((pessoa, indice) => indice >= 4 && pessoa !== gestante && ![7, 10, 13].includes(indice));
    if (recorrente) {
      novoAfastamento(recorrente, 'Doença', util(hoje - 34), 10, { cid: 'M54.5', validacao: 'Aprovado' });
      novoAfastamento(recorrente, 'Doença', hoje - 3, 8, { cid: 'M54.5', validacao: 'Pendente' });
    }
  }
  if (definicao.ativos >= 28) {
    const outra = elegiveis.filter((pessoa) => pessoa._genero === 'f')[3];
    if (outra) novoAfastamento(outra, 'Licença-maternidade', util(hoje - 260), 120, { atestado: false });
  }

  /* ---- movimentações */
  const movimentacoes = [];
  const novaMovimentacao = (pessoa, tipo, dia, motivo, extra = {}) => {
    const checklist = dia < hoje - 30 ? 'Concluído' : s.ponderado([['Pendente', 3], ['Em andamento', 3], ['Concluído', 4]]);
    movimentacoes.push({
      id: `${pessoa.id}-m${movimentacoes.length}`,
      cliente_id: definicao.id,
      pessoa_id: pessoa.id,
      matricula: pessoa.matricula,
      tipo,
      efetiva: iso(dia),
      motivo,
      checklist,
      registrado_por: autor(),
      registrado_em: iso(Math.min(hoje, dia - s.inteiro(0, 10))),
      _dia: dia,
      ...extra,
    });
  };
  // Reajuste da convenção coletiva, no mês da data-base do cliente.
  for (let mes = 0; mes <= 18; mes += 1) {
    const primeiroDoMes = somarMeses(inicioJanela, mes);
    if (new Date(primeiroDoMes * DIA).getUTCMonth() + 1 !== definicao.database) continue;
    const dia = Math.floor(Date.UTC(new Date(primeiroDoMes * DIA).getUTCFullYear(), definicao.database - 1, 1) / DIA);
    if (dia > hoje) continue;
    const percentual = (4 + s.proximo() * 2).toFixed(1).replace('.', ',');
    for (const pessoa of lista) {
      if (!ativoEm(pessoa, dia) || pessoa._admissao > dia - 180 || pessoa.contrato === 'estágio') continue;
      novaMovimentacao(pessoa, 'Alteração Salarial', dia, `Reajuste da convenção coletiva, ${percentual}%.`, {
        percentual: Number(percentual.replace(',', '.')),
      });
    }
  }
  for (const pessoa of lista) {
    if (pessoa.desligamento) {
      novaMovimentacao(
        pessoa,
        'Desligamento',
        pessoa.desligamento._dia,
        `${pessoa.desligamento.tipo}. ${pessoa.desligamento.motivo}`,
        pessoa === recente ? { checklist: 'Em andamento' } : {}
      );
    }
    const desde = Math.max(pessoa._admissao + 120, inicioJanela);
    const ate = pessoa.desligamento ? pessoa.desligamento._dia - 20 : hoje + 10;
    if (desde >= ate) continue;
    if (s.chance(0.09)) {
      novaMovimentacao(pessoa, 'Promoção', util(s.inteiro(desde, ate)), s.escolher([
        'Promoção após ciclo de avaliação, aprovada pela diretoria.',
        'Assume a liderança da equipe.',
        'Promoção por mérito, com reajuste de 12%.',
      ]));
    } else if (s.chance(0.04)) {
      novaMovimentacao(pessoa, 'Mudança de Cargo', util(s.inteiro(desde, ate)), 'Passa a atuar em nova função, mesma área.');
    } else if (s.chance(0.04)) {
      const outra = cnpjs.length > 1 ? cnpjs.find((item) => item.id !== pessoa.cnpj_id) : null;
      novaMovimentacao(
        pessoa,
        'Transferência',
        util(s.inteiro(desde, ate)),
        outra ? `Transferência para a unidade ${outra.nome.split(' · ').pop()}.` : 'Transferência de equipe dentro da área.'
      );
    }
  }
  for (const afastamento of afastamentos) {
    if (afastamento.atestado || afastamento.dias < 15) continue;
    const pessoa = lista.find((item) => item.id === afastamento.pessoa_id);
    novaMovimentacao(pessoa, 'Afastamento', afastamento._inicio, `${afastamento.tipo}, ${afastamento.dias} dias.`);
    if (afastamento._fim < hoje) {
      novaMovimentacao(pessoa, 'Retorno de Afastamento', afastamento._fim + 1, `Retorno de ${afastamento.tipo.toLowerCase()}.`);
    }
  }

  /* ---- férias */
  const ferias = [];
  const novasFerias = (pessoa, periodo, situacao, inicio, dias) => {
    const aprovadas = ['gozada', 'programada', 'em andamento'].includes(situacao);
    ferias.push({
      id: `${pessoa.id}-f${ferias.length}`,
      cliente_id: definicao.id,
      pessoa_id: pessoa.id,
      matricula: pessoa.matricula,
      aquisitivo_inicio: iso(periodo.inicio),
      aquisitivo_fim: iso(periodo.fim),
      concessivo_fim: iso(periodo.concessivo),
      situacao,
      inicio: inicio === null ? null : iso(inicio),
      dias,
      aprovado_por: aprovadas ? autor() : null,
      registrado_por: inicio === null ? null : autor(),
      // Pedido e programação chegam nas últimas semanas, não todos hoje.
      registrado_em: inicio === null ? null : iso(Math.min(hoje - s.inteiro(0, 20), inicio - s.inteiro(35, 60))),
    });
  };
  let emAndamento = definicao.ativos >= 18 ? 2 : definicao.ativos >= 12 ? 1 : 0;
  let vencidasExtras = definicao.ativos >= 18 ? 1 : 0;
  // Nos clientes médios, ao menos um pedido de férias esperando a Gestão.
  let semPedido = definicao.ativos >= 18;
  for (const pessoa of lista) {
    if (pessoa.desligamento || ['estágio'].includes(pessoa.contrato)) continue;
    for (let k = 0; ; k += 1) {
      const inicio = somarMeses(pessoa._admissao, 12 * k);
      const fim = somarMeses(pessoa._admissao, 12 * (k + 1)) - 1;
      if (fim >= hoje) break;
      const concessivo = somarMeses(fim + 1, 12) - 1;
      const periodo = { inicio, fim, concessivo };
      if (concessivo < inicioJanela - 365) continue; // só o passado recente
      if (concessivo < hoje) {
        if (vencidasExtras > 0 && concessivo > hoje - 120 && s.chance(0.4)) {
          vencidasExtras -= 1;
          novasFerias(pessoa, periodo, 'vencida', null, 30);
        } else if (concessivo > hoje - 365 && s.chance(0.04)) {
          novasFerias(pessoa, periodo, 'vencida', null, 30);
        } else {
          const gozo = util(s.inteiro(fim + 30, Math.max(fim + 31, Math.min(concessivo - 31, hoje - 31))));
          novasFerias(pessoa, periodo, 'gozada', gozo, 30);
        }
        continue;
      }
      // Período concessivo ainda aberto.
      if (emAndamento > 0 && !afastamentos.some((a) => a.pessoa_id === pessoa.id && a._fim >= hoje - 1)) {
        emAndamento -= 1;
        novasFerias(pessoa, periodo, 'em andamento', hoje - s.inteiro(2, 12), 30);
      } else if (concessivo < hoje + 60) {
        if (s.chance(0.5)) novasFerias(pessoa, periodo, 'programada', util(hoje + s.inteiro(5, 25)), 30);
        else novasFerias(pessoa, periodo, 'a vencer', null, 30);
      } else {
        let sorte = s.ponderado([['programada', 3], ['aguardando aprovação', 0.6], ['a programar', 6.4]]);
        if (semPedido && sorte === 'a programar') sorte = 'aguardando aprovação';
        if (sorte === 'aguardando aprovação') semPedido = false;
        const inicioGozo = sorte === 'a programar' ? null : util(hoje + s.inteiro(10, 120));
        novasFerias(pessoa, periodo, sorte, inicioGozo, sorte === 'a programar' ? 30 : s.escolher([30, 20, 15]));
      }
    }
  }

  /* ---- benefícios */
  const beneficios = BENEFICIOS[definicao.segmento].map(([tipo, nome, valor, desconto, adesao], indice) => ({
    id: `${definicao.id}-b${indice + 1}`,
    cliente_id: definicao.id,
    tipo,
    nome,
    valor_empresa: valor,
    desconto_percentual: desconto,
    _adesao: adesao,
  }));
  const adesoes = [];
  for (const pessoa of lista) {
    if (pessoa.desligamento) continue;
    for (const beneficio of beneficios) {
      if (s.chance(beneficio._adesao)) {
        adesoes.push({ pessoa_id: pessoa.id, beneficio_id: beneficio.id, desde: pessoa.admissao });
      }
    }
  }
  beneficios.forEach((beneficio) => delete beneficio._adesao);

  /* ---- documentos */
  const documentos = [];
  const novoDocumento = (pessoa, tipo, emissao, validade) => {
    documentos.push({
      id: `${pessoa.id}-d${documentos.length}`,
      cliente_id: definicao.id,
      pessoa_id: pessoa.id,
      tipo,
      emissao: iso(emissao),
      validade: validade === null ? null : iso(validade),
      registrado_por: autor(),
      registrado_em: iso(Math.min(hoje, emissao + s.inteiro(0, 5))),
    });
  };
  for (const pessoa of lista) {
    if (pessoa.desligamento) continue;
    if (pessoa._admissao > hoje) continue;
    novoDocumento(pessoa, 'Contrato de trabalho', pessoa._admissao - 1, null);
    if (s.chance(0.95)) novoDocumento(pessoa, 'ASO admissional', pessoa._admissao - s.inteiro(2, 8), null);
    if (pessoa._admissao < hoje - 330) {
      // ASO periódico anual: alguns vencendo nos próximos 30 dias, poucos já vencidos.
      const validade = s.ponderado([[hoje + s.inteiro(31, 330), 80], [hoje + s.inteiro(1, 30), 14], [hoje - s.inteiro(1, 40), 6]]);
      novoDocumento(pessoa, 'ASO periódico', validade - 365, validade);
    }
    if (pessoa.cargo.startsWith('Motorista')) {
      const validade = s.ponderado([[hoje + s.inteiro(60, 1500), 85], [hoje + s.inteiro(1, 45), 15]]);
      novoDocumento(pessoa, 'CNH', validade - 365 * 5, validade);
    }
  }

  // Quem chegou há menos de 15 dias ainda não tem o ASO admissional anexado:
  // um passo da admissão em aberto.
  const admissaoPorId = new Map(lista.map((pessoa) => [pessoa.id, pessoa._admissao]));
  for (let indice = documentos.length - 1; indice >= 0; indice -= 1) {
    const documento = documentos[indice];
    if (documento.tipo === 'ASO admissional' && admissaoPorId.get(documento.pessoa_id) > hoje - 15) documentos.splice(indice, 1);
  }

  /* ---- custos informados pela empresa: na admissão (exames, uniforme) e no
     desligamento (rescisão paga, como a contabilidade apurou, e exame
     demissional). Fictícios; a plataforma não calcula rescisão. O
     desligamento desta semana ainda está sem os custos. */
  const custos = [];
  const novoCusto = (pessoa, momento, itens, dia) => {
    const comValor = itens.filter((item) => item.valor > 0);
    if (!comValor.length) return;
    custos.push({
      id: `${pessoa.id}-c${custos.length}`,
      cliente_id: definicao.id,
      pessoa_id: pessoa.id,
      momento,
      itens: comValor,
      total: comValor.reduce((soma, item) => soma + item.valor, 0),
      registrado_por: autor(),
      registrado_em: iso(Math.min(hoje, dia)),
    });
  };
  const comUniforme = ['alimentacao', 'saude', 'automotivo', 'logistica'].includes(definicao.segmento);
  const FATOR_DA_RESCISAO = {
    'Dispensa sem justa causa': [18, 32],
    'Pedido de demissão': [6, 14],
    'Acordo entre as partes': [14, 24],
    'Término de contrato de experiência': [5, 10],
    'Dispensa com justa causa': [3, 7],
  };
  for (const pessoa of lista) {
    if (pessoa._admissao >= inicioJanela && pessoa._admissao <= hoje + 10) {
      novoCusto(
        pessoa,
        'admissao',
        [
          { item: 'exames', valor: s.inteiro(8, 18) * 10 },
          { item: 'uniforme', valor: comUniforme ? s.inteiro(12, 30) * 10 : 0 },
          { item: 'outros', valor: s.chance(0.2) ? s.inteiro(5, 25) * 10 : 0 },
        ],
        pessoa._admissao - 1
      );
    }
    if (pessoa.desligamento && pessoa !== recente) {
      const [minimo, maximo] = FATOR_DA_RESCISAO[pessoa.desligamento.tipo] || [5, 15];
      novoCusto(
        pessoa,
        'desligamento',
        [
          { item: 'rescisao', valor: Math.round((pessoa.salario * s.inteiro(minimo, maximo)) / 100) * 10 },
          { item: 'exame', valor: s.inteiro(8, 15) * 10 },
        ],
        pessoa.desligamento._dia + 8
      );
    }
  }

  /* ---- situação de hoje, calculada pelos eventos */
  for (const pessoa of lista) {
    if (pessoa.desligamento) continue;
    if (afastamentos.some((a) => a.pessoa_id === pessoa.id && a._inicio <= hoje && a._fim >= hoje)) {
      pessoa.situacao = 'Afastado';
    } else if (ferias.some((f) => f.pessoa_id === pessoa.id && f.situacao === 'em andamento')) {
      pessoa.situacao = 'Férias';
    }
  }

  const limpar = (lista) =>
    lista.map((item) => {
      const copia = { ...item };
      for (const chave of Object.keys(copia)) if (chave.startsWith('_')) delete copia[chave];
      if (copia.desligamento) copia.desligamento = { data: copia.desligamento.data, tipo: copia.desligamento.tipo, motivo: copia.desligamento.motivo };
      return copia;
    });

  const implantadoHaPouco = Boolean(definicao.implantadoHaDias);
  const implantacao = implantadoHaPouco ? util(hoje - definicao.implantadoHaDias) : util(inicioJanela - 30);
  const saida = importar(
    {
      pessoas: limpar(lista),
      ocorrencias: limpar(ocorrencias),
      afastamentos: limpar(afastamentos),
      movimentacoes: limpar(movimentacoes),
      ferias,
      documentos,
      adesoes,
      custos,
    },
    { implantacao: iso(implantacao), recente: implantadoHaPouco, hoje: iso(hoje) }
  );

  return {
    cliente: {
      id: definicao.id,
      parceiro_id: definicao.parceiro_id,
      codigo: definicao.id,
      nome: definicao.nome,
      regime_tributario: definicao.regime_tributario,
      // Para o percentual de encargos (lib/calculos/custo.js): no Simples, o
      // anexo (o IV tem o seu); e o percentual próprio, quando a empresa
      // configurou um (a Rota Sul, para mostrar a configuração).
      anexo_simples: definicao.encargos.anexo_simples ?? null,
      percentual_encargos: definicao.encargos.percentual ?? null,
      implantacao: iso(implantacao),
      // Implantação antiga: a revisão já foi feita uma semana depois.
      revisao: implantadoHaPouco
        ? { concluida_em: null, concluida_por: null, conferidos: [] }
        : { concluida_em: iso(implantacao + 7), concluida_por: definicao.autores[0], conferidos: [] },
    },
    cnpjs,
    ...saida,
    beneficios,
  };
}

export const IMPORTACAO = 'Importação da planilha';

/**
 * O que veio antes da implantação entrou pela planilha modelo, em nome da
 * importação. Numa implantação recente, só o que a planilha traz: pessoas
 * ativas, ex-colaboradores dos últimos 12 meses, férias, atestados dos
 * últimos 12 meses (já validados), reajustes e mudanças de cargo. Ficam
 * de fora as ocorrências e os demais eventos anteriores. Dois ASO
 * periódicos vêm sem validade e uma férias aparentemente vencida, para a
 * revisão da implantação ter o que conferir.
 */
function importar(dados, { implantacao, recente, hoje }) {
  const antes = (data) => data && data < implantacao;
  const anoAntes = iso(diaDe(implantacao) - 365);
  const autoria = (item) =>
    antes(item.registrado_em) ? { ...item, registrado_por: IMPORTACAO, registrado_em: implantacao } : item;

  if (!recente) {
    return {
      pessoas: dados.pessoas.map(autoria),
      ocorrencias: dados.ocorrencias.map(autoria),
      afastamentos: dados.afastamentos.map(autoria),
      movimentacoes: dados.movimentacoes.map(autoria),
      ferias: dados.ferias.map((item) => (item.registrado_em ? autoria(item) : item)),
      documentos: dados.documentos.map(autoria),
      adesoes: dados.adesoes,
      custos: dados.custos.map(autoria),
    };
  }

  const pessoas = dados.pessoas.filter((pessoa) => !pessoa.desligamento || pessoa.desligamento.data >= anoAntes);
  const ids = new Set(pessoas.map((pessoa) => pessoa.id));
  const delas = (lista) => lista.filter((item) => ids.has(item.pessoa_id));
  const MOVIMENTACOES_DA_PLANILHA = ['Alteração Salarial', 'Mudança de Cargo', 'Promoção', 'Desligamento'];

  const afastamentos = delas(dados.afastamentos)
    .filter((item) => !antes(item.inicio) || (item.atestado && item.inicio >= anoAntes) || item.fim_previsto >= implantacao)
    .map((item) =>
      antes(item.inicio) && item.atestado
        ? { ...item, validacao: 'Aprovado', validado_por: IMPORTACAO, validado_em: implantacao }
        : item
    );

  let ferias = delas(dados.ferias);
  if (!ferias.some((item) => item.situacao === 'vencida')) {
    const gozada = ferias
      .filter((item) => item.situacao === 'gozada' && item.concessivo_fim < implantacao && item.concessivo_fim >= anoAntes)
      .sort((a, b) => (a.concessivo_fim < b.concessivo_fim ? 1 : -1))[0];
    if (gozada) {
      ferias = ferias.map((item) =>
        item === gozada ? { ...item, situacao: 'vencida', inicio: null, aprovado_por: null, registrado_por: null, registrado_em: null } : item
      );
    }
  }

  let semValidade = 0;
  const documentos = delas(dados.documentos).map((item) => {
    if (item.tipo === 'ASO periódico' && semValidade < 2 && item.validade && item.validade > hoje) {
      semValidade += 1;
      return { ...item, validade: null };
    }
    return item;
  });

  return {
    pessoas: pessoas.map(autoria),
    ocorrencias: delas(dados.ocorrencias).filter((item) => !antes(item.data)).map(autoria),
    afastamentos: afastamentos.map(autoria),
    movimentacoes: delas(dados.movimentacoes)
      .filter((item) => !antes(item.efetiva) || MOVIMENTACOES_DA_PLANILHA.includes(item.tipo))
      .map((item) => (antes(item.efetiva) ? { ...item, checklist: 'Concluído' } : item))
      .map(autoria),
    ferias: ferias.map((item) => (item.registrado_em ? autoria(item) : item)),
    documentos: documentos.map(autoria),
    adesoes: delas(dados.adesoes),
    // A planilha modelo não traz custos: só os registrados depois da implantação.
    custos: delas(dados.custos).filter((item) => !antes(item.registrado_em)),
  };
}

/** Todos os dados da demonstração para o dia `hojeIso` (aaaa-mm-dd). */
export function gerarDemonstracao(hojeIso) {
  const hoje = diaDe(hojeIso);
  const partes = CLIENTES.map((definicao) => gerarCliente(definicao, hoje));
  const juntar = (campo) => partes.flatMap((parte) => parte[campo]);

  const dados = {
    hoje: hojeIso,
    parceiros: PARCEIROS.map((parceiro) => ({ ...parceiro })),
    clientes: partes.map((parte) => parte.cliente),
    cnpjs: juntar('cnpjs'),
    pessoas: juntar('pessoas'),
    ocorrencias: juntar('ocorrencias'),
    afastamentos: juntar('afastamentos'),
    movimentacoes: juntar('movimentacoes'),
    ferias: juntar('ferias'),
    beneficios: juntar('beneficios'),
    adesoes: juntar('adesoes'),
    documentos: juntar('documentos'),
    custos: juntar('custos'),
  };
  numerar(dados.ocorrencias, 'OCO', 'data');
  numerar(dados.afastamentos.filter((item) => item.atestado), 'ATE', 'inicio');
  numerar(dados.movimentacoes, 'MOV', 'efetiva');
  return dados;
}

/* ------------------------------------------------ abas das telas atuais */

/**
 * Código de cada registro, numerado por cliente na ordem das datas
 * (OCO001, ATE001, MOV001). Fica guardado no item: um registro novo
 * recebe o próximo número e os antigos não mudam.
 */
function numerar(lista, prefixo, campoData) {
  const porCliente = new Map();
  [...lista]
    .sort((a, b) => (a[campoData] < b[campoData] ? -1 : a[campoData] > b[campoData] ? 1 : 0))
    .forEach((item) => {
      const n = (porCliente.get(item.cliente_id) || 0) + 1;
      porCliente.set(item.cliente_id, n);
      item.codigo = `${prefixo}${String(n).padStart(3, '0')}`;
    });
}

/**
 * De onde vem cada linha das abas, na ordem em que os itens foram
 * guardados (o que entra depois vai para o fim). É o que dá a cada linha
 * um número estável (lib/demo/memoria.js).
 */
export function fontesDasAbas(dados) {
  return {
    Colaboradores: dados.pessoas,
    Ocorrencias_Faltas: dados.ocorrencias,
    Atestados: dados.afastamentos.filter((item) => item.atestado),
    Movimentacoes_DP: dados.movimentacoes,
  };
}

/**
 * Os dados no formato das abas que as telas atuais leem (Colaboradores,
 * Ocorrencias_Faltas, Atestados, Movimentacoes_DP), com a coluna CNPJ nas
 * pessoas. Afastamento com atestado entra em Atestados; os sem atestado e
 * longos entram em Movimentações como Afastamento e Retorno, como hoje.
 */
export function paraTabelas(dados) {
  const cnpjPorId = new Map(dados.cnpjs.map((item) => [item.id, item.cnpj]));
  const fontes = fontesDasAbas(dados);

  return {
    Colaboradores: {
      cabecalho: ['Cliente', 'CNPJ', 'Matricula', 'Nome_Completo', 'CPF', 'Departamento', 'Cargo', 'Gestor_Imediato', 'Data_Admissao', 'Status'],
      registros: fontes.Colaboradores.map((pessoa) => ({
        Cliente: pessoa.cliente_id,
        CNPJ: cnpjPorId.get(pessoa.cnpj_id),
        Matricula: pessoa.matricula,
        Nome_Completo: pessoa.nome,
        CPF: pessoa.cpf,
        Departamento: pessoa.departamento,
        Cargo: pessoa.cargo,
        Gestor_Imediato: pessoa.gestor,
        Data_Admissao: pessoa.admissao,
        Status: pessoa.situacao,
      })),
    },
    Ocorrencias_Faltas: {
      cabecalho: ['Cliente', 'ID_Ocorrencia', 'Data_Registro', 'Matricula', 'Data_Falta', 'Tipo_Ocorrencia', 'Justificada', 'Motivo'],
      registros: fontes.Ocorrencias_Faltas.map((item) => ({
        Cliente: item.cliente_id,
        ID_Ocorrencia: item.codigo,
        Data_Registro: item.registrado_em,
        Matricula: item.matricula,
        Data_Falta: item.data,
        Tipo_Ocorrencia: item.tipo,
        Justificada: item.justificada,
        Motivo: item.motivo,
      })),
    },
    Atestados: {
      cabecalho: ['Cliente', 'ID_Atestado', 'Data_Registro', 'Matricula', 'Data_Inicio', 'Dias_Afastamento', 'CID', 'Anexo_URL', 'Status_Validacao'],
      registros: fontes.Atestados.map((item) => ({
        Cliente: item.cliente_id,
        ID_Atestado: item.codigo,
        Data_Registro: item.registrado_em,
        Matricula: item.matricula,
        Data_Inicio: item.inicio,
        Dias_Afastamento: item.dias,
        CID: item.atestado.cid === 'não informado' ? 'Não informado' : item.atestado.cid,
        Anexo_URL: item.atestado.anexo,
        Status_Validacao: item.validacao,
      })),
    },
    Movimentacoes_DP: {
      cabecalho: ['Cliente', 'ID_Movimentacao', 'Data_Registro', 'Matricula', 'Tipo_Movimentacao', 'Data_Efetiva', 'Motivo', 'Status_Checklist'],
      registros: fontes.Movimentacoes_DP.map((item) => ({
        Cliente: item.cliente_id,
        ID_Movimentacao: item.codigo,
        Data_Registro: item.registrado_em,
        Matricula: item.matricula,
        Tipo_Movimentacao: item.tipo,
        Data_Efetiva: item.efetiva,
        Motivo: item.motivo,
        Status_Checklist: item.checklist,
      })),
    },
  };
}
