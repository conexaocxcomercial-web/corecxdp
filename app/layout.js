import { ScriptDeTema } from '@/componentes/Tema';
import './globals.css';

export const metadata = {
  title: { default: 'core.cx módulo DP', template: '%s | core.cx' },
  description:
    'Registro de pessoal: ficha dos colaboradores, ocorrências, atestados e movimentações.',
};

export const viewport = {
  // Meta tag não lê variável CSS: são --marca-gelo e --marca-preto.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F4' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR" data-tema="claro" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <ScriptDeTema />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
