import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/supabase';
import { crearSesion } from '@/lib/session';

const MAX_INTENTOS = 5;
const VENTANA_MIN = 15;

/** Cuántos intentos fallidos hubo desde esta IP en los últimos minutos. */
async function intentosRecientes(ip: string) {
  const desde = new Date(Date.now() - VENTANA_MIN * 60_000).toISOString();
  const { count } = await db
    .from('intentos_login')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('intentado_at', desde);
  return count ?? 0;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'desconocida';

  if ((await intentosRecientes(ip)) >= MAX_INTENTOS) {
    return NextResponse.json(
      { error: `Demasiados intentos. Probá de nuevo en ${VENTANA_MIN} minutos.` },
      { status: 429 }
    );
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  const normalizado = String(email).toLowerCase().trim();

  const { data: usuario, error: errorConsulta } = await db
    .from('usuarios')
    .select('id, nombre, email, rol, password_hash, activo')
    .eq('email', normalizado)
    .maybeSingle();

  // Si la base no responde, decirlo: contestar "contraseña incorrecta" manda a
  // buscar el problema exactamente donde no está.
  if (errorConsulta) {
    console.error('[login] la consulta falló:', errorConsulta);
    return NextResponse.json(
      { error: 'No se pudo conectar con la base de datos' },
      { status: 503 }
    );
  }

  const fallar = async () => {
    await db.from('intentos_login').insert({ ip, email: normalizado });
    // Mismo mensaje para "no existe" y "contraseña mala": no le contamos a
    // nadie qué emails están dados de alta.
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
  };

  if (!usuario || !usuario.activo) {
    // Gastamos el mismo tiempo que una comparación real para no delatar por
    // demora si el email existe o no.
    await bcrypt.compare(
      password,
      '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvaliduO'
    );
    return fallar();
  }

  if (!(await bcrypt.compare(password, usuario.password_hash))) return fallar();

  // Login bueno: limpiamos los fallidos de esta IP.
  await db.from('intentos_login').delete().eq('ip', ip);

  await crearSesion({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  });

  return NextResponse.json({ ok: true });
}
