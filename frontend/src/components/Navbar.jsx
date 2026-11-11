import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Database, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white font-bold flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span className="tracking-wide">SmartInventory</span>
        </div>
        <span className="text-xs bg-slate-800 text-cyan-400 px-2.5 py-1 rounded-full font-mono border border-cyan-800/40">
          NoSQL políglota
        </span>
      </div>

      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-2 text-sm text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-slate-100">{user?.nombre || user?.email}</span>
          <span className="text-xs bg-blue-950 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded">
            {user?.rol}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 text-xs bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
