import './globals.css';

export const metadata = {
  title: {
    default: 'core.cx módulo DP',
    template: '%s — core.cx módulo DP',
  },
  description:
    'Registro de pessoal: ficha dos colaboradores, ocorrências, atestados e movimentações em um só lugar.',
};

export const viewport = {
  themeColor: '#1E1E1E',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
