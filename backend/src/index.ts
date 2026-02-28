import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar configuración de conexión
import connectDB from './config/database';

// Importar modelos
import { Salad, ISalad } from './models/Salad';
import {
  Order,
  IOrder,
  ISaladItem,
  IDatosCliente,
  IDireccion,
  TipoEntrega,
  MetodoPago,
  EstadoPago,
  EstadoOrden,
} from './models/Order';

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Rutas de ejemplo

// GET - Obtener todas las ensaladas
app.get('/api/salads', async (req: Request, res: Response) => {
  try {
    const salads = await Salad.find({ estaActiva: true });
    res.json(salads);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las ensaladas' });
  }
});

// GET - Obtener una ensalada por ID
app.get('/api/salads/:id', async (req: Request, res: Response) => {
  try {
    const salad = await Salad.findById(req.params.id);
    if (!salad) {
      return res.status(404).json({ error: 'Ensalada no encontrada' });
    }
    res.json(salad);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la ensalada' });
  }
});

// POST - Crear una nueva orden
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const ordenData = req.body;
    
    // Generar número de orden
    const count = await Order.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const numero = (count + 1).toString().padStart(4, '0');
    const numeroOrden = `ORD-${year}${month}${day}-${numero}`;

    const orden = new Order({
      ...ordenData,
      numeroOrden,
    });

    await orden.save();
    res.status(201).json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la orden' });
  }
});

// GET - Obtener todas las órdenes
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ fechaCreacion: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

// GET - Obtener una orden por número
app.get('/api/orders/:numeroOrden', async (req: Request, res: Response) => {
  try {
    const orden = await Order.findOne({ numeroOrden: req.params.numeroOrden });
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// PATCH - Actualizar estado de una orden
app.patch('/api/orders/:numeroOrden/estado', async (req: Request, res: Response) => {
  try {
    const { estadoOrden } = req.body;
    const orden = await Order.findOneAndUpdate(
      { numeroOrden: req.params.numeroOrden },
      { estadoOrden },
      { new: true }
    );
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

// PATCH - Actualizar estado de pago de una orden
app.patch('/api/orders/:numeroOrden/pago', async (req: Request, res: Response) => {
  try {
    const { estadoPago } = req.body;
    const orden = await Order.findOneAndUpdate(
      { numeroOrden: req.params.numeroOrden },
      { estadoPago },
      { new: true }
    );
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el pago' });
  }
});

// Middleware para manejo de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

// Exportar para testing
export { app };
