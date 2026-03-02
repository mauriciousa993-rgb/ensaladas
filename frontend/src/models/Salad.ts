import mongoose, { Document, Schema } from 'mongoose';

export interface ISalad extends Document {
  nombre: string;
  precioBase: number;
  ingredientesDefault: string[];
  proteinasExtras: Array<{
    nombre: string;
    precio: number;
  }>;
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
    proteinasExtras: {
      type: [
        {
          nombre: {
            type: String,
            required: true,
            trim: true,
          },
          precio: {
            type: Number,
            required: true,
            min: [0, 'El precio de la proteina no puede ser negativo'],
          },
        },
      ],
      default: [
        { nombre: 'Pollo', precio: 5000 },
        { nombre: 'Atun', precio: 6000 },
        { nombre: 'Huevo', precio: 3500 },
      ],
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

export const Salad = mongoose.models.Salad || mongoose.model<ISalad>('Salad', SaladSchema);
