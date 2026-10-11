'use client';

import { useActionState, useEffect } from 'react';
import { entrar } from '@/app/acoes';
import { BotaoEnviar } from '@/componentes/Botao';
import { Caixa, Senha, Texto } from '@/componentes/Campos';
import { Icone } from '@/componentes/Icones';

export function FormularioDeEntrada({ destino }) {
  const [estado, executar] = useActionState(entrar, {});
  const erro = estado?.erro;

  // Desktop: o cursor já começa no e-mail. No celular não, para o
  // teclado não cobrir a tela antes de a pessoa ver onde está.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) {
      document.getElementById('email')?.focus();
    }
  }, []);

  // Depois de um erro, o e-mail continua e o cursor vai para a senha.
  useEffect(() => {
    if (erro) document.getElementById(estado.email ? 'senha' : 'email')?.focus();
  }, [estado, erro]);

  const descrito = erro ? 'entrada-erro' : undefined;

  return (
    <form action={executar} className="entrada-form">
      <input type="hidden" name="destino" value={destino} />

      <Texto
        rotulo="E-mail"
        nome="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="voce@suaempresa.com.br"
        defaultValue={estado?.email ?? ''}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito}
        required
      />

      <Senha
        rotulo="Senha"
        nome="senha"
        autoComplete="current-password"
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito}
        required
      />

      <Caixa
        nome="manter"
        value="sim"
        rotulo="Manter conectado por 7 dias"
        dica="Não marque em computador compartilhado."
        defaultChecked={Boolean(estado?.manterConectado)}
      />

      {erro ? (
        <div id="entrada-erro" className="faixa erro entrada-erro" role="alert">
          <Icone nome="error" />
          <span>{erro}</span>
        </div>
      ) : null}

      <BotaoEnviar icone="login" enviando="Conferindo…" className="entrada-botao">
        Entrar
      </BotaoEnviar>
    </form>
  );
}
