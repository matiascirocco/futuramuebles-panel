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
  { href: '/dashboard/movimientos', icon: ArrowLeftRight, label: 'Movim.', seccion: 'movimientos' },
  { href: '/dashboard/usuarios', icon: UserCog, label: 'Usuarios', seccion: 'usuarios' },
];

/**
 * El menú, en dos formas según la pantalla.
 *
 * En el celular es una barra abajo: es donde llega el pulgar, y el panel se usa
 * con una mano mientras la otra sostiene una placa. En escritorio vuelve a ser
 * el riel vertical de la izquierda.
 *
 * Las etiquetas se ven solo en el celular. En el riel no entran, y ahí el
 * puntero tiene tooltip; en una pantalla táctil no hay hover que valga, así que
 * un ícono solo es una adivinanza.
 */
export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const visibles = LINKS.filter((l) => !l.seccion || puedeVer(rol, l.seccion));

  return (
    <nav
      className="barra-abajo fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-[var(--color-borde)] bg-[var(--color-superficie)] md:inset-x-auto md:bottom-auto md:left-4 md:top-1/2 md:w-auto md:-translate-y-1/2 md:flex-col md:gap-1 md:rounded-2xl md:border md:p-2"
      aria-label="Secciones"
    >
      {visibles.map(({ href, icon: Icon, label }) => {
        const activo = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={activo ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 transition md:h-11 md:w-11 md:flex-none md:gap-0 md:rounded-xl md:py-0 ${
              activo
                ? 'text-[var(--color-acento)] md:bg-[var(--color-acento)] md:text-white'
                : 'text-[var(--color-tenue)] md:hover:bg-white/5 md:hover:text-[var(--color-texto)]'
            }`}
          >
            <Icon size={20} className="shrink-0 md:size-[18px]" />
            <span className="text-[10px] leading-none md:hidden">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
