import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import DashboardCard from '../components/DashboardCard';
import StockAlert from '../components/StockAlert';
import { Package, AlertCircle, XCircle, ArrowLeftRight, TrendingUp } from 'lucide-react';

export default function Dashboard({ setCurrentPage }) {
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [res, alt] = await Promise.all([
          inventarioService.getDashboardResumen(),
          inventarioService.getAlertas()
        ]);
        setResumen(res);
        setAlertas(alt);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Consultando datos en Couchbase Capella...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard General</h1>
          <p className="text-sm text-slate-500">
            Monitoreo en tiempo real de existencias y alertas de inventario
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage('movimientos')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Productos Activos"
          value={resumen?.totalProductosActivos || 0}
          icon={Package}
          colorClass="bg-blue-50 text-blue-600"
          subtitle="En catálogo Couchbase"
        />
        <DashboardCard
          title="Unidades en Stock"
          value={resumen?.unidadesTotales || 0}
          icon={TrendingUp}
          colorClass="bg-emerald-50 text-emerald-600"
          subtitle="Total inventariado"
        />
        <DashboardCard
          title="Productos Stock Bajo"
          value={resumen?.productosStockBajo || 0}
          icon={AlertCircle}
          colorClass="bg-amber-50 text-amber-600"
          subtitle="Por debajo del mínimo"
        />
        <DashboardCard
          title="Productos Agotados"
          value={resumen?.productosAgotados || 0}
          icon={XCircle}
          colorClass="bg-red-50 text-red-600"
          subtitle="Existencias en cero"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Críticas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center justify-between">
            <span>Alertas de Reposición Inmediata</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              {alertas.length} críticas
            </span>
          </h2>

          {alertas.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No hay alertas críticas registradas.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {alertas.map((a) => (
                <div key={a.id || a.codigo} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{a.nombre}</p>
                    <p className="text-xs text-slate-400 font-mono">Código: {a.codigo}</p>
                  </div>
                  <div>
                    <StockAlert
                      tipo={a.tipoAlerta}
                      stockActual={a.stockActual}
                      stockMinimo={a.stockMinimo}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Movimientos Recientes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            Últimos Movimientos Registrados
          </h2>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {resumen?.movimientosRecientes?.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                No hay movimientos recientes.
              </p>
            ) : (
              resumen?.movimientosRecientes?.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        m.tipo === 'ENTRADA'
                          ? 'bg-emerald-100 text-emerald-700'
                          : m.tipo === 'SALIDA'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.tipo}
                    </span>
                    <span className="text-slate-700">{m.motivo || 'Movimiento'}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">
                    {m.tipo === 'SALIDA' ? `-${m.cantidad}` : `+${m.cantidad}`} uds
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
