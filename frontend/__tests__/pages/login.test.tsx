import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import Login from '../../pages/login'

// Mock the API client
jest.mock('../../utils/api', () => ({
  apiClient: {
    login: jest.fn(),
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
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  toast: mockToast,
}))

import { apiClient } from '../../utils/api'

describe('Login Page', () => {
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

  it('renders login form correctly', () => {
    render(<Login />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your inventory management system')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders demo account buttons', () => {
    render(<Login />)

    expect(screen.getByText('Demo Accounts')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Inventory Manager')).toBeInTheDocument()
    expect(screen.getByText('Sales Person')).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    const mockLoginResponse = {
      success: true,
      data: {
        token: 'mock-token',
        user: { id: '1', email: 'admin@inventory.com', role: 'ADMIN' },
      },
    }
    ;(apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse)

    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@inventory.com')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith({
        email: 'admin@inventory.com',
        password: 'admin123',
      })
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token')
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(mockLoginResponse.data.user)
    )
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('handles login failure', async () => {
    const user = userEvent.setup()
    const mockLoginResponse = {
      success: false,
      message: 'Invalid credentials',
    }
    ;(apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse)

    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@inventory.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Check that error is displayed in the UI
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    expect(localStorage.setItem).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('handles network error during login', async () => {
    const user = userEvent.setup()
    ;(apiClient.login as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@inventory.com')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // Check for HTML5 validation
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('handles demo account selection', async () => {
    const user = userEvent.setup()
    const mockLoginResponse = {
      success: true,
      data: {
        token: 'mock-token',
        user: { id: '1', email: 'admin@inventory.com', role: 'ADMIN' },
      },
    }
    ;(apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse)

    render(<Login />)

    const adminDemoButton = screen.getByText('Admin').closest('button')
    await user.click(adminDemoButton!)

    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith({
        email: 'admin@inventory.com',
        password: 'admin123',
      })
    })
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })
    ;(apiClient.login as jest.Mock).mockReturnValue(loginPromise)

    render(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@inventory.com')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)

    // Check if button is disabled during loading
    expect(submitButton).toBeDisabled()

    // Resolve the login
    resolveLogin!({
      success: true,
      data: { token: 'token', user: { id: '1', role: 'ADMIN' } },
    })

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })
})
