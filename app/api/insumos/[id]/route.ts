import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const permiso = await autorizar({ rol: 'admin' });
  if (!permiso.ok) return permiso.respuesta;

  const { id } = await params;
  const body = await req.json();
  const cambios: Record<string, unknown> = {};

  if ('nombre' in body) {
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    cambios.nombre = nombre;
  }

  if ('descripcion' in body) cambios.descripcion = (body.descripcion ?? '').trim() || null;
  if ('categoria' in body) cambios.categoria = (body.categoria ?? '').trim() || null;
  if ('unidad' in body) cambios.unidad = (body.unidad ?? '').trim() || null;
  if ('activo' in body) cambios.activo = !!body.activo;
  if ('alerta_stock' in body) {
    cambios.alerta_stock =
      body.alerta_stock === '' || body.alerta_stock == null ? null : Number(body.alerta_stock);
  }

  // `costo_ultimo` no se toca desde acá aunque venga en el body: lo escribe la
  // compra. Editarlo a mano rompe la única garantía que da ese número, que es
  // venir de algo que pagaste de verdad.

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
  }

  const { data, error } = await db
    .from('insumos')
    .update(cambios)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un insumo con ese nombre' }, { status: 409 });
    }
    console.error('[insumos] no se pudo actualizar:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(data);
}

/**
 * No hay DELETE a propósito.
 *
 * Un insumo tiene movimientos colgando y está nombrado en compras viejas.
 * Borrarlo dejaría esos documentos hablando de algo que ya no existe —y la
 * clave foránea es `on delete restrict`, así que la base tampoco lo permite.
 * Para sacarlo de circulación se desactiva: desaparece de las listas y sigue
 * explicando el pasado.
 */
