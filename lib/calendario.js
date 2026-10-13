/**
 * Dias como números inteiros (dias desde 1970, em UTC), feriados nacionais
 * e dia útil. Puro: usado por lib/prazos.js e testado em
 * testes/calendario.test.js.
 */
import { FERIADOS_MOVEIS, FERIADOS_NACIONAIS } from './regrasDePrazo.js';

const DIA = 86400000;

export function diaDe(iso) {
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(ano, mes - 1, dia) / DIA);
}

export function isoDe(dia) {
  return new Date(dia * DIA).toISOString().slice(0, 10);
}

export function diaDaData(ano, mes, dia) {
  return Math.floor(Date.UTC(ano, mes - 1, dia) / DIA);
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return diaDaData(ano, mes, dia);
}

const porAno = new Map();

/** Os feriados nacionais do ano, como Map de dia → nome. */
export function feriadosDoAno(ano) {
  if (!porAno.has(ano)) {
    const mapa = new Map();
    for (const feriado of FERIADOS_NACIONAIS) mapa.set(diaDaData(ano, feriado.mes, feriado.dia), feriado.nome);
    const domingo = pascoa(ano);
    for (const feriado of FERIADOS_MOVEIS) mapa.set(domingo + feriado.diasDaPascoa, feriado.nome);
    porAno.set(ano, mapa);
  }
  return porAno.get(ano);
}

export function diaDaSemanaDe(dia) {
  return new Date(dia * DIA).getUTCDay();
}

export function feriadoEm(dia) {
  return feriadosDoAno(new Date(dia * DIA).getUTCFullYear()).get(dia) || null;
}

/** Segunda a sexta, fora dos feriados nacionais. */
export function ehDiaUtil(dia) {
  const semana = diaDaSemanaDe(dia);
  return semana !== 0 && semana !== 6 && !feriadoEm(dia);
}

/** O próprio dia, se útil; senão, o dia útil anterior. */
export function diaUtilAnterior(dia) {
  let d = dia;
  while (!ehDiaUtil(d)) d -= 1;
  return d;
}

/** Por que o dia não é útil: "domingo", "sábado" ou o nome do feriado. */
export function motivoDeNaoSerUtil(dia) {
  const semana = diaDaSemanaDe(dia);
  if (semana === 0) return 'domingo';
  if (semana === 6) return 'sábado';
  return feriadoEm(dia);
}
