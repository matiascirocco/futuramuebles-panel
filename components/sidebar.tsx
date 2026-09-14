'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, ArrowLeftRight, UserCog } from 'lucide-react';
import { puedeVer } from '@/lib/permisos';
import type { Rol } from '@/lib/types';

const LINKS = [
  { href: '/dashboard', icon: Home, label: 'Inicio', seccion: null },
  { href: '/dashboard/insumos', icon: Package, label: 'Insumos', seccion: 'insumos' },
  { href: '/dashboard/compras', icon: ShoppingCart, label: 'Compras', seccion: 'compras' },
  { href: '/dashboard/movimientos', icon: ArrowLeftRight, label: 'Movimientos', seccion: 'movimientos' },
  { href: '/dashboard/usuarios', icon: UserCog, label: 'Usuarios', seccion: 'usuarios' },
];

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();

  return (
    <nav className="fixed left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-2">
      {LINKS.filter((l) => !l.seccion || puedeVer(rol, l.seccion)).map(
        ({ href, icon: Icon, label }) => {
          const activo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                activo
                  ? 'bg-[var(--color-acento)] text-white'
                  : 'text-[var(--color-tenue)] hover:bg-white/5 hover:text-[var(--color-texto)]'
              }`}
            >
              <Icon size={18} />
            </Link>
          );
        }
      )}
    </nav>
  );
}
