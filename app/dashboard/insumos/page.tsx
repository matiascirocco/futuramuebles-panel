import { redirect } from 'next/navigation';
import { getSesion } from '@/lib/session';
import { Catalogo } from './catalogo';

export const dynamic = 'force-dynamic';

export default async function Insumos() {
  const sesion = await getSesion();
  if (!sesion) redirect('/login');

  // La pantalla no mira el rol por su cuenta: recibe lo que puede hacer. El
  // recorte de verdad está en el endpoint —la API no le manda los costos al
  // taller—; esto solo evita mostrar un botón que después rebota.
  const esAdmin = sesion.rol === 'admin';

  return <Catalogo puedeVerCostos={esAdmin} puedeEditar={esAdmin} />;
}
