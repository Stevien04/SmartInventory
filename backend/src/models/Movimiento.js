import mongoose from 'mongoose';

const movimientoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  operacionId: { type: String, required: true, index: true },
  productoId: { type: String, required: true, index: true },
  tipo: { type: String, enum: ['ENTRADA', 'SALIDA', 'AJUSTE'], required: true },
  cantidad: { type: Number, required: true, min: 1 },
  stockAnterior: { type: Number, required: true },
  stockPosterior: { type: Number, required: true },
  motivo: { type: String, default: '' },
  usuarioId: { type: String, default: 'SISTEMA' },
  creadoEn: { type: Date, default: Date.now }
});

export default mongoose.models.Movimiento || mongoose.model('Movimiento', movimientoSchema);
