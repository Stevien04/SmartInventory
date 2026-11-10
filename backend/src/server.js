import dotenv from 'dotenv';
import app from './app.js';
import { connectMongoDB } from './config/mongodb.js';
import { initRedis } from './config/redis.js';
import { initNeo4j } from './config/neo4j.js';
import { sincronizarCatalogoEnGrafo } from './services/grafoService.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  console.log('🚀 Inicializando SmartInventory con Stack NoSQL Políglota...');

  // 1. Conectar MongoDB (Documentos)
  await connectMongoDB();

  // 2. Conectar Redis (Caché en memoria)
  initRedis();

  // 3. Conectar Neo4j (Grafos de cadena de suministro)
  initNeo4j();

  // 4. Cargar en el grafo el catálogo que ya existe en MongoDB (no bloquea el arranque)
  sincronizarCatalogoEnGrafo()
    .then((total) => {
      if (total > 0) console.log(`✅ [Neo4j] Grafo sincronizado con ${total} productos del catálogo`);
    })
    .catch((err) => console.warn('⚠️ [Neo4j] No se pudo sincronizar el catálogo en el grafo:', err.message));

  app.listen(PORT, () => {
    console.log(`📡 SmartInventory API en ejecución en el puerto ${PORT}`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Prometheus Metrics: http://localhost:${PORT}/metrics`);
  });
}

bootstrap();
