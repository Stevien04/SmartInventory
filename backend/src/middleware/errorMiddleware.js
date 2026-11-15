export function errorMiddleware(err, req, res, next) {
  const statusCode = err.status || 500;
  // Los errores de negocio (400/404/409) son esperables; solo se registran los fallos internos.
  if (statusCode >= 500) console.error('❌ Error interno:', err);
  res.status(statusCode).json({
    error: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
}
