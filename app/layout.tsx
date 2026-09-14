import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Futura Muebles — Depósito',
  description: 'Compras y stock de insumos',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado antes de pintar, así no parpadea en blanco. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='claro')document.documentElement.dataset.theme='claro'}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
