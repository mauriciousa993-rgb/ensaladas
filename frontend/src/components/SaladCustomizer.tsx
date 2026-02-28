'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useCartStore, CartItem } from '@/store/cartStore';

// Tipos para las props del componente
interface SaladCustomizerProps {
  salad: {
    _id: string;
    nombre: string;
    precioBase: number;
    ingredientesDefault: string[];
    imagenUrl: string;
    descripcion?: string;
  };
  onClose?: () => void;
}

// Precios de proteínas adicionales
const PROTEINAS = [
  { nombre: 'Pollo', precio: 5000 },
  { nombre: 'Atún', precio: 6000 },
  { nombre: 'Huevo', precio: 3500 },
];

export default function SaladCustomizer({ salad, onClose }: SaladCustomizerProps) {
  // Estado para los ingredientes removidos
  const [ingredientesRemovidos, setIngredientesRemovidos] = useState<string[]>([]);
  
  // Estado para la proteína extra seleccionada
  const [proteinaExtra, setProteinaExtra] = useState<string | null>(null);
  
  // Estado para observaciones
  const [observaciones, setObservaciones] = useState('');
  
  // Estado para cantidad
  const [cantidad, setCantidad] = useState(1);
  
  // Obtener funciones del store
  const agregarItem = useCartStore((state) => state.agregarItem);
  const items = useCartStore((state) => state.items);

  // Calcular el precio total
  const precioProteina = useMemo(() => {
    if (!proteinaExtra) return 0;
    const proteina = PROTEINAS.find((p) => p.nombre === proteinaExtra);
    return proteina?.precio || 0;
  }, [proteinaExtra]);

  const precioTotal = useMemo(() => {
    return salad.precioBase + precioProteina;
  }, [salad.precioBase, precioProteina]);

  // Toggle ingrediente removido
  const toggleIngrediente = (ingrediente: string) => {
    setIngredientesRemovidos((prev) =>
      prev.includes(ingrediente)
        ? prev.filter((i) => i !== ingrediente)
        : [...prev, ingrediente]
    );
  };

  // Manejar agregar al carrito
  const handleAgregarAlCarrito = () => {
    const item: Omit<CartItem, 'id' | 'cantidad'> = {
      saladId: salad._id,
      nombreSalad: salad.nombre,
      imagenUrl: salad.imagenUrl,
      precioBase: salad.precioBase,
      ingredientesRemovidos,
      proteinaExtra,
      precioProteinaExtra: precioProteina,
      precioTotal,
    };

    // Agregar la cantidad especificada
    for (let i = 0; i < cantidad; i++) {
      agregarItem(item);
    }

    // Resetear estado local
    setIngredientesRemovidos([]);
    setProteinaExtra(null);
    setObservaciones('');
    setCantidad(1);

    // Cerrar si hay función onClose
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-4xl w-full mx-4">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Imagen de la ensalada */}
        <div className="relative h-64 md:h-auto bg-gray-100">
          <Image
            src={salad.imagenUrl}
            alt={salad.nombre}
            fill
            className="object-cover"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Contenido de personalización */}
        <div className="p-6 overflow-y-auto max-h-[80vh] md:max-h-none">
          {/* Título y precio */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {salad.nombre}
            </h2>
            {salad.descripcion && (
              <p className="text-gray-500 text-sm mb-3">{salad.descripcion}</p>
            )}
            <p className="text-3xl font-bold text-green-600">
              ${salad.precioBase.toLocaleString('es-CO')}
            </p>
          </div>

          {/* Sección: Quitar ingredientes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              Quitar ingredientes
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Desmarca los ingredientes que NO quieres en tu ensalada
            </p>
            <div className="flex flex-wrap gap-2">
              {salad.ingredientesDefault.map((ingrediente) => (
                <label
                  key={ingrediente}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                    ${
                      ingredientesRemovidos.includes(ingrediente)
                        ? 'bg-red-50 border-2 border-red-200 text-red-600'
                        : 'bg-green-50 border-2 border-green-200 text-green-700 hover:border-green-400'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={!ingredientesRemovidos.includes(ingrediente)}
                    onChange={() => toggleIngrediente(ingrediente)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium capitalize">
                    {ingrediente}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sección: Agregar proteína */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Agregar proteína
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {PROTEINAS.map((proteina) => (
                <button
                  key={proteina.nombre}
                  onClick={() =>
                    setProteinaExtra(
                      proteinaExtra === proteina.nombre ? null : proteina.nombre
                    )
                  }
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                    ${
                      proteinaExtra === proteina.nombre
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300 text-gray-600'
                    }
                  `}
                >
                  <span className="text-2xl mb-1">
                    {proteina.nombre === 'Pollo' && '🍗'}
                    {proteina.nombre === 'Atún' && '🐟'}
                    {proteina.nombre === 'Huevo' && '🥚'}
                  </span>
                  <span className="text-sm font-medium">{proteina.nombre}</span>
                  <span className="text-xs text-gray-500">
                    +${proteina.precio.toLocaleString('es-CO')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sección: Cantidad */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Cantidad
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold text-gray-800 w-12 text-center">
                {cantidad}
              </span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-xl font-bold text-green-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Resumen del precio */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Base</span>
              <span className="font-medium">
                ${salad.precioBase.toLocaleString('es-CO')}
              </span>
            </div>
            {proteinaExtra && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{proteinaExtra}</span>
                <span className="font-medium text-green-600">
                  +${precioProteina.toLocaleString('es-CO')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Cantidad</span>
              <span className="font-medium">x{cantidad}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-xl font-bold text-green-600">
                  ${(precioTotal * cantidad).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAgregarAlCarrito}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Agregar al carrito
          </button>

          {/* Items en el carrito (contador) */}
          {items.length > 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Tienes {items.length} {items.length === 1 ? 'ensalada' : 'ensaladas'} en
              tu carrito
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
