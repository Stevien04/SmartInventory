import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

export default function Reportes() {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await inventarioService.getReporteInventario();
        setReporte(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const exportarCSV = () => {
    if (reporte.length === 0) return;
    const cabeceras = ['Codigo', 'Producto', 'PrecioCompra', 'PrecioVenta', 'StockActual', 'StockMinimo', 'ValorCompra'];
    const filas = reporte.map((r) => [
      r.codigo,
      `"${r.nombre.replace(/"/g, '""')}"`,
      r.precioCompra,
      r.precioVenta,
      r.stockActual,
      r.stockMinimo,
      r.valorInventarioCompra || (r.stockActual * r.precioCompra)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [cabeceras.join(','), ...filas.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartinventory_reporte_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const valorTotalInventario = reporte.reduce((sum, r) => sum + (r.valorInventarioCompra || (r.stockActual * r.precioCompra) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes de Existencias y Valorización</h1>
          <p className="text-sm text-slate-500">
            Consultas N1QL calculadas en Couchbase Capella. Exportación a CSV disponible.
          </p>
        </div>

        <button
          onClick={exportarCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Total del Inventario (al costo)</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
            ${valorTotalInventario.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
          <FileText className="w-8 h-8" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500 text-sm">Generando reporte analítico...</p>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-right">Valorización Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reporte.map((r) => {
                const totalItem = r.valorInventarioCompra || (r.stockActual * r.precioCompra) || 0;
                return (
                  <tr key={r.id || r.codigo} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{r.codigo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.nombre}</td>
                    <td className="px-4 py-3 text-right font-mono">${Number(r.precioCompra || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">${Number(r.precioVenta || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{r.stockActual}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ${Number(totalItem).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
