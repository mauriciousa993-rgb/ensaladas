import { z } from 'zod';

/**
 * Schema para validar el cliente
 * - nombre: requerido, max 100 caracteres
 * - celular: requerido, formato válido de celular colombiano
 * - email: opcional, formato válido de email
 */
export const clienteSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del cliente es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  celular: z
    .string()
    .min(1, 'El celular del cliente es requerido')
    .regex(
      /^(\+57|57)?\d{10,12}$/,
      'Ingrese un número de celular válido de Colombia (ej: 3001234567)'
    ),
  email: z
    .string()
    .email('Ingrese un correo electrónico válido')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema para validar la dirección
 * - Solo requerida cuando tipoEntrega === 'domicilio'
 * - ciudad tiene valor default: 'Bogotá'
 */
export const direccionSchema = z.object({
  calle: z.string().min(1, 'La calle es requerida'),
  numero: z.string().min(1, 'El número de dirección es requerido'),
  barrio: z.string().optional(),
  ciudad: z.string().default('Bogotá'),
  referencia: z.string().optional(),
});

/**
 * Schema para validar una ensalada individual
 */
export const ensaladaSchema = z.object({
  saladId: z.string().min(1, 'El ID de la ensalada es requerido'),
  nombreSalad: z.string().min(1, 'El nombre de la ensalada es requerido'),
  precioBase: z.number().min(0, 'El precio base no puede ser negativo'),
  ingredientesRemovidos: z.array(z.string()).default([]),
  proteinaExtra: z.string().nullable().default(null),
  precioProteinaExtra: z.number().min(0, 'El precio de proteína extra no puede ser negativo').default(0),
  precioTotal: z.number().min(0, 'El precio total no puede ser negativo'),
  observaciones: z.string().max(200, 'Las observaciones no pueden exceder 200 caracteres').optional(),
});

/**
 * Schema completo para OrderRequest
 * Valida toda la estructura del pedido
 */
export const orderRequestSchema = z
  .object({
    cliente: clienteSchema,
    tipoEntrega: z.enum(['domicilio', 'recojo']),
    direccion: direccionSchema.optional(),
    ensaldas: z
      .array(ensaladaSchema)
      .min(1, 'Debe incluir al menos una ensalada en el pedido'),
    subtotal: z.number().min(0, 'El subtotal no puede ser negativo'),
    costoDelivery: z.number().min(0, 'El costo de delivery no puede ser negativo').default(0),
    descuento: z.number().min(0, 'El descuento no puede ser negativo').default(0),
    total: z.number().min(0, 'El total no puede ser negativo'),
    metodoPago: z.enum(['Efectivo', 'PSE']),
    notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  })
  .refine(
    (data) => {
      // Si tipoEntrega es domicilio, la dirección es requerida
      if (data.tipoEntrega === 'domicilio' && !data.direccion) {
        return false;
      }
      return true;
    },
    {
      message: 'La dirección es requerida para entrega a domicilio',
      path: ['direccion'],
    }
  )
  .refine(
    (data) => {
      // Si tipoEntrega es recojo, la dirección no debe enviarse o debe ser undefined
      if (data.tipoEntrega === 'recojo' && data.direccion) {
        return false;
      }
      return true;
    },
    {
      message: 'No debe enviar dirección para recojo en tienda',
      path: ['direccion'],
    }
  );

/**
 * Tipo TypeScript inferido del schema de OrderRequest
 */
export type OrderRequest = z.infer<typeof orderRequestSchema>;

/**
 * Tipo para errores de validación formateados
 */
export type ValidationError = {
  success: false;
  error: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

/**
 * Función helper para validar datos del pedido
 * Retorna el objeto validado o lanza error con mensajes claros
 */
export function validateOrderRequest(data: unknown): OrderRequest {
  const result = orderRequestSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    const errorMessage = errors
      .map((e) => `${e.field}: ${e.message}`)
      .join(', ');
    
    throw new Error(errorMessage);
  }
  
  return result.data;
}

/**
 * Función para obtener errores de validación en formato compatible con la API
 */
export function getValidationErrors(
  data: unknown
): { success: false; error: string; errors: Array<{ field: string; message: string }> } {
  const result = orderRequestSchema.safeParse(data);
  
  if (result.success) {
    return { success: false, error: 'Datos inválidos', errors: [] };
  }
  
  const errors = result.error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  const errorMessage = errors.map((e) => e.message).join(', ');
  
  return {
    success: false,
    error: errorMessage,
    errors,
  };
}
