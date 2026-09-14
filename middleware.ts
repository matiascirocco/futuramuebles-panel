import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { puedeVer, seccionDe, API_SIEMPRE } from '@/lib/permisos';
import type { Rol } from '@/lib/types';

// Rutas que no piden sesión: el splash y el login.
const PUBLICAS = ['/', '/login', '/api/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLICAS.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get('fm_session')?.value;
  let rol: Rol | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.AUTH_SECRET!)
      );
      rol = (payload.rol as Rol) ?? null;
    } catch {
      rol = null;
    }
  }

  // Sin sesión válida: las APIs contestan 401, las páginas van al login.
  if (!rol) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Con sesión, pero puede no alcanzarle el rol para esta sección.
  const seccion = seccionDe(pathname);
  const esApi = pathname.startsWith('/api/');

  if (seccion && !(esApi && API_SIEMPRE.includes(seccion)) && !puedeVer(rol, seccion)) {
    if (esApi) {
      return NextResponse.json(
        { error: 'Tu usuario no tiene acceso a esta sección' },
        { status: 403 }
      );
    }
    // A una pantalla que sí puede ver, en vez de dejarlo en un error.
    return NextResponse.redirect(new URL('/dashboard/insumos', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
