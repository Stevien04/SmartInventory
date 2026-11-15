# Arquitectura del Sistema — SmartInventory

## 1. Visión general
SmartInventory es una aplicación de tres capas (frontend, API y datos) con una base de datos **NoSQL documental: Couchbase Capella**.

```text
  [ Navegador ]
        │ HTTPS
        ▼
  [ Frontend: React 18 + Vite + Tailwind ]      (Render Static Site)
        │ HTTPS / REST (JWT Bearer)
        ▼
  [ Backend: Node.js + Express ]                (Render Web Service)
        │ SDK de Couchbase (TLS)
        ▼
  [ Couchbase Capella ]                         (DBaaS en la nube)
     bucket smartinventory › scope inventario
     usuarios · categorias · proveedores · productos · movimientos
```

## 2. Capas del backend

| Capa | Archivos | Responsabilidad |
| --- | --- | --- |
| Rutas y controladores | `routes/`, `controllers/` | HTTP, validación de entrada, roles |
| Servicios | `services/stockService.js`, `services/alertaService.js` | Reglas de negocio (stock nunca negativo, niveles de alerta) |
| Repositorio | `db/repositorio.js` | Punto único de acceso a los datos |
| Almacenes | `db/couchbaseStore.js`, `db/memoria.js` | Couchbase Capella en producción; memoria en desarrollo y pruebas |
| Conexión | `config/couchbase.js` | Conexión al clúster, bucket y scope |

## 3. Cómo se usa Couchbase

| Necesidad | Funcionalidad de Couchbase |
| --- | --- |
| Leer un producto por ID | Acceso clave-valor (`get`), sin consulta ni índice |
| Listar y filtrar catálogo, movimientos y alertas | SQL++ parametrizado con índices secundarios |
| Descontar stock y registrar el movimiento a la vez | Transacción ACID multi-documento |
| Dos salidas simultáneas del mismo producto | Control de concurrencia optimista (CAS) + reintento |
| Ver lo recién escrito en los listados | `scanConsistency: RequestPlus` |

## 4. Tolerancia a fallos
Si las variables `COUCHBASE_*` no están configuradas o Couchbase no responde al arrancar, la API sigue funcionando con un almacén en memoria que tiene los mismos datos de ejemplo. El estado de la conexión se ve en `GET /api/health`.

## 5. Seguridad
- Ninguna credencial de base de datos llega al frontend; todas son variables de entorno en Render.
- Conexión cifrada a Capella (`couchbases://`, TLS).
- Contraseñas con bcrypt y sesiones con JWT; las rutas de escritura del catálogo exigen rol `ADMINISTRADOR`.
- Las consultas SQL++ usan parámetros (`$estado`), nunca valores concatenados.
