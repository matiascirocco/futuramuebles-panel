export type Rol = 'admin' | 'taller';

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
};

/**
 * Un material del catálogo.
 *
 * No tiene precio de venta y no es un olvido: una placa de melamina no se
 * vende suelta, se consume adentro de un mueble. El número que importa es el
 * costo, y lo pone la última compra que lo trajo.
 */
export type Insumo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad: string | null;
  /** Lo que costó la última vez que entró. Lo pisa la compra. */
  costo_ultimo: number | null;
  costo_actualizado_at: string | null;
  /** Cuando el stock baja de acá, hay que reponer. Nulo = sin aviso. */
  alerta_stock: number | null;
  activo: boolean;
  /** Suma de los movimientos. Viene de la vista insumos_stock. */
  stock: number;
  ultimo_movimiento: string | null;
  created_at: string;
};

export type TipoMovimiento = 'compra' | 'consumo' | 'ajuste';

/** Lo que entró o salió del depósito. El stock es la suma de esto. */
export type MovimientoStock = {
  id: number;
  insumo_id: number;
  /** Con signo: positivo entra, negativo sale. */
  cantidad: number;
  tipo: TipoMovimiento;
  motivo: string | null;
  compra_id: number | null;
  insumo_nombre: string | null;
  insumo_unidad: string | null;
  usuario_nombre: string | null;
  created_at: string;
};

export type ItemCompra = {
  insumo_id: number | null;
  descripcion: string;
  cantidad: number;
  costo_unitario: number;
};

export type Compra = {
  id: number;
  proveedor: string;
  comprobante: string | null;
  fecha: string;
  items: ItemCompra[];
  total: number;
  notas: string | null;
  usuario_nombre: string | null;
  created_at: string;
};
