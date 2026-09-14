import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { autorizar } from '@/lib/autorizar';

export async function GET() {
  const permiso = await autorizar({ rol: 'admin' });
  if (!permiso.ok) return permiso.respuesta;

  // Sin password_hash, ni siquiera para el admin: no hay nada que hacer con él
  // desde la pantalla, y lo que no se manda no se filtra.
  const { data, error } = await db
    .from('usuarios')
    .select('id, nombre, email, rol, activo, created_at')
    .order('rol')
    .order('nombre');

  if (error) {
    console.error('[usuarios] la consulta falló:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const permiso = await autorizar({ rol: 'admin' });
  if (!permiso.ok) return permiso.respuesta;

  const body = await req.json();
  const nombre = String(body.nombre ?? '').trim();
  const email = String(body.email ?? '').toLowerCase().trim();
  const password = String(body.password ?? '');
  const rol = body.rol === 'admin' ? 'admin' : 'taller';

  if (!nombre || !email) {
    return NextResponse.json({ error: 'Faltan el nombre y el email' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'La contraseña tiene que tener al menos 8 caracteres' },
      { status: 400 }
    );
  }

  const { data, error } = await db
    .from('usuarios')
    .insert({
      nombre,
      email,
      password_hash: await bcrypt.hash(password, 10),
      rol,
      activo: true,
    })
    .select('id, nombre, email, rol, activo, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya hay alguien con ese email' }, { status: 409 });
    }
    console.error('[usuarios] no se pudo crear:', error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(data, { status: 201 });
}
