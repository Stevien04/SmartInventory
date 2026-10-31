# Guía de Conexión y Despliegue en la Nube — Stack NoSQL Políglota

Esta guía te explica cómo configurar las 4 tecnologías en sus modalidades gratuitas en la nube y cómo conectarlas en Render **sin compartir tus credenciales en el chat**.

---

## 1. MongoDB Atlas (Base Documental Gratuita)
1. Entra a [mongodb.com/atlas](https://www.mongodb.com/atlas) y crea una cuenta gratuita.
2. Crea un **Cluster M0 Free**.
3. En **Database Access**, crea un usuario y contraseña (ej. `app_user` / `TuPasswordSeguro123`).
4. En **Network Access**, agrega la IP `0.0.0.0/0` para permitir la conexión desde Render.
5. En **Connect > Drivers (Node.js)**, copia la cadena de conexión:
   ```text
   mongodb+srv://app_user:<password>@cluster0.xxxxx.mongodb.net/smartinventory?retryWrites=true&w=majority
   ```
6. Reemplaza `<password>` con tu contraseña real y asígnala a la variable `MONGODB_URI` en Render.

---

## 2. Upstash o Redis Cloud (Caché en Memoria Gratuita)
1. Entra a [upstash.com](https://upstash.com) o [redis.com/try-free](https://redis.com/try-free).
2. Crea una base de datos Redis gratuita (Plan Serverless Free).
3. Copia el **Redis URL (ioredis)**:
   ```text
   redis://default:<password>@<host>:<port>
   ```
4. Asígnala a la variable `REDIS_URL` en Render.

---

## 3. Neo4j AuraDB (Base de Datos de Grafos Gratuita)
1. Entra a [neo4j.com/cloud/platform/aura-graph-database](https://neo4j.com/cloud/platform/aura-graph-database/).
2. Crea una instancia gratuita **AuraDB Free**.
3. Descarga el archivo de credenciales con la contraseña generada automáticamente.
4. Copia la URI de conexión:
   ```text
   neo4j+s://<tu-instancia>.databases.neo4j.io
   ```
5. Asigna las variables en Render:
   - `NEO4J_URI`: `neo4j+s://...`
   - `NEO4J_USERNAME`: `neo4j`
   - `NEO4J_PASSWORD`: `<tu-password>`

---

## 4. Prometheus (Observabilidad y Métricas)
1. El backend expone automáticamente el endpoint `/metrics`.
2. Para verificar que funciona, abre en tu navegador o envía un `curl`:
   ```bash
   curl https://<tu-api-en-render>.onrender.com/metrics
   ```
3. Verás métricas en tiempo real como `smartinventory_movimientos_total`, `smartinventory_productos_stock_bajo_total` y `smartinventory_http_request_duration_seconds`.

---

## 5. Variables de Entorno en Render (Web Service)
En el panel de Render, agrega en **Environment Variables**:

| Variable | Valor |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | Genera una cadena aleatoria |
| `FRONTEND_URL` | `https://<tu-frontend>.onrender.com` |
| `MONGODB_URI` | Tu URI de MongoDB Atlas |
| `REDIS_URL` | Tu URI de Redis Cloud |
| `NEO4J_URI` | Tu URI de Neo4j AuraDB |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | Tu contraseña de AuraDB |

> 🔒 **Seguridad:** El backend cuenta con un **modo adaptativo inteligente**: si alguna variable no está configurada, el sistema continúa funcionando localmente sin detenerse ni fallar.
