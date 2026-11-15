import * as repo from '../db/repositorio.js';

export async function listarProveedores(req, res, next) {
  try {
    const proveedores = await repo.listar('proveedores', {
      filtro: { estado: 'ACTIVO' },
      orden: { campo: 'nombre' }
    });
    return res.json(proveedores);
  } catch (error) {
    next(error);
  }
}

export async function crearProveedor(req, res, next) {
  try {
    const { nombre, ruc, contacto, telefono } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

    const proveedor = await repo.insertar('proveedores', {
      id: `PROV-${Date.now()}`,
      nombre: nombre.trim(),
      ruc: ruc || '',
      contacto: contacto || '',
      telefono: telefono || '',
      estado: 'ACTIVO'
    });
    return res.status(201).json(proveedor);
  } catch (error) {
    next(error);
  }
}
