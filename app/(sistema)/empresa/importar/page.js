import { permissoesAtuais } from '@/lib/dados/alcance';
import { emDemonstracao } from '@/lib/dados/estrutura';
import { Cabecalho, Faixa, Wrap } from '@/componentes/Estrutura';
import { AbasDaEmpresa } from '@/componentes/AbasDaEmpresa';
import { ImportarPlanilha } from '@/componentes/Empresa';

export const metadata = { title: 'Importar planilha' };

/**
 * Importação da planilha modelo (fase 14 do redesenho; conceito › 11):
 * baixar o modelo, subir a planilha preenchida, ver os erros por aba, linha
 * e coluna, corrigir no Excel e subir de novo; sem erros, importar.
 */
export default async function ImportarPlanilhaPagina() {
  const permissoes = await permissoesAtuais();
  return (
    <>
      <Cabecalho titulo="Importar planilha" subtitulo="para trazer o histórico de uma empresa que já existe" />
      <Wrap>
        <AbasDaEmpresa atual="importar" />
        {!emDemonstracao() ? <Faixa icone="info">A importação ainda não está disponível nesta conta.</Faixa> : null}
        <Faixa icone="info">
          Quem já está no quadro (pelo CPF) fica de fora: a importação só acrescenta. Os prazos que venceram antes da implantação aparecem como "a conferir" até a revisão terminar.
        </Faixa>
        <ImportarPlanilha podeImportar={permissoes.lancar && emDemonstracao()} />
      </Wrap>
    </>
  );
}
