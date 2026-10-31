import Movimiento from '../models/Movimiento.js';
import { isMongoActive } from '../config/mongodb.js';
import { procesarMovimiento } from '../services/stockService.js';

let fallbackMovimientos = [
  {
    id: 'MOV-INIT-001',
    operacionId: 'op-init-001',
    productoId: 'PROD-001',
    tipo: 'ENTRADA',
    cantidad: 14,
    stockAnterior: 0,
    stockPosterior: 14,
    motivo: 'Inventario inicial',
    usuarioId: 'USR-DEV-001',
    creadoEn: new Date()
  }
];

export async function listarMovimientos(req, res, next) {
  try {
    const { productoId } = req.query;

    if (isMongoActive()) {
      const filter = {};
      if (productoId) filter.productoId = productoId;
      const movs = await Movimiento.find(filter).sort({ creadoEn: -1 }).lean();
      return res.json(movs);
    }

    if (productoId) {
      return res.json(fallbackMovimientos.filter((m) => m.productoId === productoId));
    }
    return res.json(fallbackMovimientos);
  } catch (error) {
    next(error);
  }
}

export async function registrarMovimiento(req, res, next) {
  try {
    const { productoId, tipo, cantidad, motivo, operacionId } = req.body;
    const usuarioId = req.user ? req.user.id : 'USR-ANONIMO';

    if (!productoId || !tipo || !cantidad) {
      return res.status(400).json({ error: 'productoId, tipo y cantidad son requeridos' });
    }

    const resultado = await procesarMovimiento({
      productoId,
      tipo,
      cantidad,
      motivo,
      usuarioId,
      operacionId
    });

    return res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}
