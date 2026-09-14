'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Error de conexión' }));
      setError(error);
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={entrar}
        className="aparecer w-full max-w-md rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-8"
      >
        <p className="eyebrow mb-1">Futura Muebles</p>
        <h1 className="mb-8 text-2xl font-bold">Depósito</h1>

        <label className="mb-2 block text-sm font-semibold">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@futuramuebles.com.ar"
          required
          autoFocus
          className="campo mb-6"
        />

        <label className="mb-2 block text-sm font-semibold">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="campo mb-6"
        />

        {error && <p className="mb-4 text-sm text-[var(--color-alerta)]">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-xl bg-[var(--color-acento)] py-3.5 font-semibold text-white transition hover:brightness-125 disabled:opacity-70"
        >
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
