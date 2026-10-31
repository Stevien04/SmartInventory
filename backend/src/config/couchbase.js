import couchbase from 'couchbase';
import dotenv from 'dotenv';

dotenv.config();

let cluster = null;
let bucket = null;
let scope = null;

const connectionString = process.env.COUCHBASE_CONNECTION_STRING;
const username = process.env.COUCHBASE_USERNAME;
const password = process.env.COUCHBASE_PASSWORD;
const bucketName = process.env.COUCHBASE_BUCKET || 'smartinventory';
const scopeName = process.env.COUCHBASE_SCOPE || 'gestion';

export async function connectCouchbase() {
  if (cluster && scope) {
    return { cluster, bucket, scope };
  }

  if (!connectionString || !username || !password) {
    console.warn('⚠️ ADVERTENCIA: Credenciales de Couchbase no configuradas. Operando en modo local/fallback.');
    return null;
  }

  try {
    cluster = await couchbase.connect(connectionString, {
      username,
      password,
      configProfile: 'wanDevelopment'
    });

    bucket = cluster.bucket(bucketName);
    scope = bucket.scope(scopeName);

    console.log(`✅ Conectado exitosamente a Couchbase Capella -> Bucket: [${bucketName}], Scope: [${scopeName}]`);
    return { cluster, bucket, scope };
  } catch (error) {
    console.error('❌ Error al conectar con Couchbase Capella:', error.message);
    throw error;
  }
}

export function getScope() {
  return scope;
}

export function getCluster() {
  return cluster;
}
