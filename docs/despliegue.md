# Guía de Conexión y Despliegue en la Nube — Couchbase Capella + Render

Esta guía explica cómo crear la base de datos en Couchbase Capella (plan gratuito) y conectarla al backend en Render **sin compartir credenciales en el repositorio**.

---

## 1. Couchbase Capella (base de datos NoSQL en la nube)
1. Entra a [cloud.couchbase.com](https://cloud.couchbase.com) y crea una cuenta gratuita.
2. Crea un clúster del plan **Free** (operational cluster).
3. En **Data Tools > Buckets**, crea el bucket `smartinventory`.
4. En **Settings > Cluster Access**, crea un usuario de base de datos con acceso de lectura y escritura al bucket `smartinventory` (ej. `smartinventory_app`).
5. En **Settings > Allowed IP Addresses**, agrega `0.0.0.0/0` para que Render pueda conectarse (Render no tiene IP fija en el plan gratuito).
6. En **Connect**, copia la **Public Connection String**:
   ```text
   couchbases://cb.xxxxxxxx.cloud.couchbase.com
   ```

## 2. Crear colecciones, índices y datos de ejemplo
Desde tu PC, en la carpeta `backend/`:

```bash
cp .env.example .env      # y completa las variables COUCHBASE_*
npm install
npm run db:init           # crea el scope "inventario", las 5 colecciones y los índices
npm run seed              # carga el administrador, categorías, proveedores y productos
```

Si tu usuario de base de datos no tiene permisos para crear colecciones o índices, ejecuta el archivo [`database/couchbase-setup.sql`](../database/couchbase-setup.sql) en **Data Tools > Query** de Capella y luego `npm run seed`.

Usuario de prueba: `admin@smartinventory.com` / `Admin2026*!`.

---

## 3. Variables de entorno en Render (Web Service del backend)

| Variable | Valor |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Una cadena larga y aleatoria |
| `FRONTEND_URL` | `https://<tu-frontend>.onrender.com` |
| `COUCHBASE_CONNECTION_STRING` | `couchbases://cb.xxxxxxxx.cloud.couchbase.com` |
| `COUCHBASE_USERNAME` | Usuario de base de datos de Capella |
| `COUCHBASE_PASSWORD` | Contraseña de ese usuario |
| `COUCHBASE_BUCKET` | `smartinventory` |
| `COUCHBASE_SCOPE` | `inventario` |
| `COUCHBASE_TX_DURABILITY` | `none` (plan gratuito de un nodo) |

Elimina las variables antiguas (`MONGODB_URI`, `REDIS_URL`, `NEO4J_*`) si siguen configuradas.

## 4. Despliegue automatizado
1. Cada push a `main` ejecuta el workflow `.github/workflows/deploy.yml`: instala dependencias, ejecuta las pruebas del backend y compila el frontend.
2. Si todo pasa, llama a los deploy hooks de Render (secrets `RENDER_BACKEND_DEPLOY_HOOK` y `RENDER_FRONTEND_DEPLOY_HOOK`).
3. Comprueba en `https://<tu-api>.onrender.com/api/health` que aparezca `"estado": "CONNECTED"`.

> 🔒 Si las variables `COUCHBASE_*` no están configuradas, la API no se cae: arranca con datos de ejemplo en memoria y `/api/health` lo indica.
