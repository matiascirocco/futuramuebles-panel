import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Futura Muebles — Depósito',
  description: 'Compras y stock de insumos',
  robots: { index: false, follow: false },
};

/**
 * `viewport-fit=cover` para que el fondo llegue hasta el borde en los iPhone
 * con notch; el pie de la barra de navegación lo compensa con
 * env(safe-area-inset-bottom).
 *
 * Sin `maximumScale`: el panel se usa en el galpón, y bloquear el zoom para
 * que "se vea prolijo" es quitarle a alguien la forma de leer un número.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
