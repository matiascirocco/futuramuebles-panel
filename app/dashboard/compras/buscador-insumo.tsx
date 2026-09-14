'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cantidad } from '@/lib/format';
import type { Insumo } from '@/lib/types';

/** Para que "melamina" encuentre "Melamina" y "tornilleria" encuentre "Tornillería". */
const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * El campo de descripción del renglón, con el catálogo detrás.
 *
 * Sigue siendo un campo libre: se puede escribir cualquier cosa que no esté en
 * el catálogo —un flete, una changa— y queda en el documento sin mover stock.
 * Elegir del buscador es exactamente lo que ata el renglón a un insumo.
 */
export function BuscadorInsumo({
  valor,
  insumos,
  onTexto,
  onElegir,
}: {
  valor: string;
  insumos: Insumo[];
  onTexto: (texto: string) => void;
  onElegir: (i: Insumo) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [marcado, setMarcado] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);

  const coincidencias = useMemo(() => {
    // Se busca por palabras sueltas y en cualquier orden: "blanca melamina"
    // tiene que encontrar "Melamina blanca 18 mm".
    const palabras = sinAcentos(valor.trim()).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return [];

    const encontrados = insumos.filter((i) => {
      if (!i.activo) return false;
      const texto = sinAcentos(`${i.nombre} ${i.categoria ?? ''}`);
      return palabras.every((w) => texto.includes(w));
    });

    // Primero lo que empieza con lo tipeado, después el resto.
    const inicio = palabras[0];
    return encontrados.sort((a, b) => {
      const ea = sinAcentos(a.nombre).startsWith(inicio) ? 0 : 1;
      const eb = sinAcentos(b.nombre).startsWith(inicio) ? 0 : 1;
      return ea - eb || a.nombre.localeCompare(b.nombre, 'es');
    });
  }, [valor, insumos]);

  // Si ya se eligió uno exacto, no tiene sentido seguir sugiriendo.
  const yaEsExacto = insumos.some((i) => i.nombre === valor);
  const mostrar = abierto && coincidencias.length > 0 && !yaEsExacto;

  useEffect(() => setMarcado(0), [valor]);

  useEffect(() => {
    function afuera(e: MouseEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', afuera);
    return () => document.removeEventListener('mousedown', afuera);
  }, []);

  function elegir(i: Insumo) {
    onElegir(i);
    setAbierto(false);
  }

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMarcado((m) => Math.min(m + 1, coincidencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMarcado((m) => Math.max(m - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      elegir(coincidencias[marcado]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <input
        value={valor}
        onChange={(e) => {
          onTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={teclas}
        placeholder="Escribí para buscar en el catálogo…"
        autoComplete="off"
        className="campo font-semibold"
      />

      {mostrar && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[var(--color-borde)] bg-[var(--color-superficie)] shadow-2xl">
          <p className="border-b border-[var(--color-borde)] px-4 py-2 text-xs text-[var(--color-tenue)]">
            {coincidencias.length === 1 ? '1 insumo' : `${coincidencias.length} insumos`}
            {coincidencias.length > 6 && ' · seguí escribiendo para achicar la lista'}
          </p>
          <ul className="max-h-80 overflow-y-auto py-1">
            {coincidencias.map((i, n) => (
              <li key={i.id}>
                <button
                  type="button"
                  onMouseEnter={() => setMarcado(n)}
                  onClick={() => elegir(i)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left ${
                    n === marcado ? 'bg-white/[0.06]' : ''
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{i.nombre}</span>
                    <span className="block text-xs text-[var(--color-tenue)]">
                      {i.categoria}
                      {i.unidad && ` · ${i.unidad}`}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-xs text-[var(--color-tenue)]">
                    {cantidad(i.stock)} {i.unidad ?? ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
