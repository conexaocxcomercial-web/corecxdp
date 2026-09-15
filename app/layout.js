import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--fonte-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fonte-mono',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'core.cx módulo DP',
    template: '%s — core.cx módulo DP',
  },
  description:
    'Registro de pessoal: ficha dos colaboradores, ocorrências, atestados e movimentações em um só lugar.',
};

export const viewport = {
  themeColor: '#16283C',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
