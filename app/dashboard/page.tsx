import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { getSesion } from '@/lib/session';
import { db } from '@/lib/supabase';
import { money, cantidad, haceCuanto } from '@/lib/format';
import type { Insumo } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * El inicio contesta una sola pregunta: ¿hay algo que atender hoy?
 *
 * Lee la base directo en vez de pasar por la API. No es por velocidad: la API
 * le recorta los costos al taller, y acá el recorte lo hace esta misma página
 * según quién entró. Pasando por fetch habría que reimplementar la sesión.
 */
export default async function Inicio() {
  const sesion = await getSesion();
  if (!sesion) redirect('/login');

  const esAdmin = sesion.rol === 'admin';

  const { data: insumos } = await db.from('insumos_stock').select('*').eq('activo', true);
  const lista = (insumos ?? []) as Insumo[];

  const reponer = lista
    .filter((i) => {
      if (Number(i.stock) < 0) return true;
      return i.alerta_stock !== null && Number(i.stock) <= Number(i.alerta_stock);
    })
    .sort((a, b) => Number(a.stock) - Number(b.stock));

  // El mes corrido, que es como se mira el gasto de materiales.
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);

  let gastadoMes = 0;
  if (esAdmin) {
    const { data: comprasMes } = await db
      .from('compras')
      .select('total')
      .gte('fecha', desde.toISOString().slice(0, 10));
    gastadoMes = (comprasMes ?? []).reduce((a, c) => a + Number(c.total), 0);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 pl-24">
      <header className="mb-10 border-b border-[var(--color-borde)] pb-6">
        <p className="eyebrow">Futura Muebles</p>
        <h1 className="text-3xl font-bold">Hola, {sesion.nombre}</h1>
      </header>

      <div className={`mb-10 grid gap-4 ${esAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Tarjeta titulo="Insumos activos" valor={String(lista.length)} />
        <Tarjeta
          titulo="Para reponer"
          valor={String(reponer.length)}
          alerta={reponer.length > 0}
        />
        {esAdmin && <Tarjeta titulo="Comprado en 30 días" valor={money(gastadoMes)} />}
      </div>

      <section className="mb-10">
        <h2 className="eyebrow mb-4">Hay que reponer</h2>

        {reponer.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-borde)] py-10 text-center text-[var(--color-tenue)]">
            Nada por debajo del aviso. El depósito está en orden.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-[var(--color-borde)]">
            {reponer.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-4 border-b border-[var(--color-borde)] px-5 py-4 last:border-0"
              >
                <div>
                  <p className="font-semibold">{i.nombre}</p>
                  <p className="text-xs text-[var(--color-tenue)]">
                    {i.categoria ?? 'Sin categoría'} · último movimiento{' '}
                    {haceCuanto(i.ultimo_movimiento)}
                  </p>
                </div>
                <span
                  className="shrink-0 font-semibold"
                  style={{
                    color: Number(i.stock) < 0 ? 'var(--color-alerta)' : 'var(--color-aviso)',
                  }}
                  title={
                    Number(i.stock) < 0
                      ? 'En negativo: salió más de lo que había cargado'
                      : `El aviso está en ${cantidad(i.alerta_stock)}`
                  }
                >
                  {cantidad(i.stock)} {i.unidad ?? ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Acceso href="/dashboard/insumos" icono={<Package size={20} />} titulo="Insumos">
          El catálogo y lo que hay de cada cosa
        </Acceso>
        {esAdmin && (
          <Acceso href="/dashboard/compras" icono={<ShoppingCart size={20} />} titulo="Compras">
            Cargar lo que llegó del proveedor
          </Acceso>
        )}
        <Acceso
          href="/dashboard/movimientos"
          icono={<ArrowLeftRight size={20} />}
          titulo="Movimientos"
        >
          Por qué el stock dice lo que dice
        </Acceso>
      </div>
    </div>
  );
}

function Tarjeta({ titulo, valor, alerta }: { titulo: string; valor: string; alerta?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-6">
      <p className="eyebrow mb-2">{titulo}</p>
      <p
        className="text-3xl font-bold"
        style={alerta ? { color: 'var(--color-aviso)' } : undefined}
      >
        {valor}
      </p>
    </div>
  );
}

function Acceso({
  href,
  icono,
  titulo,
  children,
}: {
  href: string;
  icono: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--color-borde)] bg-[var(--color-superficie)] p-5 transition hover:border-[var(--color-acento)]"
    >
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-acento)] text-white">
        {icono}
      </span>
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 text-xs text-[var(--color-tenue)]">{children}</p>
    </Link>
  );
}
