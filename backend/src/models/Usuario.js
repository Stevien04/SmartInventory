import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  rol: { type: String, enum: ['ADMINISTRADOR', 'ALMACENERO'], default: 'ALMACENERO' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' }
}, { timestamps: true });

export default mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);
