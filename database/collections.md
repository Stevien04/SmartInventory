# Modelo de datos — SmartInventory en Couchbase Capella

SmartInventory guarda todos sus datos en **Couchbase Capella**, una base de datos NoSQL documental en la nube. Los documentos son JSON y se organizan así:

```text
bucket  smartinventory
└── scope  inventario
    ├── usuarios     clave: USR-...
    ├── categorias   clave: CAT-...
    ├── proveedores  clave: PROV-...
    ├── productos    clave: PROD-...
    └── movimientos  clave: MOV-...
```

Un **bucket** equivale a una base de datos, un **scope** a un esquema y una **collection** a una tabla. Cada documento se guarda con su campo `id` como clave, así que leer un producto por su ID es un acceso clave-valor directo, sin índices ni consultas.

| Colección | Contenido | Índices (además del primario) |
| --- | --- | --- |
| `usuarios` | Cuentas con rol (`ADMINISTRADOR`, `ALMACENERO`) y contraseña con hash bcrypt | `(email, estado)` |
| `productos` | Catálogo: código, precios, `stockActual`, `stockMinimo`, categoría y proveedor por ID | `(estado, nombre)`, `(codigo)` |
| `categorias` | Familias de productos | `(estado, nombre)` |
| `proveedores` | Empresas suministradoras | `(estado, nombre)` |
| `movimientos` | Historial inmutable de `ENTRADA`, `SALIDA` y `AJUSTE` con `stockAnterior` y `stockPosterior` | `(productoId, creadoEn DESC)`, `(creadoEn DESC)` |

La estructura completa, los índices y consultas SQL++ de ejemplo están en [`couchbase-setup.sql`](couchbase-setup.sql). El script `npm run db:init` (en `backend/`) crea lo mismo automáticamente.

Las alertas (`STOCK_BAJO`, `AGOTADO`) no se guardan: se calculan al consultar comparando `stockActual` con `stockMinimo`.

## Cómo accede la API a los datos

| Operación | Mecanismo de Couchbase | Ejemplo |
| --- | --- | --- |
| Leer un documento por ID | Clave-valor (`collection.get`) | `GET /api/productos/PROD-001` |
| Crear un documento | Clave-valor (`collection.insert`) | `POST /api/productos` |
| Listar y filtrar | Consulta SQL++ parametrizada | `SELECT d.* FROM productos AS d WHERE d.estado = $estado` |
| Registrar un movimiento | Transacción ACID multi-documento | stock del producto + documento del movimiento |

## Reglas de integridad
- `stockActual` no se edita desde el catálogo; solo cambia mediante un movimiento.
- Una `SALIDA` exige `stockActual >= cantidad`, así el stock nunca queda negativo.
- El cambio de stock y el registro del movimiento se hacen en la **misma transacción ACID de Couchbase**: se aplican los dos o ninguno.
- Si dos usuarios mueven el mismo producto a la vez, Couchbase detecta el conflicto (CAS) y la API repite la transacción con el stock actualizado.
- Cada movimiento guarda `stockAnterior` y `stockPosterior` para poder auditarlo.
- El código de producto es único: la API rechaza con `409` un código repetido.
