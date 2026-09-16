/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './componentes/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mesa: 'var(--mesa)',
        papel: 'var(--papel)',
        'papel-2': 'var(--papel-2)',
        linha: 'var(--linha)',
        'linha-2': 'var(--linha-2)',
        tinta: 'var(--tinta)',
        'tinta-2': 'var(--tinta-2)',
        'tinta-3': 'var(--tinta-3)',
        acao: 'var(--acao)',
        'acao-forte': 'var(--acao-forte)',
        'acao-fraco': 'var(--acao-fraco)',
        ok: 'var(--ok)',
        atencao: 'var(--atencao)',
        critico: 'var(--critico)',
        azul: 'var(--azul)',
        lime: '#BEF533',
      },
      fontFamily: {
        sans: ['var(--fonte-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--fonte-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
