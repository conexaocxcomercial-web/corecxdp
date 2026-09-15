import Link from 'next/link';
import { OPCOES, listarColaboradores } from '@/lib/registros';
import { ErroDePlanilha } from '@/lib/planilha';
import { apenasDigitos, formatarData, hojeISO, plural } from '@/lib/formato';
import {
  Celula,
  Folha,
  Linha,
  Tabela,
  TituloDaPagina,
} from '@/componentes/Estrutura';
import { Aviso, Status, Vazio } from '@/componentes/Sinais';
import { Filtros } from '@/componentes/Filtros';
import { PainelDeRegistro } from '@/componentes/PainelDeRegistro';
import { Data, Selecao, Texto } from '@/componentes/Campos';
import { salvarColaborador } from '@/app/acoes';

export const metadata = { title: 'Colaboradores' };

export default async function Colaboradores({ searchParams }) {
  const parametros = await searchParams;
  const busca = String(parametros?.busca || '').trim().toLowerCase();
  const area = String(parametros?.area || '');
  const situacao = String(parametros?.status || '');

  let pessoas;
  try {
    pessoas = await listarColaboradores();
  } catch (erro) {
    return (
      <>
        <TituloDaPagina titulo="Colaboradores" />
        <Aviso titulo="A planilha não respondeu">
          {erro instanceof ErroDePlanilha
            ? erro.message
            : 'Não foi possível ler a aba Colaboradores agora. Confira as variáveis de ambiente e recarregue a página.'}
        </Aviso>
      </>
    );
  }

  const areas = [...new Set([...OPCOES.departamentos, ...pessoas.map((p) => p.departamento)])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const digitosDaBusca = apenasDigitos(busca);
  const filtradas = pessoas.filter((pessoa) => {
    const combinaTexto =
      !busca ||
      pessoa.nome.toLowerCase().includes(busca) ||
      pessoa.matricula.toLowerCase().includes(busca) ||
      pessoa.cargo.toLowerCase().includes(busca) ||
      (digitosDaBusca.length >= 3 && apenasDigitos(pessoa.cpf).includes(digitosDaBusca));

    return (
      combinaTexto &&
      (!area || pessoa.departamento === area) &&
      (!situacao || pessoa.status === situacao)
    );
  });

  const cadastro = (
    <PainelDeRegistro
      abrir="Cadastrar colaborador"
      titulo="Cadastrar colaborador"
      descricao="A matrícula é gerada automaticamente na sequência da planilha."
      acao={salvarColaborador}
      enviar="Cadastrar colaborador"
      enviando="Cadastrando…"
    >
      <Texto rotulo="Nome completo" nome="nome" placeholder="Ana Beatriz Moreira" required />
      <Texto rotulo="CPF" nome="cpf" placeholder="000.000.000-00" inputMode="numeric" required />
      <Selecao rotulo="Área" nome="departamento" opcoes={areas} />
      <Texto rotulo="Cargo" nome="cargo" placeholder="Analista de Operações Júnior" required />
      <Texto
        rotulo="Gestor imediato"
        nome="gestor"
        dica="opcional"
        placeholder="Nome de quem responde pela pessoa"
      />
      <Data rotulo="Data de admissão" nome="admissao" defaultValue={hojeISO()} required />
      <Selecao rotulo="Situação" nome="status" opcoes={OPCOES.statusColaborador} />
    </PainelDeRegistro>
  );

  return (
    <>
      <TituloDaPagina
        titulo="Colaboradores"
        apoio="A ficha de cada pessoa da empresa: dados cadastrais, situação e todo o histórico de registros."
        acao={cadastro}
      />

      <Folha>
        <Filtros
          busca="Buscar por nome, matrícula, cargo ou CPF"
          seletores={[
            { chave: 'area', rotulo: 'Todas as áreas', opcoes: areas },
            { chave: 'status', rotulo: 'Todas as situações', opcoes: OPCOES.statusColaborador },
          ]}
        />

        {filtradas.length === 0 ? (
          <Vazio
            titulo={pessoas.length === 0 ? 'Nenhum colaborador cadastrado' : 'Nada encontrado'}
            descricao={
              pessoas.length === 0
                ? 'Cadastre a primeira pessoa para abrir o registro de pessoal da empresa.'
                : 'Nenhum colaborador corresponde à busca. Limpe os filtros ou tente outro termo.'
            }
            acao={pessoas.length === 0 ? cadastro : null}
          />
        ) : (
          <>
            <Tabela colunas={['Matrícula', 'Nome', 'Área', 'Cargo', 'Admissão', 'Situação']}>
              {filtradas.map((pessoa) => (
                <Linha key={pessoa.matricula}>
                  <Celula className="w-[104px]">
                    <span className="numero font-mono text-[12.5px] text-tinta-70">
                      {pessoa.matricula}
                    </span>
                  </Celula>
                  <Celula>
                    <Link
                      href={`/colaboradores/${pessoa.matricula}`}
                      className="font-medium underline-offset-4 hover:text-carimbo hover:underline"
                    >
                      {pessoa.nome}
                    </Link>
                  </Celula>
                  <Celula className="text-tinta-70">{pessoa.departamento || '—'}</Celula>
                  <Celula className="text-tinta-70">{pessoa.cargo || '—'}</Celula>
                  <Celula className="w-[112px]">
                    <span className="numero font-mono text-[12.5px] text-tinta-70">
                      {formatarData(pessoa.admissao)}
                    </span>
                  </Celula>
                  <Celula className="w-[124px]">
                    <Status>{pessoa.status}</Status>
                  </Celula>
                </Linha>
              ))}
            </Tabela>

            <p className="border-t border-linha px-5 py-3 text-[12.5px] text-tinta-50">
              {filtradas.length} {plural(filtradas.length, 'pessoa', 'pessoas')} de {pessoas.length}{' '}
              no registro.
            </p>
          </>
        )}
      </Folha>
    </>
  );
}
