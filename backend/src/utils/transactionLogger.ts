import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface TransactionLog {
  id: string;
  timestamp: string;
  type: 'SALE' | 'RETURN' | 'REFUND' | 'STOCK_ADJUSTMENT' | 'PURCHASE';
  amount: number;
  cost?: number; // Cost of goods sold
  profit?: number; // Calculated profit
  reference: string; // Sale number, return number, etc.
  userId: string;
  userName: string;
  userRole: string;
  details: {
    items?: Array<{
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      unitCost?: number;
      discount: number;
      total: number;
    }>;
    paymentMethod?: string;
    customerId?: string;
    customerName?: string;
    notes?: string;
    originalSaleId?: string; // For returns
    status?: string;
  };
  metadata: {
    ip?: string;
    userAgent?: string;
    location?: string;
  };
}

class TransactionLogger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'transactions');
    this.logFile = path.join(this.logDir, 'transactions.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create transaction log directory:', error);
    }
  }

  private generateId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  async logTransaction(transaction: Omit<TransactionLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logEntry: TransactionLog = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...transaction,
      };

      // Write to transaction log file
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);

      // Also log to winston for monitoring
      logger.info('Transaction logged', {
        transactionId: logEntry.id,
        type: logEntry.type,
        amount: logEntry.amount,
        reference: logEntry.reference,
        user: logEntry.userName,
      });

    } catch (error) {
      logger.error('Failed to log transaction:', error);
      throw error;
    }
  }

  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
    limit?: number;
  }): Promise<TransactionLog[]> {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const fileContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = fileContent.trim().split('\n').filter(line => line.trim());
      
      let transactions: TransactionLog[] = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Apply filters
      if (filters) {
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          transactions = transactions.filter(t => new Date(t.timestamp) >= startDate);
        }

        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          transactions = transactions.filter(t => new Date(t.timestamp) <= endDate);
        }

        if (filters.type) {
          transactions = transactions.filter(t => t.type === filters.type);
        }

        if (filters.userId) {
          transactions = transactions.filter(t => t.userId === filters.userId);
        }

        if (filters.limit) {
          transactions = transactions.slice(-filters.limit);
        }
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return transactions;
    } catch (error) {
      logger.error('Failed to read transactions:', error);
      return [];
    }
  }

  async generateFinancialReport(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
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
  }> {
    const transactions = await this.getTransactions(filters);

    const summary = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalTransactions: transactions.length,
      averageTransactionValue: 0,
    };

    const breakdown = {
      sales: { count: 0, revenue: 0, profit: 0 },
      returns: { count: 0, amount: 0 },
      refunds: { count: 0, amount: 0 },
    };

    const productMap = new Map();
    const dailyMap = new Map();

    transactions.forEach(transaction => {
      const date = transaction.timestamp.split('T')[0];
      
      // Initialize daily entry
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, revenue: 0, profit: 0, transactions: 0 });
      }
      const dailyEntry = dailyMap.get(date);
      dailyEntry.transactions++;

      switch (transaction.type) {
        case 'SALE':
          summary.totalRevenue += transaction.amount;
          summary.totalCost += transaction.cost || 0;
          summary.totalProfit += transaction.profit || 0;
          breakdown.sales.count++;
          breakdown.sales.revenue += transaction.amount;
          breakdown.sales.profit += transaction.profit || 0;
          dailyEntry.revenue += transaction.amount;
          dailyEntry.profit += transaction.profit || 0;

          // Track products
          transaction.details.items?.forEach(item => {
            const key = item.productId;
            if (!productMap.has(key)) {
              productMap.set(key, {
                productId: item.productId,
                productName: item.productName,
                quantitySold: 0,
                revenue: 0,
                profit: 0,
              });
            }
            const product = productMap.get(key);
            product.quantitySold += item.quantity;
            product.revenue += item.total;
            product.profit += (item.unitPrice - (item.unitCost || 0)) * item.quantity;
          });
          break;

        case 'RETURN':
          breakdown.returns.count++;
          breakdown.returns.amount += transaction.amount;
          dailyEntry.revenue -= transaction.amount;
          break;

        case 'REFUND':
          breakdown.refunds.count++;
          breakdown.refunds.amount += transaction.amount;
          dailyEntry.revenue -= transaction.amount;
          break;
      }
    });

    summary.averageTransactionValue = summary.totalTransactions > 0 
      ? summary.totalRevenue / summary.totalTransactions 
      : 0;

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const dailyBreakdown = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary,
      breakdown,
      topProducts,
      dailyBreakdown,
    };
  }
}

export const transactionLogger = new TransactionLogger();
export default transactionLogger;
