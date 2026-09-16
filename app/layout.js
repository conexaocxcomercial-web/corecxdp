import { IBM_Plex_Mono, Inter } from 'next/font/google';
import { ScriptDeTema } from '@/componentes/Tema';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-sans',
  display: 'swap',
});

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fonte-mono',
  display: 'swap',
});

export const metadata = {
  title: { default: 'core.cx módulo DP', template: '%s | core.cx' },
  description:
    'Registro de pessoal: ficha dos colaboradores, ocorrências, atestados e movimentações.',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFEFF3' },
    { media: '(prefers-color-scheme: dark)', color: '#121215' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR" data-tema="claro" className={`${inter.variable} ${plex.variable}`} suppressHydrationWarning>
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
