import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';

/**
 * El catálogo con la existencia ya sumada.
 *
 * Al taller se le recortan los costos acá y no en la pantalla: si el filtro
 * viviera en el componente, el dato viajaría igual y estaría a un F12 de
 * distancia.
 */
export async function GET(req: Request) {
  const permiso = await autorizar({ seccion: 'insumos' });
  if (!permiso.ok) return permiso.respuesta;

  const params = new URL(req.url).searchParams;
  const q = params.get('q');
  const categoria = params.get('categoria');

  let query = db.from('insumos_stock').select('*').order('nombre');
  if (categoria) query = query.eq('categoria', categoria);
  if (q) query = query.or(`nombre.ilike.%${q}%,categoria.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error('[insumos] la consulta falló:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (permiso.sesion.rol !== 'admin') {
    return NextResponse.json(
      data.map(({ costo_ultimo: _c, costo_actualizado_at: _f, ...resto }) => resto)
    );
  }

  return NextResponse.json(data);
}

/**
 * Dar de alta un insumo.
 *
 * No se le carga costo a mano: el costo lo pone la compra. Un costo tipeado acá
 * es un número que nadie verificó y que después se usa para cotizar.
 */
export async function POST(req: Request) {
  const permiso = await autorizar({ rol: 'admin' });
  if (!permiso.ok) return permiso.respuesta;

  const body = await req.json();
  const nombre = String(body.nombre ?? '').trim();

  if (!nombre) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  }

  const { data, error } = await db
    .from('insumos')
    .insert({
      nombre,
      descripcion: (body.descripcion ?? '').trim() || null,
      categoria: (body.categoria ?? '').trim() || null,
      unidad: (body.unidad ?? '').trim() || null,
      alerta_stock:
        body.alerta_stock === '' || body.alerta_stock == null ? null : Number(body.alerta_stock),
      activo: body.activo ?? true,
    })
    .select()
    .single();

  if (error) {
    // 23505 es la violación del índice único sobre lower(nombre). Dos insumos
    // con el mismo nombre parten el stock en dos y hacen inservible el buscador.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Ya existe un insumo que se llama "${nombre}"` },
        { status: 409 }
      );
    }
    console.error('[insumos] no se pudo crear:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(data, { status: 201 });
}
