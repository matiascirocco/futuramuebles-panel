'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { money } from '@/lib/format';
import type { ItemCompra, Insumo } from '@/lib/types';
import { BuscadorInsumo } from './buscador-insumo';

const VACIO: ItemCompra = { insumo_id: null, descripcion: '', cantidad: 1, costo_unitario: 0 };

/**
 * Cargar una compra.
 *
 * Elegir del catálogo es lo que ata el renglón a un insumo, y eso es lo que
 * después suma stock y fija el costo. Un renglón escrito a mano queda en el
 * documento pero no mueve existencia, y se avisa antes de guardar.
 */
export function FormularioCompra({
  onCerrar,
  onListo,
}: {
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedor, setProveedor] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemCompra[]>([{ ...VACIO }]);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/insumos')
      .then((r) => r.json())
      .then((d) => setInsumos(Array.isArray(d) ? d : []))
      .catch(() => setInsumos([]));
  }, []);

  function editar(i: number, cambios: Partial<ItemCompra>) {
    setItems((prev) => prev.map((it, n) => (n === i ? { ...it, ...cambios } : it)));
  }

  const total = items.reduce((a, i) => a + i.cantidad * i.costo_unitario, 0);
  const sueltos = items.filter((i) => i.descripcion.trim() && !i.insumo_id).length;
  const listos = items.filter((i) => i.descripcion.trim() && i.cantidad > 0).length;

  async function guardar() {
    setGuardando(true);
    setError('');

    const res = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedor, comprobante, fecha, items, notas }),
    });

    if (res.ok) {
      onListo();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'No se pudo guardar' }));
      setError(error);
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
      <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-6">
        <h2 className="mb-6 text-xl font-bold">Cargar compra</h2>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm">Proveedor *</label>
            <input
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Maderera del Sur"
              autoFocus
              className="campo"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="campo"
            />
          </div>
        </div>
        <p className="mb-4 text-xs text-[var(--color-tenue)]">
          La fecha es la del comprobante, no la de hoy. Con eso el panel sabe
          cuál es la compra más nueva de cada insumo: si cargás en julio una
          factura de marzo, el costo del catálogo no vuelve a los precios de
          marzo.
        </p>

        <label className="mb-2 block text-sm">Comprobante del proveedor</label>
        <input
          value={comprobante}
          onChange={(e) => setComprobante(e.target.value)}
          placeholder="A 0001-00012345"
          className="campo"
        />
        <p className="mb-6 mt-1.5 text-xs text-[var(--color-tenue)]">
          El número de la factura o el remito con el que llegó el material, tal
          como viene impreso. Es lo que después une esta carga con el papel. Si
          no hubo comprobante, dejalo vacío.
        </p>

        <h3 className="mb-1 font-bold">Qué entró</h3>
        <p className="mb-3 text-xs text-[var(--color-tenue)]">
          El costo es por unidad, no el total del renglón. Si no lo tenés a mano,
          dejalo en 0: la compra queda marcada como sin costo y el stock entra
          igual. Lo que no conviene es inventarlo, porque ese número es el que
          después usás para cotizar.
        </p>

        {items.map((item, i) => (
          <div key={i} className="mb-4 border-b border-[var(--color-borde)] pb-4 last:border-0">
            <BuscadorInsumo
              valor={item.descripcion}
              insumos={insumos}
              onTexto={(t) => editar(i, { descripcion: t, insumo_id: null })}
              onElegir={(x) => editar(i, { descripcion: x.nombre, insumo_id: x.id })}
            />

            <div className="mt-2 grid grid-cols-[5rem_9rem_1fr_2rem] items-center gap-3">
              <input
                value={item.cantidad}
                onChange={(e) => editar(i, { cantidad: Number(e.target.value) || 0 })}
                inputMode="decimal"
                title="Cantidad"
                className="rounded-xl border border-[var(--color-borde)] bg-black/30 px-3 py-2 text-center outline-none"
              />
              <input
                value={item.costo_unitario}
                onChange={(e) => editar(i, { costo_unitario: Number(e.target.value) || 0 })}
                inputMode="decimal"
                title="Costo por unidad: lo que pagaste"
                className="rounded-xl border border-[var(--color-borde)] bg-black/30 px-3 py-2 text-right outline-none"
              />
              <span className="text-right font-semibold">
                {money(item.cantidad * item.costo_unitario)}
              </span>
              <button
                onClick={() => setItems(items.filter((_, n) => n !== i))}
                disabled={items.length === 1}
                title="Quitar"
                className="text-[var(--color-tenue)] disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {item.descripcion.trim() && !item.insumo_id && (
              <p className="mt-2 text-xs text-[var(--color-aviso)]">
                No está en el catálogo: queda en la compra pero no suma stock.
              </p>
            )}
          </div>
        ))}

        <button
          onClick={() => setItems([...items, { ...VACIO }])}
          className="mb-6 text-sm text-[var(--color-acento)]"
        >
          + Agregar renglón
        </button>

        <label className="mb-2 block text-sm">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="campo mb-6"
        />

        <div className="mb-6 flex items-center justify-between border-t border-[var(--color-borde)] pt-4">
          <span className="font-bold">Total</span>
          <span className="text-2xl font-bold">{money(total)}</span>
        </div>

        {sueltos > 0 && (
          <p className="mb-4 rounded-xl border border-[var(--color-aviso)]/40 px-4 py-3 text-sm">
            {sueltos === 1
              ? 'Hay 1 renglón que no está en el catálogo: no va a sumar stock.'
              : `Hay ${sueltos} renglones que no están en el catálogo: no van a sumar stock.`}
          </p>
        )}

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
            disabled={guardando || !proveedor.trim() || listos === 0}
            className="flex-1 rounded-full bg-[var(--color-acento)] py-3 font-semibold text-white disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : 'Guardar compra'}
          </button>
        </div>
      </div>
    </div>
  );
}
