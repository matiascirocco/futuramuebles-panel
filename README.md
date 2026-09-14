# Panel Futura Muebles — Depósito

Qué insumos hay, qué se compró y qué se consumió. Next.js 15 + Supabase.

Es el proyecto hermano de `futuradeco-panel`, pero **no es una copia**. Allá el
stock es producto terminado con precio de lista, que entra por compra y sale
cuando se aprueba un presupuesto. Acá se fabrica a medida: lo que se stockea son
materiales, y salen cuando se arma un mueble.

## La idea

**El stock no es un número que alguien pisa: es la suma de los movimientos.**

Cada entrada y cada salida quedan escritas con fecha, autor y motivo. Cuando el
número no cierra, se abre la lista y se ve por qué dice lo que dice, en vez de
creerle a un campo que alguien editó alguna vez y nadie sabe cuándo.

Tres clases de movimiento, y nada más:

| | | |
|---|---|---|
| **compra** | + | llegó material del proveedor |
| **consumo** | − | se usó en un mueble, con el trabajo anotado |
| **ajuste** | ± | conteo físico, rotura, sobrante que volvió, carga inicial |

## El costo lo pone la compra

Un insumo no tiene precio de venta: no se vende suelto, se consume adentro de un
mueble. Lo que importa es el costo, y el costo cambia en cada compra. Por eso
`costo_ultimo` no se carga a mano — lo escribe la compra que trajo el material.

Con una guarda: solo lo pisa si esa compra es igual o más nueva que la que fijó
el costo actual. Sin eso, cargar en julio una factura de marzo que quedó
traspapelada devuelve el catálogo a los precios de marzo, y con eso se cotiza.

## Los dos roles

| Rol | Puede |
|---|---|
| **admin** | Todo: compras, costos, usuarios, el depósito |
| **taller** | Ve el catálogo y el depósito, descuenta lo que usa, ajusta por conteo |

La línea que los separa son los costos. Quien arma un mueble necesita saber
cuántas placas quedan, no a cuánto las compraste. El recorte está en la API —no
en la pantalla—, así que el dato no viaja al navegador del taller.

## Mapa

```
app/
  api/            login, insumos, compras, stock, usuarios
  dashboard/
    insumos/      el catálogo, con alta, edición y movimientos
    compras/      lo que entró y a qué costo
    movimientos/  el libro completo
    usuarios/     alta y roles (solo admin)
lib/
  permisos.ts     qué puede cada rol, en un solo lugar
  session.ts      cookie firmada con jose
  autorizar.ts    el guard de cada endpoint
db/
  schema.sql      tablas, vista y RLS
  crear-usuario.sql
  seed-insumos.sql  catálogo de arranque, opcional
```

## Puesta en marcha

Ver [DEPLOY.md](DEPLOY.md).

## Seguridad

La app entra a Supabase con la `service_role` key, que saltea RLS. La
autorización de verdad la hace el código: `lib/session.ts` valida la cookie y
`lib/autorizar.ts` decide en cada endpoint. Las tablas tienen RLS activado y sin
políticas —cierre por defecto— como segunda barrera: si la anon key se filtrara,
igual no se llega a los datos.
