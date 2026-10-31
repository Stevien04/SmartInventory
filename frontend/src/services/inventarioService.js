import { request } from './api.js';

export const inventarioService = {
  // Productos
  getProductos: () => request('/productos'),
  getProducto: (id) => request(`/productos/${id}`),
  crearProducto: (producto) => request('/productos', { method: 'POST', body: JSON.stringify(producto) }),
  actualizarProducto: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  desactivarProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),

  // Categorías y Proveedores
  getCategorias: () => request('/categorias'),
  crearCategoria: (cat) => request('/categorias', { method: 'POST', body: JSON.stringify(cat) }),
  getProveedores: () => request('/proveedores'),
  crearProveedor: (prov) => request('/proveedores', { method: 'POST', body: JSON.stringify(prov) }),

  // Movimientos
  getMovimientos: (productoId = '') => request(`/movimientos${productoId ? `?productoId=${productoId}` : ''}`),
  registrarMovimiento: (movimiento) => request('/movimientos', { method: 'POST', body: JSON.stringify(movimiento) }),

  // Dashboard & Alertas
  getDashboardResumen: () => request('/dashboard/resumen'),
  getAlertas: () => request('/alertas'),
  getReporteInventario: () => request('/reportes/inventario')
};
