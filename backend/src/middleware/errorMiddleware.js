export function errorMiddleware(err, req, res, next) {
  console.error('❌ Error capturado en Middleware:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
}
