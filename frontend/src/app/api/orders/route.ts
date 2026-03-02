import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order, MetodoPago, EstadoPago, generateNumeroOrden, EstadoOrden } from '@/models/Order';
import { notificarNuevoPedido } from '@/lib/whatsapp';
import { orderRequestSchema, getValidationErrors } from '@/lib/validations/orderValidation';

// Función para generar URL de pago simulada (placeholder para Wompi)
function generarUrlPagoSimulada(numeroOrden: string, total: number): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUrl = process.env.NEXT_PUBLIC_WOMPI_REDIRECT_URL || appUrl + '/payment/response';
  
  const pagoId = 'pago_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const urlPago = 'https://sandbox.wompi.co/payment-requests/' + pagoId + '?amount=' + (total * 100) + '&currency=COP&reference=' + numeroOrden + '&redirect_url=' + encodeURIComponent(redirectUrl);
  
  return urlPago;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validar datos del pedido con Zod
    const validation = orderRequestSchema.safeParse(body);
    
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      
      const errorMessage = errors.map((e) => e.message).join(', ');
      
      return NextResponse.json(
        { success: false, error: errorMessage, validationErrors: errors },
        { status: 400 }
      );
    }

    const validatedBody = validation.data;

    const numeroOrden = await generateNumeroOrden();

    let estadoInicial: EstadoPago;
    let urlPago: string | undefined;

    if (validatedBody.metodoPago === MetodoPago.EFECTIVO) {
      estadoInicial = EstadoPago.PENDIENTE;
    } else if (validatedBody.metodoPago === MetodoPago.PSE) {
      urlPago = generarUrlPagoSimulada(numeroOrden, validatedBody.total);
      estadoInicial = EstadoPago.PENDIENTE;
    } else {
      estadoInicial = EstadoPago.PENDIENTE;
    }

    const orden = await Order.create({
      numeroOrden,
      cliente: validatedBody.cliente,
      tipoEntrega: validatedBody.tipoEntrega,
      direccion: validatedBody.tipoEntrega === 'domicilio' ? validatedBody.direccion : undefined,
      ensaldas: validatedBody.ensaldas,
      subtotal: validatedBody.subtotal,
      costoDelivery: validatedBody.costoDelivery || 0,
      descuento: validatedBody.descuento || 0,
      total: validatedBody.total,
      metodoPago: validatedBody.metodoPago,
      estadoPago: estadoInicial,
      urlPago,
      notas: validatedBody.notas,
    });

    // Enviar notificación de WhatsApp al negocio (sin esperar)
    notificarNuevoPedido({
      numeroOrden: orden.numeroOrden,
      cliente: validatedBody.cliente,
      tipoEntrega: validatedBody.tipoEntrega,
      direccion: validatedBody.tipoEntrega === 'domicilio' ? validatedBody.direccion : undefined,
      ensaldas: validatedBody.ensaldas.map(e => ({ ...e, cantidad: 1 })),
      total: validatedBody.total,
      metodoPago: validatedBody.metodoPago,
    }).catch(err => console.error('Error enviando WhatsApp:', err));

    if (validatedBody.metodoPago === MetodoPago.EFECTIVO) {
      return NextResponse.json({
        success: true,
        data: {
          ordenId: orden._id,
          numeroOrden: orden.numeroOrden,
          estadoPago: orden.estadoPago,
          metodoPago: orden.metodoPago,
          total: orden.total,
          mensaje: 'Orden creada exitosamente. El pago se realizará en efectivo al momento de la entrega.',
        },
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          ordenId: orden._id,
          numeroOrden: orden.numeroOrden,
          estadoPago: orden.estadoPago,
          metodoPago: orden.metodoPago,
          total: orden.total,
          urlPago: orden.urlPago,
          mensaje: 'Orden creada. Por favor complete el pago en la URL proporcionada.',
        },
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Error al crear la orden:', error);

    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { success: false, error: errores.join(', ') },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una orden con este número' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET para obtener órdenes (para el admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const filtroFecha = searchParams.get('fecha'); // 'hoy' o null para todos
    
    let fechaInicio: Date | undefined;
    
    if (filtroFecha === 'hoy') {
      const ahora = new Date();
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    }
    
    const query = fechaInicio 
      ? { fechaCreacion: { $gte: fechaInicio } }
      : {};
    
    const ordenes = await Order.find(query)
      .sort({ fechaCreacion: -1 })
      .limit(100)
      .lean();
    
    // Calcular totales
    const totalRecaudado = ordenes
      .filter((o: any) => o.estadoPago === EstadoPago.PAGADO)
      .reduce((sum: number, o: any) => sum + o.total, 0);
    
    const totalPendiente = ordenes
      .filter((o: any) => o.estadoPago === EstadoPago.PENDIENTE)
      .reduce((sum: number, o: any) => sum + o.total, 0);
    
    return NextResponse.json({
      success: true,
      data: {
        ordenes,
        stats: {
          totalOrdenes: ordenes.length,
          totalRecaudado,
          totalPendiente,
        },
      },
    });
    
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}

// PATCH para actualizar estado de una orden
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { ordenId, nuevoEstado } = body;
    
    if (!ordenId || !nuevoEstado) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ordenId y nuevoEstado' },
        { status: 400 }
      );
    }
    
    const orden = await Order.findByIdAndUpdate(
      ordenId,
      { estadoOrden: nuevoEstado },
      { new: true }
    );
    
    if (!orden) {
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: orden,
    });
    
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const ordenId = searchParams.get('id');
    const numeroOrden = searchParams.get('numeroOrden');

    if (!ordenId && !numeroOrden) {
      return NextResponse.json(
        { success: false, error: 'Se requiere id o numeroOrden para eliminar la orden' },
        { status: 400 }
      );
    }

    const orden = ordenId
      ? await Order.findByIdAndDelete(ordenId)
      : await Order.findOneAndDelete({ numeroOrden });

    if (!orden) {
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Orden eliminada correctamente',
      data: orden,
    });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
