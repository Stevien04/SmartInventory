import React from 'react';
import StockAlert from './StockAlert';

export default function ProductTable({ productos, onDesactivar, isAdmin }) {
  if (!productos || productos.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No se encontraron productos registrados en MongoDB Atlas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3 text-right">P. Compra</th>
            <th className="px-4 py-3 text-right">P. Venta</th>
            <th className="px-4 py-3 text-center">Stock Actual</th>
            <th className="px-4 py-3 text-center">Mínimo</th>
            <th className="px-4 py-3 text-center">Estado Alerta</th>
            {isAdmin && <th className="px-4 py-3 text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {productos.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition">
              <td className="px-4 py-3 font-mono font-medium text-slate-900">{p.codigo}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-800">{p.nombre}</p>
                {p.descripcion && <p className="text-xs text-slate-400">{p.descripcion}</p>}
              </td>
              <td className="px-4 py-3 text-right font-mono">${Number(p.precioCompra || 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                ${Number(p.precioVenta || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-center font-bold text-slate-800">{p.stockActual}</td>
              <td className="px-4 py-3 text-center text-slate-500">{p.stockMinimo}</td>
              <td className="px-4 py-3 text-center">
                <StockAlert stockActual={p.stockActual} stockMinimo={p.stockMinimo} />
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-center">
                  {p.estado === 'ACTIVO' ? (
                    <button
                      onClick={() => onDesactivar(p.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Inactivo</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
