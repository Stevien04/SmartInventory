import React, { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import { ArrowLeftRight, CheckCircle2, AlertOctagon, PlusCircle } from 'lucide-react';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario de movimiento
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [movs, prods] = await Promise.all([
        inventarioService.getMovimientos(),
        inventarioService.getProductos()
      ]);
      setMovimientos(movs);
      setProductos(prods);
      if (prods.length > 0 && !productoId) {
        setProductoId(prods[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);

    try {
      const operacionId = `OP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const res = await inventarioService.registrarMovimiento({
        productoId,
        tipo,
        cantidad: Number(cantidad),
        motivo,
        operacionId
      });

      setMensaje({
        tipo: 'exito',
        texto: `¡Movimiento ${tipo} registrado con éxito! Nuevo stock: ${res.producto?.stockActual ?? 'actualizado'}.`
      });

      setCantidad('');
      setMotivo('');
      cargarDatos();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.message || 'Error al procesar el movimiento'
      });
    } finally {
      setEnviando(false);
    }
  };

  const productoSeleccionado = productos.find((p) => p.id === productoId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Movimientos de Inventario</h1>
        <p className="text-sm text-slate-500">
          Transacciones atómicas en Couchbase Capella. Bloqueo estricto contra existencias negativas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Registro */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <span>Registrar Entrada / Salida</span>
          </h2>

          {mensaje && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs flex items-start space-x-2 border ${
                mensaje.tipo === 'exito'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {mensaje.tipo === 'exito' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertOctagon className="w-4 h-4 flex-shrink-0 text-red-600" />
              )}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={handleRegistrar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Seleccionar Producto
              </label>
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                required
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nombre} (Stock actual: {p.stockActual})
                  </option>
                ))}
              </select>
            </div>

            {productoSeleccionado && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Stock disponible:</strong>{' '}
                  <span className="font-bold text-slate-900">{productoSeleccionado.stockActual}</span> uds
                </p>
                <p>
                  <strong>Umbral mínimo:</strong> {productoSeleccionado.stockMinimo} uds
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipo de Operación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('ENTRADA')}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    tipo === 'ENTRADA'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  + ENTRADA
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('SALIDA')}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    tipo === 'SALIDA'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  - SALIDA
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cantidad a procesar
              </label>
              <input
                type="number"
                min="1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej. 5"
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Motivo / Justificación
              </label>
              <input
                type="text"
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Recepción proveedor / Venta orden #492"
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {enviando ? 'Ejecutando Transacción...' : 'Confirmar Transacción'}
            </button>
          </form>
        </div>

        {/* Historial de Movimientos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Ledger Histórico de Movimientos
          </h2>

          {loading ? (
            <div className="text-sm text-slate-500 py-6 text-center">Cargando movimientos...</div>
          ) : movimientos.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">
              No hay movimientos registrados en la colección `movimientos`.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Operación</th>
                    <th className="px-3 py-2.5">Tipo</th>
                    <th className="px-3 py-2.5 text-center">Cantidad</th>
                    <th className="px-3 py-2.5 text-center">Balance Stock</th>
                    <th className="px-3 py-2.5">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 text-slate-500 font-mono">
                        {new Date(m.creadoEn || Date.now()).toLocaleDateString()}{' '}
                        {new Date(m.creadoEn || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {m.operacionId || m.id}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            m.tipo === 'ENTRADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold font-mono">
                        {m.tipo === 'SALIDA' ? `-${m.cantidad}` : `+${m.cantidad}`}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                        {m.stockAnterior ?? '-'} ➔{' '}
                        <strong className="text-slate-900">{m.stockPosterior ?? '-'}</strong>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{m.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
