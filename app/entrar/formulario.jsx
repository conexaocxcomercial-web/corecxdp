'use client';

import { useActionState } from 'react';
import { entrar } from '@/app/acoes';
import { BotaoEnviar } from '@/componentes/Botao';
import { Texto } from '@/componentes/Campos';
import { Icone } from '@/componentes/Icones';

export function FormularioDeEntrada({ destino }) {
  const [estado, executar] = useActionState(entrar, {});

  return (
    <form action={executar} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="destino" value={destino} />

      <Texto
        rotulo="E-mail"
        nome="email"
        type="email"
        autoComplete="username"
        placeholder="voce@suaempresa.com.br"
        required
      />
      <Texto
        rotulo="Senha"
        nome="senha"
        type="password"
        autoComplete="current-password"
        required
      />

      {estado?.erro ? (
        <div className="faixa erro" style={{ marginBottom: 0 }}>
          <Icone nome="error" />
          <span>{estado.erro}</span>
        </div>
      ) : null}

      <BotaoEnviar icone="login" enviando="Conferindo…" className="w-full justify-center">
        Entrar
      </BotaoEnviar>

      <p className="entrada-ajuda">
        Perdeu o acesso? Quem administra a plataforma pode recriar sua senha na aba Usuarios da
        planilha.
      </p>
    </form>
  );
}
