import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, faltaConfig } from '@/lib/supabase';
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
  // Sin esto, un deploy al que le falta una variable contesta 500 sin cuerpo y
  // no hay forma de saber qué pasó desde afuera.
  const falta = faltaConfig();
  if (falta) {
    console.error('[login] falta configuración:', falta);
    return NextResponse.json(
      { error: `El panel está a medio configurar: falta ${falta} en las variables de entorno.` },
      { status: 503 }
    );
  }

  try {
    return await entrar(req);
  } catch (e) {
    // La base caída, una URL mal escrita, la red. Lo que no puede pasar es que
    // el navegador reciba un 500 sin cuerpo y no haya nada que mirar.
    console.error('[login] error inesperado:', e);
    return NextResponse.json(
      { error: 'No se pudo llegar a la base de datos. Revisá SUPABASE_URL y la service_role key.' },
      { status: 503 }
    );
  }
}

async function entrar(req: Request) {
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

    // Durante la puesta en marcha el error casi siempre es el mismo: el
    // proyecto de Supabase está creado pero vacío. Decirlo por su nombre
    // ahorra ir a buscar el log de Vercel para enterarse de eso.
    //
    // 42P01 es "undefined_table" de Postgres; PGRST205 es PostgREST cuando la
    // tabla no está en su cache de esquema. No hay nada sensible en admitir
    // que un panel todavía no tiene base: no dice quién existe ni qué guarda.
    const sinTablas = errorConsulta.code === '42P01' || errorConsulta.code === 'PGRST205';

    return NextResponse.json(
      {
        error: sinTablas
          ? 'La base está vacía: falta correr db/schema.sql en el SQL Editor de Supabase.'
          : `La base rechazó la consulta (${errorConsulta.code ?? 'sin código'}). Mirá el log de Vercel.`,
      },
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
