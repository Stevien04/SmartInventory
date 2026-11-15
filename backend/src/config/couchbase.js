import couchbase from 'couchbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Conexión a Couchbase Capella (base de datos NoSQL documental en la nube).
 *
 * Organización de los datos en Couchbase:
 *   bucket  -> COUCHBASE_BUCKET (por defecto "smartinventory")
 *   scope   -> COUCHBASE_SCOPE  (por defecto "inventario")
 *   collections -> usuarios, categorias, proveedores, productos, movimientos
 *
 * Cada documento se guarda con su campo `id` como clave (ej. "PROD-001").
 */
export const COLECCIONES = ['usuarios', 'categorias', 'proveedores', 'productos', 'movimientos'];

let cluster = null;
let bucket = null;
let scope = null;

export function configCouchbase() {
  return {
    connectionString: process.env.COUCHBASE_CONNECTION_STRING,
    username: process.env.COUCHBASE_USERNAME,
    password: process.env.COUCHBASE_PASSWORD,
    bucketName: process.env.COUCHBASE_BUCKET || 'smartinventory',
    scopeName: process.env.COUCHBASE_SCOPE || 'inventario'
  };
}

/**
 * Durabilidad de las transacciones ACID.
 * - "majority": la transacción espera a que la mayoría de réplicas confirme la escritura.
 *   Requiere que el bucket tenga réplicas y nodos suficientes.
 * - "none" (por defecto): confirma al escribir en el nodo activo. Es la opción que funciona
 *   en un clúster de un solo nodo, como el plan gratuito de Capella.
 */
function nivelDurabilidad() {
  return process.env.COUCHBASE_TX_DURABILITY === 'majority'
    ? couchbase.DurabilityLevel.Majority
    : couchbase.DurabilityLevel.None;
}

export async function connectCouchbase() {
  const { connectionString, username, password, bucketName, scopeName } = configCouchbase();

  if (!connectionString || !username || !password) {
    console.warn('⚠️ [Couchbase] Faltan COUCHBASE_CONNECTION_STRING / USERNAME / PASSWORD. La API usará datos en memoria.');
    return null;
  }

  try {
    cluster = await couchbase.connect(connectionString, {
      username,
      password,
      // Perfil recomendado para Capella: tiempos de espera más amplios por la latencia de Internet.
      configProfile: 'wanDevelopment',
      transactions: { durabilityLevel: nivelDurabilidad() }
    });
    bucket = cluster.bucket(bucketName);
    await bucket.waitUntilReady(10000);
    scope = bucket.scope(scopeName);
    console.log(`✅ [Couchbase] Conectado a ${bucketName}.${scopeName}`);
    return cluster;
  } catch (error) {
    console.warn(`⚠️ [Couchbase] No se pudo conectar (${error.message}). La API usará datos en memoria.`);
    cluster = null;
    bucket = null;
    scope = null;
    return null;
  }
}

export function isCouchbaseActive() {
  return scope !== null;
}

export function getCluster() {
  return cluster;
}

export function getBucket() {
  return bucket;
}

export function getScope() {
  return scope;
}

export function getCollection(nombre) {
  if (!scope) throw new Error('Couchbase no está conectado');
  return scope.collection(nombre);
}

export async function closeCouchbase() {
  if (cluster) await cluster.close();
  cluster = null;
  bucket = null;
  scope = null;
}
