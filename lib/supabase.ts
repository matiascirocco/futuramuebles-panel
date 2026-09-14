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
 * Qué problema tiene la configuración, en una frase, o null si está bien.
 *
 * Existe porque `conectar()` tira una excepción, y una excepción adentro de un
 * route handler sale como un 500 pelado: el navegador no muestra nada y el
 * motivo queda enterrado en los logs de Vercel. Para el único endpoint al que
 * se llega sin sesión —el login— eso convierte "falta cargar una variable" en
 * "el panel no anda y no sé por qué".
 */
export function faltaConfig(): string | null {
  const falta = [
    !process.env.SUPABASE_URL && 'SUPABASE_URL',
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !process.env.AUTH_SECRET && 'AUTH_SECRET',
  ].filter(Boolean) as string[];

  if (falta.length > 0) {
    return `falta ${falta.join(' y ')} en las variables de entorno`;
  }

  // Cargada pero mal. `createClient()` tira una excepción al parsear una URL
  // inválida, y eso salía por el catch genérico como "no se pudo llegar a la
  // base" — que manda a revisar la red cuando el problema es un valor mal
  // pegado. Los tres casos que vimos: el connection string de Postgres en vez
  // del Project URL, la URL sin protocolo, y un espacio o salto de línea
  // colado al copiar.
  const url = process.env.SUPABASE_URL!;
  if (url !== url.trim()) {
    return 'SUPABASE_URL tiene espacios o un salto de línea al principio o al final';
  }
  // El ejemplo de la documentación, pegado tal cual. Pasa porque un
  // placeholder con forma de valor real se copia sin pensarlo, y después el
  // síntoma es "fetch failed": un dominio que no existe resuelve igual de mal
  // que uno mal tipeado, y manda a buscar el problema a la API key.
  if (/abcdefghijklm|xxxxxxxx|tu-proyecto|TU-PROYECTO/.test(url)) {
    return `SUPABASE_URL quedó con el ejemplo de la documentación (${url}), no con el Project URL de tu proyecto`;
  }

  if (!/^https:\/\/[^\s/]+\/?$/.test(url)) {
    return `SUPABASE_URL está mal formada ("${url.slice(0, 30)}…"): va el Project URL, https://xxxx.supabase.co, no el connection string de Postgres`;
  }

  return null;
}

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
