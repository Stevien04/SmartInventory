export function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso denegado: Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}
