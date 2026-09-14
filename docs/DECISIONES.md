# Por qué está armado así

Notas para el que venga después —probablemente yo mismo en tres meses—.

## No es el panel de FuturaDeco con otro nombre

Se partió de ahí, pero el modelo cambió en lo que importa.

| | FuturaDeco | Futura Muebles |
|---|---|---|
| Qué se stockea | producto terminado | materiales |
| La ficha tiene | precio de venta | costo, que lo pone la compra |
| El stock sale | al aprobar un presupuesto | cuando se consume en un mueble |
| Quién lo descuenta | el sistema, solo | una persona, a mano |

Copiar la regla de FuturaDeco —descontar al aprobar— era el error más caro
posible: acá aprobar un trabajo no compromete un mueble hecho, compromete
material que todavía no se cortó. El número habría mentido desde el primer día.

## El costo no se edita a mano

`insumos.costo_ultimo` solo lo escribe una compra. La pantalla de alta y edición
ni siquiera tiene el campo, y el `PATCH` lo ignora aunque venga en el body.

La razón es que ese número se usa para cotizar. Si se puede tipear, en algún
momento alguien va a tipear una estimación, y dentro de seis meses no hay forma
de distinguir un costo que salió de una factura de uno que salió de la memoria
de alguien.

La guarda de fecha —una compra vieja no pisa un costo más nuevo— está en
`actualizarCostos()`, en `app/api/compras/route.ts`.

## El consumo se escribe en positivo

La pantalla pide "cuánto salió" y manda un número positivo; el signo lo pone la
API (`app/api/stock/route.ts`). Pedir un `−3` en el campo era la forma más fácil
de que alguien cargue `3` y sume lo que quería restar.

El ajuste sí lleva signo, porque puede ir para los dos lados y no hay forma de
deducirlo.

La base lo refuerza con el check `signo_coherente`: una compra que resta o un
consumo que suma no entran, aunque el bug esté en el código.

## El stock puede quedar en negativo

A propósito. Si se consumió más de lo que había cargado, el negativo es la
verdad —falta cargar una compra, o el conteo estaba mal— y hay que poder verlo.
Bloquearlo con un error no arregla el depósito, solo esconde el problema y
obliga a inventar un ajuste para poder seguir trabajando.

Por eso el negativo se muestra en rojo y cuenta como "para reponer".

## Lo que falta para la Etapa 2

El modelo ya tiene los enganches:

- **Trabajos / obras.** Hoy el consumo anota el trabajo como texto libre
  (`motivo`). Cuando exista una tabla de trabajos, se agrega
  `movimientos_stock.trabajo_id` y el texto queda como estaba para lo viejo.
  Recién ahí se puede contestar "cuánto material se llevó el placard de Gómez".
- **Presupuestos.** Con costo por insumo y consumo por trabajo, cotizar deja de
  ser a ojo. Es el paso que más cambia el negocio y el que más trabajo es.
- **Proveedores como tabla.** Hoy `compras.proveedor` es texto. Sirve hasta que
  quieras ver cuánto le compraste a cada uno sin que "Maderera del Sur" y
  "maderera del sur" cuenten como dos.
