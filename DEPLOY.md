# Poner el panel en línea

Cuatro pasos. Los tres primeros son en tu navegador, con tus cuentas.
Calculá 20 minutos.

---

## 1 · Supabase (la base de datos)

1. Entrá a [supabase.com](https://supabase.com) → **New project**
2. Nombre `futuramuebles-panel`, región **South America (São Paulo)** — es la
   más cerca, y se nota
3. Poné una contraseña de base de datos y **guardala en tu gestor de
   contraseñas**. No la vas a usar seguido, pero si la perdés no se recupera
4. Esperá a que termine de crearse (~2 minutos)

Cuando esté listo, andá a **SQL Editor** y corré, en este orden:

| Orden | Archivo | Qué hace |
|---|---|---|
| 1º | `db/schema.sql` | Las 5 tablas, la vista y los triggers |
| 2º | `db/crear-usuario.sql` | Tu usuario admin — **editalo antes de correr** |
| 3º | `db/seed-insumos.sql` | Catálogo de arranque. Opcional |

Abrí cada archivo, copiá todo el contenido, pegalo en el editor y dale **Run**.

> **Ojo con el portapapeles.** El shell de esta Mac corre con `LC_CTYPE=C` y
> `pbcopy` rompe los acentos: `Tornillería` llega como `Torniller√≠a`. Copiá con
> `LC_CTYPE=UTF-8 pbcopy < db/schema.sql`, o abrí el archivo y copiá a mano.

En `db/crear-usuario.sql` cambiá **antes de correrlo** el nombre, el email y la
contraseña. Es la cuenta con la que vas a entrar la primera vez.

Por último, en **Project Settings → API**, copiá y guardá:
- **Project URL**
- **service_role key** (en "Project API keys", tocá el ojito para verla)

> La `service_role` key lee y escribe todo, salteando cualquier regla. Va
> únicamente en las variables de entorno de Vercel. Nunca en el repo, nunca en
> un mensaje, nunca en el navegador.

---

## 2 · GitHub (el código)

1. Creá un repo **privado** en [github.com/new](https://github.com/new),
   llamado `futuramuebles-panel`. Sin README, sin .gitignore — ya los tenemos
2. Como en los otros dos proyectos, el push va por deploy key. Generá una clave
   propia para este repo:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/futuramuebles_panel_deploy -N "" -C "futuramuebles-panel deploy"
```

3. Copiá la pública y cargala en **el repo → Settings → Deploy keys → Add deploy
   key**, con **Allow write access** tildado:

```bash
LC_CTYPE=UTF-8 pbcopy < ~/.ssh/futuramuebles_panel_deploy.pub
```

4. Agregá el alias a `~/.ssh/config`, al lado de los otros dos:

```
Host github-futuramuebles-panel
  HostName github.com
  User git
  IdentityFile ~/.ssh/futuramuebles_panel_deploy
  IdentitiesOnly yes
```

5. Y subilo:

```bash
cd /Users/matucirocco/WEB/futuramuebles-panel
git remote add origin git@github-futuramuebles-panel:TU-USUARIO/futuramuebles-panel.git
git push -u origin main
```

**Que sea privado importa.** Aunque no hay datos de clientes, el código muestra
cómo está armada la autenticación —y los costos de tus proveedores van a vivir
en esa base.

---

## 3 · Vercel (que quede en línea)

1. [vercel.com/new](https://vercel.com/new) → importá el repo
2. Framework: **Next.js** (lo detecta solo)
3. Antes de tocar Deploy, abrí **Environment Variables** y cargá:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | el Project URL del paso 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | la service_role key del paso 1 |
| `AUTH_SECRET` | generalo con el comando de abajo |
| `NEXT_PUBLIC_EMPRESA_NOMBRE` | `Futura Muebles` |

```bash
openssl rand -base64 32
```

4. **Deploy**

---

## 4 · Primer ingreso y carga inicial

Entrá con el email y la contraseña que pusiste en `crear-usuario.sql`.

Después, en este orden:

1. **Insumos** — borrá del catálogo de arranque lo que no uses y agregá lo tuyo.
   Poné el espesor y el color en el nombre: dos melaminas blancas de distinto
   espesor con el mismo nombre terminan compartiendo stock, y ese número no
   sirve para nada.

2. **El conteo inicial.** Andá insumo por insumo, botón de movimientos →
   **Ajustar**, con el motivo *Carga inicial*. Es el único momento en que vas a
   cargar existencia sin un papel atrás, y queda registrado como tal.

3. **Avisos de reposición.** En cada insumo, "avisar cuando baje de". Poné lo
   que necesitás para no frenar un trabajo mientras llega el pedido, no el
   mínimo absoluto. Sin esto la pantalla de inicio no tiene nada que avisarte.

4. **Usuarios** — dale de alta al taller con rol `taller`.

De ahí en más: lo que llega se carga en **Compras**, y lo que sale se descuenta
desde **Insumos → Se usó**, con el trabajo anotado.

---

## Si el deploy falla

El build corre en Vercel, así que los errores aparecen en el log del deploy.
Los dos más probables:

**"Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"** — alguna variable quedó
sin cargar o mal escrita. Revisalas en Settings → Environment Variables y volvé
a deployar.

**Un error de TypeScript** — el código nunca se compiló acá porque no hay Node
en la Mac. Pasame el error tal cual y lo corrijo.
