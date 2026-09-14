-- Crear un usuario.
--
-- El primero tenés que crearlo desde acá, porque la pantalla de Usuarios pide
-- estar adentro y todavía no hay con qué entrar. De ahí en más se hace desde
-- el panel: Usuarios → Nuevo usuario.
--
-- La contraseña se hashea con bcrypt en el momento: no queda en texto plano.

set search_path = public, extensions;

insert into usuarios (nombre, email, password_hash, rol, activo)
values (
  'Mati',                                      -- ← cómo se llama
  'mati@futuramuebles.com.ar',                 -- ← con qué email entra
  crypt('CambiameYa123', gen_salt('bf')),      -- ← contraseña inicial
  'admin',                                     -- ← 'admin' o 'taller'
  true
);

-- Comprobación
select nombre, email, rol, activo, created_at from usuarios order by rol, nombre;


-- ---------------------------------------------------------------------------
-- Cosas que se hacen desde acá si te quedás afuera:

-- Cambiarle la contraseña a alguien
-- update usuarios set password_hash = crypt('LaNueva', gen_salt('bf'))
-- where email = 'mati@futuramuebles.com.ar';

-- Desactivar a alguien que se fue (no se borra: sus compras lo nombran)
-- update usuarios set activo = false where email = 'alguien@futuramuebles.com.ar';
