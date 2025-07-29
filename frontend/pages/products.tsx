import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../utils/api';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  category: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function Products() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    sku: '',
    unitPrice: '',
    costPrice: '',
    wholesalePrice: '',
    mrp: '',
    quantity: '',
    minStockLevel: '',
    maxStockLevel: '',
    categoryId: '',
    supplierId: '',
    productType: 'GENERAL',
    regulatoryStatus: 'APPROVED',
    applicationMethod: 'SPRAY',
    toxicityLevel: 'LOW',
    targetCrops: [],
    applicationRate: '',
    prehiInterval: '',
    reentryInterval: '',
    expiryDate: '',
    batchNumber: '',
    storageConditions: '',
    safetyWarnings: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sku: '',
    unitPrice: '',
    quantity: '',
    minStockLevel: '',
    maxStockLevel: '',
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchProducts(token);
      fetchCategories();
      fetchSuppliers();
    } catch (err) {
      console.error('Error parsing user data:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchProducts = async (token: string) => {
    try {
      const result = await apiClient.getProducts();

      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(result.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await apiClient.getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await apiClient.getSuppliers();
      if (result.success && result.data) {
        setSuppliers(result.data);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        ...addForm,
        unitPrice: parseFloat(addForm.unitPrice),
        costPrice: parseFloat(addForm.costPrice) || 0,
        wholesalePrice: parseFloat(addForm.wholesalePrice) || null,
        mrp: parseFloat(addForm.mrp) || null,
        quantity: parseInt(addForm.quantity),
        minStockLevel: parseInt(addForm.minStockLevel),
        maxStockLevel: parseInt(addForm.maxStockLevel) || null,
        prehiInterval: addForm.prehiInterval ? parseInt(addForm.prehiInterval) : null,
        reentryInterval: addForm.reentryInterval ? parseInt(addForm.reentryInterval) : null,
        expiryDate: addForm.expiryDate ? new Date(addForm.expiryDate).toISOString() : null,
        targetCrops: addForm.targetCrops,
      };

      const result = await apiClient.createProduct(productData);

      if (result.success) {
        alert('Product added successfully!');
        setShowAddModal(false);
        // Reset form
        setAddForm({
          name: '',
          description: '',
          sku: '',
          unitPrice: '',
          costPrice: '',
          wholesalePrice: '',
          mrp: '',
          quantity: '',
          minStockLevel: '',
          maxStockLevel: '',
          categoryId: '',
          supplierId: '',
          productType: 'GENERAL',
          regulatoryStatus: 'APPROVED',
          applicationMethod: 'SPRAY',
          toxicityLevel: 'LOW',
          targetCrops: [],
          applicationRate: '',
          prehiInterval: '',
          reentryInterval: '',
          expiryDate: '',
          batchNumber: '',
          storageConditions: '',
          safetyWarnings: '',
        });
        // Refresh products list
        const token = localStorage.getItem('token');
        if (token) {
          fetchProducts(token);
        }
      } else {
        alert(result.message || 'Failed to add product');
      }
    } catch (err) {
      alert('Network error while adding product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      sku: product.sku,
      unitPrice: product.unitPrice.toString(),
      quantity: product.quantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      maxStockLevel: product.maxStockLevel.toString(),
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const updateData = {
        ...editForm,
        unitPrice: parseFloat(editForm.unitPrice),
        quantity: parseInt(editForm.quantity),
        minStockLevel: parseInt(editForm.minStockLevel),
        maxStockLevel: parseInt(editForm.maxStockLevel),
      };

      const result = await apiClient.updateProduct(editingProduct.id, updateData);

      if (result.success) {
        alert('Product updated successfully!');
        setShowEditModal(false);
        setEditingProduct(null);
        // Refresh products list
        const token = localStorage.getItem('token');
        if (token) {
          fetchProducts(token);
        }
      } else {
        alert(result.message || 'Failed to update product');
      }
    } catch (err) {
      alert('Network error while updating product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const result = await apiClient.deleteProduct(productId);

      if (result.success) {
        alert('Product deleted successfully!');
        // Refresh products list
        const token = localStorage.getItem('token');
        if (token) {
          fetchProducts(token);
        }
      } else {
        alert(result.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Network error while deleting product');
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity <= minStock) return { status: 'Low Stock', color: 'text-red-600 bg-red-100' };
    if (quantity <= minStock * 1.5) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Products - Inventory Management</title>
        <meta name="description" content="Manage your product inventory" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600">
                  Inventory Management
                </Link>
                <div className="hidden md:flex space-x-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">
                    Dashboard
                  </Link>
                  <Link href="/products" className="text-blue-600 dark:text-blue-400 px-3 py-2 rounded-md font-medium">
                    Products
                  </Link>
                  <Link href="/analytics" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">
                    Analytics
                  </Link>
                  <Link href="/predictions" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">
                    AI Predictions
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {user?.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your product inventory and stock levels
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Product
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.minStockLevel);
                return (
                  <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {product.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SKU:</span>
                        <span className="text-gray-900 dark:text-white">{product.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="text-gray-900 dark:text-white">₹{Number(product.unitPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quantity:</span>
                        <span className="text-gray-900 dark:text-white">{product.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-gray-900 dark:text-white">{product.category?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Supplier:</span>
                        <span className="text-gray-900 dark:text-white">{product.supplier?.name || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Product</h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.unitPrice}
                      onChange={(e) => setEditForm({...editForm, unitPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      value={editForm.minStockLevel}
                      onChange={(e) => setEditForm({...editForm, minStockLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Stock Level
                    </label>
                    <input
                      type="number"
                      value={editForm.maxStockLevel}
                      onChange={(e) => setEditForm({...editForm, maxStockLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Update Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Agricultural Product</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={addForm.sku}
                      onChange={(e) => setAddForm({...addForm, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({...addForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Category and Supplier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={addForm.categoryId}
                      onChange={(e) => setAddForm({...addForm, categoryId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supplier
                    </label>
                    <select
                      value={addForm.supplierId}
                      onChange={(e) => setAddForm({...addForm, supplierId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.costPrice}
                      onChange={(e) => setAddForm({...addForm, costPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.unitPrice}
                      onChange={(e) => setAddForm({...addForm, unitPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wholesale Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.wholesalePrice}
                      onChange={(e) => setAddForm({...addForm, wholesalePrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      MRP
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addForm.mrp}
                      onChange={(e) => setAddForm({...addForm, mrp: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Stock Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={addForm.quantity}
                      onChange={(e) => setAddForm({...addForm, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Stock Level *
                    </label>
                    <input
                      type="number"
                      value={addForm.minStockLevel}
                      onChange={(e) => setAddForm({...addForm, minStockLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Stock Level
                    </label>
                    <input
                      type="number"
                      value={addForm.maxStockLevel}
                      onChange={(e) => setAddForm({...addForm, maxStockLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Agricultural Specific Fields */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Agricultural Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Type
                      </label>
                      <select
                        value={addForm.productType}
                        onChange={(e) => setAddForm({...addForm, productType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="GENERAL">General</option>
                        <option value="PESTICIDE">Pesticide</option>
                        <option value="FERTILIZER">Fertilizer</option>
                        <option value="HERBICIDE">Herbicide</option>
                        <option value="FUNGICIDE">Fungicide</option>
                        <option value="INSECTICIDE">Insecticide</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Application Method
                      </label>
                      <select
                        value={addForm.applicationMethod}
                        onChange={(e) => setAddForm({...addForm, applicationMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="SPRAY">Spray</option>
                        <option value="GRANULAR">Granular</option>
                        <option value="LIQUID">Liquid</option>
                        <option value="POWDER">Powder</option>
                        <option value="BROADCAST">Broadcast</option>
                        <option value="FOLIAR">Foliar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Toxicity Level
                      </label>
                      <select
                        value={addForm.toxicityLevel}
                        onChange={(e) => setAddForm({...addForm, toxicityLevel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="HIGH">High</option>
                        <option value="EXTREMELY_HIGH">Extremely High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Application Rate
                      </label>
                      <input
                        type="text"
                        value={addForm.applicationRate}
                        onChange={(e) => setAddForm({...addForm, applicationRate: e.target.value})}
                        placeholder="e.g., 2-3 ml per liter"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={addForm.batchNumber}
                        onChange={(e) => setAddForm({...addForm, batchNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={addForm.expiryDate}
                        onChange={(e) => setAddForm({...addForm, expiryDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pre-harvest Interval (days)
                      </label>
                      <input
                        type="number"
                        value={addForm.prehiInterval}
                        onChange={(e) => setAddForm({...addForm, prehiInterval: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Safety Warnings
                    </label>
                    <textarea
                      value={addForm.safetyWarnings}
                      onChange={(e) => setAddForm({...addForm, safetyWarnings: e.target.value})}
                      rows={2}
                      placeholder="Safety precautions and warnings"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Storage Conditions
                    </label>
                    <textarea
                      value={addForm.storageConditions}
                      onChange={(e) => setAddForm({...addForm, storageConditions: e.target.value})}
                      rows={2}
                      placeholder="Storage requirements and conditions"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
