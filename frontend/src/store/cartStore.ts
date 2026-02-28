import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipo para los elementos del carrito
export interface CartItem {
  id: string;
  saladId: string;
  nombreSalad: string;
  imagenUrl: string;
  precioBase: number;
  ingredientesRemovidos: string[];
  proteinaExtra: string | null;
  precioProteinaExtra: number;
  precioTotal: number;
  cantidad: number;
}

// Tipo para el estado del carrito
interface CartState {
  items: CartItem[];
  tipoEntrega: 'domicilio' | 'recojo';
  costoDelivery: number;
  
  // Acciones
  agregarItem: (item: Omit<CartItem, 'id' | 'cantidad'>) => void;
  removerItem: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  actualizarItem: (id: string, updates: Partial<Omit<CartItem, 'id' | 'saladId' | 'nombreSalad' | 'imagenUrl' | 'precioBase'>>) => void;
  setTipoEntrega: (tipo: 'domicilio' | 'recojo') => void;
  vaciarCarrito: () => void;
  
  // Selectores
  getSubtotal: () => number;
  getTotal: () => number;
  getCantidadItems: () => number;
}

// Generar ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tipoEntrega: 'recojo',
      costoDelivery: 0,

      agregarItem: (item) => {
        const id = generateId();
        const newItem: CartItem = {
          ...item,
          id,
          cantidad: 1,
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      removerItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      actualizarCantidad: (id, cantidad) => {
        if (cantidad <= 0) {
          get().removerItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, cantidad } : item
          ),
        }));
      },

      actualizarItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      setTipoEntrega: (tipo) => {
        const costoDelivery = tipo === 'domicilio' ? 3000 : 0;
        set({ tipoEntrega: tipo, costoDelivery });
      },

      vaciarCarrito: () => {
        set({ items: [], costoDelivery: 0, tipoEntrega: 'recojo' });
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          return total + (item.precioTotal * item.cantidad);
        }, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const { costoDelivery } = get();
        return subtotal + costoDelivery;
      },

      getCantidadItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },
    }),
    {
      name: 'ensaladas-cart',
    }
  )
);
