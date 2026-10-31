import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' }
}, { timestamps: true });

export default mongoose.models.Categoria || mongoose.model('Categoria', categoriaSchema);
