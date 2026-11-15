import dotenv from 'dotenv';
import app from './app.js';
import { connectCouchbase } from './config/couchbase.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  console.log('🚀 Inicializando SmartInventory con Couchbase Capella...');

  // Base de datos NoSQL documental (si no hay credenciales, la API usa datos en memoria)
  await connectCouchbase();

  app.listen(PORT, () => {
    console.log(`📡 SmartInventory API en ejecución en el puerto ${PORT}`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  });
}

bootstrap();
