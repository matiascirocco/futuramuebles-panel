-- Catálogo de arranque: los insumos típicos de una mueblería a medida.
--
-- OPCIONAL. Es para no empezar con la pantalla en blanco, no una lista
-- definitiva: borrá lo que no uses y agregá lo tuyo desde el panel.
--
-- Va SIN costos y SIN stock, a propósito:
--
--   · El costo lo pone la primera compra que traiga ese insumo. Inventarlo acá
--     sería cargar un número que nadie verificó y que después se usa para
--     cotizar.
--   · La existencia se carga con un ajuste "Carga inicial" cuando cuentes lo
--     que hay en el galpón. Así el primer número tiene fecha y autor, igual
--     que todos los que vengan después.
--
-- Correrlo dos veces no duplica nada: el nombre es único.

set search_path = public, extensions;

insert into insumos (nombre, categoria, unidad, alerta_stock) values
  ('Melamina blanca 18 mm',                'Placas',       'placa', 4),
  ('Melamina roble 18 mm',                 'Placas',       'placa', 4),
  ('Melamina nogal 18 mm',                 'Placas',       'placa', 2),
  ('Melamina blanca 15 mm',                'Placas',       'placa', 2),
  ('MDF crudo 18 mm',                      'Placas',       'placa', 2),
  ('MDF crudo 5,5 mm (fondo)',             'Placas',       'placa', 4),
  ('Aglomerado 18 mm',                     'Placas',       'placa', 2),

  ('Canto ABS blanco 22 mm',               'Cantos',       'metro', 50),
  ('Canto ABS roble 22 mm',                'Cantos',       'metro', 50),
  ('Canto ABS nogal 22 mm',                'Cantos',       'metro', 25),

  ('Bisagra cazoleta recta 35 mm',         'Herrajes',     'unidad', 40),
  ('Bisagra cazoleta codo 9',              'Herrajes',     'unidad', 20),
  ('Bisagra cazoleta codo 16',             'Herrajes',     'unidad', 20),
  ('Corredera telescópica 45 cm',          'Correderas',   'juego', 10),
  ('Corredera telescópica 50 cm',          'Correderas',   'juego', 10),
  ('Corredera de fondo con cierre suave',  'Correderas',   'juego', 6),
  ('Riel para puerta corrediza 2 m',       'Correderas',   'juego', 4),

  ('Tirador barral 128 mm',                'Tiradores',    'unidad', 20),
  ('Tirador barral 192 mm',                'Tiradores',    'unidad', 20),
  ('Tirador uñero aluminio',               'Tiradores',    'metro', 10),
  ('Perilla redonda',                      'Tiradores',    'unidad', 10),

  ('Tornillo aglomerado 4x30',             'Tornillería',  'unidad', 200),
  ('Tornillo aglomerado 4x50',             'Tornillería',  'unidad', 200),
  ('Tornillo cabeza plana 3,5x16',         'Tornillería',  'unidad', 200),
  ('Tarugo de madera 8 mm',                'Tornillería',  'unidad', 100),
  ('Minifix completo',                     'Tornillería',  'juego', 50),

  ('Cola vinílica',                        'Adhesivos',    'kg', 2),
  ('Adhesivo de contacto',                 'Adhesivos',    'litro', 2),
  ('Silicona neutra',                      'Adhesivos',    'unidad', 3),

  ('Zócalo regulable para bajo mesada',    'Accesorios',   'metro', 6),
  ('Patas regulables',                     'Accesorios',   'unidad', 20),
  ('Rejilla de ventilación',               'Accesorios',   'unidad', 5),
  ('Mesada de melamina postformada',       'Mesadas',      'metro', 2)
on conflict do nothing;

-- Comprobación
select categoria, count(*) as insumos
from insumos
group by categoria
order by categoria;
