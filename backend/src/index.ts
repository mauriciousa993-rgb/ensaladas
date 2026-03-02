﻿import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import connectDB from './config/database';
import { Salad } from './models/Salad';
import { Order, EstadoPago } from './models/Order';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3002;

function getAllowedOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS || '';
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.length === 0) return true;

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.startsWith('https://*.')) {
      const suffix = allowedOrigin.replace('https://*', '');
      return origin.startsWith('https://') && origin.endsWith(suffix);
    }
    return origin === allowedOrigin;
  });
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por CORS'));
  },
};

function generarNumeroOrden(count: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const numero = (count + 1).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${numero}`;
}

function generarUrlPagoSimulada(numeroOrden: string, total: number): string {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = process.env.WOMPI_REDIRECT_URL || `${frontendUrl}/payment/response`;
  const pagoId = `pago_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  return `https://sandbox.wompi.co/payment-requests/${pagoId}?amount=${total * 100}&currency=COP&reference=${numeroOrden}&redirect_url=${encodeURIComponent(redirectUrl)}`;
}

function normalizeOrder<T extends Record<string, any>>(order: T): T & { fechaCreacion?: Date } {
  return {
    ...order,
    fechaCreacion: order.fechaCreacion || order.createdAt,
  };
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
}

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'ensaladas-backend' });
});

app.post('/api/uploads/cloudinary-signature', (_req: Request, res: Response) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'ensaladas';

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      success: false,
      error: 'Cloudinary no configurado en servidor',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams(
    { folder, timestamp: String(timestamp) },
    apiSecret
  );

  return res.json({
    success: true,
    data: {
      cloudName,
      apiKey,
      folder,
      timestamp,
      signature,
    },
  });
});

app.get('/api/salads', async (_req: Request, res: Response) => {
  try {
    const salads = await Salad.find({ estaActiva: true });
    res.json(salads);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener las ensaladas' });
  }
});

app.get('/api/salads/:id', async (req: Request, res: Response) => {
  try {
    const salad = await Salad.findById(req.params.id);
    if (!salad) {
      return res.status(404).json({ success: false, error: 'Ensalada no encontrada' });
    }
    return res.json(salad);
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener la ensalada' });
  }
});

// Crear nueva ensalada
app.post('/api/salads', async (req: Request, res: Response) => {
  try {
    const { nombre, precioBase, ingredientesDefault, proteinasExtras, imagenUrl, descripcion } = req.body;
    
    const salad = new Salad({
      nombre,
      precioBase,
      ingredientesDefault: ingredientesDefault || [],
      proteinasExtras,
      imagenUrl,
      descripcion,
      estaActiva: true,
    });
    
    await salad.save();
    return res.status(201).json({ success: true, data: salad });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Error al crear la ensalada' });
  }
});

// Actualizar ensalada
app.put('/api/salads/:id', async (req: Request, res: Response) => {
  try {
    const { nombre, precioBase, ingredientesDefault, proteinasExtras, imagenUrl, descripcion, estaActiva } = req.body;
    
    const salad = await Salad.findByIdAndUpdate(
      req.params.id,
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
      return res.status(404).json({ success: false, error: 'Ensalada no encontrada' });
    }
    
    return res.json({ success: true, data: salad });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Error al actualizar la ensalada' });
  }
});

// Eliminar ensalada (soft delete)
app.delete('/api/salads/:id', async (req: Request, res: Response) => {
  try {
    const salad = await Salad.findByIdAndUpdate(
      req.params.id,
      { estaActiva: false },
      { new: true }
    );
    
    if (!salad) {
      return res.status(404).json({ success: false, error: 'Ensalada no encontrada' });
    }
    
    return res.json({ success: true, message: 'Ensalada eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al eliminar la ensalada' });
  }
});

// Reportes de ventas
app.get('/api/reports/sales', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query;
    
    let dateFilter: any = {};
    if (desde && hasta) {
      dateFilter = {
        createdAt: {
          $gte: new Date(desde as string),
          $lte: new Date(hasta as string),
        },
      };
    }
    
    const orders = await Order.find(dateFilter).lean();
    
    const salesByDate: any = {};
    const salesByPaymentMethod: any = { Efectivo: 0, PSE: 0 };
    let totalRevenue = 0;
    let totalOrders = 0;
    
    orders.forEach((order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { revenue: 0, orders: 0 };
      }
      salesByDate[date].revenue += order.total;
      salesByDate[date].orders += 1;
      
      salesByPaymentMethod[order.metodoPago] += order.total;
      totalRevenue += order.total;
      totalOrders += 1;
    });
    
    const dailySales = Object.entries(salesByDate).map(([date, data]: [string, any]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    return res.json({
      success: true,
      data: {
        dailySales,
        salesByPaymentMethod,
        totalRevenue,
        totalOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al generar reporte de ventas' });
  }
});

// Reportes de productos
app.get('/api/reports/products', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query;
    
    let dateFilter: any = {};
    if (desde && hasta) {
      dateFilter = {
        createdAt: {
          $gte: new Date(desde as string),
          $lte: new Date(hasta as string),
        },
      };
    }
    
    const orders = await Order.find(dateFilter).lean();
    
    const productStats: any = {};
    
    orders.forEach((order: any) => {
      order.ensaldas.forEach((item: any) => {
        const name = item.nombreSalad;
        if (!productStats[name]) {
          productStats[name] = {
            name,
            quantity: 0,
            revenue: 0,
            withProtein: 0,
          };
        }
        productStats[name].quantity += 1;
        productStats[name].revenue += item.precioTotal;
        if (item.proteinaExtra) {
          productStats[name].withProtein += 1;
        }
      });
    });
    
    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return res.json({
      success: true,
      data: {
        topProducts,
        totalProductsSold: Object.values(productStats).reduce((sum: number, p: any) => sum + p.quantity, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al generar reporte de productos' });
  }
});

// Resumen del negocio
app.get('/api/reports/summary', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [todayOrders, weekOrders, monthOrders, allOrders, activeSalads] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfDay } }).lean(),
      Order.find({ createdAt: { $gte: startOfWeek } }).lean(),
      Order.find({ createdAt: { $gte: startOfMonth } }).lean(),
      Order.find().lean(),
      Salad.countDocuments({ estaActiva: true }),
    ]);
    
    const calculateStats = (orders: any[]) => ({
      orders: orders.length,
      revenue: orders.reduce((sum, o) => sum + (o.estadoPago === EstadoPago.PAGADO ? o.total : 0), 0),
      pending: orders.reduce((sum, o) => sum + (o.estadoPago === EstadoPago.PENDIENTE ? o.total : 0), 0),
    });
    
    const statusCounts: any = {};
    allOrders.forEach((o: any) => {
      statusCounts[o.estadoOrden] = (statusCounts[o.estadoOrden] || 0) + 1;
    });
    
    return res.json({
      success: true,
      data: {
        today: calculateStats(todayOrders),
        week: calculateStats(weekOrders),
        month: calculateStats(monthOrders),
        allTime: calculateStats(allOrders),
        statusDistribution: statusCounts,
        activeProducts: activeSalads,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al generar resumen' });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const ordenData = req.body;
    const count = await Order.countDocuments();
    const numeroOrden = generarNumeroOrden(count);
    const estadoInicial = EstadoPago.PENDIENTE;
    const isPse = ordenData?.metodoPago === 'PSE';
    const urlPago = isPse ? generarUrlPagoSimulada(numeroOrden, Number(ordenData?.total || 0)) : undefined;

    const orden = new Order({
      ...ordenData,
      numeroOrden,
      estadoPago: ordenData?.estadoPago || estadoInicial,
      ...(urlPago ? { urlPago } : {}),
    });

    await orden.save();

    return res.status(201).json({
      success: true,
      data: {
        ordenId: orden._id,
        numeroOrden: orden.numeroOrden,
        estadoPago: orden.estadoPago,
        metodoPago: orden.metodoPago,
        total: orden.total,
        ...(urlPago ? { urlPago } : {}),
        mensaje: isPse
          ? 'Orden creada. Por favor complete el pago en la URL proporcionada.'
          : 'Orden creada exitosamente. El pago se realizara en efectivo al momento de la entrega.',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al crear la orden' });
  }
});

app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const filtroFecha = typeof req.query.fecha === 'string' ? req.query.fecha : '';
    let createdAtFilter: Date | undefined;

    if (filtroFecha === 'hoy') {
      const now = new Date();
      createdAtFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const query = createdAtFilter ? { createdAt: { $gte: createdAtFilter } } : {};

    const rawOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const ordenes = rawOrders.map((order) => normalizeOrder(order));

    const totalRecaudado = ordenes
      .filter((o) => o.estadoPago === EstadoPago.PAGADO)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalPendiente = ordenes
      .filter((o) => o.estadoPago === EstadoPago.PENDIENTE)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return res.json({
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
    return res.status(500).json({ success: false, error: 'Error al obtener las ordenes' });
  }
});

app.get('/api/orders/:numeroOrden', async (req: Request, res: Response) => {
  try {
    const orden = await Order.findOne({ numeroOrden: req.params.numeroOrden }).lean();
    if (!orden) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }
    return res.json({ success: true, data: normalizeOrder(orden) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener la orden' });
  }
});

app.patch('/api/orders', async (req: Request, res: Response) => {
  try {
    const { ordenId, nuevoEstado } = req.body as { ordenId?: string; nuevoEstado?: string };
    if (!ordenId || !nuevoEstado) {
      return res.status(400).json({ success: false, error: 'Se requiere ordenId y nuevoEstado' });
    }

    const orden = await Order.findByIdAndUpdate(
      ordenId,
      { estadoOrden: nuevoEstado },
      { new: true }
    ).lean();

    if (!orden) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    return res.json({ success: true, data: normalizeOrder(orden) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al actualizar la orden' });
  }
});

app.patch('/api/orders/:numeroOrden/estado', async (req: Request, res: Response) => {
  try {
    const { estadoOrden } = req.body;
    const orden = await Order.findOneAndUpdate(
      { numeroOrden: req.params.numeroOrden },
      { estadoOrden },
      { new: true }
    ).lean();

    if (!orden) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    return res.json({ success: true, data: normalizeOrder(orden) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al actualizar el estado' });
  }
});

app.patch('/api/orders/:numeroOrden/pago', async (req: Request, res: Response) => {
  try {
    const { estadoPago } = req.body;
    const orden = await Order.findOneAndUpdate(
      { numeroOrden: req.params.numeroOrden },
      { estadoPago },
      { new: true }
    ).lean();

    if (!orden) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    return res.json({ success: true, data: normalizeOrder(orden) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error al actualizar el pago' });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export { app };
