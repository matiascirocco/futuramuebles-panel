import { redirect } from 'next/navigation';
import { getSesion } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { MenuCuenta } from '@/components/menu-cuenta';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getSesion();
  if (!sesion) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="fixed right-6 top-4 z-40 flex items-center gap-2">
        <MenuCuenta nombre={sesion.nombre} email={sesion.email} rol={sesion.rol} />
      </header>

      <Sidebar rol={sesion.rol} />
      <ThemeToggle />

      <main className="min-h-screen">{children}</main>
    </div>
  );
}
