'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { money, fecha, cantidad } from '@/lib/format';
import type { Compra } from '@/lib/types';
import { FormularioCompra } from './formulario';

/**
 * Las compras: lo que entró al depósito y a qué costo.
 *
 * Cada renglón atado a un insumo del catálogo suma existencia y le fija el
 * costo. Los que no —un flete, una changa— quedan en el documento y no inventan
 * stock.
 */
export default function Compras() {
  const [datos, setDatos] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [alta, setAlta] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [error, setError] = useState('');

  function traer() {
    fetch('/api/compras')
      .then((r) => r.json())
      .then((d) => setDatos(Array.isArray(d) ? d : []))
      .finally(() => setCargando(false));
  }

  useEffect(traer, []);

  /**
   * Borrar una compra devuelve el stock que había sumado: los movimientos se
   * van con ella. El aviso lo dice, porque no es evidente que borrar un papel
   * mueva el depósito.
   */
  async function borrar(c: Compra) {
    const suman = c.items.filter((i) => i.insumo_id);
    const detalle =
      suman.length > 0
        ? `Se va a descontar lo que sumó al stock:\n${suman
            .map((i) => `  · ${i.descripcion}: −${cantidad(i.cantidad)}`)
            .join('\n')}\n\n`
        : 'No había sumado stock: ningún renglón estaba atado al catálogo.\n\n';

    if (
      !confirm(
        `¿Borrar la compra a ${c.proveedor} de ${money(c.total)}?\n\n` +
          detalle +
          'El último costo que haya fijado NO se deshace: lo corrige la compra siguiente.\n\n' +
          'La factura del proveedor sigue existiendo: esto borra solo la copia del panel.\n\n' +
          'No hay deshacer.'
      )
    )
      return;

    setBorrando(c.id);
    setError('');

    const res = await fetch(`/api/compras/${c.id}`, { method: 'DELETE' });

    if (res.ok) {
      setDatos((prev) => prev.filter((x) => x.id !== c.id));
    } else {
      const { error } = await res.json().catch(() => ({ error: 'No se pudo borrar' }));
      setError(error);
    }
    setBorrando(null);
  }

  // Las compras sin costo no suman al total ni lo bajan: quedan aparte y se
  // cuentan, para que el número no parezca completo cuando no lo está.
  const sinCosto = useMemo(() => datos.filter((c) => Number(c.total) === 0), [datos]);
  const gastado = useMemo(() => datos.reduce((a, c) => a + Number(c.total), 0), [datos]);

  return (
    <div className="pantalla max-w-5xl">
      <header className="mb-8 pr-12 md:pr-0 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-borde)] pb-6">
        <div>
          <p className="eyebrow">Futura Muebles</p>
          <h1 className="text-3xl font-bold">Compras</h1>
        </div>
        <button
          onClick={() => setAlta(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--color-acento)] px-5 py-2.5 font-semibold text-white transition hover:brightness-125"
        >
          <Plus size={18} /> Cargar compra
        </button>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Dato titulo="Compras cargadas" valor={String(datos.length)} />
        <Dato
          titulo="Total comprado"
          valor={money(gastado)}
          pie={
            sinCosto.length > 0
              ? `${sinCosto.length} ${
                  sinCosto.length === 1 ? 'compra' : 'compras'
                } sin costo cargado, fuera de este total`
              : undefined
          }
        />
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-[var(--color-alerta)]/40 px-4 py-3 text-sm text-[var(--color-alerta)]">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="py-10 text-center text-[var(--color-tenue)]">Cargando…</p>
      ) : datos.length === 0 ? (
        <p className="rounded-2xl border border-[var(--color-borde)] py-12 text-center text-[var(--color-tenue)]">
          Todavía no cargaste ninguna compra.
        </p>
      ) : (
        <ul className="space-y-3">
          {datos.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-5"
            >
              <button
                onClick={() => setAbierta(abierta === c.id ? null : c.id)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <p className="font-semibold">{c.proveedor}</p>
                  <p className="text-sm text-[var(--color-tenue)]">
                    {fecha(c.fecha)}
                    {c.comprobante && ` · ${c.comprobante}`}
                    {' · '}
                    {c.items.length} {c.items.length === 1 ? 'renglón' : 'renglones'}
                    {c.usuario_nombre && ` · ${c.usuario_nombre}`}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-bold">
                  {Number(c.total) === 0 ? (
                    <span
                      className="text-sm font-normal text-[var(--color-aviso)]"
                      title="Entró el material pero no se cargó cuánto costó"
                    >
                      sin costo
                    </span>
                  ) : (
                    money(c.total)
                  )}
                </span>
              </button>

              {abierta === c.id && (
                <ul className="mt-4 space-y-2 border-t border-[var(--color-borde)] pt-4">
                  {c.items.map((i, n) => (
                    <li key={n} className="flex items-center justify-between gap-4 text-sm">
                      <span>
                        {i.descripcion}
                        {!i.insumo_id && (
                          <span
                            className="ml-2 text-xs text-[var(--color-tenue)]"
                            title="No está atado al catálogo: no sumó stock"
                          >
                            · sin stock
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[var(--color-tenue)]">
                        {cantidad(i.cantidad)} × {money(i.costo_unitario)}
                      </span>
                    </li>
                  ))}
                  {c.notas && <li className="pt-2 text-sm text-[var(--color-tenue)]">{c.notas}</li>}

                  <li className="pt-2">
                    <button
                      onClick={() => borrar(c)}
                      disabled={borrando === c.id}
                      className="flex items-center gap-2 text-sm text-[var(--color-alerta)] disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {borrando === c.id ? 'Borrando…' : 'Borrar esta compra'}
                    </button>
                  </li>
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {alta && (
        <FormularioCompra
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

function Dato({ titulo, valor, pie }: { titulo: string; valor: string; pie?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-6">
      <p className="eyebrow mb-2">{titulo}</p>
      <p className="text-3xl font-bold">{valor}</p>
      {pie && <p className="mt-2 text-xs text-[var(--color-aviso)]">{pie}</p>}
    </div>
  );
}
