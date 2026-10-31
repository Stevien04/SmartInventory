import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  categoriaId: { type: String, default: null },
  proveedorId: { type: String, default: null },
  precioCompra: { type: Number, required: true, min: 0 },
  precioVenta: { type: Number, required: true, min: 0 },
  stockActual: { type: Number, required: true, default: 0, min: 0 },
  stockMinimo: { type: Number, required: true, default: 5, min: 0 },
  unidadMedida: { type: String, default: 'unidad' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' }
}, { timestamps: true });

export default mongoose.models.Producto || mongoose.model('Producto', productoSchema);
