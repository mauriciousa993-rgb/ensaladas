'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { buildApiUrl } from '@/lib/api';

interface Salad {
  _id: string;
  nombre: string;
  precioBase: number;
  ingredientesDefault: string[];
  imagenUrl: string;
  descripcion?: string;
  estaActiva: boolean;
}

interface SaladManagerProps {
  onEdit: (salad: Salad) => void;
  onCreate: () => void;
  refreshTrigger: number;
}

export default function SaladManager({ onEdit, onCreate, refreshTrigger }: SaladManagerProps) {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const loadSalads = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/salads?todas=true'));
      const payload = await response.json();
      const data = Array.isArray(payload) ? payload : payload?.data;

      if (response.ok && Array.isArray(data)) {
        setSalads(data);
      } else {
        console.error('Respuesta inesperada al cargar ensaladas:', payload);
      }
    } catch (error) {
      console.error('Error cargando ensaladas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalads();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta ensalada?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/salads?id=${id}`), {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadSalads();
      } else {
        alert('Error al eliminar: ' + result.error);
      }
    } catch (error) {
      console.error('Error eliminando ensalada:', error);
      alert('Error al eliminar la ensalada');
    }
  };

  const filteredSalads = salads.filter(salad => {
    const matchesSearch = salad.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive || salad.estaActiva;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar ensaladas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Mostrar inactivas</span>
          </label>
          
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nueva Ensalada
          </button>
        </div>
      </div>

      {/* Grid de ensaladas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredSalads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500">No se encontraron ensaladas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalads.map((salad) => (
            <div
              key={salad._id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
                !salad.estaActiva ? 'opacity-60' : ''
              }`}
            >
              {/* Imagen */}
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={salad.imagenUrl}
                  alt={salad.nombre}
                  fill
                  className="object-cover"
                />
                {!salad.estaActiva && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">INACTIVA</span>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{salad.nombre}</h3>
                  <span className="text-xl font-bold text-green-600">
                    ${salad.precioBase.toLocaleString('es-CO')}
                  </span>
                </div>
                
                {salad.descripcion && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{salad.descripcion}</p>
                )}
                
                {/* Ingredientes */}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Ingredientes:</p>
                  <div className="flex flex-wrap gap-1">
                    {salad.ingredientesDefault.slice(0, 5).map((ing, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        {ing}
                      </span>
                    ))}
                    {salad.ingredientesDefault.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{salad.ingredientesDefault.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(salad)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(salad._id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
