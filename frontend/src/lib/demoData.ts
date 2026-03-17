import { EstadoOrden, EstadoPago, MetodoPago, TipoEntrega } from '@/models/Order';

export type DemoSalad = {
  _id: string;
  nombre: string;
  precioBase: number;
  ingredientesDefault: string[];
  imagenUrl: string;
  descripcion?: string;
  estaActiva: boolean;
};

export type DemoOrder = {
  _id: string;
  numeroOrden: string;
  cliente: { nombre: string; celular: string };
  tipoEntrega: TipoEntrega | string;
  direccion?: { calle: string; numero: string; barrio?: string; ciudad: string };
  ensaldas: Array<{
    nombreSalad: string;
    ingredientesRemovidos: string[];
    proteinaExtra: string | null;
    precioTotal: number;
  }>;
  total: number;
  metodoPago: MetodoPago | string;
  estadoPago: EstadoPago | string;
  estadoOrden: EstadoOrden | string;
  fechaCreacion: string;
  createdAt: string;
};

export function getDemoSalads(): DemoSalad[] {
  return [
    {
      _id: 'demo-salad-1',
      nombre: 'Ensalada César',
      precioBase: 18000,
      ingredientesDefault: ['Lechuga romana', 'Crutones', 'Queso parmesano', 'Aderezo césar'],
      imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      descripcion: 'Clásica, fresca y cremosa.',
      estaActiva: true,
    },
    {
      _id: 'demo-salad-2',
      nombre: 'Ensalada Mediterránea',
      precioBase: 19500,
      ingredientesDefault: ['Tomate', 'Pepino', 'Aceitunas', 'Queso feta', 'Orégano'],
      imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      descripcion: 'Sabores mediterráneos con un toque ligero.',
      estaActiva: true,
    },
    {
      _id: 'demo-salad-3',
      nombre: 'Ensalada Tropical',
      precioBase: 20500,
      ingredientesDefault: ['Mix de hojas', 'Mango', 'Piña', 'Maíz', 'Vinagreta cítrica'],
      imagenUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      descripcion: 'Dulce, ácida y perfecta para el calor.',
      estaActiva: true,
    },
  ];
}

export function getDemoOrders(): DemoOrder[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  return [
    {
      _id: 'demo-order-1',
      numeroOrden: 'ORD-DEMO-0001',
      cliente: { nombre: 'Cliente Demo', celular: '3001234567' },
      tipoEntrega: TipoEntrega.DOMICILIO,
      direccion: { calle: 'Calle 123', numero: '45-67', barrio: 'Chapinero', ciudad: 'Bogotá' },
      ensaldas: [
        {
          nombreSalad: 'Ensalada César',
          ingredientesRemovidos: ['Crutones'],
          proteinaExtra: 'Pollo',
          precioTotal: 23000,
        },
      ],
      total: 23000,
      metodoPago: MetodoPago.EFECTIVO,
      estadoPago: EstadoPago.PENDIENTE,
      estadoOrden: EstadoOrden.PREPARANDO,
      fechaCreacion: oneHourAgo.toISOString(),
      createdAt: oneHourAgo.toISOString(),
    },
    {
      _id: 'demo-order-2',
      numeroOrden: 'ORD-DEMO-0002',
      cliente: { nombre: 'María', celular: '3019876543' },
      tipoEntrega: TipoEntrega.RECOJO,
      ensaldas: [
        {
          nombreSalad: 'Ensalada Mediterránea',
          ingredientesRemovidos: [],
          proteinaExtra: null,
          precioTotal: 19500,
        },
      ],
      total: 19500,
      metodoPago: MetodoPago.PSE,
      estadoPago: EstadoPago.PAGADO,
      estadoOrden: EstadoOrden.RECIBIDA,
      fechaCreacion: twoHoursAgo.toISOString(),
      createdAt: twoHoursAgo.toISOString(),
    },
  ];
}

export function demoStats(orders: DemoOrder[]) {
  const totalRecaudado = orders
    .filter((o) => o.estadoPago === EstadoPago.PAGADO)
    .reduce((sum, o) => sum + o.total, 0);
  const totalPendiente = orders
    .filter((o) => o.estadoPago === EstadoPago.PENDIENTE)
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalOrdenes: orders.length,
    totalRecaudado,
    totalPendiente,
  };
}

