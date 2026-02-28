'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { buildApiUrl } from '@/lib/api';

interface CheckoutProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

type MetodoPago = 'Efectivo' | 'PSE';
type TipoEntrega = 'recojo' | 'domicilio';

interface FormData {
  nombre: string;
  celular: string;
  email: string;
  tipoEntrega: TipoEntrega;
  calle: string;
  numero: string;
  barrio: string;
  ciudad: string;
  referencia: string;
  metodoPago: MetodoPago;
}

export default function Checkout({ onClose, onSuccess }: CheckoutProps) {
  const items = useCartStore((state) => state.items);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotal = useCartStore((state) => state.getTotal);
  const vaciarCarrito = useCartStore((state) => state.vaciarCarrito);
  const tipoEntregaStore = useCartStore((state) => state.tipoEntrega);
  const setTipoEntregaStore = useCartStore((state) => state.setTipoEntrega);
  const costoDelivery = useCartStore((state) => state.costoDelivery);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    celular: '',
    email: '',
    tipoEntrega: tipoEntregaStore,
    calle: '',
    numero: '',
    barrio: '',
    ciudad: 'Bogotá',
    referencia: '',
    metodoPago: 'Efectivo',
  });

  const [errores, setErrores] = useState<Partial<Record<keyof FormData, string>>>({});

  // Validar el formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: Partial<Record<keyof FormData, string>> = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (!formData.celular.trim()) {
      nuevosErrores.celular = 'El teléfono es requerido';
    } else if (!/^(\+57|57)?\d{10,12}$/.test(formData.celular)) {
      nuevosErrores.celular = 'Ingrese un teléfono válido';
    }

    if (formData.tipoEntrega === 'domicilio') {
      if (!formData.calle.trim()) {
        nuevosErrores.calle = 'La calle es requerida';
      }
      if (!formData.numero.trim()) {
        nuevosErrores.numero = 'El número es requerido';
      }
      if (!formData.barrio.trim()) {
        nuevosErrores.barrio = 'El barrio es requerido';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar cambio en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error cuando el usuario empieza a escribir
    if (errores[name as keyof FormData]) {
      setErrores((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Manejar cambio de tipo de entrega
  const handleTipoEntregaChange = (tipo: TipoEntrega) => {
    setFormData((prev) => ({
      ...prev,
      tipoEntrega: tipo,
    }));
    setTipoEntregaStore(tipo);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validarFormulario()) {
      return;
    }

    if (items.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setIsLoading(true);

    try {
      const ordenData = {
        cliente: {
          nombre: formData.nombre,
          celular: formData.celular,
          email: formData.email || undefined,
        },
        tipoEntrega: formData.tipoEntrega,
        direccion: formData.tipoEntrega === 'domicilio' ? {
          calle: formData.calle,
          numero: formData.numero,
          barrio: formData.barrio,
          ciudad: formData.ciudad,
          referencia: formData.referencia || undefined,
        } : undefined,
        ensaldas: items.map((item) => ({
          saladId: item.saladId,
          nombreSalad: item.nombreSalad,
          precioBase: item.precioBase,
          ingredientesRemovidos: item.ingredientesRemovidos,
          proteinaExtra: item.proteinaExtra,
          precioProteinaExtra: item.precioProteinaExtra,
          precioTotal: item.precioTotal,
        })),
        subtotal: getSubtotal(),
        costoDelivery: costoDelivery,
        descuento: 0,
        total: getTotal(),
        metodoPago: formData.metodoPago,
      };

      const response = await fetch(buildApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordenData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la orden');
      }

      // Si es PSE y hay URL de pago, redirigir
      if (formData.metodoPago === 'PSE' && result.data.urlPago) {
        window.location.href = result.data.urlPago;
        return;
      }

      // Éxito - limpiar carrito y mostrar mensaje
      vaciarCarrito();
      alert(`¡Pedido confirmado! Número de orden: ${result.data.numeroOrden}`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onClose) {
        onClose();
      }

    } catch (err: any) {
      setError(err.message || 'Error al procesar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-green-600 text-white p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Checkout</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-green-100 mt-1">Completa tus datos para confirmar el pedido</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Resumen del pedido */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Resumen del pedido</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.cantidad}x {item.nombreSalad}
                  {item.proteinaExtra && ` + ${item.proteinaExtra}`}
                </span>
                <span className="font-medium">
                  ${(item.precioTotal * item.cantidad).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            {costoDelivery > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span>${costoDelivery.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span className="text-green-600">${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Selector tipo de entrega */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de entrega
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTipoEntregaChange('recojo')}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                ${formData.tipoEntrega === 'recojo'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium">Recoger en Tienda</span>
            </button>
            <button
              type="button"
              onClick={() => handleTipoEntregaChange('domicilio')}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                ${formData.tipoEntrega === 'domicilio'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Domicilio</span>
            </button>
          </div>
        </div>

        {/* Campos de dirección (solo si es domicilio) */}
        {formData.tipoEntrega === 'domicilio' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-4">Dirección de entrega</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle *
                </label>
                <input
                  type="text"
                  name="calle"
                  value={formData.calle}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errores.calle ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="ej: Calle 100"
                />
                {errores.calle && (
                  <p className="text-red-500 text-xs mt-1">{errores.calle}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errores.numero ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="ej: 45A"
                />
                {errores.numero && (
                  <p className="text-red-500 text-xs mt-1">{errores.numero}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barrio *
                </label>
                <input
                  type="text"
                  name="barrio"
                  value={formData.barrio}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errores.barrio ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="ej: Chapinero"
                />
                {errores.barrio && (
                  <p className="text-red-500 text-xs mt-1">{errores.barrio}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="ej: Apt 302"
                />
              </div>
            </div>
          </div>
        )}

        {/* Datos del cliente */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Datos de contacto</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errores.nombre ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="ej: Juan Pérez"
              />
              {errores.nombre && (
                <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errores.celular ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="ej: 3001234567"
              />
              {errores.celular && (
                <p className="text-red-500 text-xs mt-1">{errores.celular}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="ej: juan@email.com"
              />
            </div>
          </div>
        </div>

        {/* Selector método de pago */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, metodoPago: 'Efectivo' }))}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                ${formData.metodoPago === 'Efectivo'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">Efectivo</span>
              <span className="text-xs text-green-600">Paga al recibir</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, metodoPago: 'PSE' }))}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                ${formData.metodoPago === 'PSE'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-600'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-medium">PSE</span>
              <span className="text-xs text-blue-600">Pago online</span>
            </button>
          </div>
        </div>

        {/* Error general */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Botón de submit */}
        <button
          type="submit"
          disabled={isLoading || items.length === 0}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2
            ${isLoading || items.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : formData.metodoPago === 'PSE'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </>
          ) : formData.metodoPago === 'PSE' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pagar con PSE
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmar Pedido
            </>
          )}
        </button>
      </form>
    </div>
  );
}
