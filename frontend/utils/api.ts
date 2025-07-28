const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const ML_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('4001', '4003') || 'http://localhost:4003';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      // Check if response has content
      const text = await response.text();

      if (!text) {
        return {
          success: !response.ok,
          message: response.ok ? 'Success' : `HTTP ${response.status}`,
          error: response.ok ? undefined : `Empty response with status ${response.status}`,
        };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        return {
          success: false,
          message: 'Invalid JSON response',
          error: `Server returned: ${text.substring(0, 100)}...`,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'An error occurred',
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message || 'Success',
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Network or parsing error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication APIs
  async login(credentials: { email: string; password: string } | string, password?: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      // Handle both object and separate parameter formats
      const loginData = typeof credentials === 'string'
        ? { email: credentials, password: password! }
        : credentials;

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Employee Management APIs
  async getEmployees(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch employees',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createEmployee(employeeData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create employee',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateEmployee(id: string, employeeData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update employee',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteEmployee(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete employee',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Product APIs
  async getProducts(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch products',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createProduct(productData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateProduct(id: string, productData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Category APIs
  async getCategories(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Supplier APIs
  async getSuppliers(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Prediction APIs (using backend mock endpoints)
  async getDemandPrediction(productId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/demand/${productId}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getReorderPrediction(productId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/reorder/${productId}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPriceOptimization(productId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/price-optimization/${productId}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Sales APIs
  async getSales(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch sales',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createSale(saleData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create sale',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSalesTrends(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/analytics/sales-trends`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getInventoryOptimization(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/analytics/inventory-optimization`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFinancialInsights(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/analytics/financial-insights`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAnomalyDetection(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/analytics/anomaly-detection`);
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Generic HTTP methods for axios-like usage
  async get(url: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async post(url: string, data?: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async put(url: string, data?: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async delete(url: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Returns API methods
  async getReturns(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/returns`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch returns',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createReturn(returnData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/returns`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(returnData),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create return request',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async approveReturn(returnId: string, adminNotes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/returns/${returnId}/approve`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ adminNotes }),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to approve return request',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async rejectReturn(returnId: string, adminNotes: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/returns/${returnId}/reject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ adminNotes }),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reject return request',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Reports API methods
  async getTransactionLogs(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/api/reports/transactions?${params}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch transaction logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFinancialReport(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${API_BASE_URL}/api/reports/financial?${params}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch financial report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDashboardSummary(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/dashboard`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch dashboard summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async exportTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.type) params.append('type', filters.type);

      const response = await fetch(`${API_BASE_URL}/api/reports/export?${params}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      return response.blob();
    } catch (error) {
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
