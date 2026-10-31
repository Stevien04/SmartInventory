import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectMongoDB } from '../src/config/mongodb.js';
import Usuario from '../src/models/Usuario.js';
import Categoria from '../src/models/Categoria.js';
import Proveedor from '../src/models/Proveedor.js';
import Producto from '../src/models/Producto.js';
import Movimiento from '../src/models/Movimiento.js';

dotenv.config();

async function poblarDatosIniciales() {
  console.log('🌱 Conectando a MongoDB Atlas para poblar datos iniciales...');
  const conn = await connectMongoDB();
  if (!conn) {
    console.error('❌ No se pudo conectar a MongoDB Atlas. Verifica MONGODB_URI.');
    process.exit(1);
  }

  // 1. Sembrar Usuarios
  const adminEmail = 'admin@smartinventory.com';
  let admin = await Usuario.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin2026*!', 10);
    admin = await Usuario.create({
      id: 'USR-ADMIN-001',
      nombre: 'Administrador SmartInventory',
      email: adminEmail,
      passwordHash,
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO'
    });
    console.log('✅ Usuario Administrador creado: admin@smartinventory.com / Admin2026*!');
  }

  // 2. Sembrar Categorías
  const catsData = [
    { id: 'CAT-001', nombre: 'Periféricos y Accesorios', descripcion: 'Teclados, ratones, lectores de barras y cables' },
    { id: 'CAT-002', nombre: 'Almacenamiento y Redes', descripcion: 'Discos SSD NVMe, routers industriales y switches' },
    { id: 'CAT-003', nombre: 'Equipos de Almacén', descripcion: 'Terminales portátiles, básculas y lectores láser' }
  ];

  for (const c of catsData) {
    await Categoria.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true });
  }
  console.log('✅ Categorías sembradas exitosamente en MongoDB');

  // 3. Sembrar Proveedores
  const provsData = [
    { id: 'PROV-001', nombre: 'TechSupply Global S.A.', ruc: '20549812341', contacto: 'ventas@techsupply.com', telefono: '+1 800-555-0199' },
    { id: 'PROV-002', nombre: 'Logística & Hardware Pro', ruc: '20984712034', contacto: 'contacto@logihardware.com', telefono: '+1 800-555-0244' }
  ];

  for (const p of provsData) {
    await Proveedor.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
  }
  console.log('✅ Proveedores sembrados exitosamente en MongoDB');

  // 4. Sembrar Catálogo de Productos
  const prodsData = [
    {
      id: 'PROD-001',
      codigo: 'SKU-KB-RGB',
      nombre: 'Teclado Mecánico RGB Industrial',
      descripcion: 'Switches mecánicos reforzados para terminal de inventarios',
      categoriaId: 'CAT-001',
      proveedorId: 'PROV-001',
      precioCompra: 45.0,
      precioVenta: 79.9,
      stockActual: 15,
      stockMinimo: 5,
      unidadMedida: 'unidad',
      estado: 'ACTIVO'
    },
    {
      id: 'PROD-002',
      codigo: 'SKU-NVME-1TB',
      nombre: 'Disco Sólido NVMe 1TB PCIe 4.0',
      descripcion: 'Almacenamiento de alta velocidad para servidores locales',
      categoriaId: 'CAT-002',
      proveedorId: 'PROV-001',
      precioCompra: 60.0,
      precioVenta: 95.0,
      stockActual: 3,
      stockMinimo: 6,
      unidadMedida: 'unidad',
      estado: 'ACTIVO'
    },
    {
      id: 'PROD-003',
      codigo: 'SKU-BAR-2D',
      nombre: 'Lector Inalámbrico de Código de Barras 2D',
      descripcion: 'Lector Bluetooth y 2.4G para picking rápido',
      categoriaId: 'CAT-003',
      proveedorId: 'PROV-002',
      precioCompra: 35.0,
      precioVenta: 62.0,
      stockActual: 0,
      stockMinimo: 4,
      unidadMedida: 'unidad',
      estado: 'ACTIVO'
    }
  ];

  for (const pr of prodsData) {
    await Producto.findOneAndUpdate({ id: pr.id }, pr, { upsert: true, new: true });
  }
  console.log('✅ Catálogo de productos sembrado en MongoDB Atlas');

  // 5. Sembrar Movimiento Inicial
  const mov = await Movimiento.findOneAndUpdate(
    { id: 'MOV-INIT-001' },
    {
      id: 'MOV-INIT-001',
      operacionId: 'OP-INICIO-001',
      productoId: 'PROD-001',
      tipo: 'ENTRADA',
      cantidad: 15,
      stockAnterior: 0,
      stockPosterior: 15,
      motivo: 'Inventario inicial de apertura de almacén',
      usuarioId: admin.id,
      creadoEn: new Date()
    },
    { upsert: true, new: true }
  );
  console.log('✅ Movimiento inicial de inventario registrado');

  console.log('🎉 ¡Base de datos MongoDB Atlas completamente inicializada!');
  process.exit(0);
}

poblarDatosIniciales().catch((err) => {
  console.error('❌ Error en script de inicialización:', err);
  process.exit(1);
});
