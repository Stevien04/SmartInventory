import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@smartinventory.com');
  const [password, setPassword] = useState('Admin2026*!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20 mb-3">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SmartInventory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión inteligente con Couchbase Capella NoSQL
          </p>
          <div className="mt-3 inline-block bg-slate-800 border border-slate-700/60 rounded-full px-3 py-0.5 text-xs text-cyan-400">
            Sin Redis • Sin MongoDB • Sin Neo4j
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/80 border border-red-800 text-red-200 text-sm p-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartinventory.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? 'Verificando con Couchbase...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>Credenciales de prueba cargadas por defecto.</p>
          <p className="mt-0.5 text-slate-400">Couchbase Capella Cloud + Render CI/CD</p>
        </div>
      </div>
    </div>
  );
}
