import couchbase from 'couchbase';
import { connectCouchbase, closeCouchbase, getBucket, getScope, configCouchbase, COLECCIONES } from '../src/config/couchbase.js';

/**
 * Crea en Couchbase Capella el scope, las colecciones y los índices de SmartInventory.
 * Se puede ejecutar varias veces: lo que ya existe se deja como está.
 *
 * Requisitos: el bucket (COUCHBASE_BUCKET) ya debe existir y el usuario de base
 * de datos necesita permisos de administración sobre él.
 */
const INDICES = [
  ...COLECCIONES.map((c) => `CREATE PRIMARY INDEX IF NOT EXISTS ON \`${c}\``),
  'CREATE INDEX idx_usuarios_email IF NOT EXISTS ON usuarios(email, estado)',
  'CREATE INDEX idx_productos_estado_nombre IF NOT EXISTS ON productos(estado, nombre)',
  'CREATE INDEX idx_productos_codigo IF NOT EXISTS ON productos(codigo)',
  'CREATE INDEX idx_categorias_estado_nombre IF NOT EXISTS ON categorias(estado, nombre)',
  'CREATE INDEX idx_proveedores_estado_nombre IF NOT EXISTS ON proveedores(estado, nombre)',
  'CREATE INDEX idx_movimientos_producto_fecha IF NOT EXISTS ON movimientos(productoId, creadoEn DESC)',
  'CREATE INDEX idx_movimientos_fecha IF NOT EXISTS ON movimientos(creadoEn DESC)'
];

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ignorarSiExiste(promesa, ClaseError) {
  try {
    await promesa;
    return true;
  } catch (error) {
    if (error instanceof ClaseError) return false;
    throw error;
  }
}

async function crearIndice(sql, intentos = 10) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await getScope().query(sql);
      return;
    } catch (error) {
      // Recién creada, una colección puede tardar unos segundos en aceptar índices.
      if (i === intentos) throw error;
      await esperar(3000);
    }
  }
}

async function main() {
  const { bucketName, scopeName } = configCouchbase();
  if (!(await connectCouchbase())) {
    console.error('❌ No se pudo conectar a Couchbase. Revisa las variables COUCHBASE_* en backend/.env');
    process.exit(1);
  }

  const gestor = getBucket().collections();

  const scopeNuevo = await ignorarSiExiste(gestor.createScope(scopeName), couchbase.ScopeExistsError);
  console.log(scopeNuevo ? `✅ Scope creado: ${scopeName}` : `ℹ️ El scope ${scopeName} ya existía`);

  for (const coleccion of COLECCIONES) {
    const nueva = await ignorarSiExiste(gestor.createCollection(coleccion, scopeName), couchbase.CollectionExistsError);
    console.log(nueva ? `✅ Colección creada: ${coleccion}` : `ℹ️ La colección ${coleccion} ya existía`);
  }

  for (const sql of INDICES) {
    await crearIndice(sql);
    console.log(`✅ ${sql}`);
  }

  console.log(`🎉 Estructura lista en ${bucketName}.${scopeName}. Ahora puedes ejecutar: npm run seed`);
  await closeCouchbase();
}

main().catch(async (error) => {
  console.error('❌ Error inicializando Couchbase:', error.message);
  await closeCouchbase();
  process.exit(1);
});
