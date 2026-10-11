import { ScriptDeTema } from '@/componentes/Tema';
import { FONTE_DE_ICONES } from '@/componentes/Icones';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTE_DE_ICONES} />
        <ScriptDeTema />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
