'use client';

import Link from 'next/link';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { enviarPlanilha, salvarEmpresa } from '@/app/acoes';
import { Selecao, Texto } from '@/componentes/Campos';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { ANEXOS, REGIMES } from '@/lib/empresa';

/*
 * Empresa (fase 14 do redesenho): o formulário do regime tributário, do
 * anexo do Simples e do percentual de encargos; e a importação da planilha
 * modelo, em dois passos com o mesmo arquivo: conferir (erros por aba,
 * linha e coluna) e importar.
 */

function ErroNaFolha({ erro }) {
  if (!erro) return null;
  return (
    <div className="folha-erro">
      <div className="faixa erro" role="alert">
        <Icone nome="error" />
        <span>{erro}</span>
      </div>
    </div>
  );
}

export function FormularioDaEmpresa({ regime, anexo, percentual }) {
  const [aberta, setAberta] = useState(false);
  const [escolhido, setEscolhido] = useState(regime || '');
  const [estado, executar, enviando] = useActionState(salvarEmpresa, null);
  useEffect(() => {
    if (estado?.ok) setAberta(false);
  }, [estado]);

  function enviar(evento) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => executar(dados));
  }

  return (
    <>
      <button type="button" className="btn btn-fant" onClick={() => setAberta(true)} aria-haspopup="dialog">
        <Icone nome="edit" />
        Mudar regime e encargos
      </button>
      <Folha aberta={aberta} aoFechar={() => setAberta(false)} titulo="Regime e encargos" descricao="O percentual de encargos entra no custo estimado de pessoal.">
        <form onSubmit={enviar} className="folha-form" aria-busy={enviando}>
          <div className="folha-corpo">
            {aberta ? (
              <>
                <Selecao
                  rotulo="Regime tributário"
                  nome="regime"
                  opcoes={[{ valor: '', texto: 'Escolha o regime' }, ...REGIMES]}
                  value={escolhido}
                  onChange={(evento) => setEscolhido(evento.target.value)}
                />
                {escolhido === 'Simples Nacional' ? (
                  <Selecao
                    rotulo="Anexo do Simples"
                    nome="anexo"
                    defaultValue={anexo || ''}
                    opcoes={[{ valor: '', texto: 'Não sei (a conferir)' }, ...ANEXOS.map((item) => ({ valor: item, texto: `Anexo ${item}` }))]}
                    dica="no Anexo IV, o INSS patronal é pago à parte"
                  />
                ) : null}
                <Texto
                  rotulo="Percentual de encargos (%)"
                  nome="percentual"
                  inputMode="decimal"
                  placeholder="padrão do regime"
                  defaultValue={percentual === null || percentual === undefined ? '' : String(Math.round(percentual * 10000) / 100).replace('.', ',')}
                  dica="opcional"
                />
                <p className="nota">Em branco, vale o padrão do regime. Ajuste se a contabilidade indicar outro valor.</p>
              </>
            ) : null}
          </div>
          <ErroNaFolha erro={estado?.erro} />
          <div className="folha-pe">
            <button type="button" className="btn btn-fant" onClick={() => setAberta(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-acao" disabled={enviando}>
              <Icone nome={enviando ? 'hourglass_empty' : 'check'} />
              {enviando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Folha>
    </>
  );
}

const NOMES_DO_RESUMO = [
  ['ativos', 'pessoa no quadro', 'pessoas no quadro'],
  ['exColaboradores', 'ex-colaborador', 'ex-colaboradores'],
  ['ferias', 'período de férias', 'períodos de férias'],
  ['atestados', 'atestado', 'atestados'],
  ['reajustes', 'reajuste', 'reajustes'],
  ['beneficios', 'benefício no catálogo', 'benefícios no catálogo'],
  ['adesoes', 'adesão a benefício', 'adesões a benefícios'],
  ['unidades', 'unidade', 'unidades'],
];

export function ImportarPlanilha({ podeImportar }) {
  const [estado, executar, enviando] = useActionState(enviarPlanilha, null);
  const [arquivo, setArquivo] = useState(null);
  const formulario = useRef(null);
  const resultado = useRef(null);

  useEffect(() => {
    if (estado) resultado.current?.focus();
  }, [estado]);

  function enviar(acao) {
    if (!formulario.current) return;
    const dados = new FormData(formulario.current);
    dados.set('acao', acao);
    startTransition(() => executar(dados));
  }

  const conferido = estado?.conferido ? estado : null;
  const semErros = conferido && conferido.erros.length === 0;
  const linhas = conferido
    ? NOMES_DO_RESUMO.filter(([chave]) => conferido.resumo[chave]).map(([chave, um, varios]) => `${conferido.resumo[chave]} ${conferido.resumo[chave] === 1 ? um : varios}`)
    : [];

  return (
    <div className="imp">
      <ol className="imp-passos">
        <li className="imp-passo">
          <span className="imp-n" aria-hidden="true">1</span>
          <div className="imp-corpo">
            <h2 className="imp-t">Baixe a planilha modelo</h2>
            <p className="nota">Uma aba por assunto: empresa, colaboradores ativos, ex-colaboradores dos últimos 12 meses, férias, atestados, reajustes e benefícios. A aba Instruções explica cada uma.</p>
            <a className="btn btn-fant" href="/empresa/importar/modelo" download>
              <Icone nome="download" />
              Baixar a planilha modelo
            </a>
          </div>
        </li>
        <li className="imp-passo">
          <span className="imp-n" aria-hidden="true">2</span>
          <div className="imp-corpo">
            <h2 className="imp-t">Suba a planilha preenchida</h2>
            <form
              ref={formulario}
              className="imp-form"
              onSubmit={(evento) => {
                evento.preventDefault();
                enviar('conferir');
              }}
            >
              <label className="imp-arquivo">
                <Icone nome="upload_file" />
                <span>{arquivo ? arquivo.name : 'Escolher a planilha (.xlsx)'}</span>
                <input
                  type="file"
                  name="arquivo"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(evento) => setArquivo(evento.target.files?.[0] || null)}
                  disabled={!podeImportar}
                  required
                />
              </label>
              <button type="submit" className="btn btn-acao" disabled={!arquivo || enviando || !podeImportar}>
                <Icone nome={enviando ? 'hourglass_empty' : 'fact_check'} />
                {enviando ? 'Conferindo…' : 'Conferir a planilha'}
              </button>
            </form>
            {!podeImportar ? <p className="nota">Só a Gestão da empresa importa a planilha.</p> : null}
          </div>
        </li>
      </ol>

      <div ref={resultado} tabIndex={-1} className="imp-resultado" aria-live="polite">
        {estado?.erro ? (
          <div className="faixa erro" role="alert">
            <Icone nome="error" />
            <span>{estado.erro}</span>
          </div>
        ) : null}

        {estado?.importado ? (
          <div className="faixa ok">
            <Icone nome="task_alt" />
            <span>
              Planilha importada. Confira a <Link href="/pendencias">revisão e os prazos em Pendências</Link> e as pessoas em <Link href="/colaboradores">Colaboradores</Link>.
            </span>
          </div>
        ) : null}

        {conferido ? (
          <>
            <div className={`faixa ${semErros ? 'ok' : 'alerta'}`}>
              <Icone nome={semErros ? 'task_alt' : 'warning'} />
              <span>
                {semErros
                  ? `Tudo certo: ${linhas.join(', ') || 'nada novo para importar'}.`
                  : `${conferido.erros.length} ${conferido.erros.length === 1 ? 'erro' : 'erros'} para corrigir no Excel antes de importar.`}
                {conferido.jaCadastradas.length ? ` ${conferido.jaCadastradas.length} ${conferido.jaCadastradas.length === 1 ? 'pessoa já está' : 'pessoas já estão'} no quadro e ${conferido.jaCadastradas.length === 1 ? 'fica' : 'ficam'} de fora.` : ''}
              </span>
            </div>
            {conferido.avisos.map((aviso) => (
              <p key={aviso} className="nota">
                {aviso}
              </p>
            ))}
            {conferido.erros.length ? (
              <div className="cartao cartao-liso imp-erros">
                <div className="tb-cab imp-linha" aria-hidden="true">
                  <span>Aba</span>
                  <span>Linha</span>
                  <span>Coluna</span>
                  <span>O que corrigir</span>
                </div>
                <ul role="list">
                  {conferido.erros.map((item, indice) => (
                    <li key={`${item.aba}-${item.linha}-${item.coluna}-${indice}`} className="imp-linha">
                      <span className="imp-aba">{item.aba}</span>
                      <span className="num">{item.linha ? `linha ${item.linha}` : '—'}</span>
                      <span>{item.coluna || '—'}</span>
                      <span className="imp-msg">{item.mensagem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button type="button" className="btn btn-acao" disabled={enviando || !podeImportar} onClick={() => enviar('importar')}>
                <Icone nome={enviando ? 'hourglass_empty' : 'upload_file'} />
                {enviando ? 'Importando…' : 'Importar agora'}
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
