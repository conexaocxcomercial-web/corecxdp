'use client';

import { startTransition, useActionState, useEffect, useState, useTransition } from 'react';
import { encerrarAdesaoDoBeneficio, incluirPessoaNoBeneficio, salvarBeneficioDaEmpresa } from '@/app/acoes';
import { Data, Selecao, Texto } from '@/componentes/Campos';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { TIPOS_DE_BENEFICIO } from '@/lib/beneficios';
import { hojeISO } from '@/lib/formato';

/*
 * Ações de Benefícios (fase 13 do redesenho): cadastrar ou mudar um
 * benefício do catálogo, incluir alguém e encerrar uma adesão. Os valores
 * são os cadastrados pela empresa; o custo na folha gerencial muda junto.
 */

const emCampo = (valor) => (valor || valor === 0 ? Number(valor).toFixed(2).replace('.', ',') : '');

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

/** Botão e folha para cadastrar um benefício novo (sem `beneficio`) ou mudar os valores de um. */
export function FormularioDeBeneficio({ beneficio = null, rotulo, variante = 'acao' }) {
  const [aberta, setAberta] = useState(false);
  const [estado, executar, enviando] = useActionState(salvarBeneficioDaEmpresa, null);
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
      <button type="button" className={`btn btn-${variante}`} onClick={() => setAberta(true)} aria-haspopup="dialog">
        <Icone nome={beneficio ? 'edit' : 'add'} />
        {rotulo || (beneficio ? 'Mudar valores' : 'Novo benefício')}
      </button>
      <Folha
        aberta={aberta}
        aoFechar={() => setAberta(false)}
        titulo={beneficio ? beneficio.nome : 'Novo benefício'}
        descricao="O valor é o que a empresa paga por pessoa, por mês. O custo na folha gerencial muda junto."
      >
        <form onSubmit={enviar} className="folha-form" aria-busy={enviando}>
          {beneficio ? <input type="hidden" name="id" value={beneficio.id} /> : null}
          <div className="folha-corpo">
            {aberta ? (
              <>
                <div className="folha-duas">
                  <Selecao rotulo="Tipo" nome="tipo" opcoes={TIPOS_DE_BENEFICIO} defaultValue={beneficio?.tipo || 'VR'} />
                  <Texto rotulo="Nome" nome="nome" defaultValue={beneficio?.nome || ''} placeholder="Vale-refeição" autoComplete="off" />
                </div>
                <div className="folha-duas">
                  <Texto rotulo="Empresa paga por pessoa" nome="valor" inputMode="decimal" placeholder="0,00" defaultValue={emCampo(beneficio?.valor_empresa)} required />
                  <Texto
                    rotulo="Desconto no salário (%)"
                    nome="desconto"
                    inputMode="decimal"
                    placeholder="0"
                    defaultValue={beneficio ? String(Math.round(beneficio.desconto_percentual * 10000) / 100).replace('.', ',') : ''}
                    dica="VT: até 6%"
                  />
                </div>
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

/** Incluir alguém no benefício, a partir de hoje (um toque). */
export function IncluirNoBeneficio({ beneficio, matricula, nome, nomeDoBeneficio }) {
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();
  function incluir() {
    setErro('');
    iniciar(async () => {
      const resposta = await incluirPessoaNoBeneficio({ beneficio, matricula, desde: hojeISO() });
      if (resposta?.erro) setErro(resposta.erro);
    });
  }
  return (
    <span className="linha-acoes">
      <button type="button" className="btn btn-fant btn-mini" disabled={enviando} onClick={incluir} aria-label={`Incluir ${nome} em ${nomeDoBeneficio}`}>
        <Icone nome={enviando ? 'hourglass_empty' : 'add'} />
        Incluir
      </button>
      {erro ? (
        <span className="linha-erro" role="alert">
          {erro}
        </span>
      ) : null}
    </span>
  );
}

/** Encerrar a adesão: o último dia com o benefício. */
export function EncerrarAdesao({ adesao, nome, nomeDoBeneficio }) {
  const [aberta, setAberta] = useState(false);
  const [ate, setAte] = useState(hojeISO());
  const [erro, setErro] = useState('');
  const [enviando, iniciar] = useTransition();
  function salvar(evento) {
    evento.preventDefault();
    setErro('');
    iniciar(async () => {
      const resposta = await encerrarAdesaoDoBeneficio({ adesao, ate });
      if (resposta?.erro) setErro(resposta.erro);
      else setAberta(false);
    });
  }
  return (
    <>
      <button type="button" className="btn btn-fant btn-mini" onClick={() => setAberta(true)} aria-haspopup="dialog" aria-label={`Encerrar ${nomeDoBeneficio} de ${nome}`}>
        <Icone nome="close" />
        Encerrar
      </button>
      <Folha aberta={aberta} aoFechar={() => setAberta(false)} titulo={`Encerrar ${nomeDoBeneficio}`} descricao={nome}>
        <form onSubmit={salvar} className="folha-form">
          <div className="folha-corpo">
            {aberta ? <Data rotulo="Último dia com o benefício" nome={`ate-${adesao}`} value={ate} onChange={(evento) => setAte(evento.target.value)} required /> : null}
            <p className="nota">Depois deste dia, o benefício sai do custo estimado de pessoal.</p>
          </div>
          <ErroNaFolha erro={erro} />
          <div className="folha-pe">
            <button type="button" className="btn btn-fant" onClick={() => setAberta(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-acao" disabled={enviando}>
              <Icone nome={enviando ? 'hourglass_empty' : 'check'} />
              {enviando ? 'Salvando…' : 'Encerrar'}
            </button>
          </div>
        </form>
      </Folha>
    </>
  );
}
