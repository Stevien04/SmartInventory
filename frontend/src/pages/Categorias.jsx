import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import { Layers, Plus, RefreshCw } from 'lucide-react';

export default function Categorias({ userRole }) {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.getCategorias();
      setCategorias(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre) return;
    try {
      await inventarioService.crearCategoria({ nombre, descripcion });
      setNombre('');
      setDescripcion('');
      cargar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categorías de Productos</h1>
        <p className="text-sm text-slate-500">
          Colección `categorias` en MongoDB Atlas. Clasificación jerárquica de inventario.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userRole === 'ADMINISTRADOR' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Nueva Categoría</span>
            </h2>
            <form onSubmit={handleCrear} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Redes y Conectividad"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                <textarea
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles de la categoría"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm"
              >
                Crear Categoría
              </button>
            </form>
          </div>
        )}

        <div className={userRole === 'ADMINISTRADOR' ? 'md:col-span-2' : 'md:col-span-3'}>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center justify-between">
              <span>Categorías Registradas</span>
              <button onClick={cargar} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </h2>

            {loading ? (
              <p className="text-sm text-slate-400 py-4">Cargando categorías...</p>
            ) : categorias.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No hay categorías registradas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categorias.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm">{c.nombre}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.descripcion || 'Sin descripción'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
