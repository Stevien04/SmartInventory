import * as repo from '../db/repositorio.js';

export async function listarCategorias(req, res, next) {
  try {
    const categorias = await repo.listar('categorias', {
      filtro: { estado: 'ACTIVO' },
      orden: { campo: 'nombre' }
    });
    return res.json(categorias);
  } catch (error) {
    next(error);
  }
}

export async function crearCategoria(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

    const categoria = await repo.insertar('categorias', {
      id: `CAT-${Date.now()}`,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      estado: 'ACTIVO'
    });
    return res.status(201).json(categoria);
  } catch (error) {
    next(error);
  }
}
