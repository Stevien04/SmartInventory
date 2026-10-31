import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';
import Proveedor from '../models/Proveedor.js';
import { isMongoActive } from '../config/mongodb.js';
import { delCache } from '../config/redis.js';
import { sincronizarGrafoSuministro } from '../config/neo4j.js';

let fallbackProductos = [
  {
    id: 'PROD-001',
    codigo: 'SKU-KB-001',
    nombre: 'Teclado Mecánico RGB Pro',
    descripcion: 'Switch Blue, USB-C',
    categoriaId: 'CAT-001',
    proveedorId: 'PROV-001',
    precioCompra: 45.0,
    precioVenta: 85.0,
    stockActual: 14,
    stockMinimo: 5,
    unidadMedida: 'unidad',
    estado: 'ACTIVO'
  },
  {
    id: 'PROD-002',
    codigo: 'SKU-SSD-002',
    nombre: 'Disco Solido NVMe 1TB',
    descripcion: 'Lectura 3500MB/s',
    categoriaId: 'CAT-002',
    proveedorId: 'PROV-001',
    precioCompra: 60.0,
    precioVenta: 99.0,
    stockActual: 3,
    stockMinimo: 5,
    unidadMedida: 'unidad',
    estado: 'ACTIVO'
  }
];

export async function listarProductos(req, res, next) {
  try {
    if (isMongoActive()) {
      const productos = await Producto.find().sort({ nombre: 1 }).lean();
      return res.json(productos);
    }
    return res.json(fallbackProductos);
  } catch (error) {
    next(error);
  }
}

export async function obtenerProducto(req, res, next) {
  try {
    const { id } = req.params;
    if (isMongoActive()) {
      const p = await Producto.findOne({ id }).lean();
      if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json(p);
    }
    const item = fallbackProductos.find((p) => p.id === id);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function crearProducto(req, res, next) {
  try {
    const { codigo, nombre, descripcion, categoriaId, proveedorId, precioCompra, precioVenta, stockMinimo, unidadMedida } = req.body;

    if (!codigo || !nombre || precioCompra === undefined || precioVenta === undefined || stockMinimo === undefined) {
      return res.status(400).json({ error: 'Campos requeridos incompletos' });
    }

    const id = `PROD-${Date.now()}`;
    const nuevo = {
      id,
      codigo: codigo.toUpperCase().trim(),
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      categoriaId: categoriaId || null,
      proveedorId: proveedorId || null,
      precioCompra: Number(precioCompra),
      precioVenta: Number(precioVenta),
      stockActual: 0,
      stockMinimo: Number(stockMinimo),
      unidadMedida: unidadMedida || 'unidad',
      estado: 'ACTIVO'
    };

    if (isMongoActive()) {
      const doc = new Producto(nuevo);
      await doc.save();

      // Invalidad caché en Redis
      await delCache('cache:dashboard_resumen');

      // Sincronizar nodo y relaciones en el Grafo Neo4j
      let provNombre = 'Proveedor General';
      let catNombre = 'General';
      if (proveedorId) {
        const prov = await Proveedor.findOne({ id: proveedorId }).lean();
        if (prov) provNombre = prov.nombre;
      }
      if (categoriaId) {
        const cat = await Categoria.findOne({ id: categoriaId }).lean();
        if (cat) catNombre = cat.nombre;
      }
      await sincronizarGrafoSuministro(id, nuevo.nombre, provNombre, catNombre);

      return res.status(201).json(doc);
    }

    fallbackProductos.push(nuevo);
    await delCache('cache:dashboard_resumen');
    return res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
}

export async function actualizarProducto(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precioCompra, precioVenta, stockMinimo, estado, categoriaId, proveedorId } = req.body;

    if (isMongoActive()) {
      const p = await Producto.findOne({ id });
      if (!p) return res.status(404).json({ error: 'Producto no encontrado' });

      if (nombre) p.nombre = nombre;
      if (descripcion !== undefined) p.descripcion = descripcion;
      if (precioCompra !== undefined) p.precioCompra = Number(precioCompra);
      if (precioVenta !== undefined) p.precioVenta = Number(precioVenta);
      if (stockMinimo !== undefined) p.stockMinimo = Number(stockMinimo);
      if (estado) p.estado = estado;
      if (categoriaId) p.categoriaId = categoriaId;
      if (proveedorId) p.proveedorId = proveedorId;

      await p.save();
      await delCache('cache:dashboard_resumen');

      return res.json(p);
    }

    const index = fallbackProductos.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

    fallbackProductos[index] = { ...fallbackProductos[index], ...req.body, stockActual: fallbackProductos[index].stockActual };
    await delCache('cache:dashboard_resumen');
    return res.json(fallbackProductos[index]);
  } catch (error) {
    next(error);
  }
}

export async function desactivarProducto(req, res, next) {
  try {
    const { id } = req.params;
    if (isMongoActive()) {
      const p = await Producto.findOneAndUpdate({ id }, { estado: 'INACTIVO' }, { new: true });
      await delCache('cache:dashboard_resumen');
      return res.json({ message: 'Producto desactivado', producto: p });
    }
    const item = fallbackProductos.find((p) => p.id === id);
    if (item) item.estado = 'INACTIVO';
    await delCache('cache:dashboard_resumen');
    return res.json({ message: 'Producto desactivado localmente', id });
  } catch (error) {
    next(error);
  }
}
