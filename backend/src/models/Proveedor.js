import mongoose from 'mongoose';

const proveedorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  ruc: { type: String, default: '' },
  contacto: { type: String, default: '' },
  telefono: { type: String, default: '' },
  estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' }
}, { timestamps: true });

export default mongoose.models.Proveedor || mongoose.model('Proveedor', proveedorSchema);
