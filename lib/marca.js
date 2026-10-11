/**
 * Textos de apresentação e contatos da marca num só lugar. Quando o
 * produto virar white label, é aqui (e nas cores --marca-* do
 * globals.css) que a marca troca.
 */
export const MARCA = {
  empresa: 'Conexão CX',
  frase: 'O departamento pessoal da sua empresa, num só lugar.',
  perfis: [
    { titulo: 'RH lança', texto: 'Colaboradores, ocorrências, atestados e movimentações.' },
    { titulo: 'Gestor aprova', texto: 'Atestados e movimentações decididos até pelo celular.' },
    { titulo: 'Contador confere', texto: 'Histórico e indicadores claros para conferir.' },
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
};
