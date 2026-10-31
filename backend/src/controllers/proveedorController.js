import Proveedor from '../models/Proveedor.js';
import { isMongoActive } from '../config/mongodb.js';

let fallbackProveedores = [
  { id: 'PROV-001', nombre: 'TechSupply Global S.A.', ruc: '20549812341', contacto: 'ventas@techsupply.com', telefono: '+1 800-555-0199', estado: 'ACTIVO' }
];

export async function listarProveedores(req, res, next) {
  try {
    if (isMongoActive()) {
      const provs = await Proveedor.find({ estado: 'ACTIVO' }).lean();
      return res.json(provs);
    }
    return res.json(fallbackProveedores.filter((p) => p.estado === 'ACTIVO'));
  } catch (error) {
    next(error);
  }
}

export async function crearProveedor(req, res, next) {
  try {
    const { nombre, ruc, contacto, telefono } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

    const id = `PROV-${Date.now()}`;
    const item = { id, nombre, ruc: ruc || '', contacto: contacto || '', telefono: telefono || '', estado: 'ACTIVO' };

    if (isMongoActive()) {
      const doc = new Proveedor(item);
      await doc.save();
      return res.status(201).json(doc);
    }

    fallbackProveedores.push(item);
    return res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}
