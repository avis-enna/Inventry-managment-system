import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../utils/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  category: {
    name: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: {
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    unitPrice: number;
  }[];
}

export default function SalesDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [sales, setSales] = useState<Sale[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchSales();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success) {
        const userData = response.data;
        if (userData.role !== 'SALES' && userData.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }
        setUser(userData);
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await apiClient.getProducts();
      console.log('Products response:', response);
      if (response.success && response.data) {
        console.log('Setting products:', response.data.length, 'products');
        setProducts(response.data);
      } else {
        console.error('Products fetch failed:', response);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await apiClient.getSales();
      console.log('Sales response:', response);
      if (response.success && response.data) {
        // Handle nested response structure {sales: [], pagination: {}}
        const salesData = response.data.sales || response.data;
        if (Array.isArray(salesData)) {
          setSales(salesData);
        } else {
          console.warn('Sales data is not an array:', salesData);
          setSales([]);
        }
      } else {
        console.warn('Sales response not successful:', response);
        setSales([]);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    }
  };

  const printReceipt = (sale: Sale) => {
    const receiptWindow = window.open('', '_blank', 'width=300,height=600');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.saleNumber}</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 10px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; margin: 2px 0; }
          .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🛒 SuperMart POS</h2>
          <p>Transaction ID: ${sale.saleNumber || sale.id}</p>
          <p>Date: ${new Date(sale.createdAt).toLocaleDateString()} ${new Date(sale.createdAt).toLocaleTimeString()}</p>
          <p>Cashier: ${user?.firstName} ${user?.lastName}</p>
        </div>

        <div class="items">
          ${(sale.saleItems || sale.items || []).map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product.name}</span>
              <span>₹${parseFloat(item.total || item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div class="item">
            <span>Payment Method:</span>
            <span>${sale.paymentMethod}</span>
          </div>
          <div class="item">
            <span>TOTAL:</span>
            <span>₹${parseFloat(sale.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p>Keep this receipt for returns/exchanges</p>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const updateCartItem = (productId: string, quantity: number, discount: number = 0) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity, discount }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = (item.product.unitPrice * item.quantity) - item.discount;
      return total + itemTotal;
    }, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount,
        })),
        paymentMethod,
        notes: `POS Sale by ${user?.firstName} ${user?.lastName}`,
      };

      const response = await apiClient.createSale(saleData);
      if (response.success) {
        alert('Sale completed successfully!');
        setCart([]);
        fetchProducts(); // Refresh product quantities
        fetchSales(); // Refresh sales history
      } else {
        alert(response.message || 'Error processing sale');
      }
    } catch (error: any) {
      console.error('Sale processing error:', error);
      alert(error.response?.data?.message || 'Error processing sale');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <title>Sales Dashboard - SuperMart POS</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {user?.role}
                </span>
                <button
                  onClick={() => setShowTransactions(!showTransactions)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {showTransactions ? 'Hide' : 'Show'} Transactions
                </button>
                <button
                  onClick={() => router.push('/returns')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Return Requests
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    router.push('/login');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                  <div className="w-64">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        data-testid={`product-${product.id}`}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addToCart(product)}
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{product.sku}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-green-600">
                            ₹{Number(product.unitPrice).toFixed(2)}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            product.quantity > 10
                              ? 'bg-green-100 text-green-800'
                              : product.quantity > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Stock: {product.quantity}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">
                        {products.length === 0 ? 'Loading products...' : 'No products found matching your search.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shopping Cart</h2>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto" data-testid="cart">
                      {cart.map((item) => (
                        <div key={item.product.id} className="border-b border-gray-200 pb-4" data-testid={`cart-item-${item.product.id}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <button
                              onClick={() => updateCartItem(item.product.id, item.quantity - 1, item.discount)}
                              className="w-8 h-8 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-bold text-lg bg-white border border-gray-300 rounded px-2 py-1">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.product.id, item.quantity + 1, item.discount)}
                              className="w-8 h-8 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm text-gray-600">
                            ₹{Number(item.product.unitPrice).toFixed(2)} × {item.quantity} = ₹{((item.product.unitPrice * item.quantity) - item.discount).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          ₹{calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="UPI">UPI</option>
                          <option value="WALLET">Digital Wallet</option>
                        </select>
                      </div>

                      <button
                        onClick={processSale}
                        disabled={processing || cart.length === 0}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                      >
                        {processing ? 'Processing...' : 'Complete Sale'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History Section */}
          {showTransactions && (
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Transaction History</h2>
                {sales.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No transactions found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {sale.saleNumber || sale.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {(sale.saleItems || sale.items || []).map((item, index) => (
                                <div key={index} className="mb-1">
                                  {item.quantity}x {item.product.name}
                                </div>
                              ))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.paymentMethod}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{parseFloat(sale.totalAmount || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => printReceipt(sale)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                >
                                  Print Receipt
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
