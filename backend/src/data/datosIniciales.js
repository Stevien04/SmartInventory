/**
 * Datos de ejemplo de SmartInventory.
 *
 * Se usan en dos lugares:
 * - scripts/seedCouchbase.js los carga en Couchbase Capella.
 * - src/db/memoria.js los usa cuando la API arranca sin Couchbase (desarrollo y pruebas).
 */
export const ADMIN_EMAIL = 'admin@smartinventory.com';
export const ADMIN_PASSWORD_DEMO = 'Admin2026*!';

export const categorias = [
  { id: 'CAT-001', nombre: 'Periféricos y Accesorios', descripcion: 'Teclados, ratones, lectores de barras y cables', estado: 'ACTIVO' },
  { id: 'CAT-002', nombre: 'Almacenamiento y Redes', descripcion: 'Discos SSD NVMe, routers industriales y switches', estado: 'ACTIVO' },
  { id: 'CAT-003', nombre: 'Equipos de Almacén', descripcion: 'Terminales portátiles, básculas y lectores láser', estado: 'ACTIVO' }
];

export const proveedores = [
  { id: 'PROV-001', nombre: 'TechSupply Global S.A.', ruc: '20549812341', contacto: 'ventas@techsupply.com', telefono: '+1 800-555-0199', estado: 'ACTIVO' },
  { id: 'PROV-002', nombre: 'Logística & Hardware Pro', ruc: '20984712034', contacto: 'contacto@logihardware.com', telefono: '+1 800-555-0244', estado: 'ACTIVO' }
];

export const productos = [
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

export const movimientos = [
  {
    id: 'MOV-INIT-001',
    operacionId: 'OP-INICIO-001',
    productoId: 'PROD-001',
    tipo: 'ENTRADA',
    cantidad: 15,
    stockAnterior: 0,
    stockPosterior: 15,
    motivo: 'Inventario inicial de apertura de almacén',
    usuarioId: 'USR-ADMIN-001',
    creadoEn: '2026-10-30T10:00:00.000Z'
  }
];

/** El hash se calcula al sembrar para no guardar uno fijo en el repositorio. */
export function usuarioAdmin(passwordHash) {
  return {
    id: 'USR-ADMIN-001',
    nombre: 'Administrador SmartInventory',
    email: ADMIN_EMAIL,
    passwordHash,
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO'
  };
}
