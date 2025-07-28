import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:4001'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/api/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: 'admin@inventory.com',
          username: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      },
    })
  }),

  http.get(`${API_BASE_URL}/api/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: 'user-1',
        email: 'admin@inventory.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    })
  }),

  // Products endpoints
  http.get(`${API_BASE_URL}/api/products`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Products retrieved successfully',
      data: [
        {
          id: 'product-1',
          name: 'Laptop Pro 15"',
          sku: 'LAP-PRO-15-001',
          unitPrice: '1299.99',
          quantity: 25,
          category: { id: 'cat-1', name: 'Electronics' },
          supplier: { id: 'sup-1', name: 'Tech Supplier' },
        },
        {
          id: 'product-2',
          name: 'Wireless Mouse',
          sku: 'MOU-WIR-001',
          unitPrice: '49.99',
          quantity: 150,
          category: { id: 'cat-1', name: 'Electronics' },
          supplier: { id: 'sup-1', name: 'Tech Supplier' },
        },
      ],
    })
  }),

  http.post(`${API_BASE_URL}/api/products`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: 'product-new',
        name: 'New Product',
        sku: 'NEW-001',
        unitPrice: '99.99',
        quantity: 100,
      },
    })
  }),

  // Users endpoints
  http.get(`${API_BASE_URL}/api/users`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      data: [
        {
          id: 'user-1',
          email: 'admin@inventory.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
        {
          id: 'user-2',
          email: 'sales@inventory.com',
          firstName: 'Sales',
          lastName: 'Person',
          role: 'SALES',
        },
      ],
    })
  }),

  // Categories endpoints
  http.get(`${API_BASE_URL}/api/categories`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: [
        { id: 'cat-1', name: 'Electronics', description: 'Electronic items' },
        { id: 'cat-2', name: 'Clothing', description: 'Clothing items' },
      ],
    })
  }),

  // Suppliers endpoints
  http.get(`${API_BASE_URL}/api/suppliers`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Suppliers retrieved successfully',
      data: [
        { id: 'sup-1', name: 'Tech Supplier', email: 'tech@supplier.com' },
        { id: 'sup-2', name: 'Fashion Supplier', email: 'fashion@supplier.com' },
      ],
    })
  }),

  // Sales endpoints
  http.get(`${API_BASE_URL}/api/sales`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Sales retrieved successfully',
      data: {
        sales: [
          {
            id: 'sale-1',
            saleNumber: 'SALE-001',
            totalAmount: '1299.99',
            paymentMethod: 'CARD',
            createdAt: new Date().toISOString(),
            user: { firstName: 'Sales', lastName: 'Person' },
            saleItems: [
              {
                id: 'item-1',
                quantity: 1,
                unitPrice: '1299.99',
                product: { name: 'Laptop Pro 15"', sku: 'LAP-PRO-15-001' },
              },
            ],
          },
        ],
      },
    })
  }),

  // Returns endpoints
  http.get(`${API_BASE_URL}/api/returns`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Returns retrieved successfully',
      data: [],
    })
  }),

  // Dashboard endpoints
  http.get(`${API_BASE_URL}/api/dashboard/stats`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalProducts: 1234,
        totalUsers: 45,
        totalSales: 89,
        totalRevenue: 347500,
        lowStockItems: 23,
      },
    })
  }),
]
