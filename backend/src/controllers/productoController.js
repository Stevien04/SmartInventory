import * as repo from '../db/repositorio.js';

export async function listarProductos(req, res, next) {
  try {
    const productos = await repo.listar('productos', { orden: { campo: 'nombre' } });
    return res.json(productos);
  } catch (error) {
    next(error);
  }
}

export async function obtenerProducto(req, res, next) {
  try {
    const producto = await repo.obtener('productos', req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(producto);
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

    const codigoNormalizado = codigo.toUpperCase().trim();
    const repetido = await repo.buscarUno('productos', { codigo: codigoNormalizado });
    if (repetido) {
      return res.status(409).json({ error: `Ya existe un producto con el código ${codigoNormalizado}` });
    }

    const producto = await repo.insertar('productos', {
      id: `PROD-${Date.now()}`,
      codigo: codigoNormalizado,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      categoriaId: categoriaId || null,
      proveedorId: proveedorId || null,
      precioCompra: Number(precioCompra),
      precioVenta: Number(precioVenta),
      // El stock solo cambia mediante movimientos (entradas, salidas y ajustes).
      stockActual: 0,
      stockMinimo: Number(stockMinimo),
      unidadMedida: unidadMedida || 'unidad',
      estado: 'ACTIVO'
    });

    return res.status(201).json(producto);
  } catch (error) {
    next(error);
  }
}

export async function actualizarProducto(req, res, next) {
  try {
    const { nombre, descripcion, precioCompra, precioVenta, stockMinimo, estado, categoriaId, proveedorId, unidadMedida } = req.body;

    // stockActual no se acepta aquí: se modifica solo con un movimiento.
    const cambios = {};
    if (nombre) cambios.nombre = nombre.trim();
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (precioCompra !== undefined) cambios.precioCompra = Number(precioCompra);
    if (precioVenta !== undefined) cambios.precioVenta = Number(precioVenta);
    if (stockMinimo !== undefined) cambios.stockMinimo = Number(stockMinimo);
    if (estado === 'ACTIVO' || estado === 'INACTIVO') cambios.estado = estado;
    if (categoriaId) cambios.categoriaId = categoriaId;
    if (proveedorId) cambios.proveedorId = proveedorId;
    if (unidadMedida) cambios.unidadMedida = unidadMedida;

    const producto = await repo.actualizar('productos', req.params.id, cambios);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(producto);
  } catch (error) {
    next(error);
  }
}

export async function desactivarProducto(req, res, next) {
  try {
    const producto = await repo.actualizar('productos', req.params.id, { estado: 'INACTIVO' });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json({ message: 'Producto desactivado', producto });
  } catch (error) {
    next(error);
  }
}
