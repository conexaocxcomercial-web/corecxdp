/**
 * Benefícios (fase 13 do redesenho): o catálogo da empresa (VA, VR, VT,
 * plano de saúde e outros), quanto a empresa paga por pessoa, o desconto no
 * salário, quem tem e quem não tem. São valores cadastrados, não calculados:
 * o custo do benefício na folha gerencial é a soma do que a empresa paga nas
 * adesões em vigor.
 *
 * Puro; testado em testes/beneficios.test.js.
 */
export const TIPOS_DE_BENEFICIO = ['VA', 'VR', 'VT', 'Plano de saúde', 'Outros'];

export class ErroDeBeneficio extends Error {}

const texto = (valor) => String(valor ?? '').trim();

function valorEmReais(entrada, rotulo) {
  const limpo = texto(entrada).replace(/[R$\s]/g, '');
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const valor = Number(normal);
  if (!limpo || !Number.isFinite(valor) || valor < 0) throw new ErroDeBeneficio(`Informe ${rotulo}.`);
  return Math.round(valor * 100) / 100;
}

/** Adesão em vigor na data: começou e não foi encerrada antes. */
export function emVigor(adesao, dataIso) {
  return (!adesao.desde || adesao.desde <= dataIso) && (!adesao.ate || adesao.ate >= dataIso);
}

/**
 * Benefício do catálogo. entrada: { tipo, nome, valor (o que a empresa paga
 * por pessoa, por mês), desconto (percentual do salário descontado, de 0 a 100) }.
 */
export function montarBeneficio(entrada, { existentes = [], id = null } = {}) {
  const tipo = texto(entrada.tipo);
  if (!TIPOS_DE_BENEFICIO.includes(tipo)) throw new ErroDeBeneficio('Escolha o tipo de benefício.');
  const nome = texto(entrada.nome) || tipo;
  if (existentes.some((item) => item.id !== id && item.nome.toLowerCase() === nome.toLowerCase())) {
    throw new ErroDeBeneficio(`Já existe um benefício chamado ${nome}.`);
  }
  const valor_empresa = valorEmReais(entrada.valor, 'quanto a empresa paga por pessoa');
  const percentual = texto(entrada.desconto) === '' ? 0 : Number(texto(entrada.desconto).replace(',', '.'));
  if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) throw new ErroDeBeneficio('O desconto vai de 0% a 100% do salário.');
  if (tipo === 'VT' && percentual > 6) throw new ErroDeBeneficio('O desconto do vale-transporte é de até 6% do salário (Lei 7.418/1985).');
  return { tipo, nome, valor_empresa, desconto_percentual: Math.round(percentual * 100) / 10000 };
}

/** Incluir alguém num benefício: sem repetir uma adesão em vigor, a partir de uma data dentro do contrato. */
export function montarAdesao({ desde }, { pessoa, beneficio, adesoes = [], hoje }) {
  const data = texto(desde) || hoje;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new ErroDeBeneficio('Informe a partir de quando.');
  if (pessoa.desligamento?.data && pessoa.desligamento.data < hoje) throw new ErroDeBeneficio('Esta pessoa já saiu da empresa.');
  if (pessoa.admissao && data < pessoa.admissao) throw new ErroDeBeneficio('A data é antes da admissão.');
  const ativa = adesoes.find((item) => item.pessoa_id === pessoa.id && item.beneficio_id === beneficio.id && (!item.ate || item.ate >= data));
  if (ativa) throw new ErroDeBeneficio(`${pessoa.nome} já tem ${beneficio.nome}.`);
  return { pessoa_id: pessoa.id, beneficio_id: beneficio.id, desde: data, ate: null };
}

/** Encerrar a adesão: o último dia com o benefício (não antes do começo). */
export function montarEncerramento(adesao, { ate }, { hoje }) {
  const data = texto(ate) || hoje;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new ErroDeBeneficio('Informe o último dia com o benefício.');
  if (adesao.ate && adesao.ate < hoje) throw new ErroDeBeneficio('Esta adesão já foi encerrada.');
  if (adesao.desde && data < adesao.desde) throw new ErroDeBeneficio('O último dia não pode ser antes do começo.');
  return { ate: data };
}

/**
 * A tela de Benefícios: cada benefício com quem tem e quem não tem no quadro
 * de hoje e o custo mensal da empresa, e as pessoas sem nenhum benefício.
 */
export function resumoDosBeneficios(recorte) {
  const hoje = recorte.hoje;
  const ativas = recorte.pessoas.filter((pessoa) => pessoa.admissao && pessoa.admissao <= hoje && (!pessoa.desligamento?.data || pessoa.desligamento.data >= hoje));
  const ids = new Set(ativas.map((pessoa) => pessoa.id));
  const vigentes = (recorte.adesoes || []).filter((adesao) => ids.has(adesao.pessoa_id) && emVigor(adesao, hoje));
  const resumo = (pessoa) => ({ id: pessoa.id, nome: pessoa.nome, matricula: pessoa.matricula, cargo: pessoa.cargo, departamento: pessoa.departamento });

  const catalogo = (recorte.beneficios || [])
    .map((beneficio) => {
      const delas = vigentes.filter((adesao) => adesao.beneficio_id === beneficio.id);
      const tem = new Set(delas.map((adesao) => adesao.pessoa_id));
      return {
        ...beneficio,
        aderentes: delas.map((adesao) => ({ adesao, pessoa: resumo(ativas.find((pessoa) => pessoa.id === adesao.pessoa_id)) })),
        semEle: ativas.filter((pessoa) => !tem.has(pessoa.id)).map(resumo),
        custoMensal: Math.round(delas.length * beneficio.valor_empresa * 100) / 100,
      };
    })
    .sort((a, b) => b.custoMensal - a.custoMensal);

  const comAlgum = new Set(vigentes.map((adesao) => adesao.pessoa_id));
  const custoMensal = Math.round(catalogo.reduce((soma, item) => soma + item.custoMensal * 100, 0)) / 100;
  return {
    catalogo,
    semNenhum: ativas.filter((pessoa) => !comAlgum.has(pessoa.id)).map(resumo),
    numeros: {
      custoMensal,
      pessoas: ativas.length,
      comAlgum: comAlgum.size,
      porPessoa: ativas.length ? Math.round((custoMensal / ativas.length) * 100) / 100 : 0,
    },
  };
}
