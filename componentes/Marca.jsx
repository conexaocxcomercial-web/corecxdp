import Image from 'next/image';

/**
 * Nome do produto em texto: "core" na cor do texto, ".cx" no violeta
 * da marca e, ao lado, o subtítulo "módulo dp".
 */
export function Marca({ modulo = true, grande = false }) {
  return (
    <span className={`marca ${grande ? 'marca-g' : ''}`}>
      core<span className="marca-cx">.cx</span>
      {modulo ? <span className="marca-mod">módulo dp</span> : null}
    </span>
  );
}

const LOGOS = {
  'rh-estrategico': {
    alt: 'Uma solução cx de RH Estratégico',
    clara: { src: '/marca/cx-rh-estrategico-preto.png', largura: 1709, altura: 372 },
    escura: { src: '/marca/cx-rh-estrategico-branco.png', largura: 1709, altura: 372 },
  },
  'conexao-cx': {
    alt: 'Conexão CX',
    clara: { src: '/marca/conexao-cx-preto.png', largura: 1095, altura: 219 },
    escura: { src: '/marca/conexao-cx-branco.png', largura: 1280, altura: 219 },
  },
};

/**
 * Logo da Conexão CX em imagem. Renderiza as duas versões e o CSS
 * mostra a preta no tema claro e a branca no escuro, sem piscar na
 * troca. A altura vem do CSS de quem usa (`.assinatura`).
 */
export function Assinatura({ logo = 'rh-estrategico' }) {
  const { alt, clara, escura } = LOGOS[logo];

  return (
    <>
      <Image
        src={clara.src}
        width={clara.largura}
        height={clara.altura}
        alt={alt}
        sizes="200px"
        className="assinatura assinatura-clara"
      />
      <Image
        src={escura.src}
        width={escura.largura}
        height={escura.altura}
        alt={alt}
        sizes="200px"
        className="assinatura assinatura-escura"
      />
    </>
  );
}
