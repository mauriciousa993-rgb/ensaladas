import mongoose, { Document, Schema, Types } from 'mongoose';

// Enumeraciones
export enum TipoEntrega {
  DOMICILIO = 'domicilio',
  RECOJO = 'recojo',
}

export enum MetodoPago {
  EFECTIVO = 'Efectivo',
  PSE = 'PSE',
}

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
  FALLIDO = 'fallido',
  REEMBOLSADO = 'reembolsado',
}

export enum EstadoOrden {
  RECIBIDA = 'recibida',
  PREPARANDO = 'preparando',
  LISTA = 'lista',
  EN_CAMINO = 'en_camino',
  ENTREGADA = 'entregada',
  CANCELADA = 'cancelada',
}

// Interfaces
export interface ISaladItem {
  saladId: Types.ObjectId;
  nombreSalad: string;
  precioBase: number;
  ingredientesRemovidos: string[];
  proteinaExtra: string | null;
  precioProteinaExtra: number;
  precioTotal: number;
  observaciones?: string;
}

export interface IDatosCliente {
  nombre: string;
  celular: string;
  email?: string;
}

export interface IDireccion {
  calle: string;
  numero: string;
  barrio?: string;
  ciudad: string;
  referencia?: string;
}

export interface IOrder extends Document {
  numeroOrden: string;
  cliente: IDatosCliente;
  tipoEntrega: TipoEntrega;
  direccion?: IDireccion;
  ensaldas: ISaladItem[];
  subtotal: number;
  costoDelivery: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  estadoPago: EstadoPago;
  estadoOrden: EstadoOrden;
  urlPago?: string;
  notas?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Schema para elementos de la orden
const SaladItemSchema = new Schema<ISaladItem>(
  {
    saladId: {
      type: Schema.Types.ObjectId,
      ref: 'Salad',
      required: true,
    },
    nombreSalad: {
      type: String,
      required: true,
    },
    precioBase: {
      type: Number,
      required: true,
      min: 0,
    },
    ingredientesRemovidos: {
      type: [String],
      default: [],
    },
    proteinaExtra: {
      type: String,
      default: null,
    },
    precioProteinaExtra: {
      type: Number,
      default: 0,
      min: 0,
    },
    precioTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

// Schema para datos del cliente
const DatosClienteSchema = new Schema<IDatosCliente>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del cliente es requerido'],
      trim: true,
      maxlength: 100,
    },
    celular: {
      type: String,
      required: [true, 'El celular del cliente es requerido'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

// Schema para dirección
const DireccionSchema = new Schema<IDireccion>(
  {
    calle: {
      type: String,
      required: true,
      trim: true,
    },
    numero: {
      type: String,
      required: true,
      trim: true,
    },
    barrio: {
      type: String,
      trim: true,
    },
    ciudad: {
      type: String,
      required: true,
      trim: true,
      default: 'Bogotá',
    },
    referencia: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

// Schema principal de la orden
const OrderSchema = new Schema<IOrder>(
  {
    numeroOrden: {
      type: String,
      required: true,
      unique: true,
    },
    cliente: {
      type: DatosClienteSchema,
      required: true,
    },
    tipoEntrega: {
      type: String,
      enum: Object.values(TipoEntrega),
      required: true,
    },
    direccion: {
      type: DireccionSchema,
    },
    ensaldas: {
      type: [SaladItemSchema],
      required: true,
      validate: {
        validator: function (v: ISaladItem[]) {
          return v && v.length > 0;
        },
        message: 'Debe incluir al menos una ensalada en el pedido',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    costoDelivery: {
      type: Number,
      default: 0,
      min: 0,
    },
    descuento: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    metodoPago: {
      type: String,
      enum: Object.values(MetodoPago),
      required: true,
    },
    estadoPago: {
      type: String,
      enum: Object.values(EstadoPago),
      default: EstadoPago.PENDIENTE,
    },
    estadoOrden: {
      type: String,
      enum: Object.values(EstadoOrden),
      default: EstadoOrden.RECIBIDA,
    },
    urlPago: {
      type: String,
    },
    notas: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
OrderSchema.index({ numeroOrden: 1 });
OrderSchema.index({ 'cliente.celular': 1 });
OrderSchema.index({ estadoOrden: 1 });
OrderSchema.index({ estadoPago: 1 });
OrderSchema.index({ fechaCreacion: -1 });

// Función para generar número de orden único
export async function generateNumeroOrden(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  const count = await mongoose.models.Order?.countDocuments() || 0;
  const numero = (count + 1).toString().padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${numero}`;
}

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
