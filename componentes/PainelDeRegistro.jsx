'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BotaoEnviar } from '@/componentes/Botao';
import { Folha } from '@/componentes/Folha';
import { Icone } from '@/componentes/Icones';

/**
 * Cadastro numa Folha: janela no computador, folha que sobe de baixo no
 * celular. Fecha sozinha quando o registro entra. Com `abrirAoCarregar`
 * (o Lançar manda ?lancar=1), abre assim que a tela carrega, e ao fechar
 * tira o parâmetro do endereço.
 */
export function PainelDeRegistro({
  abrir,
  titulo,
  descricao,
  acao,
  enviar,
  enviando,
  abrirAoCarregar = false,
  children,
}) {
  const [aberto, setAberto] = useState(abrirAoCarregar);
  const [estado, executar] = useActionState(acao, {});
  const corpo = useRef(null);
  const router = useRouter();
  const caminho = usePathname();
  const parametros = useSearchParams();

  useEffect(() => {
    if (abrirAoCarregar) setAberto(true);
  }, [abrirAoCarregar]);

  function fechar() {
    setAberto(false);
    if (parametros.get('lancar')) {
      const novos = new URLSearchParams(parametros.toString());
      novos.delete('lancar');
      const consulta = novos.toString();
      router.replace(consulta ? `${caminho}?${consulta}` : caminho, { scroll: false });
    }
  }

  useEffect(() => {
    if (estado?.ok) fechar();
    // Só a chegada de um novo estado importa; fechar muda a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  // No computador o primeiro campo já recebe o foco; no celular não, para
  // o teclado não subir antes de a pessoa ver a folha inteira.
  useEffect(() => {
    if (!aberto || !window.matchMedia('(min-width: 901px)').matches) return;
    corpo.current?.querySelector('input, select, textarea')?.focus();
  }, [aberto]);

  return (
    <>
      <button type="button" className="btn btn-acao" onClick={() => setAberto(true)}>
        <Icone nome="add" />
        {abrir}
      </button>

      <Folha
        aberta={aberto}
        aoFechar={fechar}
        titulo={titulo}
        descricao={descricao}
        rotuloFechar="Fechar sem salvar"
      >
        <form action={executar} className="folha-form">
          <div ref={corpo} className="folha-corpo">
            {children}
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
            <button type="button" className="btn btn-fant" onClick={fechar}>
              Cancelar
            </button>
            <BotaoEnviar enviando={enviando}>{enviar}</BotaoEnviar>
          </div>
        </form>
      </Folha>
    </>
  );
}
