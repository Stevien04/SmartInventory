import * as repo from '../db/repositorio.js';
import { procesarMovimiento } from '../services/stockService.js';

export async function listarMovimientos(req, res, next) {
  try {
    const { productoId } = req.query;
    const movimientos = await repo.listar('movimientos', {
      filtro: productoId ? { productoId } : {},
      orden: { campo: 'creadoEn', direccion: 'DESC' }
    });
    return res.json(movimientos);
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
