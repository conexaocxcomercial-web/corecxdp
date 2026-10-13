'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cabecalho, Cartao, Celula, LinhaTabela, Tabela, Wrap } from '@/componentes/Estrutura';
import { useAplicarAlcance } from '@/componentes/Filtros';
import { Icone } from '@/componentes/Icones';

/** "Consultar" na carteira e na administração: põe o cliente no alcance e abre o Início dele. */
export function BotaoConsultar({ parceiro, cliente, nome }) {
  const aplicar = useAplicarAlcance();
  const router = useRouter();
  const [indo, setIndo] = useState(false);

  async function consultar() {
    setIndo(true);
    await aplicar({ parceiro, cliente });
    router.push('/painel');
  }

  return (
    <button
      type="button"
      className="btn btn-fant btn-mini"
      onClick={consultar}
      disabled={indo}
      aria-label={`Consultar ${nome}`}
    >
      {indo ? 'Abrindo…' : 'Consultar'}
      <Icone nome="arrow_forward" />
    </button>
  );
}

const GRADE = '1.6fr 1fr 120px 150px 150px';

/** Clientes com os números que já existem e o "Consultar" (carteira e administração). */
export function TabelaDeClientes({ clientes }) {
  return (
    <Tabela
      grade={GRADE}
      colunas={[
        { rotulo: 'Cliente' },
        { rotulo: 'Regime tributário' },
        { rotulo: 'Pessoas ativas', alinha: 'd' },
        { rotulo: 'Atestados por validar', alinha: 'd' },
        { rotulo: '' },
      ]}
    >
      {clientes.map((cliente) => (
        <LinhaTabela key={cliente.id} grade={GRADE}>
          <Celula>
            <span className="tb-nome">{cliente.nome}</span>
          </Celula>
          <Celula rotulo="Regime tributário" alinha="c">
            <span className="text-[var(--tinta-2)]">{cliente.regime_tributario || '—'}</span>
          </Celula>
          <Celula rotulo="Pessoas ativas" alinha="d">
            <span className="num">{cliente.ativos}</span>
          </Celula>
          <Celula rotulo="Atestados por validar" alinha="d">
            <span className="num">{cliente.pendentes}</span>
          </Celula>
          <Celula alinha="d">
            <BotaoConsultar parceiro={cliente.parceiro_id} cliente={cliente.id} nome={cliente.nome} />
          </Celula>
        </LinhaTabela>
      ))}
    </Tabela>
  );
}

/**
 * Telas de um cliente (painel, colaboradores, indicadores…) com o alcance
 * em "Todos os clientes": em vez de misturar empresas, a tela pede um
 * cliente. Escolher aqui troca o alcance e a tela aparece já dele.
 */
export function EscolhaDeCliente({ alcance }) {
  const aplicar = useAplicarAlcance();
  const clientes = alcance.parceiro
    ? alcance.estrutura.clientes.filter((cliente) => cliente.parceiro_id === alcance.parceiro.id)
    : alcance.estrutura.clientes;
  const nomeDoParceiro = (id) => alcance.estrutura.parceiros.find((parceiro) => parceiro.id === id)?.nome;

  return (
    <>
      <Cabecalho
        titulo="Escolha um cliente"
        subtitulo={`Esta tela mostra os registros de um cliente por vez.${
          alcance.perfil === 'parceiro' ? ' A visão de todos juntos fica na carteira.' : ''
        }`}
      />
      <Wrap>
        <Cartao liso>
          <ul className="folha-lista" role="list">
            {clientes.map((cliente) => (
              <li key={cliente.id}>
                <button
                  type="button"
                  className="opcao"
                  onClick={() => aplicar({ parceiro: cliente.parceiro_id, cliente: cliente.id })}
                >
                  <span className="opcao-ic">
                    <Icone nome="domain" />
                  </span>
                  <span className="opcao-txt">
                    <span className="opcao-nome">{cliente.nome}</span>
                    <span className="opcao-desc">
                      {[alcance.perfil === 'admin' ? nomeDoParceiro(cliente.parceiro_id) : null, cliente.regime_tributario]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <Icone nome="chevron_right" className="opcao-ir" />
                </button>
              </li>
            ))}
          </ul>
        </Cartao>
      </Wrap>
    </>
  );
}
