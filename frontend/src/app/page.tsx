'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import SaladCustomizer from '@/components/SaladCustomizer';
import Checkout from '@/components/Checkout';
import { useCartStore } from '@/store/cartStore';
import { buildApiUrl } from '@/lib/api';

interface Salad {
  _id: string;
  nombre: string;
  precioBase: number;
  ingredientesDefault: string[];
  imagenUrl: string;
  descripcion?: string;
}

export default function Home() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loadingSalads, setLoadingSalads] = useState(true);
  const [errorSalads, setErrorSalads] = useState('');
  const [saladSeleccionada, setSaladSeleccionada] = useState<Salad | null>(null);
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const items = useCartStore((state) => state.items);
  const getCantidadItems = useCartStore((state) => state.getCantidadItems);
  const getTotal = useCartStore((state) => state.getTotal);
  const removerItem = useCartStore((state) => state.removerItem);

  const cantidadItems = getCantidadItems();
  const total = getTotal();

  useEffect(() => {
    const loadSalads = async () => {
      setLoadingSalads(true);
      setErrorSalads('');

      try {
        const response = await fetch(buildApiUrl('/api/salads'));
        const payload = await response.json();

        const data = Array.isArray(payload) ? payload : payload?.data;
        if (!response.ok || !Array.isArray(data)) {
          throw new Error('No se pudieron cargar las ensaladas');
        }

        setSalads(data);
      } catch (error) {
        console.error('Error cargando ensaladas:', error);
        setErrorSalads('No pudimos cargar el menu en este momento.');
      } finally {
        setLoadingSalads(false);
      }
    };

    loadSalads();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600 flex items-center gap-2">
            Ensaladas Fresh
          </h1>
          <button
            onClick={() => setMostrarCarrito(!mostrarCarrito)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.13L5.4 5M17 13a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cantidadItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cantidadItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {mostrarCarrito && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMostrarCarrito(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tu Carrito</h2>
                <button
                  onClick={() => setMostrarCarrito(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.13L5.4 5M17 13a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">Tu carrito esta vacio</p>
                  <button
                    onClick={() => setMostrarCarrito(false)}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ver menu
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800">{item.nombreSalad}</h3>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {item.proteinaExtra && (
                          <p className="text-sm text-gray-600">+ {item.proteinaExtra}</p>
                        )}
                        {item.ingredientesRemovidos.length > 0 && (
                          <p className="text-xs text-red-500">
                            Sin: {item.ingredientesRemovidos.join(', ')}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-500">Cant: {item.cantidad}</span>
                          <span className="font-bold text-green-600">
                            ${(item.precioTotal * item.cantidad).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-green-600">${total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMostrarCarrito(false);
                      setMostrarCheckout(true);
                    }}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Proceder al Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="bg-green-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ensaladas Personalizadas
          </h2>
          <p className="text-xl md:text-2xl text-green-100 mb-8">
            Elige tus ingredientes, agrega tu proteina favorita y disfruta
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          Nuestras Ensaladas
        </h3>

        {loadingSalads ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : errorSalads ? (
          <div className="text-center py-12 bg-red-50 rounded-xl text-red-600">
            {errorSalads}
          </div>
        ) : salads.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-500">
            No hay ensaladas disponibles por ahora.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {salads.map((salad) => (
              <div
                key={salad._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => setSaladSeleccionada(salad)}
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <Image
                    src={salad.imagenUrl}
                    alt={salad.nombre}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>

                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    {salad.nombre}
                  </h4>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {salad.descripcion}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      ${salad.precioBase.toLocaleString('es-CO')}
                    </span>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Personalizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {saladSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SaladCustomizer
            salad={saladSeleccionada}
            onClose={() => setSaladSeleccionada(null)}
          />
        </div>
      )}

      {mostrarCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Checkout
            onClose={() => setMostrarCheckout(false)}
            onSuccess={() => {
              setMostrarCarrito(false);
            }}
          />
        </div>
      )}

      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Copyright 2024 Ensaladas Fresh. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
