import { redirect } from 'next/navigation';
import { getSesion } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';
import { MenuCuenta } from '@/components/menu-cuenta';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getSesion();
  if (!sesion) redirect('/login');

  return (
    <div className="min-h-screen">
      {/*
        En el celular el encabezado no puede ser `fixed`: tapa el título de cada
        pantalla justo donde se apoya el pulgar al scrollear. Se pega recién de
        md para arriba, que es donde sobra lugar.
      */}
      <header className="absolute right-3 top-3 z-40 flex items-center gap-2 md:fixed md:right-6 md:top-4">
        <MenuCuenta nombre={sesion.nombre} email={sesion.email} rol={sesion.rol} />
      </header>

      <Sidebar rol={sesion.rol} />

      <main className="min-h-screen">{children}</main>
    </div>
  );
}
