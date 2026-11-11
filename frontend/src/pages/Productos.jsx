import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import ProductTable from '../components/ProductTable';
import { Plus, Search, RefreshCw, X } from 'lucide-react';

export default function Productos({ userRole }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario nuevo producto
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precioCompra: '',
    precioVenta: '',
    stockMinimo: 5,
    unidadMedida: 'unidad'
  });
  const [errorForm, setErrorForm] = useState('');

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.getProductos();
      setProductos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setErrorForm('');
    try {
      await inventarioService.crearProducto(form);
      setModalAbierto(false);
      setForm({
        codigo: '',
        nombre: '',
        descripcion: '',
        precioCompra: '',
        precioVenta: '',
        stockMinimo: 5,
        unidadMedida: 'unidad'
      });
      cargarProductos();
    } catch (err) {
      setErrorForm(err.message || 'Error al crear producto');
    }
  };

  const handleDesactivar = async (id) => {
    if (window.confirm('¿Seguro que deseas desactivar este producto?')) {
      try {
        await inventarioService.desactivarProducto(id);
        cargarProductos();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos</h1>
          <p className="text-sm text-slate-500">
            Documentos JSON persistidos en MongoDB Atlas (colección: productos)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={cargarProductos}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Refrescar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {userRole === 'ADMINISTRADOR' && (
            <button
              onClick={() => setModalAbierto(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto por código SKU o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Cargando productos desde MongoDB...</div>
      ) : (
        <ProductTable
          productos={productosFiltrados}
          onDesactivar={handleDesactivar}
          isAdmin={userRole === 'ADMINISTRADOR'}
        />
      )}

      {/* Modal Crear Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Registrar Nuevo Producto</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleCrear} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código SKU</label>
                  <input
                    type="text"
                    required
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="SKU-XXX"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                <textarea
                  rows="2"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalles técnicos o de presentación"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">P. Compra ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.precioCompra}
                    onChange={(e) => setForm({ ...form, precioCompra: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">P. Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.precioVenta}
                    onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                * Nota: El stock inicial se registra en 0 y se incrementa formalmente mediante un movimiento de Entrada.
              </p>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Guardar en MongoDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
