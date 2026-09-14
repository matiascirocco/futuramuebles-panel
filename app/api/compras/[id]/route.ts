import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Borrar una compra.
 *
 * Los movimientos se van solos: la clave foránea es `on delete cascade`. El
 * stock vuelve al valor que tenía antes de cargarla, y si eso lo deja en
 * negativo, es que ya se consumió lo que había entrado.
 *
 * Lo que NO se deshace es el costo: si esta compra fijó el `costo_ultimo` de
 * un insumo, ese número queda. Para recalcularlo habría que buscar la compra
 * anterior de cada insumo, y un costo viejo reapareciendo sin que nadie lo pida
 * es peor que uno que quedó quieto. Lo corrige la compra siguiente.
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const permiso = await autorizar({ rol: 'admin' });
  if (!permiso.ok) return permiso.respuesta;

  const { id } = await params;

  const { data: compra, error: errorLectura } = await db
    .from('compras')
    .select('id, proveedor')
    .eq('id', Number(id))
    .maybeSingle();

  if (errorLectura) {
    console.error('[compras] no se pudo leer para borrar:', errorLectura);
    return NextResponse.json({ error: errorLectura.message }, { status: 503 });
  }
  if (!compra) return NextResponse.json({ error: 'No existe' }, { status: 404 });

  const { error } = await db.from('compras').delete().eq('id', compra.id);

  if (error) {
    console.error('[compras] no se pudo borrar:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
