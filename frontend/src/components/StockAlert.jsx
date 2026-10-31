import React from 'react';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export default function StockAlert({ tipo, stockActual, stockMinimo, inline = false }) {
  if (tipo === 'AGOTADO' || stockActual === 0) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        <span>AGOTADO (0)</span>
      </span>
    );
  }

  if (tipo === 'STOCK_BAJO' || stockActual <= stockMinimo) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>STOCK BAJO ({stockActual}/{stockMinimo})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle className="w-3.5 h-3.5" />
      <span>NORMAL ({stockActual})</span>
    </span>
  );
}
