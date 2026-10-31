# Modelo NoSQL de Couchbase Capella — SmartInventory

Este documento detalla la estructura física y lógica implementada en Couchbase Capella.

## Organización de Datos
- **Bucket:** `smartinventory`
- **Scope:** `gestion`
- **Colecciones:**
  1. `usuarios`: Cuentas con roles (`ADMINISTRADOR`, `ALMACENERO`) y passwords con hash bcrypt.
  2. `productos`: Catálogo maestro de ítems, precio de compra, precio de venta, `stockActual`, `stockMinimo`.
  3. `categorias`: Familias de productos (ej. Periféricos, Componentes, Redes).
  4. `proveedores`: Contactos y empresas suministradoras.
  5. `movimientos`: Ledger inmutable de transacciones (`ENTRADA`, `SALIDA`, `AJUSTE`) con `operacionId` único.
  6. `alertas`: Registro de eventos de umbral (`STOCK_BAJO`, `AGOTADO`).

## Reglas de Integridad
- No se permite editar el campo `stockActual` directamente desde el catálogo; solo cambia a través de transacciones en la colección `movimientos`.
- La operación `SALIDA` verifica que `stockActual >= cantidad` antes de autorizar el cambio.
- Cada movimiento almacena `stockAnterior` y `stockPosterior` para trazabilidad completa.
