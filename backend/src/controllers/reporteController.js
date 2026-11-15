import * as repo from '../db/repositorio.js';
import { calcularNivelAlerta } from '../services/alertaService.js';

export async function dashboardResumen(req, res, next) {
  try {
    const [productos, movimientosRecientes] = await Promise.all([
      repo.listar('productos', { filtro: { estado: 'ACTIVO' } }),
      repo.listar('movimientos', { orden: { campo: 'creadoEn', direccion: 'DESC' }, limite: 5 })
    ]);

    let unidadesTotales = 0;
    let productosAgotados = 0;
    let productosStockBajo = 0;

    for (const p of productos) {
      unidadesTotales += p.stockActual || 0;
      const nivel = calcularNivelAlerta(p.stockActual, p.stockMinimo);
      if (nivel === 'AGOTADO') productosAgotados++;
      else if (nivel === 'STOCK_BAJO') productosStockBajo++;
    }

    return res.json({
      totalProductosActivos: productos.length,
      unidadesTotales,
      productosAgotados,
      productosStockBajo,
      movimientosRecientes,
      _source: repo.origenDatos()
    });
  } catch (error) {
    next(error);
  }
}

export async function listarAlertas(req, res, next) {
  try {
    const productos = await repo.listar('productos', { filtro: { estado: 'ACTIVO' }, orden: { campo: 'stockActual' } });

    const alertas = productos
      .map((p) => ({ p, nivel: calcularNivelAlerta(p.stockActual, p.stockMinimo) }))
      .filter(({ nivel }) => nivel !== 'NORMAL')
      .map(({ p, nivel }) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        stockActual: p.stockActual,
        stockMinimo: p.stockMinimo,
        tipoAlerta: nivel
      }));

    return res.json(alertas);
  } catch (error) {
    next(error);
  }
}

export async function reporteInventario(req, res, next) {
  try {
    const productos = await repo.listar('productos', { filtro: { estado: 'ACTIVO' }, orden: { campo: 'nombre' } });
    const reporte = productos.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precioCompra: p.precioCompra,
      precioVenta: p.precioVenta,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      valorInventarioCompra: p.stockActual * p.precioCompra,
      valorInventarioVenta: p.stockActual * p.precioVenta
    }));
    return res.json(reporte);
  } catch (error) {
    next(error);
  }
}
