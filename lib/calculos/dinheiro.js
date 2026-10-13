/**
 * Dinheiro em centavos: arredonda meio para cima (121,575 vira 121,58). A
 * conta passa por 12 algarismos significativos antes, para o erro do ponto
 * flutuante (121,57499999…) não puxar para baixo.
 */
export function centavos(valor) {
  const emCentavos = Number((Number(valor) * 100).toPrecision(12));
  return Math.round(emCentavos) / 100;
}

export function somar(valores) {
  return centavos(valores.reduce((total, valor) => total + (Number(valor) || 0), 0));
}
