import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../utils/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalTransactions: number;
    averageTransactionValue: number;
  };
  breakdown: {
    sales: { count: number; revenue: number; profit: number };
    returns: { count: number; amount: number };
    refunds: { count: number; amount: number };
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
}

interface TransactionLog {
  id: string;
  timestamp: string;
  type: string;
  amount: number;
  cost?: number;
  profit?: number;
  reference: string;
  userName: string;
  userRole: string;
  details: any;
}

export default function Reports() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month'>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions' | 'financial'>('overview');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [reportPeriod, user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Check if user has permission to view reports (allow all authenticated users)
      if (!parsedUser.role) {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      if (reportPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setMonth(endDate.getMonth() - 1);
      }

      const salesResponse = await apiClient.getSales();
      const productsResponse = await apiClient.getProducts();

      if (salesResponse.success && productsResponse.success) {
        const sales = salesResponse.data?.sales || salesResponse.data || [];
        const products = productsResponse.data || [];

        let filteredSales = sales.filter((sale: any) => {
          const saleDate = new Date(sale.createdAt);
          const isInDateRange = saleDate >= startDate && saleDate <= endDate;

          if (user?.role === 'SALES') {
            return isInDateRange && sale.userId === user.id;
          }

          return isInDateRange;
        });

        const totalSales = filteredSales.length;
        const totalRevenue = filteredSales.reduce((sum: number, sale: any) =>
          sum + parseFloat(sale.totalAmount || 0), 0);

        const lowStockItems = products.filter((product: any) =>
          product.quantity <= product.minStockLevel).length;

        const productSales: { [key: string]: { name: string; totalSold: number; revenue: number } } = {};

        filteredSales.forEach((sale: any) => {
          (sale.saleItems || sale.items || []).forEach((item: any) => {
            const productId = item.product.id;
            if (!productSales[productId]) {
              productSales[productId] = {
                name: item.product.name,
                totalSold: 0,
                revenue: 0
              };
            }
            productSales[productId].totalSold += item.quantity;
            productSales[productId].revenue += parseFloat(item.total || item.unitPrice * item.quantity);
          });
        });

        const topSellingProducts = Object.entries(productSales)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 5);

        const salesByDay: { [key: string]: { sales: number; revenue: number } } = {};
        filteredSales.forEach((sale: any) => {
          const date = new Date(sale.createdAt).toISOString().split('T')[0];
          if (!salesByDay[date]) {
            salesByDay[date] = { sales: 0, revenue: 0 };
          }
          salesByDay[date].sales += 1;
          salesByDay[date].revenue += parseFloat(sale.totalAmount || 0);
        });

        const salesByDayArray = Object.entries(salesByDay)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setReportData({
          totalSales,
          totalRevenue,
          totalProducts: products.length,
          lowStockItems,
          topSellingProducts,
          salesByDay: salesByDayArray
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const roleSpecificNote = user?.role === 'SALES'
      ? '\nNOTE: This report shows only your personal sales data.'
      : '\nNOTE: This report shows company-wide data.';

    const reportContent = `
INVENTORY MANAGEMENT REPORT
Period: ${reportPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
Generated: ${new Date().toLocaleString()}
User: ${user?.firstName} ${user?.lastName} (${user?.role})${roleSpecificNote}

SUMMARY METRICS:
- Total Sales: ${reportData.totalSales}
- Total Revenue: ₹${reportData.totalRevenue.toFixed(2)}
- Total Products: ${reportData.totalProducts}
- Low Stock Items: ${reportData.lowStockItems}

TOP SELLING PRODUCTS:
${reportData.topSellingProducts.map((product, index) =>
  `${index + 1}. ${product.name} - ${product.totalSold} units sold (₹${product.revenue.toFixed(2)})`
).join('\n')}

DAILY SALES:
${reportData.salesByDay.map(day =>
  `${day.date}: ${day.sales} sales, ₹${day.revenue.toFixed(2)} revenue`
).join('\n')}`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchFinancialReport = async () => {
    if (user?.role !== 'ADMIN') return;

    try {
      setLoadingFinancial(true);
      const response = await apiClient.getFinancialReport();
      if (response.success) {
        setFinancialReport(response.data);
      }
    } catch (error) {
      console.error('Error fetching financial report:', error);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const fetchTransactionLogs = async () => {
    if (user?.role !== 'ADMIN') return;

    try {
      const response = await apiClient.getTransactionLogs({ limit: 50 });
      if (response.success) {
        setTransactionLogs(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transaction logs:', error);
    }
  };

  const exportTransactions = async () => {
    if (user?.role !== 'ADMIN') return;

    try {
      const blob = await apiClient.exportTransactions();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reports & Analytics - Inventory Management</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                  user?.role === 'SALES' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role}
                </span>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          {user?.role === 'ADMIN' && (
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setSelectedTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTab('financial');
                      if (!financialReport) fetchFinancialReport();
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'financial'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Financial Reports
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTab('transactions');
                      if (transactionLogs.length === 0) fetchTransactionLogs();
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'transactions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Transaction Logs
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {selectedTab === 'overview' && (
            <>
              {/* Report Controls */}
          <div className="group relative mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Report Configuration</h3>
                    <p className="text-sm text-gray-600">Customize your analytics dashboard</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={exportReport}
                  disabled={!reportData}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="relative">Export Report</span>
                </button>
              </div>

              <div className="mt-8 flex flex-col lg:flex-row lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-semibold text-gray-700">📊 Report Period:</label>
                  <div className="relative">
                    <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1.5 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setReportPeriod('week')}
                        className={`relative px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                          reportPeriod === 'week'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        <span className="relative z-10">📅 Weekly (7 Days)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportPeriod('month')}
                        className={`relative px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                          reportPeriod === 'month'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        <span className="relative z-10">📊 Monthly (30 Days)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateReport}
                  disabled={generatingReport}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {generatingReport ? (
                    <>
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative">Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="relative">Refresh Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report Dashboard */}
          {reportData && (
            <>
              {/* Enhanced Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* Total Sales Card */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative backdrop-blur-xl bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {reportData.totalSales}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Total Sales</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {reportPeriod === 'week' ? 'Last 7 days' : 'Last 30 days'}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-2xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Revenue Card */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative backdrop-blur-xl bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ₹{reportData.totalRevenue.toFixed(2)}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Total Revenue</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {reportPeriod === 'week' ? 'Last 7 days' : 'Last 30 days'}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-2xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Products Card */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative backdrop-blur-xl bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {reportData.totalProducts}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Total Products</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          In inventory
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Low Stock Alert Card */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative backdrop-blur-xl bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                          {reportData.lowStockItems}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Low Stock Alert</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                          Needs attention
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-2xl">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!reportData && !generatingReport && (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Your First Report</h3>
              <p className="text-gray-600 mb-4">Select a time period and click "Refresh Report" to view your business analytics.</p>
            </div>
          )}
            </>
          )}

          {/* Financial Reports Tab */}
          {selectedTab === 'financial' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
                <button
                  type="button"
                  onClick={exportTransactions}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Export CSV
                </button>
              </div>

              {loadingFinancial ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading financial report...</p>
                </div>
              ) : financialReport ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Summary Cards */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                      <p className="text-3xl font-bold text-green-600">₹{financialReport.summary.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
                      <p className="text-3xl font-bold text-red-600">₹{financialReport.summary.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
                      <p className="text-3xl font-bold text-blue-600">₹{financialReport.summary.totalProfit.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                      <p className="text-3xl font-bold text-gray-900">{financialReport.summary.totalTransactions}</p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Sales ({financialReport.breakdown.sales.count})</span>
                        <span className="font-medium">₹{financialReport.breakdown.sales.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Returns ({financialReport.breakdown.returns.count})</span>
                        <span className="font-medium text-red-600">-₹{financialReport.breakdown.returns.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {financialReport.topProducts.slice(0, 5).map((product, index) => (
                        <div key={product.productId} className="flex justify-between">
                          <span className="text-sm">{index + 1}. {product.productName}</span>
                          <span className="text-sm font-medium">₹{product.revenue.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-600">No financial data available</p>
                  <button
                    type="button"
                    onClick={fetchFinancialReport}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Load Financial Report
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Transaction Logs Tab */}
          {selectedTab === 'transactions' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Transaction Logs</h2>
                <button
                  type="button"
                  onClick={fetchTransactionLogs}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Refresh
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionLogs.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'SALE' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'RETURN' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transactionLogs.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No transaction logs found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
