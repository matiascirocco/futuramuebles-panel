import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente de servidor: usa la service role key, así que NUNCA se importa desde
// un componente cliente. Toda la autorización la hace la app
// (lib/session.ts + lib/autorizar.ts en cada route handler).

// Red de seguridad: si algún import arrastra este módulo a un componente
// cliente, revienta acá en vez de publicar la llave.
if (typeof window !== 'undefined') {
  throw new Error('lib/supabase.ts es solo de servidor: expone la service role key');
}

let cliente: SupabaseClient | null = null;

/**
 * Se crea la primera vez que se usa, no al importar el módulo.
 *
 * Si se creara al importar, `next build` lo evalúa mientras analiza las rutas y
 * falla con "supabaseUrl is required" cuando todavía no hay variables de
 * entorno cargadas — un error que no dice nada sobre la causa real.
 */
function conectar(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !llave) {
    throw new Error(
      'Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Copiá .env.example a .env.local y completalas.'
    );
  }

  cliente ??= createClient(url, llave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

/** Se usa igual que un cliente normal: db.from('...').select() */
export const db = new Proxy({} as SupabaseClient, {
  get: (_destino, propiedad) => {
    const real = conectar() as unknown as Record<string | symbol, unknown>;
    const valor = real[propiedad];
    return typeof valor === 'function' ? valor.bind(real) : valor;
  },
});
