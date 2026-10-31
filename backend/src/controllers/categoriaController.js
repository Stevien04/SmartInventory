import Categoria from '../models/Categoria.js';
import { isMongoActive } from '../config/mongodb.js';

let fallbackCategorias = [
  { id: 'CAT-001', nombre: 'Periféricos y Accesorios', descripcion: 'Teclados, ratones, auriculares', estado: 'ACTIVO' },
  { id: 'CAT-002', nombre: 'Almacenamiento y Redes', descripcion: 'Discos duros, memorias SSD, switches', estado: 'ACTIVO' }
];

export async function listarCategorias(req, res, next) {
  try {
    if (isMongoActive()) {
      const cats = await Categoria.find({ estado: 'ACTIVO' }).lean();
      return res.json(cats);
    }
    return res.json(fallbackCategorias.filter((c) => c.estado === 'ACTIVO'));
  } catch (error) {
    next(error);
  }
}

export async function crearCategoria(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

    const id = `CAT-${Date.now()}`;
    const item = { id, nombre, descripcion: descripcion || '', estado: 'ACTIVO' };

    if (isMongoActive()) {
      const doc = new Categoria(item);
      await doc.save();
      return res.status(201).json(doc);
    }

    fallbackCategorias.push(item);
    return res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}
