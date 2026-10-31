import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import { Truck, Plus, RefreshCw, Mail, Phone } from 'lucide-react';

export default function Proveedores({ userRole }) {
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({ nombre: '', ruc: '', contacto: '', telefono: '' });
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.getProveedores();
      setProveedores(data);
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
    try {
      await inventarioService.crearProveedor(form);
      setForm({ nombre: '', ruc: '', contacto: '', telefono: '' });
      cargar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
        <p className="text-sm text-slate-500">
          Colección `proveedores` en Couchbase Capella. Directorio de aliados de suministro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userRole === 'ADMINISTRADOR' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Nuevo Proveedor</span>
            </h2>
            <form onSubmit={handleCrear} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Distribuidora Tech S.A."
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">RUC / Identificación</label>
                <input
                  type="text"
                  value={form.ruc}
                  onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                  placeholder="Ej. 20491823901"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  value={form.contacto}
                  onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                  placeholder="ventas@proveedor.com"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+1 800-555-0199"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm"
              >
                Guardar Proveedor
              </button>
            </form>
          </div>
        )}

        <div className={userRole === 'ADMINISTRADOR' ? 'md:col-span-2' : 'md:col-span-3'}>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center justify-between">
              <span>Directorio de Proveedores</span>
              <button onClick={cargar} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className="w-4 h-4" />
              </button>
            </h2>

            {loading ? (
              <p className="text-sm text-slate-400 py-4">Cargando proveedores...</p>
            ) : proveedores.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No hay proveedores registrados.</p>
            ) : (
              <div className="space-y-3">
                {proveedores.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.nombre}</p>
                      {p.ruc && <p className="text-xs text-slate-500 font-mono">RUC: {p.ruc}</p>}
                    </div>
                    <div className="text-right text-xs text-slate-600 space-y-1">
                      {p.contacto && (
                        <p className="flex items-center space-x-1 justify-end">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.contacto}</span>
                        </p>
                      )}
                      {p.telefono && (
                        <p className="flex items-center space-x-1 justify-end">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.telefono}</span>
                        </p>
                      )}
                    </div>
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
