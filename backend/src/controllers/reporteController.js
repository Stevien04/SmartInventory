import Producto from '../models/Producto.js';
import Movimiento from '../models/Movimiento.js';
import { isMongoActive } from '../config/mongodb.js';
import { getCache, setCache } from '../config/redis.js';
import { productosStockBajoGauge, productosAgotadosGauge } from '../config/prometheus.js';

export async function dashboardResumen(req, res, next) {
  try {
    const CACHE_KEY = 'cache:dashboard_resumen';

    // 1. Intentar servir desde la caché en memoria de Redis
    const cachedData = await getCache(CACHE_KEY);
    if (cachedData) {
      return res.json({ ...cachedData, _source: 'Redis In-Memory Cache' });
    }

    if (isMongoActive()) {
      // 2. Consultar MongoDB si no está en Redis
      const [totalActivos, productos, ultimosMovimientos] = await Promise.all([
        Producto.countDocuments({ estado: 'ACTIVO' }),
        Producto.find({ estado: 'ACTIVO' }).lean(),
        Movimiento.find().sort({ creadoEn: -1 }).limit(5).lean()
      ]);

      let unidadesTotales = 0;
      let productosAgotados = 0;
      let productosStockBajo = 0;

      productos.forEach((p) => {
        unidadesTotales += p.stockActual || 0;
        if (p.stockActual === 0) {
          productosAgotados++;
        } else if (p.stockActual <= p.stockMinimo) {
          productosStockBajo++;
        }
      });

      // 3. Actualizar métricas observables en Prometheus
      productosStockBajoGauge.set(productosStockBajo);
      productosAgotadosGauge.set(productosAgotados);

      const resumen = {
        totalProductosActivos: totalActivos,
        unidadesTotales,
        productosAgotados,
        productosStockBajo,
        movimientosRecientes: ultimosMovimientos,
        _source: 'MongoDB Atlas'
      };

      // 4. Almacenar en Redis con expiración de 60 segundos
      await setCache(CACHE_KEY, resumen, 60);

      return res.json(resumen);
    }

    // Modo local adaptativo
    const localResumen = {
      totalProductosActivos: 18,
      unidadesTotales: 342,
      productosAgotados: 1,
      productosStockBajo: 2,
      movimientosRecientes: [
        { id: 'MOV-101', tipo: 'ENTRADA', cantidad: 10, motivo: 'Recepción proveedor', creadoEn: new Date() },
        { id: 'MOV-102', tipo: 'SALIDA', cantidad: 2, motivo: 'Venta orden 492', creadoEn: new Date() }
      ],
      _source: 'Adaptativo'
    };
    await setCache(CACHE_KEY, localResumen, 60);
    return res.json(localResumen);
  } catch (error) {
    next(error);
  }
}

export async function listarAlertas(req, res, next) {
  try {
    if (isMongoActive()) {
      const productos = await Producto.find({
        estado: 'ACTIVO',
        $expr: { $lte: ['$stockActual', '$stockMinimo'] }
      }).lean();

      const alertas = productos.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        stockActual: p.stockActual,
        stockMinimo: p.stockMinimo,
        tipoAlerta: p.stockActual === 0 ? 'AGOTADO' : 'STOCK_BAJO'
      }));

      return res.json(alertas);
    }

    return res.json([
      { id: 'PROD-002', codigo: 'SKU-SSD-002', nombre: 'Disco Solido NVMe 1TB', stockActual: 3, stockMinimo: 5, tipoAlerta: 'STOCK_BAJO' },
      { id: 'PROD-003', codigo: 'SKU-MOU-003', nombre: 'Mouse Inalámbrico Ergonómico', stockActual: 0, stockMinimo: 10, tipoAlerta: 'AGOTADO' }
    ]);
  } catch (error) {
    next(error);
  }
}

export async function reporteInventario(req, res, next) {
  try {
    if (isMongoActive()) {
      const productos = await Producto.find({ estado: 'ACTIVO' }).lean();
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
    }

    return res.json([
      { id: 'PROD-001', codigo: 'SKU-KB-001', nombre: 'Teclado Mecánico RGB Pro', stockActual: 14, precioCompra: 45, valorInventarioCompra: 630 }
    ]);
  } catch (error) {
    next(error);
  }
}
