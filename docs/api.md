# Especificación de la API REST — SmartInventory

Todas las rutas privadas requieren el encabezado:
`Authorization: Bearer <JWT_TOKEN>`

## Endpoints

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Público | Autentica usuario y retorna JWT + perfil |
| `GET` | `/api/auth/me` | Autenticado | Retorna el payload del usuario autenticado |
| `GET` | `/api/productos` | Autenticado | Lista los productos |
| `GET` | `/api/productos/:id` | Autenticado | Consulta detalle de un producto (lectura clave-valor) |
| `POST` | `/api/productos` | `ADMINISTRADOR` | Registra un nuevo producto (`409` si el código ya existe) |
| `PUT` | `/api/productos/:id` | `ADMINISTRADOR` | Actualiza metadatos de producto (no stock) |
| `DELETE`| `/api/productos/:id` | `ADMINISTRADOR` | Desactiva lógicamente el producto |
| `GET` | `/api/categorias` | Autenticado | Lista categorías activas |
| `POST` | `/api/categorias` | `ADMINISTRADOR` | Registra nueva categoría |
| `GET` | `/api/proveedores` | Autenticado | Lista proveedores activos |
| `POST` | `/api/proveedores` | `ADMINISTRADOR` | Registra nuevo proveedor |
| `GET` | `/api/movimientos` | Autenticado | Lista histórico de movimientos (filtro `productoId`) |
| `POST` | `/api/movimientos` | Autenticado | Registra entrada, salida o ajuste en una transacción ACID |
| `GET` | `/api/dashboard/resumen`| Autenticado | Indicadores globales del dashboard |
| `GET` | `/api/alertas` | Autenticado | Lista productos en `STOCK_BAJO` o `AGOTADO` |
| `GET` | `/api/reportes/inventario`| Autenticado | Resumen valorizado de inventario |
| `GET` | `/api/health` | Público | Estado del servicio y de la conexión a Couchbase |

## Códigos de error

| Código | Cuándo |
| --- | --- |
| `400` | Datos incompletos, cantidad inválida o salida mayor que el stock disponible |
| `401` | Sin token, token inválido o credenciales incorrectas |
| `403` | El rol del usuario no permite la operación |
| `404` | El producto no existe |
| `409` | Ya existe un producto con ese código |
