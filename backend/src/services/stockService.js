import { calcularNivelAlerta } from './alertaService.js';
import * as repo from '../db/repositorio.js';
import { ErrorNegocio } from '../db/errores.js';

/**
 * Valida y calcula el nuevo stock garantizando que nunca quede en negativo.
 */
export function validarYCalcularNuevoStock(stockActual, tipo, cantidad, stockMinimo = 0) {
  const actual = Number(stockActual);
  const cant = Number(cantidad);

  if (isNaN(actual) || actual < 0) {
    throw new ErrorNegocio('El stock actual es inválido');
  }

  if (isNaN(cant) || cant <= 0) {
    throw new ErrorNegocio('La cantidad debe ser un número positivo mayor a cero');
  }

  let nuevoStock = actual;

  if (tipo === 'ENTRADA') {
    nuevoStock = actual + cant;
  } else if (tipo === 'SALIDA') {
    if (actual < cant) {
      throw new ErrorNegocio(`Stock insuficiente: disponible ${actual}, solicitado ${cant}. No se permite stock negativo.`);
    }
    nuevoStock = actual - cant;
  } else if (tipo === 'AJUSTE') {
    nuevoStock = cant;
  } else {
    throw new ErrorNegocio(`Tipo de movimiento no soportado: ${tipo}`);
  }

  return {
    stockAnterior: actual,
    stockPosterior: nuevoStock,
    nivelAlerta: calcularNivelAlerta(nuevoStock, stockMinimo)
  };
}

/**
 * Registra un movimiento de inventario en una transacción ACID de Couchbase:
 * se actualiza el stock del producto y se inserta el documento del movimiento.
 * Si cualquiera de las dos escrituras falla, no se aplica ninguna.
 */
export async function procesarMovimiento({ productoId, tipo, cantidad, motivo, usuarioId, operacionId }) {
  return repo.transaccion(async (tx) => {
    const producto = await tx.obtener('productos', productoId);
    if (!producto) {
      throw new ErrorNegocio(`Producto con ID ${productoId} no encontrado`, 404);
    }
    if (producto.estado !== 'ACTIVO') {
      throw new ErrorNegocio('No se pueden registrar movimientos de un producto inactivo');
    }

    const calculo = validarYCalcularNuevoStock(producto.stockActual, tipo, cantidad, producto.stockMinimo);

    const productoActualizado = { ...producto, stockActual: calculo.stockPosterior };
    await tx.reemplazar('productos', productoActualizado);

    const movimiento = {
      id: `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      operacionId: operacionId || `op-${Date.now()}`,
      productoId,
      tipo,
      cantidad: Number(cantidad),
      stockAnterior: calculo.stockAnterior,
      stockPosterior: calculo.stockPosterior,
      motivo: motivo || 'Movimiento de inventario',
      usuarioId: usuarioId || 'SISTEMA',
      creadoEn: new Date().toISOString()
    };
    await tx.insertar('movimientos', movimiento);

    return {
      producto: productoActualizado,
      movimiento,
      alerta: calculo.nivelAlerta
    };
  });
}
