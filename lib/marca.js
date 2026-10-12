/**
 * Textos de apresentação e contatos da marca num só lugar. Quando o
 * produto virar white label, é aqui (e nas cores --marca-* do
 * globals.css) que a marca troca.
 */
export const MARCA = {
  empresa: 'Conexão CX',
  frase: 'O departamento pessoal da sua empresa, num só lugar.',
  // Os perfis de docs/conceito.md › 3: a Gestão da empresa lança e aprova;
  // o parceiro (contabilidade ou consultoria) acompanha e exporta.
  perfis: [
    { titulo: 'Gestão lança', texto: 'Colaboradores, ocorrências, atestados e movimentações, até pelo celular.' },
    { titulo: 'Gestão aprova', texto: 'Atestados aprovados ou rejeitados direto na lista, sem papel.' },
    { titulo: 'Parceiro acompanha', texto: 'A contabilidade consulta os indicadores dos clientes, sem precisar pedir.' },
  ],
  contato: {
    whatsapp: {
      exibicao: '(84) 99487-2055',
      link: `https://wa.me/5584994872055?text=${encodeURIComponent('Olá! Quero conhecer o core.cx.')}`,
    },
    email: {
      exibicao: 'comercial@conexaocx.com.br',
      link: 'mailto:comercial@conexaocx.com.br?subject=Quero%20conhecer%20o%20core.cx',
    },
  },
  // Ajuda de quem já usa (menu do usuário): os mesmos canais da Conexão CX
  // que a entrada indica para quem perdeu o acesso.
  suporte: {
    whatsapp: {
      exibicao: '(84) 99487-2055',
      link: `https://wa.me/5584994872055?text=${encodeURIComponent('Olá! Preciso de ajuda com o core.cx.')}`,
    },
    email: {
      exibicao: 'comercial@conexaocx.com.br',
      link: 'mailto:comercial@conexaocx.com.br?subject=Ajuda%20com%20o%20core.cx',
    },
  },
};
