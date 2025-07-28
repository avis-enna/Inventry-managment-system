import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../../utils/api';

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
  requester: {
    firstName: string;
    lastName: string;
    email: string;
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

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function AdminReturns() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    checkAuth();
    fetchReturnRequests();
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
      if (parsedUser.role !== 'ADMIN') {
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
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId: string) => {
    try {
      const response = await apiClient.approveReturn(returnId, adminNotes);
      if (response.success) {
        alert('Return request approved successfully!');
        setSelectedReturn(null);
        setAdminNotes('');
        fetchReturnRequests();
      } else {
        alert(response.message || 'Error approving return request');
      }
    } catch (error: any) {
      alert('Error approving return request');
    }
  };

  const handleReject = async (returnId: string) => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await apiClient.rejectReturn(returnId, adminNotes);
      if (response.success) {
        alert('Return request rejected successfully!');
        setSelectedReturn(null);
        setAdminNotes('');
        fetchReturnRequests();
      } else {
        alert(response.message || 'Error rejecting return request');
      }
    } catch (error: any) {
      alert('Error rejecting return request');
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

  const filteredReturns = returnRequests.filter(returnRequest => {
    if (!filterStatus) return true;
    return returnRequest.status === filterStatus;
  });

  const pendingCount = returnRequests.filter(r => r.status === 'PENDING').length;
  const approvedCount = returnRequests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = returnRequests.filter(r => r.status === 'REJECTED').length;

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
        <title>Return Management - SuperMart Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Return Management</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {user?.role}
                </span>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-600">{returnRequests.length}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Returns</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-green-600">{approvedCount}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Return Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Return Requests</h2>
            
            {filteredReturns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No return requests found</p>
            ) : (
              <div className="space-y-4">
                {filteredReturns.map((returnRequest) => (
                  <div key={returnRequest.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{returnRequest.returnNumber}</h3>
                        <p className="text-sm text-gray-500">
                          Requested by: {returnRequest.requester.firstName} {returnRequest.requester.lastName}
                        </p>
                        <p className="text-sm text-gray-500">Sale: {returnRequest.sale.saleNumber}</p>
                        <p className="text-sm text-gray-500">
                          Date: {new Date(returnRequest.createdAt).toLocaleDateString()}
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

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                      <div className="space-y-2">
                        {returnRequest.returnItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <span>{item.product.name} ({item.product.sku})</span>
                            <div className="text-right">
                              <span>Qty: {item.quantity}</span>
                              {item.condition && <span className="ml-2 text-gray-500">({item.condition})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {returnRequest.adminNotes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                        <p className="text-sm text-gray-600">{returnRequest.adminNotes}</p>
                      </div>
                    )}

                    {returnRequest.status === 'PENDING' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedReturn(returnRequest)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Review Return Request - {selectedReturn.returnNumber}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedReturn(null);
                      setAdminNotes('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Requested by:</p>
                    <p className="text-sm text-gray-600">
                      {selectedReturn.requester.firstName} {selectedReturn.requester.lastName} ({selectedReturn.requester.email})
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-sm text-gray-600">{selectedReturn.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Amount:</p>
                    <p className="text-lg font-semibold text-gray-900">₹{Number(selectedReturn.totalAmount).toFixed(2)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Items to Return:</p>
                    <div className="space-y-2">
                      {selectedReturn.returnItems.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item.product.name}</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            SKU: {item.product.sku}
                            {item.condition && ` | Condition: ${item.condition}`}
                            {item.reason && ` | Reason: ${item.reason}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes {selectedReturn.status === 'PENDING' && '(Required for rejection)'}
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setSelectedReturn(null);
                      setAdminNotes('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedReturn.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReturn.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
