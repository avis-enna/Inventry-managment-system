import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../utils/api';

interface ReturnRequest {
  id: string;
  returnNumber: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  totalAmount: number;
  createdAt: string;
  adminNotes?: string;
  sale: {
    saleNumber: string;
    createdAt: string;
  };
  returnItems: {
    id: string;
    quantity: number;
    reason?: string;
    condition?: string;
    product: {
      name: string;
      sku: string;
    };
  }[];
}

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  createdAt: string;
  saleItems: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }[];
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function Returns() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState<{[key: string]: {quantity: number, reason: string, condition: string}}>({});

  useEffect(() => {
    checkAuth();
    fetchReturnRequests();
    fetchSales();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'SALES' && parsedUser.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const fetchReturnRequests = async () => {
    try {
      const response = await apiClient.getReturns();
      if (response.success) {
        setReturnRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching return requests:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await apiClient.getSales();
      if (response.success) {
        setSales(response.data?.sales || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!selectedSale || !returnReason) {
      alert('Please select a sale and provide a reason');
      return;
    }

    const items = Object.entries(returnItems)
      .filter(([_, item]) => item.quantity > 0)
      .map(([productId, item]) => ({
        productId,
        quantity: item.quantity,
        reason: item.reason,
        condition: item.condition,
      }));

    if (items.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    try {
      const response = await apiClient.createReturn({
        saleId: selectedSale.id,
        reason: returnReason,
        items,
      });

      if (response.success) {
        alert('Return request created successfully!');
        setShowCreateForm(false);
        setSelectedSale(null);
        setReturnReason('');
        setReturnItems({});
        fetchReturnRequests();
      } else {
        alert(response.message || 'Error creating return request');
      }
    } catch (error: any) {
      alert('Error creating return request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Return Requests - SuperMart</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Return Requests</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {user?.role}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create Return Request
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/sales-dashboard')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Back to POS
                </button>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Return Requests List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Return Requests</h2>
            
            {returnRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No return requests found</p>
            ) : (
              <div className="space-y-4">
                {returnRequests.map((returnRequest) => (
                  <div key={returnRequest.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{returnRequest.returnNumber}</h3>
                        <p className="text-sm text-gray-500">Sale: {returnRequest.sale.saleNumber}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(returnRequest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(returnRequest.status)}`}>
                          {returnRequest.status}
                        </span>
                        <p className="text-lg font-semibold text-gray-900 mt-2">
                          ₹{Number(returnRequest.totalAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Reason:</p>
                      <p className="text-sm text-gray-600">{returnRequest.reason}</p>
                    </div>

                    {returnRequest.adminNotes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                        <p className="text-sm text-gray-600">{returnRequest.adminNotes}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                      <div className="space-y-2">
                        {returnRequest.returnItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>{item.product.name} ({item.product.sku})</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Return Request Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Create Return Request</h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedSale(null);
                      setReturnReason('');
                      setReturnItems({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Select Sale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Sale
                    </label>
                    <select
                      value={selectedSale?.id || ''}
                      onChange={(e) => {
                        const sale = sales.find(s => s.id === e.target.value);
                        setSelectedSale(sale || null);
                        setReturnItems({});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select a sale...</option>
                      {sales.map((sale) => (
                        <option key={sale.id} value={sale.id}>
                          {sale.saleNumber} - ₹{Number(sale.totalAmount).toFixed(2)} ({new Date(sale.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Return Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Reason
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Explain why the items are being returned..."
                    />
                  </div>

                  {/* Select Items */}
                  {selectedSale && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Items to Return
                      </label>
                      <div className="space-y-3">
                        {selectedSale.saleItems.map((saleItem) => (
                          <div key={saleItem.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{saleItem.product.name}</span>
                              <span className="text-sm text-gray-500">Max: {saleItem.quantity}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                min="0"
                                max={saleItem.quantity}
                                placeholder="Quantity"
                                value={returnItems[saleItem.product.id]?.quantity || ''}
                                onChange={(e) => setReturnItems({
                                  ...returnItems,
                                  [saleItem.product.id]: {
                                    ...returnItems[saleItem.product.id],
                                    quantity: parseInt(e.target.value) || 0,
                                  }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Reason"
                                value={returnItems[saleItem.product.id]?.reason || ''}
                                onChange={(e) => setReturnItems({
                                  ...returnItems,
                                  [saleItem.product.id]: {
                                    ...returnItems[saleItem.product.id],
                                    reason: e.target.value,
                                  }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <select
                                value={returnItems[saleItem.product.id]?.condition || ''}
                                onChange={(e) => setReturnItems({
                                  ...returnItems,
                                  [saleItem.product.id]: {
                                    ...returnItems[saleItem.product.id],
                                    condition: e.target.value,
                                  }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Condition</option>
                                <option value="NEW">New</option>
                                <option value="USED">Used</option>
                                <option value="DAMAGED">Damaged</option>
                                <option value="DEFECTIVE">Defective</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setSelectedSale(null);
                        setReturnReason('');
                        setReturnItems({});
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateReturn}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Create Return Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
