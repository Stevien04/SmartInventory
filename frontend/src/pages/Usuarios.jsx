import React from 'react';
import { Users, ShieldCheck } from 'lucide-react';

export default function Usuarios() {
  const usuarios = [
    { id: 'USR-ADMIN-001', nombre: 'Administrador Principal', email: 'admin@smartinventory.com', rol: 'ADMINISTRADOR', estado: 'ACTIVO' },
    { id: 'USR-ALM-002', nombre: 'Carlos Almacenero', email: 'almacen@smartinventory.com', rol: 'ALMACENERO', estado: 'ACTIVO' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
        <p className="text-sm text-slate-500">
          Control de acceso basado en roles (RBAC). Colección `usuarios` en Couchbase Capella.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{u.nombre}</span>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {u.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
