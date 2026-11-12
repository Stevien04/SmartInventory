# Arquitectura del Sistema — SmartInventory

## 1. Visión general
SmartInventory es una aplicación de tres capas (frontend, API y datos) con **persistencia políglota**: cada motor se usa para lo que mejor hace.

```text
  [ Navegador ]
        │ HTTPS
        ▼
  [ Frontend: React 18 + Vite + Tailwind ]      (Render Static Site)
        │ HTTPS / REST (JWT Bearer)
        ▼
  [ Backend: Node.js + Express ]                (Render Web Service)
        ├──► MongoDB Atlas   Documentos: catálogo, usuarios, movimientos (fuente de verdad)
        ├──► Redis Cloud     Caché del resumen del dashboard (TTL 60 s)
        ├──► Neo4j AuraDB    Grafo Proveedor → Producto → Categoría
        └──► /metrics        Métricas en formato Prometheus (prom-client)
```

## 2. Responsabilidad de cada motor

| Motor | Qué guarda | Dónde se usa en el código |
| --- | --- | --- |
| MongoDB | Productos, categorías, proveedores, usuarios y movimientos | `config/mongodb.js`, `models/`, `services/stockService.js` (transacciones) |
| Redis | `cache:dashboard_resumen` | `config/redis.js`, `controllers/reporteController.js` (lectura), `productoController.js` y `stockService.js` (invalidación) |
| Neo4j | Nodos `Proveedor`, `Producto`, `Categoria` y sus relaciones | `config/neo4j.js`, `services/grafoService.js` (sincronización al arrancar), `productoController.js` (al crear) |
| Prometheus | Latencia HTTP, movimientos, productos con stock bajo y agotados | `config/prometheus.js`, endpoint `/metrics` |

## 3. Tolerancia a fallos
Si un motor no está configurado o no responde, el backend sigue funcionando:
- Sin Redis, la caché pasa a un `Map` en memoria del proceso.
- Sin Neo4j, la sincronización del grafo se omite.
- Sin MongoDB, la API responde con datos de demostración.

El estado de cada conexión se ve en `GET /api/health`.

## 4. Seguridad
- Ninguna credencial de base de datos llega al frontend; todas son variables de entorno en Render.
- Contraseñas con bcrypt y sesiones con JWT; las rutas de escritura del catálogo exigen rol `ADMINISTRADOR`.
