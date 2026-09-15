/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './componentes/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens semânticos: o valor troca com o tema, a classe não muda.
        fundo: 'rgb(var(--fundo) / <alpha-value>)',
        superficie: 'rgb(var(--superficie) / <alpha-value>)',
        'superficie-2': 'rgb(var(--superficie-2) / <alpha-value>)',
        borda: 'rgb(var(--borda) / <alpha-value>)',
        'borda-forte': 'rgb(var(--borda-forte) / <alpha-value>)',
        texto: 'rgb(var(--texto) / <alpha-value>)',
        'texto-2': 'rgb(var(--texto-2) / <alpha-value>)',
        'texto-3': 'rgb(var(--texto-3) / <alpha-value>)',
        acao: 'rgb(var(--acao) / <alpha-value>)',
        'acao-hover': 'rgb(var(--acao-hover) / <alpha-value>)',
        'acao-texto': 'rgb(var(--acao-texto) / <alpha-value>)',
        // Cores fixas da marca
        marca: '#7371FF',
        lima: '#BEF533',
        lavanda: '#DBBFFF',
        rosa: '#FF43C0',
        grafite: '#1E1E1E',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        campo: ['0.8125rem', { lineHeight: '1.15rem' }],
      },
      maxWidth: { conteudo: '1240px' },
      borderRadius: { folha: '14px' },
      keyframes: {
        deslizarLado: {
          from: { transform: 'translateX(24px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        deslizarBaixo: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        surgir: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        lado: 'deslizarLado 200ms cubic-bezier(.22,.61,.36,1)',
        baixo: 'deslizarBaixo 240ms cubic-bezier(.22,.61,.36,1)',
        surgir: 'surgir 150ms linear',
      },
    },
  },
  plugins: [],
};
