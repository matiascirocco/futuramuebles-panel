import { NextResponse } from 'next/server';
import { getSesion, type Sesion } from './session';
import { puedeVer } from './permisos';

/**
 * El middleware solo verifica que HAYA sesión. Quién puede hacer qué se decide
 * acá, y hay que llamarlo explícitamente en cada handler: como la app usa la
 * service role key de Supabase, no hay una segunda barrera en la base que nos
 * salve si nos olvidamos.
 */

type Resultado =
  | { ok: true; sesion: Sesion }
  | { ok: false; respuesta: NextResponse };

export async function autorizar(opciones?: {
  rol?: 'admin';
  /** Una sección de lib/permisos: el rol tiene que poder verla. */
  seccion?: string;
}): Promise<Resultado> {
  const sesion = await getSesion();

  if (!sesion) {
    return {
      ok: false,
      respuesta: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    };
  }

  if (opciones?.rol === 'admin' && sesion.rol !== 'admin') {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { error: 'Necesitás permisos de administrador' },
        { status: 403 }
      ),
    };
  }

  if (opciones?.seccion && !puedeVer(sesion.rol, opciones.seccion)) {
    return {
      ok: false,
      respuesta: NextResponse.json({ error: 'No tenés permiso para esto' }, { status: 403 }),
    };
  }

  return { ok: true, sesion };
}
