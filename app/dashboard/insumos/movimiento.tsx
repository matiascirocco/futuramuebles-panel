'use client';

import { useEffect, useState } from 'react';
import { cantidad, haceCuanto } from '@/lib/format';
import type { Insumo, MovimientoStock, TipoMovimiento } from '@/lib/types';

/** Los motivos de ajuste que se repiten, para no escribirlos cada vez. */
const MOTIVOS_AJUSTE = ['Conteo físico', 'Rotura', 'Sobrante que volvió', 'Carga inicial'];

/**
 * Mover el stock de un insumo, y ver por qué dice lo que dice.
 *
 * Dos cosas distintas, y conviene que se elijan a mano en vez de deducirlas del
 * signo:
 *
 *   Se usó   — salió para un mueble. Se escribe en positivo —"salieron 3"— y el
 *              signo lo pone la API. Pedir un "−3" en el campo era la forma más
 *              fácil de que alguien cargue un 3 y sume lo que quería restar.
 *   Ajustar  — todo lo demás, con signo: el conteo de fin de mes, una placa que
 *              se rompió, un sobrante que volvió del taller.
 *
 * En los dos casos el motivo es obligatorio, y lo exige también la base: un
 * número corregido sin explicación no se puede auditar un mes después.
 */
export function Movimiento({
  insumo,
  onCerrar,
  onListo,
}: {
  insumo: Insumo;
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [tipo, setTipo] = useState<Exclude<TipoMovimiento, 'compra'>>('consumo');
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/stock?insumo=${insumo.id}`)
      .then((r) => r.json())
      .then((d) => setMovimientos(Array.isArray(d) ? d : []))
      .catch(() => setMovimientos([]));
  }, [insumo.id]);

  const n = Number(valor);
  const numeroOk = Number.isFinite(n) && n !== 0;
  const valido = numeroOk && motivo.trim().length > 0;

  // Lo que va a quedar, con el signo ya aplicado como lo aplica la API.
  const delta = tipo === 'consumo' ? -Math.abs(n) : n;
  const queda = Number(insumo.stock) + delta;

  function cambiarTipo(nuevo: Exclude<TipoMovimiento, 'compra'>) {
    setTipo(nuevo);
    setMotivo('');
    setError('');
  }

  async function guardar() {
    setGuardando(true);
    setError('');

    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insumo_id: insumo.id,
        cantidad: n,
        tipo,
        motivo: motivo.trim(),
      }),
    });

    if (res.ok) {
      onListo();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'No se pudo guardar' }));
      setError(error);
      setGuardando(false);
    }
  }

  const unidad = insumo.unidad ?? 'u.';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
      <div className="mx-auto my-8 w-full max-w-lg rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-6">
        <p className="eyebrow mb-1">Mover stock</p>
        <h2 className="mb-1 text-xl font-bold">{insumo.nombre}</h2>
        <p className="mb-6 text-sm text-[var(--color-tenue)]">
          Hoy hay {cantidad(insumo.stock)} {unidad}
        </p>

        <div className="mb-5 flex gap-2 rounded-full border border-[var(--color-borde)] p-1">
          {([
            ['consumo', 'Se usó'],
            ['ajuste', 'Ajustar'],
          ] as const).map(([valorTipo, etiqueta]) => (
            <button
              key={valorTipo}
              onClick={() => cambiarTipo(valorTipo)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                tipo === valorTipo
                  ? 'bg-[var(--color-acento)] text-white'
                  : 'text-[var(--color-tenue)] hover:text-[var(--color-texto)]'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-sm">
          {tipo === 'consumo' ? 'Cuánto salió' : 'Cuánto se suma o se resta'}
        </label>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          inputMode="decimal"
          placeholder={tipo === 'consumo' ? `3 (en ${unidad})` : '5 si entra, -2 si sale'}
          autoFocus
          className="campo"
        />
        <p className="mb-4 mt-1.5 text-xs text-[var(--color-tenue)]">
          {tipo === 'consumo'
            ? 'En positivo: es lo que se llevó el trabajo. El descuento lo hace el sistema.'
            : 'Es lo que se suma o se resta, no el total nuevo.'}
          {numeroOk && (
            <>
              {' '}Va a quedar en{' '}
              <strong style={queda < 0 ? { color: 'var(--color-alerta)' } : undefined}>
                {cantidad(queda)} {unidad}
              </strong>
              {queda < 0 && ' — en negativo'}.
            </>
          )}
        </p>

        <label className="mb-2 block text-sm">
          {tipo === 'consumo' ? 'Para qué trabajo *' : 'Por qué *'}
        </label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder={
            tipo === 'consumo'
              ? 'Placard Gómez, cocina Martínez…'
              : 'Conteo físico, se rompió una placa…'
          }
          className="campo"
        />

        {tipo === 'consumo' ? (
          <p className="mb-6 mt-1.5 text-xs text-[var(--color-tenue)]">
            Escribí el trabajo como lo llamás vos. Es lo único que después
            explica a dónde se fue el material: sin eso, dentro de un mes el
            movimiento dice que faltan tres placas y nada más.
          </p>
        ) : (
          <div className="mb-6 mt-2 flex flex-wrap gap-2">
            {MOTIVOS_AJUSTE.map((m) => (
              <button
                key={m}
                onClick={() => setMotivo(m)}
                className="rounded-full border border-[var(--color-borde)] px-3 py-1 text-xs text-[var(--color-tenue)] hover:text-[var(--color-texto)]"
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mb-4 text-sm text-[var(--color-alerta)]">{error}</p>}

        <div className="mb-6 flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 rounded-full border border-[var(--color-borde)] py-3 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || !valido}
            className="flex-1 rounded-full bg-[var(--color-acento)] py-3 font-semibold text-white disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : tipo === 'consumo' ? 'Descontar' : 'Ajustar'}
          </button>
        </div>

        <div className="border-t border-[var(--color-borde)] pt-4">
          <p className="eyebrow mb-3">Movimientos</p>

          {movimientos.length === 0 ? (
            <p className="text-sm text-[var(--color-tenue)]">
              Todavía no hay movimientos de este insumo.
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {movimientos.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          Number(m.cantidad) > 0 ? 'var(--color-ok)' : 'var(--color-alerta)',
                      }}
                    >
                      {Number(m.cantidad) > 0 ? '+' : ''}
                      {cantidad(m.cantidad)}
                    </span>{' '}
                    {m.tipo}
                    {m.motivo && <span className="text-[var(--color-tenue)]"> · {m.motivo}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-tenue)]">
                    {haceCuanto(m.created_at)}
                    {m.usuario_nombre && ` · ${m.usuario_nombre}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
