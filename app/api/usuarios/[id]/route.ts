import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Cambiar rol, activar/desactivar, o poner una contraseña nueva.
 *
 * No hay DELETE: el usuario está nombrado en compras y movimientos viejos.
 * Quien se va se desactiva, y sus movimientos siguen diciendo quién los hizo.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const permiso = await autorizar({ rol: 'admin' });
  if (!permiso.ok) return permiso.respuesta;

  const { id } = await params;
  const body = await req.json();
  const cambios: Record<string, unknown> = {};

  if ('nombre' in body) {
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    cambios.nombre = nombre;
  }

  if ('rol' in body) cambios.rol = body.rol === 'admin' ? 'admin' : 'taller';
  if ('activo' in body) cambios.activo = !!body.activo;

  if ('password' in body) {
    const password = String(body.password ?? '');
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña tiene que tener al menos 8 caracteres' },
        { status: 400 }
      );
    }
    cambios.password_hash = await bcrypt.hash(password, 10);
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
  }

  // Quedarse afuera del panel por desactivarse a uno mismo, o por sacarse el
  // admin, obliga a volver al SQL de Supabase para entrar. Se corta antes.
  if (id === permiso.sesion.id) {
    if (cambios.activo === false) {
      return NextResponse.json({ error: 'No podés desactivarte a vos mismo' }, { status: 400 });
    }
    if (cambios.rol === 'taller') {
      return NextResponse.json(
        { error: 'No podés sacarte el rol de administrador a vos mismo' },
        { status: 400 }
      );
    }
  }

  const { data, error } = await db
    .from('usuarios')
    .update(cambios)
    .eq('id', id)
    .select('id, nombre, email, rol, activo, created_at')
    .single();

  if (error) {
    console.error('[usuarios] no se pudo actualizar:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(data);
}
