# En qué orden correr los SQL

Todos van en el **SQL Editor de Supabase**. El orden importa.

> **Ojo con el portapapeles.** El shell de esta Mac corre con `LC_CTYPE=C` y
> `pbcopy` rompe los acentos: `Tornillería` llega como `Torniller√≠a`. Copiá
> siempre con `LC_CTYPE=UTF-8 pbcopy < archivo.sql`, o abrí el archivo y copiá
> a mano.

| | Archivo | Qué hace |
|---|---|---|
| 1 | `schema.sql` | Las 5 tablas, la vista `insumos_stock`, los triggers y el RLS |
| 2 | `crear-usuario.sql` | Tu cuenta admin. **Editá nombre, email y contraseña antes de correrlo** |
| 3 | `seed-insumos.sql` | Catálogo de arranque. Opcional: borralo si preferís cargar el tuyo |

`schema.sql` termina con un `select` de comprobación que tiene que devolver
cuatro ceros. Después de los otros dos, los números suben.

## Lo que el SQL no hace

**La existencia inicial no se carga por acá.** Se carga desde el panel, insumo
por insumo, con un ajuste de motivo *Carga inicial*. Es más lento que un
`insert`, y es a propósito: así el primer número de cada insumo tiene fecha y
autor, igual que todos los que vengan después. Un stock inicial metido por SQL
es exactamente el tipo de número que seis meses más tarde nadie puede explicar.

## Si te quedás afuera del panel

`crear-usuario.sql` tiene al final, comentados, el cambio de contraseña y el
alta manual. Es la única puerta si perdés el acceso de admin.
