import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';
import type { ItemCompra } from '@/lib/types';

/** Los renglones que tienen sentido: algo comprado, en alguna cantidad. */
function itemsValidos(crudos: unknown): ItemCompra[] {
  if (!Array.isArray(crudos)) return [];

  return crudos
    .map((i) => ({
      insumo_id: i?.insumo_id ? Number(i.insumo_id) : null,
      descripcion: String(i?.descripcion ?? '').trim(),
      cantidad: Number(i?.cantidad) || 0,
      costo_unitario: Number(i?.costo_unitario) || 0,
    }))
    .filter((i) => i.descripcion && i.cantidad > 0);
}

/**
 * Le pone a cada insumo el costo de esta compra.
 *
 * Solo si esta compra es igual o más nueva que la que fijó el costo actual.
 * Sin esa guarda, cargar el jueves una factura de marzo que quedó traspapelada
 * hace que el catálogo vuelva a los precios de marzo, y con eso se cotiza.
 */
async function actualizarCostos(items: ItemCompra[], fecha: string) {
  const conCosto = items.filter((i) => i.insumo_id && i.costo_unitario > 0);
  if (conCosto.length === 0) return;

  const { data: actuales, error } = await db
    .from('insumos')
    .select('id, costo_actualizado_at')
    .in('id', conCosto.map((i) => i.insumo_id as number));

  if (error) {
    // El stock ya entró, que es lo que importa. El costo se puede corregir
    // cargando la compra siguiente; no vale la pena voltear todo por esto.
    console.error('[compras] no se pudieron leer los costos actuales:', error);
    return;
  }

  const fijadoEn = new Map(
    (actuales ?? []).map((i) => [i.id as number, i.costo_actualizado_at as string | null])
  );

  for (const item of conCosto) {
    const previo = fijadoEn.get(item.insumo_id as number);
    if (previo && new Date(previo) > new Date(fecha)) continue;

    const { error: errorCosto } = await db
      .from('insumos')
      .update({ costo_ultimo: item.costo_unitario, costo_actualizado_at: fecha })
      .eq('id', item.insumo_id);

    if (errorCosto) console.error('[compras] no se pudo actualizar el costo:', errorCosto);
  }
}

export async function GET() {
  const permiso = await autorizar({ seccion: 'compras' });
  if (!permiso.ok) return permiso.respuesta;

  const { data, error } = await db
    .from('compras')
    .select('*, usuarios(nombre)')
    .order('fecha', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    console.error('[compras] la consulta falló:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(
    data.map((c) => ({ ...c, usuario_nombre: c.usuarios?.nombre ?? null }))
  );
}

/**
 * Cargar una compra.
 *
 * La compra es el documento; los movimientos son lo que mueve el depósito. Se
 * guardan las dos cosas: si los movimientos fallan, la compra se borra, porque
 * una compra sin movimientos es una mentira —dice que entró material que el
 * stock no tiene—.
 */
export async function POST(req: Request) {
  const permiso = await autorizar({ seccion: 'compras' });
  if (!permiso.ok) return permiso.respuesta;

  const body = await req.json();
  const items = itemsValidos(body.items);

  if (!body.proveedor?.trim()) {
    return NextResponse.json({ error: 'Poné de quién es la compra' }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: 'Cargá al menos un renglón' }, { status: 400 });
  }

  const fecha = body.fecha || new Date().toISOString().slice(0, 10);
  const total = items.reduce((a, i) => a + i.cantidad * i.costo_unitario, 0);

  const { data: compra, error } = await db
    .from('compras')
    .insert({
      proveedor: body.proveedor.trim(),
      comprobante: (body.comprobante ?? '').trim() || null,
      fecha,
      items,
      total,
      notas: (body.notas ?? '').trim() || null,
      usuario_id: permiso.sesion.id,
    })
    .select()
    .single();

  if (error) {
    console.error('[compras] no se pudo guardar:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  // Solo los renglones atados a un insumo del catálogo mueven stock. Un renglón
  // suelto —el flete, una changa— queda en el documento y no inventa existencia.
  const movimientos = items
    .filter((i) => i.insumo_id)
    .map((i) => ({
      insumo_id: i.insumo_id,
      cantidad: i.cantidad,
      tipo: 'compra' as const,
      compra_id: compra.id,
      usuario_id: permiso.sesion.id,
    }));

  if (movimientos.length > 0) {
    const { error: errorMov } = await db.from('movimientos_stock').insert(movimientos);

    if (errorMov) {
      console.error('[compras] no se pudieron cargar los movimientos:', errorMov);
      await db.from('compras').delete().eq('id', compra.id);
      return NextResponse.json(
        { error: `No se pudo actualizar el stock: ${errorMov.message}. La compra no se guardó.` },
        { status: 503 }
      );
    }
  }

  await actualizarCostos(items, fecha);

  return NextResponse.json(compra, { status: 201 });
}
