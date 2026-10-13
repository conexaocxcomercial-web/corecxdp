/**
 * Planilha .xlsx sem dependência (fase 14 do redesenho): grava a planilha
 * modelo de importação e lê a que a empresa sobe de volta.
 *
 * Um .xlsx é um zip de XMLs. Gravar: cada arquivo comprimido (deflate, do
 * zlib do Node) com o CRC-32 do original. Ler: o diretório central do zip, inflate (zlib do
 * Node) e as células de cada aba, com os textos compartilhados. Datas que o
 * Excel guarda como número de série viram aaaa-mm-dd quando a coluna pede
 * data (quem decide é quem lê, em lib/planilhaModelo.js).
 *
 * Só no servidor (usa node:zlib). Testado em testes/xlsx.test.js.
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib';

/* --------------------------------------------------------------- zip */

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = TABELA_CRC[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipar(arquivos, { comprimir = true } = {}) {
  const codificar = new TextEncoder();
  const partes = [];
  const central = [];
  let deslocamento = 0;
  for (const { nome, conteudo } of arquivos) {
    const nomeBytes = codificar.encode(nome);
    const original = typeof conteudo === 'string' ? codificar.encode(conteudo) : conteudo;
    const crc = crc32(original);
    const dados = comprimir ? new Uint8Array(deflateRawSync(original)) : original;
    const metodo = comprimir ? 8 : 0;
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // nomes em UTF-8
    local.setUint16(8, metodo, true); // 8: deflate; 0: guardado
    local.setUint32(14, crc, true);
    local.setUint32(18, dados.length, true);
    local.setUint32(22, original.length, true);
    local.setUint16(26, nomeBytes.length, true);
    partes.push(new Uint8Array(local.buffer), nomeBytes, dados);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint16(10, metodo, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, dados.length, true);
    entrada.setUint32(24, original.length, true);
    entrada.setUint16(28, nomeBytes.length, true);
    entrada.setUint32(42, deslocamento, true);
    central.push(new Uint8Array(entrada.buffer), nomeBytes);
    deslocamento += 30 + nomeBytes.length + dados.length;
  }
  const tamanhoCentral = central.reduce((soma, parte) => soma + parte.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, deslocamento, true);
  const todas = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(todas.reduce((soma, parte) => soma + parte.length, 0));
  let posicao = 0;
  for (const parte of todas) {
    saida.set(parte, posicao);
    posicao += parte.length;
  }
  return saida;
}

function deszipar(bytes) {
  const visao = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fim = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (visao.getUint32(i, true) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error('Arquivo não é uma planilha .xlsx.');
  const total = visao.getUint16(fim + 10, true);
  let posicao = visao.getUint32(fim + 16, true);
  const decodificar = new TextDecoder();
  const arquivos = new Map();
  for (let n = 0; n < total; n += 1) {
    if (visao.getUint32(posicao, true) !== 0x02014b50) throw new Error('Planilha .xlsx corrompida.');
    const metodo = visao.getUint16(posicao + 10, true);
    const compactado = visao.getUint32(posicao + 20, true);
    const tamanhoNome = visao.getUint16(posicao + 28, true);
    const extra = visao.getUint16(posicao + 30, true);
    const comentario = visao.getUint16(posicao + 32, true);
    const local = visao.getUint32(posicao + 42, true);
    const nome = decodificar.decode(bytes.subarray(posicao + 46, posicao + 46 + tamanhoNome));
    const inicio = local + 30 + visao.getUint16(local + 26, true) + visao.getUint16(local + 28, true);
    const dados = bytes.subarray(inicio, inicio + compactado);
    arquivos.set(nome, () => decodificar.decode(metodo === 0 ? dados : inflateRawSync(dados)));
    posicao += 46 + tamanhoNome + extra + comentario;
  }
  return arquivos;
}

/* --------------------------------------------------------------- xml */

const escapar = (texto) =>
  String(texto).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const desescapar = (texto) =>
  texto.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (_, ent) => {
    const nomes = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
    if (nomes[ent.toLowerCase()]) return nomes[ent.toLowerCase()];
    return String.fromCodePoint(ent[1].toLowerCase() === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10));
  });

function coluna(indice) {
  let nome = '';
  for (let n = indice + 1; n > 0; n = Math.floor((n - 1) / 26)) nome = String.fromCharCode(65 + ((n - 1) % 26)) + nome;
  return nome;
}

function indiceDaColuna(referencia) {
  const letras = referencia.replace(/\d+/g, '');
  return [...letras].reduce((soma, letra) => soma * 26 + letra.charCodeAt(0) - 64, 0) - 1;
}

/**
 * Grava a planilha. abas: [{ nome, linhas: [[célula, …], …], larguras? }].
 * A primeira linha de cada aba sai em negrito e fica presa ao rolar.
 */
export function escreverXlsx(abas, { comprimir = true } = {}) {
  const folhas = abas.map((aba, n) => {
    const linhas = aba.linhas
      .map((linha, l) => {
        const celulas = linha
          .map((valor, c) => {
            if (valor === null || valor === undefined || valor === '') return '';
            const ref = `${coluna(c)}${l + 1}`;
            const estilo = l === 0 ? ' s="1"' : '';
            if (typeof valor === 'number') return `<c r="${ref}"${estilo}><v>${valor}</v></c>`;
            return `<c r="${ref}" t="inlineStr"${estilo}><is><t xml:space="preserve">${escapar(valor)}</t></is></c>`;
          })
          .join('');
        return `<row r="${l + 1}">${celulas}</row>`;
      })
      .join('');
    const larguras = (aba.larguras || [])
      .map((largura, c) => `<col min="${c + 1}" max="${c + 1}" width="${largura}" customWidth="1"/>`)
      .join('');
    return {
      nome: `xl/worksheets/sheet${n + 1}.xml`,
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
        (larguras ? `<cols>${larguras}</cols>` : '') +
        `<sheetData>${linhas}</sheetData></worksheet>`,
    };
  });
  const lista = abas.map((aba, n) => `<sheet name="${escapar(aba.nome)}" sheetId="${n + 1}" r:id="rId${n + 1}"/>`).join('');
  const relacoes = abas
    .map((_, n) => `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n + 1}.xml"/>`)
    .join('');
  return zipar([
    {
      nome: '[Content_Types].xml',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        abas.map((_, n) => `<Override PartName="/xl/worksheets/sheet${n + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>',
    },
    {
      nome: '_rels/.rels',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      nome: 'xl/workbook.xml',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets>${lista}</sheets></workbook>`,
    },
    {
      nome: 'xl/_rels/workbook.xml.rels',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        relacoes +
        `<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      nome: 'xl/styles.xml',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '</styleSheet>',
    },
    ...folhas,
  ], { comprimir });
}

/**
 * Lê a planilha: { [nome da aba]: [[célula, …], …] }, com as células como
 * texto (números em ponto, como o Excel guarda). Linhas vazias saem.
 */
export function lerXlsx(bytes) {
  const arquivos = deszipar(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  const ler = (nome) => (arquivos.has(nome) ? arquivos.get(nome)() : null);
  const livro = ler('xl/workbook.xml');
  if (!livro) throw new Error('Arquivo não é uma planilha .xlsx.');
  const relacoes = ler('xl/_rels/workbook.xml.rels') || '';
  const alvo = new Map([...relacoes.matchAll(/<Relationship\b[^>]*>/g)].map(([tag]) => [/Id="([^"]+)"/.exec(tag)?.[1], /Target="([^"]+)"/.exec(tag)?.[1]]));
  const compartilhados = [...(ler('xl/sharedStrings.xml') || '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, si]) =>
    desescapar([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => t).join(''))
  );
  const resultado = {};
  for (const [tag] of livro.matchAll(/<sheet\b[^>]*\/?>/g)) {
    const nome = desescapar(/name="([^"]*)"/.exec(tag)?.[1] || '');
    const id = /r:id="([^"]+)"/.exec(tag)?.[1];
    const caminho = alvo.get(id) || '';
    const xml = ler(caminho.startsWith('/') ? caminho.slice(1) : `xl/${caminho.replace(/^\.\//, '')}`);
    if (!xml) continue;
    const linhas = [];
    for (const [, atributos, corpo] of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const numero = Number(/\br="(\d+)"/.exec(atributos)?.[1] || linhas.length + 1);
      const linha = [];
      for (const [, atrib, conteudo = ''] of corpo.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\br="([A-Z]+\d+)"/.exec(atrib)?.[1];
        const tipo = /\bt="([^"]+)"/.exec(atrib)?.[1];
        const v = /<v>([\s\S]*?)<\/v>/.exec(conteudo)?.[1];
        let valor = '';
        if (tipo === 's') valor = compartilhados[Number(v)] ?? '';
        else if (tipo === 'inlineStr') valor = desescapar([...conteudo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => t).join(''));
        else if (v !== undefined) valor = desescapar(v);
        linha[ref ? indiceDaColuna(ref) : linha.length] = valor;
      }
      const celulas = Array.from(linha, (valor) => (valor === undefined ? '' : String(valor).trim()));
      if (celulas.some((valor) => valor !== '')) linhas.push({ numero, celulas });
    }
    resultado[nome] = linhas;
  }
  return resultado;
}
