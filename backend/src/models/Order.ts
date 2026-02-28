import mongoose, { Document, Schema, Types } from 'mongoose';

// Tipos para enumeraciones
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

// Interfaz para los ingredientes opcionales disponibles
export interface IIngredienteOpcional {
  nombre: string;
  precio: number;
}

// Interfaz para una ensalada en el pedido
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

// Interfaz para los datos del cliente
export interface IDatosCliente {
  nombre: string;
  celular: string;
  email?: string;
}

// Interfaz para la dirección
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
  notas?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Schema para los elementos de la orden
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
      maxlength: [200, 'Las observaciones no pueden exceder 200 caracteres'],
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
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    celular: {
      type: String,
      required: [true, 'El celular del cliente es requerido'],
      trim: true,
      match: [/^\+?[\d\s-]{10,20}$/, 'Formato de celular inválido'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
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
      maxlength: [200, 'La referencia no puede exceder 200 caracteres'],
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
      required: [true, 'El tipo de entrega es requerido'],
    },
    direccion: {
      type: DireccionSchema,
      required: function (this: IOrder) {
        return this.tipoEntrega === TipoEntrega.DOMICILIO;
      },
    },
    ensaldas: {
      type: [SaladItemSchema],
      required: [true, 'Debe incluir al menos una ensalada'],
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
      required: [true, 'El método de pago es requerido'],
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
    notas: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas (unique ya crea índice automáticamente)
OrderSchema.index({ 'cliente.celular': 1 });
OrderSchema.index({ estadoOrden: 1 });
OrderSchema.index({ estadoPago: 1 });
OrderSchema.index({ fechaCreacion: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
