import { apiClient } from '../../utils/api'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('Authentication Headers', () => {
    it('should include authorization header when token exists', async () => {
      const mockToken = 'mock-jwt-token'
      ;(localStorage.getItem as jest.Mock).mockReturnValue(mockToken)
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })

      await apiClient.getProducts()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/api/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should not include authorization header when token does not exist', async () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue(null)
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })

      await apiClient.getProducts()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/api/products',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      )
    })
  })

  describe('Product API', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ]
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockProducts }),
      })

      const result = await apiClient.getProducts()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProducts)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/api/products',
        expect.any(Object)
      )
    })

    it('should handle product fetch error', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await apiClient.getProducts()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to fetch products')
      expect(result.error).toBe('Network error')
    })

    it('should create product successfully', async () => {
      const newProduct = {
        name: 'New Product',
        sku: 'NEW-001',
        unitPrice: 99.99,
        quantity: 100,
        categoryId: 'cat-1',
        supplierId: 'sup-1',
      }
      const mockResponse = { success: true, data: { id: 'new-id', ...newProduct } }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.createProduct(newProduct)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/api/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newProduct),
        })
      )
    })
  })

  describe('Authentication API', () => {
    it('should login successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password' }
      const mockResponse = {
        success: true,
        data: { token: 'jwt-token', user: { id: '1', email: 'test@example.com' } },
      }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.login(credentials)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      )
    })

    it('should handle login error', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ success: false, message: 'Invalid credentials' }),
      })

      const result = await apiClient.login(credentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid credentials')
    })

    it('should get current user successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'ADMIN' }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUser }),
      })

      const result = await apiClient.getCurrentUser()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/api/auth/me',
        expect.any(Object)
      )
    })
  })

  describe('Generic HTTP Methods', () => {
    it('should handle GET requests', async () => {
      const mockData = { test: 'data' }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      })

      const result = await apiClient.get('/test-endpoint')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle POST requests', async () => {
      const postData = { name: 'test' }
      const mockResponse = { success: true, data: { id: '1', ...postData } }
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.post('/test-endpoint', postData)

      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4001/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      )
    })
  })
})
