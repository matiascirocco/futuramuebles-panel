import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';

/**
 * Los movimientos: por qué el stock dice lo que dice.
 *
 * Sin `insumo` devuelve los últimos de todo el depósito, que es lo que mira uno
 * cuando algo no cierra.
 */
export async function GET(req: Request) {
  const permiso = await autorizar({ seccion: 'stock' });
  if (!permiso.ok) return permiso.respuesta;

  const insumo = new URL(req.url).searchParams.get('insumo');

  let query = db
    .from('movimientos_stock')
    .select('*, insumos(nombre, unidad), usuarios(nombre)')
    .order('created_at', { ascending: false })
    .limit(insumo ? 200 : 100);

  if (insumo) query = query.eq('insumo_id', Number(insumo));

  const { data, error } = await query;
  if (error) {
    console.error('[stock] la consulta falló:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(
    data.map((m) => ({
      ...m,
      insumo_nombre: m.insumos?.nombre ?? null,
      insumo_unidad: m.insumos?.unidad ?? null,
      usuario_nombre: m.usuarios?.nombre ?? null,
    }))
  );
}

/**
 * Mover stock a mano: un consumo o un ajuste.
 *
 *   consumo — salió para un mueble. El motivo es qué trabajo se lo llevó, y por
 *             eso es obligatorio: sin el trabajo anotado, dentro de un mes el
 *             movimiento dice que faltan tres placas y nada más.
 *   ajuste  — todo lo demás: el conteo físico, una rotura, un sobrante que
 *             volvió del taller, la carga inicial.
 *
 * Las compras NO entran por acá: entran cargando la compra, que es la que deja
 * el documento y el costo.
 */
export async function POST(req: Request) {
  const permiso = await autorizar({ seccion: 'stock' });
  if (!permiso.ok) return permiso.respuesta;

  const body = await req.json();

  const insumoId = Number(body.insumo_id);
  const tipo = body.tipo === 'consumo' ? 'consumo' : 'ajuste';
  const motivo = String(body.motivo ?? '').trim();
  const crudo = Number(body.cantidad);

  if (!insumoId) {
    return NextResponse.json({ error: 'Falta el insumo' }, { status: 400 });
  }
  if (!Number.isFinite(crudo) || crudo === 0) {
    return NextResponse.json(
      {
        error:
          tipo === 'consumo'
            ? 'Poné cuánto se usó'
            : 'La cantidad no puede ser cero: poné cuánto entra (+) o cuánto sale (−)',
      },
      { status: 400 }
    );
  }
  if (!motivo) {
    return NextResponse.json(
      { error: tipo === 'consumo' ? 'Anotá para qué trabajo salió' : 'Escribí por qué se ajusta' },
      { status: 400 }
    );
  }

  // El consumo siempre resta. La pantalla manda un número positivo —se escribe
  // "salieron 3", no "−3"— y el signo se pone acá, que es donde vive la regla.
  const cantidad = tipo === 'consumo' ? -Math.abs(crudo) : crudo;

  const { data, error } = await db
    .from('movimientos_stock')
    .insert({ insumo_id: insumoId, cantidad, tipo, motivo, usuario_id: permiso.sesion.id })
    .select()
    .single();

  if (error) {
    console.error('[stock] no se pudo mover:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(data, { status: 201 });
}
