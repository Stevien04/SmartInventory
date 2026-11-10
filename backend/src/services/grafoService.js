import Producto from '../models/Producto.js';
import Proveedor from '../models/Proveedor.js';
import Categoria from '../models/Categoria.js';
import { isMongoActive } from '../config/mongodb.js';
import { getNeo4jDriver, sincronizarGrafoSuministro } from '../config/neo4j.js';

/**
 * Carga en Neo4j el catálogo que ya existe en MongoDB.
 *
 * El grafo solo se actualizaba al crear un producto, así que los productos
 * registrados antes de conectar Neo4j no aparecían. Esta sincronización se
 * ejecuta al arrancar el servidor y es idempotente (usa MERGE), por lo que
 * repetirla no duplica nodos ni relaciones.
 *
 * @returns {Promise<number>} cantidad de productos sincronizados
 */
export async function sincronizarCatalogoEnGrafo() {
  const driver = getNeo4jDriver();
  if (!driver || !isMongoActive()) return 0;

  try {
    await driver.verifyConnectivity();
  } catch {
    return 0;
  }

  const [productos, proveedores, categorias] = await Promise.all([
    Producto.find({ estado: 'ACTIVO' }).lean(),
    Proveedor.find().lean(),
    Categoria.find().lean()
  ]);

  const nombreProveedor = new Map(proveedores.map((p) => [p.id, p.nombre]));
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]));

  for (const producto of productos) {
    await sincronizarGrafoSuministro(
      producto.id,
      producto.nombre,
      nombreProveedor.get(producto.proveedorId),
      nombreCategoria.get(producto.categoriaId)
    );
  }

  return productos.length;
}
