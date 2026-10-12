/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './componentes/**/*.{js,jsx}'],
  // hover: só onde há mouse; no toque o fundo de hover ficava preso na linha tocada.
  future: { hoverOnlyWhenSupported: true },
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
        'acao-texto': 'var(--acao-texto)',
        ok: 'var(--ok)',
        atencao: 'var(--atencao)',
        critico: 'var(--critico)',
        azul: 'var(--azul)',
        violeta: 'var(--marca-violeta)',
        lilas: 'var(--marca-lilas)',
        lima: 'var(--marca-lima)',
        rosa: 'var(--marca-rosa)',
        grafite: 'var(--marca-grafite)',
        gelo: 'var(--marca-gelo)',
      },
      fontFamily: {
        sans: ['var(--fonte)'],
      },
    },
  },
  plugins: [],
};
