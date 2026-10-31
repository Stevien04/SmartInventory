# Especificación de la API REST — SmartInventory

Todas las rutas privadas requieren el encabezado:
`Authorization: Bearer <JWT_TOKEN>`

## Endpoints

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Público | Autentica usuario y retorna JWT + perfil |
| `GET` | `/api/auth/me` | Autenticado | Retorna el payload del usuario autenticado |
| `GET` | `/api/productos` | Autenticado | Lista todos los productos activos |
| `GET` | `/api/productos/:id` | Autenticado | Consulta detalle de un producto específico |
| `POST` | `/api/productos` | `ADMINISTRADOR` | Registra un nuevo producto |
| `PUT` | `/api/productos/:id` | `ADMINISTRADOR` | Actualiza metadatos de producto (no stock) |
| `DELETE`| `/api/productos/:id` | `ADMINISTRADOR` | Desactiva lógicamente el producto |
| `GET` | `/api/categorias` | Autenticado | Lista categorías activas |
| `POST` | `/api/categorias` | `ADMINISTRADOR` | Registra nueva categoría |
| `GET` | `/api/proveedores` | Autenticado | Lista proveedores activos |
| `POST` | `/api/proveedores` | `ADMINISTRADOR` | Registra nuevo proveedor |
| `GET` | `/api/movimientos` | Autenticado | Lista histórico de movimientos (filtro `productoId`) |
| `POST` | `/api/movimientos` | Autenticado | Registra entrada o salida con validación de stock |
| `GET` | `/api/dashboard/resumen`| Autenticado | Métricas globales para tarjetas del dashboard |
| `GET` | `/api/alertas` | Autenticado | Lista productos en `STOCK_BAJO` o `AGOTADO` |
| `GET` | `/api/reportes/inventario`| Autenticado | Resumen valorizado de inventario |
| `GET` | `/api/health` | Público | Comprobación de salud del servicio |
