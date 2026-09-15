/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './componentes/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta da marca
        grafite: '#1E1E1E',
        'grafite-60': '#5B5B5B',
        'grafite-45': '#7E7E7E',
        'grafite-30': '#A3A3A3',
        papel: '#F4F4F4',
        folha: '#FFFFFF',
        violeta: '#7371FF',
        'violeta-forte': '#4B49E8',
        lavanda: '#DBBFFF',
        'lavanda-clara': '#F0E8FF',
        lima: '#BEF533',
        'lima-escura': '#5A7A00',
        rosa: '#FF43C0',
        'rosa-escura': '#C2007F',
        linha: '#DCDCDC',
        'linha-clara': '#EBEBEB',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        campo: ['0.8125rem', { lineHeight: '1.15rem' }],
      },
      maxWidth: {
        conteudo: '1180px',
      },
      keyframes: {
        entrarPainel: {
          from: { transform: 'translateX(24px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        surgir: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        painel: 'entrarPainel 180ms cubic-bezier(.22,.61,.36,1)',
        surgir: 'surgir 140ms linear',
      },
    },
  },
  plugins: [],
};
