import Link from 'next/link';
import { Icone } from '@/componentes/Icones';
import { Numero, Numeros } from '@/componentes/Estrutura';
import { Prazo } from '@/componentes/Prazos';
import { Status } from '@/componentes/Sinais';
import { dataCurta, formatarData, iniciais } from '@/lib/formato';

/*
 * Peças da ficha do colaborador (fase 6 do redesenho): o resumo em cinco
 * segundos, os alertas dela, as ações rápidas, os números e a linha do
 * tempo. Os dados vêm de lib/dados/pessoas.js.
 */

const CONTRATO = {
  indeterminado: 'Prazo indeterminado',
  experiência: 'Experiência',
  estágio: 'Estágio',
  aprendiz: 'Aprendiz',
  temporário: 'Temporário',
};

export function nomeDoContrato(contrato) {
  return contrato ? CONTRATO[contrato] || contrato : null;
}

/** Nome, cargo, unidade, situação e tempo de casa, com o avatar lilás. */
export function ResumoDaPessoa({ ficha }) {
  const { pessoa, numeros } = ficha;
  const linha = [pessoa.cargo, pessoa.departamento].filter(Boolean).join(' · ');
  return (
    <div className="ficha-resumo">
      <span className="avatar avatar-ficha" aria-hidden="true">
        {iniciais(pessoa.nome)}
      </span>
      <div className="ficha-resumo-txt">
        <p className="ficha-mat num">{pessoa.matricula}</p>
        <p className="ficha-cargo">{linha || 'Cargo não informado'}</p>
        {pessoa.cnpj ? <p className="ficha-cnpj">{pessoa.cnpj.nome}</p> : null}
        <div className="ficha-situacao">
          <Status>{pessoa.situacao}</Status>
          <span className="ficha-casa">
            {pessoa.admissaoFutura
              ? `começa em ${formatarData(pessoa.admissao)}`
              : pessoa.desligamento?.data
                ? `${numeros.tempoDeCasa} de casa, saiu em ${formatarData(pessoa.desligamento.data)}`
                : `${numeros.tempoDeCasa} de casa`}
          </span>
        </div>
      </div>
    </div>
  );
}

const ABA_DA_APROVACAO = { atestado: 'saude', ferias: 'ferias', desligamento: 'desligamento' };

/** Os alertas dela: aprovações esperando e prazos, cada um levando à aba certa. */
export function AlertasDaPessoa({ alertas, base, quem }) {
  const { aprovacoes, prazos } = alertas;
  const visiveis = prazos.filter((item) => item.grupo !== 'adiante');
  if (!aprovacoes.length && !visiveis.length) return null;
  return (
    <section className="ficha-alertas" aria-label="Alertas">
      <ul>
        {aprovacoes.map((item) => (
          <li key={item.id}>
            <Link href={`/pendencias?assunto=${item.tema}`} className="ficha-alerta">
              <span className="quando semana">{item.tipo === 'desligamento' ? 'para concluir' : `esperando ${quem}`}</span>
              <span className="ficha-alerta-t">{item.titulo}</span>
              <Icone nome="chevron_right" className="prazo-ir" />
            </Link>
          </li>
        ))}
        {visiveis.map((item) => (
          <li key={item.id}>
            <Link href={`${base}?aba=${item.aba || 'resumo'}`} scroll={false} className="ficha-alerta">
              <Prazo dias={item.dias} grupo={item.grupo} data={item.data} />
              <span className="ficha-alerta-t">{item.titulo}</span>
              <Icone nome="chevron_right" className="prazo-ir" />
            </Link>
          </li>
        ))}
        {aprovacoes.length === 0 ? null : (
          <li className="ficha-alertas-pe">
            <span className="nota">Aprovar e rejeitar ficam em Pendências.</span>
          </li>
        )}
      </ul>
    </section>
  );
}

/** Ações rápidas: cada uma abre o lançamento já com a pessoa escolhida. */
export function AcoesRapidas({ pessoa }) {
  const m = encodeURIComponent(pessoa.matricula);
  const acoes = [
    { href: `/atestados?lancar=1&matricula=${m}`, rotulo: 'Atestado', icone: 'clinical_notes' },
    { href: `/ocorrencias?lancar=1&matricula=${m}`, rotulo: 'Ocorrência', icone: 'event_busy' },
    { href: `/movimentacoes?lancar=1&matricula=${m}`, rotulo: 'Movimentação', icone: 'swap_horiz' },
    { href: `/movimentacoes?lancar=1&matricula=${m}&tipo=Desligamento`, rotulo: 'Desligar', icone: 'person_remove' },
  ];
  return (
    <nav className="ficha-acoes" aria-label="Lançar para esta pessoa">
      {acoes.map((acao) => (
        <Link key={acao.rotulo} href={acao.href} className="btn btn-fant btn-mini">
          <Icone nome={acao.icone} />
          {acao.rotulo}
        </Link>
      ))}
    </nav>
  );
}

/** Os números dela: tempo de casa, atestados e faltas em 12 meses, saldo de férias. */
export function NumerosDaPessoa({ ficha, base }) {
  const { numeros, completo, pessoa } = ficha;
  const { ferias } = numeros;
  // "13 anos e 3 meses": o número fica com a parte maior, o resto vai para o apoio.
  const [maior, ...resto] = numeros.tempoDeCasa.split(' e ');
  return (
    <Numeros>
      <Numero
        rotulo="Tempo de casa"
        valor={maior}
        apoio={[resto.length ? `e ${resto.join(' e ')}` : null, pessoa.admissao ? `desde ${formatarData(pessoa.admissao)}` : null]
          .filter(Boolean)
          .join(', ')}
      />
      <Numero
        rotulo="Atestados em 12 meses"
        valor={`${numeros.diasDeAtestado} ${numeros.diasDeAtestado === 1 ? 'dia' : 'dias'}`}
        apoio={`${numeros.atestados} ${numeros.atestados === 1 ? 'atestado' : 'atestados'}`}
        href={`${base}?aba=saude`}
      />
      <Numero
        rotulo="Faltas em 12 meses"
        valor={numeros.faltas}
        apoio={numeros.faltas ? `${numeros.faltasInjustificadas} sem justificativa` : 'nenhuma falta'}
        href={`${base}?aba=ocorrencias`}
      />
      {completo ? (
        <Numero
          rotulo="Saldo de férias"
          valor={`${ferias.dias} ${ferias.dias === 1 ? 'dia' : 'dias'}`}
          tom={ferias.vencidos ? 'var(--critico)' : undefined}
          apoio={[
            ferias.vencidos ? `${ferias.vencidos} vencidos` : null,
            ferias.emAquisicao ? `+ ${String(ferias.emAquisicao).replace('.', ',')} em aquisição` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'nada pendente'}
          href={`${base}?aba=ferias`}
        />
      ) : null}
    </Numeros>
  );
}

/** Pares de rótulo e valor, em duas colunas no computador. */
export function Dados({ itens }) {
  return (
    <dl className="dados">
      {itens.map((item) => (
        <div key={item.rotulo}>
          <dt>{item.rotulo}</dt>
          <dd>{item.valor ?? <span className="dados-vazio">não informado</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Todos os eventos em ordem de data, com quem registrou cada um. */
export function LinhaDoTempo({ itens, base, limite }) {
  const lista = limite ? itens.slice(0, limite) : itens;
  if (lista.length === 0) return <p className="nota">Nenhum registro ainda.</p>;
  return (
    <ol className="tempo">
      {lista.map((item) => (
        <li key={item.id} className="tempo-i">
          <span className="tempo-ponto" aria-hidden="true" />
          <div className="tempo-txt">
            <p className="tempo-data num">{formatarData(item.data)}</p>
            <Link href={`${base}?aba=${item.aba}`} scroll={false} className="tempo-t">
              {item.tipo}
            </Link>
            {item.texto ? <p className="tempo-d">{item.texto}</p> : null}
            {item.autor ? (
              <p className="tempo-autor">
                registrado por {item.autor}
                {item.em ? ` em ${dataCurta(item.em)}` : ''}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
