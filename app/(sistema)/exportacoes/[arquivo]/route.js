import { lerCarteira, quemExporta } from '@/lib/dados/carteira';
import { listarPessoas } from '@/lib/dados/pessoas';
import { lerCentral } from '@/lib/dados/indicadores';
import { COLUNAS_DA_CARTEIRA, COLUNAS_DE_COLABORADORES, paraCsv } from '@/lib/exportacao';
import { formatarIndicador } from '@/lib/paineis';
import { mensagemParaTela } from '@/lib/avisos';

/**
 * Exportações em CSV (fase 15 do redesenho): a carteira (comparação entre
 * clientes), os colaboradores do cliente (sem CPF nem salário) e os
 * indicadores do cliente. A permissão e o alcance são conferidos aqui.
 */
const ARQUIVOS = {
  'carteira.csv': async () => {
    const carteira = await lerCarteira('nome');
    return paraCsv(COLUNAS_DA_CARTEIRA, carteira.clientes);
  },
  'colaboradores.csv': async (alcance) => {
    if (!alcance.cliente) throw new Error('sem cliente');
    const { pessoas } = await listarPessoas();
    return paraCsv(COLUNAS_DE_COLABORADORES, pessoas);
  },
  'indicadores.csv': async (alcance) => {
    if (!alcance.cliente) throw new Error('sem cliente');
    const { temas } = await lerCentral({ meses: 12, departamento: '' });
    const linhas = temas.flatMap((tema) =>
      [tema.principal, ...tema.apoio].map((item) => ({ tema: tema.nome, nome: item.nome, valor: item.oculto ? 'oculto (menos de 3 pessoas)' : formatarIndicador(item.valor, item.formato), apoio: item.apoio, estimativa: item.estimativa ? 'sim' : '' }))
    );
    return paraCsv(
      [
        { rotulo: 'Tema', valor: (linha) => linha.tema },
        { rotulo: 'Indicador', valor: (linha) => linha.nome },
        { rotulo: 'Valor (últimos 12 meses)', valor: (linha) => linha.valor },
        { rotulo: 'Apoio', valor: (linha) => linha.apoio },
        { rotulo: 'Estimativa', valor: (linha) => linha.estimativa },
      ],
      linhas
    );
  },
};

export async function GET(_pedido, { params }) {
  const { arquivo } = await params;
  const gerar = ARQUIVOS[arquivo];
  if (!gerar) return new Response('Exportação não encontrada.', { status: 404 });
  try {
    const alcance = await quemExporta();
    const conteudo = await gerar(alcance);
    const nome = alcance.cliente ? `${arquivo.replace('.csv', '')}-${alcance.cliente.codigo}.csv` : arquivo;
    return new Response(conteudo, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nome}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    if (erro?.message === 'sem cliente') return new Response('Escolha um cliente antes de exportar.', { status: 400 });
    return new Response(mensagemParaTela(erro, 'Não foi possível exportar agora.'), { status: 403 });
  }
}
