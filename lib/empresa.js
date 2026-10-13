/**
 * Dados da empresa (fase 14 do redesenho): regime tributário, anexo do
 * Simples (por enquanto, como no conceito › 11) e o percentual de encargos
 * próprio, que substitui o padrão do regime na estimativa.
 *
 * Puro; testado em testes/documentos.test.js.
 */
import { LIMITES_DO_PERCENTUAL } from './tabelas.js';

export const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];
export const ANEXOS = ['I', 'II', 'III', 'IV', 'V'];

export class ErroDaEmpresa extends Error {}

/** entrada: { regime, anexo, percentual (em %, vazio para o padrão) }. */
export function montarDadosDaEmpresa(entrada) {
  const regime = String(entrada.regime || '').trim();
  if (!REGIMES.includes(regime)) throw new ErroDaEmpresa('Escolha o regime tributário.');
  const anexo = String(entrada.anexo || '').trim();
  if (anexo && !ANEXOS.includes(anexo)) throw new ErroDaEmpresa('Escolha o anexo do Simples Nacional.');
  const texto = String(entrada.percentual ?? '').trim().replace('%', '').replace(',', '.');
  let percentual = null;
  if (texto) {
    const valor = Number(texto) / 100;
    if (!Number.isFinite(valor) || valor < LIMITES_DO_PERCENTUAL.minimo || valor > LIMITES_DO_PERCENTUAL.maximo) {
      throw new ErroDaEmpresa(`O percentual de encargos vai de ${LIMITES_DO_PERCENTUAL.minimo * 100}% a ${LIMITES_DO_PERCENTUAL.maximo * 100}%. Deixe em branco para usar o padrão do regime.`);
    }
    percentual = Math.round(valor * 10000) / 10000;
  }
  return {
    regime_tributario: regime,
    anexo_simples: regime === 'Simples Nacional' ? anexo || null : null,
    percentual_encargos: percentual,
  };
}
