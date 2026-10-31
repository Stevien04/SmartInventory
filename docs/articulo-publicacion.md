---
title: Construyendo y Desplegando SmartInventory: Una Arquitectura NoSQL Políglota con MongoDB, Redis, Neo4j y Prometheus en la Nube
published: true
description: Guía paso a paso para diseñar y desplegar con CI/CD una plataforma de inventarios de alto rendimiento utilizando MongoDB Atlas, Redis Cloud, Neo4j AuraDB y Prometheus.
tags: nosql, mongodb, redis, neo4j, devops, prometheus
cover_image: https://raw.githubusercontent.com/tu-usuario/smartinventory-nosql/main/docs/assets/cover-banner.png
canonical_url: https://dev.to/tu-usuario/construyendo-y-desplegando-smartinventory-con-mongodb-redis-neo4j-y-prometheus
---

# Construyendo y Desplegando SmartInventory: Una Arquitectura NoSQL Políglota con MongoDB, Redis, Neo4j y Prometheus en la Nube

En el diseño de sistemas de información contemporáneos, el paradigma de una única base de datos para todas las necesidades ha quedado atrás. Las arquitecturas modernas adoptan la **persistencia políglota**, combinando diferentes motores especializados para resolver necesidades puntuales de almacenamiento, latencia y análisis.

En este artículo, detallamos la construcción y el despliegue automatizado de **SmartInventory**, un sistema integral de gestión y control de existencias impulsado por un stack cuádruple de nivel empresarial: **MongoDB** para almacenamiento documental, **Redis** para aceleración en memoria, **Neo4j** para el análisis de relaciones en la cadena de suministro y **Prometheus** para observabilidad continua.

---

## 📌 Enlaces Oficiales del Proyecto

* 💻 **Repositorio Público en GitHub:** [https://github.com/Stevien04/SmartInventory](https://github.com/Stevien04/SmartInventory)
* 🌐 **Frontend en Producción (Render Static Site):** [https://smartinventory-app.onrender.com](https://smartinventory-app.onrender.com)
* ⚙️ **API REST en Producción (Render Web Service):** [https://smartinventory-api-29jb.onrender.com/api/health](https://smartinventory-api-29jb.onrender.com/api/health)
* 📊 **Métricas de Prometheus (/metrics):** [https://smartinventory-api-29jb.onrender.com/metrics](https://smartinventory-api-29jb.onrender.com/metrics)
* 🎥 **Video Demostrativo (< 5 min en YouTube / Redes):** [https://youtu.be/DEMO_SMARTINVENTORY](https://youtu.be/DEMO_SMARTINVENTORY)

---

## 1. El Reto y la Elección del Stack Políglota

El control de inventarios demanda características dispares que un solo motor no puede resolver de manera óptima:
1. **Flexibilidad en el catálogo:** Atributos variables por categoría de producto ➔ **MongoDB** (JSON Documents).
2. **Consultas ultrarrápidas en Dashboard:** Respuestas en submilisegundos y reducción de carga en la base de datos primaria ➔ **Redis** (Key-Value In-Memory).
3. **Trazabilidad de la cadena de suministro:** Dependencias complejas de proveedores y categorías ➔ **Neo4j** (Grafos y Cypher).
4. **Supervisión de salud y métricas de negocio:** Monitoreo en tiempo real de latencia HTTP y existencias ➔ **Prometheus** (Time-Series Exporter).

### Matriz Arquitectónica

| Tecnología | Tipo de Persistencia | Rol en SmartInventory |
| :--- | :--- | :--- |
| **MongoDB Atlas** | Document Store NoSQL | Catálogo maestro de productos, usuarios con hash bcrypt y transacciones de movimientos |
| **Redis Cloud** | In-Memory Key-Value | Caché reactiva para el Dashboard (`cache:dashboard_resumen`), invalidación automática y sesiones |
| **Neo4j AuraDB** | Graph Database | Grafo de suministros: `(:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(:Categoria)` |
| **Prometheus** | Time-Series Metrics | Exposición de métricas `/metrics` con contadores de movimientos, histogramas y gauges de stock |
| **Render** | Cloud PaaS Provider | Alojamiento serverless del Frontend (Static Site) y de la API Node.js (Web Service) |
| **GitHub Actions** | CI/CD Automation | Validación automática de pruebas y despliegue por Webhooks |

---

## 2. Arquitectura del Sistema

```text
       [ Navegador del Usuario (React + Vite + Tailwind CSS) ]
                                 │
                                 ▼  (HTTPS / REST / JWT)
             [ Backend: Node.js + Express API ]
       ┌───────────────┬───────────────────┬─────────────────┐
       │               │                   │                 │
       ▼               ▼                   ▼                 ▼
 [ MongoDB Atlas ] [ Redis Cloud ] [ Neo4j AuraDB ]   [ Prometheus ]
  (Documentos)      (Caché <2ms)     (Grafos Cypher)   (Métricas /metrics)
```

---

## 3. Implementación de los Componentes Clave

### A. MongoDB: Transacciones Atómicas sin Stock Negativo
Para prevenir inconsistencias y garantizar que ninguna salida deje existencias en negativo, ejecutamos transacciones atómicas con Mongoose:

```javascript
// backend/src/services/stockService.js
export async function procesarMovimiento({ productoId, tipo, cantidad, motivo, usuarioId, operacionId }) {
  const session = await Producto.startSession();
  try {
    session.startTransaction();

    const producto = await Producto.findOne({ id: productoId }).session(session);
    if (!producto) throw new Error('Producto no encontrado');

    const calculo = validarYCalcularNuevoStock(producto.stockActual, tipo, cantidad);
    producto.stockActual = calculo.stockPosterior;
    await producto.save({ session });

    const movimiento = new Movimiento({
      id: `MOV-${Date.now()}`,
      operacionId,
      productoId,
      tipo,
      cantidad,
      stockAnterior: calculo.stockAnterior,
      stockPosterior: calculo.stockPosterior,
      motivo,
      usuarioId
    });
    await movimiento.save({ session });

    await session.commitTransaction();

    // 1. Invalidación inmediata de la caché de Redis
    await delCache('cache:dashboard_resumen');

    // 2. Instrumentación de métrica en Prometheus
    movimientosCounter.labels(tipo, 'EXITOSO').inc();

    return { producto, movimiento, alerta: calculo.nivelAlerta };
  } catch (error) {
    await session.abortTransaction();
    movimientosCounter.labels(tipo, 'FALLIDO').inc();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### B. Redis: Aceleración del Dashboard en Submilisegundos
El endpoint `/api/dashboard/resumen` implementa el patrón **Cache-Aside**:

```javascript
// backend/src/controllers/reporteController.js
export async function dashboardResumen(req, res, next) {
  const CACHE_KEY = 'cache:dashboard_resumen';

  // 1. Verificar si existe en Redis (< 2ms)
  const cachedData = await getCache(CACHE_KEY);
  if (cachedData) {
    return res.json({ ...cachedData, _source: 'Redis In-Memory Cache' });
  }

  // 2. Si no está en caché, calcular desde MongoDB
  const [totalActivos, productos, ultimosMovimientos] = await Promise.all([
    Producto.countDocuments({ estado: 'ACTIVO' }),
    Producto.find({ estado: 'ACTIVO' }).lean(),
    Movimiento.find().sort({ creadoEn: -1 }).limit(5).lean()
  ]);

  const resumen = {
    totalProductosActivos: totalActivos,
    unidadesTotales: productos.reduce((sum, p) => sum + p.stockActual, 0),
    movimientosRecientes: ultimosMovimientos,
    _source: 'MongoDB Atlas'
  };

  // 3. Guardar en Redis con TTL de 60 segundos
  await setCache(CACHE_KEY, resumen, 60);
  return res.json(resumen);
}
```

### C. Neo4j: Sincronización del Grafo de Cadena de Suministro
Al registrar un producto, se sincronizan las relaciones en Neo4j mediante consultas Cypher declarativas:

```cypher
MERGE (p:Producto {id: $productoId})
SET p.nombre = $nombreProducto, p.actualizadoEn = datetime()
WITH p
MERGE (prov:Proveedor {nombre: $proveedorNombre})
MERGE (prov)-[:SUMINISTRA]->(p)
WITH p
MERGE (cat:Categoria {nombre: $categoriaNombre})
MERGE (p)-[:PERTENECE_A]->(cat)
RETURN p, prov, cat;
```

### D. Prometheus: Observabilidad y Métricas en Tiempo Real
El endpoint `/metrics` expone métricas estándar y de negocio raspadas continuamente:
* `smartinventory_movimientos_total{tipo="SALIDA", estado="EXITOSO"}`
* `smartinventory_productos_stock_bajo_total`
* `smartinventory_http_request_duration_seconds`

---

## 4. Pipeline CI/CD Automatizado con GitHub Actions

El repositorio integra `.github/workflows/deploy.yml` para garantizar que todo cambio en `main` pase pruebas unitarias de cálculo de existencias y reglas de stock antes de invocar los webhooks de Render.

```yaml
name: SmartInventory CI/CD Pipeline
on: [push, pull_request]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm test
        working-directory: ./backend
      - run: npm ci && npm run build
        working-directory: ./frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

  deploy:
    needs: test-and-build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: curl -f -X POST "${{ secrets.RENDER_BACKEND_DEPLOY_HOOK }}"
      - run: curl -f -X POST "${{ secrets.RENDER_FRONTEND_DEPLOY_HOOK }}"
```

---

## 5. Video Demostrativo (< 5 Minutos)

El desarrollo y funcionamiento del sistema fue documentado en un video demostrativo público:

[![Ver Video](https://img.youtube.com/vi/DEMO_SMARTINVENTORY/0.jpg)](https://youtu.be/DEMO_SMARTINVENTORY)

**Estructura del Video:**
1. **0:00–0:30:** Visión general del proyecto y presentación del stack políglota.
2. **0:30–1:15:** Arquitectura de MongoDB, Redis, Neo4j y Prometheus.
3. **1:15–2:45:** Demostración en vivo de transacciones, caché de Redis y validación anti-stock negativo.
4. **2:45–3:45:** Pipeline CI/CD con GitHub Actions y despliegue a Render.
5. **3:45–4:30:** Inspección del endpoint `/metrics` en Prometheus y persistencia en MongoDB Atlas.

---

## 6. Conclusiones

La adopción de persistencia políglota con **MongoDB, Redis, Neo4j y Prometheus** demuestra que cada motor NoSQL sobresale en su especialidad. Lejos de competir, se complementan armónicamente: MongoDB asegura la consistencia documental, Redis reduce drásticamente la latencia, Neo4j descubre relaciones en la red de suministro y Prometheus ofrece total visibilidad operacional.
