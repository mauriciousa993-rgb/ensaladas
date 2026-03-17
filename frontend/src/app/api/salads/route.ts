import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Salad } from '@/models/Salad';
import { isDemoMode } from '@/lib/demoMode';
import { getDemoSalads } from '@/lib/demoData';

// GET - Obtener todas las ensaladas (activas e inactivas para admin)
export async function GET(request: NextRequest) {
  try {
    if (isDemoMode()) {
      const searchParams = request.nextUrl.searchParams;
      const todas = searchParams.get('todas') === 'true';
      const salads = getDemoSalads();
      return NextResponse.json({
        success: true,
        data: todas ? salads : salads.filter((s) => s.estaActiva),
      });
    }

    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const todas = searchParams.get('todas') === 'true';
    
    const query = todas ? {} : { estaActiva: true };
    const salads = await Salad.find(query).sort({ nombre: 1 });
    
    return NextResponse.json({
      success: true,
      data: salads,
    });
  } catch (error) {
    console.error('Error al obtener ensaladas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener ensaladas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva ensalada
export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(
        { success: false, error: 'Demo mode: operación no disponible' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { nombre, precioBase, ingredientesDefault, proteinasExtras, imagenUrl, descripcion } = body;
    
    const salad = await Salad.create({
      nombre,
      precioBase,
      ingredientesDefault: ingredientesDefault || [],
      proteinasExtras,
      imagenUrl,
      descripcion,
      estaActiva: true,
    });
    
    return NextResponse.json({
      success: true,
      data: salad,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error al crear ensalada:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al crear ensalada' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar ensalada
export async function PUT(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(
        { success: false, error: 'Demo mode: operación no disponible' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { id, nombre, precioBase, ingredientesDefault, proteinasExtras, imagenUrl, descripcion, estaActiva } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de ensalada requerido' },
        { status: 400 }
      );
    }
    
    const salad = await Salad.findByIdAndUpdate(
      id,
      {
        nombre,
        precioBase,
        ingredientesDefault,
        proteinasExtras,
        imagenUrl,
        descripcion,
        estaActiva,
      },
      { new: true, runValidators: true }
    );
    
    if (!salad) {
      return NextResponse.json(
        { success: false, error: 'Ensalada no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: salad,
    });
    
  } catch (error: any) {
    console.error('Error al actualizar ensalada:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al actualizar ensalada' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar ensalada (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(
        { success: false, error: 'Demo mode: operación no disponible' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de ensalada requerido' },
        { status: 400 }
      );
    }
    
    const salad = await Salad.findByIdAndUpdate(
      id,
      { estaActiva: false },
      { new: true }
    );
    
    if (!salad) {
      return NextResponse.json(
        { success: false, error: 'Ensalada no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ensalada eliminada correctamente',
    });
    
  } catch (error) {
    console.error('Error al eliminar ensalada:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar ensalada' },
      { status: 500 }
    );
  }
}
