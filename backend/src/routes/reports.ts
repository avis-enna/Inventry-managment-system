import express from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { transactionLogger } from '../utils/transactionLogger';

const router = express.Router();

/**
 * @swagger
 * /api/reports/transactions:
 *   get:
 *     summary: Get transaction logs (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SALE, RETURN, REFUND, STOCK_ADJUSTMENT, PURCHASE]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Transaction logs retrieved successfully
 */
router.get('/transactions', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate, type, userId, limit } = req.query;

  const filters: any = {};
  if (startDate) filters.startDate = startDate as string;
  if (endDate) filters.endDate = endDate as string;
  if (type) filters.type = type as string;
  if (userId) filters.userId = userId as string;
  if (limit) filters.limit = parseInt(limit as string);

  const transactions = await transactionLogger.getTransactions(filters);

  res.json({
    success: true,
    message: 'Transaction logs retrieved successfully',
    data: {
      transactions,
      count: transactions.length,
      filters,
    },
  });
}));

/**
 * @swagger
 * /api/reports/financial:
 *   get:
 *     summary: Get financial report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial report generated successfully
 */
router.get('/financial', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate } = req.query;

  const filters: any = {};
  if (startDate) filters.startDate = startDate as string;
  if (endDate) filters.endDate = endDate as string;

  const report = await transactionLogger.generateFinancialReport(filters);

  res.json({
    success: true,
    message: 'Financial report generated successfully',
    data: report,
  });
}));

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard summary (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 */
router.get('/dashboard', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Get today's transactions
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = await transactionLogger.getTransactions({
    startDate: today,
    endDate: today,
  });

  // Get this week's transactions
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTransactions = await transactionLogger.getTransactions({
    startDate: weekAgo.toISOString().split('T')[0],
  });

  // Get this month's transactions
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthTransactions = await transactionLogger.getTransactions({
    startDate: monthAgo.toISOString().split('T')[0],
  });

  // Calculate summaries
  const calculateSummary = (transactions: any[]) => {
    const sales = transactions.filter(t => t.type === 'SALE');
    const returns = transactions.filter(t => t.type === 'RETURN');
    
    return {
      totalRevenue: sales.reduce((sum, t) => sum + t.amount, 0),
      totalProfit: sales.reduce((sum, t) => sum + (t.profit || 0), 0),
      totalReturns: returns.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: transactions.length,
      salesCount: sales.length,
      returnsCount: returns.length,
    };
  };

  const todaySummary = calculateSummary(todayTransactions);
  const weekSummary = calculateSummary(weekTransactions);
  const monthSummary = calculateSummary(monthTransactions);

  res.json({
    success: true,
    message: 'Dashboard summary retrieved successfully',
    data: {
      today: todaySummary,
      thisWeek: weekSummary,
      thisMonth: monthSummary,
    },
  });
}));

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: Export transaction logs as CSV (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SALE, RETURN, REFUND, STOCK_ADJUSTMENT, PURCHASE]
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 */
router.get('/export', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate, type } = req.query;

  const filters: any = {};
  if (startDate) filters.startDate = startDate as string;
  if (endDate) filters.endDate = endDate as string;
  if (type) filters.type = type as string;

  const transactions = await transactionLogger.getTransactions(filters);

  // Generate CSV
  const csvHeaders = [
    'Transaction ID',
    'Timestamp',
    'Type',
    'Amount',
    'Cost',
    'Profit',
    'Reference',
    'User',
    'Role',
    'Payment Method',
    'Customer',
    'Notes',
  ];

  const csvRows = transactions.map(t => [
    t.id,
    t.timestamp,
    t.type,
    t.amount,
    t.cost || 0,
    t.profit || 0,
    t.reference,
    t.userName,
    t.userRole,
    t.details.paymentMethod || '',
    t.details.customerName || '',
    t.details.notes || '',
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const filename = `transactions_${startDate || 'all'}_${endDate || 'all'}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
}));

export default router;
