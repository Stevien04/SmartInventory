import dotenv from 'dotenv';
import app from './app.js';
import { connectMongoDB } from './config/mongodb.js';
import { initRedis } from './config/redis.js';
import { initNeo4j } from './config/neo4j.js';

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

  app.listen(PORT, () => {
    console.log(`📡 SmartInventory API en ejecución en el puerto ${PORT}`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Prometheus Metrics: http://localhost:${PORT}/metrics`);
  });
}

bootstrap();
