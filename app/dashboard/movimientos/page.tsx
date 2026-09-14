'use client';

import { useEffect, useState } from 'react';
import { cantidad, fecha } from '@/lib/format';
import type { MovimientoStock, TipoMovimiento } from '@/lib/types';

const FILTROS: Array<{ valor: '' | TipoMovimiento; etiqueta: string }> = [
  { valor: '', etiqueta: 'Todo' },
  { valor: 'compra', etiqueta: 'Compras' },
  { valor: 'consumo', etiqueta: 'Consumos' },
  { valor: 'ajuste', etiqueta: 'Ajustes' },
];

/**
 * El libro del depósito: todo lo que entró y salió, lo último primero.
 *
 * Es la pantalla a la que se viene cuando un número no cierra. Por eso muestra
 * quién lo hizo y cuándo: el stock no es un número que alguien pisó, es la suma
 * de estas líneas.
 */
export default function Movimientos() {
  const [datos, setDatos] = useState<MovimientoStock[]>([]);
  const [tipo, setTipo] = useState<'' | TipoMovimiento>('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/api/stock')
      .then((r) => r.json())
      .then((d) => setDatos(Array.isArray(d) ? d : []))
      .finally(() => setCargando(false));
  }, []);

  const visibles = datos.filter((m) => {
    if (tipo && m.tipo !== tipo) return false;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (m.insumo_nombre ?? '').toLowerCase().includes(texto) ||
      (m.motivo ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 pl-24">
      <header className="mb-8 border-b border-[var(--color-borde)] pb-6">
        <p className="eyebrow">Futura Muebles</p>
        <h1 className="text-3xl font-bold">Movimientos</h1>
        <p className="mt-2 text-sm text-[var(--color-tenue)]">
          Los últimos 100 del depósito. Para ver todos los de un insumo, entrá
          desde Insumos.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar insumo o motivo…"
          className="w-full max-w-md rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-5 py-3 outline-none focus:border-[var(--color-acento)]"
        />
        <div className="flex gap-1 rounded-full border border-[var(--color-borde)] p-1">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setTipo(f.valor)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                tipo === f.valor
                  ? 'bg-[var(--color-acento)] font-semibold text-white'
                  : 'text-[var(--color-tenue)] hover:text-[var(--color-texto)]'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-borde)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-borde)]">
              {['Fecha', 'Insumo', 'Cantidad', 'Tipo', 'Motivo', 'Quién'].map((h) => (
                <th key={h} className="eyebrow px-4 py-4">{h}</th>
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

            {!cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-tenue)]">
                  {datos.length === 0
                    ? 'Todavía no hay movimientos. Cargá una compra o hacé el conteo inicial desde Insumos.'
                    : 'Nada con ese filtro.'}
                </td>
              </tr>
            )}

            {visibles.map((m) => (
              <tr
                key={m.id}
                className="border-b border-[var(--color-borde)] last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 text-sm text-[var(--color-tenue)]">
                  {fecha(m.created_at)}
                </td>
                <td className="px-4 py-3 font-semibold">{m.insumo_nombre ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className="font-semibold"
                    style={{
                      color: Number(m.cantidad) > 0 ? 'var(--color-ok)' : 'var(--color-alerta)',
                    }}
                  >
                    {Number(m.cantidad) > 0 ? '+' : ''}
                    {cantidad(m.cantidad)}
                  </span>
                  {m.insumo_unidad && (
                    <span className="text-[var(--color-tenue)]"> {m.insumo_unidad}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{m.tipo}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-tenue)]">
                  {m.motivo ?? (m.compra_id ? `compra #${m.compra_id}` : '—')}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-tenue)]">
                  {m.usuario_nombre ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
