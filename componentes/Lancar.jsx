'use client';

import Link from 'next/link';
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buscarPessoas, lancar, opcoesParaLancar } from '@/app/acoes';
import { Caixa, Data, Paragrafo, Selecao, Texto } from '@/componentes/Campos';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';
import { Status } from '@/componentes/Sinais';
import { CamposDeCustos } from '@/componentes/Custos';
import {
  CONTRATOS,
  PEDEM_ATESTADO,
  TIPOS_DE_AFASTAMENTO,
  TIPOS_DE_DESLIGAMENTO,
  TIPOS_DE_MOVIMENTACAO,
  TIPOS_DE_OCORRENCIA,
} from '@/lib/lancamentos';
import { prazoDaRescisao } from '@/lib/prazos';
import { hojeISO } from '@/lib/formato';

/*
 * Lançar em três passos (fases 8 e 9 do redesenho), numa folha só para o
 * sistema inteiro: "O que aconteceu?" → "Com quem?" → formulário. Aberto
 * pela ficha (ou com a pessoa no endereço), pula o passo da pessoa; a
 * admissão vai direto ao formulário, porque a pessoa ainda não existe. Abre
 * pelo botão da barra do topo, pela barra inferior, pelas ações rápidas
 * da ficha, pelos botões das listas e por ?lancar=afastamento&matricula=…
 */

const Contexto = createContext({ abrir() {}, podeLancar: false });

export function useLancar() {
  return useContext(Contexto);
}

export function ProvedorDoLancar({ tipos, podeLancar, children }) {
  const [estado, setEstado] = useState({ aberta: false, tipo: null, pessoa: null, chave: 0 });
  const parametros = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();

  function abrir({ tipo = null, pessoa = null } = {}) {
    setEstado({ aberta: true, tipo, pessoa, chave: Date.now() });
  }

  // ?lancar=<tipo>&matricula=…: abre já no passo certo e tira os parâmetros do endereço.
  useEffect(() => {
    const pedido = parametros.get('lancar');
    if (!pedido || !podeLancar) return;
    const tipo = tipos.some((item) => item.chave === pedido && !item.href) ? pedido : null;
    if (pedido !== '1' && !tipo) return;
    const matricula = parametros.get('matricula');
    abrir({ tipo, pessoa: matricula ? { matricula, nome: null } : null });
    const novos = new URLSearchParams(parametros.toString());
    ['lancar', 'matricula', 'tipo'].forEach((chave) => novos.delete(chave));
    const consulta = novos.toString();
    router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
    // Só reage ao endereço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parametros]);

  return (
    <Contexto.Provider value={{ abrir, podeLancar }}>
      {children}
      {podeLancar ? (
        <FolhaDoLancar
          key={estado.chave}
          aberta={estado.aberta}
          aoFechar={() => setEstado((atual) => ({ ...atual, aberta: false }))}
          tipos={tipos}
          tipoInicial={estado.tipo}
          pessoaInicial={estado.pessoa}
        />
      ) : null}
    </Contexto.Provider>
  );
}

/** Botão Lançar da barra do topo (só no computador; no celular, é a barra inferior). */
export function BotaoLancar() {
  const { abrir, podeLancar } = useLancar();
  if (!podeLancar) return null;
  return (
    <button type="button" className="btn btn-acao top-lancar" onClick={() => abrir()} aria-haspopup="dialog">
      <Icone nome="add" />
      Lançar
    </button>
  );
}

/** Um botão que abre o Lançar já num tipo (e, da ficha, já com a pessoa). */
export function BotaoDeLancar({ tipo, pessoa, rotulo, icone = 'add', variante = 'acao', mini = false }) {
  const { abrir, podeLancar } = useLancar();
  if (!podeLancar) return null;
  return (
    <button
      type="button"
      className={`btn btn-${variante} ${mini ? 'btn-mini' : ''}`}
      onClick={() => abrir({ tipo, pessoa })}
      aria-haspopup="dialog"
    >
      <Icone nome={icone} />
      {rotulo}
    </button>
  );
}

const TITULOS = {
  tipo: { titulo: 'O que aconteceu?', descricao: 'Escolha o que lançar.' },
  pessoa: { titulo: 'Com quem?', descricao: 'Busque pelo nome ou pela matrícula.' },
};

function FolhaDoLancar({ aberta, aoFechar, tipos, tipoInicial, pessoaInicial }) {
  const tipoDe = (chave) => tipos.find((item) => item.chave === chave) || null;
  const [tipo, setTipo] = useState(tipoDe(tipoInicial));
  const [pessoa, setPessoa] = useState(pessoaInicial);
  const [feito, setFeito] = useState(null);
  const passo = feito ? 'feito' : !tipo ? 'tipo' : tipo.comPessoa && !pessoa ? 'pessoa' : 'formulario';

  // Pessoa que veio só com a matrícula (do endereço): busca o nome.
  useEffect(() => {
    if (!pessoa || pessoa.nome) return;
    buscarPessoas(pessoa.matricula).then((resposta) => {
      const achada = resposta.pessoas?.find((item) => item.matricula === pessoa.matricula);
      setPessoa(achada ? { matricula: achada.matricula, nome: achada.nome } : null);
    });
  }, [pessoa]);

  const cabecalho =
    passo === 'formulario'
      ? // Vindo da ficha, a pessoa fica no subtítulo; escolhida no passo 2, numa etiqueta com "Trocar".
        { titulo: tipo.nome, descricao: pessoa && pessoaInicial ? pessoa.nome || pessoa.matricula : tipo.descricao }
      : passo === 'feito'
        ? { titulo: 'Registrado', descricao: null }
        : TITULOS[passo];

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={cabecalho.titulo} descricao={cabecalho.descricao} rotuloFechar="Fechar">
      {passo === 'tipo' ? (
        <ul className="folha-corpo folha-lista" role="list">
          {tipos.map((item) => (
            <li key={item.chave}>
              {item.href ? (
                <Link href={item.href} className="opcao" onClick={aoFechar}>
                  <OpcaoDoTipo item={item} />
                </Link>
              ) : (
                <button type="button" className="opcao" onClick={() => setTipo(item)}>
                  <OpcaoDoTipo item={item} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {passo === 'pessoa' ? (
        <EscolhaDaPessoa
          tipo={tipo}
          aoEscolher={setPessoa}
          aoVoltar={() => setTipo(null)}
        />
      ) : null}

      {passo === 'formulario' ? (
        <Formulario
          tipo={tipo}
          pessoa={pessoa}
          aoVoltar={() => (pessoaInicial || !tipo.comPessoa ? setTipo(null) : setPessoa(null))}
          aoTrocarPessoa={pessoaInicial ? null : () => setPessoa(null)}
          aoRegistrar={setFeito}
        />
      ) : null}

      {passo === 'feito' ? (
        <Confirmacao
          feito={feito}
          tipo={tipo}
          aoFechar={aoFechar}
          aoLancarOutro={() => {
            setFeito(null);
            setTipo(null);
            if (!pessoaInicial) setPessoa(null);
          }}
        />
      ) : null}
    </Folha>
  );
}

function OpcaoDoTipo({ item }) {
  return (
    <>
      <span className="opcao-ic">
        <Icone nome={item.icone} />
      </span>
      <span className="opcao-txt">
        <span className="opcao-nome">{item.nome}</span>
        <span className="opcao-desc">{item.descricao}</span>
      </span>
      <Icone nome="chevron_right" className="opcao-ir" />
    </>
  );
}

/* ---------------------------------------------------- passo 2: com quem */

function EscolhaDaPessoa({ tipo, aoEscolher, aoVoltar }) {
  const [termo, setTermo] = useState('');
  const [pessoas, setPessoas] = useState([]);
  const [estado, setEstado] = useState('inicio');
  const pedido = useRef(0);
  const relogio = useRef(null);
  const campo = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(min-width: 901px)').matches) campo.current?.focus();
    return () => clearTimeout(relogio.current);
  }, []);

  function procurar(valor) {
    setTermo(valor);
    clearTimeout(relogio.current);
    const numero = ++pedido.current;
    if (valor.trim().length < 2) {
      setPessoas([]);
      setEstado('inicio');
      return;
    }
    setEstado('buscando');
    relogio.current = setTimeout(async () => {
      const resposta = await buscarPessoas(valor);
      if (numero !== pedido.current) return;
      // Quem já saiu não recebe lançamento novo.
      setPessoas((resposta.pessoas || []).filter((pessoa) => pessoa.status !== 'Inativo'));
      setEstado(resposta.erro ? 'erro' : 'pronto');
    }, 180);
  }

  return (
    <div className="folha-corpo lancar-pessoa">
      <input
        ref={campo}
        type="search"
        className="campo"
        value={termo}
        onChange={(evento) => procurar(evento.target.value)}
        placeholder="Nome ou matrícula"
        aria-label={`Com quem foi: ${tipo.nome.toLowerCase()}`}
        autoComplete="off"
      />
      <div aria-live="polite" className="lancar-pessoa-res">
        {estado === 'inicio' ? <p className="nota">Digite ao menos 2 letras do nome ou a matrícula.</p> : null}
        {estado === 'buscando' ? <p className="nota">Buscando…</p> : null}
        {estado === 'erro' ? <p className="nota">A busca não respondeu agora. Tente de novo.</p> : null}
        {estado === 'pronto' && pessoas.length === 0 ? <p className="nota">Ninguém no quadro com esse nome ou matrícula.</p> : null}
        {pessoas.length ? (
          <ul className="folha-lista" role="list">
            {pessoas.map((pessoa) => (
              <li key={pessoa.matricula}>
                <button type="button" className="opcao" onClick={() => aoEscolher({ matricula: pessoa.matricula, nome: pessoa.nome })}>
                  <span className="opcao-txt">
                    <span className="opcao-nome">{pessoa.nome}</span>
                    <span className="opcao-desc">
                      <span className="num">{pessoa.matricula}</span>
                      {pessoa.cargo ? ` · ${pessoa.cargo}` : ''}
                    </span>
                  </span>
                  <Status>{pessoa.status}</Status>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="lancar-voltar">
        <button type="button" className="btn btn-fant" onClick={aoVoltar}>
          <Icone nome="arrow_back" />
          Voltar
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- passo 3: formulário */

const FORMULARIOS = {
  afastamento: CamposDoAfastamento,
  ocorrencia: CamposDaOcorrencia,
  movimentacao: CamposDaMovimentacao,
  desligamento: CamposDoDesligamento,
  admissao: CamposDaAdmissao,
};

function Formulario({ tipo, pessoa, aoVoltar, aoTrocarPessoa, aoRegistrar }) {
  const [estado, executar, enviando] = useActionState(lancar, null);
  const corpo = useRef(null);
  const Campos = FORMULARIOS[tipo.chave];

  useEffect(() => {
    if (estado?.ok) aoRegistrar(estado);
    // Só a chegada de uma resposta nova importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  useEffect(() => {
    if (!window.matchMedia('(min-width: 901px)').matches) return;
    corpo.current?.querySelector('input, select, textarea')?.focus();
  }, []);

  // Envio pela transição, não por <form action>: assim o React não limpa os
  // campos quando o servidor devolve um erro, e a pessoa só corrige o que falta.
  function enviar(evento) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => executar(dados));
  }

  return (
    <form onSubmit={enviar} className="folha-form" aria-busy={enviando}>
      <input type="hidden" name="lancamento" value={tipo.chave} />
      {pessoa ? <input type="hidden" name="matricula" value={pessoa.matricula} /> : null}
      <div ref={corpo} className="folha-corpo">
        {aoTrocarPessoa && pessoa ? (
          <p className="lancar-quem">
            <Icone nome="person" />
            <span>{pessoa.nome || pessoa.matricula}</span>
            <button type="button" className="lancar-trocar" onClick={aoTrocarPessoa}>
              Trocar
            </button>
          </p>
        ) : null}
        <Campos />
      </div>
      {estado?.erro ? (
        <div className="folha-erro">
          <div className="faixa erro" role="alert">
            <Icone nome="error" />
            <span>{estado.erro}</span>
          </div>
        </div>
      ) : null}
      <div className="folha-pe">
        <button type="button" className="btn btn-fant" onClick={aoVoltar}>
          <Icone nome="arrow_back" />
          Voltar
        </button>
        <button type="submit" className="btn btn-acao" disabled={enviando}>
          <Icone nome={enviando ? 'hourglass_empty' : 'check'} />
          {enviando ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}

const somarDias = (inicio, dias) => {
  if (!inicio || !dias) return null;
  const data = new Date(`${inicio}T00:00:00Z`);
  if (Number.isNaN(data.getTime())) return null;
  data.setUTCDate(data.getUTCDate() + Number(dias) - 1);
  return data.toISOString().slice(0, 10);
};
const emBr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

function CamposDoAfastamento() {
  const [tipo, setTipo] = useState('Doença');
  const [inicio, setInicio] = useState(hojeISO());
  const [dias, setDias] = useState('');
  const [comAtestado, setComAtestado] = useState(false);
  const [semCid, setSemCid] = useState(false);
  const obrigatorio = PEDEM_ATESTADO.includes(tipo);
  const temAtestado = obrigatorio || comAtestado;
  const fim = somarDias(inicio, dias);
  const passaDe15 = obrigatorio && Number(dias) > 15;

  return (
    <>
      <Selecao rotulo="Tipo de afastamento" nome="tipo" opcoes={TIPOS_DE_AFASTAMENTO} value={tipo} onChange={(evento) => setTipo(evento.target.value)} />
      <div className="folha-duas">
        <Data rotulo="Primeiro dia" nome="inicio" value={inicio} onChange={(evento) => setInicio(evento.target.value)} required />
        <Texto
          rotulo="Dias"
          nome="dias"
          type="number"
          inputMode="numeric"
          min={1}
          max={730}
          value={dias}
          onChange={(evento) => setDias(evento.target.value)}
          dica={fim ? `até ${emBr(fim)}` : undefined}
          required
        />
      </div>
      {passaDe15 ? (
        <div className="faixa info">
          <Icone nome="info" />
          <span>Passa de 15 dias: do 16º dia em diante, o afastamento é com o INSS. O prazo de encaminhamento entra em Pendências.</span>
        </div>
      ) : null}
      {!obrigatorio ? (
        <Caixa
          rotulo="Tem atestado"
          nome="comAtestado"
          value="sim"
          checked={comAtestado}
          onChange={(evento) => setComAtestado(evento.target.checked)}
          dica="opcional para este tipo"
        />
      ) : null}
      {temAtestado ? (
        <fieldset className="lancar-atestado">
          <legend>Atestado</legend>
          <Texto
            rotulo="CID"
            nome="cid"
            placeholder="J11"
            autoCapitalize="characters"
            disabled={semCid}
            required={!semCid}
            dica="visível só para a Gestão da empresa e a Administração"
          />
          <Caixa rotulo="CID não informado" nome="cidNaoInformado" value="sim" checked={semCid} onChange={(evento) => setSemCid(evento.target.checked)} dica="o médico só informa com a autorização do paciente" />
          <Texto rotulo="Link do documento" nome="anexo" type="url" placeholder="https://" dica="opcional" />
          <Selecao
            rotulo="Validação"
            nome="validacao"
            opcoes={[
              { valor: 'Pendente', texto: 'Validar depois (fica em Pendências)' },
              { valor: 'Aprovado', texto: 'Já conferido: aprovado' },
            ]}
          />
        </fieldset>
      ) : null}
    </>
  );
}

function CamposDaOcorrencia() {
  const [tipo, setTipo] = useState(TIPOS_DE_OCORRENCIA[0]);
  const falta = tipo.startsWith('Falta');
  return (
    <>
      <div className="folha-duas">
        <Selecao rotulo="Tipo" nome="tipo" opcoes={TIPOS_DE_OCORRENCIA} value={tipo} onChange={(evento) => setTipo(evento.target.value)} />
        <Data rotulo="Data" nome="data" defaultValue={hojeISO()} max={hojeISO()} required />
      </div>
      {!falta ? <Selecao rotulo="Houve justificativa aceita" nome="justificada" opcoes={['Não', 'Sim']} /> : null}
      <Paragrafo rotulo="Motivo" nome="motivo" placeholder="O que aconteceu, em poucas palavras" required />
    </>
  );
}

function CamposDaMovimentacao() {
  const [tipo, setTipo] = useState(TIPOS_DE_MOVIMENTACAO[0]);
  const [opcoes, setOpcoes] = useState({ departamentos: [], cnpjs: [] });
  useEffect(() => {
    opcoesParaLancar().then(setOpcoes);
  }, []);
  const muda = {
    'Alteração Salarial': ['salario'],
    Promoção: ['cargo', 'salario'],
    'Mudança de Cargo': ['cargo', 'salario'],
    Transferência: ['unidade', 'departamento'],
  }[tipo];

  return (
    <>
      <div className="folha-duas">
        <Selecao rotulo="Tipo" nome="tipo" opcoes={TIPOS_DE_MOVIMENTACAO} value={tipo} onChange={(evento) => setTipo(evento.target.value)} />
        <Data rotulo="Passa a valer em" nome="efetiva" defaultValue={hojeISO()} required />
      </div>
      {muda.includes('cargo') ? <Texto rotulo="Novo cargo" nome="novoCargo" placeholder="Analista Pleno" required /> : null}
      {muda.includes('salario') ? (
        <Texto
          rotulo="Novo salário"
          nome="novoSalario"
          inputMode="decimal"
          placeholder="3.500,00"
          required={tipo === 'Alteração Salarial'}
          dica={tipo === 'Alteração Salarial' ? undefined : 'opcional'}
        />
      ) : null}
      {muda.includes('unidade') && opcoes.cnpjs.length > 1 ? (
        <Selecao
          rotulo="Nova unidade"
          nome="novaUnidade"
          opcoes={[{ valor: '', texto: 'A mesma de hoje' }, ...opcoes.cnpjs.map((item) => ({ valor: item.id, texto: item.nome }))]}
        />
      ) : null}
      {muda.includes('departamento') ? (
        <Selecao
          rotulo="Novo departamento"
          nome="novoDepartamento"
          opcoes={[{ valor: '', texto: 'O mesmo de hoje' }, ...opcoes.departamentos]}
        />
      ) : null}
      <Paragrafo rotulo="Motivo" nome="motivo" placeholder="Por que muda, em poucas palavras" required />
    </>
  );
}

const dataCompleta = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor || '');

function CamposDoDesligamento() {
  const [data, setData] = useState(hojeISO());
  const prazo = dataCompleta(data) ? prazoDaRescisao(data) : null;
  return (
    <>
      <div className="folha-duas">
        <Selecao rotulo="Tipo" nome="tipo" opcoes={TIPOS_DE_DESLIGAMENTO} />
        <Data
          rotulo="Último dia de trabalho"
          nome="data"
          value={data}
          onChange={(evento) => setData(evento.target.value)}
          dica={prazo ? `rescisão até ${emBr(prazo.data)}` : undefined}
          required
        />
      </div>
      <Paragrafo rotulo="Motivo" nome="motivo" placeholder="Por que a pessoa sai, em poucas palavras" required />
      <p className="nota">
        A rescisão vence 10 dias depois do último dia
        {prazo?.nota ? ` (${prazo.nota}: vale o dia útil anterior)` : ', no dia útil anterior se cair em fim de semana ou feriado'} e fica para
        concluir em Pendências e em Desligamentos.
      </p>
      <CamposDeCustos momento="desligamento" />
    </>
  );
}

function CamposDaAdmissao() {
  const [opcoes, setOpcoes] = useState({ departamentos: [], cnpjs: [], gestores: [], unidadeAtual: null });
  const [contrato, setContrato] = useState(CONTRATOS[0].valor);
  const [admissao, setAdmissao] = useState(hojeISO());
  useEffect(() => {
    opcoesParaLancar().then(setOpcoes);
  }, []);
  const comExperiencia = contrato === 'experiência' && dataCompleta(admissao);

  return (
    <>
      <Texto rotulo="Nome completo" nome="nome" placeholder="Ana Beatriz Moreira" autoComplete="off" required />
      <div className="folha-duas">
        <Texto rotulo="CPF" nome="cpf" placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" required />
        <Data rotulo="Nascimento" nome="nascimento" max={hojeISO()} required />
      </div>
      <div className="folha-duas">
        <Selecao
          rotulo="Contrato"
          nome="contrato"
          opcoes={CONTRATOS}
          value={contrato}
          onChange={(evento) => setContrato(evento.target.value)}
        />
        <Data rotulo="Primeiro dia" nome="admissao" value={admissao} onChange={(evento) => setAdmissao(evento.target.value)} required />
      </div>
      {comExperiencia ? (
        <p className="nota">
          Experiência: os 45 dias terminam em {emBr(somarDias(admissao, 45))} e os 90, em {emBr(somarDias(admissao, 90))}. Os dois prazos
          entram em Pendências.
        </p>
      ) : null}
      {opcoes.cnpjs.length > 1 ? (
        <Selecao
          key={opcoes.unidadeAtual || 'unidade'}
          rotulo="Unidade (CNPJ)"
          nome="unidade"
          defaultValue={opcoes.unidadeAtual || opcoes.cnpjs[0].id}
          opcoes={opcoes.cnpjs.map((item) => ({ valor: item.id, texto: item.nome }))}
        />
      ) : null}
      <div className="folha-duas">
        <Texto rotulo="Departamento" nome="departamento" list="lancar-departamentos" autoComplete="off" required />
        <Texto rotulo="Cargo" nome="cargo" placeholder="Auxiliar Administrativo" required />
      </div>
      <div className="folha-duas">
        <Texto rotulo="Salário" nome="salario" inputMode="decimal" placeholder="3.500,00" required />
        <Texto rotulo="Jornada" nome="jornada" defaultValue="44h semanais" />
      </div>
      <Texto rotulo="Gestor imediato" nome="gestor" list="lancar-gestores" autoComplete="off" dica="opcional" />
      <datalist id="lancar-departamentos">
        {opcoes.departamentos.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <datalist id="lancar-gestores">
        {opcoes.gestores.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <CamposDeCustos momento="admissao" />
    </>
  );
}

/* --------------------------------------------------- depois de registrar */

const FEITO = {
  afastamento: 'Afastamento registrado',
  ocorrencia: 'Ocorrência registrada',
  movimentacao: 'Movimentação registrada',
  desligamento: 'Desligamento registrado',
  admissao: 'Admissão registrada',
};

function Confirmacao({ feito, tipo, aoFechar, aoLancarOutro }) {
  const botao = useRef(null);
  useEffect(() => botao.current?.focus(), []);
  const aba = tipo.chave === 'admissao' ? 'contrato' : 'historico';
  const ficha = feito.pessoa ? `/colaboradores/${encodeURIComponent(feito.pessoa.matricula)}?aba=${aba}` : null;
  return (
    <div className="folha-corpo lancar-feito" role="status">
      <span className="lancar-feito-ic" aria-hidden="true">
        <Icone nome="task_alt" />
      </span>
      <p className="lancar-feito-t">
        {FEITO[tipo.chave]}
        {feito.pessoa ? ` para ${feito.pessoa.nome}` : ''}.
      </p>
      {feito.inss ? (
        <div className="faixa alerta">
          <Icone nome="warning" />
          <span>
            Encaminhar ao INSS a partir de <b>{feito.inss.data}</b>: {feito.inss.detalhe}. O prazo já está em Pendências.
          </span>
        </div>
      ) : null}
      {feito.passaAValer ? <p className="nota">A mudança passa a valer em {feito.passaAValer}; até lá, a ficha mostra o que vale hoje.</p> : null}
      {feito.rescisao ? (
        <p className="nota">
          A rescisão vence em <b>{feito.rescisao.data}</b>
          {feito.rescisao.nota ? ` (${feito.rescisao.nota})` : ''} e ficou para concluir em Pendências e em Desligamentos.
        </p>
      ) : null}
      {feito.admissao?.comeca ? (
        <p className="nota">
          Começa em <b>{feito.admissao.comeca}</b>. O registro da admissão vence na véspera, em <b>{feito.admissao.registroAte}</b>, e já está em
          Pendências.
        </p>
      ) : null}
      {feito.admissao?.experiencia ? (
        <p className="nota">
          Experiência: 45 dias em {feito.admissao.experiencia.primeiroPeriodo} e 90 dias em {feito.admissao.experiencia.fim}.
        </p>
      ) : null}
      {feito.custos || feito.admissao?.custos ? (
        <p className="nota">Custos informados: {feito.custos || feito.admissao.custos}.</p>
      ) : null}
      {feito.nota ? <p className="nota">{feito.nota}</p> : null}
      <div className="lancar-feito-acoes">
        {ficha ? (
          <Link href={ficha} className="btn btn-fant" onClick={aoFechar}>
            Ver na ficha
          </Link>
        ) : null}
        <button type="button" className="btn btn-fant" onClick={aoLancarOutro}>
          <Icone nome="add" />
          Lançar outro
        </button>
        <button ref={botao} type="button" className="btn btn-acao" onClick={aoFechar}>
          Pronto
        </button>
      </div>
    </div>
  );
}
