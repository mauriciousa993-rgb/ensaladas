import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
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

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'ensaladas-backend' });
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
