'use client';

import { useState } from 'react';
import type { Insumo } from '@/lib/types';

/**
 * Alta y edición de un insumo.
 *
 * No hay campo de costo, y no es un olvido: el costo lo pone la compra. Un
 * número tipeado acá es un número que nadie verificó, y después se usa para
 * cotizar un trabajo.
 */
export function FormularioInsumo({
  insumo,
  categorias,
  onCerrar,
  onListo,
}: {
  /** Nulo para crear uno nuevo. */
  insumo: Insumo | null;
  categorias: string[];
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [nombre, setNombre] = useState(insumo?.nombre ?? '');
  const [categoria, setCategoria] = useState(insumo?.categoria ?? '');
  const [unidad, setUnidad] = useState(insumo?.unidad ?? '');
  const [descripcion, setDescripcion] = useState(insumo?.descripcion ?? '');
  const [alerta, setAlerta] = useState(
    insumo?.alerta_stock == null ? '' : String(insumo.alerta_stock)
  );
  const [activo, setActivo] = useState(insumo?.activo ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setGuardando(true);
    setError('');

    const cuerpo = { nombre, categoria, unidad, descripcion, alerta_stock: alerta, activo };

    const res = insumo
      ? await fetch(`/api/insumos/${insumo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cuerpo),
        })
      : await fetch('/api/insumos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cuerpo),
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-2 md:p-4">
      <div className="modal w-full max-w-lg rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)]">
        <h2 className="mb-6 text-xl font-bold">{insumo ? 'Editar insumo' : 'Nuevo insumo'}</h2>

        <label className="mb-2 block text-sm">Nombre *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Melamina blanca 18 mm"
          autoFocus
          className="campo"
        />
        <p className="mb-4 mt-1.5 text-xs text-[var(--color-tenue)]">
          Poné el espesor, el color o la medida en el nombre. Si tenés dos
          melaminas blancas de distinto espesor con el mismo nombre, el stock de
          las dos termina en la misma bolsa y no sirve para nada.
        </p>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm">Categoría</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              list="categorias-existentes"
              placeholder="Placas"
              className="campo"
            />
            <datalist id="categorias-existentes">
              {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-2 block text-sm">Unidad</label>
            <input
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              list="unidades-comunes"
              placeholder="placa, metro, unidad"
              className="campo"
            />
            <datalist id="unidades-comunes">
              <option value="placa" />
              <option value="unidad" />
              <option value="metro" />
              <option value="m²" />
              <option value="juego" />
              <option value="kg" />
              <option value="litro" />
            </datalist>
          </div>
        </div>

        <label className="mb-2 block text-sm">Avisar cuando baje de</label>
        <input
          value={alerta}
          onChange={(e) => setAlerta(e.target.value)}
          inputMode="decimal"
          placeholder="vacío = sin aviso"
          className="campo"
        />
        <p className="mb-4 mt-1.5 text-xs text-[var(--color-tenue)]">
          Poné lo que necesitás tener para no frenar un trabajo mientras llega el
          pedido, no el mínimo absoluto.
        </p>

        <label className="mb-2 block text-sm">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Proveedor habitual, medida de la placa, equivalencias…"
          className="campo mb-4"
        />

        <label className="mb-6 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4"
          />
          <span>
            Activo
            <span className="block text-xs text-[var(--color-tenue)]">
              Los inactivos no aparecen en las listas, pero siguen nombrados en
              las compras viejas y conservan sus movimientos.
            </span>
          </span>
        </label>

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
            disabled={guardando || !nombre.trim()}
            className="flex-1 rounded-full bg-[var(--color-acento)] py-3 font-semibold text-white disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : insumo ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
