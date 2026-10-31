import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ [MongoDB] MONGODB_URI no configurada. Operando en modo adaptativo local.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`✅ [MongoDB] Conectado exitosamente a la base de datos: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ [MongoDB] No se pudo conectar a MongoDB (${error.message}). Continuando en modo adaptativo.`);
    isConnected = false;
    return null;
  }
}

export function isMongoActive() {
  return isConnected;
}
