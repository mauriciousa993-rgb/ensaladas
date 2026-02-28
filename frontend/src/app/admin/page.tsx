'use client';

import { useState, useEffect } from 'react';

interface Order {
  _id: string;
  numeroOrden: string;
  cliente: {
    nombre: string;
    celular: string;
  };
  tipoEntrega: string;
  direccion?: {
    calle: string;
    numero: string;
    barrio?: string;
    ciudad: string;
  };
  ensaldas: Array<{
    nombreSalad: string;
    ingredientesRemovidos: string[];
    proteinaExtra: string | null;
    precioTotal: number;
  }>;
  total: number;
  metodoPago: string;
  estadoPago: string;
  estadoOrden: string;
  fechaCreacion: string;
}

interface Stats {
  totalOrdenes: number;
  totalRecaudado: number;
  totalPendiente: number;
}

// Estados posibles para el workflow
const ESTADOS_ORDEN = [
  { valor: 'recibida', label: 'Recibido', color: 'bg-blue-100 text-blue-800' },
  { valor: 'preparando', label: 'En Preparación', color: 'bg-yellow-100 text-yellow-800' },
  { valor: 'lista', label: 'Lista', color: 'bg-orange-100 text-orange-800' },
  { valor: 'en_camino', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  { valor: 'entregada', label: 'Entregado', color: 'bg-green-100 text-green-800' },
];

export default function AdminDashboard() {
  const [ordenes, setOrdenes] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrdenes: 0, totalRecaudado: 0, totalPendiente: 0 });
  const [loading, setLoading] = useState(true);
  const [filtroHoy, setFiltroHoy] = useState(false);

  // Cargar órdenes
  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const url = filtroHoy 
        ? '/api/orders?fecha=hoy' 
        : '/api/orders';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setOrdenes(result.data.ordenes);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, [filtroHoy]);

  // Actualizar estado de orden
  const actualizarEstado = async (ordenId: string, nuevoEstado: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId, nuevoEstado }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Actualizar el estado local
        setOrdenes(ordenes.map(o => 
          o._id === ordenId ? { ...o, estadoOrden: nuevoEstado } : o
        ));
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  // Obtener siguiente estado
  const getSiguienteEstado = (estadoActual: string): string | null => {
    const indiceActual = ESTADOS_ORDEN.findIndex(e => e.valor === estadoActual);
    if (indiceActual < ESTADOS_ORDEN.length - 1) {
      return ESTADOS_ORDEN[indiceActual + 1].valor;
    }
    return null;
  };

  // Obtener clase de color para estado
  const getColorEstado = (estado: string) => {
    const estadoObj = ESTADOS_ORDEN.find(e => e.valor === estado);
    return estadoObj?.color || 'bg-gray-100 text-gray-800';
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📊 Panel de Administración
          </h1>
          <button
            onClick={cargarOrdenes}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total de Órdenes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalOrdenes}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Recaudado (PSE)</p>
                <p className="text-3xl font-bold text-green-600">${stats.totalRecaudado.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pendiente (Efectivo)</p>
                <p className="text-3xl font-bold text-orange-600">${stats.totalPendiente.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filtroHoy}
              onChange={(e) => setFiltroHoy(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <span className="font-medium text-gray-700">Mostrar solo ventas de hoy</span>
          </label>
        </div>

        {/* Tabla de órdenes */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando órdenes...</p>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">No hay órdenes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordenes.map((orden) => (
                    <tr key={orden._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">#{orden.numeroOrden}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{orden.cliente.nombre}</div>
                        <div className="text-sm text-gray-500">{orden.cliente.celular}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {orden.tipoEntrega === 'domicilio' ? '📍 Domicilio' : '🏪 Tienda'}
                        </div>
                        {orden.direccion && (
                          <div className="text-xs text-gray-500">
                            {orden.direccion.calle} #{orden.direccion.numero}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {orden.ensaldas.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{item.nombreSalad}</span>
                            {item.proteinaExtra && (
                              <span className="text-green-600"> +{item.proteinaExtra}</span>
                            )}
                            {item.ingredientesRemovidos.length > 0 && (
                              <div className="text-xs text-red-500">
                                Sin: {item.ingredientesRemovidos.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          ${orden.total.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          orden.metodoPago === 'PSE' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {orden.metodoPago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColorEstado(orden.estadoOrden)}`}>
                          {ESTADOS_ORDEN.find(e => e.valor === orden.estadoOrden)?.label || orden.estadoOrden}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(orden.fechaCreacion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSiguienteEstado(orden.estadoOrden) && (
                          <button
                            onClick={() => actualizarEstado(orden._id, getSiguienteEstado(orden.estadoOrden)!)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Avanzar →
                          </button>
                        )}
                        {!getSiguienteEstado(orden.estadoOrden) && (
                          <span className="text-gray-400 text-sm">✓ Completado</span>
                        )}
                      </td>
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
