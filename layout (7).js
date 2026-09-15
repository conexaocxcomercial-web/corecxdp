import { ScriptDeTema } from '@/componentes/Tema';
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F4' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR" data-tema="claro" suppressHydrationWarning>
      <head>
        <ScriptDeTema />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
