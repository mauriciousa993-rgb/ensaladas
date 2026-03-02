'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useCartStore, CartItem } from '@/store/cartStore';

interface ProteinOption {
  nombre: string;
  precio: number;
}

interface SaladCustomizerProps {
  salad: {
    _id: string;
    nombre: string;
    precioBase: number;
    ingredientesDefault: string[];
    proteinasExtras?: ProteinOption[];
    imagenUrl: string;
    descripcion?: string;
  };
  onClose?: () => void;
}

const DEFAULT_PROTEINAS: ProteinOption[] = [
  { nombre: 'Pollo', precio: 5000 },
  { nombre: 'Atun', precio: 6000 },
  { nombre: 'Huevo', precio: 3500 },
];

export default function SaladCustomizer({ salad, onClose }: SaladCustomizerProps) {
  const [ingredientesRemovidos, setIngredientesRemovidos] = useState<string[]>([]);
  const [ingredientesRemovidosDraft, setIngredientesRemovidosDraft] = useState<string[]>([]);
  const [proteinaExtra, setProteinaExtra] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const agregarItem = useCartStore((state) => state.agregarItem);
  const items = useCartStore((state) => state.items);

  const proteinasDisponibles = salad.proteinasExtras?.length
    ? salad.proteinasExtras
    : DEFAULT_PROTEINAS;

  const precioProteina = useMemo(() => {
    if (!proteinaExtra) return 0;
    const proteina = proteinasDisponibles.find((p) => p.nombre === proteinaExtra);
    return proteina?.precio || 0;
  }, [proteinaExtra, proteinasDisponibles]);

  const precioTotal = useMemo(() => salad.precioBase + precioProteina, [salad.precioBase, precioProteina]);

  const hayCambiosIngredientes = useMemo(() => {
    if (ingredientesRemovidos.length !== ingredientesRemovidosDraft.length) return true;
    return ingredientesRemovidos.some((ingrediente) => !ingredientesRemovidosDraft.includes(ingrediente));
  }, [ingredientesRemovidos, ingredientesRemovidosDraft]);

  const toggleIngrediente = (ingrediente: string) => {
    setIngredientesRemovidosDraft((prev) =>
      prev.includes(ingrediente) ? prev.filter((i) => i !== ingrediente) : [...prev, ingrediente]
    );
  };

  const handleGuardarIngredientes = () => {
    setIngredientesRemovidos([...ingredientesRemovidosDraft]);
  };

  const handleCancelarIngredientes = () => {
    setIngredientesRemovidosDraft([...ingredientesRemovidos]);
  };

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

    for (let i = 0; i < cantidad; i++) {
      agregarItem(item);
    }

    setIngredientesRemovidos([]);
    setIngredientesRemovidosDraft([]);
    setProteinaExtra(null);
    setCantidad(1);

    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden w-[95vw] max-w-2xl mx-auto max-h-[90vh] flex flex-col">
      <div className="relative h-32 sm:h-40 bg-gray-100 flex-shrink-0">
        <Image src={salad.imagenUrl} alt={salad.nombre} fill className="object-cover" />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{salad.nombre}</h2>
          <p className="text-lg font-bold text-green-400">${salad.precioBase.toLocaleString('es-CO')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {salad.descripcion && <p className="text-gray-500 text-sm mb-4">{salad.descripcion}</p>}

        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-700 mb-2">Quitar ingredientes</h3>
          <p className="text-xs text-gray-500 mb-2">Desmarca los ingredientes que NO quieres</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {salad.ingredientesDefault.map((ingrediente) => (
              <label
                key={ingrediente}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-sm
                  ${
                    ingredientesRemovidosDraft.includes(ingrediente)
                      ? 'bg-red-50 border border-red-200 text-red-600'
                      : 'bg-green-50 border border-green-200 text-green-700 hover:border-green-400'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={!ingredientesRemovidosDraft.includes(ingrediente)}
                  onChange={() => toggleIngrediente(ingrediente)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="font-medium capitalize">{ingrediente}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleGuardarIngredientes}
              disabled={!hayCambiosIngredientes}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={handleCancelarIngredientes}
              disabled={!hayCambiosIngredientes}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
          </div>
          {hayCambiosIngredientes && <p className="mt-1.5 text-xs text-amber-600">Tienes cambios sin guardar.</p>}
        </div>

        {proteinasDisponibles.length > 0 && (
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-700 mb-2">Agregar proteina</h3>
            <div className="grid grid-cols-3 gap-2">
              {proteinasDisponibles.map((proteina) => (
                <button
                  key={proteina.nombre}
                  onClick={() => setProteinaExtra(proteinaExtra === proteina.nombre ? null : proteina.nombre)}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all
                    ${
                      proteinaExtra === proteina.nombre
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300 text-gray-600'
                    }
                  `}
                >
                  <span className="text-xs font-medium">{proteina.nombre}</span>
                  <span className="text-xs text-gray-500">+${proteina.precio.toLocaleString('es-CO')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-700 mb-2">Cantidad</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 transition-colors"
            >
              -
            </button>
            <span className="text-xl font-bold text-gray-800 w-10 text-center">{cantidad}</span>
            <button
              onClick={() => setCantidad(cantidad + 1)}
              className="w-9 h-9 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-lg font-bold text-green-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Base</span>
            <span className="font-medium">${salad.precioBase.toLocaleString('es-CO')}</span>
          </div>
          {proteinaExtra && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{proteinaExtra}</span>
              <span className="font-medium text-green-600">+${precioProteina.toLocaleString('es-CO')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Cantidad</span>
            <span className="font-medium">x{cantidad}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-lg font-bold text-green-600">${(precioTotal * cantidad).toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleAgregarAlCarrito}
          disabled={hayCambiosIngredientes}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold rounded-lg text-base transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Agregar al carrito
        </button>

        {hayCambiosIngredientes && (
          <p className="text-center text-xs text-amber-600 mt-2">Guarda o cancela los ingredientes para continuar.</p>
        )}

        {items.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-3">
            Tienes {items.length} {items.length === 1 ? 'ensalada' : 'ensaladas'} en tu carrito
          </p>
        )}
      </div>
    </div>
  );
}
