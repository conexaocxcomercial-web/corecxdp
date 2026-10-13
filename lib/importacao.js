/**
 * Importação da planilha modelo (fase 14 do redesenho): transforma o que
 * lib/planilhaModelo.js conferiu nos registros de cada coleção, com autoria
 * "Importação da planilha". Pessoas novas ganham a próxima matrícula do
 * cliente; quem já está no quadro (pelo CPF) fica de fora. Ex-colaboradores
 * entram com o desligamento concluído; atestados, já validados; férias, pelo
 * período aquisitivo.
 *
 * Puro; testado em testes/planilhaModelo.test.js. A gravação fica em
 * lib/dados/empresa.js.
 */
import { diaDe, isoDe } from './calendario.js';

export const IMPORTACAO = 'Importação da planilha';
const COM_INSS = 15;

function umAnoDepois(iso, dias = 0) {
  const [a, m, d] = iso.split('-').map(Number);
  return isoDe(diaDe(new Date(Date.UTC(a + 1, m - 1, d)).toISOString().slice(0, 10)) + dias);
}

function proximoNumero(pessoas) {
  return pessoas.reduce((maior, pessoa) => {
    const numero = String(pessoa.matricula || '').match(/(\d+)\s*$/);
    return numero ? Math.max(maior, Number(numero[1])) : maior;
  }, 0);
}

/**
 * dados: o `dados` de conferirPlanilha. contexto: { cliente (id), cnpjs (da
 * empresa), pessoas (do cliente), beneficios (do catálogo), hoje }.
 */
export function registrosDaImportacao(dados, { cliente, cnpjs = [], pessoas = [], beneficios = [], hoje }) {
  const autoria = { registrado_por: IMPORTACAO, registrado_em: hoje };
  const digitos = (texto) => String(texto || '').replace(/\D/g, '');

  /* Unidades: as que ainda não existem entram. */
  const unidadePorCnpj = new Map(cnpjs.map((item) => [digitos(item.cnpj), item]));
  const novasUnidades = [];
  for (const [indice, unidade] of (dados.unidades || []).entries()) {
    if (unidadePorCnpj.has(digitos(unidade.cnpj))) continue;
    const nova = { id: `${cliente}-cnpj-imp${indice + 1}`, cliente_id: cliente, cnpj: unidade.cnpj, nome: unidade.nome, tipo: unidade.tipo };
    novasUnidades.push(nova);
    unidadePorCnpj.set(digitos(unidade.cnpj), nova);
  }
  const matriz = [...unidadePorCnpj.values()].find((item) => item.tipo === 'matriz') || [...unidadePorCnpj.values()][0] || null;

  /* Pessoas. */
  let numero = proximoNumero(pessoas);
  const pessoaPorCpf = new Map(pessoas.map((pessoa) => [digitos(pessoa.cpf), pessoa]));
  const novasPessoas = [];
  const movimentacoes = [];
  for (const item of dados.pessoas || []) {
    numero += 1;
    const id = `${cliente}-imp-p${numero}`;
    const pessoa = {
      id,
      cliente_id: cliente,
      cnpj_id: (item.cnpj && unidadePorCnpj.get(digitos(item.cnpj))?.id) || matriz?.id || null,
      matricula: `MAT${String(numero).padStart(3, '0')}`,
      nome: item.nome,
      cpf: item.cpf,
      nascimento: item.nascimento || null,
      departamento: item.departamento,
      cargo: item.cargo,
      contrato: item.contrato || 'indeterminado',
      admissao: item.admissao,
      salario: item.salario ?? null,
      jornada: item.jornada || '44h semanais',
      gestor: item.gestor || '',
      situacao: item.saiu ? 'Inativo' : 'Ativo',
      desligamento: item.saiu ? { data: item.ultimoDia, tipo: item.tipoDesligamento, motivo: item.motivo } : null,
      ...autoria,
    };
    novasPessoas.push(pessoa);
    pessoaPorCpf.set(digitos(item.cpf), pessoa);
    if (item.saiu) {
      movimentacoes.push({
        id: `${id}-deslig`, cliente_id: cliente, pessoa_id: id, matricula: pessoa.matricula, tipo: 'Desligamento', efetiva: item.ultimoDia,
        motivo: `${item.tipoDesligamento}. ${item.motivo}`, checklist: 'Concluído', ...autoria,
      });
    }
  }
  const pessoaDo = (cpf) => pessoaPorCpf.get(digitos(cpf));

  /* Férias: por período aquisitivo; com início, gozo aprovado; sem início, dias por tirar. */
  const ferias = (dados.ferias || []).map((item, indice) => {
    const pessoa = pessoaDo(item.cpf);
    const fim = umAnoDepois(item.aquisitivo, -1);
    return {
      id: `${cliente}-imp-f${indice + 1}`,
      cliente_id: cliente,
      pessoa_id: pessoa.id,
      matricula: pessoa.matricula,
      aquisitivo_inicio: item.aquisitivo,
      aquisitivo_fim: fim,
      concessivo_fim: umAnoDepois(isoDe(diaDe(fim) + 1), -1),
      situacao: item.inicio ? 'gozada' : 'a programar',
      inicio: item.inicio || null,
      dias: item.dias,
      aprovado_por: item.inicio ? IMPORTACAO : null,
      registrado_por: item.inicio ? IMPORTACAO : null,
      registrado_em: item.inicio ? hoje : null,
    };
  });

  /* Atestados: afastamentos já validados. */
  const afastamentos = (dados.atestados || []).map((item, indice) => {
    const pessoa = pessoaDo(item.cpf);
    return {
      id: `${cliente}-imp-a${indice + 1}`,
      cliente_id: cliente,
      pessoa_id: pessoa.id,
      matricula: pessoa.matricula,
      tipo: item.tipo,
      inicio: item.inicio,
      dias: item.dias,
      fim_previsto: isoDe(diaDe(item.inicio) + item.dias - 1),
      retorno: null,
      atestado: { cid: item.cid, anexo: '' },
      validacao: 'Aprovado',
      validado_por: IMPORTACAO,
      validado_em: hoje,
      inss: item.dias > COM_INSS,
      ...autoria,
    };
  });

  /* Reajustes e mudanças de cargo. */
  for (const [indice, item] of (dados.reajustes || []).entries()) {
    const pessoa = pessoaDo(item.cpf);
    const novo = item.tipo === 'Alteração Salarial' ? { salario: item.novoSalario } : { cargo: item.novoCargo, ...(item.novoSalario ? { salario: item.novoSalario } : {}) };
    movimentacoes.push({
      id: `${cliente}-imp-m${indice + 1}`, cliente_id: cliente, pessoa_id: pessoa.id, matricula: pessoa.matricula, tipo: item.tipo, efetiva: item.efetiva,
      motivo: item.motivo || item.tipo, checklist: 'Concluído', novo, ...autoria,
    });
  }

  /* Benefícios: o catálogo que falta e as adesões, desde a admissão. */
  const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const beneficioPorNome = new Map(beneficios.map((item) => [semAcento(item.nome), item]));
  const novosBeneficios = [];
  for (const [indice, item] of (dados.catalogo || []).entries()) {
    if (beneficioPorNome.has(semAcento(item.nome))) continue;
    const novo = { id: `${cliente}-imp-b${indice + 1}`, cliente_id: cliente, tipo: item.tipo, nome: item.nome, valor_empresa: item.valor, desconto_percentual: Math.round((item.desconto || 0) * 100) / 10000, ...autoria };
    novosBeneficios.push(novo);
    beneficioPorNome.set(semAcento(item.nome), novo);
  }
  const adesoes = (dados.adesoes || [])
    .map((item, indice) => {
      const pessoa = pessoaDo(item.cpf);
      const beneficio = beneficioPorNome.get(item.beneficio);
      if (!pessoa || !beneficio) return null;
      return {
        id: `${cliente}-imp-ad${indice + 1}`, cliente_id: cliente, pessoa_id: pessoa.id, beneficio_id: beneficio.id, desde: pessoa.admissao,
        ate: pessoa.desligamento?.data || null, ...autoria,
      };
    })
    .filter(Boolean);

  return {
    cliente: dados.empresa?.regime ? { regime_tributario: dados.empresa.regime, anexo_simples: dados.empresa.regime === 'Simples Nacional' ? dados.empresa.anexo : null } : null,
    cnpjs: novasUnidades,
    pessoas: novasPessoas,
    movimentacoes,
    ferias,
    afastamentos,
    beneficios: novosBeneficios,
    adesoes,
  };
}
