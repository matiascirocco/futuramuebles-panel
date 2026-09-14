'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { ROLES } from '@/lib/permisos';
import { ThemeToggle } from './theme-toggle';
import type { Rol } from '@/lib/types';

export function MenuCuenta({ nombre, email, rol }: { nombre: string; email: string; rol: Rol }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // En el celular no hay forma de "correrse" del menú: sin esto queda abierto
  // tapando la pantalla hasta que se toca justo el botón otra vez.
  useEffect(() => {
    if (!abierto) return;
    function afuera(e: MouseEvent | TouchEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', afuera);
    document.addEventListener('touchstart', afuera);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('touchstart', afuera);
    };
  }, [abierto]);

  async function salir() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        onClick={() => setAbierto((a) => !a)}
        aria-label="Cuenta"
        aria-expanded={abierto}
        className="grid h-11 w-11 place-items-center rounded-full"
      >
        <MoreVertical size={20} />
      </button>

      {abierto && (
        <div className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-4 shadow-2xl">
          <p className="eyebrow mb-2">Cuenta</p>
          <p className="font-semibold">{nombre}</p>
          <p className="truncate text-sm text-[var(--color-tenue)]">{email}</p>
          <p className="mb-3 mt-2 text-xs text-[var(--color-tenue)]">
            <strong className="text-[var(--color-texto)]">{ROLES[rol].nombre}</strong> ·{' '}
            {ROLES[rol].descripcion}
          </p>

          <div className="border-t border-[var(--color-borde)] pt-2">
            <ThemeToggle />
            <button
              onClick={salir}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-alerta)] hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
