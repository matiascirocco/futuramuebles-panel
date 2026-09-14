const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const money = (n: number | null | undefined) => pesos.format(n ?? 0);

export const fecha = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('es-AR') : '—';

/** Cantidades con decimales solo cuando los tiene: 12 y no 12,000. */
export function cantidad(n: number | string | null | undefined): string {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return '0';
  return x.toLocaleString('es-AR', { maximumFractionDigits: 3 });
}

/** "hace 2 sem", "hace 3 días", "hoy" */
export function haceCuanto(iso: string | null | undefined): string {
  if (!iso) return '—';
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return `hace ${Math.floor(dias / 7)} sem`;
  if (dias < 365) return `hace ${Math.floor(dias / 30)} meses`;
  return `hace ${Math.floor(dias / 365)} años`;
}
