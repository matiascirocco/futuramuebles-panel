'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Pencil, Plus } from 'lucide-react';
import { money, cantidad, haceCuanto } from '@/lib/format';
import type { Insumo } from '@/lib/types';
import { Movimiento } from './movimiento';
import { FormularioInsumo } from './formulario';

/**
 * El catálogo de materiales, con lo que hay de cada uno.
 *
 * La columna de costo solo la ve el admin. No es por pudor: el costo es lo que
 * le pagás a cada proveedor, y quien arma un mueble necesita saber cuántas
 * placas quedan, no a cuánto las compraste.
 */
export function Catalogo({
  puedeVerCostos,
  puedeEditar,
}: {
  puedeVerCostos: boolean;
  puedeEditar: boolean;
}) {
  const [datos, setDatos] = useState<Insumo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cargando, setCargando] = useState(true);
  const [moviendo, setMoviendo] = useState<Insumo | null>(null);
  // null = cerrado, 'nuevo' = alta, un insumo = edición.
  const [editando, setEditando] = useState<Insumo | 'nuevo' | null>(null);
  const [soloReponer, setSoloReponer] = useState(false);
  const [verInactivos, setVerInactivos] = useState(false);

  function traer() {
    fetch('/api/insumos')
      .then((r) => r.json())
      .then((d) => setDatos(Array.isArray(d) ? d : []))
      .finally(() => setCargando(false));
  }

  useEffect(traer, []);

  /** Hay que reponer si está por debajo del aviso, o si se fue a negativo. */
  function hayQueReponer(i: Insumo) {
    if (!i.activo) return false;
    if (Number(i.stock) < 0) return true;
    return i.alerta_stock !== null && Number(i.stock) <= Number(i.alerta_stock);
  }

  const categorias = useMemo(
    () => [...new Set(datos.map((i) => i.categoria).filter(Boolean))].sort() as string[],
    [datos]
  );

  const reponer = datos.filter(hayQueReponer).length;

  const visibles = datos.filter((i) => {
    if (!i.activo && !verInactivos) return false;
    if (categoria && i.categoria !== categoria) return false;
    if (soloReponer && !hayQueReponer(i)) return false;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      i.nombre.toLowerCase().includes(texto) ||
      (i.categoria ?? '').toLowerCase().includes(texto)
    );
  });

  const columnas = [
    'Insumo',
    'Categoría',
    'Stock',
    ...(puedeVerCostos ? ['Último costo'] : []),
    'Últ. movimiento',
    '',
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pl-24">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-borde)] pb-6">
        <div>
          <p className="eyebrow">Futura Muebles</p>
          <h1 className="text-3xl font-bold">Insumos</h1>
          <p className="mt-2 text-sm text-[var(--color-tenue)]">
            {datos.filter((i) => i.activo).length} activos · {categorias.length} categorías
            {reponer > 0 && (
              <>
                {' · '}
                <button
                  onClick={() => setSoloReponer((v) => !v)}
                  className="font-semibold text-[var(--color-aviso)] hover:underline"
                >
                  {reponer} para reponer
                </button>
              </>
            )}
          </p>
        </div>

        {puedeEditar && (
          <button
            onClick={() => setEditando('nuevo')}
            className="flex items-center gap-2 rounded-full bg-[var(--color-acento)] px-5 py-2.5 font-semibold text-white transition hover:brightness-125"
          >
            <Plus size={18} /> Nuevo insumo
          </button>
        )}
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar insumo o categoría…"
          className="w-full max-w-md rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-5 py-3 outline-none focus:border-[var(--color-acento)]"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 py-3 text-sm outline-none"
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--color-tenue)]">
          <input
            type="checkbox"
            checked={verInactivos}
            onChange={(e) => setVerInactivos(e.target.checked)}
            className="h-4 w-4"
          />
          Ver inactivos
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-borde)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-borde)]">
              {columnas.map((h, n) => (
                <th key={n} className="eyebrow px-4 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-10 text-center text-[var(--color-tenue)]">
                  Cargando…
                </td>
              </tr>
            )}

            {!cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-12 text-center text-[var(--color-tenue)]">
                  {datos.length === 0
                    ? 'Todavía no hay insumos cargados.'
                    : 'Nada con ese filtro.'}
                </td>
              </tr>
            )}

            {visibles.map((i) => (
              <tr
                key={i.id}
                className="border-b border-[var(--color-borde)] last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-4">
                  <span className="font-semibold">{i.nombre}</span>
                  {!i.activo && (
                    <span className="ml-2 text-xs text-[var(--color-tenue)]">· inactivo</span>
                  )}
                </td>
                <td className="px-4 py-4 text-[var(--color-tenue)]">{i.categoria ?? '—'}</td>

                <td className="px-4 py-4">
                  <span
                    className="font-semibold"
                    style={
                      Number(i.stock) < 0
                        ? { color: 'var(--color-alerta)' }
                        : hayQueReponer(i)
                          ? { color: 'var(--color-aviso)' }
                          : undefined
                    }
                    title={
                      Number(i.stock) < 0
                        ? 'En negativo: salió más de lo que había cargado'
                        : hayQueReponer(i)
                          ? `Por debajo del aviso (${cantidad(i.alerta_stock)})`
                          : undefined
                    }
                  >
                    {cantidad(i.stock)}
                  </span>
                  {i.unidad && <span className="text-[var(--color-tenue)]"> {i.unidad}</span>}
                </td>

                {puedeVerCostos && (
                  <td className="px-4 py-4">
                    {i.costo_ultimo == null ? (
                      <span
                        className="text-sm text-[var(--color-tenue)]"
                        title="Todavía no entró en ninguna compra con precio"
                      >
                        sin costo
                      </span>
                    ) : (
                      <>
                        {money(i.costo_ultimo)}
                        {i.unidad && (
                          <span className="text-[var(--color-tenue)]"> / {i.unidad}</span>
                        )}
                        <span
                          className="block text-xs text-[var(--color-tenue)]"
                          title="Cuándo se cargó la compra que fijó este costo"
                        >
                          {haceCuanto(i.costo_actualizado_at)}
                        </span>
                      </>
                    )}
                  </td>
                )}

                <td className="px-4 py-4 text-sm text-[var(--color-tenue)]">
                  {haceCuanto(i.ultimo_movimiento)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {puedeEditar && (
                      <button
                        onClick={() => setEditando(i)}
                        title="Editar el insumo"
                        aria-label="Editar el insumo"
                        className="rounded-full border border-[var(--color-borde)] p-2 hover:bg-white/5"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setMoviendo(i)}
                      title="Descontar, ajustar y ver movimientos"
                      aria-label="Mover stock"
                      className="rounded-full border border-[var(--color-borde)] p-2 hover:bg-white/5"
                    >
                      <ArrowDownUp size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <FormularioInsumo
          insumo={editando === 'nuevo' ? null : editando}
          categorias={categorias}
          onCerrar={() => setEditando(null)}
          onListo={() => {
            setEditando(null);
            traer();
          }}
        />
      )}

      {moviendo && (
        <Movimiento
          insumo={moviendo}
          onCerrar={() => setMoviendo(null)}
          onListo={() => {
            setMoviendo(null);
            traer();
          }}
        />
      )}
    </div>
  );
}
