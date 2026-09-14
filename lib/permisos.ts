import type { Rol } from './types';

/**
 * Qué puede tocar cada rol, en un solo lugar.
 *
 * El menú, el middleware y los endpoints leen de acá. Si estuviera repartido,
 * tarde o temprano el menú escondería algo que la ruta igual deja entrar —o al
 * revés, que es peor: un botón que rebota.
 */

export const ROLES: Record<Rol, { nombre: string; descripcion: string }> = {
  admin: {
    nombre: 'Administrador',
    descripcion: 'Todo: compras, costos, usuarios y el depósito.',
  },
  taller: {
    nombre: 'Taller',
    descripcion:
      'Ve el catálogo y el depósito, descuenta lo que usa y ajusta por conteo. No ve costos ni compras.',
  },
};

/** Secciones que cada rol tiene permitidas. El admin no se lista: puede todo. */
const SECCIONES: Record<Rol, string[]> = {
  admin: [],
  taller: [
    'insumos',      // el catálogo de materiales
    'stock',        // descontar lo que se usa y ajustar por conteo
    'movimientos',  // el libro: por qué el stock dice lo que dice
  ],
};

export function puedeVer(rol: Rol, seccion: string): boolean {
  if (rol === 'admin') return true;
  return (SECCIONES[rol] ?? []).includes(seccion);
}

/**
 * Traduce una ruta a la sección que le corresponde.
 * `/dashboard/insumos` -> `insumos`
 */
export function seccionDe(ruta: string): string | null {
  const m = ruta.match(/^\/(?:dashboard|api)\/([^/?]+)/);
  return m ? m[1] : null;
}

/** Endpoints que cualquiera con sesión necesita, sin importar el rol. */
export const API_SIEMPRE = ['logout'];

/**
 * `compras` no está en la lista del taller a propósito: ahí están los costos,
 * y con ellos lo que pagás a cada proveedor. Quien arma un mueble necesita
 * saber cuántas placas quedan, no a cuánto las compraste.
 *
 * Por lo mismo, la pantalla de Insumos le oculta la columna de costo al taller
 * —el dato viaja igual en la API, así que el filtro real está en el endpoint—.
 *
 * `usuarios` es solo del admin: dar de alta a alguien es dar acceso.
 */
