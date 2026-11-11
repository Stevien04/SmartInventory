import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  ArrowLeftRight,
  FileBarChart,
  Users
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, userRole }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'categorias', label: 'Categorías', icon: Layers },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
    { id: 'reportes', label: 'Reportes', icon: FileBarChart }
  ];

  if (userRole === 'ADMINISTRADOR') {
    menuItems.push({ id: 'usuarios', label: 'Usuarios', icon: Users });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
      <nav className="space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Módulos de Gestión
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">Entorno en Producción</p>
        <p>MongoDB · Redis · Neo4j</p>
        <p>CI/CD: GitHub Actions</p>
        <p>Hosting: Render PaaS</p>
      </div>
    </aside>
  );
}
