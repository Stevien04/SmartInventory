import bcrypt from 'bcryptjs';
import { connectCouchbase, closeCouchbase, getCollection } from '../src/config/couchbase.js';
import * as datos from '../src/data/datosIniciales.js';

/**
 * Carga los datos de ejemplo en Couchbase Capella.
 * Usa upsert (insertar o reemplazar), así que se puede ejecutar varias veces.
 * Ejecutar antes: npm run db:init
 */
async function main() {
  if (!(await connectCouchbase())) {
    console.error('❌ No se pudo conectar a Couchbase. Revisa las variables COUCHBASE_* en backend/.env');
    process.exit(1);
  }

  const ahora = new Date().toISOString();
  const conFechas = (doc) => ({ createdAt: ahora, updatedAt: ahora, ...doc });

  const admin = datos.usuarioAdmin(await bcrypt.hash(datos.ADMIN_PASSWORD_DEMO, 10));
  await getCollection('usuarios').upsert(admin.id, conFechas(admin));
  console.log(`✅ Usuario administrador: ${datos.ADMIN_EMAIL}`);

  for (const coleccion of ['categorias', 'proveedores', 'productos', 'movimientos']) {
    for (const doc of datos[coleccion]) {
      await getCollection(coleccion).upsert(doc.id, conFechas(doc));
    }
    console.log(`✅ ${datos[coleccion].length} documentos en ${coleccion}`);
  }

  console.log('🎉 Datos de ejemplo cargados en Couchbase Capella');
  await closeCouchbase();
}

main().catch(async (error) => {
  console.error('❌ Error cargando datos:', error.message);
  await closeCouchbase();
  process.exit(1);
});
