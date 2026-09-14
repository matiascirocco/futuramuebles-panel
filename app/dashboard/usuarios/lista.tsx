'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { fecha } from '@/lib/format';
import { ROLES } from '@/lib/permisos';
import type { Rol, Usuario } from '@/lib/types';

export function Lista({ yo }: { yo: string }) {
  const [datos, setDatos] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alta, setAlta] = useState(false);
  const [error, setError] = useState('');

  function traer() {
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then((d) => setDatos(Array.isArray(d) ? d : []))
      .finally(() => setCargando(false));
  }

  useEffect(traer, []);

  async function cambiar(u: Usuario, cambios: Record<string, unknown>) {
    setError('');
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    });

    if (res.ok) {
      traer();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'No se pudo cambiar' }));
      setError(error);
    }
  }

  async function nuevaClave(u: Usuario) {
    const password = prompt(
      `Contraseña nueva para ${u.nombre}.\n\n` +
        'Mínimo 8 caracteres. Pasásela por un medio seguro y pedile que la cambie.'
    );
    if (!password) return;
    await cambiar(u, { password });
  }

  return (
    <div className="pantalla max-w-4xl">
      <header className="mb-8 pr-12 md:pr-0 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-borde)] pb-6">
        <div>
          <p className="eyebrow">Futura Muebles</p>
          <h1 className="text-3xl font-bold">Usuarios</h1>
        </div>
        <button
          onClick={() => setAlta(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--color-acento)] px-5 py-2.5 font-semibold text-white transition hover:brightness-125"
        >
          <Plus size={18} /> Nuevo usuario
        </button>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {(Object.keys(ROLES) as Rol[]).map((r) => (
          <div
            key={r}
            className="rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-5"
          >
            <p className="font-semibold">{ROLES[r].nombre}</p>
            <p className="mt-1 text-sm text-[var(--color-tenue)]">{ROLES[r].descripcion}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-[var(--color-alerta)]/40 px-4 py-3 text-sm text-[var(--color-alerta)]">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-borde)]">
        <table className="w-full min-w-[34rem] text-left">
          <thead>
            <tr className="border-b border-[var(--color-borde)]">
              {['Nombre', 'Email', 'Rol', 'Estado', 'Desde', ''].map((h, n) => (
                <th key={n} className="eyebrow px-4 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-tenue)]">
                  Cargando…
                </td>
              </tr>
            )}

            {datos.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[var(--color-borde)] last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-4 font-semibold">
                  {u.nombre}
                  {u.id === yo && (
                    <span className="ml-2 text-xs font-normal text-[var(--color-tenue)]">
                      · vos
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-[var(--color-tenue)]">{u.email}</td>
                <td className="px-4 py-4">
                  <select
                    value={u.rol}
                    disabled={u.id === yo}
                    onChange={(e) => cambiar(u, { rol: e.target.value })}
                    title={u.id === yo ? 'No podés cambiarte el rol a vos mismo' : undefined}
                    className="rounded-lg border border-[var(--color-borde)] bg-[var(--color-superficie)] px-2 py-1 text-sm outline-none disabled:opacity-50"
                  >
                    <option value="admin">Administrador</option>
                    <option value="taller">Taller</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase ${
                      u.activo
                        ? 'border-[var(--color-ok)]/40 text-[var(--color-ok)]'
                        : 'border-[var(--color-borde)] text-[var(--color-tenue)]'
                    }`}
                  >
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--color-tenue)]">
                  {fecha(u.created_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => nuevaClave(u)} className="text-[var(--color-acento)]">
                      Clave
                    </button>
                    {u.id !== yo && (
                      <button
                        onClick={() => cambiar(u, { activo: !u.activo })}
                        className="text-[var(--color-tenue)] hover:text-[var(--color-texto)]"
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-tenue)]">
        A nadie se lo borra: sus compras y sus movimientos lo nombran. Quien se
        va se desactiva, y el historial sigue diciendo quién hizo cada cosa.
      </p>

      {alta && (
        <FormularioUsuario
          onCerrar={() => setAlta(false)}
          onListo={() => {
            setAlta(false);
            traer();
          }}
        />
      )}
    </div>
  );
}

function FormularioUsuario({
  onCerrar,
  onListo,
}: {
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('taller');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setGuardando(true);
    setError('');

    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol }),
    });

    if (res.ok) {
      onListo();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'No se pudo crear' }));
      setError(error);
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-2 md:p-4">
      <div className="modal w-full max-w-lg rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)]">
        <h2 className="mb-6 text-xl font-bold">Nuevo usuario</h2>

        <label className="mb-2 block text-sm">Nombre *</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus className="campo mb-4" />

        <label className="mb-2 block text-sm">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@futuramuebles.com.ar"
          className="campo mb-4"
        />

        <label className="mb-2 block text-sm">Contraseña inicial *</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="campo" />
        <p className="mb-4 mt-1.5 text-xs text-[var(--color-tenue)]">
          Mínimo 8 caracteres. Pasásela por un medio seguro y pedile que la
          cambie: vos la vas a seguir viendo hasta que lo haga.
        </p>

        <label className="mb-2 block text-sm">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as Rol)}
          className="campo mb-2"
        >
          <option value="taller">Taller</option>
          <option value="admin">Administrador</option>
        </select>
        <p className="mb-6 text-xs text-[var(--color-tenue)]">{ROLES[rol].descripcion}</p>

        {error && <p className="mb-4 text-sm text-[var(--color-alerta)]">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 rounded-full border border-[var(--color-borde)] py-3 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || !nombre.trim() || !email.trim() || password.length < 8}
            className="flex-1 rounded-full bg-[var(--color-acento)] py-3 font-semibold text-white disabled:opacity-40"
          >
            {guardando ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
