---
title: "SmartInventory: persistencia políglota con MongoDB, Redis, Neo4j y Prometheus, desplegada con CI/CD"
published: true
description: Cómo construimos un sistema de inventarios que usa cuatro tecnologías NoSQL y de observabilidad, cada una para lo que mejor hace, y qué aprendimos al ponerlo en producción.
tags: nosql, mongodb, redis, neo4j
---

# SmartInventory: persistencia políglota con MongoDB, Redis, Neo4j y Prometheus

Un inventario parece un problema sencillo: productos, entradas y salidas. Pero en cuanto se mira de cerca aparecen necesidades que tiran en direcciones distintas. El catálogo cambia de forma con cada categoría de producto. El stock no puede quedar nunca en negativo, ni siquiera si dos personas registran una salida al mismo tiempo. El dashboard se consulta todo el día y no debería recalcularse en cada visita. Y cuando un proveedor falla, hay que saber rápido qué productos quedan afectados.

Ninguna base de datos resuelve bien las cuatro cosas a la vez. Por eso **SmartInventory** usa **persistencia políglota**: cada motor se encarga de una sola responsabilidad.

## Enlaces del proyecto

- **Repositorio:** https://github.com/Stevien04/SmartInventory
- **Aplicación:** https://smartinventory-app.onrender.com
- **Estado de la API:** https://smartinventory-api-29jb.onrender.com/api/health
- **Métricas en formato Prometheus:** https://smartinventory-api-29jb.onrender.com/metrics
- **Video demostrativo (3:30):** https://www.youtube.com/watch?v=ewAhGkIk9Ts

> Los servicios están en el plan gratuito de Render: la primera petición después de un rato sin uso puede tardar unos 30 segundos mientras el servidor despierta.

---

## Video demostrativo

En 3 minutos y medio: la arquitectura, la aplicación funcionando en Render, el rechazo de una salida sin stock, las métricas y el grafo de suministro.

[![Video demostrativo de SmartInventory](https://img.youtube.com/vi/ewAhGkIk9Ts/hqdefault.jpg)](https://www.youtube.com/watch?v=ewAhGkIk9Ts)

---

## 1. Un motor para cada problema

| Necesidad | Motor | Por qué |
| --- | --- | --- |
| Catálogo flexible y movimientos consistentes | **MongoDB Atlas** | Documentos JSON sin esquema rígido y transacciones multi-documento |
| Dashboard que no recalcula en cada visita | **Redis Cloud** | Clave-valor en memoria con expiración automática |
| Saber qué depende de qué proveedor | **Neo4j AuraDB** | Las relaciones son datos de primera clase y se consultan con Cypher |
| Ver la salud del sistema y del inventario | **Prometheus** | Métricas numéricas en series de tiempo, en un formato estándar |

MongoDB es la **fuente de verdad**. Redis y Neo4j guardan datos derivados de MongoDB: si se pierden, se pueden reconstruir. Esa decisión simplifica mucho todo lo demás, como se verá en la sección 4.

## 2. Arquitectura

```text
        [ Navegador: React 18 + Vite + Tailwind ]        Render Static Site
                          │  HTTPS + JWT
                          ▼
             [ API: Node.js + Express ]                   Render Web Service
      ┌──────────────┬──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼
 MongoDB Atlas   Redis Cloud   Neo4j AuraDB    /metrics
 (documentos)    (caché)       (grafo)         (Prometheus)
```

Así viaja una petición típica, **registrar una salida de 2 unidades**:

1. La API abre una transacción en MongoDB, lee el producto, comprueba que hay stock suficiente, lo descuenta y guarda el movimiento. Todo se confirma junto o no se confirma nada.
2. Borra la clave del dashboard en Redis para que la siguiente consulta vea el stock nuevo.
3. Suma 1 al contador `smartinventory_movimientos_total{tipo="SALIDA",estado="EXITOSO"}` de Prometheus.

## 3. Implementación

### 3.1 MongoDB: el stock nunca queda en negativo

Un producto es un documento con referencias por ID a su categoría y proveedor:

```json
{
  "id": "PROD-001",
  "codigo": "SKU-KB-001",
  "nombre": "Teclado Mecánico RGB Pro",
  "categoriaId": "CAT-001",
  "proveedorId": "PROV-001",
  "precioCompra": 45.0,
  "precioVenta": 85.0,
  "stockActual": 14,
  "stockMinimo": 5,
  "estado": "ACTIVO"
}
```

El campo `stockActual` **no se edita desde el catálogo**. Solo cambia a través de un movimiento, y cada movimiento guarda `stockAnterior` y `stockPosterior`, de modo que el historial completo se puede auditar.

La regla de negocio vive en una función pura, fácil de probar:

```javascript
// backend/src/services/stockService.js
export function validarYCalcularNuevoStock(stockActual, tipo, cantidad) {
  const actual = Number(stockActual);
  const cant = Number(cantidad);
  if (isNaN(cant) || cant <= 0) throw new Error('La cantidad debe ser un número positivo mayor a cero');

  let nuevoStock;
  if (tipo === 'ENTRADA') nuevoStock = actual + cant;
  else if (tipo === 'SALIDA') {
    if (actual < cant) {
      throw new Error(`Stock insuficiente: disponible ${actual}, solicitado ${cant}.`);
    }
    nuevoStock = actual - cant;
  } else if (tipo === 'AJUSTE') nuevoStock = cant;
  else throw new Error(`Tipo de movimiento no soportado: ${tipo}`);

  return { stockAnterior: actual, stockPosterior: nuevoStock, nivelAlerta: calcularNivelAlerta(nuevoStock) };
}
```

Y la escritura se hace dentro de una transacción de Mongoose, para que el stock y el movimiento se guarden juntos:

```javascript
const session = await Producto.startSession();
try {
  session.startTransaction();

  const producto = await Producto.findOne({ id: productoId }).session(session);
  const calculo = validarYCalcularNuevoStock(producto.stockActual, tipo, cantidad);

  producto.stockActual = calculo.stockPosterior;
  await producto.save({ session });
  await new Movimiento({ /* ... */ stockAnterior: calculo.stockAnterior, stockPosterior: calculo.stockPosterior })
    .save({ session });

  await session.commitTransaction();
  await delCache('cache:dashboard_resumen');          // Redis
  movimientosCounter.labels(tipo, 'EXITOSO').inc();   // Prometheus
} catch (error) {
  await session.abortTransaction();
  movimientosCounter.labels(tipo, 'FALLIDO').inc();
  throw error;
} finally {
  session.endSession();
}
```

Si la validación falla a mitad de camino, `abortTransaction()` deshace todo: no queda un movimiento registrado con un stock sin actualizar ni al revés.

### 3.2 Redis: caché del dashboard con el patrón cache-aside

El resumen del dashboard (productos activos, unidades totales, productos agotados y con stock bajo, últimos movimientos) obliga a recorrer todo el catálogo. En lugar de hacerlo en cada visita, se guarda en Redis durante 60 segundos:

```javascript
// backend/src/controllers/reporteController.js
const CACHE_KEY = 'cache:dashboard_resumen';

const cachedData = await getCache(CACHE_KEY);
if (cachedData) {
  return res.json({ ...cachedData, _source: 'Redis In-Memory Cache' });
}

// No estaba en caché: calcular desde MongoDB
const resumen = await calcularResumenDesdeMongo();
await setCache(CACHE_KEY, resumen, 60); // TTL de 60 segundos
return res.json(resumen);
```

El TTL solo es la red de seguridad. Lo importante es la **invalidación explícita**: cada vez que se crea, edita o desactiva un producto, o se registra un movimiento, la API borra la clave. Así el dashboard nunca muestra stock viejo, y el campo `_source` de la respuesta deja ver en la demo si el dato vino de Redis o de MongoDB.

### 3.3 Neo4j: el grafo de la cadena de suministro

Cada producto se refleja en Neo4j junto con su proveedor y su categoría:

```text
(:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(:Categoria)
```

La sincronización usa `MERGE`, que crea el nodo o la relación solo si no existe. Eso la hace **idempotente**: se puede repetir sin duplicar nada.

```cypher
MERGE (p:Producto {id: $productoId})
SET p.nombre = $nombreProducto, p.actualizadoEn = datetime()
MERGE (prov:Proveedor {nombre: $proveedorNombre})
MERGE (prov)-[:SUMINISTRA]->(p)
MERGE (cat:Categoria {nombre: $categoriaNombre})
MERGE (p)-[:PERTENECE_A]->(cat)
RETURN p.id AS id
```

El grafo se actualiza al crear un producto y, además, **se resincroniza completo al arrancar el servidor** a partir de lo que hay en MongoDB. Gracias a `MERGE`, esa resincronización es segura aunque se ejecute en cada despliegue.

¿Para qué sirve? Para preguntas que en una base de documentos exigirían varios `$lookup` y en un grafo son un patrón. Por ejemplo, qué categorías dependen de un único proveedor, es decir, dónde está el riesgo de desabastecimiento:

```cypher
MATCH (prov:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(cat:Categoria)
RETURN cat.nombre AS categoria, count(DISTINCT prov) AS proveedores
ORDER BY proveedores ASC;
```

O qué proveedores son alternativas entre sí porque abastecen la misma categoría:

```cypher
MATCH (a:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(cat:Categoria)
      <-[:PERTENECE_A]-(:Producto)<-[:SUMINISTRA]-(b:Proveedor)
WHERE a.nombre < b.nombre
RETURN cat.nombre, a.nombre, b.nombre;
```

Estas y otras consultas están en `database/grafo-neo4j.cypher` del repositorio, listas para ejecutar en la consola de AuraDB.

### 3.4 Prometheus: métricas técnicas y de negocio

Con `prom-client`, la API publica en `/metrics` las métricas del proceso (CPU, memoria, event loop) y cuatro propias:

| Métrica | Tipo | Qué mide |
| --- | --- | --- |
| `smartinventory_http_request_duration_seconds` | Histograma | Latencia por método, ruta y código HTTP |
| `smartinventory_movimientos_total` | Contador | Movimientos por tipo y por resultado (`EXITOSO`, `FALLIDO`) |
| `smartinventory_productos_stock_bajo_total` | Gauge | Productos con stock por debajo del mínimo |
| `smartinventory_productos_agotados_total` | Gauge | Productos con stock en cero |

La latencia se mide con un middleware de Express que cronometra cada petición:

```javascript
export function prometheusMiddleware(req, res, next) {
  const start = process.hrtime();
  res.on('finish', () => {
    const [s, ns] = process.hrtime(start);
    const route = req.baseUrl + (req.route?.path || req.path);
    httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode).observe(s + ns / 1e9);
  });
  next();
}
```

Mezclar métricas técnicas con métricas de negocio permite, por ejemplo, alertar cuando suben los movimientos `FALLIDO` (muchos intentos de sacar stock que no existe) o cuando crece el número de productos agotados. En local, el `docker-compose.yml` levanta un servidor Prometheus que lee `/metrics` cada 15 segundos.

## 4. Diseñado para degradarse, no para caerse

Como Redis y Neo4j solo guardan datos derivados, ninguno de los dos es imprescindible para que la API responda:

- **Sin Redis**, la caché pasa a un `Map` en memoria del propio proceso.
- **Sin Neo4j**, la sincronización del grafo simplemente se omite.
- **Sin MongoDB**, la API responde con datos de demostración en lugar de fallar.

El endpoint `/api/health` muestra el estado real de cada componente:

```json
{
  "status": "UP",
  "stack": {
    "mongodb": "CONNECTED",
    "redis": "CONNECTED",
    "neo4j": "CONNECTED",
    "prometheus": "ACTIVE (/metrics)"
  }
}
```

## 5. Lo que aprendimos al llevarlo a producción

**Un `WITH` de más rompía Cypher.** La primera versión de la consulta de sincronización tenía `WITH p` entre los `MERGE`. `WITH` funciona como un `RETURN` intermedio: todo lo que no se nombra se descarta. La variable `prov` desaparecía y la consulta fallaba con *Variable `prov` not defined*. Quitar los `WITH` innecesarios lo resolvió.

**Redis reintentaba para siempre.** Con credenciales incorrectas, `ioredis` reintenta la conexión indefinidamente y llena los logs de *Unhandled error event*. La solución fue registrar un manejador de `error`, usar `lazyConnect` y, si la primera conexión falla, desconectar el cliente y pasar a la caché en memoria. Unas credenciales malas no se arreglan solas reintentando.

**El grafo empezaba vacío.** Al principio solo los productos *nuevos* llegaban a Neo4j, así que el catálogo que ya existía en MongoDB no aparecía en el grafo. Añadimos la resincronización al arrancar, que es segura precisamente porque `MERGE` es idempotente.

**Las transacciones exigen un replica set.** MongoDB solo admite transacciones multi-documento en un replica set. Atlas lo trae de serie, pero un `mongod` local suelto no, así que para probar los movimientos en local lo más simple es apuntar a Atlas.

## 6. CI/CD con GitHub Actions

Cada push o pull request a `main` instala dependencias, ejecuta las pruebas unitarias del backend (incluida la regla de stock no negativo) y compila el frontend. Solo si todo pasa y el cambio está en `main`, se disparan los *deploy hooks* de Render:

```yaml
jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install && npm test
        working-directory: ./backend
      - run: npm install && npm run build
        working-directory: ./frontend

  deploy:
    needs: test-and-build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: curl -f -X POST "$RENDER_BACKEND_HOOK"
        env: { RENDER_BACKEND_HOOK: "${{ secrets.RENDER_BACKEND_DEPLOY_HOOK }}" }
      - run: curl -f -X POST "$RENDER_FRONTEND_HOOK"
        env: { RENDER_FRONTEND_HOOK: "${{ secrets.RENDER_FRONTEND_DEPLOY_HOOK }}" }
```

Las URL de los hooks y las credenciales de las bases de datos viven como secretos: nunca están en el repositorio.

## 7. Cómo probarlo en local

```bash
git clone https://github.com/Stevien04/SmartInventory.git
cd SmartInventory
docker compose up -d            # MongoDB, Redis, Neo4j y Prometheus

cd backend
cp .env.example .env            # completar las URI
npm install
npm run seed                    # datos de ejemplo
npm run dev

cd ../frontend
npm install
npm run dev
```

Interfaces útiles: Neo4j Browser en `http://localhost:7474` y Prometheus en `http://localhost:9090`.

## 8. Limitaciones y siguientes pasos

- **El grafo todavía no se consulta desde la aplicación.** Hoy se explora en la consola de Neo4j; el siguiente paso es un endpoint como `GET /api/grafo/proveedores/:id/impacto` y una vista en el frontend.
- **Idempotencia de movimientos.** Cada movimiento lleva un `operacionId`, pero el índice aún no es único, así que un reintento podría registrar el mismo movimiento dos veces. Hacerlo único cerraría ese hueco.
- **Prometheus en la nube.** En producción la API expone `/metrics`, pero el servidor que las recolecta solo corre en local. Conectarlo a Grafana Cloud permitiría dashboards y alertas permanentes.

## 9. Conclusiones

La persistencia políglota no consiste en usar muchas bases de datos, sino en decidir con claridad **cuál es la fuente de verdad** y qué papel cumple cada una de las demás. En SmartInventory, MongoDB garantiza la consistencia del inventario, Redis evita recalcular el dashboard, Neo4j responde preguntas sobre relaciones que serían incómodas en documentos, y Prometheus hace visible lo que pasa dentro del sistema. Como Redis y Neo4j se pueden reconstruir desde MongoDB, añadirlos sumó capacidades sin sumar puntos únicos de falla.
