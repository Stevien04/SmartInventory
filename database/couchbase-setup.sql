/*
 * SmartInventory — estructura e índices en Couchbase Capella
 *
 * Ejecutar en Capella > Data Tools > Query, con el contexto
 * bucket "smartinventory" y scope "inventario" (o con "npm run db:init").
 *
 * Organización:
 *   bucket smartinventory
 *     └── scope inventario
 *           ├── usuarios     (clave: USR-...)
 *           ├── categorias   (clave: CAT-...)
 *           ├── proveedores  (clave: PROV-...)
 *           ├── productos    (clave: PROD-...)
 *           └── movimientos  (clave: MOV-...)
 */

-- 1. Scope y colecciones
CREATE SCOPE smartinventory.inventario IF NOT EXISTS;
CREATE COLLECTION smartinventory.inventario.usuarios IF NOT EXISTS;
CREATE COLLECTION smartinventory.inventario.categorias IF NOT EXISTS;
CREATE COLLECTION smartinventory.inventario.proveedores IF NOT EXISTS;
CREATE COLLECTION smartinventory.inventario.productos IF NOT EXISTS;
CREATE COLLECTION smartinventory.inventario.movimientos IF NOT EXISTS;

-- 2. Índices primarios (permiten cualquier consulta SQL++ sobre la colección)
CREATE PRIMARY INDEX IF NOT EXISTS ON usuarios;
CREATE PRIMARY INDEX IF NOT EXISTS ON categorias;
CREATE PRIMARY INDEX IF NOT EXISTS ON proveedores;
CREATE PRIMARY INDEX IF NOT EXISTS ON productos;
CREATE PRIMARY INDEX IF NOT EXISTS ON movimientos;

-- 3. Índices secundarios para las consultas de la API
CREATE INDEX idx_usuarios_email IF NOT EXISTS ON usuarios(email, estado);
CREATE INDEX idx_productos_estado_nombre IF NOT EXISTS ON productos(estado, nombre);
CREATE INDEX idx_productos_codigo IF NOT EXISTS ON productos(codigo);
CREATE INDEX idx_categorias_estado_nombre IF NOT EXISTS ON categorias(estado, nombre);
CREATE INDEX idx_proveedores_estado_nombre IF NOT EXISTS ON proveedores(estado, nombre);
CREATE INDEX idx_movimientos_producto_fecha IF NOT EXISTS ON movimientos(productoId, creadoEn DESC);
CREATE INDEX idx_movimientos_fecha IF NOT EXISTS ON movimientos(creadoEn DESC);

-- 4. Consultas de ejemplo
-- Productos con stock bajo o agotados
SELECT p.codigo, p.nombre, p.stockActual, p.stockMinimo,
       CASE WHEN p.stockActual = 0 THEN "AGOTADO" ELSE "STOCK_BAJO" END AS tipoAlerta
FROM productos AS p
WHERE p.estado = "ACTIVO" AND p.stockActual <= p.stockMinimo
ORDER BY p.stockActual;

-- Valor del inventario por categoría (JOIN entre colecciones)
SELECT c.nombre AS categoria,
       COUNT(p.id) AS productos,
       SUM(p.stockActual) AS unidades,
       SUM(p.stockActual * p.precioCompra) AS valorCompra
FROM productos AS p
JOIN categorias AS c ON KEYS p.categoriaId
WHERE p.estado = "ACTIVO"
GROUP BY c.nombre
ORDER BY valorCompra DESC;

-- Historial de un producto
SELECT m.tipo, m.cantidad, m.stockAnterior, m.stockPosterior, m.motivo, m.creadoEn
FROM movimientos AS m
WHERE m.productoId = "PROD-001"
ORDER BY m.creadoEn DESC;
