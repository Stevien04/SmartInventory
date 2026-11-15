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
import { isCouchbaseActive, configCouchbase } from './config/couchbase.js';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

// Health Check con el estado de la base de datos NoSQL
app.get('/api/health', (req, res) => {
  const { bucketName, scopeName } = configCouchbase();
  res.json({
    status: 'UP',
    database: {
      motor: 'Couchbase Capella',
      estado: isCouchbaseActive() ? 'CONNECTED' : 'MEMORIA (sin credenciales de Couchbase)',
      bucket: bucketName,
      scope: scopeName
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
