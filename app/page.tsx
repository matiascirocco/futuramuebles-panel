import { redirect } from 'next/navigation';
import { getSesion } from '@/lib/session';

/**
 * La raíz no muestra nada: manda adentro si hay sesión, al login si no.
 *
 * Es la única ruta que el middleware deja pasar sin cookie, así que decide acá.
 */
export default async function Inicio() {
  const sesion = await getSesion();
  redirect(sesion ? '/dashboard' : '/login');
}
