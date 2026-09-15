/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './componentes/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        papel: '#E9EDF0',
        folha: '#FFFFFF',
        tinta: '#16283C',
        'tinta-70': '#47596B',
        'tinta-50': '#6F7F8E',
        'tinta-30': '#9BA8B3',
        linha: '#D5DCE2',
        'linha-clara': '#E6EBEF',
        carimbo: '#5A2D9C',
        'carimbo-escuro': '#47207F',
        'carimbo-claro': '#F1ECFB',
        ativo: '#1C6B4C',
        atencao: '#9A5A0B',
        recusa: '#9E2A2B',
      },
      fontFamily: {
        sans: ['var(--fonte-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--fonte-mono)', 'ui-monospace', 'monospace'],
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
