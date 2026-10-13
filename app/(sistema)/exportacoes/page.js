import { alcanceAtual } from '@/lib/dados/alcance';
import { pode } from '@/lib/permissoes';
import { Cabecalho, Cartao, Faixa, Wrap } from '@/componentes/Estrutura';
import { Icone } from '@/componentes/Icones';

export const metadata = { title: 'Exportações' };

/**
 * Exportações (fase 15 do redesenho): CSV que abre direto no Excel e a
 * página para imprimir. Sem CPF, salário individual nem CID.
 */
export default async function Exportacoes() {
  const alcance = await alcanceAtual();
  const podeExportar = pode(alcance?.perfil, 'exportar');
  const temCarteira = alcance?.demonstracao && ['parceiro', 'admin'].includes(alcance?.perfil);
  const cliente = alcance?.cliente;
  const itens = [
    ...(temCarteira
      ? [
          { href: '/exportacoes/carteira.csv', titulo: 'Carteira em CSV', texto: 'Os clientes lado a lado: pessoas, custo estimado, fator, turnover, absenteísmo e o que pede atenção.', icone: 'download', baixar: true },
          { href: '/carteira/imprimir', titulo: 'Carteira para imprimir', texto: 'A mesma comparação numa página para imprimir ou salvar em PDF.', icone: 'print' },
        ]
      : []),
    ...(cliente
      ? [
          { href: '/exportacoes/indicadores.csv', titulo: `Indicadores de ${cliente.nome}`, texto: 'Os números de cada tema dos últimos 12 meses, com saúde agregada e custos como estimativa.', icone: 'download', baixar: true },
          { href: '/exportacoes/colaboradores.csv', titulo: `Colaboradores de ${cliente.nome}`, texto: 'Matrícula, nome, unidade, departamento, cargo, contrato, admissão e situação. Sem CPF nem salário.', icone: 'download', baixar: true },
        ]
      : []),
  ];
  return (
    <>
      <Cabecalho titulo="Exportações" subtitulo="CSV que abre direto no Excel e páginas para imprimir" />
      <Wrap>
        {!podeExportar ? <Faixa tom="alerta">Este acesso não exporta.</Faixa> : null}
        {!cliente && !temCarteira ? <Faixa icone="info">Escolha um cliente para exportar os dados dele.</Faixa> : null}
        <div className="ind-temas">
          {itens.map((item) => (
            <Cartao key={item.href} className="exp-cartao">
              <h2 className="ind-tema-t">{item.titulo}</h2>
              <p className="nota">{item.texto}</p>
              <a className="btn btn-fant" href={item.href} {...(item.baixar ? { download: true } : { target: '_blank', rel: 'noopener' })}>
                <Icone nome={item.icone} />
                {item.baixar ? 'Baixar' : 'Abrir'}
              </a>
            </Cartao>
          ))}
        </div>
      </Wrap>
    </>
  );
}
