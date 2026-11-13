# SmartInventory — Sistema Inteligente de Gestión y Control de Inventarios

## 1. Objetivo
Construir una aplicación web full stack para administrar inventarios con una arquitectura **NoSQL Políglota** y observabilidad continua, registrar entradas y salidas, generar alertas de stock bajo y consultar reportes. El proyecto cuenta con repositorio público, CI/CD y despliegue en la nube.

> **Stack NoSQL Implementado:** MongoDB (Documentos), Redis (Caché en memoria), Neo4j (Grafos de suministro) y Prometheus (Métricas en tiempo real).

## 2. Stack tecnológico

| Capa | Tecnología | Propósito |
| --- | --- | --- |
| Frontend | React 18, Vite, Tailwind CSS | Interfaz reactiva y moderna |
| Backend | Node.js, Express | API REST, lógica de negocio y seguridad |
| Base Documental | MongoDB Atlas | Catálogo maestro de productos y transacciones |
| Caché en Memoria | Redis Cloud | Aceleración de consultas del dashboard (< 2ms) |
| Base de Grafos | Neo4j AuraDB | Grafo de relaciones proveedor-producto-categoría |
| Observabilidad | Prometheus (`/metrics`) | Métricas del sistema y gauges de stock |
| Autenticación | JWT y bcrypt | Control de acceso basado en roles (RBAC) |
| CI/CD | GitHub Actions | Pipeline automatizado de test, build y deploy |
| Despliegue Cloud | Render | Static Site (Frontend) y Web Service (API) |

## 3. Arquitectura Políglota

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

GitHub (push/PR) -> GitHub Actions (test/build) -> Webhook Deploy Render
```

## 4. Roles

- **Administrador:** gestiona usuarios, productos, categorías, proveedores, movimientos, alertas y reportes.
- **Almacenero:** consulta productos, registra movimientos y revisa alertas; no administra usuarios.

## 5. Módulos y requisitos funcionales

### 5.1 Autenticación
- Inicio y cierre de sesión con JWT.
- Contraseñas almacenadas como hash con bcrypt.
- Rutas protegidas y permisos según el rol.
- Crear un usuario administrador inicial mediante un script seguro, sin contraseñas en el repositorio.

### 5.2 Dashboard
- Cantidad de productos activos.
- Unidades totales en inventario.
- Productos con stock bajo y agotados.
- Entradas y salidas recientes.
- Gráfica de movimientos por fecha.

### 5.3 Productos
- Registrar, listar, buscar, filtrar, editar y desactivar productos.
- Campos: código único, nombre, descripción, categoría, proveedor, precio de compra, precio de venta, stock actual, stock mínimo, unidad de medida, estado, fechas.
- Validar campos obligatorios, precios no negativos y stock mínimo no negativo.
- **No editar `stockActual` libremente**: modificar existencias mediante movimientos de inventario o ajustes auditados.

### 5.4 Categorías y proveedores
- CRUD de categorías y proveedores.
- Evitar borrar físicamente una categoría/proveedor utilizado; desactivar cuando corresponda.

### 5.5 Movimientos
- Registrar entradas, salidas y ajustes con fecha, producto, cantidad, motivo y usuario responsable.
- Impedir que una salida genere stock negativo.
- Guardar el movimiento y actualizar el stock **de forma atómica**, usando una transacción de MongoDB (sesión de Mongoose).
- Prevenir registros duplicados por reintentos mediante un identificador único de operación.

### 5.6 Alertas inteligentes
- Marcar **AGOTADO** cuando `stockActual === 0`.
- Marcar **STOCK_BAJO** cuando `0 < stockActual <= stockMinimo`.
- Marcar **NORMAL** en los demás casos.
- Mostrar alertas en el dashboard.
- Opcional: identificar productos de alta rotación a partir de movimientos históricos; no afirmar que existe IA predictiva si no se implementa un modelo.

### 5.7 Reportes
- Existencias actuales y productos bajo mínimo.
- Historial de movimientos filtrado por rango de fechas y producto.
- Exportación CSV; PDF opcional.

## 6. Modelo de datos

- **MongoDB** (base `smartinventory`): colecciones `usuarios`, `productos`, `categorias`, `proveedores` y `movimientos`. Es la fuente de verdad.
- **Redis**: clave `cache:dashboard_resumen` con TTL de 60 s, invalidada en cada cambio de inventario.
- **Neo4j**: `(:Proveedor)-[:SUMINISTRA]->(:Producto)-[:PERTENECE_A]->(:Categoria)`.
- Las referencias entre documentos son por ID (`categoriaId`, `proveedorId`) y se validan en el backend.

Detalle completo en [`database/collections.md`](database/collections.md); índices en [`database/indexes.mongodb.js`](database/indexes.mongodb.js); consultas del grafo en [`database/grafo-neo4j.cypher`](database/grafo-neo4j.cypher).

### Ejemplo: documento de producto

```json
{
  "id": "PROD-001",
  "codigo": "SKU-0001",
  "nombre": "Teclado mecánico",
  "descripcion": "Teclado USB",
  "categoriaId": "CAT-001",
  "proveedorId": "PROV-001",
  "precioCompra": 80.0,
  "precioVenta": 120.0,
  "stockActual": 8,
  "stockMinimo": 5,
  "unidadMedida": "unidad",
  "estado": "ACTIVO",
  "creadoEn": "2026-10-30T12:00:00Z"
}
```

### Ejemplo: documento de movimiento

```json
{
  "id": "MOV-001",
  "operacionId": "op-unique-id",
  "productoId": "PROD-001",
  "tipo": "SALIDA",
  "cantidad": 2,
  "stockAnterior": 10,
  "stockPosterior": 8,
  "motivo": "Venta",
  "usuarioId": "USR-001",
  "creadoEn": "2026-10-30T12:00:00Z"
}
```

## 7. API REST

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Consultar sesión |
| GET / POST | `/api/productos` | Listar / crear productos |
| GET / PUT / DELETE | `/api/productos/:id` | Consultar / editar / desactivar |
| GET / POST | `/api/categorias` | Listar / crear categorías |
| GET / POST | `/api/proveedores` | Listar / crear proveedores |
| GET / POST | `/api/movimientos` | Listar / registrar movimientos |
| GET | `/api/alertas` | Productos con alertas |
| GET | `/api/dashboard/resumen` | Indicadores de inventario |
| GET | `/api/reportes/inventario` | Resumen para reporte |
| GET | `/api/health` | Comprobación de servicio |

Las rutas privadas requieren autenticación. Aplicar validación de entrada, manejo centralizado de errores, límites de solicitudes en login y CORS limitado al origen del frontend.

## 8. Estructura del repositorio

```text
SmartInventory/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProductTable.jsx
│   │   │   ├── StockAlert.jsx
│   │   │   └── DashboardCard.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Productos.jsx
│   │   │   ├── Categorias.jsx
│   │   │   ├── Proveedores.jsx
│   │   │   ├── Movimientos.jsx
│   │   │   ├── Reportes.jsx
│   │   │   └── Usuarios.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── inventarioService.js
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── mongodb.js
│   │   │   ├── redis.js
│   │   │   ├── neo4j.js
│   │   │   └── prometheus.js
│   │   ├── models/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productoController.js
│   │   │   ├── categoriaController.js
│   │   │   ├── proveedorController.js
│   │   │   ├── movimientoController.js
│   │   │   └── reporteController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── productoRoutes.js
│   │   │   ├── categoriaRoutes.js
│   │   │   ├── proveedorRoutes.js
│   │   │   └── movimientoRoutes.js
│   │   ├── services/
│   │   │   ├── stockService.js
│   │   │   ├── grafoService.js
│   │   │   └── alertaService.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   └── seedMongoDB.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── database/
│   ├── collections.md
│   ├── indexes.mongodb.js
│   ├── grafo-neo4j.cypher
│   └── sample-data.json
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   ├── arquitectura.md
│   ├── api.md
│   └── despliegue.md
├── docker-compose.yml
├── prometheus.yml
├── .gitignore
└── README.md
```

## 9. Variables de entorno

**Frontend (`frontend/.env.example`)**

```env
VITE_API_URL=http://localhost:3000/api
```

**Backend (`backend/.env.example`)**

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/smartinventory
REDIS_URL=redis://default:<password>@<host>:<port>
NEO4J_URI=neo4j+s://<instancia>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<password>
```

Para desarrollo local, `docker compose up -d` levanta MongoDB, Redis, Neo4j y Prometheus; en ese caso usa `MONGODB_URI=mongodb://localhost:27017/smartinventory`, `REDIS_URL=redis://localhost:6379` y `NEO4J_URI=bolt://localhost:7687`. Ojo: los movimientos usan transacciones de MongoDB, que requieren un replica set. Atlas ya lo trae; el contenedor local de `docker-compose.yml` es un nodo suelto, así que para registrar movimientos en local conviene apuntar a Atlas.

Nunca subir archivos `.env` reales a GitHub. Las variables de producción se configuran en Render; los tokens/hook URLs para despliegue se guardan como GitHub Actions Secrets.

## 10. Automatización y despliegue

1. Publicar el código en un repositorio **público** de GitHub.
2. Configurar GitHub Actions para ejecutar instalación, lint, pruebas y build en cada pull request y push a `main`.
3. Desplegar el frontend como sitio estático en Render.
4. Desplegar el backend como servicio web en Render.
5. Crear las instancias en la nube (MongoDB Atlas, Redis Cloud, Neo4j AuraDB) y cargar sus credenciales como variables de entorno del Web Service en Render. En Atlas, permitir el acceso desde las IP de Render.
6. Activar despliegues de Render desde GitHub Actions **solo cuando las pruebas pasen**; evitar despliegues dobles desactivando el autodeploy independiente si se usa un deploy hook.
7. Confirmar en `/api/health` que los cuatro componentes aparecen conectados y que los datos persisten en MongoDB Atlas.

## 11. Criterios de aceptación

- [x] Login válido y roles protegidos.
- [x] CRUD de productos, categorías y proveedores funcional.
- [x] Entradas y salidas actualizan el stock correctamente.
- [x] Una salida no permite inventario negativo.
- [x] Las alertas de stock bajo aparecen automáticamente.
- [x] Dashboard y reportes muestran datos reales.
- [x] Datos persistidos en MongoDB Atlas, con caché en Redis y grafo en Neo4j (no arreglos estáticos ni almacenamiento local).
- [x] Código publicado en un repositorio público.
- [x] GitHub Actions ejecuta pruebas y despliega automáticamente.
- [x] Frontend y API accesibles mediante URLs públicas.
- [x] README contiene instrucciones de instalación, arquitectura y enlaces finales.

## 12. Entregables académicos

- **Repositorio GitHub:** [https://github.com/Stevien04/SmartInventory](https://github.com/Stevien04/SmartInventory) (Ver archivo `links.txt`)
- **Aplicación desplegada (Frontend Render):** [https://smartinventory-app.onrender.com](https://smartinventory-app.onrender.com)
- **API REST desplegada (Backend Render):** [https://smartinventory-api-29jb.onrender.com/api/health](https://smartinventory-api-29jb.onrender.com/api/health)
- **Artículo en Dev.to, Medium o Hashnode:** [docs/articulo-publicacion.md](docs/articulo-publicacion.md) (Ver borrador listo para publicar con metadata y tags)
- **Video público (3:30):** [https://www.youtube.com/watch?v=ewAhGkIk9Ts](https://www.youtube.com/watch?v=ewAhGkIk9Ts) (guion en [docs/guion-video.md](docs/guion-video.md))
- **Mensaje para grupo de Telegram:** [docs/mensaje-telegram.md](docs/mensaje-telegram.md) (Plantilla formateada lista para enviar)
- **Archivo de Enlaces:** [links.txt](links.txt) (Para el empaquetado ZIP final)

### Guion sugerido del video (4:30–5:00)

| Tiempo | Contenido |
| --- | --- |
| 0:00–0:30 | Problema y objetivo: por qué un solo motor no basta |
| 0:30–1:15 | Arquitectura políglota: MongoDB, Redis, Neo4j y Prometheus |
| 1:15–2:45 | Demostración del sistema (Login, Creación de producto, Control anti-stock negativo, Alertas) |
| 2:45–3:45 | GitHub Actions y despliegue (CI/CD automático a Render) |
| 3:45–4:30 | `/api/health`, `/metrics`, grafo en Neo4j y conclusiones |
