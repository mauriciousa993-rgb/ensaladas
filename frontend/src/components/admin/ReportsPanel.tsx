'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { buildApiUrl } from '@/lib/api';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface SalesData {
  dailySales: Array<{ date: string; revenue: number; orders: number }>;
  salesByPaymentMethod: { Efectivo: number; PSE: number };
  totalRevenue: number;
  totalOrders: number;
}

interface ProductData {
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    withProtein: number;
  }>;
  totalProductsSold: number;
}

interface SummaryData {
  today: { orders: number; revenue: number; pending: number };
  week: { orders: number; revenue: number; pending: number };
  month: { orders: number; revenue: number; pending: number };
  allTime: { orders: number; revenue: number; pending: number };
  statusDistribution: Record<string, number>;
  activeProducts: number;
}

export default function ReportsPanel() {
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'summary'>('summary');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisMonth' | 'thisYear' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [productsData, setProductsData] = useState<ProductData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const getDateRange = () => {
    const today = new Date();
    let desde: Date;
    let hasta: Date = today;

    switch (dateRange) {
      case '7days':
        desde = subDays(today, 7);
        break;
      case '30days':
        desde = subDays(today, 30);
        break;
      case 'thisMonth':
        desde = startOfMonth(today);
        break;
      case 'thisYear':
        desde = startOfYear(today);
        break;
      case 'custom':
        return {
          desde: customStartDate ? new Date(customStartDate) : subDays(today, 7),
          hasta: customEndDate ? new Date(customEndDate) : today,
        };
      default:
        desde = subDays(today, 7);
    }

    return { desde, hasta };
  };

  const loadSalesReport = async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getDateRange();
      const params = new URLSearchParams({
        tipo: 'sales',
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
      });
      
      const response = await fetch(buildApiUrl(`/api/reports?${params}`));
      const result = await response.json();
      
      if (result.success) {
        setSalesData(result.data);
      }
    } catch (error) {
      console.error('Error cargando reporte de ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsReport = async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getDateRange();
      const params = new URLSearchParams({
        tipo: 'products',
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
      });
      
      const response = await fetch(buildApiUrl(`/api/reports?${params}`));
      const result = await response.json();
      
      if (result.success) {
        setProductsData(result.data);
      }
    } catch (error) {
      console.error('Error cargando reporte de productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tipo: 'summary' });
      const response = await fetch(buildApiUrl(`/api/reports?${params}`));
      const result = await response.json();
      
      if (result.success) {
        setSummaryData(result.data);
      }
    } catch (error) {
      console.error('Error cargando resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSalesReport();
    } else if (activeTab === 'products') {
      loadProductsReport();
    } else if (activeTab === 'summary') {
      loadSummaryReport();
    }
  }, [activeTab, dateRange, customStartDate, customEndDate]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`;
  };

  const renderSummaryCards = () => {
    if (!summaryData) return null;

    const periods = [
      { key: 'today', label: 'Hoy', icon: '📅' },
      { key: 'week', label: 'Esta semana', icon: '📆' },
      { key: 'month', label: 'Este mes', icon: '🗓️' },
      { key: 'allTime', label: 'Histórico', icon: '📊' },
    ] as const;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {periods.map((period) => {
          const data = summaryData[period.key];
          return (
            <div key={period.key} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{period.icon} {period.label}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Órdenes</span>
                  <span className="text-2xl font-bold text-gray-800">{data.orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Recaudado</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(data.revenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Pendiente</span>
                  <span className="text-lg font-semibold text-orange-600">{formatCurrency(data.pending)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatusDistribution = () => {
    if (!summaryData?.statusDistribution) return null;

    const data = Object.entries(summaryData.statusDistribution).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    }));

    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Estados</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const { name, percent } = props;
                  return `${name}: ${((percent || 0) * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderSalesCharts = () => {
    if (!salesData) return null;

    const chartData = salesData.dailySales.map(day => ({
      ...day,
      formattedDate: format(new Date(day.date), 'dd/MM', { locale: es }),
    }));

    const paymentData = [
      { name: 'Efectivo', value: salesData.salesByPaymentMethod.Efectivo },
      { name: 'PSE', value: salesData.salesByPaymentMethod.PSE },
    ];

    return (
      <div className="space-y-6">
        {/* Totales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500 text-sm mb-1">Total Recaudado</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(salesData.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500 text-sm mb-1">Total Órdenes</p>
            <p className="text-3xl font-bold text-blue-600">{salesData.totalOrders}</p>
          </div>
        </div>

        {/* Gráfico de ventas diarias */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Día</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedDate" />
                <YAxis yAxisId="left" orientation="left" stroke="#10B981" />
                <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" />
                <Tooltip 
                  formatter={(value, name) => {
                    const numValue = Number(value || 0);
                    return [
                      name === 'revenue' ? formatCurrency(numValue) : numValue,
                      name === 'revenue' ? 'Ingresos' : 'Órdenes'
                    ];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Ingresos" fill="#10B981" />
                <Bar yAxisId="right" dataKey="orders" name="Órdenes" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de métodos de pago */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Método de Pago</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(Number(value))}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderProductsCharts = () => {
    if (!productsData) return null;

    const chartData = productsData.topProducts.map(product => ({
      ...product,
      proteinRate: product.quantity > 0 ? Math.round((product.withProtein / product.quantity) * 100) : 0,
    }));

    return (
      <div className="space-y-6">
        {/* Total */}
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500 text-sm mb-1">Total Productos Vendidos</p>
          <p className="text-3xl font-bold text-green-600">{productsData.totalProductsSold}</p>
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Productos</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value, name) => {
                    const numValue = Number(value || 0);
                    return [
                      name === 'revenue' ? formatCurrency(numValue) : numValue,
                      name === 'revenue' ? 'Ingresos' : 'Cantidad'
                    ];
                  }}
                />
                <Legend />
                <Bar dataKey="quantity" name="Cantidad vendida" fill="#10B981" />
                <Bar dataKey="revenue" name="Ingresos" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Con Proteína</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productsData.topProducts.map((product, index) => (
                <tr key={product.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{index + 1}. {product.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{product.quantity}</td>
                  <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(product.revenue)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      {product.withProtein} ({Math.round((product.withProtein / product.quantity) * 100)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {[
          { id: 'summary', label: '📊 Resumen', icon: '' },
          { id: 'sales', label: '💰 Ventas', icon: '' },
          { id: 'products', label: '🥗 Productos', icon: '' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros de fecha (solo para sales y products) */}
      {activeTab !== 'summary' && (
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow">
          <span className="text-sm font-medium text-gray-700">Período:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="thisMonth">Este mes</option>
            <option value="thisYear">Este año</option>
            <option value="custom">Personalizado</option>
          </select>
          
          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <span className="text-gray-500">hasta</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
          
          <button
            onClick={activeTab === 'sales' ? loadSalesReport : loadProductsReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Contenido */}
      {!loading && (
        <>
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {renderSummaryCards()}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderStatusDistribution()}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Información General</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Productos activos</span>
                      <span className="text-2xl font-bold text-blue-600">{summaryData?.activeProducts || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'sales' && renderSalesCharts()}
          {activeTab === 'products' && renderProductsCharts()}
        </>
      )}
    </div>
  );
}
