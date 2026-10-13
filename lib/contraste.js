/**
 * White-label com checagem de contraste (fase 15 do redesenho): as cores de
 * um parceiro só entram no lugar do violeta e do lilás da marca se forem
 * legíveis onde o sistema as usa (WCAG 2.1):
 *
 *   texto preto sobre o violeta (botões de ação)          4,5:1
 *   violeta como marca sobre o papel claro e o escuro      3:1
 *   texto de ação (violeta escurecido) sobre o papel       4,5:1
 *   texto grafite sobre o lilás (pílulas, avatar)          4,5:1
 *
 * Se alguma falhar, a marca padrão continua e o motivo fica registrado.
 * Puro; testado em testes/carteira.test.js.
 */

const PAPEL_CLARO = '#ffffff';
const PAPEL_ESCURO = '#1e1e1e';
const PRETO = '#000000';
const GRAFITE = '#1e1e1e';

function rgb(hex) {
  const limpo = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(limpo)) return null;
  return [0, 2, 4].map((i) => parseInt(limpo.slice(i, i + 2), 16));
}

/** Mistura em sRGB, como o color-mix(in srgb, a p%, b) do CSS. */
export function misturar(a, b, proporcao) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((canal, i) => Math.round(canal * proporcao + y[i] * (1 - proporcao)).toString(16).padStart(2, '0')).join('')}`;
}

function luminancia(hex) {
  const [r, g, b] = rgb(hex).map((canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return Math.round(((claro + 0.05) / (escuro + 0.05)) * 100) / 100;
}

/**
 * As cores do parceiro ({ violeta, lilas }), conferidas. Devolve as que
 * entram (ou null) e o resultado de cada checagem.
 */
export function coresDoParceiro(cores) {
  if (!cores || (!cores.violeta && !cores.lilas)) return { aplicar: null, checagens: [], motivo: null };
  const violeta = cores.violeta || '#7371ff';
  const lilas = cores.lilas || '#dbbfff';
  if (!rgb(violeta) || !rgb(lilas)) return { aplicar: null, checagens: [], motivo: 'cores em formato inválido (use #rrggbb)' };
  const textoDeAcao = misturar(violeta, PRETO, 0.7);
  const checagens = [
    { onde: 'texto preto sobre o botão', razao: contraste(PRETO, violeta), minimo: 4.5 },
    { onde: 'marca sobre o papel claro', razao: contraste(violeta, PAPEL_CLARO), minimo: 3 },
    { onde: 'marca sobre o papel escuro', razao: contraste(violeta, PAPEL_ESCURO), minimo: 3 },
    { onde: 'texto de ação sobre o papel claro', razao: contraste(textoDeAcao, PAPEL_CLARO), minimo: 4.5 },
    { onde: 'texto sobre o lilás', razao: contraste(GRAFITE, lilas), minimo: 4.5 },
  ].map((item) => ({ ...item, passa: item.razao >= item.minimo }));
  const falhas = checagens.filter((item) => !item.passa);
  return {
    aplicar: falhas.length ? null : { violeta, lilas },
    checagens,
    motivo: falhas.length ? `contraste insuficiente: ${falhas.map((item) => `${item.onde} (${String(item.razao).replace('.', ',')}:1)`).join('; ')}` : null,
  };
}
