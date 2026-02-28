import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order, EstadoPago } from '@/models/Order';
import { Salad } from '@/models/Salad';

// GET - Obtener reportes
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo'); // 'sales', 'products', 'summary'
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    
    let dateFilter: any = {};
    if (desde && hasta) {
      dateFilter = {
        createdAt: {
          $gte: new Date(desde),
          $lte: new Date(hasta),
        },
      };
    }
    
    switch (tipo) {
      case 'sales':
        return await getSalesReport(dateFilter);
      case 'products':
        return await getProductsReport(dateFilter);
      case 'summary':
        return await getSummaryReport();
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de reporte no válido' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error al generar reporte:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte' },
      { status: 500 }
    );
  }
}

async function getSalesReport(dateFilter: any) {
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
  
  return NextResponse.json({
    success: true,
    data: {
      dailySales,
      salesByPaymentMethod,
      totalRevenue,
      totalOrders,
    },
  });
}

async function getProductsReport(dateFilter: any) {
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
  
  return NextResponse.json({
    success: true,
    data: {
      topProducts,
      totalProductsSold: Object.values(productStats).reduce((sum: number, p: any) => sum + p.quantity, 0),
    },
  });
}

async function getSummaryReport() {
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
  
  return NextResponse.json({
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
}
