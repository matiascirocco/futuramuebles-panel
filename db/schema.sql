-- Panel Futura Muebles — esquema Postgres
--
-- Etapa 1: qué insumos hay, qué se compró y qué se consumió.
--
-- No es una copia del panel de FuturaDeco aunque se le parezca. Allá el stock
-- es producto terminado con precio de lista, que entra por compra y sale
-- cuando se aprueba un presupuesto. Acá se fabrica a medida: no hay diez
-- placards esperando comprador. Lo que se stockea son los materiales —placas,
-- herrajes, correderas, cantos, tornillería— y salen cuando se arma un mueble,
-- no cuando alguien acepta un presupuesto.
--
-- Postgres puro: corre igual en Supabase, en Neon o en un Postgres propio.

create extension if not exists pgcrypto with schema extensions;

-- pgcrypto vive en el esquema `extensions`: sin esto, gen_random_uuid() falla
-- con "function does not exist".
set search_path = public, extensions;

-- ---------------------------------------------------------------- usuarios
--
-- Dos roles, y la línea que los separa son los costos. El taller necesita
-- saber cuántas placas quedan y descontar lo que usa; no necesita saber a
-- cuánto las compraste.

create type rol_usuario as enum ('admin', 'taller');

create table usuarios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null unique,
  password_hash text not null,
  rol           rol_usuario not null default 'taller',
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------- insumos
--
-- El catálogo de materiales.
--
-- Acá NO hay precio de venta, y es a propósito: una placa de melamina no se
-- vende, se consume adentro de un mueble. Lo que importa es el costo, y el
-- costo cambia en cada compra. Por eso `costo_ultimo` no se carga a mano: lo
-- pisa la última compra que lo haya traído con precio. Es el número que
-- necesitás para cotizar un trabajo con la plata de hoy y no con la de marzo.

create table insumos (
  id          bigserial primary key,
  nombre      text not null,
  descripcion text,
  categoria   text,
  unidad      text,

  -- Lo que salió la última vez que entró. Nulo si nunca se compró con precio.
  costo_ultimo        numeric(14,2),
  costo_actualizado_at timestamptz,

  -- Cuando el stock baja de acá, el insumo se marca para reponer.
  alerta_stock numeric(14,3),

  activo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on insumos (categoria);
create index on insumos (activo);
create unique index insumos_nombre_unico on insumos (lower(nombre));

comment on column insumos.costo_ultimo is
  'Lo que costó la última vez que entró. Lo pisa la compra, no se edita a mano.';
comment on column insumos.alerta_stock is
  'Cuando el stock baja de acá, se marca para reponer. Nulo = sin aviso.';

-- ----------------------------------------------------------------- compras
--
-- Lo que le compraste a un proveedor. El documento es esto; lo que mueve el
-- depósito son los movimientos que se crean junto con él.

create table compras (
  id bigserial primary key,

  proveedor   text not null,
  comprobante text,                       -- nro de factura o remito del proveedor
  fecha       date not null default current_date,

  -- [{insumo_id, descripcion, cantidad, costo_unitario}]
  -- La descripción queda congelada: si mañana renombrás el insumo, la compra
  -- sigue diciendo lo que decía el papel del proveedor.
  items jsonb not null default '[]'::jsonb,

  total numeric(14,2) not null default 0,
  notas text,

  usuario_id uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index compras_fecha_idx on compras (fecha desc);

-- -------------------------------------------------------- movimientos_stock
--
-- El libro mayor del depósito.
--
-- La existencia NO se guarda como un número que se pisa. Se guarda lo que
-- entró y lo que salió, y el stock es la suma. Eso permite contestar "¿por qué
-- dice 12?" abriendo la lista, en vez de creerle a un número que alguien pisó
-- alguna vez y nadie sabe cuándo.
--
-- Tres clases de movimiento, y nada más:
--   compra  (+)  llegó material del proveedor
--   consumo (−)  se usó en un mueble, con el trabajo anotado
--   ajuste  (±)  todo lo demás: conteo físico, rotura, sobrante que volvió,
--                carga inicial

create type tipo_movimiento as enum ('compra', 'consumo', 'ajuste');

create table movimientos_stock (
  id bigserial primary key,

  insumo_id bigint not null references insumos(id) on delete restrict,

  -- Con signo: positivo entra, negativo sale. Decimal porque las placas se
  -- miden en m² y los cantos en metros lineales.
  cantidad numeric(14,3) not null check (cantidad <> 0),

  tipo   tipo_movimiento not null,
  motivo text,

  -- De qué compra salió, si salió de una.
  compra_id bigint references compras(id) on delete cascade,

  usuario_id uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);

create index movimientos_insumo_idx on movimientos_stock (insumo_id, created_at desc);
create index movimientos_compra_idx on movimientos_stock (compra_id);
create index movimientos_fecha_idx  on movimientos_stock (created_at desc);

-- Una salida sin explicación es un número que dentro de un mes no se puede
-- auditar: nadie se acuerda de por qué faltaban tres placas. La compra no lo
-- necesita porque su explicación es el documento que la trajo.
alter table movimientos_stock add constraint salida_con_motivo
  check (tipo = 'compra' or (motivo is not null and length(trim(motivo)) > 0));

-- Las direcciones son parte del significado, no una convención: una compra que
-- resta y un consumo que suma son datos rotos, y el error se descubre meses
-- después cuando el stock no cierra.
alter table movimientos_stock add constraint signo_coherente
  check (
    (tipo = 'compra'  and cantidad > 0) or
    (tipo = 'consumo' and cantidad < 0) or
    tipo = 'ajuste'
  );

-- ------------------------------------------------------------ intentos_login
-- Freno de fuerza bruta en el login. Se limpia sola al primer ingreso bueno
-- desde esa IP.

create table intentos_login (
  id           bigserial primary key,
  ip           text not null,
  email        text,
  intentado_at timestamptz not null default now()
);

create index on intentos_login (ip, intentado_at desc);

-- ------------------------------------------------------------------- vistas

-- El catálogo con la existencia ya sumada.
create view insumos_stock with (security_invoker = true) as
select
  i.*,
  coalesce((
    select sum(m.cantidad)
    from movimientos_stock m
    where m.insumo_id = i.id
  ), 0)::numeric(14,3) as stock,
  (
    select max(m.created_at)
    from movimientos_stock m
    where m.insumo_id = i.id
  ) as ultimo_movimiento
from insumos i;

-- ----------------------------------------------------------------- triggers

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger t_usuarios before update on usuarios for each row execute function touch_updated_at();
create trigger t_insumos  before update on insumos  for each row execute function touch_updated_at();
create trigger t_compras  before update on compras  for each row execute function touch_updated_at();

-- --------------------------------------------------------------------- RLS
-- Cierre por defecto: RLS activado y SIN políticas, así que ni `anon` ni
-- `authenticated` llegan a nada por el Data API.
--
-- La app entra con la service_role key, que saltea RLS, y la autorización de
-- verdad la hace el código (lib/session.ts + lib/autorizar.ts). Esto es la
-- segunda barrera: si la anon key se filtrara, igual no se llega a los datos.

alter table usuarios          enable row level security;
alter table insumos           enable row level security;
alter table compras           enable row level security;
alter table movimientos_stock enable row level security;
alter table intentos_login    enable row level security;

grant all privileges on usuarios          to service_role;
grant all privileges on insumos           to service_role;
grant all privileges on compras           to service_role;
grant all privileges on movimientos_stock to service_role;
grant all privileges on intentos_login    to service_role;
grant select on insumos_stock to service_role;

grant usage, select on sequence insumos_id_seq           to service_role;
grant usage, select on sequence compras_id_seq           to service_role;
grant usage, select on sequence movimientos_stock_id_seq to service_role;
grant usage, select on sequence intentos_login_id_seq    to service_role;

-- ------------------------------------------------------------ verificación

select
  (select count(*) from usuarios)          as usuarios,
  (select count(*) from insumos)           as insumos,
  (select count(*) from compras)           as compras,
  (select count(*) from movimientos_stock) as movimientos;
