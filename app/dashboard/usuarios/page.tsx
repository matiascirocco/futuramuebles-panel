import { redirect } from 'next/navigation';
import { getSesion } from '@/lib/session';
import { Lista } from './lista';

export const dynamic = 'force-dynamic';

export default async function Usuarios() {
  const sesion = await getSesion();
  if (!sesion) redirect('/login');
  if (sesion.rol !== 'admin') redirect('/dashboard/insumos');

  // La pantalla necesita saber cuál es la propia cuenta para no ofrecer
  // desactivarse ni sacarse el admin: la API lo rechaza igual, pero un botón
  // que rebota es peor que un botón que no está.
  return <Lista yo={sesion.id} />;
}
