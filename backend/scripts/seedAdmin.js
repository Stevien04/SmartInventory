import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectMongoDB } from '../src/config/mongodb.js';
import Usuario from '../src/models/Usuario.js';

dotenv.config();

async function seed() {
  console.log('🌱 Inicializando usuario Administrador en MongoDB...');
  await connectMongoDB();

  const adminEmail = 'admin@smartinventory.com';
  const existing = await Usuario.findOne({ email: adminEmail });

  if (existing) {
    console.log('ℹ️ El usuario administrador ya existe en MongoDB.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('Admin2026*!', 10);
  const admin = new Usuario({
    id: 'USR-ADMIN-001',
    nombre: 'Administrador Principal',
    email: adminEmail,
    passwordHash: hashedPassword,
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO'
  });

  await admin.save();
  console.log('✅ Usuario Administrador sembrado exitosamente en MongoDB: admin@smartinventory.com');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
