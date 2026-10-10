/**
 * Erro cuja mensagem foi escrita para quem usa o sistema e pode ir para
 * a tela. Qualquer outro erro é detalhe técnico da fonte de dados: vai
 * para o log do servidor e a tela mostra um texto neutro.
 */
export class AvisoAoUsuario extends Error {}

export function mensagemParaTela(erro, padrao) {
  if (erro instanceof AvisoAoUsuario) return erro.message;
  console.error(erro);
  return padrao;
}
