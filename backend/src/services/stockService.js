import { calcularNivelAlerta } from './alertaService.js';
import Producto from '../models/Producto.js';
import Movimiento from '../models/Movimiento.js';
import { isMongoActive } from '../config/mongodb.js';
import { delCache } from '../config/redis.js';
import { movimientosCounter, productosStockBajoGauge, productosAgotadosGauge } from '../config/prometheus.js';

/**
 * Valida y calcula el nuevo stock garantizando que nunca quede en negativo.
 */
export function validarYCalcularNuevoStock(stockActual, tipo, cantidad) {
  const actual = Number(stockActual);
  const cant = Number(cantidad);

  if (isNaN(actual) || actual < 0) {
    throw new Error('El stock actual es inválido');
  }

  if (isNaN(cant) || cant <= 0) {
    throw new Error('La cantidad debe ser un número positivo mayor a cero');
  }

  let nuevoStock = actual;

  if (tipo === 'ENTRADA') {
    nuevoStock = actual + cant;
  } else if (tipo === 'SALIDA') {
    if (actual < cant) {
      throw new Error(`Stock insuficiente: disponible ${actual}, solicitado ${cant}. No se permite stock negativo.`);
    }
    nuevoStock = actual - cant;
  } else if (tipo === 'AJUSTE') {
    nuevoStock = cant;
  } else {
    throw new Error(`Tipo de movimiento no soportado: ${tipo}`);
  }

  return {
    stockAnterior: actual,
    stockPosterior: nuevoStock,
    nivelAlerta: calcularNivelAlerta(nuevoStock)
  };
}

/**
 * Registra un movimiento atómico en MongoDB, invalida la caché de Redis y reporta a Prometheus.
 */
export async function procesarMovimiento({ productoId, tipo, cantidad, motivo, usuarioId, operacionId }) {
  if (isMongoActive()) {
    const session = await Producto.startSession().catch(() => null);

    try {
      if (session) session.startTransaction();

      // 1. Obtener producto en MongoDB
      const producto = await Producto.findOne({ id: productoId }).session(session);
      if (!producto) {
        throw new Error(`Producto con ID ${productoId} no encontrado`);
      }

      // 2. Validar que la salida no genere stock negativo
      const calculo = validarYCalcularNuevoStock(producto.stockActual, tipo, cantidad);

      // 3. Actualizar stock del producto
      producto.stockActual = calculo.stockPosterior;
      await producto.save({ session });

      // 4. Registrar documento inmutable en colección Movimiento
      const movId = `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const movimiento = new Movimiento({
        id: movId,
        operacionId: operacionId || `op-${Date.now()}`,
        productoId,
        tipo,
        cantidad: Number(cantidad),
        stockAnterior: calculo.stockAnterior,
        stockPosterior: calculo.stockPosterior,
        motivo: motivo || 'Movimiento de inventario',
        usuarioId: usuarioId || 'SISTEMA',
        creadoEn: new Date()
      });
      await movimiento.save({ session });

      if (session) await session.commitTransaction();

      // 5. Invalidad Caché en Redis del resumen del dashboard
      await delCache('cache:dashboard_resumen');

      // 6. Instrumentar métricas en Prometheus
      movimientosCounter.labels(tipo, 'EXITOSO').inc();

      return {
        producto,
        movimiento,
        alerta: calculo.nivelAlerta
      };
    } catch (error) {
      if (session) await session.abortTransaction();
      movimientosCounter.labels(tipo, 'FALLIDO').inc();
      throw error;
    } finally {
      if (session) session.endSession();
    }
  }

  // Modo local sin MongoDB conectada
  const calculo = validarYCalcularNuevoStock(10, tipo, cantidad);
  await delCache('cache:dashboard_resumen');
  movimientosCounter.labels(tipo, 'SIMULADO').inc();

  return {
    producto: { id: productoId, stockActual: calculo.stockPosterior },
    movimiento: {
      id: `MOV-LOCAL-${Date.now()}`,
      operacionId: operacionId || `op-${Date.now()}`,
      productoId,
      tipo,
      cantidad: Number(cantidad),
      stockAnterior: calculo.stockAnterior,
      stockPosterior: calculo.stockPosterior,
      motivo,
      usuarioId
    },
    alerta: calculo.nivelAlerta
  };
}
