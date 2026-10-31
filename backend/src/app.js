import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import proveedorRoutes from './routes/proveedorRoutes.js';
import movimientoRoutes from './routes/movimientoRoutes.js';
import { dashboardResumen, listarAlertas, reporteInventario } from './controllers/reporteController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { prometheusMiddleware, getMetricsHandler } from './config/prometheus.js';
import { isMongoActive } from './config/mongodb.js';
import { getRedisClient } from './config/redis.js';
import { getNeo4jDriver } from './config/neo4j.js';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

// 1. Middleware de Observabilidad (Prometheus)
app.use(prometheusMiddleware);

// 2. Endpoint público de Prometheus para Scraping
app.get('/metrics', getMetricsHandler);

// 3. Health Check detallado con el estado del Stack NoSQL Políglota
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    stack: {
      mongodb: isMongoActive() ? 'CONNECTED' : 'STANDBY/LOCAL',
      redis: getRedisClient() ? 'CONNECTED' : 'IN_MEMORY_FALLBACK',
      neo4j: getNeo4jDriver() ? 'CONNECTED' : 'STANDBY/LOCAL',
      prometheus: 'ACTIVE (/metrics)'
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/movimientos', movimientoRoutes);

// Dashboard, Alertas y Reportes
app.get('/api/dashboard/resumen', authMiddleware, dashboardResumen);
app.get('/api/alertas', authMiddleware, listarAlertas);
app.get('/api/reportes/inventario', authMiddleware, reporteInventario);

// Manejador centralizado de errores
app.use(errorMiddleware);

export default app;
