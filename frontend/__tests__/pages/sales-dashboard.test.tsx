import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import SalesDashboard from '../../pages/sales-dashboard'

// Mock the API client
jest.mock('../../utils/api', () => ({
  apiClient: {
    getCurrentUser: jest.fn(),
    getProducts: jest.fn(),
    post: jest.fn(),
  },
}))

// Mock next/router
const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { apiClient } from '../../utils/api'
import toast from 'react-hot-toast'

const mockProducts = [
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
]

const mockUser = {
  id: 'user-1',
  email: 'sales@inventory.com',
  firstName: 'Sales',
  lastName: 'Person',
  role: 'SALES',
}

describe('Sales Dashboard', () => {
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

    // Setup default API responses
    ;(apiClient.getCurrentUser as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    })
    ;(apiClient.getProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProducts,
    })
  })

  it('renders sales dashboard correctly', async () => {
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('🛒 SuperMart POS')).toBeInTheDocument()
    })

    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()
  })

  it('loads and displays products', async () => {
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
      expect(screen.getByText('Wireless Mouse')).toBeInTheDocument()
    })

    expect(screen.getByText('LAP-PRO-15-001')).toBeInTheDocument()
    expect(screen.getByText('MOU-WIR-001')).toBeInTheDocument()
    expect(screen.getByText('₹1299.99')).toBeInTheDocument()
    expect(screen.getByText('₹49.99')).toBeInTheDocument()
  })

  it('filters products based on search', async () => {
    const user = userEvent.setup()
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search products...')
    await user.type(searchInput, 'laptop')

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
      expect(screen.queryByText('Wireless Mouse')).not.toBeInTheDocument()
    })
  })

  it('adds product to cart when clicked', async () => {
    const user = userEvent.setup()
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    const laptopProduct = screen.getByTestId('product-product-1')
    await user.click(laptopProduct)

    await waitFor(() => {
      expect(screen.getByTestId('cart-item-product-1')).toBeInTheDocument()
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    expect(screen.queryByText('Cart is empty')).not.toBeInTheDocument()
  })

  it('updates cart quantity when same product added multiple times', async () => {
    const user = userEvent.setup()
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    const laptopProduct = screen.getByTestId('product-product-1')

    // Add product twice
    await user.click(laptopProduct)
    await user.click(laptopProduct)

    await waitFor(() => {
      expect(screen.getByTestId('cart-item-product-1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // quantity
    })
  })

  it('removes item from cart', async () => {
    const user = userEvent.setup()
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    // Add product to cart
    const laptopProduct = screen.getByText('Laptop Pro 15"').closest('div')
    await user.click(laptopProduct!)

    await waitFor(() => {
      expect(screen.getByText('1 x Laptop Pro 15"')).toBeInTheDocument()
    })

    // Remove from cart
    const removeButton = screen.getByText('Remove')
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.getByText('Cart is empty')).toBeInTheDocument()
    })
  })

  it('processes sale successfully', async () => {
    const user = userEvent.setup()
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: { saleNumber: 'SALE-001' },
    })

    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    // Add product to cart
    const laptopProduct = screen.getByTestId('product-product-1')
    await user.click(laptopProduct)

    await waitFor(() => {
      expect(screen.getByTestId('cart-item-product-1')).toBeInTheDocument()
    })

    // Process sale
    const checkoutButton = screen.getByText('Complete Sale')
    await user.click(checkoutButton)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/sales', expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: 'product-1',
            quantity: 1,
            unitPrice: 1299.99,
          }),
        ]),
        totalAmount: 1299.99,
        paymentMethod: 'CASH',
      }))
    })

    expect(toast.success).toHaveBeenCalledWith('Sale processed successfully! Sale #SALE-001')
    expect(screen.getByText('Cart is empty')).toBeInTheDocument()
  })

  it('handles sale processing error', async () => {
    const user = userEvent.setup()
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Insufficient stock',
    })

    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    // Add product to cart
    const laptopProduct = screen.getByTestId('product-product-1')
    await user.click(laptopProduct)

    await waitFor(() => {
      expect(screen.getByTestId('cart-item-product-1')).toBeInTheDocument()
    })

    // Process sale
    const checkoutButton = screen.getByText('Complete Sale')
    await user.click(checkoutButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Insufficient stock')
    })
  })

  it('redirects non-sales users', async () => {
    ;(apiClient.getCurrentUser as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockUser, role: 'INVENTORY' },
    })

    render(<SalesDashboard />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to login when authentication fails', async () => {
    ;(apiClient.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

    render(<SalesDashboard />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('calculates cart total correctly', async () => {
    const user = userEvent.setup()
    render(<SalesDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Pro 15"')).toBeInTheDocument()
    })

    // Add laptop to cart
    const laptopProduct = screen.getByTestId('product-product-1')
    await user.click(laptopProduct)

    // Add mouse to cart
    const mouseProduct = screen.getByTestId('product-product-2')
    await user.click(mouseProduct)

    await waitFor(() => {
      expect(screen.getByText('₹1349.98')).toBeInTheDocument()
    })
  })
})
