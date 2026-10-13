/**
 * A cópia em memória da demonstração. Os dados completos (lib/demo/gerador.js)
 * são a fonte única: as abas que as telas atuais leem saem deles a cada
 * leitura, e o que essas telas gravam vira alteração nos dados. Assim, o que
 * a Gestão aprova em Pendências aparece em Atestados, e a ocorrência
 * cadastrada em Ocorrências aparece no Início e na ficha.
 *
 * O número de cada linha é a posição do item na lista de origem
 * (fontesDasAbas): os dados só crescem pelo fim, então o número não muda.
 * Puro, sem Next: testado em testes/memoria.test.js.
 */
import { fontesDasAbas, paraTabelas } from './gerador.js';

export class ErroDaMemoria extends Error {}

const DIA = 86400000;
const somarDias = (iso, dias) => new Date(Date.parse(`${iso}T00:00:00Z`) + dias * DIA).toISOString().slice(0, 10);
const texto = (valor) => String(valor ?? '').trim();

export function criarMemoria(dados, usuarios) {
  let sequencia = 0;
  const novoId = (cliente, tipo) => {
    sequencia += 1;
    return `${cliente}-${tipo}n${sequencia}`;
  };

  function comLinhas({ cabecalho, registros }) {
    return { cabecalho: [...cabecalho], registros: registros.map((registro, indice) => ({ ...registro, _linha: indice + 2 })) };
  }

  function tabela(aba) {
    if (aba === 'Usuarios') return usuarios;
    const encontrada = paraTabelas(dados)[aba];
    if (!encontrada) throw new ErroDaMemoria(`A aba ${aba} não existe nos dados de demonstração.`);
    return encontrada;
  }

  function lerAba(aba) {
    return comLinhas(tabela(aba));
  }

  function clienteDe(codigo) {
    const cliente = dados.clientes.find((item) => item.codigo.toLowerCase() === texto(codigo).toLowerCase());
    if (!cliente) throw new ErroDaMemoria(`O cliente ${codigo} não existe nos dados de demonstração.`);
    return cliente;
  }

  function pessoaDe(cliente, matricula) {
    const pessoa = dados.pessoas.find((item) => item.cliente_id === cliente.id && item.matricula === texto(matricula));
    if (!pessoa) throw new ErroDaMemoria(`A matrícula ${matricula} não existe no cliente ${cliente.codigo}.`);
    return pessoa;
  }

  /** Uma linha nova numa aba vira um item novo nos dados, com autoria. */
  function anexarLinha(aba, valores, autor) {
    if (aba === 'Usuarios') throw new ErroDaMemoria('Os logins da demonstração não mudam pela tela.');
    const { cabecalho } = tabela(aba);
    const linha = Object.fromEntries(cabecalho.map((coluna, indice) => [coluna, valores[indice] ?? '']));
    const cliente = clienteDe(linha.Cliente);
    const registro = { registrado_por: autor, registrado_em: texto(linha.Data_Registro) || dados.hoje };

    if (aba === 'Colaboradores') {
      const cnpjs = dados.cnpjs.filter((item) => item.cliente_id === cliente.id);
      const cnpj = cnpjs.find((item) => item.cnpj === texto(linha.CNPJ)) || cnpjs.find((item) => item.tipo === 'matriz') || cnpjs[0];
      dados.pessoas.push({
        id: novoId(cliente.id, 'p'),
        cliente_id: cliente.id,
        cnpj_id: cnpj?.id || null,
        matricula: texto(linha.Matricula),
        nome: texto(linha.Nome_Completo),
        cpf: texto(linha.CPF),
        nascimento: null,
        departamento: texto(linha.Departamento),
        cargo: texto(linha.Cargo),
        contrato: null,
        admissao: texto(linha.Data_Admissao),
        salario: null,
        jornada: null,
        gestor: texto(linha.Gestor_Imediato),
        situacao: texto(linha.Status) || 'Ativo',
        desligamento: null,
        registrado_por: autor,
        registrado_em: dados.hoje,
      });
      return;
    }

    const pessoa = pessoaDe(cliente, linha.Matricula);
    const base = { cliente_id: cliente.id, pessoa_id: pessoa.id, matricula: pessoa.matricula, ...registro };

    if (aba === 'Ocorrencias_Faltas') {
      dados.ocorrencias.push({
        id: novoId(cliente.id, 'o'),
        ...base,
        codigo: texto(linha.ID_Ocorrencia),
        data: texto(linha.Data_Falta),
        tipo: texto(linha.Tipo_Ocorrencia),
        justificada: texto(linha.Justificada) || 'Não',
        motivo: texto(linha.Motivo),
      });
      return;
    }

    if (aba === 'Atestados') {
      const dias = Number(linha.Dias_Afastamento) || 0;
      const inicio = texto(linha.Data_Inicio);
      const fim = somarDias(inicio, Math.max(dias, 1) - 1);
      const validacao = texto(linha.Status_Validacao) || 'Pendente';
      const cid = texto(linha.CID);
      dados.afastamentos.push({
        id: novoId(cliente.id, 'a'),
        ...base,
        codigo: texto(linha.ID_Atestado),
        tipo: 'Doença',
        inicio,
        fim_previsto: fim,
        dias,
        retorno: fim < dados.hoje ? somarDias(fim, 1) : null,
        atestado: { cid: cid && cid.toLowerCase() !== 'não informado' ? cid.toUpperCase() : 'não informado', anexo: texto(linha.Anexo_URL) },
        validacao,
        validado_por: validacao === 'Pendente' ? null : autor,
        validado_em: validacao === 'Pendente' ? null : dados.hoje,
        inss: dias > 15,
      });
      return;
    }

    if (aba === 'Movimentacoes_DP') {
      const tipo = texto(linha.Tipo_Movimentacao);
      const efetiva = texto(linha.Data_Efetiva);
      dados.movimentacoes.push({
        id: novoId(cliente.id, 'm'),
        ...base,
        codigo: texto(linha.ID_Movimentacao),
        tipo,
        efetiva,
        motivo: texto(linha.Motivo),
        checklist: texto(linha.Status_Checklist) || 'Pendente',
      });
      // O desligamento registrado na tela atual também tira a pessoa do quadro.
      if (tipo === 'Desligamento' && !pessoa.desligamento) {
        pessoa.desligamento = { data: efetiva, tipo: 'Não informado', motivo: texto(linha.Motivo) };
        if (efetiva <= dados.hoje) pessoa.situacao = 'Inativo';
      }
      return;
    }

    throw new ErroDaMemoria(`A aba ${aba} não recebe registros nos dados de demonstração.`);
  }

  const CAMPOS = {
    Colaboradores: { Status: (item, valor) => Object.assign(item, { situacao: valor }) },
    Atestados: {
      Status_Validacao: (item, valor, autor) =>
        Object.assign(item, {
          validacao: valor,
          validado_por: valor === 'Pendente' ? null : autor,
          validado_em: valor === 'Pendente' ? null : dados.hoje,
        }),
    },
    Movimentacoes_DP: { Status_Checklist: (item, valor) => Object.assign(item, { checklist: valor }) },
  };

  function atualizarCampo(aba, numeroDaLinha, coluna, valor, autor) {
    const lista = fontesDasAbas(dados)[aba];
    if (!lista) throw new ErroDaMemoria(`A aba ${aba} não existe nos dados de demonstração.`);
    const alterar = CAMPOS[aba]?.[coluna];
    if (!alterar) throw new ErroDaMemoria(`A coluna ${coluna} não muda pela tela na aba ${aba}.`);
    const item = lista[Number(numeroDaLinha) - 2];
    if (!item) throw new ErroDaMemoria(`A linha ${numeroDaLinha} não existe na aba ${aba}.`);
    alterar(item, texto(valor), autor);
  }

  /** Para os repositórios novos (lib/dados): altera um item pelo id. */
  function alterar(colecao, id, campos) {
    const item = dados[colecao]?.find((registro) => registro.id === id);
    if (!item) throw new ErroDaMemoria(`O registro ${id} não existe em ${colecao}.`);
    Object.assign(item, campos);
    return item;
  }

  return { dados, lerAba, anexarLinha, atualizarCampo, alterar };
}
