import { abasDoModelo } from '@/lib/planilhaModelo';
import { escreverXlsx } from '@/lib/xlsx';

/**
 * A planilha modelo de importação (fase 14 do redesenho), gerada na hora:
 * a aba de instruções e uma aba por assunto, com o cabeçalho (obrigatórias
 * com *) e uma linha de exemplo. O acesso passa pelo middleware.
 */
export function GET() {
  const arquivo = escreverXlsx(abasDoModelo());
  return new Response(arquivo, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="planilha-modelo-de-importacao.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
