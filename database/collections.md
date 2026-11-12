# Modelo de datos — SmartInventory

SmartInventory guarda los datos en tres lugares, cada uno con un propósito distinto.

## 1. MongoDB (fuente de verdad)

Base de datos: `smartinventory`. Los esquemas están en `backend/src/models/` (Mongoose).

| Colección | Contenido | Índices |
| --- | --- | --- |
| `usuarios` | Cuentas con rol (`ADMINISTRADOR`, `ALMACENERO`) y contraseña con hash bcrypt | `id` único, `email` único |
| `productos` | Catálogo: código, precios, `stockActual`, `stockMinimo`, categoría y proveedor por ID | `id` único, `codigo` único |
| `categorias` | Familias de productos | `id` único |
| `proveedores` | Empresas suministradoras | `id` único |
| `movimientos` | Historial inmutable de `ENTRADA`, `SALIDA` y `AJUSTE` con `stockAnterior` y `stockPosterior` | `id` único, `operacionId`, `productoId` |

Las alertas (`STOCK_BAJO`, `AGOTADO`) no se guardan: se calculan al consultar comparando `stockActual` con `stockMinimo`.

### Reglas de integridad
- `stockActual` no se edita desde el catálogo; solo cambia mediante un movimiento.
- Una `SALIDA` exige `stockActual >= cantidad`, así el stock nunca queda negativo.
- El cambio de stock y el registro del movimiento se hacen en la misma transacción de MongoDB.
- Cada movimiento guarda `stockAnterior` y `stockPosterior` para poder auditarlo.

## 2. Redis (caché)

| Clave | Valor | TTL |
| --- | --- | --- |
| `cache:dashboard_resumen` | JSON con los indicadores del dashboard | 60 s |

La clave se borra cada vez que se crea, edita o desactiva un producto, o se registra un movimiento.

## 3. Neo4j (grafo de suministro)

```text
(:Proveedor {nombre})-[:SUMINISTRA]->(:Producto {id, nombre})-[:PERTENECE_A]->(:Categoria {nombre})
```

El grafo se actualiza al crear un producto y se resincroniza completo al arrancar el servidor. Las consultas de ejemplo están en `grafo-neo4j.cypher`.
