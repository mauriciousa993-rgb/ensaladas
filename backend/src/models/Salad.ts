import mongoose, { Document, Schema } from 'mongoose';

export interface ISalad extends Document {
  nombre: string;
  precioBase: number;
  ingredientesDefault: string[];
  imagenUrl: string;
  descripcion?: string;
  estaActiva: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

const SaladSchema = new Schema<ISalad>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la ensalada es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    precioBase: {
      type: Number,
      required: [true, 'El precio base es requerido'],
      min: [0, 'El precio base no puede ser negativo'],
    },
    ingredientesDefault: {
      type: [String],
      required: [true, 'Los ingredientes por defecto son requeridos'],
      default: [],
    },
    imagenUrl: {
      type: String,
      required: [true, 'La URL de imagen es requerida'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    estaActiva: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para búsquedas
SaladSchema.index({ nombre: 'text' });
SaladSchema.index({ estaActiva: 1 });

export const Salad = mongoose.model<ISalad>('Salad', SaladSchema);
