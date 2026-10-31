import client from 'prom-client';

// Registro global de Prometheus
export const register = new client.Registry();

// Añadir métricas por defecto del sistema (CPU, memoria, event loop)
client.collectDefaultMetrics({ register, prefix: 'smartinventory_' });

// 1. Contador de transacciones / movimientos de inventario
export const movimientosCounter = new client.Counter({
  name: 'smartinventory_movimientos_total',
  help: 'Total de movimientos de inventario registrados (entradas y salidas)',
  labelNames: ['tipo', 'estado'],
  registers: [register]
});

// 2. Histograma de latencia HTTP
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'smartinventory_http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// 3. Gauge de productos con stock bajo
export const productosStockBajoGauge = new client.Gauge({
  name: 'smartinventory_productos_stock_bajo_total',
  help: 'Número actual de productos con stock inferior o igual al mínimo',
  registers: [register]
});

// 4. Gauge de productos agotados
export const productosAgotadosGauge = new client.Gauge({
  name: 'smartinventory_productos_agotados_total',
  help: 'Número actual de productos completamente agotados (stock = 0)',
  registers: [register]
});

/**
 * Middleware de Express para medir duración de peticiones HTTP
 */
export function prometheusMiddleware(req, res, next) {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.baseUrl + (req.route?.path || req.path);
    httpRequestDurationMicroseconds
      .labels(req.method, route || 'unknown', res.statusCode)
      .observe(durationInSeconds);
  });
  next();
}

/**
 * Handler para el endpoint /metrics
 */
export async function getMetricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (ex) {
    res.status(500).end(ex.message);
  }
}
