import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

let driver = null;

export function initNeo4j() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    console.warn('⚠️ [Neo4j] Variables NEO4J_URI / USER / PASSWORD no encontradas. Operando en modo adaptativo.');
    return null;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 20
    });

    driver.verifyConnectivity()
      .then(() => console.log('✅ [Neo4j] Conectado exitosamente a Neo4j AuraDB (Base de Datos de Grafos)'))
      .catch((err) => {
        console.warn(`⚠️ [Neo4j] No se pudo conectar a Neo4j (${err.message}). Continuando en modo local.`);
        driver = null;
      });

    return driver;
  } catch (err) {
    console.warn('⚠️ [Neo4j] Error inicializando driver de Neo4j:', err.message);
    driver = null;
    return null;
  }
}

export function getNeo4jSession() {
  if (!driver) return null;
  return driver.session();
}

/**
 * Registra o sincroniza un nodo de Producto con su Proveedor y Categoría en el Grafo
 */
export async function sincronizarGrafoSuministro(productoId, nombreProducto, proveedorNombre, categoriaNombre) {
  if (!driver) return false;

  const session = driver.session();
  try {
    // Nota: no se usa "WITH p" entre los MERGE. Ese WITH descartaba la variable
    // `prov`, y el RETURN final fallaba con "Variable `prov` not defined".
    const query = `
      MERGE (p:Producto {id: $productoId})
      SET p.nombre = $nombreProducto, p.actualizadoEn = datetime()
      MERGE (prov:Proveedor {nombre: $proveedorNombre})
      MERGE (prov)-[:SUMINISTRA]->(p)
      MERGE (cat:Categoria {nombre: $categoriaNombre})
      MERGE (p)-[:PERTENECE_A]->(cat)
      RETURN p.id AS id
    `;

    await session.run(query, {
      productoId,
      nombreProducto,
      proveedorNombre: proveedorNombre || 'Proveedor General',
      categoriaNombre: categoriaNombre || 'General'
    });
    return true;
  } catch (err) {
    console.warn('⚠️ [Neo4j] No se pudo sincronizar nodo en el grafo:', err.message);
    return false;
  } finally {
    await session.close();
  }
}

export function getNeo4jDriver() {
  return driver;
}
