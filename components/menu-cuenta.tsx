'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { ROLES } from '@/lib/permisos';
import type { Rol } from '@/lib/types';

export function MenuCuenta({ nombre, email, rol }: { nombre: string; email: string; rol: Rol }) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();

  async function salir() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setAbierto((a) => !a)} className="p-2" aria-label="Cuenta">
        <MoreVertical size={20} />
      </button>

      {abierto && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-4 shadow-2xl">
          <p className="eyebrow mb-2">Cuenta</p>
          <p className="font-semibold">{nombre}</p>
          <p className="text-sm text-[var(--color-tenue)]">{email}</p>
          <p className="mb-4 mt-2 text-xs text-[var(--color-tenue)]">
            <strong className="text-[var(--color-texto)]">{ROLES[rol].nombre}</strong> ·{' '}
            {ROLES[rol].descripcion}
          </p>

          <button
            onClick={salir}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-alerta)] hover:bg-white/5"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
